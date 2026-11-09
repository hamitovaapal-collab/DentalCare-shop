import { useState } from 'react';
import { useApp } from '../store';
import { TG_PHONE, WA_NUMBER, tgLink, tgAppLink, waLink } from '../lib/wa';
import PageHeading from '../components/PageHeading';
import Button from '../components/Button';
import Icon from '../components/Icon';
export default function Contact() {
    const { t } = useApp();
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const send = e => {
        e.preventDefault();
        if (message.trim().length < 3) return setError(t('e_req'));
        setError('');
        window.open(waLink(message.trim()), '_blank', 'noopener,noreferrer');
    };
    return <section className="sec page-top"><div className="wrap"><PageHeading title={t('contact')} description={t('cont_t')}/><div className="contact"><div>
        <div className="contact-details"><p><Icon n="pin" s={19}/> {t('addr')}</p><p><Icon n="telegram" s={19}/> {t('tg_contact')}: <a href={tgLink} target="_blank" rel="noopener noreferrer">{TG_PHONE}</a></p><p><Icon n="whatsapp" s={19}/> WhatsApp: <a href={waLink(t('wa_hi'))} target="_blank" rel="noopener noreferrer">+{WA_NUMBER}</a></p><p><Icon n="mail" s={19}/> <a href="mailto:info@dentalcare.example">info@dentalcare.example</a></p></div>
        <div className="cta"><a className="btn telegram" href={tgLink} target="_blank" rel="noopener noreferrer"><Icon n="telegram" s={18}/>Telegram</a><a className="btn ghost-d" href={tgAppLink}>{t('tg_app')}</a></div><p className="note">{t('tg_hint')}</p>
        <h3 style={{marginTop: 30}}>{t('hrs_t')}</h3><p>{t('hrs')}</p><p className="note" style={{marginTop: 18}}>{t('note')}</p>
        <form className="auth" style={{marginTop: 28, maxWidth: 'none'}} onSubmit={send} noValidate><label><span>{t('wa_ask')}</span><textarea rows="4" value={message} onChange={e => setMessage(e.target.value)} placeholder={t('msg_ph')} aria-invalid={Boolean(error)}/></label>{error && <p className="bad-msg" role="alert">{error}</p>}<Button type="submit" className="whatsapp"><Icon n="whatsapp" s={18}/>{t('wa_btn')}</Button></form>
    </div><div className="map"><Icon n="pin" s={44}/><div><h2>{t('contact')}</h2><p>{t('addr')}</p></div><a className="btn ghost-d" target="_blank" rel="noopener noreferrer" href="https://www.openstreetmap.org/search?query=Bishkek%20Chuy%20Avenue">{t('map')} <Icon n="arrow" s={18}/></a></div></div></div></section>;
}
