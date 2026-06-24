import { useState, useEffect } from 'react'
import { fmt, hexAlpha } from '../finance'

const VASO_H = 160

export default function VasoChart({ budgets, expByCat, getCat }) {
  // animated controls: start all fills at 0, then rise to real value
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    // tiny delay so the browser paints height:0 first, then transitions up
    const t = setTimeout(() => setAnimated(true), 60)
    return () => clearTimeout(t)
  }, [])

  if (!budgets.length) {
    return (
      <div id="vasoWrap">
        <div className="empty" style={{flex:1}}>
          <span className="empty-icon">🎯</span>
          Agrega presupuestos para ver el gráfico
        </div>
      </div>
    )
  }

  return (
    <div id="vasoWrap">
      {budgets.map((b, index) => {
        const cat      = getCat('expense', b.category)
        const spent    = expByCat[b.category] || 0
        const pct      = b.amount > 0 ? Math.min(spent / b.amount, 1) : 0
        const fillH    = Math.round(pct * VASO_H)
        const over     = spent > b.amount
        const pctLabel = over
          ? '⚠ +' + Math.round((spent / b.amount - 1) * 100) + '%'
          : Math.round(pct * 100) + '%'
        const pctColor = over ? '#f28b82' : pct >= 0.8 ? '#fdd663' : 'var(--muted)'

        // stagger each vaso by 80ms
        const delay = `${index * 80}ms`

        return (
          <div key={b.id} className="vaso-col">
            <div className="vaso-pct" style={{color: pctColor}}>{pctLabel}</div>
            <div
              className="vaso-outer"
              style={{
                outline:      `2px dashed ${hexAlpha(cat.color, .5)}`,
                background:   hexAlpha(cat.color, .06),
                borderRadius: '6px 6px 3px 3px',
                border:       'none',
              }}
              title={`${cat.name}: ${fmt(spent)} / ${fmt(b.amount)}`}
            >
              <div
                className="vaso-fill"
                style={{
                  height:     animated ? `${fillH}px` : '0px',
                  background: hexAlpha(cat.color, .75),
                  transition: `height 1.4s cubic-bezier(0.34, 1.20, 0.64, 1) ${delay}`,
                }}
              />
              {over && (
                <div
                  className="vaso-over-line"
                  style={{
                    bottom:      `${VASO_H - 2}px`,
                    borderColor: cat.color,
                    opacity:     animated ? 0.9 : 0,
                    transition:  `opacity 0.3s ease ${delay}`,
                  }}
                />
              )}
            </div>
            <div className="vaso-amounts">
              {fmt(spent)}
              <span style={{color: cat.color}}>{fmt(b.amount)}</span>
            </div>
            <div className="vaso-label">{cat.name}</div>
          </div>
        )
      })}
    </div>
  )
}