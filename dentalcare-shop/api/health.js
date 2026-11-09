import { configured } from './_lib.js';
export default function health(req, res) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).json({ error: 'method' });
    return res.json({ ok: true, configuration: {
        supabase: configured(),
        telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
        email: Boolean(process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL && process.env.FROM_EMAIL),
    } });
}
