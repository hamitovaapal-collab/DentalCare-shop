import { useEffect } from 'react'; import { useApp } from '../store';
export default function Toast() {
    const { toast, setToast } = useApp();
    useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(null), 4000); return () => clearTimeout(id) }, [toast]);
    return toast ? <div className={`toast ${toast.type}`} role="status" key={toast.id} onClick={() => setToast(null)}>{toast.msg}</div> : null
}
