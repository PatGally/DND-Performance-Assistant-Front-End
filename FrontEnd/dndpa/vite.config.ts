import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// added this below on 3/26/26 for backend proxy getting a google-drive image link to render on page
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:8002',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ""),
            }
        }
    }
})
