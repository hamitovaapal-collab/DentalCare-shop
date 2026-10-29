import { createClient } from "@supabase/supabase-js";
const env = (k) => process.env[k];
export const admin = () =>
  createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
  });
export async function userFrom(req) {
  const t = (req.headers.authorization || "").slice(7);
  if (!t) return null;
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
export async function telegram(text) {
  if (!env("TELEGRAM_BOT_TOKEN") || !env("TELEGRAM_CHAT_ID"))
    return { sent: false, reason: "not_configured" };
  try {
    const r = await fetch(
      `https://api.telegram.org/bot${env("TELEGRAM_BOT_TOKEN")}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: env("TELEGRAM_CHAT_ID"),
          text,
          parse_mode: "HTML",
        }),
      },
    );
    const j = await r.json();
    return j.ok
      ? { sent: true }
      : { sent: false, reason: j.description || "telegram_error" };
  } catch (e) {
    return { sent: false, reason: "network_error" };
  }
}
export async function email(subject, html) {
  if (!env("RESEND_API_KEY") || !env("ADMIN_EMAIL") || !env("FROM_EMAIL"))
    return { sent: false, reason: "not_configured" };
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
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
