import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { execFile } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { defineConfig, type Plugin } from 'vite'

// Served from a subpath: https://www.iambaangkok.dev/hello25/
// A Cloudflare Worker route does not strip the path prefix, so assets are emitted into
// dist/hello25/ and wrangler serves the whole of dist/.
const BASE = '/hello25/'

// Dev-only: lets the timing tool, crowd and glass editors read and write src/data/<name>.json in the
// repo. Saving the glass also re-bakes the images the MV shows.
const DATA_FILES = ['timing', 'wardrobe', 'crowd', 'glass']

function saveData(): Plugin {
  return {
    name: 'hello25-save-data',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(`${BASE}__data`, (req, res) => {
        const name = req.url?.replace(/^\//, '').replace(/\?.*$/, '') ?? ''
        if (!DATA_FILES.includes(name)) {
          res.statusCode = 404
          res.end()
          return
        }
        const file = `src/data/${name}.json`
        if (req.method === 'GET') {
          readFile(file, 'utf8').then(
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
            await writeFile(file, body)
            if (name === 'glass') await promisify(execFile)('python3', ['scripts/glass-backgrounds.py', '--bake'])
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
  plugins: [tailwindcss(), react(), saveData()],
  build: {
    outDir: 'dist/hello25',
    emptyOutDir: true,
  },
})
