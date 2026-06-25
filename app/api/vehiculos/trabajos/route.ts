import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const sp = req.nextUrl.searchParams
  const search = sp.get('search') || ''
  const paymentStatus = sp.get('paymentStatus') || ''
  const workStatus = sp.get('workStatus') || ''
  const from = sp.get('from') || ''
  const to = sp.get('to') || ''
  const page = Math.max(1, parseInt(sp.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') || '20')))
  const active = sp.get('active') === 'true'

  const where: any = {}

  if (active) {
    where.workStatus = { in: ['INGRESADO', 'EN_PROCESO', 'LISTO'] }
  } else {
    if (paymentStatus) where.paymentStatus = paymentStatus
    if (workStatus) where.workStatus = workStatus
  }

  if (from || to) {
    where.createdAt = {}
    if (from) where.createdAt.gte = new Date(from)
    if (to) {
      const toDate = new Date(to)
      toDate.setHours(23, 59, 59, 999)
      where.createdAt.lte = toDate
    }
  }

  if (search) {
    where.OR = [
      { vehicle: { plate: { contains: search } } },
      { vehicle: { brand: { contains: search } } },
      { vehicle: { model: { contains: search } } },
      { vehicle: { client: { name: { contains: search } } } },
      { motive: { contains: search } },
    ]
  }

  if (active) {
    const orders = await prisma.workOrder.findMany({
      where,
      include: {
        vehicle: { include: { client: true } },
        tracking: { include: { dtcCodes: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ orders, total: orders.length, page: 1, limit: orders.length, totalPages: 1 })
  }

  const [total, orders] = await Promise.all([
    prisma.workOrder.count({ where }),
    prisma.workOrder.findMany({
      where,
      include: { vehicle: { include: { client: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  return NextResponse.json({ orders, total, page, limit, totalPages: Math.ceil(total / limit) })
}
