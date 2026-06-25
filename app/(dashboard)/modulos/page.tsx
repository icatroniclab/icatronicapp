'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Cpu, Plus, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const WORK_TYPE_LABEL: Record<string, string> = {
  DIAGNOSTICO:  'Diagnóstico',
  REPARACION:   'Reparación',
  PROGRAMACION: 'Programación',
}

const WORK_TYPE_COLOR: Record<string, string> = {
  DIAGNOSTICO:  'bg-yellow-900/40 text-yellow-300 border-yellow-800/50',
  REPARACION:   'bg-red-900/40 text-red-300 border-red-800/50',
  PROGRAMACION: 'bg-cyan-900/40 text-cyan-300 border-cyan-800/50',
}

const STATUS_MAP: Record<string, { label: string; variant: 'outline' | 'info' | 'warning' | 'success' | 'default' }> = {
  INGRESADO:       { label: 'Ingresado',       variant: 'outline'  },
  EN_DIAGNOSTICO:  { label: 'En diagnóstico',  variant: 'info'     },
  EN_REPARACION:   { label: 'En reparación',   variant: 'warning'  },
  EN_PROGRAMACION: { label: 'En programación', variant: 'warning'  },
  LISTO:           { label: 'Listo',           variant: 'success'  },
  ENTREGADO:       { label: 'Entregado',       variant: 'default'  },
}

const PAYMENT_MAP: Record<string, { label: string; variant: 'danger' | 'warning' | 'success' | 'default' }> = {
  PENDIENTE: { label: 'Pendiente', variant: 'danger'  },
  SENA:      { label: 'Seña',      variant: 'warning' },
  PARCIAL:   { label: 'Parcial',   variant: 'warning' },
  PAGADO:    { label: 'Pagado',    variant: 'success' },
}

export default function ModulosPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [verTodos, setVerTodos] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch('/api/modulos')
      .then(r => r.json())
      .then(data => { setJobs(data); setLoading(false) })
  }, [])

  const activos   = jobs.filter(j => j.status !== 'ENTREGADO')
  const entregados = jobs.filter(j => j.status === 'ENTREGADO')
  const visibles  = verTodos ? jobs : activos

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Módulos</h1>
          <p className="text-gray-400 text-sm mt-1">
            {activos.length} activo{activos.length !== 1 ? 's' : ''}
            {entregados.length > 0 && ` · ${entregados.length} entregado${entregados.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {entregados.length > 0 && (
            <Button variant="secondary" size="sm" onClick={() => setVerTodos(v => !v)}>
              {verTodos ? 'Ver solo activos' : `Ver todos (${jobs.length})`}
            </Button>
          )}
          <Link href="/modulos/tipos">
            <Button variant="secondary" size="sm"><Settings2 size={15} /> Tipos de módulo</Button>
          </Link>
          <Link href="/modulos/nuevo">
            <Button size="sm"><Plus size={15} /> Ingresar módulos</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Cargando...</p>
      ) : visibles.length === 0 ? (
        <Card className="text-center py-12">
          <Cpu size={40} className="text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">
            {jobs.length === 0
              ? <>Sin ingresos todavía. <Link href="/modulos/nuevo" className="text-[#00e5ff] hover:underline">Ingresar módulos</Link></>
              : 'No hay ingresos activos. Usá "Ver todos" para ver los entregados.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {visibles.map(job => {
            const name = job.client?.name ?? job.techName ?? 'Sin nombre'
            const vehicleInfo = [job.vehicleBrand, job.vehicleModel, job.vehicleYear].filter(Boolean).join(' ')
            const typeColor = WORK_TYPE_COLOR[job.workType] ?? 'bg-gray-800 text-gray-300 border-gray-700'
            const moduleNames = job.modules.map((m: any) => m.moduleType.name).join(' · ')
            const ws = STATUS_MAP[job.status]  ?? { label: job.status, variant: 'default' as const }
            const ps = PAYMENT_MAP[job.paymentStatus] ?? { label: job.paymentStatus, variant: 'default' as const }

            return (
              <Link key={job.id} href={`/modulos/${job.id}`}>
                <Card className={`hover:border-[rgba(0,229,255,0.4)] transition cursor-pointer p-4 ${job.status === 'ENTREGADO' ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                      <div className="bg-[rgba(0,229,255,0.06)] border border-[rgba(0,229,255,0.2)] rounded-lg px-3 py-2 text-center min-w-[60px]">
                        {job.orderNumber && <p className="text-gray-500 text-[10px] font-mono">#{job.orderNumber}</p>}
                        <Cpu size={14} className="text-[#00e5ff] mx-auto mb-0.5" />
                        <p className="text-[#00e5ff] font-bold text-xs">{job.modules.length}</p>
                        <p className="text-gray-500 text-[10px]">{job.modules.length === 1 ? 'módulo' : 'módulos'}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="text-white font-medium">{name}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${typeColor}`}>
                            {WORK_TYPE_LABEL[job.workType]}
                          </span>
                        </div>
                        <p className="text-[#00e5ff]/70 text-xs font-mono">{moduleNames}</p>
                        {vehicleInfo && <p className="text-gray-400 text-xs mt-0.5">{vehicleInfo}</p>}
                        <p className="text-gray-500 text-xs mt-0.5">{job.motive.substring(0, 80)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm flex-wrap">
                      {job.budget != null && <span className="text-emerald-400 font-medium">{formatCurrency(job.budget)}</span>}
                      <Badge variant={ws.variant}>{ws.label}</Badge>
                      <Badge variant={ps.variant}>{ps.label}</Badge>
                      <span className="text-gray-500 text-xs">{formatDate(job.createdAt)}</span>
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
