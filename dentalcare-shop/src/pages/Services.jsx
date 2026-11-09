import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../store';
import C from '../data/content.json';
import PageHeading from '../components/PageHeading';
import ServiceCard from '../components/ServiceCard';
import Modal from '../components/Modal';
export default function Services() {
    const { t, lang } = useApp();
    const [selected, setSelected] = useState(null);
    const service = selected === null ? null : C.services[selected];
    return <section className="sec page-top"><div className="wrap">
        <PageHeading title={t('services')} description={t('services_intro')}/>
        <div className="grid6">{C.services.map((s, i) => <ServiceCard key={i} service={s} index={i} onClick={() => setSelected(i)}/>)}</div>
        <Modal open={Boolean(service)} onClose={() => setSelected(null)}>{service && <><img src={`/images/${service.image}.jpg`} alt={service.name[lang]}/><div className="pd"><h2>{service.name[lang]}</h2><p>{service.desc[lang]}</p><Link className="btn" to={`/booking?service=${selected}`}>{t('book')}</Link></div></>}</Modal>
    </div></section>;
}
