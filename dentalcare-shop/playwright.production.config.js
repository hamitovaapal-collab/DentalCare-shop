import { defineConfig } from '@playwright/test';
import base from './playwright.config.js';
export default defineConfig({ ...base, testMatch: '**/production.spec.js', testIgnore: [],
    use: { ...base.use, baseURL: 'http://127.0.0.1:4173' },
    webServer: { command: 'npm start', url: 'http://127.0.0.1:4173', env: { PORT: '4173', NODE_ENV: 'production' }, reuseExistingServer: false },
});
