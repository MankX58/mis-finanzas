import { useEffect, useState } from 'react'
import { fmt } from '../../finance'

const GLASS = 'M7 6H73L67.5 138Q67 146 59 146H21Q13 146 12.5 138Z'
const WAVE_A = 'M0 0Q10 -6 20 0T40 0T60 0T80 0T100 0T120 0T140 0T160 0V170H0Z'
const WAVE_B = 'M0 0Q10 5 20 0T40 0T60 0T80 0T100 0T120 0T140 0T160 0V170H0Z'

function Glass({ cat, spent, limit, index, onPick }) {
  const [ready, setReady] = useState(false)
  useEffect(() => { const t = setTimeout(() => setReady(true), 60); return () => clearTimeout(t) }, [])
  const ratio = limit > 0 ? spent / limit : 0
  const pct = Math.min(ratio, 1)
  const over = ratio > 1
  const warn = !over && ratio >= .8
  const fillY = 6 + (1 - pct) * 140                       // superficie del líquido
  const color = over ? 'var(--expense)' : cat.color
  const left = Math.max(limit - spent, 0)
  const rise = -(146 - fillY - 16)
  const uid = `g${cat.id}${index}`.replace(/\W/g, '')

  return (
    <button className={`glass ${over ? 'over' : ''}`} onClick={onPick} aria-label={`${cat.name}: ${fmt(spent)} de ${fmt(limit)}. ${over ? 'Límite superado' : `Quedan ${fmt(left)}`}. Editar`}
      style={{ '--i': index }}>
      <span className={`glass-pct num ${over ? 'bad' : warn ? 'warn' : ''}`}>{over ? `+${Math.round((ratio - 1) * 100)}%` : `${Math.round(ratio * 100)}%`}</span>
      <svg viewBox="0 0 80 156" width="88" height="172" aria-hidden="true">
        <defs><clipPath id={uid}><path d={GLASS} /></clipPath></defs>
        <path d={GLASS} fill="color-mix(in srgb, var(--ink-2) 70%, transparent)" />
        <g clipPath={`url(#${uid})`}>
          <g className="liquid" style={{ transform: `translateY(${ready ? fillY : 150}px)`, transitionDelay: `${index * 110}ms` }}>
            <path d={WAVE_B} className="wave wave-b" fill={color} fillOpacity=".42" />
            <path d={WAVE_A} className="wave wave-a" fill={color} fillOpacity=".9" />
            {pct > .12 && [18, 36, 52].map((bx, k) => (
              <circle key={k} cx={bx + (index % 3) * 3} cy={146 - fillY - 8} r={1.8 + k * .5} className="bubble" style={{ '--rise': `${rise}px`, animationDelay: `${k * 1.1 + index * .4}s`, animationDuration: `${3.2 + k * .8}s` }} fill="#fff" />
            ))}
          </g>
        </g>
        <path d="M11 12L15.5 132" stroke="#fff" strokeOpacity=".14" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <path d={GLASS} fill="none" stroke={over ? 'var(--expense)' : 'var(--line-2)'} strokeWidth="2" strokeLinejoin="round" />
        <line x1="3" x2="77" y1="6" y2="6" stroke={cat.color} strokeWidth="1.6" strokeDasharray="3 3" strokeLinecap="round" />
        {over && <ellipse cx="72" cy="12" rx="2.2" ry="3.4" fill="var(--expense)" className="drip" />}
      </svg>
      <span className="glass-name"><i style={{ background: cat.color }} />{cat.name}</span>
      <span className="glass-amt num">{fmt(spent)}<small> / {fmt(limit)}</small></span>
    </button>
  )
}

export default function Vasos({ budgets, expByCat, getCat, onPick }) {
  return (
    <div className="glasses">
      {budgets.map((b, i) => (
        <Glass key={b.id} index={i} cat={{ ...getCat('expense', b.category), id: b.category }} spent={expByCat[b.category] || 0} limit={b.amount} onPick={() => onPick(b)} />
      ))}
    </div>
  )
}
