import { useState } from 'react'; import { Link } from 'react-router-dom'; import { useApp } from '../store'; import { supabase } from '../lib/supabase'; import Stars from './Stars';
export default function ReviewForm({ productId = null, choose = false }) {
    const { t, user, profile, products, pname, loadReviews, notify } = useApp(); const [r, setR] = useState(0); const [c, setC] = useState(''); const [pid, setPid] = useState(productId || ''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
    if (!supabase) return <p className="note">{t('no_db')}</p>;
    if (!user) return <p><Link className="btn sm" to="/login">{t('rv_login')}</Link></p>;
    const send = async e => {
        e.preventDefault(); setErr(''); if (r < 1) return setErr(t('e_rate')); if (c.trim().length < 5) return setErr(t('e_cmt')); setBusy(true);
        const { error } = await supabase.from('reviews').insert({ user_id: user.id, product_id: pid || null, author: profile?.full_name || user.email.split('@')[0], rating: r, comment: c.trim().slice(0, 1000) });
        setBusy(false); if (error) return setErr(t('e_srv')); setR(0); setC(''); await loadReviews(); notify(t('rv_ok'))
    };
    return <form className="rvform" onSubmit={send} noValidate><h3>{t('rv_write')}</h3><Stars value={r} onChange={setR} size="1.6rem" />
        {choose && <label><span>{t('prod_opt')}</span><select value={pid} onChange={e => setPid(e.target.value)}><option value="">—</option>{products.map(p => <option key={p.id} value={p.id}>{pname(p)}</option>)}</select></label>}
        <label><span>{t('comment')}</span><textarea rows="3" value={c} onChange={e => setC(e.target.value)} maxLength="1000" /></label>{err && <p className="bad-msg" role="alert">{err}</p>}<button className="btn" disabled={busy}>{t('submit')}</button></form>
}
