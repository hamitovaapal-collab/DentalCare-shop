import { useEffect } from 'react'; import { Navigate, Route, Routes, useLocation } from 'react-router-dom'; import { useApp } from '../store';
import Home from '../pages/Home'; import Shop from '../pages/Shop'; import ProductDetails from '../pages/ProductDetails'; import Cart from '../pages/Cart'; import Checkout from '../pages/Checkout';
import Booking from '../pages/Booking'; import Favorites from '../pages/Favorites'; import Reviews from '../pages/Reviews'; import { Login, Register, Forgot, Reset } from '../pages/Auth';
import Profile from '../pages/Profile'; import Orders from '../pages/Orders'; import About from '../pages/About'; import Contact from '../pages/Contact'; import Admin from '../pages/Admin'; import NotFound from '../pages/NotFound';
import { supabase } from '../lib/supabase'; import Skeleton from './Skeleton';
function Guard({ children, admin }) {
    const { user, ready, profile, isAdmin, t } = useApp();
    if (!supabase) return <section className="sec auth-wrap"><div className="wrap"><div className="err">{t('no_db')}</div></div></section>;
    if (!ready || (user && !profile)) return <div className="wrap" style={{ paddingTop: 140 }}><Skeleton h={240} /></div>;
    if (!user) return <Navigate to="/login" replace />;
    if (admin && !isAdmin) return <Navigate to="/" replace />;
    return children
}
export default function MainContent() {
    const { pathname } = useLocation();
    useEffect(() => { scrollTo({ top: 0, behavior: 'instant' }) }, [pathname]);
    return <main key={pathname} className="page"><Routes>
        <Route path="/" element={<Home />} /><Route path="/shop" element={<Shop />} /><Route path="/shop/:id" element={<ProductDetails />} /><Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Guard><Checkout /></Guard>} /><Route path="/booking" element={<Booking />} /><Route path="/favorites" element={<Favorites />} /><Route path="/reviews" element={<Reviews />} />
        <Route path="/login" element={<Login />} /><Route path="/register" element={<Register />} /><Route path="/forgot" element={<Forgot />} /><Route path="/reset-password" element={<Reset />} />
        <Route path="/profile" element={<Guard><Profile /></Guard>} /><Route path="/orders" element={<Guard><Orders /></Guard>} /><Route path="/about" element={<About />} /><Route path="/contact" element={<Contact />} />
        <Route path="/admin" element={<Guard admin><Admin /></Guard>} /><Route path="*" element={<NotFound />} /></Routes></main>
}
