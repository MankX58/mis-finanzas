import { useState } from 'react'
import { Brand, Seg } from './components/ui'
import { authClient } from './auth'

const ERRORS = {
  INVALID_EMAIL_OR_PASSWORD: 'Correo o contraseña incorrectos.',
  USER_ALREADY_EXISTS: 'Ya existe una cuenta con ese correo. Prueba a entrar.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: 'Ya existe una cuenta con ese correo. Prueba a entrar.',
  PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 8 caracteres.',
  INVALID_EMAIL: 'Ese correo no parece válido.',
  EMAIL_NOT_VERIFIED: 'Verifica tu correo antes de entrar.',
}
const message = e => (e?.code && ERRORS[e.code]) || e?.message || 'Algo salió mal. Inténtalo de nuevo.'

// Recibo de ejemplo: las líneas se "imprimen" una a una y el total cuadra.
const LINES = [
  { l: 'Salario', v: 2400000 },
  { l: 'Arriendo', v: -950000 },
  { l: 'Mercado', v: -312500 },
  { l: 'Transporte', v: -98000 },
  { l: 'Salida con amigos', v: -74000 },
]
const money = n => (n < 0 ? '−' : '+') + '$' + Math.abs(n).toLocaleString('es-CO')
const TOTAL = LINES.reduce((a, x) => a + x.v, 0)

function Receipt({ compact }) {
  const rows = compact ? LINES.slice(0, 3) : LINES
  return (
    <div className={`receipt ${compact ? 'compact' : ''}`} aria-hidden="true">
      <div className="receipt-h"><span>Este mes</span><span className="num">{new Date().toLocaleDateString('es-CO', { month: 'short', year: 'numeric' }).replace('.', '')}</span></div>
      {rows.map((r, i) => (
        <div key={r.l} className="lrow receipt-row" style={{ animationDelay: `${300 + i * 160}ms` }}>
          <span className="lbl">{r.l}</span><span className="leader" /><span className={`val num ${r.v > 0 ? 'pos' : ''}`}>{money(r.v)}</span>
        </div>
      ))}
      {!compact && (
        <div className="lrow total receipt-row" style={{ animationDelay: `${300 + rows.length * 160}ms` }}>
          <span className="lbl">Te queda</span><span className="leader" /><span className="val num pos">{money(TOTAL)}</span>
        </div>
      )}
    </div>
  )
}

export default function SignIn() {
  const [mode, setMode] = useState('in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  const submit = async e => {
    e.preventDefault()
    setError(''); setBusy('email')
    try {
      const { error } = mode === 'in'
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ email, password, name: name.trim() || email.split('@')[0] })
      if (error) setError(message(error))
    } catch (err) { setError(message(err)) }
    setBusy('')
  }

  const google = async () => {
    setError(''); setBusy('google')
    try {
      const { error } = await authClient.signIn.social({ provider: 'google', callbackURL: window.location.origin })
      if (error) { setError(message(error)); setBusy('') }
    } catch (err) { setError(message(err)); setBusy('') }
  }

  return (
    <main className="signin">
      <section className="signin-show">
        <div className="signin-brand"><Brand size={38} /><span><b>Mis Finanzas</b><small>Dinero y tarjeta</small></span></div>
        <div>
          <h2>Cada peso,<br /><span className="muted">en su lugar.</span></h2>
          <p className="muted">Movimientos, presupuesto y tu tarjeta de crédito: cuánto es tuyo, cuánto te deben y cuándo pagas.</p>
          <Receipt />
        </div>
        <small className="muted">Sincronizado entre tu celular, tablet y PC</small>
      </section>

      <section className="signin-form">
        <div className="signin-card rise">
          <div className="signin-brand only-narrow"><Brand size={38} /><span><b>Mis Finanzas</b><small>Dinero y tarjeta</small></span></div>
          <Receipt compact />
          <h1>{mode === 'in' ? 'Hola de nuevo' : 'Abre tu libro de cuentas'}</h1>
          <p className="muted">{mode === 'in' ? 'Entra para ver cómo va tu mes.' : 'Empiezas desde cero y tus datos se sincronizan entre dispositivos.'}</p>

          <button type="button" className="btn btn-brass signin-google" onClick={google} disabled={!!busy}>
            <GoogleLogo />{busy === 'google' ? 'Abriendo Google…' : 'Continuar con Google'}
          </button>
          <div className="signin-or muted">o con tu correo</div>

          <Seg full label="Modo de acceso" value={mode} onChange={v => { setMode(v); setError('') }}
            options={[{ value: 'in', label: 'Entrar' }, { value: 'up', label: 'Crear cuenta' }]} />

          <form onSubmit={submit}>
            {mode === 'up' && (
              <label className="field"><span className="lbl">Nombre</span>
                <input className="input" value={name} onChange={e => setName(e.target.value)} autoComplete="name" /></label>
            )}
            <label className="field"><span className="lbl">Correo</span>
              <input className="input" type="email" inputMode="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></label>
            <label className="field"><span className="lbl">Contraseña</span>
              <span className="pw">
                <input className="input" type={show ? 'text' : 'password'} required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
                  autoComplete={mode === 'in' ? 'current-password' : 'new-password'} />
                <button type="button" className="pw-toggle" onClick={() => setShow(s => !s)} aria-pressed={show}>{show ? 'Ocultar' : 'Ver'}</button>
              </span>
            </label>
            {error && <p role="alert" className="err">{error}</p>}
            <button className="btn btn-ghost" disabled={!!busy}>{busy === 'email' ? 'Un momento…' : mode === 'in' ? 'Entrar' : 'Crear cuenta'}</button>
          </form>
        </div>
      </section>
    </main>
  )
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={{ background: '#fff', borderRadius: 99, padding: 3, width: 24, height: 24 }}>
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.2-2.1 3.5-5.1 3.5-8.8Z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c1-2.9 3.6-4.9 6.7-4.9Z" />
    </svg>
  )
}
