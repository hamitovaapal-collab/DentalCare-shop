import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
// An isolated PostgreSQL engine. No production database or credentials are used.
let db;
const user = '00000000-0000-0000-0000-000000000001';
before(async()=>{
 db=new PGlite();
 await db.exec(`create role anon; create role authenticated; create role service_role;
 create table public.users(id uuid primary key);
 create table public.products(id text primary key,category text,price numeric not null check(price>=0),image text,stock int,active boolean,name jsonb,description jsonb,created_at timestamptz default now());
 create table public.orders(id uuid primary key default gen_random_uuid(), user_id uuid references public.users, name text,phone text,email text,address text,note text,items jsonb,total numeric,status text default 'new',notified jsonb,created_at timestamptz default now());
 insert into public.users values('${user}');`);
 await db.exec(await readFile(new URL('../supabase/checkout.sql',import.meta.url),'utf8'));
});
after(async()=>db?.close());
beforeEach(async()=>{await db.exec(`truncate public.orders,public.products; insert into public.products(id,price,stock,active,name) values ('p1',123.45,3,true,'{"en":"Test product"}'),('p2',200,1,true,'{"en":"Another product"}');`);});
const order=async(items,userId=user)=>{
 const r=await db.query('select public.place_order($1::uuid,$2,$3,$4,$5,$6,$7::jsonb) as result',[userId,'Test Customer','+996500000000','test@example.com','Test address','Test note',JSON.stringify(items)]);return r.rows[0].result;
};
const snapshot=async()=>({products:(await db.query('select id,stock from products order by id')).rows,orders:(await db.query('select * from orders')).rows});
test('checkout computes authoritative prices, stores order and decrements stock',async()=>{
 const result=await order([{id:'p1',qty:2,price:1},{id:'p2',qty:1}]);assert.equal(result.total,446.9);assert.equal(result.items[0].price,123.45);const s=await snapshot();assert.equal(s.orders.length,1);assert.deepEqual(s.products,[{id:'p1',stock:1},{id:'p2',stock:0}]);
});
test('an unavailable later item rolls back earlier stock changes',async()=>{await assert.rejects(order([{id:'p1',qty:2},{id:'p2',qty:2}]),/items/);const s=await snapshot();assert.equal(s.orders.length,0);assert.deepEqual(s.products,[{id:'p1',stock:3},{id:'p2',stock:1}]);});
test('failed order insert rolls back stock reservation',async()=>{await assert.rejects(order([{id:'p1',qty:1}],'00000000-0000-0000-0000-000000000099'));assert.equal((await snapshot()).products[0].stock,3);});
test('last available unit can be ordered only once across queued checkouts',async()=>{const results=await Promise.allSettled([order([{id:'p2',qty:1}]),order([{id:'p2',qty:1}])]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected').length,1);assert.equal((await snapshot()).orders.length,1);});
test('duplicate, malformed, fractional and missing products cannot reserve stock',async()=>{for(const items of [[{id:'p1',qty:1},{id:'p1',qty:1}],[{id:'p1',qty:1.5}],[{id:'p1',qty:0}],[{id:'missing',qty:1}],[null],[],{},[{id:'p1',qty:'1'}]])await assert.rejects(order(items));assert.equal((await snapshot()).orders.length,0);assert.equal((await snapshot()).products[0].stock,3);});
test('inactive products cannot be ordered',async()=>{await db.exec("update products set active=false where id='p1'");await assert.rejects(order([{id:'p1',qty:1}]),/items/);assert.equal((await snapshot()).orders.length,0);});
test('anonymous and authenticated clients have no execute permission',async()=>{const r=await db.query("select has_function_privilege('anon','public.place_order(uuid,text,text,text,text,text,jsonb)','execute') as anon,has_function_privilege('authenticated','public.place_order(uuid,text,text,text,text,text,jsonb)','execute') as authenticated,has_function_privilege('service_role','public.place_order(uuid,text,text,text,text,text,jsonb)','execute') as backend");assert.deepEqual(r.rows[0],{anon:false,authenticated:false,backend:true});});
test('cancel restores reserved stock exactly once and reopening reserves it again',async()=>{
 const result=await order([{id:'p1',qty:2}]);await db.query("update orders set status='canceled' where id=$1",[result.id]);assert.equal((await snapshot()).products[0].stock,3);
 await db.query("update orders set status='canceled' where id=$1",[result.id]);assert.equal((await snapshot()).products[0].stock,3);
 await db.query("update orders set status='paid' where id=$1",[result.id]);assert.equal((await snapshot()).products[0].stock,1);assert.equal((await snapshot()).orders[0].stock_reserved,true);
});
test('reopening a canceled order fails atomically when stock is no longer available',async()=>{
 const result=await order([{id:'p1',qty:2},{id:'p2',qty:1}]);await db.query("update orders set status='canceled' where id=$1",[result.id]);await db.exec("update products set stock=0 where id='p2'");await assert.rejects(db.query("update orders set status='paid' where id=$1",[result.id]),/items/);const s=await snapshot();assert.equal(s.products[0].stock,3);assert.equal(s.orders[0].status,'canceled');assert.equal(s.orders[0].stock_reserved,false);
});
test('canceling legacy unreserved orders does not artificially increase inventory',async()=>{
 await db.query("insert into orders(user_id,name,items,total) values($1,'Legacy order',$2::jsonb,123)",[user,JSON.stringify([{id:'p1',qty:1,price:123}])]);await db.exec("update orders set status='canceled'");assert.equal((await snapshot()).products[0].stock,3);
});
test('migration can be reapplied without changing existing orders or inventory',async()=>{await order([{id:'p1',qty:1}]);const before=await snapshot();await db.exec(await readFile(new URL('../supabase/checkout.sql',import.meta.url),'utf8'));assert.deepEqual(await snapshot(),before);});
const once=async(key,quantity=1)=>{const r=await db.query('select public.place_order_once($1::uuid,$2,$3,$4,$5,$6,$7::jsonb,$8::uuid) as result',[user,'Test Customer','+996500000000','test@example.com','Test address','Test note',JSON.stringify([{id:'p1',qty:quantity}]),key]);return r.rows[0].result;};
test('same request returns same order without reserving stock twice',async()=>{const key='10000000-0000-0000-0000-000000000001';const a=await once(key),b=await once(key);assert.equal(a.id,b.id);assert.equal(b.replayed,true);assert.equal((await snapshot()).orders.length,1);assert.equal((await snapshot()).products[0].stock,2);assert.ok(b.created_at);});
test('reusing a request key with changed content fails without another order',async()=>{const key='10000000-0000-0000-0000-000000000001';await once(key);await assert.rejects(once(key,2),/request_conflict/);assert.equal((await snapshot()).orders.length,1);assert.equal((await snapshot()).products[0].stock,2);});
test('new request id allows intentional next purchase',async()=>{await once('10000000-0000-0000-0000-000000000001');await once('10000000-0000-0000-0000-000000000002');assert.equal((await snapshot()).orders.length,2);assert.equal((await snapshot()).products[0].stock,1);});
