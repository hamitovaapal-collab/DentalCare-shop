import Button from '../components/Button';
import { useConfirm } from '../components/ConfirmDialog';
import PageHeading from '../components/PageHeading';
import { useCallback, useEffect, useState } from 'react'; import { useApp } from '../store'; import { supabase } from '../lib/supabase'; import Skeleton from '../components/Skeleton';
const TABS = ['stats', 'orders', 'bookings', 'shop', 'users', 'reviews']; const ST = ['new', 'paid', 'canceled'];
function useTable(name) {
  const [rows, setRows] = useState(null); const [err, setErr] = useState(false);
  const load = useCallback(async () => { setErr(false); try { const { data, error } = await supabase.from(name).select('*').order('created_at', { ascending: false }); if (error) throw error; setRows(data); } catch { setErr(true); } }, [name]); useEffect(() => { load() }, [load]); return { rows, err, load }
}
function Wrap({ tb, children }) { const { t } = useApp(); return tb.err ? <div className="err">{t('e_srv')}</div> : !tb.rows ? <Skeleton h={200} /> : <div className="tbl" role="region" aria-label={t('adm')} tabIndex="0">{children(tb.rows)}</div> }
function StatusSel({ table, row, reload }) {
  const { t, notify, loadProducts } = useApp(); const [busy, setBusy] = useState(false);
  return <select disabled={busy} aria-busy={busy} aria-label={t('status')}  value={row.status} onChange={async e => { const status = e.target.value; setBusy(true); try { const { error } = await supabase.from(table).update({ status }).eq('id', row.id); if (error) throw error; notify(t('ok')); await Promise.all([reload(), loadProducts()]); } catch (error) { notify(error.message === 'items' ? t('e_stock') : t('e_srv'), 'err'); } finally { setBusy(false); } }}>{ST.map(s => <option key={s} value={s}>{t(s)}</option>)}</select>
}
function Stats() {
  const { t, money } = useApp(); const o = useTable('orders'), b = useTable('bookings'), r = useTable('reviews'), u = useTable('profiles');
  if ([o, b, r, u].some(tb => tb.err)) return <p className="err" role="alert">{t('e_srv')}</p>;
  if (!o.rows || !b.rows || !r.rows || !u.rows) return <Skeleton h={200} />; const rev = o.rows.filter(x => x.status !== 'canceled').reduce((s, x) => s + Number(x.total), 0); const mx = Math.max(1, ...ST.map(s => o.rows.filter(x => x.status === s).length));
  return <><div className="kpis">{[[t('orders'), o.rows.length], [t('booking'), b.rows.length], [t('users'), u.rows.length], [t('reviews'), r.rows.length], [t('revenue'), money(rev)]].map(([k, v]) => <div key={k} className="kpi"><span>{k}</span><b>{v}</b></div>)}</div>
    <h3>{t('orders')} / {t('status')}</h3>{ST.map(s => { const c = o.rows.filter(x => x.status === s).length; return <p key={s} className="bar"><span>{t(s)}</span><i><u style={{ width: c / mx * 100 + '%' }} /></i><b>{c}</b></p> })}</>
}
function Orders() { const { t, money } = useApp(); const tb = useTable('orders'); return <Wrap tb={tb}>{rows => <table><thead><tr><th>#</th><th>{t('f_name')}</th><th>{t('f_phone')}</th><th>{t('cart')}</th><th>{t('total')}</th><th>{t('status')}</th></tr></thead><tbody>{rows.map(x => <tr key={x.id}><td>{x.id.slice(0, 8)}</td><td>{x.name}<br /><small>{x.email}</small></td><td>{x.phone}</td><td>{x.items.map(i => `${i.name}×${i.qty}`).join(', ')}</td><td>{money(x.total)}</td><td><StatusSel table="orders" row={x} reload={tb.load} /></td></tr>)}</tbody></table>}</Wrap> }
function Bookings() { const { t } = useApp(); const tb = useTable('bookings'); return <Wrap tb={tb}>{rows => <table><thead><tr><th>#</th><th>{t('f_name')}</th><th>{t('f_phone')}</th><th>{t('f_svc')}</th><th>{t('f_date')}</th><th>{t('status')}</th></tr></thead><tbody>{rows.map(x => <tr key={x.id}><td>{x.id.slice(0, 8)}</td><td>{x.name}<br /><small>{x.email}</small></td><td>{x.phone}</td><td>{x.service}</td><td>{x.date} {x.time}</td><td><StatusSel table="bookings" row={x} reload={tb.load} /></td></tr>)}</tbody></table>}</Wrap> }
const EMPTY = { name_en: '', name_ru: '', name_ky: '', desc_en: '', desc_ru: '', desc_ky: '', price: '', category: 'care', image: '', stock: 0, active: true };
function ProductsAdmin() {
  const { t, notify, loadProducts, money } = useApp(); const confirm = useConfirm(); const [busy, setBusy] = useState(false); const [deleting, setDeleting] = useState(null); const tb = useTable('products'); const [f, setF] = useState(EMPTY); const [id, setId] = useState(null); const [err, setErr] = useState('');
  const ch = e => setF({ ...f, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const save = async e => {
    e.preventDefault(); setErr(''); if (!f.name_en.trim() || !Number.isFinite(+f.price) || !(+f.price >= 0) || f.price === '' || !Number.isInteger(+f.stock) || +f.stock < 0) return setErr(t('e_req'));
    const row = { name: { en: f.name_en, ru: f.name_ru || f.name_en, ky: f.name_ky || f.name_en }, description: { en: f.desc_en, ru: f.desc_ru || f.desc_en, ky: f.desc_ky || f.desc_en }, price: +f.price, category: f.category, image: f.image, stock: +f.stock || 0, active: f.active };
    setBusy(true);
    try {
      const { error } = id ? await supabase.from('products').update(row).eq('id', id) : await supabase.from('products').insert(row);
      if (error) throw error;
      setF(EMPTY); setId(null); notify(t('ok')); await Promise.all([tb.load(), loadProducts()]);
    } catch { setErr(t('e_srv')); } finally { setBusy(false); }
  };
  const edit = p => { setId(p.id); setF({ name_en: p.name.en, name_ru: p.name.ru, name_ky: p.name.ky, desc_en: p.description?.en || '', desc_ru: p.description?.ru || '', desc_ky: p.description?.ky || '', price: p.price, category: p.category, image: p.image || '', stock: p.stock, active: p.active }); scrollTo({ top: 0 }) };
  const del = async p => {
    if (!await confirm({ description: t('delete_product_warning') })) return;
    setDeleting(p.id);
    try { const { error } = await supabase.from('products').delete().eq('id', p.id); if (error) throw error; notify(t('ok')); await Promise.all([tb.load(), loadProducts()]); }
    catch { notify(t('e_srv'), 'err'); } finally { setDeleting(null); }
  };
  const I = (k, l, ty = 'text') => <label key={k}><span>{l}</span><input name={k} type={ty} value={f[k]} onChange={ch} /></label>;
  return <><form onSubmit={save} noValidate>{['en', 'ru', 'ky'].map(l => I('name_' + l, `${t('name_l')} (${l.toUpperCase()})`))}{['en', 'ru', 'ky'].map(l => I('desc_' + l, `${t('desc')} (${l.toUpperCase()})`))}
    {I('price', t('price_l'), 'number')}{I('stock', t('stock_l'), 'number')}{I('image', t('img_url'))}<label><span>{t('cat_l')}</span><select name="category" value={f.category} onChange={ch}>{['care', 'whitening', 'kids'].map(c => <option key={c} value={c}>{t('c_' + c)}</option>)}</select></label>
    <label className="chk"><input type="checkbox" name="active" checked={f.active} onChange={ch} /> {t('active')}</label>{err && <p className="bad-msg full">{err}</p>}<Button type="submit" className="full" busy={busy}>{t('p_new')}</Button>{id && <button type="button" className="btn ghost-d full" onClick={() => { setId(null); setF(EMPTY); setErr(''); }}>{t('back')}</button>}</form>
    <Wrap tb={tb}>{rows => <table><thead><tr><th>{t('name_l')}</th><th>{t('price_l')}</th><th>{t('stock_l')}</th><th>{t('active')}</th><th /></tr></thead><tbody>{rows.map(p => <tr key={p.id}><td>{p.name.en}</td><td>{money(p.price)}</td><td>{p.stock}</td><td>{p.active ? '✔' : '—'}</td><td><button className="btn sm" onClick={() => edit(p)}>{t('edit')}</button> <Button className="sm" variant="danger" busy={deleting === p.id} disabled={Boolean(deleting)} onClick={() => del(p)}>{t('del')}</Button></td></tr>)}</tbody></table>}</Wrap></>
}
function Users() { const { t } = useApp(); const tb = useTable('profiles'); return <Wrap tb={tb}>{rows => <table><thead><tr><th>{t('f_name')}</th><th>{t('phone_l')}</th><th>{t('role')}</th><th>{t('f_date')}</th></tr></thead><tbody>{rows.map(u => <tr key={u.id}><td>{u.full_name || '—'}</td><td>{u.phone || '—'}</td><td><span className="role">{u.role}</span></td><td>{new Date(u.created_at).toLocaleDateString()}</td></tr>)}</tbody></table>}</Wrap> }
function ReviewsAdmin() {
  const { t, notify, loadReviews } = useApp(); const confirm = useConfirm(); const [deleting, setDeleting] = useState(null); const tb = useTable('reviews');
  return <Wrap tb={tb}>{rows => <table><thead><tr><th>{t('f_name')}</th><th>{t('rating')}</th><th>{t('comment')}</th><th /></tr></thead><tbody>{rows.map(r => <tr key={r.id}><td>{r.author}</td><td>{'★'.repeat(r.rating)}</td><td>{r.comment}</td><td><Button className="sm" variant="danger" busy={deleting === r.id} disabled={Boolean(deleting)} onClick={async () => { if (!await confirm({ description: t('confirm_del') })) return; setDeleting(r.id); try { const { error } = await supabase.from('reviews').delete().eq('id', r.id); if (error) throw error; await Promise.all([tb.load(), loadReviews()]); notify(t('ok')); } catch { notify(t('e_srv'), 'err'); } finally { setDeleting(null); } }}>{t('del')}</Button></td></tr>)}</tbody></table>}</Wrap>
}
export default function Admin() {
  const { t } = useApp(); const [tab, setTab] = useState('stats'); const V = { stats: Stats, orders: Orders, bookings: Bookings, shop: ProductsAdmin, users: Users, reviews: ReviewsAdmin }[tab];
  const label = k => k === 'stats' ? t('stats') : k === 'shop' ? t('shop') : k === 'orders' ? t('orders') : k === 'bookings' ? t('booking') : k === 'users' ? t('users') : t('reviews');
  return <section className="sec page-top"><div className="wrap"><PageHeading title={t('adm')}/><div className="chips fl">{TABS.map(k => <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{label(k)}</button>)}</div><div className="adm"><V key={tab} /></div></div></section>
}
