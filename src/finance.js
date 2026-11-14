// ─── CONSTANTES ──────────────────────────────────────────────────────────────
export const SWATCHES = ['#f28b82','#ffb74d','#fdd663','#81c995','#4dd0e1','#82b4f5','#c58af9','#f48fb1','#a5d6a7','#80cbc4','#90caf9','#ce93d8','#ff8a65','#fff176','#b0bec5']

export const DEFAULT_CATS = {
  income:  [
    {id:'salary',   name:'Salario',    color:'#81c995'},
    {id:'freelance',name:'Freelance',  color:'#82b4f5'},
    {id:'extra',    name:'Extra',      color:'#fdd663'},
  ],
  expense: [
    {id:'comida',     name:'Comida',     color:'#f28b82'},
    {id:'transporte', name:'Transporte', color:'#ffb74d'},
    {id:'ocio',       name:'Ocio',       color:'#c58af9'},
    {id:'salud',      name:'Salud',      color:'#4dd0e1'},
    {id:'educacion',  name:'Educación',  color:'#82b4f5'},
    {id:'hogar',      name:'Hogar',      color:'#f48fb1'},
    {id:'ropa',       name:'Ropa',       color:'#fdd663'},
    {id:'otros',      name:'Otros',      color:'#8888a0'},
  ]
}

// Colores disponibles para la tarjeta (la primera es el latón de la app).
export const CARD_COLORS = ['#e8b04b','#5598e7','#3fb88a','#9085e9','#e66767','#d55181','#9aa3b2']

// Colores de personas: 7 primeros pasos de la paleta categórica validada (modo oscuro), en orden fijo.
export const PEOPLE_COLORS = ['#3987e5','#d95926','#199e70','#c98500','#d55181','#9085e9','#e66767']

// ─── FORMATO ─────────────────────────────────────────────────────────────────
export const fmt = n => '$' + Math.abs(n).toLocaleString('es-CO', {maximumFractionDigits:0})
export const fmtSigned = n => (n < 0 ? '−' : '') + fmt(n)
export const fmtShort = n => {
  const a = Math.abs(n)
  if (a >= 1e6) return '$' + (a / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace('.', ',') + ' M'
  if (a >= 1e3) return '$' + Math.round(a / 1e3) + ' mil'
  return '$' + Math.round(a)
}
export const hexAlpha = (hex, a) => {
  const r = parseInt(hex.slice(1,3), 16)
  const g = parseInt(hex.slice(3,5), 16)
  const b = parseInt(hex.slice(5,7), 16)
  return `rgba(${r},${g},${b},${a})`
}

// ─── FECHAS (siempre en hora local; toISOString() desplazaba el día tras las 7 pm en Colombia) ──
export const pad = n => String(n).padStart(2, '0')
export const localISO = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const today = () => localISO()
export const thisMonth = () => today().slice(0, 7)

const parse = iso => { const [y, m, d] = iso.split('-').map(Number); return { y, m, d } }
export const daysInMonth = (y, m) => new Date(y, m, 0).getDate()
export const addDays = (iso, n) => { const { y, m, d } = parse(iso); return localISO(new Date(y, m - 1, d + n)) }
export const diffDays = (a, b) => {
  const A = parse(a), B = parse(b)
  return Math.round((Date.UTC(B.y, B.m - 1, B.d) - Date.UTC(A.y, A.m - 1, A.d)) / 864e5)
}
export const shiftMonth = (ym, n) => {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}
const dateOf = iso => { const { y, m, d } = parse(iso); return new Date(y, m - 1, d) }
export const monthTitle = ym => dateOf(ym + '-01').toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
export const monthName  = ym => dateOf(ym + '-01').toLocaleDateString('es-CO', { month: 'long' })
export const monthShort = ym => dateOf(ym + '-01').toLocaleDateString('es-CO', { month: 'short' }).replace('.', '').replace('sept', 'sep')
export const dayShort   = iso => dateOf(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace('.', '').replace(' de ', ' ')
export function dayLabel(iso) {
  const t = today()
  if (iso === t) return 'Hoy'
  if (iso === addDays(t, -1)) return 'Ayer'
  return dateOf(iso).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/[.,]/g, '').replace(' de ', ' ')
}
export const relDays = n =>
  n === 0 ? 'hoy' : n === 1 ? 'mañana' : n === -1 ? 'ayer' : n > 0 ? `en ${n} días` : `hace ${-n} días`

// ─── PERSISTENCIA ────────────────────────────────────────────────────────────
export function ld(k, d) {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch { return d }
}
export function sv(k, v) {
  try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* cuota llena o modo privado */ }
}

// ─── ESTADÍSTICAS MENSUALES ──────────────────────────────────────────────────
export function monthTotals(tx, ym) {
  let inc = 0, exp = 0
  const byCat = {}
  for (const t of tx) {
    if (!t.date.startsWith(ym)) continue
    if (t.type === 'income') inc += t.amount
    else { exp += t.amount; byCat[t.category] = (byCat[t.category] || 0) + t.amount }
  }
  return { inc, exp, bal: inc - exp, byCat }
}

/** Gasto por día de un mes (array con daysInMonth posiciones). */
export function dailyExpenses(tx, ym) {
  const { y, m } = parse(ym + '-01')
  const out = Array(daysInMonth(y, m)).fill(0)
  for (const t of tx) if (t.type === 'expense' && t.date.startsWith(ym)) out[parse(t.date).d - 1] += t.amount
  return out
}
export const cumulative = arr => { let s = 0; return arr.map(v => (s += v)) }

