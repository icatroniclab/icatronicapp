import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const metadata = { title: 'Estado de tu módulo' }

const STATUS_INFO: Record<string, { label: string; step: number; message: string; color: string }> = {
  INGRESADO:       { label: 'En espera',            step: 1, color: '#6b7280', message: 'Tu módulo fue recibido en el taller y está en cola de atención.' },
  EN_DIAGNOSTICO:  { label: 'En diagnóstico',       step: 2, color: '#3b82f6', message: 'Estamos analizando tu módulo para identificar el problema. Te avisaremos cuando tengamos novedades.' },
  EN_REPARACION:   { label: 'En reparación',        step: 2, color: '#f59e0b', message: 'Tu módulo está siendo reparado por nuestros técnicos.' },
  EN_PROGRAMACION: { label: 'En programación',      step: 2, color: '#8b5cf6', message: 'Tu módulo está siendo programado o codificado.' },
  LISTO:           { label: '¡Listo para retirar!', step: 3, color: '#10b981', message: 'Tu módulo ya está listo. Podés pasar a buscarlo al taller.' },
  ENTREGADO:       { label: 'Entregado',            step: 4, color: '#9ca3af', message: '¡Tu módulo fue entregado. Gracias por confiar en nosotros!' },
}

const STEPS = ['Recibido', 'En proceso', 'Listo', 'Entregado']

export default async function EstadoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const [job, config] = await Promise.all([
    prisma.moduleJob.findUnique({
      where: { shareToken: token },
      select: {
        orderNumber:  true,
        status:       true,
        workType:     true,
        vehicleBrand: true,
        vehicleModel: true,
        vehicleYear:  true,
        entryDate:    true,
        modules: {
          select: { moduleType: { select: { name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
    prisma.config.findMany(),
  ])

  if (!job) notFound()

  const cfg: Record<string, string> = {}
  config.forEach(c => { cfg[c.key] = c.value })

  const tallerNombre    = cfg.tallerNombre    || 'ICATRONIC'
  const tallerSubtitulo = cfg.tallerSubtitulo || 'Electrónica Automotriz'
  const tallerTelefono  = cfg.tallerTelefono  || ''

  const info        = STATUS_INFO[job.status] ?? { label: job.status, step: 1, color: '#6b7280', message: '' }
  const moduleNames = job.modules.map(m => m.moduleType.name).join(' · ')
  const vehicleInfo = [job.vehicleBrand, job.vehicleModel, job.vehicleYear].filter(Boolean).join(' ')
  const entryDate   = new Date(job.entryDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'Arial, sans-serif' }}>

      {/* Header */}
      <div style={{ background: '#111c2e', borderBottom: '3px solid #00e5ff', padding: '16px 20px' }}>
        <p style={{ color: '#00e5ff', fontWeight: 900, fontSize: 20, letterSpacing: 2, textTransform: 'uppercase', margin: 0 }}>
          {tallerNombre}
        </p>
        <p style={{ color: '#7a9aaa', fontSize: 12, margin: '2px 0 0' }}>{tallerSubtitulo}</p>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 16px' }}>

        {/* Orden info */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              {job.orderNumber && (
                <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 2px', fontFamily: 'monospace' }}>
                  Orden #{job.orderNumber}
                </p>
              )}
              <p style={{ fontSize: 18, fontWeight: 700, color: '#111', margin: 0 }}>{moduleNames || 'Módulo'}</p>
              {vehicleInfo && (
                <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>🚗 {vehicleInfo}</p>
              )}
            </div>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, textAlign: 'right' }}>
              Ingresado<br />{entryDate}
            </p>
          </div>

          {/* Status badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: info.color + '18', border: `1.5px solid ${info.color}`, borderRadius: 20, padding: '5px 14px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: info.color, display: 'inline-block' }} />
            <span style={{ color: info.color, fontWeight: 700, fontSize: 14 }}>{info.label}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <p style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 16px', fontWeight: 600 }}>
            Progreso del trabajo
          </p>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {STEPS.map((step, i) => {
              const stepNum    = i + 1
              const isActive   = stepNum === info.step
              const isComplete = stepNum < info.step
              const color      = isComplete || isActive ? '#00e5ff' : '#e5e7eb'
              const textColor  = isActive ? '#111c2e' : isComplete ? '#00e5ff' : '#9ca3af'
              return (
                <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  {/* Line before (except first) */}
                  {i > 0 && (
                    <div style={{
                      position: 'absolute', top: 14, right: '50%', left: '-50%',
                      height: 3, background: isComplete || isActive ? '#00e5ff' : '#e5e7eb', zIndex: 0,
                    }} />
                  )}
                  {/* Circle */}
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isActive ? '#00e5ff' : isComplete ? '#00e5ff22' : '#f3f4f6',
                    border: `2.5px solid ${color}`, zIndex: 1, position: 'relative', fontSize: 12, fontWeight: 700,
                    color: isActive ? '#000' : isComplete ? '#00e5ff' : '#9ca3af',
                  }}>
                    {isComplete ? '✓' : stepNum}
                  </div>
                  <p style={{ fontSize: 10, color: textColor, margin: '6px 0 0', textAlign: 'center', fontWeight: isActive ? 700 : 400 }}>
                    {step}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Message */}
        {info.message && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderLeft: `4px solid ${info.color}` }}>
            <p style={{ color: '#374151', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{info.message}</p>
          </div>
        )}

        {/* Refresh + contact */}
        <div style={{ textAlign: 'center', paddingTop: 8 }}>
          <a
            href={`/estado/${token}`}
            style={{ display: 'inline-block', background: '#111c2e', color: '#00e5ff', padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none', marginBottom: 16 }}
          >
            ↻ Actualizar estado
          </a>
          {tallerTelefono && (
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
              Consultas: <a href={`tel:${tallerTelefono}`} style={{ color: '#6b7280' }}>{tallerTelefono}</a>
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '20px 16px', borderTop: '1px solid #e5e7eb', marginTop: 16 }}>
        <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
          {tallerNombre} · {tallerSubtitulo}
        </p>
      </div>
    </div>
  )
}
