import { useEffect, useState } from 'react';
export default function Modal({ open, onClose, children }) {
    const [show, setShow] = useState(false);
    useEffect(() => {
        if (!open) return setShow(false); const id = requestAnimationFrame(() => setShow(true)); const k = e => e.key === 'Escape' && onClose(); addEventListener('keydown', k); document.body.style.overflow = 'hidden';
        return () => { cancelAnimationFrame(id); removeEventListener('keydown', k); document.body.style.overflow = '' }
    }, [open]);
    if (!open) return null;
    return <div className={`modal ${show ? 'show' : ''}`} role="dialog" aria-modal="true" onClick={e => e.target === e.currentTarget && onClose()}><div className="mbox"><button className="x" onClick={onClose} aria-label="Close">×</button>{children}</div></div>
}
