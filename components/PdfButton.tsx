'use client'
import { useState } from 'react'
import { Button } from './ui/Button'
import { FileText } from 'lucide-react'

export function PdfButton({ orderId }: { orderId: string }) {
  const [showPagos, setShowPagos] = useState(false)

  const url = `/api/pdf/${orderId}${showPagos ? '?pagos=1' : ''}`

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={showPagos}
          onChange={e => setShowPagos(e.target.checked)}
          className="w-3.5 h-3.5 accent-[#00e5ff] cursor-pointer"
        />
        <span className="text-[#7a9aaa] text-xs">Incluir info de pagos</span>
      </label>
      <a href={url} target="_blank" rel="noopener">
        <Button variant="secondary" size="sm"><FileText size={14} /> PDF</Button>
      </a>
    </div>
  )
}
