'use client'
import { MessageCircle, Copy, Check } from 'lucide-react'
import { useState } from 'react'

function normalizePhone(p: string): string {
  let d = p.replace(/\D/g, '')
  if (d.startsWith('0')) d = '54' + d.slice(1)
  if (!d.startsWith('54')) d = '54' + d
  return d
}

const STATUS_LABEL: Record<string, string> = {
  INGRESADO:       '📥 Ingresado — en espera de ser evaluado',
  EN_DIAGNOSTICO:  '🔍 En diagnóstico',
  EN_REPARACION:   '🔧 En reparación',
  EN_PROGRAMACION: '💻 En programación',
  LISTO:           '✅ ¡Listo para retirar!',
  ENTREGADO:       '📦 Entregado',
}

interface Props {
  phone:        string | null
  orderNumber:  number | null
  moduleName:   string
  vehicleInfo:  string
  status:       string
  tallerNombre: string
}

export function ShareWhatsAppButton({ phone, orderNumber, moduleName, vehicleInfo, status, tallerNombre }: Props) {
  const [copied, setCopied] = useState(false)

  function buildMessage() {
    const statusLabel = STATUS_LABEL[status] ?? status
    const orden = orderNumber ? `#${orderNumber}` : ''
    const lines = [
      `Hola! Te informamos el estado de tu módulo en *${tallerNombre}* 🔧`,
      ``,
      `📋 Orden ${orden}`,
      `📦 ${moduleName}`,
      vehicleInfo ? `🚗 ${vehicleInfo}` : '',
      ``,
      `Estado actual: *${statusLabel}*`,
      ``,
      `Ante cualquier consulta no dudes en escribirnos. ¡Gracias!`,
    ].filter(l => l !== undefined && !(l === '' && false))
    return lines.join('\n')
  }

  function sendWhatsApp() {
    const message = buildMessage()
    if (phone) {
      window.open(`https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`, '_blank')
    } else {
      navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  if (copied) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-900/30 border border-emerald-700 text-emerald-300">
        <Check size={13} /> ¡Mensaje copiado!
      </div>
    )
  }

  return (
    <button
      onClick={sendWhatsApp}
      title={phone ? 'Enviar estado por WhatsApp' : 'Copiar mensaje de estado'}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition"
      style={{ background: 'rgba(37,211,102,0.12)', color: '#25d366', border: '1px solid rgba(37,211,102,0.3)' }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(37,211,102,0.22)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(37,211,102,0.12)')}
    >
      {phone ? <MessageCircle size={13} /> : <Copy size={13} />}
      {phone ? 'WhatsApp' : 'Copiar mensaje'}
    </button>
  )
}
