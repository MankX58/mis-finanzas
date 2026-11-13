import { useRef, useState } from 'react'
import { useWidth, niceTicks, Tip } from './kit'
import { fmtShort, fmt } from '../../finance'

/** Ritmo del mes: gasto acumulado día a día vs. el mes anterior, con proyección a fin de mes.
 *  cur: acumulado hasta hoy (puede ser más corto que `days`) · prev: acumulado del mes anterior. */
export default function Pace({ cur, prev, days, proj, label, prevLabel, height = 230 }) {
  const [ref, w] = useWidth()
  const [hi, setHi] = useState(null)
  const timer = useRef(0)
  const padL = 46, padR = 14, padT = 14, padB = 28
  const iw = Math.max(w - padL - padR, 10), ih = height - padT - padB
  const span = Math.max(days - 1, 1)
  const max = Math.max(1, ...cur, ...prev, proj || 0)
  const ticks = niceTicks(max)
  const top = ticks[ticks.length - 1]
  const x = d => padL + (d / span) * iw
  const y = v => padT + ih - (v / top) * ih
  const line = arr => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('')
  const last = cur.length - 1
  const area = cur.length > 1 ? `${line(cur)}L${x(last)},${y(0)}L${x(0)},${y(0)}Z` : ''
  const xt = [0, 4, 9, 14, 19, 24, days - 1].filter((d, i, a) => d <= days - 1 && a.indexOf(d) === i && (days - 1 - d > 2 || d === days - 1))

  const move = e => {
    clearTimeout(timer.current)
    const r = e.currentTarget.getBoundingClientRect()
    const d = Math.round(((e.clientX - r.left - padL) / iw) * span)
    setHi(Math.min(Math.max(d, 0), days - 1))
  }
  const leave = e => {
    if (e.pointerType === 'touch') timer.current = setTimeout(() => setHi(null), 3200)
    else setHi(null)
  }

  const tip = hi != null && {
    x: x(hi), y: padT + 34, title: `Día ${hi + 1}`,
    rows: [
      ...(hi < cur.length ? [{ color: 'var(--expense)', label: label, value: fmt(cur[hi]) }] : []),
      ...(hi < prev.length ? [{ color: 'var(--muted)', dash: true, label: prevLabel, value: fmt(prev[hi]) }] : []),
    ],
  }

  return (
    <div className="cw" ref={ref}>
      {w > 0 && (
        <svg width={w} height={height} role="img" aria-label="Gasto acumulado del mes comparado con el mes anterior">
          <defs>
            <linearGradient id="pace-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--expense)" stopOpacity=".34" /><stop offset="1" stopColor="var(--expense)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {ticks.map(t => (
            <g key={t}>
              <line x1={padL} x2={w - padR} y1={y(t)} y2={y(t)} className={t === 0 ? 'axis' : 'gl'} />
              <text x={padL - 8} y={y(t) + 4} textAnchor="end" className="tick">{t === 0 ? '0' : fmtShort(t)}</text>
            </g>
          ))}
          {xt.map(d => <text key={d} x={x(d)} y={height - 8} textAnchor="middle" className="tick">{d + 1}</text>)}
          {prev.length > 1 && <path d={line(prev)} className="ln prev" />}
          {area && <path d={area} fill="url(#pace-fill)" className="area-in" />}
          {proj != null && cur.length > 0 && last < days - 1 && (
            <path d={`M${x(last)},${y(cur[last])}L${x(days - 1)},${y(proj)}`} className="ln proj" />
          )}
          {cur.length > 1 && <path d={line(cur)} className="ln cur" pathLength="1" />}
          {cur.length > 0 && <circle cx={x(last)} cy={y(cur[last])} r="4.5" className="pulse-dot" />}
          {hi != null && (
            <g pointerEvents="none">
              <line x1={x(hi)} x2={x(hi)} y1={padT} y2={y(0)} className="cross" />
              {hi < cur.length && <circle cx={x(hi)} cy={y(cur[hi])} r="5" fill="var(--expense)" stroke="var(--ink-1)" strokeWidth="2" />}
              {hi < prev.length && <circle cx={x(hi)} cy={y(prev[hi])} r="4.5" fill="var(--muted)" stroke="var(--ink-1)" strokeWidth="2" />}
            </g>
          )}
          <rect x={padL} y={0} width={iw} height={height} fill="transparent" onPointerMove={move} onPointerDown={move} onPointerLeave={leave} />
        </svg>
      )}
      <Tip tip={tip} w={w} />
    </div>
  )
}
