import {
  admin,
  userFrom,
  telegram,
  email,
  esc,
  validPhone,
  validEmail,
} from "./_lib.js";
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  try {
    const u = await userFrom(req);
    const b = req.body || {};
    const name = String(b.name || "").trim(),
      phone = String(b.phone || "").trim(),
      em = String(b.email || "").trim(),
      service = String(b.service || "")
        .trim()
        .slice(0, 100),
      time = String(b.time || "")
        .trim()
        .slice(0, 5),
      message = String(b.message || "")
        .trim()
        .slice(0, 800),
      date = String(b.date || "");
    const today = new Date().toISOString().slice(0, 10);
    if (
      name.length < 2 ||
      !validPhone(phone) ||
      !validEmail(em) ||
      !service ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      date < today ||
      !/^\d{2}:\d{2}$/.test(time)
    )
      return res.status(400).json({ error: "validation" });
    const { data: o, error } = await admin()
      .from("bookings")
      .insert({
        user_id: u?.id || null,
        name,
        phone,
        email: em,
        service,
        date,
        time,
        message,
      })
      .select("id")
      .single();
    if (error) throw error;
    const text = `📅 <b>New booking</b> #${o.id.slice(0, 8)}\n👤 ${esc(name)}\n📞 ${esc(phone)}\n✉ ${esc(em)}\n🦷 ${esc(service)}\n🕒 ${date} ${time}${message ? `\n📝 ${esc(message)}` : ""}`;
    const html = `<h2>New booking #${o.id.slice(0, 8)}</h2><p>${esc(name)} — ${esc(phone)} — ${esc(em)}</p><p>${esc(service)} — ${date} ${time}</p><p>${esc(message)}</p>`;
    const [tg, mail] = await Promise.all([
      telegram(text),
      email(`New booking #${o.id.slice(0, 8)}`, html),
    ]);
    await admin()
      .from("bookings")
      .update({ notified: { telegram: tg.sent, email: mail.sent } })
      .eq("id", o.id);
    res.json({ ok: true, id: o.id, notify: { telegram: tg, email: mail } });
  } catch (e) {
    console.error("booking error", e);
    res.status(500).json({ error: "server" });
  }
}
