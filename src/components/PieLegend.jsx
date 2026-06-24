import { fmt, hexAlpha } from '../finance'

export default function PieLegend({ expByCat, getCat }) {
  const items = Object.entries(expByCat).map(([id, v]) => ({ cat: getCat('expense', id), v }))
  if (!items.length) return null

  return (
    <div id="pie-legend">
      {items.map(({ cat, v }) => (
        <div
          key={cat.id || cat.name}
          className="cat-chip"
          style={{
            background: hexAlpha(cat.color, .16),
            color: cat.color,
            display: 'inline-flex',
            alignItems: 'center',
            verticalAlign: 'middle',
          }}
        >
          <span style={{
            display: 'inline-block',
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: cat.color,
            flexShrink: 0,
          }}></span>
          {cat.name}: {fmt(v)}
        </div>
      ))}
    </div>
  )
}