import { validPhone } from '../lib/phone';
import PageHeading from '../components/PageHeading';
import Button from '../components/Button';
import { useEffect, useRef, useState } from 'react'; import { Link, useLocation, useSearchParams } from 'react-router-dom'; import { useApp } from '../store'; import { post } from '../lib/api'; import { waLink } from '../lib/wa'; import C from '../data/content.json'; import { supabase } from '../lib/supabase'; import { Notify } from './Checkout';
const SLOTS = Array.from({ length: 11 }, (_, i) => String(i + 9).padStart(2, '0') + ':00');
export default function Booking() {
    const { t, lang, user, profile, getToken, notify } = useApp(); const [sp] = useSearchParams(); const pre = sp.has('service') && /^\d+$/.test(sp.get('service')) ? C.services[Number(sp.get('service'))]?.name.en || '' : '';
    const bookingRouteKey = useLocation().key;
    const localTime = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bishkek', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
    const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Bishkek' }).format(new Date());
    const submitting = useRef(false);
    const activeBookingRoute = useRef(bookingRouteKey);
    activeBookingRoute.current = bookingRouteKey;
    const [f, setF] = useState({ name: profile?.full_name || '', phone: profile?.phone || '', email: user?.email || '', service: pre, date: '', time: '', message: '' }); const [er, setEr] = useState({}); const [busy, setBusy] = useState(false); const [done, setDone] = useState(null);
    useEffect(() => { setF(f => ({ ...f, name: f.name || profile?.full_name || '', phone: f.phone || profile?.phone || '', email: f.email || user?.email || '' })); }, [profile, user]);
    useEffect(() => {
        setF(current => ({ ...current, service: pre }));
        setEr(current => ({ ...current, service: undefined }));
        setDone(null);
    }, [pre, bookingRouteKey]);
    const ch = e => setF({ ...f, [e.target.name]: e.target.value });
    const valid = () => {
        const e = {}; if (f.name.trim().length < 2) e.name = t('e_req'); if (!validPhone(f.phone)) e.phone = t('e_ph'); if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = t('e_email');
        if (!f.service) e.service = t('e_req'); if (!f.date || f.date < today || new Date(`${f.date}T12:00:00Z`).getUTCDay() === 0) e.date = t('e_dt'); if (!f.time || (f.date === today && f.time <= localTime)) e.time = t('e_req'); setEr(e); return !Object.keys(e).length
    };
    const waText = (form = f) => `${t('wa_book')}\n${form.service}\n${form.date} ${form.time}\n${form.name} · ${form.phone}${form.message ? `\n${form.message}` : ''}`;
    const submit = async e => {
        e.preventDefault(); if (submitting.current || !valid()) return;
        if (!supabase) return notify(t('online_unavailable'), 'err');
        submitting.current = true; setBusy(true);
        try {
            const submitted = { ...f }, submittedRoute = bookingRouteKey;
            const r = await post('/api/booking', submitted, user ? await getToken() : undefined);
            if (activeBookingRoute.current === submittedRoute) setDone({ ...r, form: submitted });
            else notify(`${t('bk_ok')} #${r.id.slice(0, 8)}`);
        } catch (x) { notify(x.message === 'timeout' ? t('e_timeout') : x.message === 'not_configured' ? t('online_unavailable') : x.message === 'net' ? t('e_net') : t('e_bk'), 'err') } finally { setBusy(false); submitting.current = false; }
    };
    const fld = (k, l, ty = 'text') => <label><span>{t(l)}</span><input name={k} type={ty} value={f[k]} onChange={ch} className={er[k] ? 'bad' : ''} min={ty === 'date' ? today : undefined} /><em>{er[k]}</em></label>;
    if (done) return <section className="sec page-top"><div className="wrap"><div className="auth" style={{ maxWidth: 560 }}><h2>✔ {t('bk_ok')}</h2><Notify n={done.notify} /><a className="btn" href={waLink(waText(done.form))} target="_blank" rel="noopener noreferrer">{t('wa_btn')}</a><Link className="btn sm ghost-d" to="/">{t('home')}</Link></div></div></section>;
    return <section className="sec page-top"><div className="wrap"><PageHeading title={t('bk_t')} description={t('booking_intro')}/><div className="book"><div><p className="eyebrow">{t('booking')}</p><h2>{t('ap_e')}</h2><p>{t('ap_p')}</p><p className="note">{t('hrs')}</p></div>
        <form onSubmit={submit} noValidate>{fld('name', 'f_name')}{fld('phone', 'f_phone', 'tel')}{fld('email', 'email', 'email')}
            <label><span>{t('f_svc')}</span><select name="service" value={f.service} onChange={ch} className={er.service ? 'bad' : ''}><option value="">—</option>{C.services.map((s, i) => <option key={i} value={s.name.en}>{s.name[lang]}</option>)}</select><em>{er.service}</em></label>
            {fld('date', 'f_date', 'date')}<label><span>{t('f_time')}</span><select name="time" value={f.time} onChange={ch} className={er.time ? 'bad' : ''}><option value="">—</option>{SLOTS.map(s => <option key={s} disabled={f.date === today && s <= localTime}>{s}</option>)}</select><em>{er.time}</em></label>
            <label className="full"><span>{t('f_msg')}</span><textarea name="message" rows="3" value={f.message} onChange={ch} /></label>{!supabase && <p className="note full" role="status">{t('online_unavailable')}</p>}<Button type="submit" className="full" busy={busy} disabled={!supabase}>{t('f_send')}</Button>
            <a className="btn full light-b" href={waLink(waText())} target="_blank" rel="noopener noreferrer" onClick={e => { if (!valid()) e.preventDefault() }}>{t('wa_btn')}</a></form></div></div></section>
}
