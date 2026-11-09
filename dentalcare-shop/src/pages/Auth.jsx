import { internalRedirect } from '../lib/navigation';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { useState } from 'react'; import { Link, useNavigate, useSearchParams } from 'react-router-dom'; import { useApp } from '../store'; import { supabase } from '../lib/supabase';
const mail = e => /^\S+@\S+\.\S+$/.test(e);
function Shell({ title, children }) { const { t } = useApp(); return <section className="sec auth-wrap"><div className="wrap">{!supabase ? <EmptyState icon="user" title={title} description={t('auth_unavailable')}><Link className="btn" to="/shop">{t('shop')}</Link><Link className="btn ghost-d" to="/contact">{t('contact')}</Link></EmptyState> : <div className="auth"><p className="eyebrow">DentalCare</p><h1>{title}</h1>{children}</div>}</div></section> }
function useForm(init, run) {
  const { t } = useApp(); const [f, setF] = useState(init); const [err, setErr] = useState(''); const [ok, setOk] = useState(''); const [busy, setBusy] = useState(false);
  return { f, err, ok, busy, ch: e => setF({ ...f, [e.target.name]: e.target.value }), submit: async e => { e.preventDefault(); setErr(''); setOk(''); setBusy(true); try { await run(f, setErr, setOk) } catch { setErr(t('e_net')) } setBusy(false) } }
}
const Msg = ({ err, ok }) => <>{err && <p className="bad-msg" role="alert">{err}</p>}{ok && <p className="ok" role="status">{ok}</p>}</>;
export function Login() {
  const { t } = useApp(); const nav = useNavigate(); const [params] = useSearchParams(); const redirect = params.get('redirect'); const destination = internalRedirect(redirect);
  const F = useForm({ email: '', password: '' }, async (f, e) => { if (!mail(f.email)) return e(t('e_email')); if (f.password.length < 6) return e(t('pw_short')); const { error } = await supabase.auth.signInWithPassword(f); error ? e(t('e_login')) : nav(destination) });
  return <Shell title={t('login')}><form onSubmit={F.submit} noValidate><label><span>{t('email')}</span><input name="email" type="email" value={F.f.email} onChange={F.ch} autoComplete="email" /></label><label><span>{t('password')}</span><input name="password" type="password" value={F.f.password} onChange={F.ch} autoComplete="current-password" /></label><Msg {...F} />
    <Button type="submit" busy={F.busy}>{t('login')}</Button><Link to="/forgot">{t('forgot')}</Link><Link to="/register">{t('no_acc')}</Link></form></Shell>
}
export function Register() {
  const { t } = useApp(); const nav = useNavigate();
  const F = useForm({ name: '', email: '', password: '' }, async (f, e, o) => {
    if (f.name.trim().length < 2) return e(t('e_req')); if (!mail(f.email)) return e(t('e_email')); if (f.password.length < 6) return e(t('pw_short'));
    const { data, error } = await supabase.auth.signUp({ email: f.email, password: f.password, options: { data: { full_name: f.name.trim() } } }); if (error) return e(error.message); data.session ? nav('/profile') : o(t('check_mail'))
  });
  return <Shell title={t('register')}><form onSubmit={F.submit} noValidate><label><span>{t('f_name')}</span><input name="name" value={F.f.name} onChange={F.ch} autoComplete="name" /></label><label><span>{t('email')}</span><input name="email" type="email" value={F.f.email} onChange={F.ch} autoComplete="email" /></label>
    <label><span>{t('password')}</span><input name="password" type="password" value={F.f.password} onChange={F.ch} autoComplete="new-password" /></label><Msg {...F} /><Button type="submit" busy={F.busy}>{t('register')}</Button><Link to="/login">{t('has_acc')}</Link></form></Shell>
}
export function Forgot() {
  const { t } = useApp();
  const F = useForm({ email: '' }, async (f, e, o) => { if (!mail(f.email)) return e(t('e_email')); const { error } = await supabase.auth.resetPasswordForEmail(f.email, { redirectTo: location.origin + '/reset-password' }); if (error) return e(t('e_srv')); o(t('reset_sent')) });
  return <Shell title={t('reset_t')}><form onSubmit={F.submit} noValidate><label><span>{t('email')}</span><input name="email" type="email" value={F.f.email} onChange={F.ch} /></label><Msg {...F} /><Button type="submit" busy={F.busy}>{t('reset_send')}</Button><Link to="/login">{t('login')}</Link></form></Shell>
}
export function Reset() {
  const { t, user, ready } = useApp(); const nav = useNavigate();
  const F = useForm({ password: '' }, async (f, e, o) => { if (f.password.length < 6) return e(t('pw_short')); const { error } = await supabase.auth.updateUser({ password: f.password }); if (error) return e(error.message); o(t('pw_ok')); setTimeout(() => nav('/profile'), 1500) });
  if (supabase && ready && !user) return <Shell title={t('reset_t')}><p className="note">{t('reset_expired')}</p><Link className="btn" to="/forgot">{t('reset_send')}</Link></Shell>;
  return <Shell title={t('reset_t')}><form onSubmit={F.submit} noValidate><label><span>{t('new_pw')}</span><input name="password" type="password" value={F.f.password} onChange={F.ch} autoComplete="new-password" /></label><Msg {...F} /><Button type="submit" busy={F.busy}>{t('save')}</Button></form></Shell>
}
