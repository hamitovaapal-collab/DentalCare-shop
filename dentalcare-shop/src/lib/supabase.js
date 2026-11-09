import { createClient } from '@supabase/supabase-js';
import { supabaseSettings } from './config';
const settings = supabaseSettings(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
// Invalid local configuration must not crash the whole storefront at import time.
export const supabase = settings ? createClient(settings.url, settings.key) : null;
