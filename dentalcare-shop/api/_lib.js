import { supabaseSettings } from '../src/lib/config.js';
import { createClient } from "@supabase/supabase-js";
const env = (k) => process.env[k];
const settings = () => supabaseSettings(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));
export const configured = () => Boolean(settings());
export const admin = () => {
  const config = settings();
  if (!config) throw new Error('Supabase server configuration is missing or invalid');
  return createClient(config.url, config.key, { auth: { persistSession: false } });
};
export async function userFrom(req) {
  const t = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || '')?.[1];
  if (!t || !configured()) return null;
  const { data } = await admin().auth.getUser(t);
  return data?.user || null;
}
export const esc = (s) =>
  String(s).replace(
    /[&<>]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c],
  );
export const validPhone = (p) => /^\+?[\d\s()-]{7,18}$/.test(p);
export const validEmail = (e) => /^\S+@\S+\.\S+$/.test(e);
export { telegram } from './_telegram.js';
export async function email(subject, html) {
  if (!env("RESEND_API_KEY") || !env("ADMIN_EMAIL") || !env("FROM_EMAIL"))
    return { sent: false, reason: "not_configured" };
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env("RESEND_API_KEY")}`,
      },
      body: JSON.stringify({
        from: env("FROM_EMAIL"),
        to: [env("ADMIN_EMAIL")],
        subject,
        html,
      }),
    });
    return r.ok
      ? { sent: true }
      : { sent: false, reason: "resend_" + r.status };
  } catch (e) {
    return { sent: false, reason: "network_error" };
  }
}
