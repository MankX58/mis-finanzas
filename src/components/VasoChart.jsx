import { fmt, hexAlpha } from '../finance'

const VASO_H = 160

export default function VasoChart({ budgets, expByCat, getCat }) {
  if (!budgets.length) {
    return (
      <div id="vasoWrap">
        <div className="empty" style={{flex:1}}><div className="empty-icon">🎯</div>Agrega presupuestos para ver el gráfico</div>
      </div>
    )
  }

  return (
    <div id="vasoWrap">
      {budgets.map(b => {
        const cat = getCat('expense', b.category)
        const spent = expByCat[b.category] || 0
        const pct = b.amount > 0 ? Math.min(spent / b.amount, 1) : 0
        const fillH = Math.round(pct * VASO_H)
        const over = spent > b.amount
        const pctLabel = over ? '⚠ +' + Math.round((spent / b.amount - 1) * 100) + '%' : Math.round(pct * 100) + '%'
        const pctColor = over ? '#f28b82' : pct >= 0.8 ? '#fdd663' : 'var(--muted)'

        return (
          <div key={b.id} className="vaso-col">
            <div className="vaso-pct" style={{color:pctColor}}>{pctLabel}</div>
            <div
              className="vaso-outer"
              style={{
                outline: `2px dashed ${hexAlpha(cat.color,.5)}`,
                background: hexAlpha(cat.color,.06),
                borderRadius: '6px 6px 3px 3px',
                border: 'none',
              }}
              title={`${cat.name}: ${fmt(spent)} / ${fmt(b.amount)}`}
            >
              <div className="vaso-fill" style={{height:`${fillH}px`,background:hexAlpha(cat.color,.75)}}></div>
              {over && <div className="vaso-over-line" style={{bottom:`${VASO_H-2}px`,borderColor:cat.color}}></div>}
            </div>
            <div className="vaso-amounts">
              {fmt(spent)}
              <span style={{color:cat.color}}>{fmt(b.amount)}</span>
            </div>
            <div className="vaso-label">{cat.name}</div>
          </div>
        )
      })}
    </div>
  )
}