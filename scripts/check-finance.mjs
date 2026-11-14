// Chequeo de la lógica de ciclos de tarjeta. Ejecutar: node scripts/check-finance.mjs
import assert from 'node:assert/strict'
import { cycleOf, payDateOf, cycleStart, shiftCycle, cycleStatus, cardOverview, peopleSummary, groupCycles } from '../src/finance.js'

// una compra cae en el primer corte >= su fecha
assert.equal(cycleOf('2026-11-15', 15), '2026-11-15')           // el día del corte aún cuenta
assert.equal(cycleOf('2026-11-16', 15), '2026-12-15')
assert.equal(cycleOf('2026-12-20', 15), '2027-01-15')           // cambio de año
// día 31 se ajusta al último día de cada mes
assert.equal(cycleOf('2026-02-10', 31), '2026-02-28')
assert.equal(cycleOf('2026-03-01', 31), '2026-03-31')
assert.equal(shiftCycle('2026-02-28', 1, 31), '2026-03-31')
// inicio de ciclo = día siguiente al corte anterior
assert.equal(cycleStart('2026-11-15', 15), '2026-10-16')
assert.equal(cycleStart('2026-03-31', 31), '2026-03-01')
// pago: primer día `payDay` posterior al corte (puede caer en el mes siguiente)
assert.equal(payDateOf('2026-11-15', 30), '2026-11-30')
assert.equal(payDateOf('2026-11-25', 10), '2026-12-10')
assert.equal(payDateOf('2026-12-25', 10), '2027-01-10')
// estados
assert.equal(cycleStatus('2026-11-15', '2026-11-30', false, '2026-11-10'), 'open')
assert.equal(cycleStatus('2026-11-15', '2026-11-30', false, '2026-11-20'), 'due')
assert.equal(cycleStatus('2026-11-15', '2026-11-30', false, '2026-12-01'), 'late')
assert.equal(cycleStatus('2026-11-15', '2026-11-30', true, '2026-12-01'), 'paid')

// lo ajeno no entra en la deuda propia; las personas se agrupan sin importar mayúsculas
const card = { cutDay: 15, payDay: 30 }
const tx = [
  { id: '1', amount: 100, date: '2026-11-05', who: '' },
  { id: '2', amount: 40, date: '2026-11-06', who: 'Mamá' },
  { id: '3', amount: 60, date: '2026-11-07', who: 'mamá', settled: true },
  { id: '4', amount: 10, date: '2026-10-01', who: '' },
]
const c = groupCycles(tx, 15)['2026-11-15']
assert.deepEqual([c.own, c.ext], [100, 100])
const co = cardOverview(card, tx, { '2026-10-15': true }, '2026-11-10')
assert.equal(co.debt, 100)                                       // el ciclo de octubre está pagado
const p = peopleSummary(tx)
assert.equal(p.length, 1)
assert.deepEqual([p[0].pending, p[0].settled], [40, 60])
console.log('finance ✓')

// ─── cuentas: saldo inicial + movimientos ± transferencias; lo sin cuenta va aparte
{
  const { accountBalances } = await import('../src/finance.js')
  const accounts = [{ id: 'cash', initial: 50 }, { id: 'bank', initial: 1000 }]
  const tx = [
    { type: 'income', amount: 500, account: 'bank' },
    { type: 'expense', amount: 30, account: 'cash' },
    { type: 'expense', amount: 20 },                     // sin cuenta
    { type: 'expense', amount: 5, account: 'borrada' },  // cuenta que ya no existe → sin cuenta
  ]
  const transfers = [{ from: 'bank', to: 'cash', amount: 100 }]
  const b = accountBalances(accounts, tx, transfers)
  assert.equal(b.cash, 50 - 30 + 100)
  assert.equal(b.bank, 1000 + 500 - 100)
  assert.equal(b[''], -25)
  // las transferencias no cambian el total
  assert.equal(b.cash + b.bank + b[''], 50 + 1000 + 500 - 30 - 20 - 5)
  assert.deepEqual(accountBalances([], [], []), { '': 0 })
}
console.log('check-finance: cuentas ok')
