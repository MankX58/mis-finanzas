import { createAuthClient } from '@neon/auth'
import { BetterAuthReactAdapter } from '@neon/auth/react/adapters'

export const authClient = createAuthClient(import.meta.env.NEON_AUTH_BASE_URL, { adapter: BetterAuthReactAdapter() })

async function api(method, body) {
  const { data } = await authClient.token()
  return fetch('/api/state', {
    method, body, cache: 'no-store',
    headers: { authorization: `Bearer ${data?.token}`, 'content-type': 'application/json' },
  })
}

/** null = usuario nuevo (sin fila todavía). Lanza si la red/servidor falla. */
export async function loadState() {
  const res = await api('GET')
  if (!res.ok) throw new Error('No se pudo cargar')
  return (await res.json()).data
}

export async function saveState(state) {
  const res = await api('PUT', JSON.stringify(state))
  if (!res.ok) throw new Error('No se pudo guardar')
}
