import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const month = req.nextUrl.searchParams.get('month') // YYYY-MM
  let dateFilter = {}
  if (month) {
    const [y, m] = month.split('-').map(Number)
    const start = new Date(y, m - 1, 1)
    const end   = new Date(y, m, 0, 23, 59, 59)
    dateFilter = { gte: start, lte: end }
  }

  const [
    ingresosOrdenes, ingresosMod, ingresosQuick,
    gastos,
    pendientesOrdenes, pendientesMod, pendientesQuick,
  ] = await Promise.all([
    // Ingresos órdenes de trabajo
    prisma.workOrder.findMany({
      where: { paymentStatus: { in: ['PAGADO', 'PARCIAL', 'SENA'] }, entryDate: month ? dateFilter : undefined },
      include: { vehicle: { include: { client: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
    // Ingresos módulos
    prisma.moduleJob.findMany({
      where: { paymentStatus: { in: ['PAGADO', 'PARCIAL', 'SENA'] }, entryDate: month ? dateFilter : undefined },
      include: { modules: { include: { moduleType: true }, orderBy: { createdAt: 'asc' } }, client: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
    // Ingresos trabajos rápidos
    prisma.quickJob.findMany({
      where: { paymentStatus: { in: ['PAGADO', 'PARCIAL', 'SENA'] }, ...(month && { date: dateFilter }) },
      orderBy: { date: 'desc' },
    }),
    // Gastos
    prisma.expense.findMany({
      where: month ? { date: dateFilter } : undefined,
      orderBy: { date: 'desc' },
    }),
    // Pendientes órdenes
    prisma.workOrder.findMany({
      where: {
        OR: [
          { paymentStatus: { in: ['SENA', 'PARCIAL'] } },
          { workStatus: { in: ['LISTO', 'ENTREGADO'] }, paymentStatus: 'PENDIENTE', budget: { gt: 0 } },
        ],
      },
      include: { vehicle: { include: { client: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
    // Pendientes módulos
    prisma.moduleJob.findMany({
      where: {
        OR: [
          { paymentStatus: { in: ['SENA', 'PARCIAL'] } },
          { status: { in: ['LISTO', 'ENTREGADO'] }, paymentStatus: 'PENDIENTE', budget: { gt: 0 } },
        ],
      },
      include: { modules: { include: { moduleType: true }, orderBy: { createdAt: 'asc' } }, client: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
    }),
    // Pendientes trabajos rápidos
    prisma.quickJob.findMany({
      where: {
        OR: [
          { paymentStatus: { in: ['SENA', 'PARCIAL'] } },
          { paymentStatus: 'PENDIENTE', price: { gt: 0 } },
        ],
      },
      orderBy: { date: 'desc' },
    }),
  ])

  // Normalizar con campo source — quick jobs mapean price → budget para que el frontend use el mismo campo
  const ingresos = [
    ...ingresosOrdenes.map(w => ({ ...w, source: 'trabajo' as const })),
    ...ingresosMod.map(m => ({ ...m, source: 'modulo' as const })),
    ...ingresosQuick.map(q => ({ ...q, source: 'rapido' as const, budget: q.price })),
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  const pendientes = [
    ...pendientesOrdenes.map(w => ({ ...w, source: 'trabajo' as const })),
    ...pendientesMod.map(m => ({ ...m, source: 'modulo' as const })),
    ...pendientesQuick.map(q => ({ ...q, source: 'rapido' as const, budget: q.price })),
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  const totalIngresos =
    ingresosOrdenes.reduce((s, w) => s + (w.paymentStatus === 'PAGADO' ? (w.budget ?? 0) : (w.amountPaid ?? 0)), 0) +
    ingresosMod.reduce((s, m)     => s + (m.paymentStatus === 'PAGADO' ? (m.budget ?? 0) : (m.amountPaid ?? 0)), 0) +
    ingresosQuick.reduce((s, q)   => s + (q.paymentStatus === 'PAGADO' ? q.price : q.amountPaid), 0)

  const totalGastos    = gastos.reduce((s, g) => s + g.amount, 0)
  const totalPendiente =
    pendientesOrdenes.reduce((s, w) => s + Math.max(0, (w.budget ?? 0) - (w.amountPaid ?? 0)), 0) +
    pendientesMod.reduce((s, m)     => s + Math.max(0, (m.budget ?? 0) - (m.amountPaid ?? 0)), 0) +
    pendientesQuick.reduce((s, q)   => s + Math.max(0, q.price - q.amountPaid), 0)

  return NextResponse.json({
    ingresos,
    gastos,
    pendientes,
    totalIngresos,
    totalGastos,
    totalPendiente,
    neto: totalIngresos - totalGastos,
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const expense = await prisma.expense.create({
    data: {
      category: body.category,
      amount: parseFloat(body.amount),
      date: new Date(body.date),
      description: body.description || null,
    },
  })
  return NextResponse.json(expense, { status: 201 })
}
