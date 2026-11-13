import { useHover, useWidth, niceTicks, Tip } from './kit'
import { fmtShort, fmt } from '../../finance'

/** Columnas agrupadas o apiladas. data: [{ key, label, values: [..] }], series: [{ name, color }] */
export default function Columns({ data, series, mode = 'group', selected, onPick, height = 210, title = d => d.label }) {
  const [ref, w] = useWidth()
  const [hi, bind] = useHover()
  const padL = 46, padR = 4, padT = 10, padB = 26
  const iw = Math.max(w - padL - padR, 10), ih = height - padT - padB
  const totals = data.map(d => mode === 'stack' ? d.values.reduce((a, b) => a + b, 0) : Math.max(...d.values))
  const ticks = niceTicks(Math.max(...totals, 1))
  const top = ticks[ticks.length - 1]
  const band = iw / data.length
  const n = series.length
  const bw = mode === 'stack' ? Math.min(40, band * .52) : Math.min(18, (band * .6 - (n - 1) * 3) / n)
  const y = v => padT + ih - (v / top) * ih

  const bar = (x, v, base, roundTop) => {
    const h = (v / top) * ih
    if (h < 0.5) return null
    const yTop = padT + ih - base - h
    const r = roundTop ? Math.min(5, bw / 2, h) : 0
    return `M${x},${yTop + r}${r ? `a${r},${r} 0 0 1 ${r},${-r}h${bw - 2 * r}a${r},${r} 0 0 1 ${r},${r}` : `h${bw}`}V${yTop + h}H${x}Z`
  }

  const hov = hi != null ? data[hi] : null
  const tip = hov && {
    x: padL + band * hi + band / 2, y: padT + 28, title: title(hov),
    rows: [
      ...series.map((s, k) => ({ color: s.color, label: s.name, value: fmt(hov.values[k]) })),
      ...(mode === 'stack' && n > 1 ? [{ label: 'Total', value: fmt(totals[hi]) }] : []),
    ],
  }

  return (
    <div className="cw" ref={ref}>
      {w > 0 && (
        <svg width={w} height={height} role="img" aria-label="Gráfico de columnas; usa la vista de tabla para ver los datos">
          {ticks.map(t => (
            <g key={t}>
              <line x1={padL} x2={w - padR} y1={y(t)} y2={y(t)} className={t === 0 ? 'axis' : 'gl'} />
              <text x={padL - 8} y={y(t) + 4} textAnchor="end" className="tick">{t === 0 ? '0' : fmtShort(t)}</text>
            </g>
          ))}
          {data.map((d, i) => {
            const cx = padL + band * i + band / 2
            const dim = (selected != null && selected !== d.key) || (hi != null && hi !== i)
            let acc = 0
            return (
              <g key={d.key} className={`colgrp ${dim ? 'dim' : ''}`}>
                {mode === 'stack'
                  ? d.values.map((v, k) => {
                      const lastNZ = d.values.reduce((a, b, j) => (b > 0 ? j : a), -1)
                      const p = bar(cx - bw / 2, v, acc, k === lastNZ)
                      acc += (v / top) * ih
                      return p && <path key={k} d={p} fill={series[k].color} className="seg-bar" style={{ animationDelay: `${i * 70 + k * 120}ms` }} />
                    })
                  : d.values.map((v, k) => {
                      const p = bar(cx - (n * bw + (n - 1) * 3) / 2 + k * (bw + 3), v, 0, true)
                      return p && <path key={k} d={p} fill={series[k].color} className="seg-bar" style={{ animationDelay: `${i * 70 + k * 90}ms` }} />
                    })}
                <text x={cx} y={height - 7} textAnchor="middle" className={`tick ${selected === d.key ? 'sel' : ''}`}>{d.label}</text>
                <rect x={padL + band * i} y={0} width={band} height={height} fill="transparent" style={{ cursor: onPick ? 'pointer' : 'default' }}
                  {...bind(i)} onClick={() => onPick?.(d.key)} />
              </g>
            )
          })}
        </svg>
      )}
      <Tip tip={tip} w={w} />
    </div>
  )
}
