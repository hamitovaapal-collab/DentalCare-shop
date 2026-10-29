import { useState } from 'react'; import { Link, useSearchParams } from 'react-router-dom'; import { useApp } from '../store'; import { post } from '../lib/api'; import { waLink } from '../lib/wa'; import C from '../data/content.json'; import { Notify } from './Checkout';
const SLOTS = Array.from({ length: 11 }, (_, i) => String(i + 9).padStart(2, '0') + ':00');
export default function Booking() {
    const { t, lang, user, profile, getToken, notify } = useApp(); const [sp] = useSearchParams(); const pre = C.services[+sp.get('service')]?.name.en || '';
    const today = new Date().toISOString().slice(0, 10);
    const [f, setF] = useState({ name: profile?.full_name || '', phone: profile?.phone || '', email: user?.email || '', service: pre, date: '', time: '', message: '' }); const [er, setEr] = useState({}); const [busy, setBusy] = useState(false); const [done, setDone] = useState(null);
    const ch = e => setF({ ...f, [e.target.name]: e.target.value });
    const valid = () => {
        const e = {}; if (f.name.trim().length < 2) e.name = t('e_req'); if (!/^\+?[\d\s()-]{7,18}$/.test(f.phone.trim())) e.phone = t('e_ph'); if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = t('e_email');
        if (!f.service) e.service = t('e_req'); if (!f.date || f.date < today) e.date = t('e_dt'); if (!f.time) e.time = t('e_req'); setEr(e); return !Object.keys(e).length
    };
    const waText = () => `${t('wa_book')}\n${f.service}\n${f.date} ${f.time}\n${f.name} · ${f.phone}${f.message ? `\n${f.message}` : ''}`;
    const submit = async e => {
        e.preventDefault(); if (!valid()) return; setBusy(true);
        try { const r = await post('/api/booking', f, user ? await getToken() : undefined); setDone(r) } catch (x) { notify(x.message === 'net' ? t('e_net') : t('e_bk'), 'err') } setBusy(false)
    };
    const fld = (k, l, ty = 'text') => <label><span>{t(l)}</span><input name={k} type={ty} value={f[k]} onChange={ch} className={er[k] ? 'bad' : ''} min={ty === 'date' ? today : undefined} /><em>{er[k]}</em></label>;
    if (done) return <section className="sec page-top"><div className="wrap"><div className="auth" style={{ maxWidth: 560 }}><h2>✔ {t('bk_ok')}</h2><Notify n={done.notify} /><a className="btn" href={waLink(waText())} target="_blank" rel="noopener noreferrer">{t('wa_btn')}</a><Link className="btn sm ghost-d" to="/">{t('home')}</Link></div></div></section>;
    return <section className="sec page-top"><div className="wrap book"><div><p className="eyebrow">{t('ap_e')}</p><h2>{t('bk_t')}</h2><p>{t('ap_p')}</p><p className="note">{t('hrs')}</p></div>
        <form onSubmit={submit} noValidate>{fld('name', 'f_name')}{fld('phone', 'f_phone', 'tel')}{fld('email', 'email', 'email')}
            <label><span>{t('f_svc')}</span><select name="service" value={f.service} onChange={ch} className={er.service ? 'bad' : ''}><option value="">—</option>{C.services.map((s, i) => <option key={i} value={s.name.en}>{s.name[lang]}</option>)}</select><em>{er.service}</em></label>
            {fld('date', 'f_date', 'date')}<label><span>{t('f_time')}</span><select name="time" value={f.time} onChange={ch} className={er.time ? 'bad' : ''}><option value="">—</option>{SLOTS.map(s => <option key={s}>{s}</option>)}</select><em>{er.time}</em></label>
            <label className="full"><span>{t('f_msg')}</span><textarea name="message" rows="3" value={f.message} onChange={ch} /></label><button className="btn full" disabled={busy}>{busy ? '…' : t('f_send')}</button>
            <a className="btn full light-b" href="#wa" onClick={e => { e.preventDefault(); if (valid()) window.open(waLink(waText()), '_blank', 'noopener') }}>{t('wa_btn')}</a></form></div></section>
}
