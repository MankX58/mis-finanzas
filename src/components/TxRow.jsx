import { ArrowDownRight, ArrowUpRight, ArrowLeftRight, ArrowRight, Pencil, Trash2, User } from 'lucide-react'
import { fmt, hexAlpha } from '../finance'

/** Fila de movimiento. Toda la fila abre la edición; en escritorio aparecen acciones al pasar el cursor. */
export default function TxRow({ tx, cat, account, onEdit, onDelete, i = 0, extra }) {
  const inc = tx.type === 'income'
  const Icon = inc ? ArrowUpRight : ArrowDownRight
  return (
    <div className="txrow rise" style={{ '--i': Math.min(i, 8) * .5 }}>
      <button className="txrow-main" onClick={() => onEdit(tx.id)} aria-label={`Editar ${tx.note || cat.name}, ${inc ? '+' : '−'}${fmt(tx.amount)}`}>
        <span className="txrow-ico" style={{ background: hexAlpha(cat.color, .16), color: cat.color }}><Icon /></span>
        <span className="txrow-info">
          <span className="txrow-name">{tx.note || cat.name}</span>
          <span className="txrow-meta">
            <span className="tag" style={{ background: hexAlpha(cat.color, .14), color: cat.color }}>{cat.name}</span>
            {account && <span className="tag acc-tag"><i className="dot" style={{ background: account.color }} />{account.name}</span>}
            {tx.who && <span className="tag" style={{ background: hexAlpha('#9085e9', .16), color: '#b3aaf2' }}><User />{tx.who}</span>}
            {extra}
          </span>
        </span>
        <span className={`txrow-amt num ${inc ? 'pos' : ''}`}>{inc ? '+' : '−'}{fmt(tx.amount)}</span>
      </button>
      <span className="txrow-act">
        <button className="icon-btn hov" onClick={() => onEdit(tx.id)} title="Editar" aria-label="Editar"><Pencil /></button>
        <button className="icon-btn danger hov" onClick={() => onDelete(tx.id)} title="Eliminar" aria-label="Eliminar"><Trash2 /></button>
      </span>
    </div>
  )
}

/** Transferencia entre cuentas: no es ingreso ni gasto, así que el monto va en gris y sin signo. */
export function TransferRow({ t, from, to, onEdit, i = 0 }) {
  return (
    <div className="txrow rise" style={{ '--i': Math.min(i, 8) * .5 }}>
      <button className="txrow-main" onClick={() => onEdit(t.id)} aria-label={`Editar transferencia de ${from?.name || 'cuenta'} a ${to?.name || 'cuenta'}, ${fmt(t.amount)}`}>
        <span className="txrow-ico transfer-ico"><ArrowLeftRight /></span>
        <span className="txrow-info">
          <span className="txrow-name">{t.note || 'Transferencia'}</span>
          <span className="txrow-meta">
            <span className="tag acc-tag"><i className="dot" style={{ background: from?.color || 'var(--line-2)' }} />{from?.name || 'Cuenta borrada'}</span>
            <ArrowRight className="transfer-arrow" aria-hidden="true" />
            <span className="tag acc-tag"><i className="dot" style={{ background: to?.color || 'var(--line-2)' }} />{to?.name || 'Cuenta borrada'}</span>
          </span>
        </span>
        <span className="txrow-amt num muted">{fmt(t.amount)}</span>
      </button>
    </div>
  )
}
