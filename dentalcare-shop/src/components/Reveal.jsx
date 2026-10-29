import { useEffect, useRef, useState } from 'react';
export default function Reveal({ children, className = '', as: Tag = 'div', delay = 0, ...p }) {
    const r = useRef(); const [on, set] = useState(false);
    useEffect(() => { const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { set(true); o.disconnect() } }, { threshold: .12 }); o.observe(r.current); return () => o.disconnect() }, []);
    return <Tag ref={r} style={{ transitionDelay: delay + 's' }} className={`rv ${on ? 'in' : ''} ${className}`} {...p}>{children}</Tag>
}
