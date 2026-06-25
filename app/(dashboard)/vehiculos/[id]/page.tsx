import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ArrowLeft, FileText, Wrench, Pencil, Clock } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { WorkStatusBadge, PaymentBadge, Badge } from '@/components/ui/Badge'
import { DASHBOARD_LIGHTS, formatCurrency, formatDate } from '@/lib/utils'
import { WorkOrderStatusControl } from '@/components/WorkOrderStatusControl'
import { PdfButton } from '@/components/PdfButton'
import { InformeButton } from '@/components/InformeButton'

export default async function VehiculoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      client: true,
      workOrders: {
        orderBy: { createdAt: 'desc' },
        include: {
          tracking: { include: { dtcCodes: true, partsUsed: { include: { product: true } } } },
        },
      },
    },
  })

  if (!vehicle) notFound()

  const lastOrder = vehicle.workOrders[0]
  const activeLights = lastOrder ? DASHBOARD_LIGHTS.filter(l => (lastOrder as any)[l.key]) : []
  const damageZones = lastOrder?.damageZones ? JSON.parse(lastOrder.damageZones) : []
  const photos = lastOrder?.photos ? JSON.parse(lastOrder.photos) : []

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/vehiculos"><Button variant="ghost" size="sm"><ArrowLeft size={16} /> Volver</Button></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">
            {vehicle.plate} — {vehicle.brand} {vehicle.model}
          </h1>
          <p className="text-gray-400 text-sm">{vehicle.client.name}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {lastOrder && <InformeButton orderId={lastOrder.id} />}
          {lastOrder && <PdfButton orderId={lastOrder.id} />}
          {lastOrder && (
            <Link href={`/trabajos/${lastOrder.id}`}>
              <Button variant="secondary"><Wrench size={16} /> Ver seguimiento</Button>
            </Link>
          )}
          <Link href={`/vehiculos/${id}/editar`}>
            <Button variant="secondary"><Pencil size={16} /> Editar datos</Button>
          </Link>
          <Link href="/vehiculos/nuevo">
            <Button size="sm" variant="secondary">+ Nuevo ingreso</Button>
          </Link>
        </div>
      </div>

      {/* Info cliente + vehículo */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-semibold text-white mb-3">Cliente</h2>
          <dl className="space-y-1.5 text-sm">
            <Row label="Nombre" value={vehicle.client.name} />
            <Row label="Teléfono" value={vehicle.client.phone || '—'} />
            <Row label="Email" value={vehicle.client.email || '—'} />
            <Row label="DNI/CUIT" value={vehicle.client.dni || '—'} />
          </dl>
        </Card>
        <Card>
          <h2 className="font-semibold text-white mb-3">Vehículo</h2>
          <dl className="space-y-1.5 text-sm">
            <Row label="Patente" value={vehicle.plate} />
            <Row label="Marca / Modelo" value={`${vehicle.brand} ${vehicle.model}`} />
            <Row label="Año" value={vehicle.year?.toString() || '—'} />
            <Row label="KM" value={vehicle.km ? `${vehicle.km.toLocaleString('es-AR')} km` : '—'} />
            <Row label="Color" value={vehicle.color || '—'} />
            {vehicle.engineType && <Row label="Motor" value={vehicle.engineType} />}
            {vehicle.displacement && <Row label="Cilindrada" value={vehicle.displacement} />}
            {vehicle.engineCode && <Row label="Cód. motor" value={vehicle.engineCode} />}
          </dl>
        </Card>
      </div>

      {/* Orden actual (más reciente) */}
      {lastOrder && (() => {
        const wo = lastOrder
        const woLights = DASHBOARD_LIGHTS.filter(l => (wo as any)[l.key])
        const woDamages = wo.damageZones ? JSON.parse(wo.damageZones) : []
        const woPhotos = wo.photos ? JSON.parse(wo.photos) : []
        return (
          <Card key={wo.id}>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-blue-400" />
                <div>
                  <p className="font-semibold text-white">
                    Orden actual <span className="text-gray-500 font-normal text-sm">#{wo.orderNumber}</span>
                  </p>
                  <p className="text-gray-400 text-xs">{formatDate(wo.entryDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <WorkStatusBadge status={wo.workStatus} />
                <PaymentBadge status={wo.paymentStatus} />
                {wo.budget && <span className="text-emerald-400 font-medium text-sm">{formatCurrency(wo.budget)}</span>}
              </div>
            </div>

            <WorkOrderStatusControl order={wo} />

            <div className="space-y-3 mt-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Motivo</p>
                <p className="text-gray-200 text-sm">{wo.motive}</p>
              </div>
              {woLights.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Luces tablero</p>
                  <div className="flex flex-wrap gap-1.5">
                    {woLights.map(l => <Badge key={l.key} variant="warning">{l.label}</Badge>)}
                  </div>
                </div>
              )}
              {woDamages.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Daños</p>
                  <div className="flex flex-wrap gap-1.5">
                    {woDamages.map((z: string) => <Badge key={z} variant="danger">{z}</Badge>)}
                  </div>
                </div>
              )}
              {wo.missingItems && <InfoRow label="Faltantes" value={wo.missingItems} />}
              {wo.valuables && <InfoRow label="Objetos de valor" value={wo.valuables} />}
              {wo.notes && <InfoRow label="Notas" value={wo.notes} />}
              {woPhotos.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Fotos de ingreso</p>
                  <div className="flex flex-wrap gap-2">
                    {woPhotos.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noopener">
                        <img src={url} alt="" className="w-24 h-24 object-cover rounded-lg border border-[#253652] hover:border-blue-500 transition" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {wo.tracking && (
                <div className="border-t border-[#253652] pt-3 mt-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Seguimiento</p>
                  {wo.tracking.dtcCodes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {wo.tracking.dtcCodes.map(dtc => (
                        <Badge key={dtc.id} variant="info">{dtc.code}{dtc.description ? ` — ${dtc.description}` : ''}</Badge>
                      ))}
                    </div>
                  )}
                  {wo.tracking.partsUsed.length > 0 && (
                    <div className="text-sm text-gray-300">
                      <span className="text-gray-400">Repuestos: </span>
                      {wo.tracking.partsUsed.map(p => `${p.product.name} (×${p.quantity})`).join(', ')}
                    </div>
                  )}
                  <Link href={`/trabajos/${wo.id}`} className="text-blue-400 hover:text-blue-300 text-sm inline-flex items-center gap-1 mt-2">
                    <Wrench size={14} /> Ver seguimiento completo →
                  </Link>
                </div>
              )}
            </div>
          </Card>
        )
      })()}

      {/* Historial cronológico */}
      {vehicle.workOrders.length > 1 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Historial de trabajos ({vehicle.workOrders.length - 1} {vehicle.workOrders.length - 1 === 1 ? 'ingreso anterior' : 'ingresos anteriores'})
            </h2>
          </div>

          <div className="relative pl-6">
            {/* Línea vertical de la timeline */}
            <div className="absolute left-2 top-0 bottom-0 w-px bg-[#253652]" />

            <div className="space-y-4">
              {vehicle.workOrders.slice(1).map((wo) => {
                const woLights = DASHBOARD_LIGHTS.filter(l => (wo as any)[l.key])
                const woDamages = wo.damageZones ? JSON.parse(wo.damageZones) : []
                const woPhotos = wo.photos ? JSON.parse(wo.photos) : []
                return (
                  <div key={wo.id} className="relative">
                    {/* Punto de la timeline */}
                    <div className="absolute -left-[18px] top-4 w-2.5 h-2.5 rounded-full bg-[#253652] border-2 border-[#1e2d42]" />

                    <Card>
                      <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                        <div>
                          <p className="font-semibold text-white text-sm">
                            Orden <span className="font-mono text-gray-400">#{wo.orderNumber}</span>
                          </p>
                          <p className="text-gray-500 text-xs mt-0.5">{formatDate(wo.entryDate)}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <WorkStatusBadge status={wo.workStatus} />
                          <PaymentBadge status={wo.paymentStatus} />
                          {wo.budget && <span className="text-emerald-400 font-medium text-sm">{formatCurrency(wo.budget)}</span>}
                        </div>
                      </div>

                      <p className="text-gray-300 text-sm mb-3">{wo.motive}</p>

                      {woLights.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {woLights.map(l => <Badge key={l.key} variant="warning">{l.label}</Badge>)}
                        </div>
                      )}
                      {woDamages.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {woDamages.map((z: string) => <Badge key={z} variant="danger">{z}</Badge>)}
                        </div>
                      )}
                      {wo.notes && <p className="text-gray-500 text-xs mb-2 italic">{wo.notes}</p>}

                      {wo.tracking && (
                        <div className="border-t border-[#253652] pt-2 mt-2">
                          {wo.tracking.dtcCodes.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {wo.tracking.dtcCodes.map(dtc => (
                                <Badge key={dtc.id} variant="info">{dtc.code}{dtc.description ? ` — ${dtc.description}` : ''}</Badge>
                              ))}
                            </div>
                          )}
                          {wo.tracking.partsUsed.length > 0 && (
                            <p className="text-xs text-gray-400 mb-2">
                              Repuestos: {wo.tracking.partsUsed.map(p => `${p.product.name} (×${p.quantity})`).join(', ')}
                            </p>
                          )}
                        </div>
                      )}

                      {woPhotos.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {woPhotos.map((url: string, i: number) => (
                            <a key={i} href={url} target="_blank" rel="noopener">
                              <img src={url} alt="" className="w-16 h-16 object-cover rounded border border-[#253652] hover:border-blue-500 transition" />
                            </a>
                          ))}
                        </div>
                      )}

                      <Link href={`/trabajos/${wo.id}`} className="text-blue-400 hover:text-blue-300 text-xs inline-flex items-center gap-1 mt-1">
                        <Wrench size={12} /> Ver seguimiento completo →
                      </Link>
                    </Card>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {vehicle.workOrders.length === 0 && (
        <Card className="text-center py-8">
          <p className="text-gray-400">Sin órdenes de trabajo aún.</p>
        </Card>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-400">{label}</dt>
      <dd className="text-gray-200 text-right">{value}</dd>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-gray-200 text-sm">{value}</p>
    </div>
  )
}
