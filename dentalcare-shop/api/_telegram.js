// Server-only Telegram transport. Never return upstream descriptions or token URLs.
export const telegramConfig = () => ({ token: process.env.TELEGRAM_BOT_TOKEN?.trim(), chat: process.env.TELEGRAM_CHAT_ID?.trim() });
export async function telegramCall(method, payload) {
  const { token } = telegramConfig();
  if (!token) return { ok: false, reason: 'not_configured' };
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(10000), body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (response.ok && data.ok) return { ok: true, result: data.result };
    const code = data.error_code || response.status;
    return { ok: false, reason: code === 401 ? 'unauthorized' : code === 403 ? 'forbidden' : code === 429 ? 'rate_limited' : code === 400 ? 'invalid_request' : 'telegram_error' };
  } catch { return { ok: false, reason: 'network_error' }; }
}
export async function telegram(text) {
  const { token, chat } = telegramConfig();
  if (!token || !chat) return { sent: false, reason: 'not_configured' };
  const result = await telegramCall('sendMessage', { chat_id: chat, text, parse_mode: 'HTML', link_preview_options: { is_disabled: true } });
  // Do not retry an ambiguous timeout: Telegram may already have accepted it.
  return result.ok ? { sent: true } : { sent: false, reason: result.reason };
}
