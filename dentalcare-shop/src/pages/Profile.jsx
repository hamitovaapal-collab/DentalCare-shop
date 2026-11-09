import PageHeading from '../components/PageHeading';
import Button from '../components/Button';
import { useEffect, useState } from 'react'; import { Link, useNavigate } from 'react-router-dom'; import { useApp } from '../store'; import { supabase } from '../lib/supabase';
export default function Profile() {
    const { t, user, profile, isAdmin, loadProfile, logout, notify } = useApp(); const nav = useNavigate(); const [name, setName] = useState(profile?.full_name || ''); const [phone, setPhone] = useState(profile?.phone || ''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
    useEffect(() => { setName(profile?.full_name || ''); setPhone(profile?.phone || ''); }, [profile]);
    const save = async e => {
        e.preventDefault(); setErr(''); if (name.trim().length < 2) return setErr(t('e_req')); if (phone && !/^\+?[\d\s()-]{7,18}$/.test(phone)) return setErr(t('e_ph'));
        setBusy(true);
        try { const { error } = await supabase.from('profiles').update({ full_name: name.trim(), phone: phone.trim() }).eq('id', user.id); if (error) throw error; await loadProfile(); notify(t('saved')); }
        catch { setErr(t('e_srv')); }
        finally { setBusy(false); }
    };
    return <section className="sec auth-wrap"><div className="wrap"><PageHeading title={t('mine')} description={t('profile_intro')}/><form className="auth" onSubmit={save} noValidate><p>{user.email} · <span className="role">{profile?.role}</span></p>
        <label><span>{t('f_name')}</span><input value={name} onChange={e => setName(e.target.value)} /></label><label><span>{t('phone_l')}</span><input value={phone} onChange={e => setPhone(e.target.value)} type="tel" /></label>{err && <p className="bad-msg">{err}</p>}
        <Button type="submit" busy={busy}>{t('save')}</Button><Link className="btn sm ghost-d" to="/orders">{t('orders')}</Link>{isAdmin && <Link className="btn sm ghost-d" to="/admin">{t('adm')}</Link>}<button type="button" className="btn sm ghost-d" onClick={async () => { try { await logout(); nav('/'); } catch { setErr(t('e_srv')); } }}>{t('logout')}</button></form></div></section>
}
