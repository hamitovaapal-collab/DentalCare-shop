import { useApp, commentOf } from '../store'; import Stars from '../components/Stars'; import ReviewForm from '../components/ReviewForm';
export default function Reviews() {
    const { t, lang, reviews, rating, products, pname } = useApp(); const a = rating();
    return <section className="sec page-top"><div className="wrap"><h2>{t('rv_page')}</h2>
        <div className="avgbox"><b>{a.avg.toFixed(1)}</b><div><Stars value={a.avg} size="1.4rem" /><p>{t('avg')} · {a.n}</p></div><div className="dist">{[5, 4, 3, 2, 1].map(s => { const c = reviews.filter(r => r.rating === s).length; return <p key={s}><span>{s}★</span><i><u style={{ width: (a.n ? c / a.n * 100 : 0) + '%' }} /></i><span>{c}</span></p> })}</div></div>
        <div className="grid3">{reviews.map(r => { const p = products.find(x => x.id === r.product_id); return <div key={r.id} className="card"><div className="bd"><Stars value={r.rating} /><p>{commentOf(r, lang)}</p><small>{r.author}{p ? ` · ${pname(p)}` : ''}</small></div></div> })}</div>{!reviews.length && <p className="sub">{t('no_rv')}</p>}
        <ReviewForm choose /></div></section>
}
