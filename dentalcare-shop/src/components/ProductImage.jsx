import { useEffect, useState } from 'react';
import Icon from './Icon';
import { useApp } from '../store';
export default function ProductImage({ src, alt, ...props }) {
    const { t } = useApp();
    const [failed, setFailed] = useState(false);
    useEffect(() => setFailed(false), [src]);
    return src && !failed ? <img src={src} alt={alt} onError={() => setFailed(true)} {...props}/> : <div className="image-placeholder" role="img" aria-label={alt}><Icon n="tooth" s={42}/><span>{t('image_unavailable')}</span></div>;
}
