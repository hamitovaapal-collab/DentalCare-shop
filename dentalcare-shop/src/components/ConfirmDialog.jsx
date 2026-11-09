import { createContext, useContext, useRef, useState } from 'react';
import { useApp } from '../store';
import Modal from './Modal';
import Button from './Button';
const ConfirmContext = createContext();
export const useConfirm = () => useContext(ConfirmContext);
export function ConfirmProvider({ children }) {
    const { t } = useApp();
    const [request, setRequest] = useState(null);
    const resolver = useRef(null);
    const ask = options => new Promise(resolve => { resolver.current?.(false); resolver.current = resolve; setRequest(options); });
    const answer = value => { resolver.current?.(value); resolver.current = null; setRequest(null); };
    return <ConfirmContext.Provider value={ask}>{children}<Modal open={Boolean(request)} onClose={() => answer(false)}>{request && <div className="pd"><p className="eyebrow">DentalCare</p><h2>{t('confirm_action')}</h2><p>{request.description}</p><div className="cta"><Button variant="secondary" onClick={() => answer(false)}>{t('cancel')}</Button><Button variant="danger" onClick={() => answer(true)}>{t('del')}</Button></div></div>}</Modal></ConfirmContext.Provider>;
}
