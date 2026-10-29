import { useEffect, useRef, useState } from 'react';
export default function Counter({ to }) {
    const r = useRef(); const [v, setV] = useState(0);
    useEffect(() => {
        const o = new IntersectionObserver(([e]) => {
            if (!e.isIntersecting) return; o.disconnect(); if (matchMedia('(prefers-reduced-motion:reduce)').matches) return setV(to);
            const s = performance.now(); const f = x => { const p = Math.min((x - s) / 1600, 1); setV(Math.round(to * (1 - Math.pow(1 - p, 3)))); p < 1 && requestAnimationFrame(f) }; requestAnimationFrame(f)
        }); o.observe(r.current); return () => o.disconnect()
    }, [to]);
    return <b ref={r}>{v.toLocaleString()}</b>
}
