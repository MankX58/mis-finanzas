import { useState } from 'react'
import { CircleAlert, Trash2, Users } from 'lucide-react'
import { Sheet, MoneyInput, Seg } from './ui'
import { SWATCHES, CARD_COLORS, today, cycleOf, payDateOf, dayShort, relDays, diffDays } from '../finance'

const Err = ({ children }) => children ? <p className="err" role="alert"><CircleAlert size={15} />{children}</p> : null

function CatPicker({ options, value, onChange }) {
  return (
    <div className="catpick" role="group" aria-label="Categoría">
      {options.map(c => (
        <button key={c.id} type="button" className="chip" aria-pressed={value === c.id} onClick={() => onChange(c.id)}>
          <i className="dot" style={{ background: c.color }} />{c.name}
        </button>
      ))}
    </div>
  )
}

const Actions = ({ onCancel, onDelete, label = 'Guardar' }) => (
  <div className="actions">
    {onDelete
      ? <button type="button" className="btn btn-danger" onClick={onDelete} aria-label="Eliminar"><Trash2 /></button>
      : <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancelar</button>}
    <button type="submit" className="btn btn-brass">{label}</button>
  </div>
)

// ─── MOVIMIENTO ──────────────────────────────────────────────────────────────
export function TxSheet({ open, onClose, tx, cats, onSave, onDelete }) {
  return (
    <Sheet open={open} onClose={onClose} title={tx ? 'Editar movimiento' : 'Nuevo movimiento'}>
      <TxForm tx={tx} cats={cats} onClose={onClose} onSave={onSave} onDelete={onDelete} />
    </Sheet>
  )
}
function TxForm({ tx, cats, onClose, onSave, onDelete }) {
  const [type, setType] = useState(tx?.type || 'expense')
  const [amount, setAmount] = useState(tx ? String(tx.amount) : '')
  const [cat, setCat] = useState(tx?.category || cats[tx?.type || 'expense']?.[0]?.id || '')
  const [note, setNote] = useState(tx?.note || '')
  const [date, setDate] = useState(tx?.date || today())
  const [err, setErr] = useState('')
  const changeType = t => { setType(t); setCat(cats[t]?.[0]?.id || '') }
  const submit = e => {
    e.preventDefault()
    if (!Number(amount)) return setErr('Escribe un monto mayor que cero.')
    if (!cat) return setErr('Crea una categoría primero.')
    onSave({ id: tx?.id, type, amount: Number(amount), category: cat, note: note.trim(), date: date || today() })
  }
  return (
    <form onSubmit={submit}>
      {!cat && <div className="field"><Seg full label="Tipo" value={type} onChange={changeType} options={[{ value: 'expense', label: '↓ Gasto', cls: 'exp' }, { value: 'income', label: '↑ Ingreso', cls: 'inc' }]} /></div>}
      <div className="field"><label htmlFor="tx-amt">Monto (COP)</label><MoneyInput id="tx-amt" autoFocus value={amount} onChange={v => { setAmount(v); setErr('') }} /></div>
      <div className="field"><span className="lbl">Categoría</span><CatPicker options={cats[type] || []} value={cat} onChange={setCat} /></div>
      <div className="field"><label htmlFor="tx-note">Nota</label><input id="tx-note" className="input" placeholder="Ej: almuerzo con el equipo" value={note} onChange={e => setNote(e.target.value)} /></div>
      <div className="field"><label htmlFor="tx-date">Fecha</label><input id="tx-date" className="input" type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
      <Err>{err}</Err>
      <Actions onCancel={onClose} onDelete={tx ? () => onDelete(tx.id) : null} />
    </form>
  )
}

// ─── PRESUPUESTO ─────────────────────────────────────────────────────────────
export function BudgetSheet({ open, onClose, budget, cats, onSave }) {
  return (
    <Sheet open={open} onClose={onClose} title={budget ? 'Editar presupuesto' : 'Nuevo presupuesto'}>
      <BudgetForm budget={budget} cats={cats} onClose={onClose} onSave={onSave} />
    </Sheet>
  )
}
function BudgetForm({ budget, cats, onClose, onSave }) {
  const [cat, setCat] = useState(budget?.category || cats.expense[0]?.id || '')
  const [amount, setAmount] = useState(budget ? String(budget.amount) : '')
  const [err, setErr] = useState('')
  const submit = e => {
    e.preventDefault()
    if (!Number(amount)) return setErr('Escribe un límite mayor que cero.')
    onSave({ category: cat, amount: Number(amount) })
  }
  return (
    <form onSubmit={submit}>
      <div className="field"><span className="lbl">Categoría de gasto</span>
        {budget ? <div className="chip" aria-pressed="true" style={{ alignSelf: 'flex-start' }}><i className="dot" style={{ background: cats.expense.find(c => c.id === cat)?.color }} />{cats.expense.find(c => c.id === cat)?.name || cat}</div>
          : <CatPicker options={cats.expense} value={cat} onChange={setCat} />}
      </div>
      <div className="field"><label htmlFor="b-amt">Límite mensual (COP)</label><MoneyInput id="b-amt" autoFocus value={amount} onChange={v => { setAmount(v); setErr('') }} /></div>
      <Err>{err}</Err>
      <Actions onCancel={onClose} />
    </form>
  )
}

