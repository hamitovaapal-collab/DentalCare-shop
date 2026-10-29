-- DentalCare shop: run this whole file in Supabase > SQL Editor
create table if not exists public.profiles(id uuid primary key references auth.users on delete cascade, full_name text, phone text, role text not null default 'user' check (role in ('user','admin')), created_at timestamptz default now());
create table if not exists public.products(id text primary key default gen_random_uuid()::text, category text default 'care', price numeric not null check (price>=0), image text, stock int default 0, active boolean default true, name jsonb not null, description jsonb, created_at timestamptz default now());
create table if not exists public.orders(id uuid primary key default gen_random_uuid(), user_id uuid references auth.users, name text, phone text, email text, address text, note text, items jsonb not null, total numeric not null, status text default 'new', notified jsonb, created_at timestamptz default now());
create table if not exists public.bookings(id uuid primary key default gen_random_uuid(), user_id uuid references auth.users, name text, phone text, email text, service text, date date, time text, message text, status text default 'new', notified jsonb, created_at timestamptz default now());
create table if not exists public.reviews(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, product_id text, author text, rating int not null check (rating between 1 and 5), comment text not null check (length(comment)>=5), created_at timestamptz default now());

create or replace function public.is_admin() returns boolean language sql security definer set search_path=public stable as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin') $$;
create or replace function public.my_role() returns text language sql security definer set search_path=public stable as $$ select role from public.profiles where id=auth.uid() $$;
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.profiles(id,full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name','')); return new; end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security; alter table public.products enable row level security; alter table public.orders enable row level security; alter table public.bookings enable row level security; alter table public.reviews enable row level security;

-- profiles: users read/update themselves but can NEVER change their own role
create policy "profiles read" on public.profiles for select using (id=auth.uid() or public.is_admin());
create policy "profiles update own" on public.profiles for update using (id=auth.uid()) with check (id=auth.uid() and role=public.my_role());
create policy "profiles admin update" on public.profiles for update using (public.is_admin());
-- products: public read of active items, admin full control
create policy "products read" on public.products for select using (active or public.is_admin());
create policy "products admin" on public.products for all using (public.is_admin()) with check (public.is_admin());
-- orders / bookings: created ONLY by the backend (service role). Users read their own, admins read/update all.
create policy "orders read" on public.orders for select using (user_id=auth.uid() or public.is_admin());
create policy "orders admin update" on public.orders for update using (public.is_admin());
create policy "bookings read" on public.bookings for select using (user_id=auth.uid() or public.is_admin());
create policy "bookings admin update" on public.bookings for update using (public.is_admin());
-- reviews: everyone reads, logged-in users insert their own, owner/admin delete
create policy "reviews read" on public.reviews for select using (true);
create policy "reviews insert" on public.reviews for insert with check (auth.uid()=user_id);
create policy "reviews delete" on public.reviews for delete using (user_id=auth.uid() or public.is_admin());

insert into public.products(id,category,price,image,stock,name,description) values
('p1','whitening',2400,'s4',25,'{"en": "Home Whitening Kit", "ru": "Набор для домашнего отбеливания", "ky": "Үйдө актоо топтому"}'::jsonb,'{"en": "Professional-grade gel and LED tray for a brighter smile at home.", "ru": "Профессиональный гель и LED-капа для яркой улыбки дома.", "ky": "Үйдө жарык жылмаюу үчүн профессионалдык гель жана LED капа."}'::jsonb),
('p2','care',3900,'b4',25,'{"en": "Sonic Electric Toothbrush", "ru": "Звуковая электрощётка", "ky": "Үн электр щётка"}'::jsonb,'{"en": "Five cleaning modes, 30-day battery and a pressure sensor.", "ru": "Пять режимов чистки, 30 дней работы и датчик давления.", "ky": "Беш тазалоо режими, 30 күн иштейт, басым датчиги."}'::jsonb),
('p3','whitening',380,'s6',25,'{"en": "Whitening Toothpaste", "ru": "Отбеливающая зубная паста", "ky": "Актоочу тиш пастасы"}'::jsonb,'{"en": "Fluoride paste that gently removes surface stains.", "ru": "Фторсодержащая паста мягко удаляет налёт.", "ky": "Фторлуу паста тактарды акырын тазалайт."}'::jsonb),
('p4','care',3200,'b1',25,'{"en": "Water Flosser", "ru": "Ирригатор", "ky": "Ирригатор"}'::jsonb,'{"en": "Cordless irrigator that cleans between teeth and along the gumline.", "ru": "Беспроводной ирригатор для очистки между зубами и вдоль дёсен.", "ky": "Тиш арасын жана бекирди тазалоочу зымсыз ирригатор."}'::jsonb),
('p5','care',1800,'s5',25,'{"en": "Night Guard Set", "ru": "Капа для ночи", "ky": "Түнкү капа"}'::jsonb,'{"en": "Custom-fit guard that protects teeth from grinding.", "ru": "Капа для защиты зубов от бруксизма.", "ky": "Тиш кычыраганынан коргоочу капа."}'::jsonb),
('p6','care',450,'b3',25,'{"en": "Alcohol-free Mouthwash", "ru": "Ополаскиватель без спирта", "ky": "Спирттизсиз ополаскыч"}'::jsonb,'{"en": "Fresh breath and daily protection without irritation.", "ru": "Свежее дыхание и ежедневная защита без раздражения.", "ky": "Тазы дем жана күнүмдүк коргоо."}'::jsonb),
('p7','care',260,'b2',25,'{"en": "Dental Floss Set", "ru": "Набор зубных нитей", "ky": "Тиш жиптери топтому"}'::jsonb,'{"en": "Three waxed flosses for everyday interdental cleaning.", "ru": "Три вощёные нити для ежедневной чистки.", "ky": "Күнүмдүк тазалоо үчүн үч жип."}'::jsonb),
('p8','kids',690,'s1',25,'{"en": "Kids Brush Set", "ru": "Детский набор щёток", "ky": "Балдар щёткалары"}'::jsonb,'{"en": "Soft brushes and a timer to make brushing fun.", "ru": "Мягкие щётки и таймер, чтобы чистка была весёлой.", "ky": "Жумшак щёткалар жана таймер."}'::jsonb)
on conflict (id) do nothing;

-- To make yourself admin (the ONLY way; do this in the SQL editor after you register):
-- update public.profiles set role='admin' where id=(select id from auth.users where email='YOUR_EMAIL');
