import { forwardRef } from 'react';
const Button = forwardRef(function Button({ children, busy = false, variant = 'primary', className = '', disabled, type = 'button', ...props }, ref) {
    return <button ref={ref} type={type} className={`btn ${variant === 'secondary' ? 'ghost-d' : variant === 'danger' ? 'danger' : ''} ${className}`} disabled={disabled || busy} aria-busy={busy || undefined} {...props}>
        {busy && <span className="spinner" aria-hidden="true" />}{children}
    </button>;
});
export default Button;
