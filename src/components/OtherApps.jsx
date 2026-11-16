// Enlaces discretos a las otras apps del mismo autor (cada app es independiente). Copia en cada app: si cambias URLs, cámbialas en las 3.
const OTHERS = [
  { name: 'Mi Espacio', note: 'Tareas y entreno', accent: '#df9aa7', dev: 'http://localhost:3000', prod: 'https://mi-espacio-mankx.vercel.app' },
  { name: 'Mi semestre', note: 'Planner universitario', accent: '#8b9cff', dev: 'http://localhost:3001', prod: 'https://gestion-universitaria-fikx.vercel.app' },
]

export default function OtherApps() {
  return (
    <div className="other-apps">
      <p>Del mismo autor</p>
      <ul>
        {OTHERS.map(a => (
          <li key={a.name}>
            <a href={import.meta.env.DEV ? a.dev : a.prod} target="_blank" rel="noreferrer">
              <i style={{ background: a.accent }} />
              <span><b>{a.name}</b><small>{a.note}</small></span>
              <em aria-hidden="true">↗</em>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
