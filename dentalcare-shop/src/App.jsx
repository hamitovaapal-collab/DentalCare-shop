import { useApp } from './store';
import Header from './components/Header';import MainContent from './components/MainContent';import Footer from './components/Footer';
import Toast from './components/Toast';
export default function App(){const {dataError, retryData, t} = useApp(); return <><Header/>{dataError && <div className="data-error" role="alert">{t('data_error')} <button className="btn sm" onClick={retryData}>{t('retry')}</button></div>}<MainContent/><Footer/><Toast/></>}
