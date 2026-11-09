import { publicSettingsFromEnv } from '../src/lib/public-config.js';
// Only whitelisted URL + PUBLIC key can leave this endpoint. Never spread env,
// derive a key or fall back to SUPABASE_SERVICE_ROLE_KEY.
export default function publicConfig(req, res) {
    if (req.method !== 'GET') return res.status(405).json({error: 'method'});
    const settings = publicSettingsFromEnv(process.env);
    if (!settings) return res.json({configured: false});
    return res.json({url: settings.url, publicKey: settings.key});
}
