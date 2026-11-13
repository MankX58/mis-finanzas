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

export default function SignIn() {
  const [mode, setMode] = useState('in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      <div className="signin-card rise">
        <Brand size={44} />
        <h1>{mode === 'in' ? 'Hola de nuevo' : 'Crea tu cuenta'}</h1>
        <p className="muted">{mode === 'in' ? 'Entra para ver tus finanzas.' : 'Empiezas desde cero; tus datos se sincronizan entre dispositivos.'}</p>

        <button type="button" className="btn btn-brass" onClick={google} disabled={!!busy}>
          {busy === 'google' ? 'Abriendo Google…' : 'Continuar con Google'}
        </button>
        <div className="signin-or muted">o con tu correo</div>

        <Seg full label="Modo" value={mode} onChange={v => { setMode(v); setError('') }}
          options={[{ value: 'in', label: 'Entrar' }, { value: 'up', label: 'Crear cuenta' }]} />

        <form onSubmit={submit}>
          {mode === 'up' && (
            <label className="field"><span className="lbl">Nombre</span>
              <input className="input" value={name} onChange={e => setName(e.target.value)} autoComplete="name" /></label>
          )}
          <label className="field"><span className="lbl">Correo</span>
            <input className="input" type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></label>
          <label className="field"><span className="lbl">Contraseña</span>
            <input className="input" type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
              autoComplete={mode === 'in' ? 'current-password' : 'new-password'} /></label>
          {error && <p role="alert" className="err">{error}</p>}
          <button className="btn btn-ghost" disabled={!!busy}>{busy === 'email' ? '…' : mode === 'in' ? 'Entrar' : 'Crear cuenta'}</button>
        </form>
      </div>
    </main>
  )
}
