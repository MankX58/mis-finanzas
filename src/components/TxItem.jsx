import { fmt, hexAlpha } from '../finance'

export default function TxItem({ tx, getCat, onDelete, onEdit }) {
  const cat = getCat(tx.type, tx.category)
  const isInc = tx.type === 'income'

  return (
    <div className="tx-item">
      <div className="tx-dot" style={{background:cat.color}}></div>
      <div className="tx-info">
        <div className="tx-name">{tx.note || cat.name}</div>
        <div className="tx-meta">
          <span className="cat-chip" style={{background:hexAlpha(cat.color,.16),color:cat.color}}>{cat.name}</span>
          &nbsp;{tx.date}
        </div>
      </div>
      <div className={`tx-amount ${isInc?'inc':'exp'}`}>{isInc?'+':'-'}{fmt(tx.amount)}</div>
      <button className="tx-del" onClick={() => onDelete(tx.id)}>✕</button>
    </div>
  )
}