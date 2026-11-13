import { useMemo, useState } from 'react'
import { Plus, Tags, Trash2 } from 'lucide-react'
import MonthHead from '../components/MonthHead'
import { Empty, Seg } from '../components/ui'
import { fmt, hexAlpha, thisMonth } from '../finance'

export default function Categorias({ cats, tx, onNew, onDelete }) {
  const [tab, setTab] = useState('expense')
  const month = thisMonth()
  const stats = useMemo(() => {
    const s = {}
    for (const t of tx) {
      const k = t.type + ':' + t.category
      const r = (s[k] ||= { n: 0, mes: 0 })
      r.n++
      if (t.date.startsWith(month)) r.mes += t.amount
    }
    return s
  }, [tx, month])
  const list = cats[tab] || []

  return (
    <div className="view">
      <MonthHead title="Categorías" sub="Ponles nombre y color a tus ingresos y gastos.">
        <button className="btn btn-brass" onClick={() => onNew(tab)}><Plus />Nueva categoría</button>
      </MonthHead>

      <div className="rise" style={{ '--i': 1, marginBottom: 16 }}>
        <Seg label="Tipo de categoría" value={tab} onChange={setTab} options={[{ value: 'expense', label: 'Gastos', cls: 'exp' }, { value: 'income', label: 'Ingresos', cls: 'inc' }]} />
      </div>

      {list.length === 0 ? (
        <div className="panel"><Empty Icon={Tags} title="Sin categorías" action={<button className="btn btn-brass" onClick={() => onNew(tab)}>Crear una</button>}>Crea la primera para poder clasificar tus movimientos.</Empty></div>
      ) : (
        <div className="catgrid">
          {list.map((c, i) => {
            const st = stats[tab + ':' + c.id] || { n: 0, mes: 0 }
            return (
              <div key={c.id} className="catcard rise" style={{ '--i': i * .5 + 2, '--c': c.color, background: `linear-gradient(135deg, ${hexAlpha(c.color, .16)}, transparent 60%), var(--ink-1)` }}>
                <span className="catcard-dot" style={{ background: c.color }} />
                <b>{c.name}</b>
                <span className="muted num">{st.n} movimiento{st.n !== 1 ? 's' : ''}{st.mes > 0 ? ` · ${fmt(st.mes)} este mes` : ''}</span>
                <button className="icon-btn danger" onClick={() => onDelete(tab, c.id)} aria-label={`Eliminar ${c.name}`}><Trash2 /></button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
