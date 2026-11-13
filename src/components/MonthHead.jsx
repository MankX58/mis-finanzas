import { ChevronLeft, ChevronRight } from 'lucide-react'
import { monthTitle, shiftMonth, thisMonth } from '../finance'

/** Cabecera de vista: título grande + selector de mes (con salto rápido a "hoy"). */
export default function MonthHead({ title, sub, month, setMonth, children }) {
  const now = thisMonth()
  return (
    <header className="pagehead rise">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      <span className="spacer" />
      {children}
      {month && (
        <div className="monthsw" role="group" aria-label="Mes">
          <button className="icon-btn" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Mes anterior"><ChevronLeft /></button>
          <b>{monthTitle(month)}</b>
          <button className="icon-btn" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Mes siguiente"><ChevronRight /></button>
          {month !== now && <button className="btn btn-ghost btn-sm" onClick={() => setMonth(now)} style={{ marginLeft: 4 }}>Hoy</button>}
        </div>
      )}
    </header>
  )
}
