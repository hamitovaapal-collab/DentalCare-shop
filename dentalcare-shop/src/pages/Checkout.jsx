import { validPhone } from '../lib/phone';
import PageHeading from '../components/PageHeading';
import LoadingState from '../components/LoadingState';
import Button from '../components/Button';
import { useEffect, useRef, useState } from 'react'; import { Link, Navigate } from 'react-router-dom'; import { useApp } from '../store'; import { post } from '../lib/api'; import { supabase } from '../lib/supabase'; import { waLink } from '../lib/wa';
export function Notify({ n: input }) { const n = { telegram: { sent: false, ...input?.telegram }, email: { sent: false, ...input?.email } }; const { t } = useApp(); return <ul className="notif"><li className={n.telegram.sent ? 'okc' : 'bad-msg'}>{n.telegram.sent ? '✔ ' + t('tg_ok') : '✖ ' + t('tg_no') + (n.telegram.reason ? ` (${n.telegram.reason})` : '')}</li><li className={n.email.sent ? 'okc' : 'bad-msg'}>{n.email.sent ? '✔ ' + t('em_ok') : '✖ ' + t('em_no') + (n.email.reason ? ` (${n.email.reason})` : '')}</li></ul> }
export default function Checkout() {
    const { t, items, total, money, pname, unavailableCart, user, profile, productsReady, getToken, clearCart, loadProducts, notify } = useApp();
    const submitting = useRef(false);
    const attempt = useRef(null);
    const [f, setF] = useState({ name: profile?.full_name || '', phone: profile?.phone || '', email: user?.email || '', address: '', note: '' }); const [er, setEr] = useState({}); const [busy, setBusy] = useState(false); const [done, setDone] = useState(null);
    useEffect(() => { setF(f => ({ ...f, name: f.name || profile?.full_name || '', phone: f.phone || profile?.phone || '', email: f.email || user?.email || '' })); }, [profile, user]);
    if (!productsReady) return <section className="sec page-top"><div className="wrap"><LoadingState/></div></section>;
    if (!items.length && !done) return <Navigate to="/cart" replace />;
    const ch = e => setF({ ...f, [e.target.name]: e.target.value });
    const valid = () => { const e = {}; if (f.name.trim().length < 2) e.name = t('e_req'); if (!validPhone(f.phone)) e.phone = t('e_ph'); if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = t('e_email'); if (f.address.trim().length < 5) e.address = t('e_addr'); setEr(e); return !Object.keys(e).length };
    const lines = (its) => its.map(x => `• ${pname(x.p)} × ${x.qty} = ${money(x.p.price * x.qty)}`).join('\n');
    const wa = (its, tot, id, form = f) => waLink(`${t('wa_order')}\n${id ? `#${id.slice(0, 8)}\n` : ''}${lines(its)}\n${t('total')}: ${money(tot)}\n${form.name} · ${form.phone}\n${form.address}${form.note ? `\n${form.note}` : ''}`);
    const submit = async e => {
        e.preventDefault(); if (submitting.current || !valid()) return;
        if (!supabase || !user) return notify(t('online_unavailable'), 'err');
        submitting.current = true; setBusy(true);
        try { const payload = { ...f, items: items.map(x => ({ id: x.id, qty: x.qty })) }; const signature = JSON.stringify(payload); if (attempt.current?.signature !== signature) attempt.current = { signature, id: crypto.randomUUID() }; const r = await post('/api/order', { ...payload, request_id: attempt.current.id }, await getToken()); setDone({ ...r, form: { ...f }, its: items.map(x => ({ ...x, p: { ...x.p, price: r.items?.find(i => i.id === x.id)?.price ?? x.p.price } })), tot: r.total }); clearCart(items.map(item => ({ id: item.id, qty: item.qty }))); await loadProducts() }
        catch (x) { notify(x.message === 'timeout' ? t('e_timeout') : x.message === 'items' ? t('e_stock') : x.message === 'not_configured' ? t('online_unavailable') : x.message === 'net' ? t('e_net') : t('e_ord'), 'err') } finally { setBusy(false); submitting.current = false; }
    };
    if (done) return <section className="sec page-top"><div className="wrap"><div className="auth" style={{ maxWidth: 560 }}><h2>✔ {t('ord_ok')} #{done.id.slice(0, 8)}</h2><p>{t('total')}: <b>{money(done.total)}</b></p><Notify n={done.notify} />
        <a className="btn" href={wa(done.its, done.tot, done.id, done.form)} target="_blank" rel="noopener noreferrer">{t('wa_btn')}</a><Link className="btn sm ghost-d" to="/orders">{t('orders')}</Link><Link className="btn sm ghost-d" to="/shop">{t('cont')}</Link></div></div></section>;
    const F = (k, l, ty = 'text') => <label><span>{t(l)}</span><input name={k} type={ty} value={f[k]} onChange={ch} className={er[k] ? 'bad' : ''} /><em>{er[k]}</em></label>;
    return <section className="sec page-top"><div className="wrap"><Link to="/cart" className="btn sm ghost-d">← {t('cart')}</Link><PageHeading title={t('checkout')} description={t('checkout_intro')}/>
        <div className="cart-grid">{unavailableCart.length > 0 && <p className="note full">{t('unavailable_cart_notice')}</p>}<form onSubmit={submit} noValidate>{F('name', 'f_name')}{F('phone', 'f_phone', 'tel')}{F('email', 'email', 'email')}{F('address', 'addr_l')}<label className="full"><span>{t('f_msg')}</span><textarea name="note" rows="3" value={f.note} onChange={ch} /></label>
            {(!supabase || !user) && <p className="note full">{t('online_unavailable')} {supabase && <Link to="/login?redirect=/checkout">{t('login')}</Link>}</p>}<Button type="submit" className="full" busy={busy} disabled={!supabase || !user}>{t('checkout')}</Button>
            <a className="btn full light-b" href={wa(items, total)} onClick={e => { if (!valid()) e.preventDefault() }} target="_blank" rel="noopener noreferrer">{t('wa_btn')}</a></form>
            <aside className="sum"><h3>{t('cart')}</h3>{items.map(x => <p key={x.id} className="srow"><span>{pname(x.p)} × {x.qty}</span><b>{money(x.p.price * x.qty)}</b></p>)}<p className="srow"><span>{t('total')}</span><b className="price">{money(total)}</b></p></aside></div></div></section>
}
