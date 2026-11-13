// Un documento JSON por usuario. Auth: JWT de Neon Auth (Authorization: Bearer) verificado contra el JWKS de la rama.
import { neon } from '@neondatabase/serverless'
import { createRemoteJWKSet, jwtVerify } from 'jose'

let sql, jwks
const init = () => {
  sql ??= neon(process.env.DATABASE_URL)
  jwks ??= createRemoteJWKSet(new URL(`${process.env.NEON_AUTH_BASE_URL.replace(/\/$/, '')}/.well-known/jwks.json`))
}

async function userId(req) {
  const token = req.headers.get('authorization')?.replace(/^Bearer /, '')
  if (!token) return null
  try { return (await jwtVerify(token, jwks)).payload.sub || null } catch { return null }
}

const json = (body, status = 200) => Response.json(body, { status })

export async function GET(req) {
  init()
  const id = await userId(req)
  if (!id) return json({ error: 'Unauthorized' }, 401)
  const rows = await sql`select data from finanzas_state where user_id = ${id}`
  return json({ data: rows[0]?.data ?? null })
}

export async function PUT(req) {
  init()
  const id = await userId(req)
  if (!id) return json({ error: 'Unauthorized' }, 401)
  const body = await req.text()
  if (body.length > 2_000_000) return json({ error: 'Too large' }, 413)
  let data
  try { data = JSON.parse(body) } catch { return json({ error: 'Invalid JSON' }, 400) }
  if (!data || typeof data !== 'object' || !Array.isArray(data.tx)) return json({ error: 'Invalid state' }, 400)
  await sql`
    insert into finanzas_state (user_id, data, updated_at) values (${id}, ${JSON.stringify(data)}::jsonb, now())
    on conflict (user_id) do update set data = excluded.data, updated_at = now()`
  return json({ ok: true })
}
