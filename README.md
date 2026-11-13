# Mis Finanzas

App de finanzas personales — ingresos, gastos y presupuestos en un solo lugar.

## Stack

- **React 18** + Vite
- Gráficos propios en **SVG** (sin librería de gráficos), interactivos y con vista de tabla
- `lucide-react` (iconos) y fuentes autoalojadas con `@fontsource-variable` (Fraunces + Instrument Sans)
- `localStorage` para persistencia de datos

## Secciones

- **Resumen**: balance del mes, dona por categoría, ritmo del mes vs. mes anterior, 6 meses, calendario de gasto y semana tipo
- **Movimientos**: búsqueda, filtros y agrupación por día, con deshacer al borrar
- **Tarjeta**: día de corte y de pago, ciclos, deuda propia vs. ajena y seguimiento por persona
- **Presupuesto**: vasos que se llenan, proyección a fin de mes y límite diario
- **Categorías**

### Tarjeta de crédito

Cada compra cae en el primer corte igual o posterior a su fecha (si el día de corte no existe en un mes corto, se usa el último día). El pago es el primer día de pago posterior al corte. Las compras marcadas «Es de otra persona» no suman a tu deuda ni al ciclo; se agrupan por persona y se marcan como pagadas. Los movimientos de la tarjeta son independientes de los ingresos y gastos del Resumen.

Datos guardados: `mf_tx`, `mf_budgets`, `mf_cats`, `mf_card`, `mf_card_tx`, `mf_card_paid`.

## Desarrollo local

```bash
npm install
npm run dev
```

## Deploy en Vercel

### Opción A — desde GitHub (recomendado)

1. Sube este proyecto a un repo en GitHub
2. Ve a [vercel.com](https://vercel.com) → **Add New Project**
3. Importa el repo
4. Vercel detecta Vite automáticamente — no necesitas cambiar nada
5. Click **Deploy** ✅

### Opción B — Vercel CLI

```bash
npm install -g vercel
vercel
```

Sigue las instrucciones en pantalla. En la primera pregunta selecciona el framework **Vite**.

## Estructura del proyecto

```
mis-finanzas/
├── index.html
├── vercel.json          ← rutas SPA
├── scripts/check-finance.mjs   ← chequeo de la lógica de ciclos (node scripts/check-finance.mjs)
└── src/
    ├── main.jsx
    ├── App.jsx          ← estado, persistencia y hojas (formularios)
    ├── finance.js       ← fechas locales, ciclos de tarjeta y estadísticas
    ├── index.css        ← tokens, shell responsive, controles
    ├── views.css        ← vistas y gráficos
    ├── views/           ← Resumen, Movimientos, Tarjeta, Presupuesto, Categorias
    └── components/      ← Nav, Sheets, ui, CreditCardFace, charts/
```
