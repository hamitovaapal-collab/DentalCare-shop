import { productImage, isIllustration } from '../lib/productImages';
import ProductImage from '../components/ProductImage';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp, commentOf } from '../store';
import Stars from '../components/Stars';
import ReviewForm from '../components/ReviewForm';
import NotFound from './NotFound';
import Button from '../components/Button';
import Icon from '../components/Icon';
import Modal from '../components/Modal';
import LoadingState from '../components/LoadingState';
export default function ProductDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, lang, products, productsReady, pname, pdesc, money, addToCart, items, favs, toggleFav, rating, reviews } = useApp();
    const [quantity, setQuantity] = useState(1);
    const [zoom, setZoom] = useState(false);
    if (!productsReady) return <section className="sec page-top"><div className="wrap"><LoadingState/></div></section>;
    const product = products.find(p => p.id === id && p.active !== false);
    if (!product) return <NotFound/>;
    const image = productImage(product);
    const current = items.find(item => item.id === id)?.qty || 0;
    const limit = Math.max(0, Math.min(50, product.stock));
    const full = current >= limit;
    const review = rating(id);
    return <section className="sec page-top"><div className="wrap">
        <nav className="breadcrumbs" aria-label={t('breadcrumbs')}><Link to="/">{t('home')}</Link><span>/</span><Link to="/shop">{t('shop')}</Link><span>/</span><span>{pname(product)}</span></nav>
        <Button className="sm" variant="secondary" onClick={() => navigate('/shop')}>← {t('back')}</Button>
        <div className="pd-grid"><button type="button" className="product-image-button" onClick={() => setZoom(true)} aria-label={t('view_image')}><ProductImage src={image} alt={pname(product)}/><span><Icon n="search" s={15}/> {t('view_image')}</span></button>
            <div className="product-info"><p className="eyebrow">{t('c_' + product.category)}</p><h1>{pname(product)}</h1>{review.n > 0 && <p><Stars value={review.avg}/> <small>({review.n})</small></p>}
                <span className={`stock-line ${product.stock < 1 ? 'unavailable' : ''}`}>{product.stock > 0 ? t('stock') : t('out')}</span><p className="price">{money(product.price)}</p>
                <div className="product-description"><h3>{t('desc')}</h3><p>{pdesc(product)}</p>{isIllustration(product) && <p className="note" style={{marginTop:16}}>{t('illustration_note')}</p>}</div>
                <p className="eyebrow">{t('quantity')}</p><div className="qty"><button type="button" disabled={quantity <= 1} onClick={() => setQuantity(q => Math.max(1, q - 1))} aria-label="−">−</button><span>{quantity}</span><button type="button" disabled={quantity >= limit} onClick={() => setQuantity(q => Math.min(limit, q + 1))} aria-label="+">+</button></div>
                <div className="cta"><Button disabled={limit < 1 || full} onClick={() => addToCart(id, quantity)}><Icon n="cart" s={18}/>{t('add')}</Button><Button variant="secondary" disabled={limit < 1} onClick={() => { if (!full) addToCart(id, quantity); navigate('/cart'); }}>{t('buy')}</Button><Button variant="secondary" aria-pressed={favs.includes(id)} onClick={() => toggleFav(id)}><Icon n="heart" s={18}/>{t('favs')}</Button></div>
                {full && limit > 0 && <p className="note" style={{marginTop: 18}}>{t('max_qty')}</p>}
            </div>
        </div>
        <h2 style={{marginTop: 64}}>{t('reviews_for')}</h2><div className="grid3">{reviews.filter(r => r.product_id === id).map(r => <div key={r.id} className="card"><div className="bd"><Stars value={r.rating}/><p>{commentOf(r, lang)}</p><small>{r.author}</small></div></div>)}</div>
        {!reviews.some(r => r.product_id === id) && <p className="sub">{t('no_rv')}</p>}<ReviewForm productId={id}/>
        <Modal open={zoom} onClose={() => setZoom(false)}><ProductImage src={image} alt={pname(product)}/><div className="pd"><h2>{pname(product)}</h2><p>{pdesc(product)}</p></div></Modal>
    </div></section>;
}
