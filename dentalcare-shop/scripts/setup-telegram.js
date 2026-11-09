import { randomBytes } from 'node:crypto';
import { telegramCall, telegramConfig } from '../api/_telegram.js';
const action=process.argv[2] || 'check';
if(action==='secret') { console.log(randomBytes(32).toString('hex')); process.exit(0); }
const config=telegramConfig();
if(!config.token||!config.chat){console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');process.exit(2);}
if(!/^-?\d+$/.test(config.chat)){console.error('TELEGRAM_CHAT_ID must be the numeric ID of the intended chat (including its minus sign for groups).');process.exit(2);}
if(!['check','webhook','test'].includes(action)){console.error('Use check, webhook, test or secret');process.exit(2);}
let failed=false;
async function call(method,payload={}){const result=await telegramCall(method,payload);if(!result.ok){console.error(`${method}: ${result.reason}`);failed=true;}return result;}
const me=await call('getMe');const chat=await call('getChat',{chat_id:config.chat});
if(!me.ok||!chat.ok)process.exit(2);
console.log('Bot identity and configured recipient are accessible.');
const info=await call('getWebhookInfo');
if(info.ok)console.log(JSON.stringify({webhook_configured:Boolean(info.result?.url),pending_updates:info.result?.pending_update_count||0,delivery_error_present:Boolean(info.result?.last_error_date)}));
if(action==='webhook'){
 const secret=process.env.TELEGRAM_WEBHOOK_SECRET?.trim();let site;
 try{site=new URL(process.env.SITE_URL);if(site.protocol!=='https:'||site.username||site.password||site.search||site.hash||site.pathname!=='/')throw Error();}catch{console.error('SITE_URL must be your public HTTPS origin');process.exit(2);}
 if(!secret||!/^[A-Za-z0-9_-]{32,256}$/.test(secret)){console.error('TELEGRAM_WEBHOOK_SECRET must be 32–256 characters: A–Z a–z 0–9 _ -');process.exit(2);}
 const set=await call('setWebhook',{url:new URL('/api/telegram-webhook',site).href,secret_token:secret,allowed_updates:['message'],drop_pending_updates:false});
 if(set.ok){await call('setMyCommands',{commands:[{command:'start',description:'Начало работы'},{command:'help',description:'Помощь'},{command:'status',description:'Состояние подключения'}]});console.log('Webhook configured; pending updates preserved. Polling must not run for this bot.');}
}
if(action==='test'){const r=await call('sendMessage',{chat_id:config.chat,text:'DentalCare: проверка доставки уведомлений. Это тест, не заказ.'});if(r.ok)console.log('Telegram accepted the test message. Verify receipt in the configured chat.');}
process.exitCode=failed?2:0;
