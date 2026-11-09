import { Link } from 'react-router-dom';
import { useApp } from '../store';
export default function PageHeading({ title, eyebrow, description, children }) {
    const { t } = useApp();
    return <div className="page-heading">
        <nav className="breadcrumbs" aria-label={t('breadcrumbs')}><Link to="/">{t('home')}</Link><span aria-hidden="true">/</span><span>{title}</span></nav>
        <div className="heading-row"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="sub">{description}</p>}</div>{children}</div>
    </div>;
}
