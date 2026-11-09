import { useEffect } from 'react';
import { useApp } from '../store';
import Icon from './Icon';
export default function Toast() {
    const { toast, setToast, t } = useApp();
    useEffect(() => { if (!toast) return; const timeout = setTimeout(() => setToast(null), 5000); return () => clearTimeout(timeout); }, [toast]);
    return toast ? <div className={`toast ${toast.type}`} role={toast.type === 'err' ? 'alert' : 'status'} key={toast.id}><Icon n={toast.type === 'err' ? 'close' : 'check'} s={19}/><span>{toast.msg}</span><button type="button" onClick={() => setToast(null)} aria-label={t('close_notice')}><Icon n="close" s={16}/></button></div> : null;
}