// ─── CATEGORÍA ───────────────────────────────────────────────────────────────
export function CatSheet({ open, onClose, initialType, cat, onSave }) {
  return (
    <Sheet open={open} onClose={onClose} title={cat ? 'Editar categoría' : 'Nueva categoría'}>
      <CatForm initialType={initialType} cat={cat} onClose={onClose} onSave={onSave} />
    </Sheet>
  )
}
function CatForm({ initialType, cat, onClose, onSave }) {
  const [type, setType] = useState(initialType || 'expense')
  const [name, setName] = useState(cat?.name || '')
  const [color, setColor] = useState(cat?.color || '#82b4f5')
  const [err, setErr] = useState('')
  const submit = e => {
    e.preventDefault()
    if (!name.trim()) return setErr('Ponle un nombre a la categoría.')
    onSave({ id: cat?.id, type, name: name.trim(), color })
  }
  return (
    <form onSubmit={submit}>
      {!cat && <div className="field"><Seg full label="Tipo" value={type} onChange={setType} options={[{ value: 'expense', label: '↓ Gasto', cls: 'exp' }, { value: 'income', label: '↑ Ingreso', cls: 'inc' }]} /></div>}
      <div className="field"><label htmlFor="c-name">Nombre</label><input id="c-name" className="input" data-af placeholder="Ej: Suscripciones" value={name} onChange={e => { setName(e.target.value); setErr('') }} /></div>
      <div className="field"><span className="lbl">Color</span>
        <div className="swatches">
          {SWATCHES.map(c => <button key={c} type="button" className="swatch" aria-pressed={c.toLowerCase() === color.toLowerCase()} aria-label={`Color ${c}`} style={{ background: c }} onClick={() => setColor(c)} />)}
          <input type="color" value={color} onChange={e => setColor(e.target.value)} aria-label="Color personalizado" style={{ width: 30, height: 30, border: 0, background: 'none', padding: 0, cursor: 'pointer' }} />
        </div>
      </div>
      <Err>{err}</Err>
      <Actions onCancel={onClose} label={cat ? 'Guardar' : 'Crear'} />
    </form>
  )
}

// ─── TARJETA: CONFIGURACIÓN ──────────────────────────────────────────────────
export function CardSetupSheet({ open, onClose, card, onSave }) {
  return (
    <Sheet open={open} onClose={onClose} title={card ? 'Configurar tarjeta' : 'Configura tu tarjeta'}>
      <CardSetupForm card={card} onClose={onClose} onSave={onSave} />
    </Sheet>
  )
}
function CardSetupForm({ card, onClose, onSave }) {
  const [name, setName] = useState(card?.name || '')
  const [last4, setLast4] = useState(card?.last4 || '')
  const [cutDay, setCut] = useState(String(card?.cutDay || ''))
  const [payDay, setPay] = useState(String(card?.payDay || ''))
  const [limit, setLimit] = useState(card?.limit ? String(card.limit) : '')
  const [color, setColor] = useState(card?.color || CARD_COLORS[0])
  const [err, setErr] = useState('')
  const okDay = v => Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 31
  const submit = e => {
    e.preventDefault()
    if (!okDay(cutDay)) return setErr('El día de corte debe ser un número entre 1 y 31.')
    if (!okDay(payDay)) return setErr('El día de pago debe ser un número entre 1 y 31.')
    onSave({ name: name.trim() || 'Mi tarjeta', last4: last4.slice(0, 4), cutDay: Number(cutDay), payDay: Number(payDay), limit: Number(limit) || 0, color })
  }
  const demo = okDay(cutDay) && okDay(payDay) ? (() => {
    const t = today()
    const cut = cycleOf(t, Number(cutDay))
    return `Una compra de hoy entra al ciclo que cierra el ${dayShort(cut)} y se paga el ${dayShort(payDateOf(cut, Number(payDay)))}.`
  })() : ''
  return (
    <form onSubmit={submit}>
      <div className="row2">
        <div className="field"><label htmlFor="k-name">Nombre</label><input id="k-name" className="input" data-af placeholder="Ej: Visa Oro" value={name} onChange={e => setName(e.target.value)} /></div>
        <div className="field"><label htmlFor="k-last">Últimos 4 (opcional)</label><input id="k-last" className="input num" inputMode="numeric" placeholder="1234" value={last4} onChange={e => setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))} /></div>
      </div>
      <div className="row2">
        <div className="field"><label htmlFor="k-cut">Día de corte</label><input id="k-cut" className="input num" inputMode="numeric" placeholder="15" value={cutDay} onChange={e => { setCut(e.target.value.replace(/\D/g, '').slice(0, 2)); setErr('') }} /></div>
        <div className="field"><label htmlFor="k-pay">Día de pago</label><input id="k-pay" className="input num" inputMode="numeric" placeholder="30" value={payDay} onChange={e => { setPay(e.target.value.replace(/\D/g, '').slice(0, 2)); setErr('') }} /></div>
      </div>
      <div className="field"><label htmlFor="k-lim">Cupo (opcional)</label><MoneyInput id="k-lim" value={limit} onChange={setLimit} /></div>
      <div className="field"><span className="lbl">Color de la tarjeta</span>
        <div className="swatches">
          {CARD_COLORS.map(c => <button key={c} type="button" className="swatch" aria-pressed={c.toLowerCase() === color.toLowerCase()} aria-label={`Color ${c}`} style={{ background: c }} onClick={() => setColor(c)} />)}
          <input type="color" value={color} onChange={e => setColor(e.target.value)} aria-label="Color personalizado" style={{ width: 30, height: 30, border: 0, background: 'none', padding: 0, cursor: 'pointer' }} />
        </div>
      </div>
      {demo && <p className="hint">{demo}</p>}
      <Err>{err}</Err>
      <Actions onCancel={onClose} />
    </form>
  )
}

