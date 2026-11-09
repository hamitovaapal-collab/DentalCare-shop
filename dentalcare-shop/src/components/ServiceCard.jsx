import Reveal from './Reveal';
import Icon from './Icon';
import { useApp } from '../store';
const icons = ['tooth', 'smile', 'layers', 'star', 'sliders', 'shield'];
export default function ServiceCard({ service, index, onClick }) {
    const { lang, t } = useApp();
    return <Reveal as="button" className="card svc" delay={index % 3 * .06} onClick={onClick}>
        <div className="im"><img src={`/images/${service.image}.jpg`} alt={service.name[lang]} loading="lazy"/></div>
        <i className="ic"><Icon n={icons[index]} s={20}/></i><div className="bd"><h3>{service.name[lang]}</h3><p>{service.desc[lang]}</p><u>{t('learn')} <Icon n="arrow" s={16}/></u></div>
    </Reveal>;
}
