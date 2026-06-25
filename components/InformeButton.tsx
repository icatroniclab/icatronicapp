'use client'
import { useState } from 'react'
import { FileText } from 'lucide-react'
import { Button } from './ui/Button'

export function InformeButton({ orderId }: { orderId: string }) {
  const [showPagos, setShowPagos] = useState(true)

  const url = `/api/pdf/informe/${orderId}${showPagos ? '' : '?pagos=0'}`

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={showPagos}
          onChange={e => setShowPagos(e.target.checked)}
          className="w-3.5 h-3.5 accent-[#00e5ff] cursor-pointer"
        />
        <span className="text-[#7a9aaa] text-xs">Incluir resumen de pagos</span>
      </label>
      <a href={url} target="_blank" rel="noopener">
        <Button variant="secondary" size="sm">
          <FileText size={14} /> Informe para cliente
        </Button>
      </a>
    </div>
  )
}
