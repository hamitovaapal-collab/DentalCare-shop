import { useEffect, useState } from 'react'; import { Link } from 'react-router-dom'; import { useApp } from '../store'; import { supabase } from '../lib/supabase'; import Skeleton from '../components/Skeleton';
export default function Orders() {
    const { t, money, user } = useApp(); const [o, setO] = useState(null); const [err, setErr] = useState(false);
    useEffect(() => { supabase.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data, error }) => error ? setErr(true) : setO(data)) }, [user]);
    return <section className="sec page-top"><div className="wrap"><h2>{t('orders')}</h2>{err ? <div className="err">{t('e_srv')}</div> : !o ? <Skeleton h={160} /> : !o.length ? <div className="empty"><p>{t('no_orders')}</p><Link to="/shop" className="btn">{t('shop')}</Link></div> :
        o.map(x => <div className="card ord" key={x.id}><div className="bd"><b>#{x.id.slice(0, 8)}</b> · {new Date(x.created_at).toLocaleDateString()} · <span className="role">{t(x.status)}</span>{x.items.map((i, k) => <p key={k}>{i.name} × {i.qty}</p>)}<b>{t('total')}: {money(x.total)}</b></div></div>)}</div></section>
}
