import { useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, CreditCard, HandCoins, Pencil, Plus, Trash2, User, Users, Lock, Unlock, ShoppingBag } from 'lucide-react'
import CreditCardFace from '../components/CreditCardFace'
import { Empty, Money } from '../components/ui'
import { ChartPanel, Legend } from '../components/charts/kit'
import Columns from '../components/charts/Columns'
import CycleStrip from '../components/charts/CycleStrip'
import {
  fmt, hexAlpha, cardOverview, cycleStart, payDateOf, shiftCycle, cycleStatus, peopleSummary, personKey,
  dayShort, relDays, diffDays, today, monthShort, dayLabel,
} from '../finance'

const STATUS = {
  open: { cls: '',     text: (cut) => `En curso · cierra ${relDays(diffDays(today(), cut))}` },
  due:  { cls: 'warn', text: (cut, pay) => `Cerrado · pagas el ${dayShort(pay)} (${relDays(diffDays(today(), pay))})` },
  late: { cls: 'bad',  text: (cut, pay) => `Vencido · debías pagar el ${dayShort(pay)}` },
  paid: { cls: 'good', text: () => 'Pagado' },
}

export default function Tarjeta({ card, cardTx, cardPaid, getCat, onSetup, onAdd, onEdit, onDelete, onToggleSettled, onSettlePerson, onTogglePaid }) {
  const [sel, setSel] = useState(null)
  const [filter, setFilter] = useState('all')       // all | own | ext | <personKey>
  const [openP, setOpenP] = useState(null)

  const co = useMemo(() => card && cardOverview(card, cardTx, cardPaid), [card, cardTx, cardPaid])
  const people = useMemo(() => peopleSummary(cardTx), [cardTx])

  if (!card) {
    return (
      <div className="view">
        <header className="pagehead rise"><div><h1>Tarjeta</h1><p>Tus ciclos de corte y pago, lo tuyo y lo ajeno.</p></div></header>
        <div className="panel rise" style={{ '--i': 1 }}>
          <Empty Icon={CreditCard} title="Configura tu tarjeta de crédito" action={<button className="btn btn-brass" onClick={onSetup}>Configurar tarjeta</button>}>
            Dime tu día de corte y de pago. Cada compra caerá en su ciclo y sabrás cuánto pagas tú y cuánto es de otras personas.
          </Empty>
        </div>
      </div>
    )
  }

  const cut = sel || co.curCut
  const cyc = co.cycles[cut] || { cut, own: 0, ext: 0, items: [] }
  const start = cycleStart(cut, card.cutDay)
  const pay = payDateOf(cut, card.payDay)
  const paid = !!cardPaid[cut]
  const status = cycleStatus(cut, pay, paid)
  const earliest = Object.keys(co.cycles).sort()[0] || co.curCut
  const latest = Object.keys(co.cycles).sort().pop() || co.curCut
  const lastCut = latest > co.curCut ? latest : co.curCut

  const byDay = {}
  for (const t of cyc.items) { const d = (byDay[t.date] ||= { own: 0, ext: 0 }); d[t.who ? 'ext' : 'own'] += t.amount }

  const history = Array.from({ length: 6 }, (_, i) => shiftCycle(co.curCut, i - 5, card.cutDay)).map(k => {
    const c = co.cycles[k]
    return { key: k, label: monthShort(k.slice(0, 7)), values: [c?.own || 0, c?.ext || 0], pay: payDateOf(k, card.payDay) }
  })

  const owed = people.reduce((a, p) => a + p.pending, 0)
  const list = cyc.items
    .filter(t => filter === 'all' || (filter === 'own' ? !t.who : filter === 'ext' ? !!t.who : personKey(t.who) === filter))
    .sort((a, b) => b.date.localeCompare(a.date) || Number(b.id) - Number(a.id))
  const cyclePeople = peopleSummary(cyc.items)
  const usedPct = card.limit > 0 ? Math.min(co.usedTotal / card.limit, 1) : 0

  return (
    <div className="view">
      <header className="pagehead rise">
        <div><h1>Tarjeta</h1><p>Lo que pagas tú, lo que es de otros y cuándo vence cada ciclo.</p></div>
        <span className="spacer" />
        <button className="btn btn-brass" onClick={() => onAdd()}><Plus />Compra con tarjeta</button>
      </header>

      <div className="grid g12">
        <div className="rise" style={{ '--i': 1 }}>
          <CreditCardFace card={card} onEdit={onSetup} />
          <div className="panel debt">
            <span className="muted">Deuda tuya en total</span>
            <b className="display num"><Money value={co.debt} /></b>
            <small className="muted">Todos los ciclos sin pagar, sin contar lo ajeno.</small>
            {card.limit > 0 && (
              <div className="limit">
                <div className="bar"><b style={{ width: `${usedPct * 100}%`, background: usedPct > .85 ? 'var(--expense)' : 'var(--brass)' }} /></div>
                <small className="muted num">{fmt(co.usedTotal)} usado de {fmt(card.limit)} · disponible {fmt(Math.max(card.limit - co.usedTotal, 0))}</small>
              </div>
            )}
          </div>
        </div>

        <section className="panel rise cyclepanel" style={{ '--i': 2 }}>
          <div className="cyclehead">
            <button className="icon-btn" disabled={cut <= earliest} onClick={() => setSel(shiftCycle(cut, -1, card.cutDay))} aria-label="Ciclo anterior"><ChevronLeft /></button>
            <div>
              <b>{dayShort(start)} – {dayShort(cut)}</b>
              <small className="muted">Ciclo que cierra el {dayShort(cut)}</small>
            </div>
            <button className="icon-btn" disabled={cut >= lastCut} onClick={() => setSel(shiftCycle(cut, 1, card.cutDay))} aria-label="Ciclo siguiente"><ChevronRight /></button>
            <span className={`status ${STATUS[status].cls}`}>{STATUS[status].text(cut, pay)}</span>
          </div>

          <div className="paynow">
            <span className="muted">Pagas tú este ciclo</span>
            <b className="display num" key={cut}><Money value={cyc.own} /></b>
          </div>

          <div className="ledger">
            <div className="lrow"><span className="lbl"><i className="sw" style={{ background: 'var(--own)' }} />Tuyo</span><i className="leader" /><span className="val num">{fmt(cyc.own)}</span></div>
            <div className="lrow"><span className="lbl"><i className="sw" style={{ background: 'var(--ext)' }} />De otras personas</span><i className="leader" /><span className="val num" style={{ color: 'var(--ext)' }}>{fmt(cyc.ext)}</span></div>
            <div className="lrow total"><span className="lbl">El banco te cobra</span><i className="leader" /><span className="val num">{fmt(cyc.own + cyc.ext)}</span></div>
          </div>

          {status !== 'open' || cyc.own > 0 ? (
            <button className={`btn ${paid ? 'btn-ghost' : 'btn-brass'}`} style={{ marginTop: 18, width: '100%' }} onClick={() => onTogglePaid(cut)}>
              {paid ? <><Unlock />Reabrir ciclo</> : <><Lock />Marcar ciclo como pagado</>}
            </button>
          ) : null}
        </section>
      </div>

      <div className="grid g2">
        <ChartPanel className="rise" style={{ '--i': 3 }} title="Pulso del ciclo" sub="Gasto por día hasta tu fecha de pago"
          table={{ head: ['Día', 'Tuyo', 'Ajeno'], rows: Object.keys(byDay).sort().map(d => [dayShort(d), fmt(byDay[d].own), fmt(byDay[d].ext)]) }}>
          <CycleStrip start={start} cut={cut} pay={pay} byDay={byDay} />
          <Legend items={[{ label: 'Tuyo', color: 'var(--own)' }, { label: 'Ajeno', color: 'var(--ext)' }]} />
        </ChartPanel>

        <ChartPanel className="rise" style={{ '--i': 4 }} title="Mes a mes" sub="Cada columna es un ciclo · toca para abrirlo"
          table={{ head: ['Ciclo (corte)', 'Tuyo', 'Ajeno', 'Pago'], rows: history.map(h => [dayShort(h.key), fmt(h.values[0]), fmt(h.values[1]), dayShort(h.pay)]) }}>
          <Columns data={history} series={[{ name: 'Tuyo', color: 'var(--own)' }, { name: 'Ajeno', color: 'var(--ext)' }]} mode="stack" selected={cut} onPick={setSel}
            title={d => `Ciclo del ${dayShort(d.key)}`} />
          <Legend items={[{ label: 'Tuyo', color: 'var(--own)' }, { label: 'Ajeno', color: 'var(--ext)' }]} />
        </ChartPanel>
      </div>

      {/* Personas */}
      <section className="panel rise" style={{ '--i': 5, marginBottom: 16 }}>
        <div className="panel-h">
          <h3>Lo que te deben</h3><p>Compras de otras personas, separadas por quién</p><span className="spacer" />
          {owed > 0 && <span className="status" style={{ '--sc': 'var(--ext)' }}>Pendiente: <Money value={owed} /></span>}
        </div>
        {people.length === 0 ? (
          <Empty Icon={Users} title="Nadie te debe nada">Al anotar una compra, activa «Es de otra persona» y aquí verás cuánto debe cada quien.</Empty>
        ) : (
          <div className="people">
            {people.map(p => {
              const total = p.pending + p.settled
              const open = openP === p.key
              return (
                <div key={p.key} className={`person ${open ? 'open' : ''}`}>
                  <button className="person-top" onClick={() => setOpenP(open ? null : p.key)} aria-expanded={open}>
                    <span className="avatar" style={{ background: hexAlpha(p.color, .2), color: p.color, boxShadow: `inset 0 0 0 1.5px ${hexAlpha(p.color, .55)}` }}>{p.name.slice(0, 1).toUpperCase()}</span>
                    <span className="person-info">
                      <b>{p.name}</b>
                      <span className="muted">{p.count} compra{p.count !== 1 ? 's' : ''} · {p.pending > 0 ? `debe ${fmt(p.pending)}` : 'al día'}</span>
                      <span className="bar"><b style={{ width: `${total ? (p.settled / total) * 100 : 0}%`, background: p.color }} /></span>
                    </span>
                    <span className="person-amt num">{fmt(p.pending)}</span>
                    <ChevronRight className="chev" />
                  </button>
                  {open && (
                    <div className="person-body">
                      {p.items.slice().sort((a, b) => b.date.localeCompare(a.date)).map(t => (
                        <div key={t.id} className="pitem">
                          <button className={`check ${t.settled ? 'on' : ''}`} onClick={() => onToggleSettled(t.id)} aria-pressed={!!t.settled} aria-label={t.settled ? 'Marcar como pendiente' : 'Marcar como pagado'}><Check /></button>
                          <span className="pitem-info"><b>{t.note || getCat('expense', t.category).name}</b><small className="muted">{dayShort(t.date)}</small></span>
                          <span className={`num ${t.settled ? 'muted done' : ''}`}>{fmt(t.amount)}</span>
                          <button className="icon-btn" onClick={() => onEdit(t.id)} aria-label={`Editar el valor de ${t.note || 'la compra'}`} title="Editar valor"><Pencil /></button>
                        </div>
                      ))}
                      <div className="person-actions">
                        {p.pending > 0
                          ? <button className="btn btn-ghost btn-sm" onClick={() => onSettlePerson(p.key, true)}><HandCoins />{p.name} pagó todo ({fmt(p.pending)})</button>
                          : <button className="btn btn-ghost btn-sm" onClick={() => onSettlePerson(p.key, false)}>Reabrir cuentas</button>}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Compras del ciclo */}
      <section className="panel rise" style={{ '--i': 6 }}>
        <div className="panel-h"><h3>Compras de este ciclo</h3><p>{cyc.items.length} compra{cyc.items.length !== 1 ? 's' : ''}</p></div>
        {cyc.items.length > 0 && (
          <div className="chips" role="group" aria-label="Filtrar compras">
            <button className="chip" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>Todas</button>
            <button className="chip" aria-pressed={filter === 'own'} onClick={() => setFilter('own')}><i className="dot" style={{ background: 'var(--own)' }} />Mías</button>
            {cyclePeople.length > 0 && <button className="chip" aria-pressed={filter === 'ext'} onClick={() => setFilter('ext')}><i className="dot" style={{ background: 'var(--ext)' }} />Ajenas</button>}
            {cyclePeople.map(p => (
              <button key={p.key} className="chip" aria-pressed={filter === p.key} onClick={() => setFilter(filter === p.key ? 'all' : p.key)}><User />{p.name}</button>
            ))}
          </div>
        )}
        {list.length === 0 ? (
          <Empty Icon={ShoppingBag} title={cyc.items.length ? 'Nada con ese filtro' : 'Sin compras en este ciclo'}
            action={!cyc.items.length && <button className="btn btn-brass" onClick={() => onAdd()}>Anotar una compra</button>}>
            {cyc.items.length ? 'Cambia el filtro para ver otras compras.' : `Las compras entre el ${dayShort(start)} y el ${dayShort(cut)} aparecen aquí.`}
          </Empty>
        ) : (
          <div className="txlist">
            {list.map((t, i) => {
              const cat = getCat('expense', t.category)
              return (
                <div key={t.id} className="txrow rise" style={{ '--i': Math.min(i, 8) * .5 }}>
                  <button className="txrow-main" onClick={() => onEdit(t.id)} aria-label={`Editar ${t.note || cat.name}`}>
                    <span className="txrow-ico" style={{ background: hexAlpha(cat.color, .16), color: cat.color }}><CreditCard /></span>
                    <span className="txrow-info">
                      <span className="txrow-name">{t.note || cat.name}</span>
                      <span className="txrow-meta">
                        <span className="tag" style={{ background: hexAlpha(cat.color, .14), color: cat.color }}>{cat.name}</span>
                        {t.who
                          ? <span className="tag" style={{ background: hexAlpha('#9085e9', .16), color: '#b3aaf2' }}><User />{t.who}{t.settled ? ' · pagó' : ' · debe'}</span>
                          : <span className="tag" style={{ background: hexAlpha('#e8b04b', .14), color: 'var(--own)' }}>Mía</span>}
                        <span className="muted">{dayLabel(t.date)}</span>
                      </span>
                    </span>
                    <span className={`txrow-amt num ${t.who && t.settled ? 'muted done' : ''}`}>{fmt(t.amount)}</span>
                  </button>
                  <span className="txrow-act">
                    {t.who && <button className={`icon-btn ${t.settled ? 'on' : ''}`} onClick={() => onToggleSettled(t.id)} title={t.settled ? 'Marcar como pendiente' : 'Marcar como pagado'} aria-label={t.settled ? 'Marcar como pendiente' : 'Marcar como pagado'}><Check /></button>}
                    <button className="icon-btn hov" onClick={() => onEdit(t.id)} title="Editar" aria-label="Editar"><Pencil /></button>
                    <button className="icon-btn danger hov" onClick={() => onDelete(t.id)} title="Eliminar" aria-label="Eliminar"><Trash2 /></button>
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
