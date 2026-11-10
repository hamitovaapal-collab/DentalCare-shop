import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import order from '../api/order.js';
import booking from '../api/booking.js';
import { telegram, email, userFrom } from '../api/_lib.js';
const originalFetch = globalThis.fetch;
const names=['SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','TELEGRAM_BOT_TOKEN','TELEGRAM_CHAT_ID','RESEND_API_KEY','ADMIN_EMAIL','FROM_EMAIL'];
let saved;
beforeEach(()=>{saved=Object.fromEntries(names.map(k=>[k,process.env[k]])); for(const k of names)delete process.env[k];});
afterEach(()=>{globalThis.fetch=originalFetch;for(const k of names){if(saved[k]===undefined)delete process.env[k];else process.env[k]=saved[k];}});
const call=async(handler,body={},authorization='')=>{let status=200,result;await handler({method:'POST',body,headers:{authorization}},{status(n){status=n;return this},json(data){result=data;return this}});return {status,result};};
const validBooking={name:'Test Patient',phone:'+996500000000',email:'test@example.com',service:'Consultation',date:'2099-01-05',time:'10:00'};
const validOrder={name:'Test Customer',phone:'+996500000000',email:'test@example.com',address:'Test address',items:[{id:'p1',qty:2}]};
// All remote calls are replaced in-memory. No live database or notification is used.
function backend(){process.env.SUPABASE_URL='https://test.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='test-only';const calls=[];globalThis.fetch=async(input,options={})=>{const url=String(input);calls.push({url,options});let data,status=200;
 if(url.includes('/auth/v1/user'))data={id:'test-user'};
 else if(url.includes('/rpc/place_order')){const b=JSON.parse(options.body);if(b.p_items.some(i=>i.id!=='p1'||i.qty>3)){data={code:'P0001',message:'items'};status=400;}else data={id:'test-order-id',items:b.p_items.map(i=>({...i,name:'Test product',price:123})),total:b.p_items.reduce((sum,i)=>sum+i.qty*123,0)};}
 else if(options.method==='POST')data={id:'test-order-id'};else data=[];
 return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});};return calls;}

