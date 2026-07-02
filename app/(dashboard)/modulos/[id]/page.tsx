import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Cpu, Car, FileText, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { ModuleStatusControl } from '@/components/ModuleStatusControl'
import { ModuleBudgetPanel } from '@/components/ModuleBudgetPanel'
import { ModuleNotesEditor } from '@/components/ModuleNotesEditor'
import { ModuleItemsPanel } from '@/components/ModuleItemsPanel'
import { DeleteModuloButton } from '@/components/DeleteModuloButton'
import { ModuleTrackingLoader } from '@/components/ModuleTrackingLoader'
import { ModuleClientEditor } from '@/components/ModuleClientEditor'
import { ShareWhatsAppButton } from '@/components/ShareWhatsAppButton'

const WORK_TYPE_LABEL: Record<string, string> = {
  DIAGNOSTICO:  'Diagnóstico en banco',
  REPARACION:   'Reparación',
  PROGRAMACION: 'Programación',
}

const WORK_TYPE_COLOR: Record<string, string> = {
  DIAGNOSTICO:  'bg-yellow-900/40 text-yellow-300 border-yellow-800/50',
  REPARACION:   'bg-red-900/40 text-red-300 border-red-800/50',
  PROGRAMACION: 'bg-cyan-900/40 text-cyan-300 border-cyan-800/50',
}

function ModuleStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'outline' | 'info' | 'warning' | 'success' | 'default' }> = {
    INGRESADO:       { label: 'Ingresado',       variant: 'outline'  },
    EN_DIAGNOSTICO:  { label: 'En diagnóstico',  variant: 'info'     },
    EN_REPARACION:   { label: 'En reparación',   variant: 'warning'  },
    EN_PROGRAMACION: { label: 'En programación', variant: 'warning'  },
    LISTO:           { label: 'Listo',           variant: 'success'  },
    ENTREGADO:       { label: 'Entregado',       variant: 'default'  },
  }
  const s = map[status] ?? { label: status, variant: 'default' as const }
  return <Badge variant={s.variant}>{s.label}</Badge>
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'danger' | 'warning' | 'success' | 'default' }> = {
    PENDIENTE: { label: 'Pendiente', variant: 'danger'  },
    SENA:      { label: 'Seña',      variant: 'warning' },
    PARCIAL:   { label: 'Parcial',   variant: 'warning' },
    PAGADO:    { label: 'Pagado',    variant: 'success' },
  }
  const s = map[status] ?? { label: status, variant: 'default' as const }
  return <Badge variant={s.variant}>{s.label}</Badge>
}

export default async function ModuloDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const job = await prisma.moduleJob.findUnique({
    where: { id },
    include: {
      modules: { include: { moduleType: true }, orderBy: { createdAt: 'asc' } },
      client: { select: { id: true, name: true, type: true, discount: true, phone: true } },
    },
  })

  if (!job) notFound()

  const products = await prisma.product.findMany({ orderBy: { name: 'asc' } })
  const moduleTypes = await prisma.moduleType.findMany({ orderBy: { name: 'asc' } })
  const config = await prisma.config.findMany()
  const cfg: Record<string, string> = {}
  config.forEach(c => { cfg[c.key] = c.value })
  const tallerNombre = cfg.tallerNombre || 'ICATRONIC'

  const clientName = job.client?.name ?? job.techName ?? 'Sin nombre'
  const clientPhone = job.client?.phone ?? job.techPhone ?? null
  const vehicleInfo = [job.vehicleBrand, job.vehicleModel, job.vehicleYear].filter(Boolean).join(' ')
  const typeColor = WORK_TYPE_COLOR[job.workType] ?? 'bg-gray-800 text-gray-300 border-gray-700'
  const clientDiscount = job.client?.discount ?? 0

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/modulos">
          <Button variant="ghost" size="sm"><ArrowLeft size={16} /> Volver</Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Cpu size={20} className="text-[#00e5ff]" />
            {job.modules.length === 1
              ? job.modules[0].moduleType.name
              : `Kit de ${job.modules.length} módulos`}
            {job.orderNumber && <span className="text-gray-500 font-mono text-lg font-normal">#{job.orderNumber}</span>}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {clientName}
            {vehicleInfo && <> · {vehicleInfo}</>}
            {' · '}{formatDate(job.entryDate)}
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded border ${typeColor}`}>{WORK_TYPE_LABEL[job.workType]}</span>
        <ModuleStatusBadge status={job.status} />
        <PaymentBadge status={job.paymentStatus} />
        <ShareWhatsAppButton
          phone={clientPhone}
          orderNumber={job.orderNumber ?? null}
          moduleName={job.modules.map(m => m.moduleType.name).join(' · ')}
          vehicleInfo={vehicleInfo}
          status={job.status}
          tallerNombre={tallerNombre}
        />
        <a href={`/api/pdf/diagnostico-modulo/${job.id}`} target="_blank" rel="noopener">
          <Button variant="secondary" size="sm"><ClipboardList size={14} /> Informe PDF</Button>
        </a>
        <a href={`/api/pdf/recibo-modulo/${job.id}`} target="_blank" rel="noopener">
          <Button variant="secondary" size="sm"><FileText size={14} /> Recibo PDF</Button>
        </a>
        <DeleteModuloButton id={job.id} />
      </div>

      {/* Info rápida */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="p-0">
          <ModuleClientEditor
            moduleJobId={job.id}
            client={job.client ?? null}
            techName={job.techName ?? null}
            techPhone={job.techPhone ?? null}
            clientType={job.clientType}
          />
        </Card>
        <Card className="p-3">
          <p className="text-[#7a9aaa] text-[0.65rem] uppercase tracking-widest flex items-center gap-1 mb-1"><Car size={10} /> Vehículo</p>
          <p className="text-white text-sm font-medium">{vehicleInfo || <span className="text-gray-500 italic text-xs">No especificado</span>}</p>
        </Card>
        <Card className="p-3 col-span-2 sm:col-span-1">
          <p className="text-[#7a9aaa] text-[0.65rem] uppercase tracking-widest mb-1">Facturación</p>
          {job.budget != null ? (
            <>
              <p className="text-emerald-400 font-bold">{formatCurrency(job.budget)}</p>
              {job.amountPaid > 0 && <p className="text-gray-400 text-xs">Pagado: {formatCurrency(job.amountPaid)}</p>}
            </>
          ) : (
            <p className="text-gray-500 text-xs italic">Sin presupuesto</p>
          )}
        </Card>
      </div>

      {/* Lista de módulos del kit */}
      <ModuleItemsPanel moduleJobId={job.id} initialItems={job.modules} moduleTypes={moduleTypes} />

      {/* Motivo, hallazgos, trabajo realizado, notas */}
      <ModuleNotesEditor
        moduleJobId={job.id}
        motive={job.motive}
        findings={job.findings ?? ''}
        workDone={job.workDone ?? ''}
        notes={job.notes ?? ''}
      />

      {/* Estado + Presupuesto */}
      <div className="grid xl:grid-cols-2 gap-6">
        <div className="space-y-5">
          <ModuleStatusControl job={job} />
          <ModuleBudgetPanel
            moduleJobId={job.id}
            products={products}
            clientType={job.clientType}
            discount={clientDiscount}
          />
        </div>
      </div>

      {/* Seguimiento del diagnóstico */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-[#00e5ff] rounded-full inline-block" />
          Seguimiento del diagnóstico
        </h2>
        <ModuleTrackingLoader moduleJobId={job.id} />
      </div>
    </div>
  )
}
