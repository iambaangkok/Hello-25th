import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { defineConfig, type Plugin } from 'vite'

// Served from a subpath: https://www.iambaangkok.dev/hello25/
// A Cloudflare Worker route does not strip the path prefix, so assets are emitted into
// dist/hello25/ and wrangler serves the whole of dist/.
const BASE = '/hello25/'

// Dev-only: lets the timing tool (timing.html) write its result straight into the repo.
function saveTiming(): Plugin {
  return {
    name: 'hello25-save-timing',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(`${BASE}__timing`, (req, res) => {
        if (req.method === 'GET') {
          readFile('src/data/timing.json', 'utf8').then(
            (body) => res.end(body),
            () => {
              res.statusCode = 404
              res.end()
            },
          )
          return
        }
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end()
          return
        }
        let body = ''
        req.on('data', (chunk) => (body += chunk))
        req.on('end', async () => {
          try {
            JSON.parse(body)
            await mkdir('src/data', { recursive: true })
            await writeFile('src/data/timing.json', body)
            res.end('ok')
          } catch (err) {
            res.statusCode = 400
            res.end(String(err))
          }
        })
      })
    },
  }
}

export default defineConfig({
  base: BASE,
  plugins: [tailwindcss(), react(), saveTiming()],
  build: {
    outDir: 'dist/hello25',
    emptyOutDir: true,
  },
})
