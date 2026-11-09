import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
export default function Modal({ open, onClose, children }) {
    const [show, setShow] = useState(false);
    const box = useRef(null);
    const close = useRef(onClose);
    close.current = onClose;
    useEffect(() => {
        if (!open) { setShow(false); return; }
        const previous = document.activeElement;
        const overflow = document.body.style.overflow;
        const id = requestAnimationFrame(() => { setShow(true); box.current?.querySelector('button')?.focus(); });
        const keydown = e => {
            if (e.key === 'Escape') { e.preventDefault(); close.current(); }
            if (e.key !== 'Tab') return;
            const elements = [...box.current.querySelectorAll('button, a[href], input, select, textarea, [tabindex="0"]')].filter(el => !el.disabled);
            const first = elements[0], last = elements.at(-1);
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
        };
        addEventListener('keydown', keydown);
        document.body.style.overflow = 'hidden';
        return () => { cancelAnimationFrame(id); removeEventListener('keydown', keydown); document.body.style.overflow = overflow; previous?.focus(); };
    }, [open]);
    if (!open) return null;
    return createPortal(<div className={`modal ${show ? 'show' : ''}`} role="dialog" aria-label="DentalCare" aria-modal="true" onClick={e => e.target === e.currentTarget && onClose()}><div ref={box} className="mbox"><button type="button" className="x" onClick={onClose} aria-label="Close">×</button>{children}</div></div>, document.body);
}
