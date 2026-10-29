import { Link } from 'react-router-dom'; import { useApp } from '../store';
export default function NotFound() { const { t } = useApp(); return <section className="sec auth-wrap"><div className="wrap" style={{ textAlign: 'center' }}><h2>404 — {t('nf')}</h2><Link className="btn" to="/">{t('home')}</Link></div></section> }
