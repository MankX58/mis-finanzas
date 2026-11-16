import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Undo2, Settings } from 'lucide-react'
import Nav from './components/Nav'
import { Brand } from './components/ui'
import { TxSheet, BudgetSheet, CatSheet, CardSetupSheet, CardTxSheet, AccountSheet } from './components/Sheets'
import Resumen from './views/Resumen'
import Movimientos from './views/Movimientos'
import Tarjeta from './views/Tarjeta'
import Presupuesto from './views/Presupuesto'
import Ajustes from './views/Ajustes'
import { thisMonth, monthTotals, peopleSummary, personKey, accountBalances } from './finance'

const NO_FILTERS = { q: '', type: '', cat: '', month: '', acc: '' }

export default function App({ user, initial, onChange, onSignOut }) {
  const [tab, setTab] = useState('resumen')
  const [month, setMonth] = useState(thisMonth())
  const [filters, setFilters] = useState(NO_FILTERS)

  const [tx, setTx] = useState(initial.tx)
  const [budgets, setBudgets] = useState(initial.budgets)
  const [cats, setCats] = useState(initial.cats)
  const [card, setCard] = useState(initial.card)
  const [cardTx, setCardTx] = useState(initial.cardTx)
  const [cardPaid, setCardPaid] = useState(initial.cardPaid)
  const [accounts, setAccounts] = useState(initial.accounts || [])     // opcional: sin cuentas, todo se ve como siempre
  const [transfers, setTransfers] = useState(initial.transfers || [])

  // hojas: null = cerrada · { ... } = abierta
  const [txSheet, setTxSheet] = useState(null)         // { id } · { transferId }
  const [accSheet, setAccSheet] = useState(null)       // { account }
  const [budgetSheet, setBudgetSheet] = useState(null) // { budget }
  const [catSheet, setCatSheet] = useState(null)       // { type, cat? }
  const [cardSheet, setCardSheet] = useState(false)
  const [cardTxSheet, setCardTxSheet] = useState(null) // { id }
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(0)

  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    onChange({ tx, budgets, cats, card, cardTx, cardPaid, accounts, transfers })
  }, [tx, budgets, cats, card, cardTx, cardPaid, accounts, transfers]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { window.scrollTo({ top: 0 }) }, [tab])

  const getCat = useCallback((type, id) => cats[type]?.find(c => c.id === id) || { id, name: 'Sin categoría', color: '#8c919b' }, [cats])
  const people = useMemo(() => peopleSummary(cardTx), [cardTx])
  const balance = useMemo(() => monthTotals(tx, thisMonth()).bal, [tx])
  const balances = useMemo(() => accountBalances(accounts, tx, transfers), [accounts, tx, transfers])
  const unassigned = useMemo(() => tx.filter(t => !accounts.some(a => a.id === t.account)).length, [tx, accounts])

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

  // ─── transferencias entre cuentas ────────────────────────────────────────────
  const saveTransfer = t => {
    if (t.id) setTransfers(p => p.map(x => (x.id === t.id ? { ...x, ...t } : x)))
    else setTransfers(p => [...p, { ...t, id: Date.now().toString() }])
    setTxSheet(null)
    say(t.id ? 'Transferencia actualizada' : 'Dinero movido entre cuentas')
  }
  const deleteTransfer = id => {
    const gone = transfers.find(t => t.id === id)
    setTransfers(p => p.filter(t => t.id !== id))
    setTxSheet(null)
    say('Transferencia eliminada', () => setTransfers(p => [...p, gone]))
  }

  // ─── cuentas ─────────────────────────────────────────────────────────────────
  const saveAccount = ({ id, name, color, initial, assign }) => {
    if (id) {
      setAccounts(p => p.map(a => (a.id === id ? { ...a, name, color, initial } : a)))
      say(`Cuenta «${name}» actualizada`)
    } else {
      const nid = 'a' + Date.now()
      setAccounts(p => [...p, { id: nid, name, color, initial }])
      if (assign) setTx(p => p.map(t => (accounts.some(a => a.id === t.account) ? t : { ...t, account: nid })))
      say(accounts.length ? `Cuenta «${name}» creada` : `Cuenta «${name}» creada · ahora cada movimiento puede ir a una cuenta`)
    }
    setAccSheet(null)
  }
  const deleteAccount = id => {
    const gone = accounts.find(a => a.id === id)
    const prevTx = tx, prevTransfers = transfers
    const used = tx.filter(t => t.account === id).length
    setAccounts(p => p.filter(a => a.id !== id))
    setTx(p => p.map(t => (t.account === id ? { ...t, account: undefined } : t)))       // los movimientos no se borran
    setTransfers(p => p.filter(t => t.from !== id && t.to !== id))
    setAccSheet(null)
    if (filters.acc === id) setFilters(f => ({ ...f, acc: '' }))
    say(used ? `«${gone.name}» eliminada · ${used} movimiento${used > 1 ? 's quedan' : ' queda'} «Sin cuenta»` : `«${gone.name}» eliminada`,
      () => { setAccounts(p => [...p, gone]); setTx(prevTx); setTransfers(prevTransfers) })
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
  const saveCat = ({ id, type, name, color }) => {
    if (id) setCats(p => ({ ...p, [type]: p[type].map(c => (c.id === id ? { ...c, name, color } : c)) }))
    else setCats(p => ({ ...p, [type]: [...(p[type] || []), { id: 'c' + Date.now(), name, color }] }))
    setCatSheet(null)
    say(id ? `Categoría «${name}» actualizada` : `Categoría «${name}» creada`)
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
    ajustes:     { label: 'Nueva categoría',    run: () => setCatSheet({ type: 'expense' }) },
  }[tab] || { label: 'Nuevo movimiento', run: () => setTxSheet({ id: null }) }

  const editingTx = txSheet?.id ? tx.find(t => t.id === txSheet.id) : null
  const editingTransfer = txSheet?.transferId ? transfers.find(t => t.id === txSheet.transferId) : null
  const editingCardTx = cardTxSheet?.id ? cardTx.find(t => t.id === cardTxSheet.id) : null

  return (
    <div className="app">
      {/* Header móvil: marca a la izquierda, ajustes a la derecha */}
      <header className="topbar">
        <Brand size={36} />
        <div className="topbar-name"><b>Mis Finanzas</b><small>Dinero y tarjeta</small></div>
        <button className="icon-btn" onClick={() => setTab(tab === 'ajustes' ? 'resumen' : 'ajustes')} aria-label={tab === 'ajustes' ? 'Volver' : 'Ajustes'} aria-pressed={tab === 'ajustes'}><Settings /></button>
      </header>
      <Nav active={tab} onChange={setTab} onAdd={addAction.run} addLabel={addAction.label} month={thisMonth()} balance={balance} />

      <main className="main">
        <div key={tab}>
          {tab === 'resumen' && <Resumen tx={tx} accounts={accounts} balances={balances} getCat={getCat} month={month} setMonth={setMonth} card={card} cardTx={cardTx} cardPaid={cardPaid}
            goTo={goTo} onEdit={id => setTxSheet({ id })} onDelete={deleteTx} onAdd={() => setTxSheet({ id: null })} />}
          {tab === 'movimientos' && <Movimientos tx={tx} transfers={transfers} accounts={accounts} balances={balances} cats={cats} getCat={getCat} filters={filters} setFilters={setFilters}
            onEditTransfer={id => setTxSheet({ transferId: id })} onNewAccount={() => setAccSheet({ account: null })}
            onEdit={id => setTxSheet({ id })} onDelete={deleteTx} onAdd={() => setTxSheet({ id: null })} />}
          {tab === 'tarjeta' && <Tarjeta card={card} cardTx={cardTx} cardPaid={cardPaid} getCat={getCat}
            onSetup={() => setCardSheet(true)} onAdd={() => setCardTxSheet({ id: null })} onEdit={id => setCardTxSheet({ id })} onDelete={deleteCardTx}
            onToggleSettled={toggleSettled} onSettlePerson={settlePerson} onTogglePaid={togglePaid} />}
          {tab === 'presupuesto' && <Presupuesto tx={tx} budgets={budgets} getCat={getCat} month={month} setMonth={setMonth}
            onNew={() => setBudgetSheet({ budget: null })} onEdit={b => setBudgetSheet({ budget: b })} onDelete={deleteBudget} />}
          {tab === 'ajustes' && <Ajustes user={user} onSignOut={onSignOut} cats={cats} tx={tx}
            accounts={accounts} balances={balances} onNewAccount={() => setAccSheet({ account: null })} onEditAccount={a => setAccSheet({ account: a })} onNew={type => setCatSheet({ type })} onEdit={(type, cat) => setCatSheet({ type, cat })} onDelete={deleteCat} />}
        </div>
      </main>

      <TxSheet open={!!txSheet} onClose={() => setTxSheet(null)} tx={editingTx} transfer={editingTransfer} cats={cats} accounts={accounts}
        onSave={saveTx} onDelete={deleteTx} onSaveTransfer={saveTransfer} onDeleteTransfer={deleteTransfer} />
      <AccountSheet open={!!accSheet} onClose={() => setAccSheet(null)} account={accSheet?.account} unassigned={unassigned} onSave={saveAccount} onDelete={deleteAccount} />
      <BudgetSheet open={!!budgetSheet} onClose={() => setBudgetSheet(null)} budget={budgetSheet?.budget} cats={cats} onSave={saveBudget} />
      <CatSheet open={!!catSheet} onClose={() => setCatSheet(null)} initialType={catSheet?.type} cat={catSheet?.cat} onSave={saveCat} />
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
