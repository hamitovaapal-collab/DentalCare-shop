import { useState } from 'react'; import { useApp } from '../store'; import { TG_PHONE, WA_NUMBER, tgLink, waLink } from '../lib/wa'; import Reveal from '../components/Reveal';
export default function Contact() {
    const { t } = useApp(); const [m, setM] = useState(''); const [er, setEr] = useState('');
    const send = e => { e.preventDefault(); if (m.trim().length < 3) return setEr(t('e_req')); setEr(''); window.open(waLink(m.trim()), '_blank', 'noopener') };
    return <section className="sec page-top"><div className="wrap contact"><Reveal><p className="eyebrow">{t('contact')}</p><h2>{t('cont_t')}</h2><p>📍 {t('addr')}</p>
        <p>✈ {t('tg_contact')}: <a href={tgLink} target="_blank" rel="noopener noreferrer">{TG_PHONE}</a></p><p>💬 WhatsApp: <a href={waLink(t('wa_hi'))} target="_blank" rel="noopener noreferrer">+{WA_NUMBER}</a></p><p>✉ <a href="mailto:info@dentalcare.example">info@dentalcare.example</a></p>
        <h3>{t('hrs_t')}</h3><p>{t('hrs')}</p><p className="note">{t('note')}</p>
        <form className="auth" style={{ marginTop: 20, maxWidth: 'none' }} onSubmit={send} noValidate><label><span>{t('wa_ask')}</span><textarea rows="3" value={m} onChange={e => setM(e.target.value)} placeholder={t('msg_ph')} /></label>{er && <p className="bad-msg">{er}</p>}<button className="btn">{t('wa_btn')}</button></form></Reveal>
        <Reveal className="map" delay={.1}><i /><span className="pin">◆</span><a className="btn light" target="_blank" rel="noopener noreferrer" href="https://www.openstreetmap.org/search?query=Bishkek%20Chuy%20Avenue">{t('map')}</a></Reveal></div></section>
}
