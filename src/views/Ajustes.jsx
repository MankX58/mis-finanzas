import { useMemo, useState } from 'react'
import { LogOut, Plus, Tags, Trash2 } from 'lucide-react'
import MonthHead from '../components/MonthHead'
import { Empty, Seg } from '../components/ui'
import { fmt, thisMonth } from '../finance'

export default function Ajustes({ user, onSignOut, cats, tx, onNew, onEdit, onDelete }) {
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
      <MonthHead title="Ajustes" sub="Tu cuenta y tus categorías." />

      <section className="panel account rise" style={{ '--i': 1 }}>
        <span className="avatar grad-brass">{(user.name || user.email || '?').trim().charAt(0).toUpperCase()}</span>
        <div className="account-info">
          <b>{user.name || 'Tu cuenta'}</b>
          <span className="muted">{user.email}</span>
        </div>
        <button className="btn btn-danger btn-sm" onClick={onSignOut}><LogOut />Cerrar sesión</button>
      </section>

      <div className="section-h rise" style={{ '--i': 2 }}>
        <div>
          <h2>Categorías</h2>
          <p className="muted">Ponles nombre y color a tus ingresos y gastos.</p>
        </div>
        <span className="spacer" />
        <Seg label="Tipo de categoría" value={tab} onChange={setTab} options={[{ value: 'expense', label: 'Gastos', cls: 'exp' }, { value: 'income', label: 'Ingresos', cls: 'inc' }]} />
        <button className="btn btn-brass btn-sm" onClick={() => onNew(tab)}><Plus />Nueva</button>
      </div>

      {list.length === 0 ? (
        <div className="panel"><Empty Icon={Tags} title="Sin categorías" action={<button className="btn btn-brass" onClick={() => onNew(tab)}>Crear una</button>}>Crea la primera para poder clasificar tus movimientos.</Empty></div>
      ) : (
        <div className="catgrid">
          {list.map((c, i) => {
            const st = stats[tab + ':' + c.id] || { n: 0, mes: 0 }
            return (
              <div key={c.id} className="catcard rise" style={{ '--i': i * .5 + 2 }}>
                <span className="catcard-dot" style={{ background: c.color }} />
                <button type="button" className="catcard-edit" onClick={() => onEdit(tab, c)} aria-label={`Editar ${c.name}`}><b>{c.name}</b></button>
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
