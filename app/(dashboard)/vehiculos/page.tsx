'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Search, Car } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { WorkStatusBadge, PaymentBadge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'

export default function VehiculosPage() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchVehicles = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/vehiculos?q=${encodeURIComponent(search)}`)
    const data = await res.json()
    setVehicles(data)
    setLoading(false)
  }, [search])

  useEffect(() => { fetchVehicles() }, [fetchVehicles])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vehículos</h1>
          <p className="text-gray-400 text-sm mt-1">{vehicles.length} registros</p>
        </div>
        <Link href="/vehiculos/nuevo">
          <Button><Plus size={16} /> Nuevo ingreso</Button>
        </Link>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por patente, marca, modelo o cliente..."
          className="w-full bg-[#1e2d42] border border-[#253652] rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : vehicles.length === 0 ? (
        <Card className="text-center py-12">
          <Car size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">Sin vehículos aún. <Link href="/vehiculos/nuevo" className="text-blue-400 hover:underline">Crear ficha de ingreso</Link></p>
        </Card>
      ) : (
        <div className="space-y-2">
          {vehicles.map(v => {
            const lastOrder = v.workOrders?.[0]
            return (
              <Link key={v.id} href={`/vehiculos/${v.id}`}>
                <Card className="hover:border-blue-500/50 transition cursor-pointer p-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-900/30 border border-blue-800/40 rounded-lg px-3 py-2 text-center min-w-[80px]">
                        <p className="text-blue-400 font-bold text-sm">{v.plate}</p>
                      </div>
                      <div>
                        <p className="text-white font-medium">{v.brand} {v.model} {v.year || ''}</p>
                        <p className="text-gray-400 text-sm">{v.client.name} · {v.client.phone || 'sin tel.'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      {v.color && <span className="text-gray-400">{v.color}</span>}
                      {v.km && <span className="text-gray-400">{v.km.toLocaleString('es-AR')} km</span>}
                      {lastOrder && (
                        <>
                          <WorkStatusBadge status={lastOrder.workStatus} />
                          <PaymentBadge status={lastOrder.paymentStatus} />
                          <span className="text-gray-500 text-xs">{formatDate(lastOrder.createdAt)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
