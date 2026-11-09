-- Apply AFTER schema.sql. Also safe to reapply to an existing installation.
-- Only the trusted backend service role can create an order and reserve stock.
-- Existing orders were not reserved by the old API; do not replenish them twice.
alter table public.orders add column if not exists stock_reserved boolean not null default false;
create or replace function public.place_order(
  p_user_id uuid,
  p_name text,
  p_phone text,
  p_email text,
  p_address text,
  p_note text,
  p_items jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  entry jsonb;
  product public.products%rowtype;
  quantity integer;
  order_items jsonb := '[]'::jsonb;
  order_total numeric := 0;
  order_id uuid;
  order_created_at timestamptz;
begin
  if p_user_id is null or length(trim(coalesce(p_name, ''))) < 2
     or length(trim(coalesce(p_phone, ''))) < 7
     or coalesce(p_email, '') !~ '^\S+@\S+\.\S+$'
     or length(trim(coalesce(p_address, ''))) < 5 then
    raise exception using message = 'validation', errcode = 'P0001';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' then
    raise exception using message = 'validation', errcode = 'P0001';
  end if;
  if jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 30 then
    raise exception using message = 'validation', errcode = 'P0001';
  end if;
  if exists(select 1 from jsonb_array_elements(p_items) e
      where jsonb_typeof(e) is distinct from 'object'
        or jsonb_typeof(e->'id') is distinct from 'string'
        or coalesce(e->>'id', '') = ''
        or jsonb_typeof(e->'qty') is distinct from 'number'
        or coalesce(e->>'qty', '') !~ '^([1-9]|[1-4][0-9]|50)$') then
    raise exception using message = 'items', errcode = 'P0001';
  end if;
  if (select count(distinct e->>'id') from jsonb_array_elements(p_items) e)
      <> jsonb_array_length(p_items) then
    raise exception using message = 'items', errcode = 'P0001';
  end if;

  -- Every checkout locks its requested products in the same order. This prevents
  -- overselling and avoids opposing product lock orders between concurrent calls.
  perform id from public.products
    where id in (select e->>'id' from jsonb_array_elements(p_items) e)
    order by id for update;

  for entry in select value from jsonb_array_elements(p_items) loop
    select * into product from public.products where id = entry->>'id';
    quantity := (entry->>'qty')::integer;
    if not found or product.active is distinct from true
       or product.stock is null or product.stock < quantity then
      raise exception using message = 'items', errcode = 'P0001';
    end if;
    order_items := order_items || jsonb_build_array(jsonb_build_object(
      'id', product.id, 'name', coalesce(product.name->>'en', product.id),
      'qty', quantity, 'price', product.price
    ));
    order_total := order_total + product.price * quantity;
    update public.products set stock = stock - quantity where id = product.id;
  end loop;

  insert into public.orders(user_id, name, phone, email, address, note, items, total, stock_reserved)
    values(p_user_id, trim(p_name), trim(p_phone), trim(p_email), trim(p_address),
      left(coalesce(p_note, ''), 500), order_items, order_total, true)
    returning id, created_at into order_id, order_created_at;
  -- The whole function runs in one transaction. A failed item or insert rolls
  -- back every stock update, so partial reservations cannot remain behind.
  return jsonb_build_object('id', order_id, 'items', order_items, 'total', order_total, 'created_at', order_created_at);
end;
$$;

revoke all on function public.place_order(uuid,text,text,text,text,text,jsonb) from public;
revoke all on function public.place_order(uuid,text,text,text,text,text,jsonb) from anon, authenticated;
grant execute on function public.place_order(uuid,text,text,text,text,text,jsonb) to service_role;


-- Status updates remain available through the existing admin RLS policy. Inventory
-- changes occur in the same transaction as the status change, including rollback.
create or replace function public.sync_order_stock_on_status()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  entry jsonb;
  product public.products%rowtype;
  quantity integer;
begin
  new.stock_reserved := old.stock_reserved;
  if new.status is null or new.status not in ('new', 'paid', 'canceled') then
    raise exception using message = 'validation', errcode = 'P0001';
  end if;
  if new.status is not distinct from old.status then return new; end if;

  if (new.status = 'canceled' and old.stock_reserved)
     or (new.status <> 'canceled' and not old.stock_reserved) then
    if jsonb_typeof(old.items) is distinct from 'array' then
      raise exception using message = 'items', errcode = 'P0001';
    end if;
    perform id from public.products
      where id in (select e->>'id' from jsonb_array_elements(old.items) e)
      order by id for update;
    for entry in select value from jsonb_array_elements(old.items) loop
      if coalesce(entry->>'qty', '') !~ '^([1-9]|[1-4][0-9]|50)$' then
        raise exception using message = 'items', errcode = 'P0001';
      end if;
      quantity := (entry->>'qty')::integer;
      if new.status = 'canceled' then
        update public.products set stock = stock + quantity where id = entry->>'id';
      else
        select * into product from public.products where id = entry->>'id';
        if not found or product.active is distinct from true or product.stock is null or product.stock < quantity then
          raise exception using message = 'items', errcode = 'P0001';
        end if;
        update public.products set stock = stock - quantity where id = product.id;
      end if;
    end loop;
    new.stock_reserved := new.status <> 'canceled';
  end if;
  return new;
end;
$$;
revoke all on function public.sync_order_stock_on_status() from public;
drop trigger if exists sync_order_stock_on_status on public.orders;
create trigger sync_order_stock_on_status before update of status on public.orders
for each row execute function public.sync_order_stock_on_status();

-- Idempotent browser retries: same user/request returns the committed order.
-- The original function remains for older integrations; new checkout uses this RPC.
alter table public.orders add column if not exists request_id uuid;
create unique index if not exists orders_user_request_unique on public.orders(user_id, request_id);
create or replace function public.place_order_once(
  p_user_id uuid, p_name text, p_phone text, p_email text,
  p_address text, p_note text, p_items jsonb, p_request_id uuid
) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare saved public.orders%rowtype; result jsonb;
begin
  if p_user_id is null or p_request_id is null then
    raise exception using message='validation', errcode='P0001';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || p_request_id::text, 0));
  select * into saved from public.orders where user_id=p_user_id and request_id=p_request_id;
  if found then
    if saved.name is distinct from p_name or saved.phone is distinct from p_phone
      or saved.email is distinct from p_email or saved.address is distinct from p_address
      or saved.note is distinct from p_note
      or (select jsonb_agg(jsonb_build_object('id',e->>'id','qty',(e->>'qty')::int) order by e->>'id') from jsonb_array_elements(saved.items) e)
         is distinct from (select jsonb_agg(e order by e->>'id') from jsonb_array_elements(p_items) e) then
      raise exception using message='request_conflict', errcode='P0001';
    end if;
    return jsonb_build_object('id',saved.id,'items',saved.items,'total',saved.total,'created_at',saved.created_at,'notified',saved.notified,'replayed',true);
  end if;
  result := public.place_order(p_user_id,p_name,p_phone,p_email,p_address,p_note,p_items);
  update public.orders set request_id=p_request_id where id=(result->>'id')::uuid returning * into saved;
  return result || jsonb_build_object('created_at',saved.created_at,'replayed',false);
end; $$;
revoke all on function public.place_order_once(uuid,text,text,text,text,text,jsonb,uuid) from public, anon, authenticated;
grant execute on function public.place_order_once(uuid,text,text,text,text,text,jsonb,uuid) to service_role;
