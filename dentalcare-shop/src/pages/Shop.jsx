import { useMemo, useState } from 'react'; import { useApp } from '../store'; import ProductCard from '../components/ProductCard';
export default function Shop() {
    const { t, products, pname } = useApp(); const [q, setQ] = useState(''); const [cat, setCat] = useState('all'); const [sort, setSort] = useState('new');
    const list = useMemo(() => { let l = products.filter(p => (cat === 'all' || p.category === cat) && pname(p).toLowerCase().includes(q.trim().toLowerCase())); if (sort === 'asc') l = [...l].sort((a, b) => a.price - b.price); if (sort === 'desc') l = [...l].sort((a, b) => b.price - a.price); return l }, [products, q, cat, sort, pname]);
    return <section className="sec page-top"><div className="wrap"><h2>{t('shop_t')}</h2>
        <div className="shop-bar"><input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t('search')} aria-label={t('search')} />
            <div className="chips fl">{['all', 'care', 'whitening', 'kids'].map(c => <button key={c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>{c === 'all' ? t('all') : t('c_' + c)}</button>)}</div>
            <select value={sort} onChange={e => setSort(e.target.value)} aria-label={t('sort')}><option value="new">{t('s_new')}</option><option value="asc">{t('s_asc')}</option><option value="desc">{t('s_desc')}</option></select></div>
        {list.length ? <div className="grid4">{list.map((p, i) => <ProductCard key={p.id} p={p} i={i} />)}</div> : <p className="sub">{products.length ? t('none') : t('shop_empty')}</p>}</div></section>
}
