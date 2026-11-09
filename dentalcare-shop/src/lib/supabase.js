import { createClient } from '@supabase/supabase-js';
import { publicSettingsFromEnv, fetchPublicSettings } from './public-config.js';
const settings = publicSettingsFromEnv({
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
});
export let supabase = settings ? createClient(settings.url, settings.key) : null;
let initializing;
export function initializeSupabase() {
    if (supabase) return Promise.resolve(supabase);
    if (!initializing) initializing = fetchPublicSettings().then(config => {
        if (config) supabase = createClient(config.url, config.key);
        return supabase;
    }).catch(() => null);
    return initializing;
}
