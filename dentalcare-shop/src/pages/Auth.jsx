import { useState } from 'react'; import { Link, useNavigate } from 'react-router-dom'; import { useApp } from '../store'; import { supabase } from '../lib/supabase';
const mail = e => /^\S+@\S+\.\S+$/.test(e);
function Shell({ title, children }) { const { t } = useApp(); return <section className="sec auth-wrap"><div className="wrap">{!supabase ? <div className="err">{t('no_db')}</div> : <div className="auth"><h2>{title}</h2>{children}</div>}</div></section> }
function useForm(init, run) {
  const { t } = useApp(); const [f, setF] = useState(init); const [err, setErr] = useState(''); const [ok, setOk] = useState(''); const [busy, setBusy] = useState(false);
  return { f, err, ok, busy, ch: e => setF({ ...f, [e.target.name]: e.target.value }), submit: async e => { e.preventDefault(); setErr(''); setOk(''); setBusy(true); try { await run(f, setErr, setOk) } catch { setErr(t('e_net')) } setBusy(false) } }
}
const Msg = ({ err, ok }) => <>{err && <p className="bad-msg" role="alert">{err}</p>}{ok && <p className="ok" role="status">{ok}</p>}</>;
export function Login() {
  const { t } = useApp(); const nav = useNavigate();
  const F = useForm({ email: '', password: '' }, async (f, e) => { if (!mail(f.email)) return e(t('e_email')); if (f.password.length < 6) return e(t('pw_short')); const { error } = await supabase.auth.signInWithPassword(f); error ? e(t('e_login')) : nav('/profile') });
  return <Shell title={t('login')}><form onSubmit={F.submit} noValidate><label><span>{t('email')}</span><input name="email" type="email" value={F.f.email} onChange={F.ch} autoComplete="email" /></label><label><span>{t('password')}</span><input name="password" type="password" value={F.f.password} onChange={F.ch} autoComplete="current-password" /></label><Msg {...F} />
    <button className="btn" disabled={F.busy}>{t('login')}</button><Link to="/forgot">{t('forgot')}</Link><Link to="/register">{t('no_acc')}</Link></form></Shell>
}
export function Register() {
  const { t } = useApp(); const nav = useNavigate();
  const F = useForm({ name: '', email: '', password: '' }, async (f, e, o) => {
    if (f.name.trim().length < 2) return e(t('e_req')); if (!mail(f.email)) return e(t('e_email')); if (f.password.length < 6) return e(t('pw_short'));
    const { data, error } = await supabase.auth.signUp({ email: f.email, password: f.password, options: { data: { full_name: f.name.trim() } } }); if (error) return e(error.message); data.session ? nav('/profile') : o(t('check_mail'))
  });
  return <Shell title={t('register')}><form onSubmit={F.submit} noValidate><label><span>{t('f_name')}</span><input name="name" value={F.f.name} onChange={F.ch} autoComplete="name" /></label><label><span>{t('email')}</span><input name="email" type="email" value={F.f.email} onChange={F.ch} autoComplete="email" /></label>
    <label><span>{t('password')}</span><input name="password" type="password" value={F.f.password} onChange={F.ch} autoComplete="new-password" /></label><Msg {...F} /><button className="btn" disabled={F.busy}>{t('register')}</button><Link to="/login">{t('has_acc')}</Link></form></Shell>
}
export function Forgot() {
  const { t } = useApp();
  const F = useForm({ email: '' }, async (f, e, o) => { if (!mail(f.email)) return e(t('e_email')); await supabase.auth.resetPasswordForEmail(f.email, { redirectTo: location.origin + '/reset-password' }); o(t('reset_sent')) });
  return <Shell title={t('reset_t')}><form onSubmit={F.submit} noValidate><label><span>{t('email')}</span><input name="email" type="email" value={F.f.email} onChange={F.ch} /></label><Msg {...F} /><button className="btn" disabled={F.busy}>{t('reset_send')}</button><Link to="/login">{t('login')}</Link></form></Shell>
}
export function Reset() {
  const { t } = useApp(); const nav = useNavigate();
  const F = useForm({ password: '' }, async (f, e, o) => { if (f.password.length < 6) return e(t('pw_short')); const { error } = await supabase.auth.updateUser({ password: f.password }); if (error) return e(error.message); o(t('pw_ok')); setTimeout(() => nav('/profile'), 1500) });
  return <Shell title={t('reset_t')}><form onSubmit={F.submit} noValidate><label><span>{t('new_pw')}</span><input name="password" type="password" value={F.f.password} onChange={F.ch} autoComplete="new-password" /></label><Msg {...F} /><button className="btn" disabled={F.busy}>{t('save')}</button></form></Shell>
}
