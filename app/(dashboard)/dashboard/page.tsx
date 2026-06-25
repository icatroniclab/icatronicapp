import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { Car, Wrench, DollarSign, AlertTriangle, CalendarDays, Bell } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { WorkStatusBadge, Badge } from '@/components/ui/Badge'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function DashboardPage() {
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(todayStart.getDate() + 1)
  const tomorrowEnd = new Date(tomorrowStart); tomorrowEnd.setDate(tomorrowStart.getDate() + 1)

  const [
    totalVehiculos,
    trabajosActivos,
    ingresosMes,
    stockBajo,
    trabajosRecientes,
    turnosHoyManana,
  ] = await Promise.all([
    prisma.vehicle.count(),
    prisma.workOrder.count({ where: { workStatus: { in: ['INGRESADO', 'EN_PROCESO'] } } }),
    prisma.workOrder.aggregate({
      where: { paymentStatus: 'PAGADO', createdAt: { gte: firstOfMonth } },
      _sum: { budget: true },
    }),
    prisma.product.count({ where: { quantity: { lte: prisma.product.fields.minStock } } }),
    prisma.workOrder.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { vehicle: { include: { client: true } } },
    }),
    prisma.appointment.findMany({
      where: {
        scheduledAt: { gte: todayStart, lt: tomorrowEnd },
        status: { notIn: ['CANCELADO', 'COMPLETADO'] },
      },
      orderBy: { scheduledAt: 'asc' },
    }),
  ])

  const gastosMes = await prisma.expense.aggregate({
    where: { date: { gte: firstOfMonth } },
    _sum: { amount: true },
  })

  const stockAlerts = await prisma.product.findMany({
    where: { quantity: { lte: prisma.product.fields.minStock } },
    take: 5,
  })

  const ingresos = ingresosMes._sum.budget ?? 0
  const gastos = gastosMes._sum.amount ?? 0
  const neto = ingresos - gastos

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: '#7a9aaa' }}>
          {format(now, "EEEE d 'de' MMMM yyyy", { locale: es })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Car className="text-blue-400" size={22} />} label="Vehículos" value={totalVehiculos} />
        <StatCard icon={<Wrench className="text-yellow-400" size={22} />} label="En taller" value={trabajosActivos} />
        <StatCard icon={<DollarSign className="text-emerald-400" size={22} />} label={`Ingresos ${now.toLocaleString('es-AR', { month: 'long' })}`} value={formatCurrency(ingresos)} small />
        <StatCard icon={<DollarSign className={neto >= 0 ? 'text-emerald-400' : 'text-red-400'} size={22} />} label="Neto del mes" value={formatCurrency(neto)} small accent={neto >= 0 ? 'green' : 'red'} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Trabajos recientes */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">Trabajos recientes</h2>
              <Link href="/vehiculos" className="text-[#00e5ff] hover:text-[#00b8cc] text-sm">Ver todos →</Link>
            </div>
            <div className="space-y-2">
              {trabajosRecientes.map(wo => (
                <Link
                  key={wo.id}
                  href={`/vehiculos/${wo.vehicleId}`}
                  className="flex items-center justify-between p-3 rounded-[2px] hover:bg-[rgba(0,229,255,0.05)] transition"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {wo.vehicle.plate} — {wo.vehicle.brand} {wo.vehicle.model}
                    </p>
                    <p className="text-xs text-[#7a9aaa]">{wo.vehicle.client.name} · {wo.motive.substring(0, 50)}</p>
                  </div>
                  <WorkStatusBadge status={wo.workStatus} />
                </Link>
              ))}
              {trabajosRecientes.length === 0 && (
                <p className="text-[#4a6070] text-sm text-center py-4">Sin trabajos aún</p>
              )}
            </div>
          </Card>
        </div>

        {/* Turnos hoy/mañana + Alertas stock */}
        <div>
          {/* Widget turnos del día */}
          <Card className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell size={15} style={{ color: '#00e5ff' }} />
                <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: '#00e5ff', fontFamily: 'Rajdhani, sans-serif' }}>
                  Turnos hoy y mañana
                </h2>
              </div>
              <Link href="/turnos" className="text-xs" style={{ color: '#7a9aaa' }}>Ver todos →</Link>
            </div>
            {turnosHoyManana.length === 0 ? (
              <p className="text-xs" style={{ color: '#4a6070' }}>Sin turnos para hoy ni mañana.</p>
            ) : (
              <div className="space-y-1.5">
                {turnosHoyManana.map(t => {
                  const isToday = t.scheduledAt >= todayStart && t.scheduledAt < tomorrowStart
                  const time = t.scheduledAt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                  return (
                    <div key={t.id} className="flex items-center gap-2 px-2 py-1.5 rounded-[2px]" style={{ background: 'rgba(0,229,255,0.04)' }}>
                      <span className="text-xs font-bold tabular-nums flex-shrink-0" style={{ color: '#00e5ff', minWidth: '3rem' }}>{time}</span>
                      <span className="text-xs text-white font-medium truncate">{t.clientName}</span>
                      <span className="text-xs truncate flex-1" style={{ color: '#7a9aaa' }}>· {t.service}</span>
                      <Badge variant={isToday ? 'info' : 'outline'} className="flex-shrink-0 text-[0.6rem]">
                        {isToday ? 'HOY' : 'MAÑ'}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-yellow-400" />
              <h2 className="font-semibold text-white">Stock bajo</h2>
            </div>
            {stockAlerts.length === 0 ? (
              <p className="text-[#4a6070] text-sm">Todo en orden</p>
            ) : (
              <div className="space-y-2">
                {stockAlerts.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-yellow-900/20 border border-yellow-800/40">
                    <p className="text-sm text-yellow-300">{p.name}</p>
                    <span className="text-xs text-yellow-400 font-bold">{p.quantity} u.</span>
                  </div>
                ))}
                <Link href="/stock" className="text-[#00e5ff] hover:text-[#00b8cc] text-xs block mt-2">
                  Ver inventario →
                </Link>
              </div>
            )}
          </Card>

          <Card className="mt-4">
            <h2 className="font-semibold text-white mb-3">Resumen del mes</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-300">
                <span>Ingresos</span>
                <span className="text-emerald-400 font-medium">{formatCurrency(ingresos)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Gastos</span>
                <span className="text-red-400 font-medium">−{formatCurrency(gastos)}</span>
              </div>
              <div className="flex justify-between text-white font-semibold border-t border-[rgba(0,229,255,0.1)] pt-2">
                <span>Neto</span>
                <span className={neto >= 0 ? 'text-emerald-400' : 'text-red-400'}>{formatCurrency(neto)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, small, accent }: {
  icon: React.ReactNode; label: string; value: string | number; small?: boolean; accent?: 'green' | 'red'
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[#7a9aaa] text-xs mb-1">{label}</p>
          <p className={`font-bold text-white ${small ? 'text-lg' : 'text-2xl'}`}>{value}</p>
        </div>
        <div className="p-2 bg-[rgba(0,229,255,0.08)] rounded-[2px]">{icon}</div>
      </div>
    </Card>
  )
}
