import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// En dev, /api/state lo sirve el mismo handler que la función de Vercel (api/state.js).
const devApi = () => ({
  name: 'dev-api',
  configureServer(server) {
    server.middlewares.use('/api/state', async (req, res) => {
      const { GET, PUT } = await server.ssrLoadModule('/api/state.js')
      const handler = { GET, PUT }[req.method]
      if (!handler) { res.statusCode = 405; return res.end() }
      const chunks = []
      for await (const c of req) chunks.push(c)
      const body = chunks.length ? Buffer.concat(chunks) : undefined
      const out = await handler(new Request(`http://localhost${req.originalUrl}`, { method: req.method, headers: req.headers, body }))
      res.statusCode = out.status
      out.headers.forEach((v, k) => res.setHeader(k, v))
      res.end(Buffer.from(await out.arrayBuffer()))
    })
  },
})

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), '')) // DATABASE_URL y NEON_AUTH_BASE_URL para el handler en dev
  return {
    plugins: [react(), devApi()],
    envPrefix: ['VITE_', 'NEON_AUTH_BASE_URL'], // la URL de Auth es pública; DATABASE_URL nunca llega al navegador
  }
})
