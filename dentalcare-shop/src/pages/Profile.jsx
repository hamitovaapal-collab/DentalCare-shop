import { useState } from 'react'; import { Link, useNavigate } from 'react-router-dom'; import { useApp } from '../store'; import { supabase } from '../lib/supabase';
export default function Profile() {
    const { t, user, profile, isAdmin, loadProfile, logout, notify } = useApp(); const nav = useNavigate(); const [name, setName] = useState(profile?.full_name || ''); const [phone, setPhone] = useState(profile?.phone || ''); const [err, setErr] = useState('');
    const save = async e => {
        e.preventDefault(); setErr(''); if (name.trim().length < 2) return setErr(t('e_req')); if (phone && !/^\+?[\d\s()-]{7,18}$/.test(phone)) return setErr(t('e_ph'));
        const { error } = await supabase.from('profiles').update({ full_name: name.trim(), phone: phone.trim() }).eq('id', user.id); if (error) return setErr(t('e_srv')); await loadProfile(); notify(t('saved'))
    };
    return <section className="sec auth-wrap"><div className="wrap"><form className="auth" onSubmit={save} noValidate><h2>{t('mine')}</h2><p>{user.email} · <span className="role">{profile?.role}</span></p>
        <label><span>{t('f_name')}</span><input value={name} onChange={e => setName(e.target.value)} /></label><label><span>{t('phone_l')}</span><input value={phone} onChange={e => setPhone(e.target.value)} type="tel" /></label>{err && <p className="bad-msg">{err}</p>}
        <button className="btn">{t('save')}</button><Link className="btn sm ghost-d" to="/orders">{t('orders')}</Link>{isAdmin && <Link className="btn sm ghost-d" to="/admin">{t('adm')}</Link>}<button type="button" className="btn sm ghost-d" onClick={async () => { await logout(); nav('/') }}>{t('logout')}</button></form></div></section>
}
