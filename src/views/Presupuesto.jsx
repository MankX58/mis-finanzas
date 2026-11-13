import { useMemo } from 'react'
import { Plus, Target, Trash2, Pencil } from 'lucide-react'
import MonthHead from '../components/MonthHead'
import { Empty, Money } from '../components/ui'
import { ChartPanel } from '../components/charts/kit'
import Vasos from '../components/charts/Vasos'
import { fmt, monthTotals, monthTitle, daysInMonth, thisMonth, today } from '../finance'

export default function Presupuesto({ tx, budgets, getCat, month, setMonth, onNew, onEdit, onDelete }) {
  const T = useMemo(() => monthTotals(tx, month), [tx, month])
  const now = thisMonth()
  const [y, m] = month.split('-').map(Number)
  const dim = daysInMonth(y, m)
  const dayNow = month === now ? Number(today().slice(8)) : month < now ? dim : 0
  const daysLeft = month === now ? dim - dayNow + 1 : 0

  const totalLimit = budgets.reduce((a, b) => a + b.amount, 0)
  const totalSpent = budgets.reduce((a, b) => a + (T.byCat[b.category] || 0), 0)
  const left = totalLimit - totalSpent
  const sorted = useMemo(() => [...budgets].sort((a, b) => (T.byCat[b.category] || 0) / b.amount - (T.byCat[a.category] || 0) / a.amount), [budgets, T])
  const overs = budgets.filter(b => (T.byCat[b.category] || 0) > b.amount).length

  return (
    <div className="view">
      <MonthHead title="Presupuesto" sub="Cada vaso es un límite mensual: míralo llenarse." month={month} setMonth={setMonth}>
        <button className="btn btn-brass" onClick={onNew}><Plus />Nuevo presupuesto</button>
      </MonthHead>

      {budgets.length === 0 ? (
        <div className="panel rise" style={{ '--i': 1 }}>
          <Empty Icon={Target} title="Aún no tienes presupuestos" action={<button className="btn btn-brass" onClick={onNew}>Crear el primero</button>}>
            Ponle un tope mensual a una categoría —por ejemplo Comida— y verás cómo se llena el vaso.
          </Empty>
        </div>
      ) : (
        <>
          <div className="grid g3">
            <div className="panel rise stat" style={{ '--i': 1 }}><span className="muted">Presupuestado</span><b className="display num"><Money value={totalLimit} /></b></div>
            <div className="panel rise stat" style={{ '--i': 2 }}><span className="muted">Gastado en esas categorías</span><b className="display num"><Money value={totalSpent} /></b></div>
            <div className="panel rise stat" style={{ '--i': 3 }}>
              <span className="muted">{left >= 0 ? 'Disponible' : 'Te pasaste por'}</span>
              <b className={`display num ${left >= 0 ? 'pos' : 'neg'}`}><Money value={Math.abs(left)} /></b>
              {daysLeft > 0 && left > 0 && <small className="muted">≈ {fmt(left / daysLeft)} por día, {daysLeft} días restantes</small>}
              {overs > 0 && <small className="neg">{overs} categoría{overs > 1 ? 's' : ''} sobre el límite</small>}
            </div>
          </div>

          <ChartPanel className="rise" style={{ '--i': 4 }} title={`Vasos de ${monthTitle(month)}`} sub="La línea punteada es el límite · toca un vaso para editarlo"
            table={{ head: ['Categoría', 'Gastado', 'Límite', 'Uso'], rows: sorted.map(b => [getCat('expense', b.category).name, fmt(T.byCat[b.category] || 0), fmt(b.amount), Math.round(((T.byCat[b.category] || 0) / b.amount) * 100) + '%']) }}>
            <Vasos budgets={sorted} expByCat={T.byCat} getCat={getCat} onPick={b => onEdit(b)} />
          </ChartPanel>

          <section className="panel rise" style={{ '--i': 5, marginTop: 16 }}>
            <div className="panel-h"><h3>Detalle por categoría</h3></div>
            <div className="blist">
              {sorted.map(b => {
                const cat = getCat('expense', b.category)
                const spent = T.byCat[b.category] || 0
                const ratio = spent / b.amount
                const over = ratio > 1
                const proj = dayNow > 2 && month === now ? (spent / dayNow) * dim : null
                const willOver = proj != null && !over && proj > b.amount
                return (
                  <div key={b.id} className="brow">
                    <div className="brow-top">
                      <span className="brow-name"><i style={{ background: cat.color }} />{cat.name}</span>
                      <span className="num brow-amt">{fmt(spent)} <small>/ {fmt(b.amount)}</small></span>
                      <button className="icon-btn" onClick={() => onEdit(b)} aria-label={`Editar presupuesto de ${cat.name}`}><Pencil /></button>
                      <button className="icon-btn danger" onClick={() => onDelete(b.id)} aria-label={`Eliminar presupuesto de ${cat.name}`}><Trash2 /></button>
                    </div>
                    <div className="bar" role="progressbar" aria-valuenow={Math.round(ratio * 100)} aria-valuemin="0" aria-valuemax="100" aria-label={`${cat.name} usado`}>
                      <b style={{ width: `${Math.min(ratio, 1) * 100}%`, background: over ? 'var(--expense)' : cat.color }} />
                      {proj != null && !over && <i className="bar-proj" style={{ left: `${Math.min(proj / b.amount, 1) * 100}%` }} title="Proyección a fin de mes" />}
                    </div>
                    <div className="brow-foot">
                      <span className={over ? 'neg' : ratio >= .8 ? 'warn' : 'muted'}>
                        {over ? `Superado por ${fmt(spent - b.amount)}` : `Quedan ${fmt(b.amount - spent)}`}
                      </span>
                      {willOver && <span className="warn">A este ritmo lo superarás (~{fmt(proj)})</span>}
                      <span className="num muted">{Math.round(ratio * 100)}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
