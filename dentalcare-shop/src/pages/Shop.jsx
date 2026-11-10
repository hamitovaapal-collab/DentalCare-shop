import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../store';
import ProductCard from '../components/ProductCard';
import PageHeading from '../components/PageHeading';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import Button from '../components/Button';
const categories = ['all', 'care', 'whitening', 'kids'];
export default function Shop() {
    const { t, products, productsReady, dataError, retryData } = useApp();
    const [params, setParams] = useSearchParams();
    const q = params.get('q') || '';
    const cat = categories.includes(params.get('category')) ? params.get('category') : 'all';
    const sort = ['new', 'asc', 'desc'].includes(params.get('sort')) ? params.get('sort') : 'new';
    const update = (key, value) => setParams(previous => { const next = new URLSearchParams(previous); value && value !== 'all' && value !== 'new' ? next.set(key, value) : next.delete(key); return next; }, { replace: true });
    const list = useMemo(() => {
        let result = products.filter(p => p.active !== false && (cat === 'all' || p.category === cat) && Object.values(p.name || {}).some(name => name.toLowerCase().includes(q.trim().toLowerCase())));
        if (sort !== 'new') result = [...result].sort((a, b) => sort === 'asc' ? a.price - b.price : b.price - a.price);
        return result;
    }, [products, q, cat, sort]);
    return <section className="sec page-top"><div className="wrap">
        <PageHeading title={t('shop_t')} description={t('collection_intro')}/>
        <div className="catalog-layout">
            <aside className="shop-bar" aria-label={t('search')}>
                <input type="search" value={q} onChange={e => update('q', e.target.value)} placeholder={t('search')} aria-label={t('search')}/>
                <div className="chips fl">{categories.map(c => <button type="button" key={c} aria-pressed={cat === c} className={cat === c ? 'on' : ''} onClick={() => update('category', c)}>{c === 'all' ? t('all') : t('c_' + c)}</button>)}</div>
            </aside>
            <div className="catalog-results">
                <div className="catalog-meta">
                    <span role="status">{t('catalog_count', { count: list.length })}</span>
                    {(q || cat !== 'all' || sort !== 'new') && <button type="button" onClick={() => setParams({})}>{t('reset_filters')}</button>}
                    <label className="catalog-sort"><span>{t('sort')}</span><select value={sort} onChange={e => update('sort', e.target.value)} aria-label={t('sort')}><option value="new">{t('s_new')}</option><option value="asc">{t('s_asc')}</option><option value="desc">{t('s_desc')}</option></select></label>
                </div>
                {!productsReady ? <LoadingState cards/> : dataError && !products.length ? <EmptyState icon="search" title={t('data_error')}><Button onClick={retryData}>{t('retry')}</Button></EmptyState> : list.length ? <div className="grid4">{list.map((p, i) => <ProductCard key={p.id} p={p} i={i}/>)}</div> : <EmptyState icon="search" title={t('none')} description={t('empty_search')}><Button variant="secondary" onClick={() => setParams({})}>{t('reset_filters')}</Button></EmptyState>}
            </div>
        </div>
    </div></section>;
}
