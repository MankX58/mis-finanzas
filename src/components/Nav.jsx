import { useEffect, useLayoutEffect, useRef } from 'react'
import { LayoutDashboard, ReceiptText, CreditCard, Target, Settings, Plus } from 'lucide-react'
import { Brand, Money } from './ui'
import { monthName } from '../finance'
import AppSwitcher from './AppSwitcher'

export const TABS = [
  { id: 'resumen',     label: 'Resumen',      short: 'Resumen', Icon: LayoutDashboard },
  { id: 'movimientos', label: 'Movimientos',  short: 'Movs.',   Icon: ReceiptText },
  { id: 'tarjeta',     label: 'Tarjeta',      short: 'Tarjeta', Icon: CreditCard },
  { id: 'presupuesto', label: 'Presupuesto',  short: 'Presup.', Icon: Target },
  { id: 'ajustes',     label: 'Ajustes',      short: 'Ajustes', Icon: Settings },
]

/** Una sola barra que cambia de forma: inferior (móvil), riel (tablet) o lateral (PC).
 *  El indicador activo se desliza midiendo el elemento activo, sea cual sea el layout. */
export default function Nav({ active, onChange, onAdd, addLabel, month, balance }) {
  const ref = useRef(null)

  useLayoutEffect(() => {
    const nav = ref.current
    const place = () => {
      const el = nav.querySelector('.nav-item[aria-current=page]')
      nav.style.setProperty('--ind-o', el && el.offsetWidth ? 1 : 0)   // pestaña oculta en móvil (Ajustes): sin indicador
      if (!el || !el.offsetWidth) return
      nav.style.setProperty('--ind-x', el.offsetLeft + 'px')
      nav.style.setProperty('--ind-y', el.offsetTop + 'px')
      nav.style.setProperty('--ind-w', el.offsetWidth + 'px')
      nav.style.setProperty('--ind-h', el.offsetHeight + 'px')
    }
    place()
    window.addEventListener('resize', place)
    document.fonts?.ready.then(place)
    return () => window.removeEventListener('resize', place)
  }, [active])

  // Atajos de teclado en escritorio: 1–5 cambian de sección (igual que Mi semestre)
  useEffect(() => {
    const onKey = e => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.target?.closest?.('input, textarea, select, [contenteditable], dialog[open]')) return
      const t = TABS[Number(e.key) - 1]
      if (t) onChange(t.id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onChange])

  return (
    <nav className="nav" ref={ref} aria-label="Principal">
      <div className="nav-brand"><Brand /><span><b>Mis Finanzas</b><small>Dinero y tarjeta</small></span></div>
      <AppSwitcher className="nav-apps" />
      <div className="nav-add">
        <button className="btn-add" onClick={onAdd} aria-label={addLabel}><Plus /><span className="nav-add-label">{addLabel}</span></button>
      </div>
      {TABS.map(({ id, label, short, Icon }, i) => (
        <button key={id} className={`nav-item ${i === 4 ? 'only-wide' : ''}`} style={{ '--o-m': i < 2 ? 1 : 3, '--o-d': i + 2 }}
          aria-current={active === id ? 'page' : undefined} title={label}
          onClick={() => (active === id ? window.scrollTo({ top: 0, behavior: 'smooth' }) : onChange(id))}>
          <Icon />
          <span className="lbl-s">{short}</span><span className="lbl-l">{label}</span>
          <kbd className="nav-kbd num">{i + 1}</kbd>
        </button>
      ))}
      <i className="nav-ind" aria-hidden="true" />
      <div className="nav-foot">
        <small>Balance de {monthName(month)}</small>
        <b className={`display ${balance >= 0 ? 'pos' : 'neg'}`}><Money value={balance} /></b>
      </div>
    </nav>
  )
}
