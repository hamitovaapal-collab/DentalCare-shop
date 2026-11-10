import { assertPublicBuildSettings } from './src/lib/public-config.js';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
const apiProxy = { '/api': 'http://localhost:5000' };
export default defineConfig(({mode}) => {
    assertPublicBuildSettings(loadEnv(mode, process.cwd(), 'VITE_'));
    return {
    plugins: [react(), {
        name: 'public-build-info', apply: 'build',
        generateBundle() {
            const input = process.env.COMMIT_REF || '';
            const revision = /^[a-f0-9]{40}$/i.test(input) ? input : null;
            this.emitFile({type: 'asset', fileName: 'build-info.json', source: JSON.stringify({design: 'cobalt-storefront', revision, builtAt: new Date().toISOString()})});
        },
    }],
    server: { proxy: apiProxy },
    preview: { proxy: apiProxy },
    build: { rollupOptions: { output: { manualChunks: {
        react: ['react', 'react-dom', 'react-router-dom'],
        supabase: ['@supabase/supabase-js'],
    } } } },
};
});