test('anonymous orders require authentication',async()=>{assert.equal((await call(order)).status,401);});
test('authorization must use Bearer scheme',async()=>{backend();assert.equal(await userFrom({headers:{authorization:'Basic abc'}}),null);});
test('booking validation and missing service configuration are distinct',async()=>{assert.equal((await call(booking)).status,400);assert.deepEqual(await call(booking,validBooking),{status:503,result:{error:'not_configured'}});});
test('booking rejects impossible dates and non-working slots',async()=>{for(const value of [{date:'2099-02-30'},{time:'99:99'},{time:'08:00'},{time:'10:30'},{time:'10:00invalid'},{date:'2099-01-04'}])assert.equal((await call(booking,{...validBooking,...value})).status,400);});
test('server calculates totals using database prices',async()=>{const calls=backend();const r=await call(order,{...validOrder,total:1},'Bearer test');assert.equal(r.status,200);assert.equal(r.result.total,246);const rpc=calls.find(c=>c.url.includes('/rpc/place_order'));const body=JSON.parse(rpc.options.body);assert.equal(body.p_user_id,'test-user');assert.equal(body.total,undefined);assert.deepEqual(body.p_items,[{id:'p1',qty:2}]);assert.equal(r.result.items[0].price,123);assert.equal(r.result.notify.telegram.sent,false);});
test('orders reject duplicate, fractional, unavailable and malformed items',async()=>{for(const items of [[{id:'p1',qty:1},{id:'p1',qty:1}],[{id:'p1',qty:1.5}],[{id:'p1',qty:4}],[{id:'p1',qty:0}],[{id:'missing',qty:1}],[null]]){backend();assert.equal((await call(order,{...validOrder,items},'Bearer test')).status,400);}});
test('valid booking is saved and reports unconfigured notifications',async()=>{backend();const r=await call(booking,validBooking);assert.equal(r.status,200);assert.equal(r.result.ok,true);assert.deepEqual(r.result.notify.telegram,{sent:false,reason:'not_configured'});});
test('Telegram does not send when credentials are missing',async()=>{globalThis.fetch=()=>{throw new Error('must not call remote')};assert.deepEqual(await telegram('test'),{sent:false,reason:'not_configured'});});
test('Telegram reports confirmed delivery, API refusal and network errors',async()=>{process.env.TELEGRAM_BOT_TOKEN='test-only';process.env.TELEGRAM_CHAT_ID='test-only';globalThis.fetch=async()=>new Response('{"ok":true}',{status:200});assert.deepEqual(await telegram('test'),{sent:true});globalThis.fetch=async()=>new Response('{"ok":false,"description":"Forbidden"}',{status:403});assert.deepEqual(await telegram('test'),{sent:false,reason:'forbidden'});globalThis.fetch=async()=>{throw new Error('offline')};assert.deepEqual(await telegram('test'),{sent:false,reason:'network_error'});});
test('email does not send when configuration is missing',async()=>{assert.deepEqual(await email('test','test'),{sent:false,reason:'not_configured'});});
import { productImage, isIllustration } from '../src/lib/productImages.js';
test('image paths accept real filenames without duplicating extensions',()=>{assert.equal(productImage({image:'s4'}),'/images/s4.jpg');assert.equal(productImage({image:'photo.webp'}),'/images/photo.webp');assert.equal(productImage({image:'https://example.com/photo.png'}),'https://example.com/photo.png');assert.equal(productImage({image:''}),null);assert.equal(productImage({image:'../private'}),null);});
test('bundled illustrations are identified without relabeling external product photographs',()=>{assert.equal(isIllustration({image:'s4'}),true);assert.equal(isIllustration({image:'https://example.com/product.jpg'}),false);});
test('missing checkout migration returns a clear unavailable response',async()=>{backend();const mocked=globalThis.fetch;globalThis.fetch=async(input,options)=>String(input).includes('/rpc/place_order')?new Response(JSON.stringify({code:'PGRST202',message:'function missing'}),{status:404,headers:{'Content-Type':'application/json'}}):mocked(input,options);assert.deepEqual(await call(order,validOrder,'Bearer test'),{status:503,result:{error:'not_configured'}});});
test('notification metadata failure does not report a committed order as failed',async t=>{const calls=backend();const mocked=globalThis.fetch;t.mock.method(console,'warn',()=>{});globalThis.fetch=async(input,options)=>options?.method==='PATCH'?Promise.reject(new Error('metadata offline')):mocked(input,options);const result=await call(order,validOrder,'Bearer test');assert.equal(result.status,200);assert.equal(result.result.ok,true);assert.equal(calls.filter(c=>c.url.includes('/rpc/place_order')).length,1);});
import { supabaseSettings } from '../src/lib/config.js';
test('invalid or example Supabase configuration is rejected without crashing',()=>{for(const [url,key] of [['not-a-url','test'],['https://YOUR-PROJECT.supabase.co','your-anon-public-key'],['https://test.invalid',''],['javascript:alert(1)','test']])assert.equal(supabaseSettings(url,key),null);assert.deepEqual(supabaseSettings(' https://test.invalid/ ',' test-only '),{url:'https://test.invalid',key:'test-only'});});
test('an authenticated request with missing server config reports 503, not a false auth failure',async()=>{assert.deepEqual(await call(order,validOrder,'Bearer test'),{status:503,result:{error:'not_configured'}});});
test('booking metadata failure does not report a saved booking as failed',async t=>{backend();const mocked=globalThis.fetch;t.mock.method(console,'warn',()=>{});globalThis.fetch=async(input,options)=>options?.method==='PATCH'?Promise.reject(new Error('metadata offline')):mocked(input,options);const r=await call(booking,validBooking);assert.equal(r.status,200);assert.equal(r.result.ok,true);});
test('email reports accepted requests, refusal and network failure',async()=>{process.env.RESEND_API_KEY='test-only';process.env.ADMIN_EMAIL='test@example.com';process.env.FROM_EMAIL='test@example.com';globalThis.fetch=async()=>new Response('{"id":"test-email"}',{status:200});assert.deepEqual(await email('Test','test'),{sent:true});globalThis.fetch=async()=>new Response('{}',{status:403});assert.deepEqual(await email('Test','test'),{sent:false,reason:'resend_403'});globalThis.fetch=async()=>{throw new Error('offline')};assert.deepEqual(await email('Test','test'),{sent:false,reason:'network_error'});});
import { internalRedirect } from '../src/lib/navigation.js';
test('post-login redirects remain within the application',()=>{for(const value of ['https://example.com','//example.com','/\\example.com','/\nexample.com'])assert.equal(internalRedirect(value),'/profile');assert.equal(internalRedirect('/checkout?from=login'),'/checkout?from=login');});
import { post } from '../src/lib/api.js';
test('client requests time out instead of leaving submit buttons pending forever',async t=>{t.mock.timers.enable({apis:['setTimeout']});globalThis.fetch=async(_url,options)=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError'))));const pending=assert.rejects(post('/api/order',{}),/timeout/);t.mock.timers.tick(30001);await pending;});
test('client distinguishes validation failures, unavailable responses and network errors',async()=>{globalThis.fetch=async()=>new Response('{"error":"validation"}',{status:400});await assert.rejects(post('/api/booking',{}),/validation/);globalThis.fetch=async()=>new Response('<html>missing</html>',{status:404});await assert.rejects(post('/api/order',{}),/net/);globalThis.fetch=async()=>{throw new TypeError('network')};await assert.rejects(post('/api/order',{}),/net/);});
test('booking and checkout reject formatted strings without enough phone digits before writing',async()=>{
 for(const phone of ['-------','()()()()','+12 (34)-56','+1234567890123456']){
  let calls=backend();assert.equal((await call(booking,{...validBooking,phone})).status,400);assert.equal(calls.filter(c=>c.options.method==='POST').length,0);
  calls=backend();assert.equal((await call(order,{...validOrder,phone},'Bearer test')).status,400);assert.equal(calls.filter(c=>c.url.includes('/rpc/')).length,0);
 }
});
test('both forms accept the original Kyrgyz contact format',async()=>{
 backend();assert.equal((await call(booking,{...validBooking,phone:'+996 (502) 820-642'})).status,200);
 backend();assert.equal((await call(order,{...validOrder,phone:'+996 (502) 820-642'},'Bearer test')).status,200);
});

test('request id must be a string UUID, never a coercible array or object',async()=>{const id='10000000-0000-0000-0000-000000000001';for(const request_id of [[id],{value:id},null,123,'not-a-uuid']){const calls=backend();assert.equal((await call(order,{...validOrder,request_id},'Bearer test')).status,400);assert.equal(calls.filter(c=>c.url.includes('/rpc/')).length,0);}});
