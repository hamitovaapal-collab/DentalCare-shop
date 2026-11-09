import { supabaseSettings } from './config.js';
// This validator is for browser credentials only. Backend service credentials
// must continue to use the separate server validator.
export function isPublicSupabaseKey(key) {
    if (typeof key !== 'string') return false;
    const value = key.trim();
    if (/^sb_publishable_[A-Za-z0-9_-]{8,}$/.test(value)) return true;
    const parts = value.split('.');
    if (parts.length !== 3) return false;
    try {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        return payload.role === 'anon';
    } catch { return false; }
}
export function publicSupabaseSettings(url, key) {
    const settings = supabaseSettings(url, key);
    return settings && isPublicSupabaseKey(settings.key) ? settings : null;
}
export function assertPublicBuildSettings(env) {
    for (const [name, input] of Object.entries(env)) {
        if (!name.startsWith('VITE_') || !name.includes('SUPABASE')) continue;
        const value = typeof input === 'string' ? input.trim() : '';
        if (!value || /^your-(anon-public|service-role)-key$/i.test(value)) continue;
        if (/SERVICE_ROLE|SECRET/.test(name) || (['VITE_SUPABASE_ANON_KEY', 'VITE_SUPABASE_PUBLISHABLE_KEY'].includes(name) && !isPublicSupabaseKey(value))) {
            throw new Error(`Invalid public Supabase configuration: ${name}. Only an anon or publishable key is allowed in frontend settings.`);
        }
    }
}
export function publicSettingsFromEnv(env) {
    const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
    for (const key of [env.VITE_SUPABASE_ANON_KEY, env.VITE_SUPABASE_PUBLISHABLE_KEY, env.SUPABASE_ANON_KEY, env.SUPABASE_PUBLISHABLE_KEY]) {
        const settings = publicSupabaseSettings(url, key);
        if (settings) return settings;
    }
    return null;
}
export async function fetchPublicSettings(fetcher = fetch, timeout = 2500) {
    try {
        const response = await fetcher('/api/public-config', {
            headers: {Accept: 'application/json'}, cache: 'no-store',
            signal: AbortSignal.timeout(timeout),
        });
        if (!response.ok) return null;
        const data = await response.json();
        return publicSupabaseSettings(data.url, data.publicKey);
    } catch { return null; }
}
