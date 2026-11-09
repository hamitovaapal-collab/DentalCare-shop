import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import Icon from './Icon';
import ThemeSwitch from './ThemeSwitch';
export default function Header() {
    const { t, lang, setLang, cartCount, favs, user } = useApp();
    const header = useRef(null);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    useEffect(() => {
        const measure = () => document.documentElement.style.setProperty('--header-height', `${header.current.getBoundingClientRect().height}px`);
        const observer = new ResizeObserver(measure); observer.observe(header.current); measure();
        return () => { observer.disconnect(); document.documentElement.style.removeProperty('--header-height'); };
    }, []);
    useEffect(() => setOpen(false), [location]);
    useEffect(() => {
        if (!open) return;
        const key = e => { if (e.key === 'Escape') { setOpen(false); document.querySelector('.burger')?.focus(); } };
        const outside = e => { if (!e.target.closest('header')) setOpen(false); };
        addEventListener('keydown', key); addEventListener('pointerdown', outside);
        return () => { removeEventListener('keydown', key); removeEventListener('pointerdown', outside); };
    }, [open]);
    useEffect(() => { const resize = () => { if (innerWidth > 820) setOpen(false); }; addEventListener('resize', resize); return () => removeEventListener('resize', resize); }, []);
    const links = [['/', 'home'], ['/shop', 'shop'], ['/services', 'services'], ['/about', 'about'], ['/booking', 'booking'], ['/reviews', 'reviews'], ['/contact', 'contact']];
    return <>
        <a href="#main-content" className="skip-link">{t('skip_content')}</a>
        <header className="nav" ref={header}>
            <div className="wrap nav-main">
                <Link to="/" className="logo" aria-label="DentalCare"><span className="logo-mark"><Icon n="tooth" s={26}/></span><span>DentalCare<small>{t('brand_descriptor')}</small></span></Link>
                <form className="header-search" role="search" onSubmit={e => { e.preventDefault(); navigate(`/shop${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ''}`); }}>
                    <input aria-label={t('search')} placeholder={t('search')} value={search} onChange={e => setSearch(e.target.value)}/>
                    <button type="submit" aria-label={t('search_submit')}><Icon n="search" s={20}/></button>
                </form>
                <div className="nav-actions">
                    <Link className="ib search-shortcut" to="/shop" aria-label={t('search')}><Icon n="search"/></Link>
                    <Link className="ib" to="/favorites" aria-label={t('favs')}><Icon n="heart"/>{favs.length > 0 && <i>{favs.length}</i>}</Link>
                    <Link className="ib" to={user ? '/profile' : '/login'} aria-label={user ? t('mine') : t('login')}><Icon n="user"/></Link>
                    <Link className="ib cart-link" to="/cart" aria-label={t('cart')}><Icon n="cart"/>{cartCount > 0 && <i>{cartCount}</i>}<span>{t('cart')}</span></Link>
                    <Link className="ib admin-shortcut" to="/admin" aria-label={t('adm')}><Icon n="shield" s={18}/><span>{t('adm')}</span></Link>
                </div>
                <button type="button" className="burger ib" aria-label={t('menu')} aria-controls="menu" aria-expanded={open} onClick={() => setOpen(v => !v)}><Icon n={open ? 'close' : 'menu'} s={23}/></button>
            </div>
            <div className="nav-divider"><div className="wrap nav-bottom">
                <nav id="menu" className={open ? 'open' : ''} aria-label={t('navigation')}>
                    {links.map(([to, key]) => <NavLink key={to} to={to} end={to === '/'} className={({isActive}) => isActive ? 'act' : ''}>{t(key)}</NavLink>)}
                    <NavLink to="/admin">{t('adm')}</NavLink>
                    <div className="m-extra"><Link to="/favorites">{t('favs')} ({favs.length})</Link><Link to={user ? '/profile' : '/login'}>{user ? t('mine') : t('login')}</Link></div>
                </nav>
                <div className="preferences"><div className="lang" role="group" aria-label={t('language')}>{['ky', 'ru', 'en'].map(l => <button type="button" key={l} aria-pressed={lang === l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>{l === 'ky' ? 'KG' : l.toUpperCase()}</button>)}</div><ThemeSwitch/></div>
            </div></div>
        </header>
        {open && <div className="menu-scrim" aria-hidden="true" onClick={() => setOpen(false)}/>}
    </>;
}
