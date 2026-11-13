import { useState } from 'react'
import { useWidth, niceTicks, Tip } from './kit'
import { fmt, fmtShort, dayShort, dayLabel, addDays, diffDays, today } from '../../finance'

/** "Pulso del ciclo": gasto por día desde el inicio del ciclo hasta la fecha de pago,
 *  tuyo (abajo) y ajeno (arriba), con corte, ventana de pago y hoy marcados. */
export default function CycleStrip({ start, cut, pay, byDay, height = 200 }) {
  const [ref, w] = useWidth()
  const [hi, setHi] = useState(null)
  const n = diffDays(start, pay) + 1
  const days = Array.from({ length: n }, (_, i) => addDays(start, i))
  const padL = 44, padR = 8, padT = 46, padB = 34
  const iw = Math.max(w - padL - padR, 10), ih = height - padT - padB
  const band = iw / n
  const bw = Math.max(2, Math.min(18, band * .66))
  const totals = days.map(d => (byDay[d]?.own || 0) + (byDay[d]?.ext || 0))
  const ticks = niceTicks(Math.max(...totals, 1), 3)
  const top = ticks[ticks.length - 1]
  const y = v => padT + ih - (v / top) * ih
  const X = i => padL + band * i
  const ci = diffDays(start, cut), pi = n - 1, ti = diffDays(start, today())
  const tip = hi != null && {
    x: X(hi) + band / 2, y: padT + 40, title: dayLabel(days[hi]),
    rows: [
      { color: 'var(--own)', label: 'Tuyo', value: fmt(byDay[days[hi]]?.own || 0) },
      { color: 'var(--ext)', label: 'Ajeno', value: fmt(byDay[days[hi]]?.ext || 0) },
    ],
  }
  const rect = (i, v0, v1, fill, k) => v1 > v0 && (
    <rect key={k} x={X(i) + (band - bw) / 2} y={y(v1)} width={bw} height={y(v0) - y(v1)} rx={Math.min(3, bw / 2)} fill={fill} stroke="var(--ink-1)" strokeWidth="1.5"
      className="seg-bar" style={{ animationDelay: `${i * 22}ms` }} />
  )

  return (
    <div className="cw" ref={ref}>
      {w > 0 && (
        <svg width={w} height={height} role="img" aria-label="Gasto diario del ciclo de la tarjeta con fecha de corte y de pago">
          <rect x={X(ci + 1)} y={padT} width={Math.max(X(n) - X(ci + 1), 0)} height={ih} className="payzone" />
          {ticks.map(t => (
            <g key={t}>
              <line x1={padL} x2={w - padR} y1={y(t)} y2={y(t)} className={t === 0 ? 'axis' : 'gl'} />
              <text x={padL - 8} y={y(t) + 4} textAnchor="end" className="tick">{t === 0 ? '0' : fmtShort(t)}</text>
            </g>
          ))}
          {days.map((d, i) => {
            const o = byDay[d]?.own || 0, e = byDay[d]?.ext || 0
            return <g key={d} className={hi != null && hi !== i ? 'dim' : ''}>{rect(i, 0, o, 'var(--own)', 'o')}{rect(i, o, o + e, 'var(--ext)', 'e')}</g>
          })}
          <g className="flag">
            <line x1={X(ci + 1)} x2={X(ci + 1)} y1={padT - 24} y2={padT + ih} strokeDasharray="3 3" />
            <text x={X(ci + 1) - 6} y={padT - 28} textAnchor="end">Corte · {dayShort(cut)}</text>
            <line x1={X(pi + 1) - 1} x2={X(pi + 1) - 1} y1={padT - 8} y2={padT + ih} strokeDasharray="3 3" className="pay" />
            <text x={w - padR} y={padT - 12} textAnchor="end" className="pay">Pago · {dayShort(pay)}</text>
          </g>
          {ti >= 0 && ti < n && (
            <g className="today-mark">
              <line x1={X(ti) + band / 2} x2={X(ti) + band / 2} y1={padT} y2={padT + ih + 6} />
              <path d={`M${X(ti) + band / 2 - 5},${padT + ih + 14}l5,-8l5,8z`} />
              <text x={X(ti) + band / 2} y={padT + ih + 27} textAnchor="middle">hoy</text>
            </g>
          )}
          <text x={padL} y={height - 4} className="tick">{dayShort(start)}</text>
          {days.map((d, i) => (
            <rect key={d} x={X(i)} y={0} width={band} height={height} fill="transparent"
              onPointerEnter={() => setHi(i)} onPointerDown={() => setHi(i)} onPointerLeave={e => e.pointerType !== 'touch' && setHi(null)} />
          ))}
        </svg>
      )}
      <Tip tip={tip} w={w} />
    </div>
  )
}
