import { useState } from 'react'; import { Link, Navigate } from 'react-router-dom'; import { useApp } from '../store'; import { post } from '../lib/api'; import { waLink } from '../lib/wa';
export function Notify({ n }) { const { t } = useApp(); return <ul className="notif"><li className={n.telegram.sent ? 'okc' : 'bad-msg'}>{n.telegram.sent ? '✔ ' + t('tg_ok') : '✖ ' + t('tg_no') + (n.telegram.reason ? ` (${n.telegram.reason})` : '')}</li><li className={n.email.sent ? 'okc' : 'bad-msg'}>{n.email.sent ? '✔ ' + t('em_ok') : '✖ ' + t('em_no') + (n.email.reason ? ` (${n.email.reason})` : '')}</li></ul> }
export default function Checkout() {
    const { t, items, total, money, pname, user, profile, getToken, clearCart, notify } = useApp();
    const [f, setF] = useState({ name: profile?.full_name || '', phone: profile?.phone || '', email: user?.email || '', address: '', note: '' }); const [er, setEr] = useState({}); const [busy, setBusy] = useState(false); const [done, setDone] = useState(null);
    if (!items.length && !done) return <Navigate to="/cart" replace />;
    const ch = e => setF({ ...f, [e.target.name]: e.target.value });
    const valid = () => { const e = {}; if (f.name.trim().length < 2) e.name = t('e_req'); if (!/^\+?[\d\s()-]{7,18}$/.test(f.phone.trim())) e.phone = t('e_ph'); if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = t('e_email'); if (f.address.trim().length < 5) e.address = t('e_addr'); setEr(e); return !Object.keys(e).length };
    const lines = (its) => its.map(x => `• ${pname(x.p)} × ${x.qty} = ${money(x.p.price * x.qty)}`).join('\n');
    const wa = (its, tot, id) => waLink(`${t('wa_order')}\n${id ? `#${id.slice(0, 8)}\n` : ''}${lines(its)}\n${t('total')}: ${money(tot)}\n${f.name} · ${f.phone}\n${f.address}`);
    const submit = async e => {
        e.preventDefault(); if (!valid()) return; setBusy(true);
        try { const r = await post('/api/order', { ...f, items: items.map(x => ({ id: x.id, qty: x.qty })) }, await getToken()); setDone({ ...r, its: items, tot: total }); clearCart() }
        catch (x) { notify(x.message === 'net' ? t('e_net') : t('e_ord'), 'err') } setBusy(false)
    };
    if (done) return <section className="sec page-top"><div className="wrap"><div className="auth" style={{ maxWidth: 560 }}><h2>✔ {t('ord_ok')} #{done.id.slice(0, 8)}</h2><p>{t('total')}: <b>{money(done.total)}</b></p><Notify n={done.notify} />
        <a className="btn" href={wa(done.its, done.tot, done.id)} target="_blank" rel="noopener noreferrer">{t('wa_btn')}</a><Link className="btn sm ghost-d" to="/orders">{t('orders')}</Link><Link className="btn sm ghost-d" to="/shop">{t('cont')}</Link></div></div></section>;
    const F = (k, l, ty = 'text') => <label><span>{t(l)}</span><input name={k} type={ty} value={f[k]} onChange={ch} className={er[k] ? 'bad' : ''} /><em>{er[k]}</em></label>;
    return <section className="sec page-top"><div className="wrap"><Link to="/cart" className="btn sm ghost-d">← {t('cart')}</Link><h2 style={{ marginTop: 14 }}>{t('checkout')}</h2>
        <div className="cart-grid"><form onSubmit={submit} noValidate>{F('name', 'f_name')}{F('phone', 'f_phone', 'tel')}{F('email', 'email', 'email')}{F('address', 'addr_l')}<label className="full"><span>{t('f_msg')}</span><textarea name="note" rows="3" value={f.note} onChange={ch} /></label>
            <button className="btn full" disabled={busy}>{busy ? '…' : t('checkout')}</button>
            <a className="btn full light-b" href={wa(items, total)} onClick={e => { if (!valid()) e.preventDefault() }} target="_blank" rel="noopener noreferrer">{t('wa_btn')}</a></form>
            <aside className="sum"><h3>{t('cart')}</h3>{items.map(x => <p key={x.id} className="srow"><span>{pname(x.p)} × {x.qty}</span><b>{money(x.p.price * x.qty)}</b></p>)}<p className="srow"><span>{t('total')}</span><b className="price">{money(total)}</b></p></aside></div></div></section>
}
