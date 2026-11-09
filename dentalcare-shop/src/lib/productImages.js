// Existing bundled assets are illustrations, not verified product photography.
const illustrations = new Set(['s1', 's2', 's3', 's4', 's5', 's6', 'b1', 'b2', 'b3', 'b4']);
export function productImage(product) {
    const value = product.image?.trim();
    if (!value) return null;
    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith('/images/') && !value.includes('..')) return value;
    if (!/^[\w-]+(?:\.(?:jpe?g|png|webp|avif|gif|svg))?$/i.test(value)) return null;
    return `/images/${value}${/\.[a-z]+$/i.test(value) ? '' : '.jpg'}`;
}
export const isIllustration = product => illustrations.has(product.image?.replace(/\.(?:jpe?g|png|webp)$/i, ''));
