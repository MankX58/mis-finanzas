import { ArrowDownRight, ArrowUpRight, Pencil, Trash2, User } from 'lucide-react'
import { fmt, hexAlpha } from '../finance'

/** Fila de movimiento. Toda la fila abre la edición; en escritorio aparecen acciones al pasar el cursor. */
export default function TxRow({ tx, cat, onEdit, onDelete, i = 0, extra }) {
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
