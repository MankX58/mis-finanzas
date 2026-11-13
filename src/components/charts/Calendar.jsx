import { useState } from 'react'
import { useWidth, Tip } from './kit'
import { fmt, today, dayLabel } from '../../finance'

/** Calendario de calor del gasto diario (un solo tono, del vacío al más caro). */
export default function Calendar({ ym, daily }) {
  const [ref, w] = useWidth()
  const [tip, setTip] = useState(null)
  const [y, m] = ym.split('-').map(Number)
  const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7            // semana empieza en lunes
  const max = Math.max(...daily, 1)
  const t = today()
  const show = (e, d) => {
    const el = e.currentTarget
    setTip({ x: el.offsetLeft + el.offsetWidth / 2, y: el.offsetTop + el.offsetHeight / 2, title: dayLabel(`${ym}-${String(d + 1).padStart(2, '0')}`), rows: [{ label: 'Gastado', value: daily[d] ? fmt(daily[d]) : 'Sin gastos' }] })
  }
  return (
    <div className="cw" ref={ref}>
      <div className="cal" role="img" aria-label="Calendario de gasto diario del mes">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => <span key={i} className="cal-h">{d}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={'b' + i} />)}
        {daily.map((v, d) => {
          const lvl = v ? Math.max(1, Math.ceil((v / max) * 4)) : 0
          const iso = `${ym}-${String(d + 1).padStart(2, '0')}`
          return (
            <button key={d} className={`cal-d l${lvl} ${iso === t ? 'today' : ''}`} style={{ animationDelay: `${(d + lead) * 14}ms` }}
              onPointerEnter={e => show(e, d)} onPointerDown={e => show(e, d)} onPointerLeave={e => e.pointerType !== 'touch' && setTip(null)}
              aria-label={`${d + 1}: ${v ? fmt(v) : 'sin gastos'}`}>
              {d + 1}
            </button>
          )
        })}
      </div>
      <div className="cal-scale"><span>menos</span>{[0, 1, 2, 3, 4].map(l => <i key={l} className={`cal-d l${l}`} />)}<span>más</span></div>
      <Tip tip={tip} w={w} />
    </div>
  )
}
