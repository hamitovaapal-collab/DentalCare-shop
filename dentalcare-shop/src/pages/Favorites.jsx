import { Link } from 'react-router-dom';
import { useApp } from '../store';
import ProductCard from '../components/ProductCard';
import PageHeading from '../components/PageHeading';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
export default function Favorites() {
    const { t, products, productsReady, favs } = useApp();
    const list = products.filter(p => p.active !== false && favs.includes(p.id));
    return <section className="sec page-top"><div className="wrap"><PageHeading title={t('favs')}/>
        {!productsReady ? <LoadingState cards/> : list.length ? <div className="grid4">{list.map((p, i) => <ProductCard key={p.id} p={p} i={i}/>)}</div> : <EmptyState icon="heart" title={t('fav_empty')} description={t('empty_favorites_intro')}><Link to="/shop" className="btn">{t('shop')}</Link></EmptyState>}
    </div></section>;
}
