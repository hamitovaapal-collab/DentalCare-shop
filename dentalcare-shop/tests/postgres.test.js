import { test, before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
// Real PostgreSQL, separate connections, isolated disposable container with NO
// network or published ports. Never points at an existing database or checkout.
const name=`dentalcare-verify-${process.pid}`;
const dockerEnv={...process.env};for(const key of ['DOCKER_HOST','DOCKER_CONTEXT','DOCKER_TLS','DOCKER_TLS_VERIFY','DOCKER_CERT_PATH'])delete dockerEnv[key];
const customer='00000000-0000-0000-0000-000000000001', administrator='00000000-0000-0000-0000-000000000002';
let started=false;
function docker(args,input='') {return new Promise((resolve,reject)=>{const p=spawn('docker',['--host=unix:///var/run/docker.sock',...args],{env:dockerEnv,stdio:['pipe','pipe','pipe']});let out='',err='';p.stdout.on('data',d=>out+=d);p.stderr.on('data',d=>err+=d);p.on('error',reject);p.on('close',code=>code===0?resolve(out.trim()):reject(new Error(err.trim()||`Docker exit ${code}`)));p.stdin.end(input);});}
const sql=source=>docker(['exec','-i',name,'psql','-X','-q','-A','-t','-v','ON_ERROR_STOP=1','-U','postgres','-d','postgres'],source);
const quote=value=>`'${String(value).replaceAll("'","''")}'`;
const place=(items,user=customer)=>`public.place_order('${user}','Test Customer','+996500000000','test@example.com','Test address','',${quote(JSON.stringify(items))}::jsonb)`;
const asUser=(id,query)=>`begin; set local role authenticated; set local "request.jwt.claim.sub"='${id}'; ${query}; commit;`;
before(async()=>{
 await docker(['run','--rm','--detach','--name',name,'--network','none','-e','POSTGRES_HOST_AUTH_METHOD=trust',process.env.DENTAL_TEST_POSTGRES_IMAGE||'postgres:17-alpine']);started=true;
 let ready=false;for(let i=0;i<60;i++){try{await docker(['exec',name,'pg_isready','-U','postgres']);ready=true;break;}catch{await new Promise(r=>setTimeout(r,200));}}assert.ok(ready,'test database did not become ready');
 await sql(`create role anon nologin;create role authenticated nologin;create role service_role nologin bypassrls;
 create schema auth;create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}'::jsonb);
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth,public to anon,authenticated,service_role;`);
 await sql(await readFile(new URL('../supabase/schema.sql',import.meta.url),'utf8'));
 await sql(await readFile(new URL('../supabase/checkout.sql',import.meta.url),'utf8'));
 await sql(`grant select,insert,update,delete on all tables in schema public to anon,authenticated,service_role;
 insert into auth.users(id,email,raw_user_meta_data) values('${customer}','customer@example.com','{"full_name":"Test Customer"}'),('${administrator}','admin@example.com','{"full_name":"Test Admin"}');update profiles set role='admin' where id='${administrator}';`);
 await sql(await readFile(new URL('../supabase/telegram.sql',import.meta.url),'utf8'));
});
after(async()=>{if(started)await docker(['stop','--time','3',name]);});
beforeEach(async()=>{await sql('delete from orders; delete from reviews; update products set stock=25,active=true;');});
test('full schema can be reapplied without overwriting catalog or profiles',async()=>{await sql("update products set stock=17 where id='p1'");await sql(await readFile(new URL('../supabase/schema.sql',import.meta.url),'utf8'));assert.equal(await sql("select stock from products where id='p1'"),'17');assert.equal(await sql('select count(*) from products'),'8');assert.equal(await sql('select count(*) from profiles'),'2');});
test('registration database trigger creates a profile with the submitted name',async()=>{assert.equal(await sql(`select full_name from profiles where id='${customer}'`),'Test Customer');});
test('customer cannot promote their role or read another profile',async()=>{await assert.rejects(sql(asUser(customer,`update profiles set role='admin' where id='${customer}'`)),/row-level security/);assert.equal(await sql(asUser(customer,`select count(*) from profiles where id='${administrator}'`)),'0');assert.equal(await sql(asUser(customer,'select is_admin()')),'f');assert.equal(await sql(asUser(administrator,'select is_admin()')),'t');});
test('catalog RLS hides inactive items and blocks non-admin edits',async()=>{await sql("update products set active=false where id='p1'");assert.equal(await sql('begin;set local role anon;select count(*) from products;commit;'),'7');assert.equal(await sql(asUser(administrator,'select count(*) from products')),'8');await sql(asUser(customer,"update products set price=1 where id='p2'"));assert.equal(await sql("select price from products where id='p2'"),'3900');});
test('browser roles cannot create orders or call the service-only checkout function',async()=>{await assert.rejects(sql(asUser(customer,`select ${place([{id:'p1',qty:1}])}`)),/permission denied/);await assert.rejects(sql(asUser(customer,`insert into orders(user_id,items,total) values('${customer}','[]',1)`)),/row-level security/);});
test('review inserts must belong to the authenticated user',async()=>{await sql(asUser(customer,`insert into reviews(user_id,author,rating,comment) values('${customer}','Test Customer',5,'Test review')`));await assert.rejects(sql(asUser(customer,`insert into reviews(user_id,author,rating,comment) values('${administrator}','Other user',5,'Test review')`)),/row-level security/);assert.equal(await sql('select count(*) from reviews'),'1');});
test('real checkout uses stored prices and cancellation/reopening keeps stock correct',async()=>{const result=JSON.parse(await sql(`set role service_role; select ${place([{id:'p1',qty:2,price:1}])}`));assert.equal(result.total,4800);assert.equal(await sql("select stock from products where id='p1'"),'23');await sql(asUser(administrator,`update orders set status='canceled' where id='${result.id}'`));assert.equal(await sql("select stock from products where id='p1'"),'25');await sql(asUser(administrator,`update orders set status='canceled' where id='${result.id}'`));assert.equal(await sql("select stock from products where id='p1'"),'25');await sql(asUser(administrator,`update orders set status='paid' where id='${result.id}'`));assert.equal(await sql("select stock from products where id='p1'"),'23');assert.equal(await sql(asUser(customer,'select count(*) from orders')),'1');});
test('separate simultaneous connections cannot both buy the last units',async()=>{
 const a=sql(`set application_name='dental-final-a';begin;select ${place([{id:'p8',qty:25}])};select pg_sleep(1);commit;`);
 await new Promise(r=>setTimeout(r,100));const b=sql(`set application_name='dental-final-b';set lock_timeout='4s';select ${place([{id:'p8',qty:25}])};`);
 // Observe an actual blocked PostgreSQL connection rather than a JS promise queue.
 let blocked=false;for(let i=0;i<8;i++){if(Number(await sql("select count(*) from pg_stat_activity where application_name in ('dental-final-a','dental-final-b') and wait_event_type='Lock'"))>0){blocked=true;break;}await new Promise(r=>setTimeout(r,50));}
 const results=await Promise.allSettled([a,b]);assert.ok(blocked,'expected a real row-lock wait');assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected').length,1);assert.equal(await sql("select stock from products where id='p8'"),'0');assert.equal(await sql('select count(*) from orders'),'1');
});
test('opposite item ordering does not deadlock separate checkout connections',async()=>{const a=sql(`begin;select ${place([{id:'p1',qty:1},{id:'p2',qty:1}])};select pg_sleep(0.4);commit;`);await new Promise(r=>setTimeout(r,50));const b=sql(`set lock_timeout='4s';select ${place([{id:'p2',qty:1},{id:'p1',qty:1}])};`);await Promise.all([a,b]);assert.equal(await sql("select stock from products where id='p1'"),'23');assert.equal(await sql("select stock from products where id='p2'"),'23');});

const placeOnce=(key)=>`public.place_order_once('${customer}','Test Customer','+996500000000','test@example.com','Test address','', '[{"id":"p1","qty":2}]'::jsonb,'${key}')`;
test('separate concurrent retries create one order and one stock reservation',async()=>{const key='10000000-0000-0000-0000-000000000001';const first=sql(`begin;select ${placeOnce(key)};select pg_sleep(0.4);commit;`);await new Promise(r=>setTimeout(r,50));const second=sql(`set lock_timeout='4s';select ${placeOnce(key)};`);const [a,b]=await Promise.all([first,second]);assert.equal(JSON.parse(a.split('\n')[0]).id,JSON.parse(b).id);assert.equal(JSON.parse(b).replayed,true);assert.equal(await sql('select count(*) from orders'),'1');assert.equal(await sql("select stock from products where id='p1'"),'23');});
test('browser roles cannot call idempotent RPC or access Telegram update ledger',async()=>{await assert.rejects(sql(asUser(customer,`select ${placeOnce('10000000-0000-0000-0000-000000000001')}`)),/permission denied/);await assert.rejects(sql(asUser(administrator,'select * from telegram_updates')),/permission denied/);await sql('set role service_role;insert into telegram_updates(update_id) values (1)');await sql(await readFile(new URL('../supabase/telegram.sql',import.meta.url),'utf8'));assert.equal(await sql('set role service_role;select count(*) from telegram_updates'),'1');});
