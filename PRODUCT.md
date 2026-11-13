# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Una sola persona (el dueño), uso personal, en español y pesos colombianos (COP). Lo usa en móvil y en PC por igual, para registrar ingresos y gastos, vigilar presupuestos y controlar su tarjeta de crédito.

## Product Purpose
Finanzas personales en un solo lugar: ingresos, gastos, presupuestos por categoría y, desde ahora, una tarjeta de crédito con ciclos de corte y pago. Éxito: saber de un vistazo cuánto debe pagar de verdad este ciclo.

## Positioning
La tarjeta separa lo propio de lo ajeno: compras hechas a favor de otras personas no cuentan en la deuda propia, pero se siguen por persona (quién me debe qué).

## Operating Context
Datos en `localStorage` (sin backend). Deploy en Vercel como SPA Vite + React 18 + Chart.js 4. Moneda COP, fechas ISO.

## Capabilities and Constraints
- Movimientos de ingreso y gasto con categorías editables; presupuestos mensuales por categoría.
- Tarjeta: fecha de corte y de pago configurables; compras en un solo pago (sin cuotas ni intereses, decidido por el usuario); cada compra cae en el ciclo según la fecha de corte.
- Una compra puede marcarse como de otra persona: no suma a la deuda propia ni al mes, pero se agrupa por persona para seguimiento.
- Sin dependencias nuevas salvo que aporten claramente.

## Product Principles
- Lo que debo pagar yo siempre es el número principal; lo ajeno se muestra aparte, nunca mezclado.
- Datos propios y persistentes en el navegador, sin cuentas.
- Móvil y escritorio tienen la misma prioridad.
