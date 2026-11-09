// Netlify Functions v2 adapter. Reuses the real server-side API handlers.
import order from '../../api/order.js';
import booking from '../../api/booking.js';
import health from '../../api/health.js';
import webhook from '../../api/telegram-webhook.js';
const handlers = { order, booking, health, 'telegram-webhook': webhook };
const json = (data, status = 200, head = false) => new Response(head ? null : JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});
async function bodyOf(request) {
  if (!request.body) return undefined;
  const reader = request.body.getReader(); let size = 0; const chunks = [];
  try {
    while (true) {
      const {done, value} = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 100 * 1024) { await reader.cancel(); throw Object.assign(new Error(), {status: 413}); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  if (!size) return undefined;
  const buffer = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(buffer)); }
  catch { throw Object.assign(new Error(), {status: 400}); }
}
export default async function handler(request) {
  const path = new URL(request.url).pathname.replace(/^\/(?:api|\.netlify\/functions\/api)\/?/, '');
  const endpoint = Object.hasOwn(handlers, path) ? handlers[path] : null;
  if (!endpoint) return json({error: 'not_found'}, 404);
  try {
    const req = {method: request.method, headers: Object.fromEntries(request.headers), body: await bodyOf(request)};
    let status = 200, response;
    const res = {status(code) {status = code; return this;}, json(data) {response = json(data, status, request.method === 'HEAD'); return this;}};
    await endpoint(req, res);
    return response || json({error: 'server'}, 500);
  } catch (error) {
    const status = error.status === 413 ? 413 : error.status === 400 ? 400 : 500;
    return json({error: status === 413 ? 'payload_too_large' : status === 400 ? 'validation' : 'server'}, status);
  }
}
