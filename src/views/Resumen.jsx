import { useMemo, useState } from 'react'
import { ArrowRight, CreditCard, PiggyBank, TrendingDown, TrendingUp, ReceiptText, Wallet } from 'lucide-react'
import MonthHead from '../components/MonthHead'
import TxRow from '../components/TxRow'
import { Empty, Money } from '../components/ui'
import { ChartPanel, Legend } from '../components/charts/kit'
import Donut from '../components/charts/Donut'
import Pace from '../components/charts/Pace'
import Columns from '../components/charts/Columns'
import Calendar from '../components/charts/Calendar'
import {
  fmt, fmtSigned, monthTotals, monthTitle, monthName, monthShort, shiftMonth, dailyExpenses, cumulative, lastMonths,
  daysInMonth, thisMonth, today, cardOverview, dayShort, relDays, diffDays,
} from '../finance'

const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export default function Resumen({ tx, getCat, month, setMonth, card, cardTx, cardPaid, goTo, onEdit, onDelete, onAdd }) {
  const [active, setActive] = useState(null)
  const now = thisMonth()
  const T = useMemo(() => monthTotals(tx, month), [tx, month])
  const P = useMemo(() => monthTotals(tx, shiftMonth(month, -1)), [tx, month])
  const prevName = monthName(shiftMonth(month, -1))

  // ─── gasto por categoría ────────────────────────────────────────────────────
  const cats = useMemo(() => Object.entries(T.byCat)
    .map(([id, value]) => ({ id, value, ...getCat('expense', id) }))
    .sort((a, b) => b.value - a.value), [T, getCat])

  // ─── ritmo del mes ──────────────────────────────────────────────────────────
  const pace = useMemo(() => {
    const daily = dailyExpenses(tx, month)
    const prevCum = cumulative(dailyExpenses(tx, shiftMonth(month, -1)))
    const dim = daily.length
    const upto = month === now ? Number(today().slice(8)) : month < now ? dim : 0
    const cur = cumulative(daily).slice(0, upto)
    const proj = month === now && upto >= 3 ? Math.round((cur[upto - 1] / upto) * dim) : null
    const mine = cur[upto - 1] ?? 0
    const theirs = prevCum[Math.min(upto, prevCum.length) - 1] ?? 0
    return { daily, prevCum, cur, proj, mine, theirs, upto, dim }
  }, [tx, month, now])

  // ─── semana tipo (promedio por día de la semana, últimos 3 meses) ───────────
  const week = useMemo(() => {
    const sum = Array(7).fill(0), cnt = Array(7).fill(0)
    for (const k of [-2, -1, 0]) {
      const ym = shiftMonth(month, k)
      const [y, m] = ym.split('-').map(Number)
      const lim = ym === now ? Number(today().slice(8)) : ym > now ? 0 : daysInMonth(y, m)
      dailyExpenses(tx, ym).forEach((v, d) => {
        if (d >= lim) return
        const w = (new Date(y, m - 1, d + 1).getDay() + 6) % 7
        sum[w] += v; cnt[w]++
      })
    }
    const avg = sum.map((s, i) => (cnt[i] ? s / cnt[i] : 0))
    const top = avg.indexOf(Math.max(...avg))
    return { avg, top }
  }, [tx, month, now])

  const flow = useMemo(() => lastMonths(tx, month, 6), [tx, month])
  const recent = useMemo(() => [...tx].sort((a, b) => b.date.localeCompare(a.date) || Number(b.id) - Number(a.id)).slice(0, 5), [tx])
  const noData = !tx.length

  // ─── tarjeta ────────────────────────────────────────────────────────────────
  const co = card ? cardOverview(card, cardTx, cardPaid) : null
  const nextDue = co?.due[0]

  // Mes actual: lo que debes hoy en la tarjeta (solo lo tuyo, mismo número que la tarjeta de abajo y la pestaña Tarjeta).
  // Otros meses: tus compras propias con tarjeta hechas ese mes.
  const isNow = month === now
  const cardOwn = isNow && co ? co.debt : cardTx.filter(t => !t.who && t.date.startsWith(month)).reduce((a, t) => a + t.amount, 0)
  const withCard = T.bal - cardOwn

  const saved = T.inc > 0 ? Math.round((T.bal / T.inc) * 100) : null
  const expDelta = P.exp > 0 ? Math.round(((T.exp - P.exp) / P.exp) * 100) : null

  return (
    <div className="view">
      <MonthHead title="Resumen" sub="Cómo va tu dinero este mes, de un vistazo." month={month} setMonth={setMonth} />

      {noData && (
        <div className="panel rise" style={{ '--i': 0, marginBottom: 16 }}>
          <Empty Icon={Wallet} title="Tu libro está en blanco"
            action={<button className="btn btn-brass" onClick={onAdd}>Registrar el primer movimiento</button>}>
            Anota un ingreso o un gasto y aquí aparecerán el balance, los gráficos y el ritmo del mes.
          </Empty>
        </div>
      )}

      {/* Balance + tarjeta */}
      <div className="grid g21">
        <section className="panel rise" style={{ '--i': 1 }}>
          <div className="panel-h"><h3>Tus cuentas de {monthTitle(month)}</h3>
            {saved !== null && <span className={`delta ${saved >= 0 ? 'good' : 'bad'}`}><PiggyBank />{saved >= 0 ? `Ahorraste el ${saved}% de lo que entró` : 'Gastaste más de lo que entró'}</span>}
          </div>
          <div className="accounts">
            <div className="acct">
              <span className="muted">Sin tarjeta</span>
              <b className={`display hero-num ${T.bal >= 0 ? '' : 'neg'}`}><Money value={T.bal} /></b>
              <small className="muted">Ingresos menos gastos</small>
            </div>
            <div className="acct">
              <span className="muted">Con tarjeta</span>
              <b className={`display hero-num ${withCard >= 0 ? '' : 'neg'}`}><Money value={withCard} /></b>
              <small className="muted">{cardOwn > 0 ? (isNow ? 'Descontando lo que debes en la tarjeta' : 'Descontando tus compras con tarjeta del mes') : 'No debes nada en la tarjeta'}</small>
            </div>
          </div>
          <div className="ledger">
            <div className="lrow"><span className="lbl">Entraron</span><i className="leader" /><span className="val num pos">+{fmt(T.inc)}</span></div>
            <div className="lrow"><span className="lbl">Salieron</span><i className="leader" />
              {expDelta !== null && <span className={`delta ${expDelta <= 0 ? 'good' : 'bad'}`}>{expDelta <= 0 ? <TrendingDown /> : <TrendingUp />}{Math.abs(expDelta)}% vs {prevName}</span>}
              <span className="val num neg">−{fmt(T.exp)}</span></div>
            <div className="lrow total"><span className="lbl">Te quedan sin tarjeta</span><i className="leader" /><span className={`val num ${T.bal >= 0 ? 'pos' : 'neg'}`}>{fmtSigned(T.bal)}</span></div>
            <div className="lrow"><span className="lbl">{isNow ? 'Deuda de la tarjeta · solo lo tuyo' : 'Compras con tarjeta · solo lo tuyo'}</span><i className="leader" /><span className="val num neg">−{fmt(cardOwn)}</span></div>
            <div className="lrow total"><span className="lbl">Te quedan con tarjeta</span><i className="leader" /><span className={`val num ${withCard >= 0 ? 'pos' : 'neg'}`}>{fmtSigned(withCard)}</span></div>
          </div>
        </section>

        <button className="panel cardwidget rise" style={{ '--i': 2 }} onClick={() => goTo('tarjeta')}>
          <span className="cw-ico"><CreditCard /></span>
          {!card ? (
            <>
              <b>Controla tu tarjeta de crédito</b>
              <span className="muted">Configura tu corte y tu pago, anota compras y separa lo que es de otras personas.</span>
              <span className="cw-go">Configurar <ArrowRight /></span>
            </>
          ) : nextDue ? (
            <>
              <span className="muted">Debes pagar el {dayShort(nextDue.pay)}</span>
              <b className="display num cw-amt"><Money value={nextDue.own} /></b>
              <span className={`delta ${diffDays(today(), nextDue.pay) < 0 ? 'bad' : ''}`}>{diffDays(today(), nextDue.pay) < 0 ? 'Vencido ' : 'Vence '}{relDays(diffDays(today(), nextDue.pay))}</span>
              <span className="cw-go">Ver tarjeta <ArrowRight /></span>
            </>
          ) : (
            <>
              <span className="muted">Tarjeta al día · cierra {relDays(co.daysToCut)}</span>
              <b className="display num cw-amt"><Money value={co.open.own} /></b>
              <span className="muted">llevas en este ciclo (solo lo tuyo)</span>
              <span className="cw-go">Ver tarjeta <ArrowRight /></span>
            </>
          )}
        </button>
      </div>

      {/* Dónde se va + ritmo */}
      <div className="grid g2">
        <ChartPanel className="rise" style={{ '--i': 3 }} title="¿A dónde se va el dinero?" sub={cats.length ? `${cats.length} categorías en ${monthName(month)}` : ''}
          table={{ head: ['Categoría', 'Gastado', '% del total'], rows: cats.map(c => [c.name, fmt(c.value), Math.round((c.value / T.exp) * 100) + '%']) }}>
          {cats.length === 0 ? (
            <Empty Icon={ReceiptText} title="Sin gastos este mes">Cuando registres gastos verás aquí en qué categorías se van.</Empty>
          ) : (
            <div className="donut-row">
              <Donut data={cats} total={T.exp} active={active} setActive={setActive} onPick={id => goTo('movimientos', { cat: id, type: 'expense', month })} />
              <ol className="rank">
                {cats.slice(0, 6).map(c => (
                  <li key={c.id}>
                    <button onPointerEnter={() => setActive(c.id)} onPointerLeave={() => setActive(null)} onFocus={() => setActive(c.id)} onBlur={() => setActive(null)}
                      onClick={() => goTo('movimientos', { cat: c.id, type: 'expense', month })} className={active && active !== c.id ? 'dim' : ''}>
                      <span className="rank-top"><i style={{ background: c.color }} />{c.name}<em className="num">{fmt(c.value)}</em></span>
                      <span className="rank-bar"><b style={{ width: `${(c.value / cats[0].value) * 100}%`, background: c.color }} /></span>
                    </button>
                  </li>
                ))}
                {cats.length > 6 && <li className="muted rank-more">y {cats.length - 6} más · toca la dona o usa la tabla</li>}
              </ol>
            </div>
          )}
        </ChartPanel>

        <ChartPanel className="rise" style={{ '--i': 4 }} title="Ritmo del mes" sub="Gasto acumulado día a día"
          table={{ head: ['Día', monthName(month), prevName], rows: pace.daily.map((_, d) => [d + 1, pace.cur[d] != null ? fmt(pace.cur[d]) : '—', pace.prevCum[d] != null ? fmt(pace.prevCum[d]) : '—']) }}>
          {pace.upto > 0 && (pace.mine > 0 || pace.prevCum.at(-1) > 0) ? (
            <>
              <p className="insight">
                {pace.theirs > 0 ? (
                  <>Llevas <b className="num">{fmt(pace.mine)}</b>, <b className={pace.mine <= pace.theirs ? 'pos' : 'neg'}>{fmt(Math.abs(pace.mine - pace.theirs))} {pace.mine <= pace.theirs ? 'menos' : 'más'}</b> que {prevName} a esta altura.</>
                ) : (<>Llevas <b className="num">{fmt(pace.mine)}</b> gastados.</>)}
                {pace.proj != null && <> A este ritmo cerrarías cerca de <b className="num">{fmt(pace.proj)}</b>.</>}
              </p>
              <Pace cur={pace.cur} prev={pace.prevCum} days={pace.dim} proj={pace.proj} label={monthName(month)} prevLabel={prevName} />
              <Legend items={[{ label: monthName(month), color: 'var(--expense)' }, { label: prevName, color: 'var(--muted)', dash: true }, ...(pace.proj != null ? [{ label: 'Proyección', color: 'var(--text-2)', dash: true }] : [])]} />
            </>
          ) : (
            <Empty Icon={TrendingUp} title="Sin datos de este mes todavía">{month > now ? 'Este mes aún no empieza.' : 'Aún no hay gastos para dibujar el ritmo.'}</Empty>
          )}
        </ChartPanel>
      </div>

      {/* Seis meses + semana tipo */}
      <div className="grid g21">
        <ChartPanel className="rise" style={{ '--i': 5 }} title="Ingresos y gastos" sub="Últimos 6 meses · toca un mes para verlo"
          table={{ head: ['Mes', 'Ingresos', 'Gastos', 'Balance'], rows: flow.map(f => [monthTitle(f.ym), fmt(f.inc), fmt(f.exp), fmtSigned(f.inc - f.exp)]) }}>
          <Columns data={flow.map(f => ({ key: f.ym, label: monthShort(f.ym), values: [f.inc, f.exp], bal: f.inc - f.exp }))}
            series={[{ name: 'Ingresos', color: 'var(--income)' }, { name: 'Gastos', color: 'var(--expense)' }]}
            selected={month} onPick={setMonth} title={d => monthTitle(d.key)} />
          <Legend items={[{ label: 'Ingresos', color: 'var(--income)' }, { label: 'Gastos', color: 'var(--expense)' }]} />
        </ChartPanel>

        <ChartPanel className="rise" style={{ '--i': 7 }} title="Tu semana tipo" sub="Gasto promedio por día de la semana · 3 meses"
          table={{ head: ['Día', 'Promedio'], rows: week.avg.map((v, i) => [WEEKDAYS[i], fmt(v)]) }}>
          {Math.max(...week.avg) > 0 ? (
            <>
              <p className="insight">Los <b>{WEEKDAYS[week.top].toLowerCase()}</b> son tus días más caros: <b className="num">{fmt(week.avg[week.top])}</b> en promedio.</p>
              <Columns data={week.avg.map((v, i) => ({ key: i, label: WEEKDAYS[i].slice(0, 3), values: [v] }))}
                series={[{ name: 'Promedio', color: 'var(--brass)' }]} selected={week.top} height={190} title={d => WEEKDAYS[d.key]} />
            </>
          ) : <Empty Icon={ReceiptText} title="Aún no hay suficiente historia">Con unos días de gastos verás qué día de la semana pesa más.</Empty>}
        </ChartPanel>

      </div>

      {/* Calendario + últimos movimientos */}
      <div className="grid g12">
        <ChartPanel className="rise" style={{ '--i': 6 }} title="Calendario de gasto" sub={`${monthTitle(month)} · más claro = más gastado`}
          table={{ head: ['Día', 'Gastado'], rows: pace.daily.map((v, d) => [d + 1, fmt(v)]) }}>
          <Calendar ym={month} daily={pace.daily} />
        </ChartPanel>
        <section className="panel rise" style={{ '--i': 8 }}>
          <div className="panel-h"><h3>Últimos movimientos</h3><span className="spacer" /><button className="btn btn-ghost btn-sm" onClick={() => goTo('movimientos', {})}>Ver todos</button></div>
          {recent.length === 0 ? <Empty Icon={ReceiptText} title="Sin movimientos">Usa el botón + para anotar el primero.</Empty> : (
            <div className="txlist">
              {recent.map((t, i) => <TxRow key={t.id} i={i} tx={t} cat={getCat(t.type, t.category)} onEdit={onEdit} onDelete={onDelete} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

