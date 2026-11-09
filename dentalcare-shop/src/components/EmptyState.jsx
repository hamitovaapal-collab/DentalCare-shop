import Icon from './Icon';
export default function EmptyState({ icon = 'cart', title, description, children }) {
    return <div className="empty"><span className="empty-icon"><Icon n={icon} s={32} /></span><h2>{title}</h2>{description && <p>{description}</p>}<div className="cta">{children}</div></div>;
}
