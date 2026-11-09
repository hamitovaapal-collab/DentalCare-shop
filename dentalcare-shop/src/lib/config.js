export function supabaseSettings(url, key) {
    const cleanedUrl = typeof url === 'string' ? url.trim().replace(/\/+$/, '') : '';
    const cleanedKey = typeof key === 'string' ? key.trim() : '';
    if (!cleanedUrl || !cleanedKey || /YOUR-PROJECT/i.test(cleanedUrl) || /^your-(anon-public|service-role)-key$/i.test(cleanedKey)) return null;
    try {
        const parsed = new URL(cleanedUrl);
        if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password || !parsed.hostname) return null;
        return { url: cleanedUrl, key: cleanedKey };
    } catch { return null; }
}
