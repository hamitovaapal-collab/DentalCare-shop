import { productImage, isIllustration } from '../lib/productImages';
import ProductImage from './ProductImage';
import { Link } from 'react-router-dom';
import { useApp } from '../store';
import Stars from './Stars';
import Reveal from './Reveal';
import Icon from './Icon';
import Button from './Button';
export default function ProductCard({ p, i = 0 }) {
    const { t, pname, pdesc, money, addToCart, items, favs, toggleFav, rating } = useApp();
    const r = rating(p.id);
    const fav = favs.includes(p.id);
    const image = productImage(p);
    const inCart = items.find(item => item.id === p.id)?.qty || 0;
    const full = inCart >= Math.min(50, p.stock);
    return <Reveal className="card pc" delay={i % 4 * .04}>
        <button type="button" className={`heart ${fav ? 'on' : ''}`} onClick={() => toggleFav(p.id)} aria-pressed={fav} aria-label={t('favs')}><Icon n="heart" s={19}/></button>
        <Link to={`/shop/${p.id}`} className="im"><ProductImage src={image} alt={pname(p)} loading="lazy"/>{isIllustration(p) && <span className="image-caption">{t('illustration')}</span>}</Link>
        <div className="bd"><span className="pc-category">{t('c_' + p.category)}</span><h3><Link to={`/shop/${p.id}`}>{pname(p)}</Link></h3><p>{pdesc(p)}</p>
            <span className={`stock-line ${p.stock < 1 ? 'unavailable' : ''}`}>{p.stock > 0 ? t('stock') : t('out')}</span>{r.n > 0 && <Stars value={r.avg}/>}
            <div className="pf"><b>{money(p.price)}</b><Button className="sm" disabled={p.stock < 1 || full} onClick={() => addToCart(p.id)} title={full ? t('max_qty') : undefined}><Icon n={full ? 'check' : 'cart'} s={18}/>{p.stock < 1 ? t('out') : full ? t('added_short') : t('add')}</Button></div>
        </div>
    </Reveal>;
}