// ─── TARJETA: COMPRA ─────────────────────────────────────────────────────────
export function CardTxSheet({ open, onClose, tx, card, cats, people, onSave, onDelete }) {
  return (
    <Sheet open={open} onClose={onClose} title={tx ? 'Editar compra' : 'Compra con tarjeta'}>
      <CardTxForm tx={tx} card={card} cats={cats} people={people} onClose={onClose} onSave={onSave} onDelete={onDelete} />
    </Sheet>
  )
}
function CardTxForm({ tx, card, cats, people, onClose, onSave, onDelete }) {
  const [amount, setAmount] = useState(tx ? String(tx.amount) : '')
  const [cat, setCat] = useState(tx?.category || cats.expense[0]?.id || '')
  const [note, setNote] = useState(tx?.note || '')
  const [date, setDate] = useState(tx?.date || today())
  const [ext, setExt] = useState(!!tx?.who)
  const [who, setWho] = useState(tx?.who || '')
  const [err, setErr] = useState('')
  const submit = e => {
    e.preventDefault()
    if (!Number(amount)) return setErr('Escribe un monto mayor que cero.')
    if (ext && !who.trim()) return setErr('Indica de quién es la compra.')
    onSave({ id: tx?.id, amount: Number(amount), category: cat, note: note.trim(), date: date || today(),
      who: ext ? who.trim() : '', settled: ext ? !!tx?.settled && tx?.who?.trim().toLowerCase() === who.trim().toLowerCase() : false })
  }
  const cut = date ? cycleOf(date, card.cutDay) : null
  return (
    <form onSubmit={submit}>
      <div className="field"><label htmlFor="ct-amt">Monto (COP)</label><MoneyInput id="ct-amt" autoFocus value={amount} onChange={v => { setAmount(v); setErr('') }} /></div>
      <div className="field"><span className="lbl">Categoría</span><CatPicker options={cats.expense} value={cat} onChange={setCat} /></div>
      <div className="field"><label htmlFor="ct-note">Nota</label><input id="ct-note" className="input" placeholder="Ej: zapatos de mamá" value={note} onChange={e => setNote(e.target.value)} /></div>
      <div className="field"><label htmlFor="ct-date">Fecha de la compra</label><input id="ct-date" className="input" type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
      {cut && <p className="hint">Entra al ciclo que cierra el {dayShort(cut)} · se paga el {dayShort(payDateOf(cut, card.payDay))} ({relDays(diffDays(today(), payDateOf(cut, card.payDay)))}).</p>}
      <div className="field">
        <button type="button" className="switch" aria-pressed={ext} onClick={() => setExt(v => !v)}>
          <span className="knob" />
          <span><b>Es de otra persona</b><small>No cuenta en tu deuda ni en tu mes; se anota aparte para cobrarla.</small></span>
        </button>
      </div>
      {ext && (
        <div className="field">
          <label htmlFor="ct-who">¿De quién es?</label>
          <input id="ct-who" className="input" placeholder="Ej: Mamá" value={who} onChange={e => { setWho(e.target.value); setErr('') }} autoComplete="off" />
          {people.length > 0 && (
            <div className="chips" style={{ marginTop: 2 }}>
              {people.map(p => <button key={p.key} type="button" className="chip" aria-pressed={who.trim().toLowerCase() === p.key} onClick={() => setWho(p.name)}><Users />{p.name}</button>)}
            </div>
          )}
        </div>
      )}
      <Err>{err}</Err>
      <Actions onCancel={onClose} onDelete={tx ? () => onDelete(tx.id) : null} />
    </form>
  )
}
