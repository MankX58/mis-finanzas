import { useRef } from 'react'
import { Nfc, Settings2 } from 'lucide-react'
import { Brand } from './ui'

/** Tarjeta física en CSS: se inclina hacia el puntero y un brillo de latón sigue el cursor. */
export default function CreditCardFace({ card, onEdit }) {
  const ref = useRef(null)
  const move = e => {
    const el = ref.current, r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height
    el.style.setProperty('--rx', ((.5 - py) * 14).toFixed(2) + 'deg')
    el.style.setProperty('--ry', ((px - .5) * 18).toFixed(2) + 'deg')
    el.style.setProperty('--mx', (px * 100).toFixed(1) + '%')
    el.style.setProperty('--my', (py * 100).toFixed(1) + '%')
  }
  const reset = () => ['--rx', '--ry'].forEach(k => ref.current.style.setProperty(k, '0deg'))
  return (
    <div className="ccard-stage">
      <div className="ccard" ref={ref} style={{ '--cc': card.color || '#e8b04b' }} onPointerMove={move} onPointerLeave={reset} role="img"
        aria-label={`Tarjeta ${card.name}${card.last4 ? ' terminada en ' + card.last4 : ''}. Corte el día ${card.cutDay}, pago el día ${card.payDay}`}>
        <div className="ccard-top">
          <span className="ccard-name">{card.name || 'Mi tarjeta'}</span>
          <Nfc className="ccard-nfc" />
        </div>
        <div className="ccard-chip" aria-hidden="true"><i /><i /><i /><i /></div>
        <div className="ccard-num num">•••• •••• •••• {card.last4 || '····'}</div>
        <div className="ccard-foot">
          <span><small>Corte</small><b className="num">día {card.cutDay}</b></span>
          <span><small>Pago</small><b className="num">día {card.payDay}</b></span>
          {card.limit > 0 && <span><small>Cupo</small><b className="num">${Number(card.limit).toLocaleString('es-CO')}</b></span>}
          <Brand size={30} />
        </div>
      </div>
      <button className="icon-btn ccard-edit" onClick={onEdit} aria-label="Configurar tarjeta" title="Configurar tarjeta"><Settings2 /></button>
    </div>
  )
}
