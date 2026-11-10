import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './lib/supabase'; import { tr } from './lib/i18n'; import PRODUCTS from './data/products.json'; import content from './data/content.json';
const Ctx = createContext(); export const useApp = () => useContext(Ctx);
const read = k => { try { return localStorage.getItem(k); } catch { return null; } };
const persist = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
const ls = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch { return d } };
const sample = content.reviews.map((r, i) => ({ id: 's' + i, author: r.name, rating: r.rating, comment: r.text, product_id: null, avatar: i < 3 ? 'av' + (i + 1) : null }));
export const commentOf = (r, l) => typeof r.comment === 'string' ? r.comment : r.comment[l];
export function AppProvider({ children }) {
    const [lang, setLang] = useState(() => { const l = read('lang'); return ['en', 'ru', 'ky'].includes(l) ? l : 'en' });
    const [theme, setTheme] = useState(() => { const saved = read('theme'); return ['light', 'dark'].includes(saved) ? saved : (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'); });
    const [cart, setCart] = useState(() => { const c = ls('cart', []); return Array.isArray(c) ? c.filter(x => x && typeof x.id === 'string' && Number.isInteger(x.qty) && x.qty > 0).map(x => ({id: x.id, qty: Math.min(50, x.qty)})) : []; }); const [favs, setFavs] = useState(() => { const f = ls('favs', []); return Array.isArray(f) ? f.filter(x => typeof x === 'string') : []; });
    const profileRequest = useRef(0); const [profileLoadedFor, setProfileLoadedFor] = useState(null);
    const [profileReady, setProfileReady] = useState(false); const [dataError, setDataError] = useState(false); const [productsReady, setProductsReady] = useState(!supabase);
    const [user, setUser] = useState(null); const [profile, setProfile] = useState(null); const [ready, setReady] = useState(!supabase);
    const [products, setProducts] = useState(supabase ? [] : PRODUCTS); const [reviews, setReviews] = useState(supabase ? [] : sample); const [toast, setToast] = useState(null);
    useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0c1725' : '#f4f7fb'); persist('theme', theme) }, [theme]);
    useEffect(() => { document.documentElement.lang = lang; persist('lang', lang) }, [lang]);
    useEffect(() => persist('cart', JSON.stringify(cart)), [cart]); useEffect(() => persist('favs', JSON.stringify(favs)), [favs]);
    useEffect(() => {
        if (!supabase) return;
        let active = true, authEventReceived = false;
        const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!active) return;
            authEventReceived = true;
            setUser(session?.user ?? null);
            setReady(true);
        });
        supabase.auth.getSession().then(({ data, error }) => {
            // A sign-in/sign-out event is newer than the initial session snapshot.
            if (!active || authEventReceived) return;
            if (error) setDataError(true);
            setUser(data?.session?.user ?? null);
        }).catch(() => { if (active && !authEventReceived) setDataError(true); })
            .finally(() => { if (active) setReady(true); });
        return () => { active = false; subscription.subscription.unsubscribe(); };
    }, []);
    const userId = user?.id || null;
    const loadProfile = useCallback(async () => {
        const request = ++profileRequest.current;
        setProfile(null); setProfileReady(false);
        try {
            if (!supabase || !userId) return;
            const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
            if (error) throw error;
            if (request === profileRequest.current) setProfile(data);
        } catch { if (request === profileRequest.current) setDataError(true); }
        finally {
            if (request === profileRequest.current) { setProfileReady(true); setProfileLoadedFor(userId); }
        }
    }, [userId]);
    useEffect(() => { loadProfile() }, [loadProfile]);
    const loadProducts = useCallback(async () => { if (!supabase) return; try { const { data, error } = await supabase.from('products').select('*').order('created_at'); if (error) throw error; setProducts(data || []); } catch { setDataError(true); } finally { setProductsReady(true); } }, []);
    const loadReviews = useCallback(async () => { if (!supabase) return; try { const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(200); if (error) throw error; setReviews(data || []); } catch { setDataError(true); } }, []);
    useEffect(() => { loadProducts(); loadReviews() }, [loadProducts, loadReviews]);
    const t = useCallback((k, v) => tr(lang, k, v), [lang]);
    const notify = useCallback((msg, type = 'ok') => setToast({ msg, type, id: Date.now() }), []);
    const limitFor = id => { const p = products.find(x => x.id === id); return p && p.active !== false ? Math.max(0, Math.min(50, Math.floor(Number(p.stock) || 0))) : 0; };
    const addToCart = (id, q = 1) => { const limit = limitFor(id); if (!limit || !Number.isInteger(q) || q < 1) return false; if ((cart.find(item => item.id === id)?.qty || 0) >= limit) { notify(t('max_qty'), 'err'); return false; } setCart(c => c.find(x => x.id === id) ? c.map(x => x.id === id ? { ...x, qty: Math.min(limit, x.qty + q) } : x) : [...c, { id, qty: Math.min(limit, q) }]); notify(t('added')); return true; };
    const setQty = (id, q) => { if (!Number.isInteger(q)) return; const limit = limitFor(id); setCart(c => q < 1 || !limit ? c.filter(x => x.id !== id) : c.map(x => x.id === id ? { ...x, qty: Math.min(limit, q) } : x)); };
    const removeItem = id => setCart(c => c.filter(x => x.id !== id));
    const clearCart = purchasedItems => setCart(current => {
        if (!Array.isArray(purchasedItems)) return [];
        const quantities = new Map();
        for (const entry of purchasedItems) {
            if (typeof entry === 'string') quantities.set(entry, Infinity);
            else if (entry && typeof entry.id === 'string' && Number.isInteger(entry.qty) && entry.qty > 0) {
                quantities.set(entry.id, (quantities.get(entry.id) || 0) + entry.qty);
            }
        }
        return current.map(item => quantities.has(item.id) ? { ...item, qty: Math.max(0, item.qty - quantities.get(item.id)) } : item)
            .filter(item => item.qty > 0);
    });
    const toggleFav = id => setFavs(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
    const items = useMemo(() => cart.map(c => ({ ...c, qty: Math.min(c.qty, 50, Math.max(0, products.find(p => p.id === c.id)?.stock || 0)), p: products.find(p => p.id === c.id) })).filter(x => x.p && x.p.active !== false && x.qty > 0), [cart, products]);
    const unavailableCart = useMemo(() => productsReady ? cart.map(item => ({ ...item, p: products.find(p => p.id === item.id) })).filter(item => !item.p || item.p.active === false || !(item.p.stock > 0)) : [], [cart, products, productsReady]);
    const total = items.reduce((s, x) => s + x.p.price * x.qty, 0); const cartCount = items.reduce((s, x) => s + x.qty, 0);
    const rating = pid => { const r = reviews.filter(x => pid ? x.product_id === pid : true); return { avg: r.length ? r.reduce((s, x) => s + x.rating, 0) / r.length : 0, n: r.length } };
    const logout = async () => { const result = await supabase?.auth.signOut(); if (result?.error) { notify(t('e_srv'), 'err'); throw result.error; } setUser(null); setProfile(null); };
    const getToken = async () => supabase ? (await supabase.auth.getSession()).data.session?.access_token : undefined;
    const val = {
        lang, setLang, theme, setTheme, t, cart, items, unavailableCart, total, cartCount, addToCart, setQty, removeItem, clearCart, favs, toggleFav, user, profile, loadProfile, ready, profileReady: profileReady && (!user || profileLoadedFor === user.id), productsReady, dataError, retryData: async () => { setDataError(false); await Promise.all([loadProfile(), loadProducts(), loadReviews()]); }, isAdmin: Boolean(user && profileLoadedFor === user.id && profile?.role === 'admin'), logout, getToken,
        products, loadProducts, reviews, loadReviews, rating, toast, notify, setToast, money: n => `${Number(n).toLocaleString()} ${tr(lang, 'cur')}`, pname: p => p.name?.[lang] || p.name?.en, pdesc: p => p.description?.[lang] || p.description?.en || ''
    };
    return <Ctx.Provider value={val}>{children}</Ctx.Provider>
}
