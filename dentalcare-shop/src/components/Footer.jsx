import { Link } from 'react-router-dom'; import { useApp } from '../store'; import { TG_PHONE, tgLink, waLink, WA_NUMBER } from '../lib/wa'; import Icon from './Icon'; import C from '../data/content.json';
export default function Footer() {
    const { t, lang } = useApp();
    return <footer><div className="wrap foot"><div><Link to="/" className="logo"><Icon n="tooth" s={26} /> DentalCare</Link><p>{t('tag')}</p></div>
        <div><h4>{t('ql')}</h4><ul>{[['/', 'home'], ['/about', 'about'], ['/shop', 'shop'], ['/booking', 'booking'], ['/reviews', 'reviews'], ['/contact', 'contact']].map(([to, k]) => <li key={to}><Link to={to}>{t(k)}</Link></li>)}</ul></div>
        <div><h4>{t('services')}</h4><ul>{C.services.map((s, i) => <li key={i}><Link to={`/booking?service=${i}`}>{s.name[lang]}</Link></li>)}</ul></div>
        <div><h4>{t('contact')}</h4><ul className="ci"><li><Icon n="phone" s={15} /><a href={waLink(t('wa_hi'))} target="_blank" rel="noopener noreferrer">+{WA_NUMBER}</a></li><li><Icon n="telegram" s={15} /><a href={tgLink} target="_blank" rel="noopener noreferrer">{TG_PHONE}</a></li><li><Icon n="mail" s={15} /><a href="mailto:info@dentalcare.example">info@dentalcare.example</a></li><li><Icon n="pin" s={15} />{t('addr')}</li></ul>
            <p className="soc"><a href={tgLink} target="_blank" rel="noopener noreferrer" aria-label="Telegram"><Icon n="telegram" s={16} /></a><a href={waLink(t('wa_hi'))} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><Icon n="whatsapp" s={16} /></a><a href="mailto:info@dentalcare.example" aria-label="Email"><Icon n="mail" s={16} /></a></p></div>
        <div><h4>{t('hrs_t')}</h4><p>{t('hrs')}</p><button className="up" onClick={() => scrollTo({ top: 0, behavior: 'smooth' })} aria-label={t('top')}><Icon n="up" s={18} /></button><small>{t('top')}</small></div></div>
        <p className="copy">© 2026 DentalCare. {t('rights')}</p></footer>
}
