import { createAuthClient } from '@neon/auth'
import { BetterAuthReactAdapter } from '@neon/auth/react/adapters'

// Se incrusta al compilar: si falta en Vercel, el cliente caería en /api/auth (404).
if (!import.meta.env.NEON_AUTH_BASE_URL) throw new Error('Falta NEON_AUTH_BASE_URL en el build (configúrala en Vercel y vuelve a desplegar)')

export const authClient = createAuthClient(import.meta.env.NEON_AUTH_BASE_URL, { adapter: BetterAuthReactAdapter() })
const BASE = import.meta.env.NEON_AUTH_BASE_URL.replace(/\/$/, '')

/** El servidor ya no reconoce la sesión (revocada, caducada o cerrada en otro sitio). */
export class Unauthorized extends Error {}

/** Cierra sesión y comprueba que de verdad se cerró; si la cookie sobrevivió, se lo pide directo a Neon. Siempre recarga. */
export async function signOutHard() {
  try { await authClient.signOut() } catch {}
  try {
    const r = await fetch(`${BASE}/get-session?disableCookieCache=true`, { credentials: 'include', cache: 'no-store' })
    const d = r.ok ? await r.json().catch(() => null) : null
    if (d?.session) await fetch(`${BASE}/sign-out`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: '{}' })
  } catch {}
  window.location.replace('/') // recarga completa: sin caché de sesión en memoria
}

// El JWT viene en session.token (el SDK lo inyecta desde la cabecera set-auth-jwt).
// No usar authClient.token(): el SDK enruta /token por la caché de getSession y devuelve la sesión, sin .token.
const isJwt = t => typeof t === 'string' && t.split('.').length === 3
async function getJwt() {
  const { data } = await authClient.getSession()
  if (isJwt(data?.session?.token)) return data.session.token
  // Respaldo: pedir el JWT directo a Neon Auth (cookie de sesión), sin pasar por la caché del SDK.
  const res = await fetch(`${BASE}/token`, { credentials: 'include', cache: 'no-store' })
  const t = res.ok ? (await res.json()).token : null
  if (!isJwt(t)) throw new Unauthorized('Sin sesión')
  return t
}

async function api(method, body) {
  const jwt = await getJwt()
  return fetch('/api/state', {
    method, body, cache: 'no-store',
    headers: { authorization: `Bearer ${jwt}`, 'content-type': 'application/json' },
  })
}

/** null = usuario nuevo (sin fila todavía). Lanza si la red/servidor falla. */
export async function loadState() {
  const res = await api('GET')
  if (res.status === 401) throw new Unauthorized('Sesión no válida')
  if (!res.ok) throw new Error('No se pudo cargar')
  return (await res.json()).data
}

export async function saveState(state) {
  const res = await api('PUT', JSON.stringify(state))
  if (res.status === 401) throw new Unauthorized('Sesión no válida')
  if (!res.ok) throw new Error('No se pudo guardar')
}
