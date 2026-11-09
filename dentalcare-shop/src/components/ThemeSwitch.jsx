import { useApp } from '../store';
import Icon from './Icon';
export default function ThemeSwitch() {
    const { theme, setTheme, t } = useApp();
    return <div className="theme-switch" role="group" aria-label={t('theme_label')}>
        {['light', 'dark'].map(value => <button key={value} type="button" aria-pressed={theme === value} onClick={() => setTheme(value)}>
            <Icon n={value === 'light' ? 'sun' : 'moon'} s={16} /><span>{t(value === 'light' ? 'day' : 'night')}</span>
        </button>)}
    </div>;
}
