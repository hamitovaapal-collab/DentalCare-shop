import {
  admin,
  configured,
  userFrom,
  telegram,
  email,
  esc,
  validPhone,
  validEmail,
} from "./_lib.js";
const currencyText = value => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, useGrouping: false }).format(value);
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  try {
    if (/^Bearer\s+.+$/i.test(req.headers.authorization || '') && !configured()) return res.status(503).json({ error: 'not_configured' });
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
      name.length < 2 || name.length > 120 || em.length > 254 || address.length > 300 ||
      !validPhone(phone) ||
      !validEmail(em) ||
      address.length < 5 ||
      !Array.isArray(b.items) ||
      !b.items.length || b.items.some(i => !i || typeof i.id !== 'string') || new Set(b.items.map(i => i.id)).size !== b.items.length ||
      b.items.length > 30
    )
      return res.status(400).json({ error: "validation" });
    const requested = b.items.map(item => ({ id: item.id, qty: Number(item.qty) }));
    if (requested.some(item => !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 50))
      return res.status(400).json({ error: 'items' });
    if (b.request_id !== undefined && (typeof b.request_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(b.request_id))) return res.status(400).json({error:'validation'});
    const sb = admin();
    const { data: o, error } = await sb.rpc(b.request_id ? 'place_order_once' : 'place_order', {
      p_user_id: u.id, p_name: name, p_phone: phone, p_email: em,
      p_address: address, p_note: note, p_items: requested, ...(b.request_id ? {p_request_id:b.request_id} : {}),
    });
    if (error) {
      if (error.code === 'P0001' && error.message === 'request_conflict') return res.status(409).json({error:'request_conflict'});
      if (error.code === 'P0001' && ['items', 'validation'].includes(error.message))
        return res.status(400).json({ error: error.message });
      if (error.code === 'PGRST202' || error.code === '42883')
        return res.status(503).json({ error: 'not_configured' });
      throw error;
    }
    if(o.replayed) return res.json({ok:true,id:o.id,total:Number(o.total),items:o.items,replayed:true,notify:{telegram:{sent:o.notified?.telegram===true,reason:o.notified?.telegram ? undefined : 'previous_attempt'},email:{sent:o.notified?.email===true,reason:o.notified?.email ? undefined : 'previous_attempt'}}});
    const items = o.items;
    const total = Number(o.total);
    const lines = items
      .map((i) => `• ${esc(String(i.name).slice(0, 40))} × ${i.qty} = ${currencyText(i.price * i.qty)} KGS`)
      .join("\n");
    const orderedAt = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Asia/Bishkek', dateStyle: 'short', timeStyle: 'medium' }).format(new Date(o.created_at || Date.now()));
    const text = `🛒 <b>New order</b> #${esc(o.id)}\n🕒 ${orderedAt} (Бишкек, UTC+6)\n👤 ${esc(name)}\n📞 ${esc(phone)}\n✉ ${esc(em)}\n${lines}\n💰 <b>Total: ${currencyText(total)} KGS</b>\n📍 ${esc(address)}${note ? `\n📝 ${esc(note)}` : ""}`;
    const html = `<h2>New order #${o.id.slice(0, 8)}</h2><p>${esc(name)} — ${esc(phone)} — ${esc(em)}</p><pre>${lines}</pre><p><b>Total: ${currencyText(total)} KGS</b></p><p>${esc(address)}</p><p>${orderedAt} (Бишкек, UTC+6)</p><p>${esc(note)}</p>`;
    const [tg, mail] = await Promise.all([
      telegram(text),
      email(`New order #${o.id.slice(0, 8)}`, html),
    ]);
    // Notification metadata cannot undo an already committed order. Do not
    // encourage a duplicate submission if this optional follow-up write fails.
    try {
      const { error: metadataError } = await sb.from('orders')
        .update({ notified: { telegram: tg.sent, email: mail.sent } }).eq('id', o.id);
      if (metadataError) console.warn('Order saved; notification metadata update failed');
    } catch { console.warn('Order saved; notification metadata update unavailable'); }
    res.json({
      ok: true,
      id: o.id,
      total,
      items,
      notify: { telegram: tg, email: mail },
    });
  } catch (e) {
    console.error("order request failed");
    res.status(500).json({ error: "server" });
  }
}
