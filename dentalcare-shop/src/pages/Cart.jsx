import { Link, useNavigate } from 'react-router-dom'; import { useApp } from '../store';
export default function Cart() {
    const { t, items, total, money, pname, setQty, removeItem } = useApp(); const nav = useNavigate();
    return <section className="sec page-top"><div className="wrap"><h2>{t('cart')}</h2>
        {!items.length ? <div className="empty"><p>{t('cart_empty')}</p><Link to="/shop" className="btn">{t('cont')}</Link></div> : <div className="cart-grid"><div>{items.map(({ p, qty }) => {
            const img = p.image?.startsWith('http') ? p.image : `/images/${p.image}.jpg`; return <div className="row" key={p.id}>
                <Link to={`/shop/${p.id}`}><img src={img} alt={pname(p)} /></Link><div className="rt"><Link to={`/shop/${p.id}`}><b>{pname(p)}</b></Link><span>{money(p.price)}</span></div>
                <div className="qty"><button onClick={() => setQty(p.id, qty - 1)} aria-label="−">−</button><span>{qty}</span><button onClick={() => setQty(p.id, qty + 1)} aria-label="+">+</button></div><b className="rs">{money(p.price * qty)}</b><button className="rm" onClick={() => removeItem(p.id)} aria-label={t('remove')} title={t('remove')}>×</button></div>
        })}
            <Link to="/shop" className="btn sm ghost-d">← {t('cont')}</Link></div>
            <aside className="sum"><h3>{t('total')}</h3><p className="price">{money(total)}</p><button className="btn" onClick={() => nav('/checkout')}>{t('checkout')}</button></aside></div>}</div></section>
}
