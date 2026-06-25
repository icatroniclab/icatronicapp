import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function top<T>(map: Map<string, T & { count: number }>, n = 10) {
  return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, n)
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') // format: YYYY-MM

  let dateFilter: { gte: Date; lt: Date } | undefined
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split('-').map(Number)
    const start  = new Date(y, m - 1, 1)
    const end    = new Date(y, m, 1)
    dateFilter   = { gte: start, lt: end }
  }

  const [workOrders, moduleJobs, dtcCodes, appointments, quickJobs] = await Promise.all([
    prisma.workOrder.findMany({
      where: dateFilter ? { entryDate: dateFilter } : undefined,
      select: {
        entryDate: true,
        workStatus: true,
        budget: true,
        amountPaid: true,
        paymentStatus: true,
        vehicle: { select: { brand: true, model: true, year: true, client: { select: { name: true } } } },
        tracking: { select: { dtcCodes: { select: { code: true, description: true } } } },
      },
    }),
    prisma.moduleJob.findMany({
      where: dateFilter ? { entryDate: dateFilter } : undefined,
      select: {
        entryDate: true,
        status: true,
        workType: true,
        budget: true,
        amountPaid: true,
        paymentStatus: true,
        clientType: true,
        client: { select: { name: true } },
        modules: { select: { moduleType: { select: { name: true } } } },
      },
    }),
    // Only fetch global DTC table when no month filter (otherwise we use per-order dtcCodes)
    dateFilter ? Promise.resolve([]) : prisma.dtcCode.findMany({ select: { code: true, description: true } }),
    prisma.appointment.findMany({
      where: dateFilter ? { scheduledAt: dateFilter } : undefined,
      select: { service: true, status: true },
    }),
    prisma.quickJob.findMany({
      where: dateFilter ? { date: dateFilter } : undefined,
      select: { date: true, service: true, price: true, amountPaid: true, paymentStatus: true },
    }),
  ])

  // ── Brands & Models ──────────────────────────────────────────────────
  const brandMap = new Map<string, { brand: string; count: number }>()
  const modelMap = new Map<string, { label: string; count: number }>()
  for (const w of workOrders) {
    const brand = w.vehicle.brand
    const model = `${brand} ${w.vehicle.model}${w.vehicle.year ? ` ${w.vehicle.year}` : ''}`
    brandMap.set(brand, { brand, count: (brandMap.get(brand)?.count ?? 0) + 1 })
    modelMap.set(model, { label: model, count: (modelMap.get(model)?.count ?? 0) + 1 })
  }
  const topBrands = top(brandMap)
  const topModels = top(modelMap)

  // ── Module work types ────────────────────────────────────────────────
  const workTypeMap = new Map<string, number>()
  for (const m of moduleJobs) {
    workTypeMap.set(m.workType, (workTypeMap.get(m.workType) ?? 0) + 1)
  }
  const moduleWorkTypes = Array.from(workTypeMap.entries()).map(([type, count]) => ({ type, count }))

  // ── Module types (what modules are worked on most) ───────────────────
  const moduleTypeMap = new Map<string, { name: string; count: number }>()
  for (const m of moduleJobs) {
    for (const item of m.modules) {
      const name = item.moduleType.name
      moduleTypeMap.set(name, { name, count: (moduleTypeMap.get(name)?.count ?? 0) + 1 })
    }
  }
  const topModuleTypes = top(moduleTypeMap)

  // ── Top clients ──────────────────────────────────────────────────────
  const clientMap = new Map<string, { name: string; vehicleJobs: number; moduleJobs: number }>()
  for (const w of workOrders) {
    const name = w.vehicle.client?.name ?? 'Sin nombre'
    const cur = clientMap.get(name) ?? { name, vehicleJobs: 0, moduleJobs: 0 }
    clientMap.set(name, { ...cur, vehicleJobs: cur.vehicleJobs + 1 })
  }
  for (const m of moduleJobs) {
    const name = m.client?.name ?? 'Sin nombre'
    const cur = clientMap.get(name) ?? { name, vehicleJobs: 0, moduleJobs: 0 }
    clientMap.set(name, { ...cur, moduleJobs: cur.moduleJobs + 1 })
  }
  const topClients = Array.from(clientMap.values())
    .map(c => ({ ...c, total: c.vehicleJobs + c.moduleJobs }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // ── Status breakdown ─────────────────────────────────────────────────
  const woStatusMap = new Map<string, number>()
  for (const w of workOrders) {
    woStatusMap.set(w.workStatus, (woStatusMap.get(w.workStatus) ?? 0) + 1)
  }
  const mjStatusMap = new Map<string, number>()
  for (const m of moduleJobs) {
    mjStatusMap.set(m.status, (mjStatusMap.get(m.status) ?? 0) + 1)
  }
  const woStatuses = Array.from(woStatusMap.entries()).map(([status, count]) => ({ status, count }))
  const mjStatuses = Array.from(mjStatusMap.entries()).map(([status, count]) => ({ status, count }))

  // ── DTC codes ────────────────────────────────────────────────────────
  const allDtc = [
    ...dtcCodes,
    ...workOrders.flatMap(w => w.tracking?.dtcCodes ?? []),
  ]
  const dtcMap = new Map<string, { code: string; description: string; count: number }>()
  for (const d of allDtc) {
    const key = d.code.toUpperCase().trim()
    const cur = dtcMap.get(key) ?? { code: key, description: d.description ?? '', count: 0 }
    dtcMap.set(key, { ...cur, count: cur.count + 1 })
  }
  const topDtcCodes = top(dtcMap)

  // ── Jobs by day of week ──────────────────────────────────────────────
  const dayMap = new Map<number, number>()
  for (let i = 0; i < 7; i++) dayMap.set(i, 0)
  const allDates = [
    ...workOrders.map(w => new Date(w.entryDate)),
    ...moduleJobs.map(m => new Date(m.entryDate)),
    ...quickJobs.map(q => new Date(q.date)),
  ]
  for (const d of allDates) {
    const day = d.getDay()
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1)
  }
  const jobsByDay = Array.from(dayMap.entries())
    .map(([day, count]) => ({ day: DAYS[day], count }))

  // ── Average ticket by type ───────────────────────────────────────────
  const vehiculoTickets = workOrders.filter(w => w.budget != null).map(w => w.budget!)
  const moduloTickets   = moduleJobs.filter(m => m.budget != null).map(m => m.budget!)
  const rapidoTickets   = quickJobs.map(q => q.price)
  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

  const ticketPorTipo: Record<string, number> = {
    Vehículo: avg(vehiculoTickets),
    Módulo: avg(moduloTickets),
    Rápido: avg(rapidoTickets),
  }
  const moduleTicketByType: Record<string, number> = {}
  const moduleTicketCounts: Record<string, number[]> = {}
  for (const m of moduleJobs) {
    if (m.budget == null) continue
    moduleTicketCounts[m.workType] ??= []
    moduleTicketCounts[m.workType].push(m.budget)
  }
  for (const [type, vals] of Object.entries(moduleTicketCounts)) {
    moduleTicketByType[type] = avg(vals)
  }

  // ── Payment status distribution ──────────────────────────────────────
  const payMap = new Map<string, number>()
  for (const w of [...workOrders, ...moduleJobs]) {
    payMap.set(w.paymentStatus, (payMap.get(w.paymentStatus) ?? 0) + 1)
  }
  for (const q of quickJobs) {
    payMap.set(q.paymentStatus, (payMap.get(q.paymentStatus) ?? 0) + 1)
  }
  const paymentStatuses = Array.from(payMap.entries()).map(([status, count]) => ({ status, count }))

  // ── Quick job services breakdown ────────────────────────────────────
  const quickSvcMap = new Map<string, number>()
  for (const q of quickJobs) {
    quickSvcMap.set(q.service, (quickSvcMap.get(q.service) ?? 0) + 1)
  }
  const quickJobServices = Array.from(quickSvcMap.entries())
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count)

  // ── Appointment services ─────────────────────────────────────────────
  const svcMap = new Map<string, number>()
  for (const a of appointments) {
    if (a.status === 'CANCELADO') continue
    svcMap.set(a.service, (svcMap.get(a.service) ?? 0) + 1)
  }
  const appointmentServices = Array.from(svcMap.entries())
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // ── Averages ─────────────────────────────────────────────────────────
  const totalJobs    = workOrders.length + moduleJobs.length + quickJobs.length
  const datesAll     = allDates.map(d => d.getTime())
  let avgPerDay      = 0
  if (datesAll.length > 1) {
    const spanDays = (Math.max(...datesAll) - Math.min(...datesAll)) / 86400000 || 1
    avgPerDay = totalJobs / spanDays
  }

  return NextResponse.json({
    topBrands,
    topModels,
    moduleWorkTypes,
    topModuleTypes,
    topClients,
    woStatuses,
    mjStatuses,
    topDtcCodes,
    jobsByDay,
    ticketPorTipo,
    moduleTicketByType,
    paymentStatuses,
    appointmentServices,
    quickJobServices,
    totals: {
      vehicleJobs: workOrders.length,
      moduleJobs: moduleJobs.length,
      quickJobs: quickJobs.length,
      total: totalJobs,
      avgPerDay: Math.round(avgPerDay * 10) / 10,
    },
  })
}
