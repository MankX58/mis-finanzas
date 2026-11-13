import { fmt } from '../../finance'

/** Dona interactiva. data: [{ id, name, color, value }]. `active`/`setActive` controlados desde fuera
 *  para que la lista ordenada y la dona se iluminen a la vez. */
export default function Donut({ data, total, active, setActive, onPick, centerLabel = 'Total gastado', size = 250 }) {
  const R = 86, SW = 26, C = 2 * Math.PI * R
  const gap = data.length > 1 ? 2.2 : 0              // 2px de separación entre porciones
  let acc = 0
  const act = data.find(d => d.id === active)

  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg viewBox="0 0 220 220" width={size} height={size} role="img" aria-label={`Distribución de gastos. Total ${fmt(total)}`}>
        <circle cx="110" cy="110" r={R} fill="none" stroke="var(--ink-2)" strokeWidth={SW} />
        {data.map((d, i) => {
          const frac = d.value / total
          const len = Math.max(frac * C - gap, 0.5)
          const off = -acc * C
          acc += frac
          const on = active === d.id
          return (
            <circle key={d.id} cx="110" cy="110" r={R} fill="none" stroke={d.color}
              strokeWidth={on ? SW + 8 : SW} strokeDasharray={`${len} ${C - len}`} strokeDashoffset={off}
              transform="rotate(-90 110 110)" className="dseg" tabIndex={0} role="button" aria-label={`${d.name}: ${fmt(d.value)}`}
              style={{ opacity: active && !on ? .32 : 1, animationDelay: `${i * 110}ms`, '--len': len, '--c': C }}
              onPointerEnter={() => setActive(d.id)} onPointerLeave={e => e.pointerType !== 'touch' && setActive(null)}
              onFocus={() => setActive(d.id)} onBlur={() => setActive(null)}
              onClick={() => (active === d.id && onPick ? onPick(d.id) : setActive(d.id))}
              onKeyDown={e => { if (e.key === 'Enter') onPick?.(d.id) }} />
          )
        })}
      </svg>
      <div className="donut-c" key={active || 'all'}>
        {act ? (
          <>
            <small style={{ color: act.color }}>{act.name}</small>
            <b className="display num">{fmt(act.value)}</b>
            <span className="num">{Math.round((act.value / total) * 100)}% del total</span>
          </>
        ) : (
          <>
            <small>{centerLabel}</small>
            <b className="display num">{fmt(total)}</b>
            <span>{data.length} categoría{data.length !== 1 ? 's' : ''}</span>
          </>
        )}
      </div>
    </div>
  )
}
