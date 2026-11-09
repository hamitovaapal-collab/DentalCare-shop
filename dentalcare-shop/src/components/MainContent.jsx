import EmptyState from './EmptyState';
import { useEffect } from 'react'; import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'; import { useApp } from '../store';
import Services from '../pages/Services';
import Home from '../pages/Home'; import Shop from '../pages/Shop'; import ProductDetails from '../pages/ProductDetails'; import Cart from '../pages/Cart'; import Checkout from '../pages/Checkout';
import Booking from '../pages/Booking'; import Favorites from '../pages/Favorites'; import Reviews from '../pages/Reviews'; import { Login, Register, Forgot, Reset } from '../pages/Auth';
import Profile from '../pages/Profile'; import Orders from '../pages/Orders'; import About from '../pages/About'; import Contact from '../pages/Contact'; import Admin from '../pages/Admin'; import NotFound from '../pages/NotFound';
import { supabase } from '../lib/supabase'; import Skeleton from './Skeleton';
function Guard({ children, admin }) {
    const { user, ready, profileReady, profile, loadProfile, isAdmin, t } = useApp();
    const location = useLocation();
    if (!supabase) return <section className="sec auth-wrap"><div className="wrap"><EmptyState icon="user" title={t(admin ? 'adm' : 'mine')} description={t(admin ? 'admin_connection_missing' : 'auth_unavailable')}><Link className="btn" to="/shop">{t('shop')}</Link><Link className="btn ghost-d" to="/contact">{t('contact')}</Link></EmptyState></div></section>;
    if (!ready || (user && !profileReady)) return <div className="wrap" style={{ paddingTop: 140 }}><Skeleton h={240} /></div>;
    if (!user) return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
    if (!profile) return <section className="sec auth-wrap"><div className="wrap" role="alert">{t('data_error')} <button className="btn" onClick={loadProfile}>{t('retry')}</button></div></section>;
    if (admin && !isAdmin) return <section className="sec auth-wrap"><div className="wrap"><EmptyState icon="user" title={t('admin_access_title')} description={t('admin_access_description')}><button type="button" className="btn" onClick={loadProfile}>{t('retry')}</button><Link className="btn ghost-d" to="/profile">{t('mine')}</Link></EmptyState></div></section>;
    return children
}
export default function MainContent() {
    const { pathname } = useLocation();
    useEffect(() => { scrollTo({ top: 0, behavior: 'instant' }) }, [pathname]);
    return <main id="main-content" key={pathname} className="page" tabIndex="-1"><Routes>
        <Route path="/" element={<Home />} /><Route path="/shop" element={<Shop />} /><Route path="/shop/:id" element={<ProductDetails />} /><Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} /><Route path="/booking" element={<Booking />} /><Route path="/favorites" element={<Favorites />} /><Route path="/reviews" element={<Reviews />} />
        <Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="/forgot" element={<Forgot />} /><Route path="/reset-password" element={<Reset />} />
        <Route path="/profile" element={<Guard><Profile /></Guard>} /><Route path="/orders" element={<Guard><Orders /></Guard>} /><Route path="/services" element={<Services />} /><Route path="/about" element={<About />} /><Route path="/contact" element={<Contact />} />
        <Route path="/admin" element={<Guard admin><Admin /></Guard>} /><Route path="*" element={<NotFound />} /></Routes></main>
}
