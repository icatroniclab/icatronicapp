import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { WorkStatusBadge, PaymentBadge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { TrackingPanel } from '@/components/TrackingPanel'
import { AiAssistant } from '@/components/AiAssistant'
import { BudgetPanel } from '@/components/BudgetPanel'
import { MotiveNotesEditor } from '@/components/MotiveNotesEditor'
import { InformeButton } from '@/components/InformeButton'
import { WorkOrderFilesPanel } from '@/components/WorkOrderFilesPanel'

export default async function TrabajoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      vehicle: { include: { client: true } },
      tracking: {
        include: { dtcCodes: true, partsUsed: { include: { product: true } }, diagnosticLog: { orderBy: { createdAt: 'asc' } } },
      },
    },
  })

  if (!order) notFound()

  // Asegurar tracking existe
  let tracking = order.tracking
  if (!tracking) {
    tracking = await prisma.workTracking.create({
      data: { workOrderId: order.id },
      include: { dtcCodes: true, partsUsed: { include: { product: true } }, diagnosticLog: { orderBy: { createdAt: 'asc' } } },
    })
  }

  const products = await prisma.product.findMany({ orderBy: { name: 'asc' } })

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href={`/vehiculos/${order.vehicleId}`}>
          <Button variant="ghost" size="sm"><ArrowLeft size={16} /> Volver a ficha</Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            {order.orderNumber && <span className="text-gray-500 font-mono text-lg">#{order.orderNumber}</span>}
            Seguimiento — {order.vehicle.plate}
          </h1>
          <p className="text-gray-400 text-sm">
            {order.vehicle.brand} {order.vehicle.model} · {order.vehicle.client.name} · {formatDate(order.entryDate)}
          </p>
        </div>
        <InformeButton orderId={order.id} />
        <WorkStatusBadge status={order.workStatus} />
        <PaymentBadge status={order.paymentStatus} />
      </div>

      <MotiveNotesEditor workOrderId={order.id} motive={order.motive} notes={order.notes ?? ''} />

      <div className="grid xl:grid-cols-2 gap-6">
        <div className="space-y-6">
          <BudgetPanel workOrderId={order.id} products={products} client={order.vehicle.client} vehicle={order.vehicle} />
          <TrackingPanel tracking={tracking} workOrderId={order.id} products={products} />
        </div>
        <div className="space-y-6">
          <AiAssistant workOrderId={order.id} />
          <WorkOrderFilesPanel
            workOrderId={order.id}
            initialReports={JSON.parse((order as any).reports ?? '[]')}
            initialCsvLogs={JSON.parse((order as any).csvLogs ?? '[]')}
          />
        </div>
      </div>
    </div>
  )
}
