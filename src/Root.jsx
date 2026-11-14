import { useEffect, useRef, useState } from 'react'
import App from './App'
import SignIn from './SignIn'
import { Brand } from './components/ui'
import { authClient, loadState, saveState } from './auth'
import { DEFAULT_CATS, ld, sv } from './finance'

// Todo usuario nuevo empieza desde cero.
const EMPTY = { tx: [], budgets: [], cats: DEFAULT_CATS, card: null, cardTx: [], cardPaid: {} }

const Splash = () => <div className="splash"><Brand size={44} /></div>

export default function Root() {
  const { data, isPending } = authClient.useSession()
  const uid = data?.user?.id
  if (isPending) return <Splash />
  if (!uid) return <SignIn />
  return <UserApp key={uid} uid={uid} user={data.user} />
}

// ponytail: último en escribir gana sobre el documento entero; merge por campo si dos dispositivos editan a la vez.
function UserApp({ uid, user }) {
  const cacheKey = `mf:${uid}`, pendingKey = `mf:pending:${uid}`
  const [initial, setInitial] = useState(null)
  const [rev, setRev] = useState(0) // sube cuando llegan datos de otro dispositivo → App se remonta con ellos
  const timer = useRef(0), latest = useRef(null)
  const pending = () => ld(pendingKey, false)

  const push = async () => {
    clearTimeout(timer.current)
    if (!latest.current) return
    try { await saveState(latest.current); localStorage.removeItem(pendingKey) } catch (e) { console.error('[finanzas] no se pudo guardar:', e) }
  }

  // Trae lo del servidor; si difiere de lo local (cambios de otro dispositivo), lo aplica.
  const pull = async () => {
    if (pending()) return
    try {
      const remote = await loadState()
      if (pending()) return // se editó mientras cargaba
      const s = { ...EMPTY, ...(remote || {}) }
      if (JSON.stringify(s) !== JSON.stringify(ld(cacheKey, null))) { sv(cacheKey, s); setInitial(s); setRev(r => r + 1) }
    } catch (e) { console.error('[finanzas] no se pudo cargar:', e) }
  }

  useEffect(() => {
    const local = ld(cacheKey, null)
    if (local) setInitial(local) // muestra la caché al instante
    if (local && pending()) { latest.current = local; push() } // cambios sin sincronizar ganan
    else pull().finally(() => setInitial(i => i || EMPTY))
    const onVis = () => {
      if (document.visibilityState === 'visible') pull()
      else if (pending()) push()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onChange = s => {
    latest.current = s
    sv(cacheKey, s); sv(pendingKey, true)
    clearTimeout(timer.current)
    timer.current = setTimeout(push, 800)
  }

  const onSignOut = async () => {
    await push()
    if (!ld(pendingKey, false)) localStorage.removeItem(cacheKey) // conserva lo no sincronizado para el próximo inicio
    await authClient.signOut()
  }

  return initial ? <App key={rev} user={user} initial={initial} onChange={onChange} onSignOut={onSignOut} /> : <Splash />
}
