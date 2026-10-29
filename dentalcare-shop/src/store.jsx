import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from './lib/supabase'; import { tr } from './lib/i18n'; import PRODUCTS from './data/products.json'; import content from './data/content.json';
const Ctx = createContext(); export const useApp = () => useContext(Ctx);
const ls = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } };
const sample = content.reviews.map((r, i) => ({ id: 's' + i, author: r.name, rating: r.rating, comment: r.text, product_id: null, avatar: i < 3 ? 'av' + (i + 1) : null }));
export const commentOf = (r, l) => typeof r.comment === 'string' ? r.comment : r.comment[l];
export function AppProvider({ children }) {
    const [lang, setLang] = useState(() => { const l = localStorage.getItem('lang'); return ['en', 'ru', 'ky'].includes(l) ? l : 'en' });
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'));
    const [cart, setCart] = useState(() => ls('cart', [])); const [favs, setFavs] = useState(() => ls('favs', []));
    const [user, setUser] = useState(null); const [profile, setProfile] = useState(null); const [ready, setReady] = useState(!supabase);
    const [products, setProducts] = useState(supabase ? [] : PRODUCTS); const [reviews, setReviews] = useState(supabase ? [] : sample); const [toast, setToast] = useState(null);
    useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('theme', theme) }, [theme]);
    useEffect(() => { document.documentElement.lang = lang; localStorage.setItem('lang', lang) }, [lang]);
    useEffect(() => localStorage.setItem('cart', JSON.stringify(cart)), [cart]); useEffect(() => localStorage.setItem('favs', JSON.stringify(favs)), [favs]);
    useEffect(() => {
        if (!supabase) return; supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setReady(true) });
        const { data: s } = supabase.auth.onAuthStateChange((_e, ses) => setUser(ses?.user ?? null)); return () => s.subscription.unsubscribe()
    }, []);
    const loadProfile = useCallback(async () => { if (!supabase || !user) return setProfile(null); const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(); setProfile(data) }, [user]);
    useEffect(() => { loadProfile() }, [loadProfile]);
    const loadProducts = useCallback(async () => { if (!supabase) return; const { data, error } = await supabase.from('products').select('*').order('created_at'); if (!error) setProducts(data) }, []);
    const loadReviews = useCallback(async () => { if (!supabase) return; const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(200); if (!error) setReviews(data) }, []);
    useEffect(() => { loadProducts(); loadReviews() }, [loadProducts, loadReviews]);
    const t = useCallback((k, v) => tr(lang, k, v), [lang]);
    const notify = useCallback((msg, type = 'ok') => setToast({ msg, type, id: Date.now() }), []);
    const addToCart = (id, q = 1) => { setCart(c => c.find(x => x.id === id) ? c.map(x => x.id === id ? { ...x, qty: Math.min(50, x.qty + q) } : x) : [...c, { id, qty: q }]); notify(t('added')) };
    const setQty = (id, q) => setCart(c => q < 1 ? c.filter(x => x.id !== id) : c.map(x => x.id === id ? { ...x, qty: Math.min(50, q) } : x));
    const removeItem = id => setCart(c => c.filter(x => x.id !== id)); const clearCart = () => setCart([]);
    const toggleFav = id => setFavs(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
    const items = useMemo(() => cart.map(c => ({ ...c, p: products.find(p => p.id === c.id) })).filter(x => x.p), [cart, products]);
    const total = items.reduce((s, x) => s + x.p.price * x.qty, 0); const cartCount = items.reduce((s, x) => s + x.qty, 0);
    const rating = pid => { const r = reviews.filter(x => pid ? x.product_id === pid : true); return { avg: r.length ? r.reduce((s, x) => s + x.rating, 0) / r.length : 0, n: r.length } };
    const logout = async () => { await supabase?.auth.signOut(); setProfile(null) };
    const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token;
    const val = {
        lang, setLang, theme, toggleTheme: () => setTheme(x => x === 'dark' ? 'light' : 'dark'), t, cart, items, total, cartCount, addToCart, setQty, removeItem, clearCart, favs, toggleFav, user, profile, loadProfile, ready, isAdmin: profile?.role === 'admin', logout, getToken,
        products, loadProducts, reviews, loadReviews, rating, toast, notify, setToast, money: n => `${Number(n).toLocaleString()} ${tr(lang, 'cur')}`, pname: p => p.name?.[lang] || p.name?.en, pdesc: p => p.description?.[lang] || p.description?.en || ''
    };
    return <Ctx.Provider value={val}>{children}</Ctx.Provider>
}
