import { createApp, listen } from './app.js';
listen(createApp({ serveFrontend: true }), 3000);
