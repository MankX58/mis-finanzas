import { useMemo } from 'react'
import { Search, ReceiptText, X, Wallet } from 'lucide-react'
import MonthHead from '../components/MonthHead'
import TxRow, { TransferRow } from '../components/TxRow'
import { Empty, Seg } from '../components/ui'
import { fmt, fmtSigned, dayLabel, monthTitle, thisMonth } from '../finance'

export default function Movimientos({ tx, transfers = [], accounts = [], balances = {}, cats, getCat, filters, setFilters, onEdit, onEditTransfer, onDelete, onAdd }) {
  const { q, type, cat, month, acc = '' } = filters
  const set = patch => setFilters(f => ({ ...f, ...patch }))
  const options = type ? cats[type] || [] : [...(cats.income || []), ...(cats.expense || [])]
  const hasAcc = accounts.length > 0
  const accOf = id => accounts.find(a => a.id === id)
  // acc: '' = todas · 'none' = sin cuenta · <id>
  const inAcc = t => !acc || (acc === 'none' ? !accOf(t.account) : t.account === acc)

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    const base = [...tx]
      .filter(t => !month || t.date.startsWith(month))
      .filter(t => !type || t.type === type)
      .filter(t => !cat || t.category === cat)
      .filter(inAcc)
      .filter(t => !s || (t.note || '').toLowerCase().includes(s) || getCat(t.type, t.category).name.toLowerCase().includes(s))
      .map(t => ({ kind: 'tx', t }))
    // las transferencias solo aparecen cuando no se filtra por tipo ni categoría (no son ingreso ni gasto)
    const moves = type || cat || acc === 'none' ? [] : transfers
      .filter(t => !month || t.date.startsWith(month))
      .filter(t => !acc || t.from === acc || t.to === acc)
      .filter(t => !s || (t.note || 'transferencia').toLowerCase().includes(s))
      .map(t => ({ kind: 'move', t }))
    return [...base, ...moves].sort((a, b) => b.t.date.localeCompare(a.t.date) || Number(b.t.id) - Number(a.t.id))
  }, [tx, transfers, q, type, cat, month, acc, getCat]) // eslint-disable-line react-hooks/exhaustive-deps

  const groups = useMemo(() => {
    const g = []
    for (const t of list) {
      const last = g[g.length - 1]
      if (last && last.date === t.t.date) last.items.push(t)
      else g.push({ date: t.t.date, items: [t] })
    }
    return g
  }, [list])

  const txs = list.filter(x => x.kind === 'tx').map(x => x.t)
  const inc = txs.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0)
  const exp = txs.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0)
  const filtered = q || type || cat || month || acc
  const total = Object.values(balances).reduce((a, v) => a + v, 0)

  return (
    <div className="view">
      <MonthHead title="Movimientos" sub="Todo lo que entra y sale, agrupado por día." />

      {hasAcc && (
        <div className="accstrip rise" style={{ '--i': 1 }} role="group" aria-label="Filtrar por cuenta">
          <button className="acccard" aria-pressed={!acc} onClick={() => set({ acc: '' })}>
            <span className="acccard-h"><Wallet aria-hidden="true" />Todas</span><b className="num">{fmtSigned(total)}</b>
          </button>
          {accounts.map(a => (
            <button key={a.id} className="acccard" aria-pressed={acc === a.id} onClick={() => set({ acc: acc === a.id ? '' : a.id })} style={{ '--ac': a.color }}>
              <span className="acccard-h"><i className="dot" style={{ background: a.color }} aria-hidden="true" />{a.name}</span>
              <b className={`num ${(balances[a.id] || 0) < 0 ? 'neg' : ''}`}>{fmtSigned(balances[a.id] || 0)}</b>
            </button>
          ))}
          {balances[''] !== 0 && (
            <button className="acccard none" aria-pressed={acc === 'none'} onClick={() => set({ acc: acc === 'none' ? '' : 'none' })}>
              <span className="acccard-h">Sin cuenta</span><b className="num">{fmtSigned(balances[''])}</b>
            </button>
          )}
        </div>
      )}

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
        <span>{list.length} movimiento{list.length !== 1 ? 's' : ''}{acc && hasAcc ? ` · ${acc === 'none' ? 'sin cuenta' : accOf(acc)?.name}` : ''}</span>
        <span className="spacer" />
        {inc > 0 && <span className="num pos">+{fmt(inc)}</span>}
        {exp > 0 && <span className="num neg">−{fmt(exp)}</span>}
        {filtered && <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ q: '', type: '', cat: '', month: '', acc: '' })}><X />Limpiar</button>}
      </div>

      {groups.length === 0 ? (
        <div className="panel"><Empty Icon={ReceiptText} title={filtered ? 'Nada coincide con ese filtro' : 'Aún no hay movimientos'}
          action={!filtered && <button className="btn btn-brass" onClick={onAdd}>Agregar movimiento</button>}>
          {filtered ? 'Prueba con otra búsqueda o limpia los filtros.' : 'Registra tu primer ingreso o gasto para empezar.'}
        </Empty></div>
      ) : (
        groups.map((g, gi) => {
          const dayTotal = g.items.reduce((a, { kind, t }) => a + (kind === 'move' ? 0 : t.type === 'income' ? t.amount : -t.amount), 0)
          return (
            <section key={g.date} className="daygroup">
              <h3 className="rise" style={{ '--i': Math.min(gi, 6) * .4 }}><span>{dayLabel(g.date)}</span><i />{g.items.some(x => x.kind === 'tx') && <em className={`num ${dayTotal >= 0 ? 'pos' : ''}`}>{dayTotal >= 0 ? '+' : '−'}{fmt(dayTotal)}</em>}</h3>
              <div className="txlist">
                {g.items.map(({ kind, t }, i) => kind === 'move'
                  ? <TransferRow key={'m' + t.id} i={gi + i} t={t} from={accOf(t.from)} to={accOf(t.to)} onEdit={onEditTransfer} />
                  : <TxRow key={t.id} i={gi + i} tx={t} cat={getCat(t.type, t.category)} account={hasAcc ? accOf(t.account) : null} onEdit={onEdit} onDelete={onDelete} />)}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}
