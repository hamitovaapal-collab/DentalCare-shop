import { useApp } from '../store';
import Skeleton from './Skeleton';
export default function LoadingState({ cards = false }) {
    const { t } = useApp();
    return <div className="loading-state" role="status" aria-label={t('loading')}><span className="sr-only">{t('loading')}</span>
        {cards ? <div className="grid4">{Array.from({length: 4}, (_, i) => <div className="card skeleton-card" key={i}><Skeleton h={210}/><Skeleton h={18}/><Skeleton h={14} w="65%"/><Skeleton h={44}/></div>)}</div> : <><Skeleton h={32} w="55%"/><Skeleton h={250}/></>}
    </div>;
}
