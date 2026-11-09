import { timingSafeEqual } from 'node:crypto';
import { admin, configured } from './_lib.js';
import { telegram, telegramConfig } from './_telegram.js';
const equal = (a, b) => { const x=Buffer.from(a), y=Buffer.from(b); return x.length===y.length && timingSafeEqual(x,y); };
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  const {token,chat} = telegramConfig();
  if (!secret || !token || !chat || !configured()) return res.status(503).json({ error: 'not_configured' });
  const header=req.headers['x-telegram-bot-api-secret-token'];
  if (typeof header!=='string' || !equal(header,secret)) return res.status(403).json({ error: 'forbidden' });
  const update=req.body;
  if (!Number.isSafeInteger(update?.update_id) || update.update_id<0) return res.status(400).json({error:'validation'});
  const message=update.message;
  // Orders/PII are never disclosed to an arbitrary sender or forwarded chat.
  if (!message || String(message.chat?.id)!==chat || typeof message.text!=='string') return res.json({ok:true,ignored:true});
  const command=message.text.trim().split(/\s/)[0].split('@')[0];
  const text=command==='/start' ? 'DentalCare: уведомления о заказах подключаются к этому чату. Заказы оформляются на сайте.\n/help — команды\n/status — состояние подключения' : command==='/help' ? 'Команды: /start, /help, /status.\nНовые заказы отправляются автоматически после сохранения на сайте. Бот не принимает заказы из переписки и не запрашивает пароли или ключи.' : command==='/status' ? 'Обработчик бота работает. Этот чат назначен получателем уведомлений. Это не подтверждает доставку каждого заказа; статус заказа проверяйте в админ-панели сайта.' : 'Для справки отправьте /help. Для заказа используйте сайт DentalCare.';
  const sb=admin();
  try {
    const {error}=await sb.from('telegram_updates').insert({update_id:update.update_id});
    if (error?.code==='23505') return res.json({ok:true,duplicate:true});
    if (error) return res.status(503).json({error:'update_store_unavailable'});
    const sent=await telegram(text);
    if (!sent.sent) {
      // The claim stays recorded on ambiguous network errors, preventing duplicate
      // replies. Explicit API refusals can safely be retried by Telegram.
      if(sent.reason!=='network_error') await sb.from('telegram_updates').delete().eq('update_id',update.update_id);
      return res.status(sent.reason==='network_error'?200:503).json({ok:false,error:'reply_failed'});
    }
    return res.json({ok:true});
  } catch { return res.status(503).json({error:'update_store_unavailable'}); }
}
