import { Link } from 'react-router-dom'; import { useApp } from '../store'; import Stars from './Stars'; import Reveal from './Reveal'; import Icon from './Icon';
export default function ProductCard({ p, i = 0 }) {
    const { t, pname, pdesc, money, addToCart, favs, toggleFav, rating } = useApp(); const r = rating(p.id); const fav = favs.includes(p.id); const img = p.image?.startsWith('http') ? p.image : `/images/${p.image}.jpg`;
    return <Reveal className="card pc" delay={(i % 4) * .06}><button className={`heart ${fav ? 'on' : ''}`} onClick={() => toggleFav(p.id)} aria-pressed={fav} aria-label={t('favs')}><Icon n="heart" s={16} /></button>
        <Link to={`/shop/${p.id}`} className="im"><img src={img} alt={pname(p)} loading="lazy" /></Link>
        <div className="bd"><h3><Link to={`/shop/${p.id}`}>{pname(p)}</Link></h3><p>{pdesc(p)}</p>{r.n > 0 && <Stars value={r.avg} />}
            <div className="pf"><b>{money(p.price)}</b><button className="btn sm" disabled={p.stock < 1} onClick={() => addToCart(p.id)}>{p.stock < 1 ? t('out') : t('add')}</button></div></div></Reveal>
}
