import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'

const API_PATH_PATTERN = /^\/api\/([a-z]+)$/

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
          const handler = await server.ssrLoadModule(`/api/${match[1]}.ts`)
          const response: Response = await handler.GET(new Request(url))

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
export default defineConfig({
  plugins: [react(), apiRoutes()],
})
