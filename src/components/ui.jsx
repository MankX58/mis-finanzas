import { useEffect, useId, useRef, useState } from 'react'
import { fmt } from '../finance'

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

export function Brand({ size = 34 }) {
  const id = 'bm' + useId().replace(/:/g, '')      // id único: dos logos con el mismo id rompen el degradado si uno está oculto
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f6c970"/><stop offset="1" stopColor="#d4912b"/></linearGradient></defs>
      <rect width="32" height="32" rx="10" fill={`url(#${id})`}/>
      <path d="M7 23h18" stroke="#1b1305" strokeOpacity=".35" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="0.1 3.4"/>
      <path d="M8 19.5l5-5.5 4 3.2 6.5-8" fill="none" stroke="#1b1305" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="23.5" cy="9.2" r="2" fill="#1b1305"/>
    </svg>
  )
}

/** Número que "rueda" hasta su nuevo valor (easeOutQuart). */
export function useCountUp(target, ms = 900) {
  const [v, setV] = useState(reduced() ? target : 0)
  const from = useRef(reduced() ? target : 0)
  useEffect(() => {
    if (reduced()) { setV(target); from.current = target; return }
    const a = from.current, t0 = performance.now()
    let raf
    const tick = t => {
      const p = Math.min((t - t0) / ms, 1)
      const cur = a + (target - a) * (1 - Math.pow(1 - p, 4))
      from.current = cur
      setV(cur)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

export function Money({ value, signed = false, className = '' }) {
  const v = useCountUp(value)
  const sign = v < -0.5 ? '−' : signed && v > 0.5 ? '+' : ''
  return <span className={`num ${className}`}>{sign}{fmt(v)}</span>
}

/** Hoja modal nativa (<dialog>): foco atrapado y Esc gratis. Hijos solo montados al abrir → formularios frescos. */
export function Sheet({ open, onClose, title, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) { d.showModal(); d.querySelector('[data-af]')?.focus() }   // autoFocus de React corre antes de abrir el <dialog>
    if (!open && d.open) d.close()
  }, [open])
  return (
    <dialog ref={ref} className="sheet" aria-label={title} onClose={onClose}
      onClick={e => { if (e.target === ref.current) onClose() }}>
      {open && (
        <div className="sheet-in">
          <div className="grab" />
          <h2>{title}</h2>
          {children}
        </div>
      )}
    </dialog>
  )
}

/** Campo de monto: guarda solo dígitos, muestra miles con puntos (es-CO). */
export function MoneyInput({ value, onChange, autoFocus, id }) {
  const shown = value === '' ? '' : Number(value).toLocaleString('es-CO')
  return (
    <div className="money">
      <span aria-hidden="true">$</span>
      <input id={id} className="input" inputMode="numeric" placeholder="0" data-af={autoFocus ? '' : undefined} autoComplete="off"
        value={shown} onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 12))} />
    </div>
  )
}

export function Empty({ Icon, title, children, action }) {
  return (
    <div className="empty">
      <div className="art"><Icon /></div>
      <b>{title}</b>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}

export function Seg({ value, onChange, options, full, label }) {
  return (
    <div className={`seg ${full ? 'full' : ''}`} role="group" aria-label={label}>
      {options.map(o => (
        <button key={o.value} type="button" className={o.cls || ''} aria-pressed={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  )
}
