import { useEffect, useState } from 'react'; import { Link, NavLink, useLocation } from 'react-router-dom'; import { useApp } from '../store'; import Icon from './Icon';
export default function Header() {
    const { t, lang, setLang, theme, toggleTheme, cartCount, favs, user, isAdmin } = useApp();
    const [open, setOpen] = useState(false); const [sc, setSc] = useState(false); const { pathname } = useLocation();
    useEffect(() => setOpen(false), [pathname]);
    useEffect(() => { const f = () => setSc(scrollY > 30); f(); addEventListener('scroll', f, { passive: true }); return () => removeEventListener('scroll', f) }, []);
    const L = [['/', 'home'], ['/about', 'about'], ['/shop', 'shop'], ['/booking', 'booking'], ['/reviews', 'reviews'], ['/contact', 'contact']];
    return <header className={`nav ${sc || pathname !== '/' ? 'sc' : ''}`}><div className="wrap nav-in">
        <Link to="/" className="logo"><Icon n="tooth" s={26} /> DentalCare</Link>
        <nav id="menu" className={open ? 'open' : ''} aria-label="Main">{L.map(([to, k]) => <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => isActive ? 'act' : ''}>{t(k)}</NavLink>)}{isAdmin && <NavLink to="/admin">{t('adm')}</NavLink>}
            <div className="m-extra"><Link to="/favorites">{t('favs')} ({favs.length})</Link><Link to={user ? '/profile' : '/login'}>{user ? t('mine') : t('login')}</Link></div></nav>
        <Link className="ib" to="/shop" aria-label={t('search')}><Icon n="search" s={18} /></Link>
        <div className="lang" role="group" aria-label="Language">{['ky', 'ru', 'en'].map(l => <button key={l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>{l === 'ky' ? 'KG' : l.toUpperCase()}</button>)}</div>
        <button className="tg" onClick={toggleTheme} aria-label="Theme" title="Theme">{theme === 'dark' ? '🌞' : '🌚'}</button>
        <Link className="ib d-only" to="/favorites" aria-label={t('favs')}><Icon n="heart" s={18} />{favs.length > 0 && <i>{favs.length}</i>}</Link>
        <Link className="ib" to="/cart" aria-label={t('cart')}><Icon n="cart" s={18} />{cartCount > 0 && <i>{cartCount}</i>}</Link>
        <Link className="ib d-only" to={user ? '/profile' : '/login'} aria-label={user ? t('mine') : t('login')}><Icon n="user" s={18} /></Link>
        <Link className="btn sm bk" to="/booking">{t('book')}</Link>
        <button className="burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}><span /><span /><span /></button></div></header>
}
