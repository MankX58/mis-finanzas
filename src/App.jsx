import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Undo2 } from 'lucide-react'
import Nav from './components/Nav'
import { Brand, Money } from './components/ui'
import { TxSheet, BudgetSheet, CatSheet, CardSetupSheet, CardTxSheet } from './components/Sheets'
import Resumen from './views/Resumen'
import Movimientos from './views/Movimientos'
import Tarjeta from './views/Tarjeta'
import Presupuesto from './views/Presupuesto'
import Categorias from './views/Categorias'
import { DEFAULT_CATS, thisMonth, monthTotals, ld, sv, peopleSummary, personKey } from './finance'

const NO_FILTERS = { q: '', type: '', cat: '', month: '' }

export default function App() {
  const [tab, setTab] = useState('resumen')
  const [month, setMonth] = useState(thisMonth())
  const [filters, setFilters] = useState(NO_FILTERS)

  const [tx, setTx] = useState(() => ld('mf_tx', []))
  const [budgets, setBudgets] = useState(() => ld('mf_budgets', []))
  const [cats, setCats] = useState(() => ld('mf_cats', DEFAULT_CATS))
  const [card, setCard] = useState(() => ld('mf_card', null))
  const [cardTx, setCardTx] = useState(() => ld('mf_card_tx', []))
  const [cardPaid, setCardPaid] = useState(() => ld('mf_card_paid', {}))

  // hojas: null = cerrada · { ... } = abierta
  const [txSheet, setTxSheet] = useState(null)         // { id }
  const [budgetSheet, setBudgetSheet] = useState(null) // { budget }
  const [catSheet, setCatSheet] = useState(null)       // { type }
  const [cardSheet, setCardSheet] = useState(false)
  const [cardTxSheet, setCardTxSheet] = useState(null) // { id }
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(0)

  useEffect(() => { sv('mf_tx', tx) }, [tx])
  useEffect(() => { sv('mf_budgets', budgets) }, [budgets])
  useEffect(() => { sv('mf_cats', cats) }, [cats])
  useEffect(() => { sv('mf_card', card) }, [card])
  useEffect(() => { sv('mf_card_tx', cardTx) }, [cardTx])
  useEffect(() => { sv('mf_card_paid', cardPaid) }, [cardPaid])
  useEffect(() => { window.scrollTo({ top: 0 }) }, [tab])

  const getCat = useCallback((type, id) => cats[type]?.find(c => c.id === id) || { id, name: 'Sin categoría', color: '#8c919b' }, [cats])
  const people = useMemo(() => peopleSummary(cardTx), [cardTx])
  const balance = useMemo(() => monthTotals(tx, thisMonth()).bal, [tx])

  const say = (msg, undo) => {
    clearTimeout(toastTimer.current)
    setToast({ msg, undo, n: Date.now() })
    toastTimer.current = setTimeout(() => setToast(null), 6000)
  }
  const goTo = (t, patch) => {
    if (t === 'movimientos') setFilters({ ...NO_FILTERS, ...(patch || {}) })
    setTab(t)
  }

  // ─── movimientos ───────────────────────────────────────────────────────────
  const saveTx = t => {
    if (t.id) setTx(p => p.map(x => (x.id === t.id ? { ...x, ...t } : x)))
    else setTx(p => [...p, { ...t, id: Date.now().toString() }])
    setTxSheet(null)
    say(t.id ? 'Movimiento actualizado' : 'Movimiento guardado')
  }
  const deleteTx = id => {
    const gone = tx.find(t => t.id === id)
    setTx(p => p.filter(t => t.id !== id))
    setTxSheet(null)
    say('Movimiento eliminado', () => setTx(p => [...p, gone]))
  }

  // ─── presupuestos ──────────────────────────────────────────────────────────
  const saveBudget = ({ category, amount }) => {
    setBudgets(p => p.some(b => b.category === category)
      ? p.map(b => (b.category === category ? { ...b, amount } : b))
      : [...p, { id: Date.now().toString(), category, amount }])
    setBudgetSheet(null)
    say('Presupuesto guardado')
  }
  const deleteBudget = id => {
    const gone = budgets.find(b => b.id === id)
    setBudgets(p => p.filter(b => b.id !== id))
    say('Presupuesto eliminado', () => setBudgets(p => [...p, gone]))
  }

  // ─── categorías ────────────────────────────────────────────────────────────
  const saveCat = ({ type, name, color }) => {
    setCats(p => ({ ...p, [type]: [...(p[type] || []), { id: 'c' + Date.now(), name, color }] }))
    setCatSheet(null)
    say(`Categoría «${name}» creada`)
  }
  const deleteCat = (type, id) => {
    const gone = cats[type].find(c => c.id === id)
    const used = tx.filter(t => t.type === type && t.category === id).length
    setCats(p => ({ ...p, [type]: p[type].filter(c => c.id !== id) }))
    say(used ? `«${gone.name}» eliminada · ${used} movimiento${used > 1 ? 's' : ''} quedan sin categoría` : `«${gone.name}» eliminada`,
      () => setCats(p => ({ ...p, [type]: [...p[type], gone] })))
  }

  // ─── tarjeta ───────────────────────────────────────────────────────────────
  const saveCard = c => { setCard(c); setCardSheet(false); say('Tarjeta guardada') }
  const saveCardTx = t => {
    const known = people.find(p => p.key === personKey(t.who))
    const who = known ? known.name : t.who                        // «mamá» y «Mamá» son la misma persona
    if (t.id) setCardTx(p => p.map(x => (x.id === t.id ? { ...x, ...t, who } : x)))
    else setCardTx(p => [...p, { ...t, who, id: Date.now().toString() }])
    setCardTxSheet(null)
    say(t.id ? 'Compra actualizada' : t.who ? `Anotado: ${who} te debe esta compra` : 'Compra guardada')
  }
  const deleteCardTx = id => {
    const gone = cardTx.find(t => t.id === id)
    setCardTx(p => p.filter(t => t.id !== id))
    setCardTxSheet(null)
    say('Compra eliminada', () => setCardTx(p => [...p, gone]))
  }
  const toggleSettled = id => setCardTx(p => p.map(t => (t.id === id ? { ...t, settled: !t.settled } : t)))
  const settlePerson = (key, value) => {
    setCardTx(p => p.map(t => (personKey(t.who) === key ? { ...t, settled: value } : t)))
    say(value ? 'Cuentas saldadas ✓' : 'Cuentas reabiertas')
  }
  const togglePaid = cut => {
    const wasPaid = !!cardPaid[cut]
    setCardPaid(p => ({ ...p, [cut]: !wasPaid }))
    say(wasPaid ? 'Ciclo reabierto' : 'Ciclo marcado como pagado', () => setCardPaid(p => ({ ...p, [cut]: wasPaid })))
  }

  // El botón "+" entiende la pantalla en la que estás.
  const addAction = {
    tarjeta:     { label: 'Compra con tarjeta', run: () => (card ? setCardTxSheet({ id: null }) : setCardSheet(true)) },
    presupuesto: { label: 'Nuevo presupuesto',  run: () => setBudgetSheet({ budget: null }) },
    categorias:  { label: 'Nueva categoría',    run: () => setCatSheet({ type: 'expense' }) },
  }[tab] || { label: 'Nuevo movimiento', run: () => setTxSheet({ id: null }) }

  const editingTx = txSheet?.id ? tx.find(t => t.id === txSheet.id) : null
  const editingCardTx = cardTxSheet?.id ? cardTx.find(t => t.id === cardTxSheet.id) : null

  return (
    <div className="app">
      <div className="topbar">
        <Brand size={30} /><span className="brand-name">Mis Finanzas</span>
        <span className="chip-bal num"><span className="muted">Mes</span><b className={balance >= 0 ? 'pos' : 'neg'}><Money value={balance} /></b></span>
      </div>
      <Nav active={tab} onChange={setTab} onAdd={addAction.run} addLabel={addAction.label} month={thisMonth()} balance={balance} />

      <main className="main">
        <div key={tab}>
          {tab === 'resumen' && <Resumen tx={tx} getCat={getCat} month={month} setMonth={setMonth} card={card} cardTx={cardTx} cardPaid={cardPaid}
            goTo={goTo} onEdit={id => setTxSheet({ id })} onDelete={deleteTx} onAdd={() => setTxSheet({ id: null })} />}
          {tab === 'movimientos' && <Movimientos tx={tx} cats={cats} getCat={getCat} filters={filters} setFilters={setFilters}
            onEdit={id => setTxSheet({ id })} onDelete={deleteTx} onAdd={() => setTxSheet({ id: null })} />}
          {tab === 'tarjeta' && <Tarjeta card={card} cardTx={cardTx} cardPaid={cardPaid} getCat={getCat}
            onSetup={() => setCardSheet(true)} onAdd={() => setCardTxSheet({ id: null })} onEdit={id => setCardTxSheet({ id })} onDelete={deleteCardTx}
            onToggleSettled={toggleSettled} onSettlePerson={settlePerson} onTogglePaid={togglePaid} />}
          {tab === 'presupuesto' && <Presupuesto tx={tx} budgets={budgets} getCat={getCat} month={month} setMonth={setMonth}
            onNew={() => setBudgetSheet({ budget: null })} onEdit={b => setBudgetSheet({ budget: b })} onDelete={deleteBudget} />}
          {tab === 'categorias' && <Categorias cats={cats} tx={tx} onNew={type => setCatSheet({ type })} onDelete={deleteCat} />}
        </div>
      </main>

      <TxSheet open={!!txSheet} onClose={() => setTxSheet(null)} tx={editingTx} cats={cats} onSave={saveTx} onDelete={deleteTx} />
      <BudgetSheet open={!!budgetSheet} onClose={() => setBudgetSheet(null)} budget={budgetSheet?.budget} cats={cats} onSave={saveBudget} />
      <CatSheet open={!!catSheet} onClose={() => setCatSheet(null)} initialType={catSheet?.type} onSave={saveCat} />
      <CardSetupSheet open={cardSheet} onClose={() => setCardSheet(false)} card={card} onSave={saveCard} />
      {card && <CardTxSheet open={!!cardTxSheet} onClose={() => setCardTxSheet(null)} tx={editingCardTx} card={card} cats={cats} people={people} onSave={saveCardTx} onDelete={deleteCardTx} />}

      <div className="toasts" aria-live="polite">
        {toast && (
          <div className="toast" key={toast.n}>
            <span>{toast.msg}</span>
            {toast.undo && <button onClick={() => { toast.undo(); setToast(null) }}><Undo2 size={15} style={{ verticalAlign: '-2px', marginRight: 5 }} />Deshacer</button>}
          </div>
        )}
      </div>
    </div>
  )
}
