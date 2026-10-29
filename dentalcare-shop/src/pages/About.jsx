import { Link } from 'react-router-dom'; import { useApp } from '../store'; import C from '../data/content.json'; import Reveal from '../components/Reveal'; import Counter from '../components/Counter';
export default function About() {
    const { t, lang: L } = useApp();
    return <section className="sec page-top"><div className="wrap"><div className="about"><Reveal><img className="photo" src="/images/clinic.jpg" alt="Clinic interior" /></Reveal><Reveal delay={.1}><p className="eyebrow">{t('about')}</p><h2>{t('ab_t')}</h2><p>{t('ab_p')}</p>
        <div className="stats"><div><Counter to={20} />+<span>{t('st1')}</span></div><div><Counter to={5000} />+<span>{t('st2')}</span></div><div><Counter to={98} />%<span>{t('st3')}</span></div></div><Link className="btn" to="/booking">{t('book')}</Link></Reveal></div>
        <h2 style={{ marginTop: 70 }}>{t('tm_t')}</h2><div className="grid3">{C.doctors.map((d, i) => <Reveal className="card doc" key={i} delay={i * .08}><div className="im"><img src={`/images/${d.image}.jpg`} alt={d.name} loading="lazy" /></div><div className="bd"><h3>{d.name}</h3><b>{d.role[L]}</b><p>{d.bio[L]}</p></div></Reveal>)}</div></div></section>
}