/** Últimos n meses terminando en ym: [{ym, inc, exp}] */
export function lastMonths(tx, ym, n = 6) {
  return Array.from({ length: n }, (_, i) => {
    const k = shiftMonth(ym, i - (n - 1))
    const { inc, exp } = monthTotals(tx, k)
    return { ym: k, inc, exp }
  })
}

// ─── TARJETA DE CRÉDITO ──────────────────────────────────────────────────────
// Un ciclo se identifica por su fecha de corte (ISO). Una compra cae en el primer corte >= su fecha.
const cutIn = (ym, day) => { const { y, m } = parse(ym + '-01'); return `${ym}-${pad(Math.min(day, daysInMonth(y, m)))}` }
export const cycleOf = (iso, cutDay) => {
  const cut = cutIn(iso.slice(0, 7), cutDay)
  return iso <= cut ? cut : cutIn(shiftMonth(iso.slice(0, 7), 1), cutDay)
}
export const shiftCycle = (cut, n, cutDay) => cutIn(shiftMonth(cut.slice(0, 7), n), cutDay)
export const cycleStart = (cut, cutDay) => addDays(shiftCycle(cut, -1, cutDay), 1)
/** Fecha límite de pago: el primer `payDay` posterior al corte. */
export const payDateOf = (cut, payDay) => {
  const same = cutIn(cut.slice(0, 7), payDay)
  return same > cut ? same : cutIn(shiftMonth(cut.slice(0, 7), 1), payDay)
}

export const personKey = w => (w || '').trim().toLowerCase()

/** Estado del ciclo: open (en curso) | due (cerrado, por pagar) | late (vencido) | paid */
export function cycleStatus(cut, payDate, paid, t = today()) {
  if (paid) return 'paid'
  if (t <= cut) return 'open'
  return t > payDate ? 'late' : 'due'
}

/** Totales por ciclo: { [cut]: { cut, own, ext, items } } */
export function groupCycles(cardTx, cutDay) {
  const map = {}
  for (const t of cardTx) {
    const key = cycleOf(t.date, cutDay)
    const c = (map[key] ||= { cut: key, own: 0, ext: 0, items: [] })
    if (t.who) c.ext += t.amount; else c.own += t.amount
    c.items.push(t)
  }
  return map
}

/** Personas con saldo: color estable por orden de aparición, lista ordenada por pendiente. */
export function peopleSummary(cardTx) {
  const map = {}
  for (const t of [...cardTx].sort((a, b) => Number(a.id) - Number(b.id))) {
    if (!t.who) continue
    const k = personKey(t.who)
    const p = (map[k] ||= { key: k, name: t.who.trim(), pending: 0, settled: 0, count: 0, items: [] })
    p.count++
    p.items.push(t)
    if (t.settled) p.settled += t.amount; else p.pending += t.amount
  }
  return Object.values(map)
    .map((p, i) => ({ ...p, color: PEOPLE_COLORS[i % PEOPLE_COLORS.length] }))
    .sort((a, b) => b.pending - a.pending || b.settled - a.settled)
}

/** Resumen de la tarjeta a hoy: deuda propia global, extractos por pagar y ciclo en curso. */
export function cardOverview(card, cardTx, paid, t = today()) {
  const cycles = groupCycles(cardTx, card.cutDay)
  const curCut = cycleOf(t, card.cutDay)
  const list = Object.values(cycles).filter(c => !paid[c.cut])
  const debt = list.reduce((a, c) => a + c.own, 0)                // lo tuyo, sin ajenos, de todos los ciclos sin pagar
  const due = list
    .filter(c => c.cut < t && c.own > 0)
    .map(c => ({ ...c, pay: payDateOf(c.cut, card.payDay) }))
    .sort((a, b) => a.cut.localeCompare(b.cut))
  const open = cycles[curCut] || { cut: curCut, own: 0, ext: 0, items: [] }
  return { cycles, curCut, debt, due, open, daysToCut: diffDays(t, curCut), usedTotal: list.reduce((a, c) => a + c.own + c.ext, 0) }
}

// ─── CUENTAS (efectivo, bancos…) ─────────────────────────────────────────────
// Opcionales: sin cuentas, todo funciona como siempre. Un movimiento puede llevar `account`;
// las transferencias mueven dinero entre cuentas sin contar como ingreso ni gasto.
export const ACCOUNT_COLORS = ['#3fb88a', '#5598e7', '#e8b04b', '#9085e9', '#d55181', '#e66767', '#4dd0e1', '#9aa3b2']

/** Saldo de cada cuenta hoy: saldo inicial + ingresos − gastos ± transferencias. `''` = movimientos sin cuenta. */
export function accountBalances(accounts, tx, transfers = []) {
  const bal = { '': 0 }
  for (const a of accounts) bal[a.id] = a.initial || 0
  for (const t of tx) {
    const k = t.account && t.account in bal ? t.account : ''
    bal[k] += t.type === 'income' ? t.amount : -t.amount
  }
  for (const t of transfers) {
    if (t.from in bal) bal[t.from] -= t.amount
    if (t.to in bal) bal[t.to] += t.amount
  }
  return bal
}
