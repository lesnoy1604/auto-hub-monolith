import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
export default defineConfig({
    plugins: [react(), tailwindcss(), tsconfigPaths()],
    server: {
        host: true,
        proxy: {
            '/api': process.env.VITE_BACKEND_URL || 'http://localhost:8080',
        },
    },
});
