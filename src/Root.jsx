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
  return <UserApp key={uid} uid={uid} />
}

// ponytail: último en escribir gana sobre el documento entero; merge por campo si dos dispositivos editan a la vez.
function UserApp({ uid }) {
  const cacheKey = `mf:${uid}`, pendingKey = `mf:pending:${uid}`
  const [initial, setInitial] = useState(null)
  const timer = useRef(0), latest = useRef(null)

  const push = async () => {
    clearTimeout(timer.current)
    if (!latest.current) return
    try { await saveState(latest.current); localStorage.removeItem(pendingKey) } catch { /* sin red: queda pendiente */ }
  }

  useEffect(() => {
    const local = ld(cacheKey, null)
    if (local && ld(pendingKey, false)) { latest.current = local; setInitial(local); push(); return } // cambios sin sincronizar ganan
    loadState()
      .then(remote => { const s = { ...EMPTY, ...(remote || {}) }; sv(cacheKey, s); setInitial(s) })
      .catch(() => setInitial(local || EMPTY))
    const onHide = () => { if (document.visibilityState === 'hidden' && ld(pendingKey, false)) push() }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
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

  return initial ? <App initial={initial} onChange={onChange} onSignOut={onSignOut} /> : <Splash />
}
