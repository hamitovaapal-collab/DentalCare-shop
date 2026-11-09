import express from 'express';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import path from 'node:path';
import order from '../api/order.js';
import booking from '../api/booking.js';
import health from '../api/health.js';
import publicConfig from '../api/public-config.js';
import telegramWebhook from '../api/telegram-webhook.js';
const buildDirectory = fileURLToPath(new URL('../dist/', import.meta.url));
export function createApp({ serveFrontend = false } = {}) {
    if (serveFrontend && !existsSync(path.join(buildDirectory, 'index.html'))) {
        throw new Error('Production build is missing. Run npm run build before npm start.');
    }
    const app = express();
    app.disable('x-powered-by');
    app.use(express.json({ limit: '100kb' }));
    // Configuration flags do not prove remote service readiness. No secret values
    // are returned and no external calls or writes are made by this endpoint.
    app.all('/api/health', health);
    app.all('/api/public-config', (_req, res, next) => {res.setHeader('Cache-Control', 'no-store'); next();}, publicConfig);
    app.all('/api/telegram-webhook', telegramWebhook);
    app.all('/api/order', order);
    app.all('/api/booking', booking);
    app.use('/api', (_req, res) => res.status(404).json({ error: 'not_found' }));
    if (serveFrontend) {
        app.use(express.static(buildDirectory, { index: false, setHeaders(res, filename) {
            if (filename.includes(`${path.sep}assets${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        } }));
        app.get('*', (req, res) => {
            // Missing assets must not be disguised as HTML with status 200.
            if (path.extname(req.path) && !req.path.startsWith('/shop/')) return res.sendStatus(404);
            res.setHeader('Cache-Control', 'no-cache');
            res.sendFile(path.join(buildDirectory, 'index.html'));
        });
    }
    app.use((error, _req, res, _next) => {
        if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'validation' });
        if (error.type === 'entity.too.large') return res.status(413).json({ error: 'payload_too_large' });
        console.error('HTTP request failed');
        res.status(500).json({ error: 'server' });
    });
    return app;
}
export function listen(app, defaultPort) {
    const port = Number(process.env.PORT || defaultPort);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be an integer from 1 to 65535.');
    const server = app.listen(port, () => console.log(`DentalCare server listening on port ${port}`));
    const shutdown = () => server.close(() => process.exit(0));
    process.once('SIGTERM', shutdown);
    process.once('SIGINT', shutdown);
    return server;
}
