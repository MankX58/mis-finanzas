# Mis Finanzas

App de finanzas personales — ingresos, gastos y presupuestos en un solo lugar.

## Stack

- **React 18** + Vite
- **Chart.js 4** para la gráfica de dona
- `localStorage` para persistencia de datos

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
├── vite.config.js
├── vercel.json          ← rutas SPA
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx          ← toda la lógica y UI
    └── index.css        ← estilos idénticos al HTML original
```
