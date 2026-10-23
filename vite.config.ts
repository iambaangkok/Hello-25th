import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// Served from a subpath: https://www.iambaangkok.dev/hello25/
// A Cloudflare Worker route does not strip the path prefix, so assets are emitted into
// dist/hello25/ and wrangler serves the whole of dist/.
const BASE = '/hello25/'

export default defineConfig({
  base: BASE,
  plugins: [tailwindcss(), react()],
  build: {
    outDir: 'dist/hello25',
    emptyOutDir: true,
  },
})
