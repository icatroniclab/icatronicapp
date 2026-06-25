import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const [workOrders, moduleJobs, quickJobs, expenses] = await Promise.all([
    prisma.workOrder.findMany({
      select: { entryDate: true, budget: true, amountPaid: true, paymentStatus: true, workStatus: true },
    }),
    prisma.moduleJob.findMany({
      select: { entryDate: true, budget: true, amountPaid: true, paymentStatus: true, status: true },
    }),
    prisma.quickJob.findMany({
      select: { date: true, price: true, amountPaid: true, paymentStatus: true },
    }),
    prisma.expense.findMany({
      select: { date: true, amount: true, category: true },
    }),
  ])

  // Aggregate by month key "YYYY-MM"
  const monthMap = new Map<string, { ingresos: number; gastos: number; trabajos: number }>()

  const getOrCreate = (key: string) => {
    if (!monthMap.has(key)) monthMap.set(key, { ingresos: 0, gastos: 0, trabajos: 0 })
    return monthMap.get(key)!
  }

  const addJob = (entryDate: Date | string, budget: number | null, amountPaid: number, paymentStatus: string) => {
    const d = new Date(entryDate)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const m = getOrCreate(key)
    m.trabajos++
    if (paymentStatus === 'PAGADO') m.ingresos += budget ?? 0
    else if (paymentStatus === 'PARCIAL' || paymentStatus === 'SENA') m.ingresos += amountPaid ?? 0
  }

  for (const w of workOrders) addJob(w.entryDate, w.budget, w.amountPaid, w.paymentStatus)
  for (const m of moduleJobs) addJob(m.entryDate, m.budget, m.amountPaid, m.paymentStatus)
  for (const q of quickJobs)  addJob(q.date, q.price, q.amountPaid, q.paymentStatus)

  for (const e of expenses) {
    const d = new Date(e.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const m = getOrCreate(key)
    m.gastos += e.amount
  }

  // Sort months chronologically
  const monthly = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      ...data,
      neto: data.ingresos - data.gastos,
    }))

  // Summary totals
  const totalIngresos = monthly.reduce((s, m) => s + m.ingresos, 0)
  const totalGastos = monthly.reduce((s, m) => s + m.gastos, 0)
  const totalTrabajos = monthly.reduce((s, m) => s + m.trabajos, 0)
  const ticketPromedio = totalTrabajos > 0 ? totalIngresos / totalTrabajos : 0

  const bestMonth = monthly.length > 0
    ? monthly.reduce((best, m) => m.ingresos > best.ingresos ? m : best)
    : null

  // Per-year summary
  const yearMap = new Map<number, { ingresos: number; gastos: number; trabajos: number }>()
  for (const m of monthly) {
    const year = parseInt(m.month.split('-')[0])
    const y = yearMap.get(year) ?? { ingresos: 0, gastos: 0, trabajos: 0 }
    y.ingresos += m.ingresos
    y.gastos += m.gastos
    y.trabajos += m.trabajos
    yearMap.set(year, y)
  }
  const byYear = Array.from(yearMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, data]) => ({ year, ...data, neto: data.ingresos - data.gastos }))

  return NextResponse.json({
    monthly,
    byYear,
    summary: { totalIngresos, totalGastos, totalTrabajos, ticketPromedio, neto: totalIngresos - totalGastos, bestMonth },
  })
}
