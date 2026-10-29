import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'

const API_PATH_PATTERN = /^\/api\/([a-z]+)$/
const SECRET_NAMES = ['FLIGHTAWARE_API_KEY', 'OWNER_CODE']

// lets npm run dev answer /api calls with the same handlers vercel runs in production
function apiRoutes(): Plugin {
  return {
    name: 'api-routes',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const match = API_PATH_PATTERN.exec(url.pathname)
        if (match === null) {
          next()
          return
        }

        try {
          // pass the browser's headers through, the route handler reads the owner code from them
          const headers = new Headers()
          for (const [name, value] of Object.entries(req.headers)) {
            if (typeof value === 'string') {
              headers.set(name, value)
            }
          }

          const handler = await server.ssrLoadModule(`/api/${match[1]}.ts`)
          const response: Response = await handler.GET(new Request(url, { headers }))

          res.statusCode = response.status
          response.headers.forEach((value, name) => {
            res.setHeader(name, value)
          })
          res.end(await response.text())
        } catch (error) {
          next(error)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // the api handlers read secrets from process.env like they do on vercel,
  // so pass them along from .env.local in dev
  const env = loadEnv(mode, process.cwd(), '')
  for (const name of SECRET_NAMES) {
    if (env[name] && !process.env[name]) {
      process.env[name] = env[name]
    }
  }

  return {
    plugins: [react(), apiRoutes()],
  }
})
