import { createClient } from '@supabase/supabase-js';
import { supabaseSettings } from '../src/lib/config.js';
// Read-only diagnostics. Never registers users, changes stock or sends messages.
const report={supabase:{},telegram:{},email:{}};
const missing=names=>names.filter(name=>!process.env[name]?.trim());
const client=(url,key)=>createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(input,options)=>fetch(input,{...options,signal:AbortSignal.timeout(10000)})}});
let blocked=false;
for(const [label,urlName,keyName] of [['public','VITE_SUPABASE_URL','VITE_SUPABASE_ANON_KEY'],['server','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY']]){
 const absent=missing([urlName,keyName]);const config=supabaseSettings(process.env[urlName],process.env[keyName]);
 if(absent.length||!config){report.supabase[label]={status:absent.length?'missing':'invalid',missing:absent};blocked=true;continue;}
 try{const c=client(config.url,config.key);const targets=label==='public'?[['products','id']]:[['products','id,price,stock,active'],['profiles','id,role'],['orders','id,total,status,stock_reserved,request_id'],['telegram_updates','update_id'],['bookings','id,date,time'],['reviews','id,rating']];report.supabase[label]={status:'checked',tables:await Promise.all(targets.map(async([table,columns])=>{const {error,status}=await c.from(table).select(columns).limit(0);if(error)blocked=true;return {table,status:error?'failed':'accessible',http:status,code:error?.code||undefined};}))};}catch{report.supabase[label]={status:'connection_failed'};blocked=true;}
}
const tgMissing=missing(['TELEGRAM_BOT_TOKEN','TELEGRAM_CHAT_ID']);
if(tgMissing.length){report.telegram={status:'missing',missing:tgMissing};blocked=true;}else{
 try{const base=`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;const me=await fetch(base+'/getMe',{signal:AbortSignal.timeout(10000)});const identity=await me.json();if(!me.ok||!identity.ok)throw new Error();const chat=await fetch(base+'/getChat?chat_id='+encodeURIComponent(process.env.TELEGRAM_CHAT_ID),{signal:AbortSignal.timeout(10000)});const access=await chat.json();report.telegram={status:chat.ok&&access.ok?'bot_and_chat_accessible':'chat_unavailable',messages_sent:false};if(!chat.ok||!access.ok)blocked=true;const webhook=await fetch(base+'/getWebhookInfo',{signal:AbortSignal.timeout(10000)});const hook=await webhook.json();report.telegram.webhook={configured:Boolean(hook.result?.url),pending_updates:hook.result?.pending_update_count||0,delivery_error_present:Boolean(hook.result?.last_error_date),checked:webhook.ok&&hook.ok};if(!webhook.ok||!hook.ok)blocked=true;}catch{report.telegram={status:'connection_or_auth_failed',messages_sent:false};blocked=true;}
}
const hookMissing=missing(['TELEGRAM_WEBHOOK_SECRET','SITE_URL']);report.telegram.incoming={status:hookMissing.length?'missing':'configured_not_live_verified',missing:hookMissing};if(hookMissing.length)blocked=true;
const mailMissing=missing(['RESEND_API_KEY','ADMIN_EMAIL','FROM_EMAIL']);report.email={status:mailMissing.length?'missing':'configured_delivery_unverified',missing:mailMissing,messages_sent:false};if(mailMissing.length)blocked=true;
console.log(JSON.stringify(report,null,2));process.exitCode=blocked?2:0;
