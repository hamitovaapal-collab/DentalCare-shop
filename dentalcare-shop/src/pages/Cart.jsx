import { productImage } from '../lib/productImages';
import ProductImage from '../components/ProductImage';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import PageHeading from '../components/PageHeading';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import Button from '../components/Button';
import Icon from '../components/Icon';
export default function Cart() {
    const { t, items, unavailableCart, total, money, pname, setQty, removeItem, productsReady } = useApp();
    const navigate = useNavigate();
    return <section className="sec page-top"><div className="wrap"><PageHeading title={t('cart')} description={items.length ? t('checkout_intro') : undefined}/>
        {!productsReady ? <LoadingState/> : !items.length && !unavailableCart.length ? <EmptyState title={t('cart_empty')} description={t('empty_cart_intro')}><Link to="/shop" className="btn">{t('cont')} <Icon n="arrow" s={18}/></Link></EmptyState> : <div className="cart-grid"><div>{unavailableCart.length > 0 && <p className="note" style={{marginBottom:16}}>{t('unavailable_cart_notice')}</p>}{unavailableCart.map(item => <div className="row unavailable" key={item.id}><span className="ico"><Icon n="cart"/></span><div className="rt"><b>{item.p ? pname(item.p) : t('unavailable_product')}</b><span>{t('out')}</span></div><button type="button" className="rm" onClick={() => removeItem(item.id)} aria-label={t('remove')}><Icon n="trash" s={19}/></button></div>)}{items.map(({p, qty}) => {
            const image = productImage(p);
            return <div className="row" key={p.id}><Link to={`/shop/${p.id}`}><ProductImage src={image} alt={pname(p)}/></Link><div className="rt"><Link to={`/shop/${p.id}`}><b>{pname(p)}</b></Link><span>{money(p.price)}</span></div>
                <div className="qty"><button type="button" onClick={() => setQty(p.id, qty - 1)} aria-label="−">−</button><span>{qty}</span><button type="button" disabled={qty >= Math.min(50, p.stock)} onClick={() => setQty(p.id, qty + 1)} aria-label="+">+</button></div><b className="rs">{money(p.price * qty)}</b><button type="button" className="rm" onClick={() => removeItem(p.id)} aria-label={t('remove')} title={t('remove')}><Icon n="trash" s={19}/></button></div>;
        })}<Link to="/shop" className="btn sm ghost-d">← {t('cont')}</Link></div>
        <aside className="sum"><h3>{t('total')}</h3><p className="price">{money(total)}</p><Button disabled={!items.length} onClick={() => navigate('/checkout')}>{t('checkout')} <Icon n="arrow" s={18}/></Button></aside></div>}
    </div></section>;
}
