import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
const apiProxy = { '/api': 'http://localhost:5000' };
export default defineConfig({
    plugins: [react()],
    server: { proxy: apiProxy },
    preview: { proxy: apiProxy },
    build: { rollupOptions: { output: { manualChunks: {
        react: ['react', 'react-dom', 'react-router-dom'],
        supabase: ['@supabase/supabase-js'],
    } } } },
});
