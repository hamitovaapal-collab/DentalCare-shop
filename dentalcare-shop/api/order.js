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
    if (!u) return res.status(401).json({ error: "auth" });
    const b = req.body || {};
    const name = String(b.name || "").trim(),
      phone = String(b.phone || "").trim(),
      em = String(b.email || "").trim(),
      address = String(b.address || "").trim(),
      note = String(b.note || "")
        .trim()
        .slice(0, 500);
    if (
      name.length < 2 ||
      !validPhone(phone) ||
      !validEmail(em) ||
      address.length < 5 ||
      !Array.isArray(b.items) ||
      !b.items.length ||
      b.items.length > 30
    )
      return res.status(400).json({ error: "validation" });
    const sb = admin();
    const ids = [...new Set(b.items.map((i) => String(i.id)))];
    const { data: prods, error } = await sb
      .from("products")
      .select("id,name,price,active")
      .in("id", ids);
    if (error) throw error;
    const items = [];
    let total = 0;
    for (const i of b.items) {
      const p = prods.find((x) => x.id === String(i.id));
      const q = Math.floor(Number(i.qty));
      if (!p || !p.active || !(q >= 1 && q <= 50))
        return res.status(400).json({ error: "items" });
      items.push({ id: p.id, name: p.name.en, qty: q, price: Number(p.price) });
      total += Number(p.price) * q;
    }
    const { data: o, error: e2 } = await sb
      .from("orders")
      .insert({
        user_id: u.id,
        name,
        phone,
        email: em,
        address,
        note,
        items,
        total,
      })
      .select("id")
      .single();
    if (e2) throw e2;
    const lines = items
      .map((i) => `• ${esc(i.name)} × ${i.qty} = ${i.price * i.qty} KGS`)
      .join("\n");
    const text = `🛒 <b>New order</b> #${o.id.slice(0, 8)}\n👤 ${esc(name)}\n📞 ${esc(phone)}\n✉ ${esc(em)}\n${lines}\n💰 <b>Total: ${total} KGS</b>\n📍 ${esc(address)}${note ? `\n📝 ${esc(note)}` : ""}`;
    const html = `<h2>New order #${o.id.slice(0, 8)}</h2><p>${esc(name)} — ${esc(phone)} — ${esc(em)}</p><pre>${lines}</pre><p><b>Total: ${total} KGS</b></p><p>${esc(address)}</p>`;
    const [tg, mail] = await Promise.all([
      telegram(text),
      email(`New order #${o.id.slice(0, 8)}`, html),
    ]);
    await sb
      .from("orders")
      .update({ notified: { telegram: tg.sent, email: mail.sent } })
      .eq("id", o.id);
    res.json({
      ok: true,
      id: o.id,
      total,
      notify: { telegram: tg, email: mail },
    });
  } catch (e) {
    console.error("order error", e);
    res.status(500).json({ error: "server" });
  }
}
