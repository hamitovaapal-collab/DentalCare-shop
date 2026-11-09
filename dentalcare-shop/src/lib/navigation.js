export function internalRedirect(value, fallback = '/profile') {
    return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !/[\\\u0000-\u001f]/.test(value) ? value : fallback;
}
