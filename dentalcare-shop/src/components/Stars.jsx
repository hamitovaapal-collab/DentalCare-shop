export default function Stars({ value = 0, onChange, size = '1rem' }) {
    const v = Math.round(value);
    if (!onChange) return <span className="st" style={{ fontSize: size }} aria-label={`${value.toFixed(1)} / 5`}>{'★'.repeat(v)}<span className="dim">{'★'.repeat(5 - v)}</span></span>;
    return <span className="st pick" role="radiogroup">{[1, 2, 3, 4, 5].map(i => <button type="button" key={i} role="radio" aria-checked={value === i} aria-label={`${i}`} onClick={() => onChange(i)} className={i <= value ? 'on' : ''}>★</button>)}</span>
}
