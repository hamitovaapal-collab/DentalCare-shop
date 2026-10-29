import { Link } from 'react-router-dom'; import { useApp } from '../store'; import ProductCard from '../components/ProductCard';
export default function Favorites() {
    const { t, products, favs } = useApp(); const l = products.filter(p => favs.includes(p.id));
    return <section className="sec page-top"><div className="wrap"><h2>{t('favs')}</h2>{l.length ? <div className="grid4">{l.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}</div> : <div className="empty"><p>{t('fav_empty')}</p><Link to="/shop" className="btn">{t('shop')}</Link></div>}</div></section>
}
