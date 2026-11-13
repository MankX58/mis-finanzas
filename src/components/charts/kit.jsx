import { useLayoutEffect, useRef, useState, useEffect } from 'react'
import { Table2, ChartColumn } from 'lucide-react'

/** Ancho real del contenedor (para dibujar SVG sin escalar el texto). */
export function useWidth() {
  const ref = useRef(null)
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    setW(el.clientWidth)
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

/** Hover por índice. En táctil el tooltip se queda unos segundos tras el toque. */
export function useHover() {
  const [hi, setHi] = useState(null)
  const t = useRef(0)
  useEffect(() => () => clearTimeout(t.current), [])
  const bind = v => ({
    onPointerEnter: () => { clearTimeout(t.current); setHi(v) },
    onPointerDown: () => { clearTimeout(t.current); setHi(v) },
    onPointerLeave: e => {
      if (e.pointerType === 'touch') { t.current = setTimeout(() => setHi(null), 3200) }
      else setHi(null)
    },
  })
  return [hi, bind, setHi]
}

export function niceTicks(max, n = 4) {
  const raw = Math.max(max, 1) / n
  const p = Math.pow(10, Math.floor(Math.log10(raw)))
  const f = raw / p
  const s = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p
  const top = Math.ceil(max / s) * s || s
  const out = []
  for (let v = 0; v <= top + 1e-9; v += s) out.push(v)
  return out
}

/** Tooltip: tip = { x, y, title, rows: [{ color, dash, label, value }] } en px dentro de .cw */
export function Tip({ tip, w }) {
  if (!tip) return null
  const flip = tip.x > w * 0.58
  return (
    <div className="tt" role="status" style={{ left: tip.x, top: Math.max(tip.y, 26), transform: `translate(${flip ? 'calc(-100% - 12px)' : '12px'},-50%)` }}>
      <b>{tip.title}</b>
      {tip.rows.map((r, i) => (
        <div key={i} className="tt-row">
          {r.color && <i className={r.dash ? 'dash' : ''} style={{ '--c': r.color }} />}
          <span>{r.label}</span><em className="num">{r.value}</em>
        </div>
      ))}
    </div>
  )
}

export function Legend({ items }) {
  return (
    <div className="legend">
      {items.map(i => (
        <span key={i.label}><i className={i.dash ? 'dash' : ''} style={{ '--c': i.color }} />{i.label}</span>
      ))}
    </div>
  )
}

export function VizTable({ head, rows }) {
  return (
    <div className="viz-table-wrap">
      <table className="viz-table num">
        <thead><tr>{head.map((h, i) => <th key={i} scope="col">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j}>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}

/** Panel de gráfico con alternancia gráfico ⇄ tabla (accesible y útil para copiar datos). */
export function ChartPanel({ title, sub, table, actions, children, className = '', style }) {
  const [asTable, setAsTable] = useState(false)
  return (
    <section className={`panel ${className}`} style={style}>
      <div className="panel-h">
        <h3>{title}</h3>
        {sub && <p>{sub}</p>}
        <span className="spacer" />
        {actions}
        {table && (
          <button className="icon-btn" aria-pressed={asTable} title={asTable ? 'Ver gráfico' : 'Ver como tabla'} onClick={() => setAsTable(v => !v)}>
            {asTable ? <ChartColumn /> : <Table2 />}
          </button>
        )}
      </div>
      {asTable && table ? <VizTable {...table} /> : children}
    </section>
  )
}
