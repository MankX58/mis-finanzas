import { useMemo, useState } from 'react'
import { LogOut, Plus, Tags, Trash2, Wallet, Pencil } from 'lucide-react'
import MonthHead from '../components/MonthHead'
import { Empty, Seg } from '../components/ui'
import { fmt, fmtSigned, thisMonth } from '../finance'

export default function Ajustes({ user, onSignOut, cats, tx, accounts = [], balances = {}, onNewAccount, onEditAccount, onNew, onEdit, onDelete }) {
  const [tab, setTab] = useState('expense')
  const [imgFailed, setImgFailed] = useState(false)
  const month = thisMonth()
  const stats = useMemo(() => {
    const s = {}
    for (const t of tx) {
      const k = t.type + ':' + t.category
      const r = (s[k] ||= { n: 0, mes: 0 })
      r.n++
      if (t.date.startsWith(month)) r.mes += t.amount
    }
    return s
  }, [tx, month])
  const list = cats[tab] || []

  return (
    <div className="view">
      <MonthHead title="Ajustes" sub="Tus cuentas, tus categorías y tu sesión." />

      <div className="settings">
        <section className="panel account rise" style={{ '--i': 1 }}>
          {user.image && !imgFailed
            ? <img className="avatar" src={user.image} alt="" referrerPolicy="no-referrer" onError={() => setImgFailed(true)} />
            : <span className="avatar grad-brass">{(user.name || user.email || '?').trim().charAt(0).toUpperCase()}</span>}
          <b>{user.name || 'Tu cuenta'}</b>
          <span className="muted">{user.email}</span>
          <button className="btn btn-ghost account-out" onClick={onSignOut}><LogOut />Cerrar sesión</button>
          <span className="muted">
            <a href="/terminos.html" target="_blank" rel="noreferrer">Términos</a> · <a href="/privacidad.html" target="_blank" rel="noreferrer">Privacidad</a>
          </span>
        </section>

        <div className="settings-col">
        {/* Cuentas: opcionales. Sin ellas la app funciona exactamente igual. */}
        <section className="rise" style={{ '--i': 2 }} aria-labelledby="acc-h">
          <h2 className="group-h" id="acc-h">Cuentas</h2>
          {accounts.length === 0 ? (
            <div className="panel acc-intro">
              <span className="acc-intro-ico" aria-hidden="true"><Wallet /></span>
              <div>
                <h3>¿Tu dinero está en varios lados?</h3>
                <p className="muted">Crea una cuenta para el efectivo y otra para cada banco o billetera (Nequi, Daviplata…). Así sabes cuánto tienes en cada una. Es opcional: si no las usas, todo sigue como ahora.</p>
                <ol className="steps">
                  <li><b>Crea tus cuentas</b> con lo que tienes hoy en cada una.</li>
                  <li><b>Al anotar</b> un gasto o ingreso, elige de qué cuenta sale o a cuál entra.</li>
                  <li><b>Usa «Mover»</b> cuando pases dinero de una a otra, como al sacar del cajero.</li>
                </ol>
                <button className="btn btn-brass" onClick={onNewAccount}><Plus />Crear mi primera cuenta</button>
              </div>
            </div>
          ) : (
            <>
              <div className="section-h">
                <p className="muted acc-total">Tienes <b className="num">{fmtSigned(Object.values(balances).reduce((a, v) => a + v, 0))}</b> en total</p>
                <span className="spacer" />
                <button className="btn btn-brass btn-sm" onClick={onNewAccount}><Plus />Nueva cuenta</button>
              </div>
              <ul className="acclist">
                {accounts.map(a => (
                  <li key={a.id}>
                    <button type="button" className="accrow" onClick={() => onEditAccount(a)} aria-label={`Editar ${a.name}, saldo ${fmtSigned(balances[a.id] || 0)}`}>
                      <i className="dot" style={{ background: a.color }} aria-hidden="true" />
                      <span className="accrow-name"><b>{a.name}</b><small className="muted">Saldo inicial {fmt(a.initial || 0)}</small></span>
                      <b className={`num ${(balances[a.id] || 0) < 0 ? 'neg' : ''}`}>{fmtSigned(balances[a.id] || 0)}</b>
                      <Pencil className="accrow-edit" aria-hidden="true" />
                    </button>
                  </li>
                ))}
                {balances[''] !== 0 && (
                  <li className="accrow none">
                    <i className="dot" style={{ background: 'var(--line-2)' }} aria-hidden="true" />
                    <span className="accrow-name"><b>Sin cuenta</b><small className="muted">Movimientos sin asignar · ábrelos y elige una cuenta</small></span>
                    <b className="num">{fmtSigned(balances[''])}</b>
                  </li>
                )}
              </ul>
            </>
          )}
        </section>

        <section className="rise" style={{ '--i': 3 }}>
          <h2 className="group-h">Categorías</h2>
          <div className="section-h">
            <Seg label="Tipo de categoría" value={tab} onChange={setTab} options={[{ value: 'expense', label: 'Gastos', cls: 'exp' }, { value: 'income', label: 'Ingresos', cls: 'inc' }]} />
            <span className="spacer" />
            <button className="btn btn-brass btn-sm" onClick={() => onNew(tab)}><Plus />Nueva</button>
          </div>

      {list.length === 0 ? (
        <div className="panel"><Empty Icon={Tags} title="Sin categorías" action={<button className="btn btn-brass" onClick={() => onNew(tab)}>Crear una</button>}>Crea la primera para poder clasificar tus movimientos.</Empty></div>
      ) : (
        <div className="catgrid">
          {list.map((c, i) => {
            const st = stats[tab + ':' + c.id] || { n: 0, mes: 0 }
            return (
              <div key={c.id} className="catcard rise" style={{ '--i': i * .5 + 2 }}>
                <span className="catcard-dot" style={{ background: c.color }} />
                <button type="button" className="catcard-edit" onClick={() => onEdit(tab, c)} aria-label={`Editar ${c.name}`}><b>{c.name}</b></button>
                <span className="muted num">{st.n} movimiento{st.n !== 1 ? 's' : ''}{st.mes > 0 ? ` · ${fmt(st.mes)} este mes` : ''}</span>
                <button className="icon-btn danger" onClick={() => onDelete(tab, c.id)} aria-label={`Eliminar ${c.name}`}><Trash2 /></button>
              </div>
            )
          })}
        </div>
      )}
        </section>
        </div>
      </div>
    </div>
  )
}
