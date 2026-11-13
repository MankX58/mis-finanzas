import { useMemo } from 'react'
import { Search, ReceiptText, X } from 'lucide-react'
import MonthHead from '../components/MonthHead'
import TxRow from '../components/TxRow'
import { Empty, Seg } from '../components/ui'
import { fmt, dayLabel, monthTitle, thisMonth } from '../finance'

export default function Movimientos({ tx, cats, getCat, filters, setFilters, onEdit, onDelete, onAdd }) {
  const { q, type, cat, month } = filters
  const set = patch => setFilters(f => ({ ...f, ...patch }))
  const options = type ? cats[type] || [] : [...(cats.income || []), ...(cats.expense || [])]

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return [...tx]
      .sort((a, b) => b.date.localeCompare(a.date) || Number(b.id) - Number(a.id))
      .filter(t => !month || t.date.startsWith(month))
      .filter(t => !type || t.type === type)
      .filter(t => !cat || t.category === cat)
      .filter(t => !s || (t.note || '').toLowerCase().includes(s) || getCat(t.type, t.category).name.toLowerCase().includes(s))
  }, [tx, q, type, cat, month, getCat])

  const groups = useMemo(() => {
    const g = []
    for (const t of list) {
      const last = g[g.length - 1]
      if (last && last.date === t.date) last.items.push(t)
      else g.push({ date: t.date, items: [t] })
    }
    return g
  }, [list])

  const inc = list.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0)
  const exp = list.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0)
  const filtered = q || type || cat || month

  return (
    <div className="view">
      <MonthHead title="Movimientos" sub="Todo lo que entra y sale, agrupado por día." />

      <div className="toolbar rise" style={{ '--i': 1 }}>
        <label className="search">
          <Search aria-hidden="true" />
          <input className="input" type="search" placeholder="Buscar por nota o categoría…" value={q} onChange={e => set({ q: e.target.value })} aria-label="Buscar movimientos" />
        </label>
        <Seg label="Tipo" value={type} onChange={v => set({ type: v, cat: '' })}
          options={[{ value: '', label: 'Todo' }, { value: 'income', label: 'Ingresos', cls: 'inc' }, { value: 'expense', label: 'Gastos', cls: 'exp' }]} />
        <Seg label="Periodo" value={month ? 'mes' : 'todo'} onChange={v => set({ month: v === 'mes' ? (month || thisMonth()) : '' })}
          options={[{ value: 'todo', label: 'Todo' }, { value: 'mes', label: month ? monthTitle(month) : 'Este mes' }]} />
      </div>

      <div className="chips rise" style={{ '--i': 2 }} role="group" aria-label="Categorías">
        <button className="chip" aria-pressed={!cat} onClick={() => set({ cat: '' })}>Todas</button>
        {options.map(c => (
          <button key={c.id} className="chip" aria-pressed={cat === c.id} onClick={() => set({ cat: cat === c.id ? '' : c.id })}>
            <i className="dot" style={{ background: c.color }} />{c.name}
          </button>
        ))}
      </div>

      <div className="resultbar rise" style={{ '--i': 3 }}>
        <span>{list.length} movimiento{list.length !== 1 ? 's' : ''}</span>
        <span className="spacer" />
        {inc > 0 && <span className="num pos">+{fmt(inc)}</span>}
        {exp > 0 && <span className="num neg">−{fmt(exp)}</span>}
        {filtered && <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ q: '', type: '', cat: '', month: '' })}><X />Limpiar</button>}
      </div>

      {groups.length === 0 ? (
        <div className="panel"><Empty Icon={ReceiptText} title={filtered ? 'Nada coincide con ese filtro' : 'Aún no hay movimientos'}
          action={!filtered && <button className="btn btn-brass" onClick={onAdd}>Agregar movimiento</button>}>
          {filtered ? 'Prueba con otra búsqueda o limpia los filtros.' : 'Registra tu primer ingreso o gasto para empezar.'}
        </Empty></div>
      ) : (
        groups.map((g, gi) => {
          const dayTotal = g.items.reduce((a, t) => a + (t.type === 'income' ? t.amount : -t.amount), 0)
          return (
            <section key={g.date} className="daygroup">
              <h3 className="rise" style={{ '--i': Math.min(gi, 6) * .4 }}><span>{dayLabel(g.date)}</span><i /><em className={`num ${dayTotal >= 0 ? 'pos' : ''}`}>{dayTotal >= 0 ? '+' : '−'}{fmt(dayTotal)}</em></h3>
              <div className="txlist">
                {g.items.map((t, i) => <TxRow key={t.id} i={gi + i} tx={t} cat={getCat(t.type, t.category)} onEdit={onEdit} onDelete={onDelete} />)}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}
