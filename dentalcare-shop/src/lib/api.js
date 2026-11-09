export async function post(path, body, token) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
        const response = await fetch(path, {
            method: 'POST', signal: controller.signal,
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
            body: JSON.stringify(body),
        });
        const data = await response.json().catch(error => { if (controller.signal.aborted) throw error; return null; });
        if (!response.ok || !data) throw new Error(response.status === 404 || !data ? 'net' : data.error || 'server');
        return data;
    } catch (error) {
        if (controller.signal.aborted) throw new Error('timeout');
        if (error instanceof TypeError) throw new Error('net');
        throw error;
    } finally { clearTimeout(timer); }
}
