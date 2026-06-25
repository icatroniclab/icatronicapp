'use client'
import { useState, useEffect } from 'react'
import { ModuleTrackingPanel } from './ModuleTrackingPanel'

export function ModuleTrackingLoader({ moduleJobId }: { moduleJobId: string }) {
  const [tracking, setTracking] = useState<any>(null)

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/modulos/tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleJobId }),
    })
      .then(async r => {
        const text = await r.text()
        if (!text) throw new Error('Respuesta vacía del servidor')
        const data = JSON.parse(text)
        if (!r.ok) throw new Error(data.error ?? `HTTP ${r.status}`)
        return data
      })
      .then(setTracking)
      .catch(e => setError(e.message))
  }, [moduleJobId])

  if (error) return (
    <div className="p-4 rounded-lg bg-red-900/20 border border-red-800 text-red-300 text-sm">
      <p className="font-semibold mb-1">Error al cargar el seguimiento</p>
      <p className="text-xs font-mono">{error}</p>
      <p className="text-xs mt-2 text-red-400">Si acabás de agregar esta funcionalidad, asegurate de haber corrido la migración:<br /><code>npx prisma migrate dev --name add_module_tracking</code></p>
    </div>
  )

  if (!tracking) return <p className="text-gray-500 text-sm">Cargando seguimiento...</p>

  return <ModuleTrackingPanel tracking={tracking} moduleJobId={moduleJobId} />
}
