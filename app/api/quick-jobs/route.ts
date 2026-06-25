import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')   // YYYY-MM-DD
  const month = searchParams.get('month') // YYYY-MM

  let where: Record<string, unknown> = {}
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const start = new Date(date + 'T00:00:00')
    const end   = new Date(date + 'T23:59:59.999')
    where = { date: { gte: start, lte: end } }
  } else if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split('-').map(Number)
    where = { date: { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) } }
  }

  const jobs = await prisma.quickJob.findMany({
    where,
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(jobs)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { service, description, clientName, price, paymentStatus, amountPaid, notes } = body

  if (!service || price == null) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const job = await prisma.quickJob.create({
    data: {
      service,
      description: description || null,
      clientName: clientName || null,
      price: Number(price),
      paymentStatus: paymentStatus || 'PAGADO',
      amountPaid: Number(amountPaid ?? 0),
      notes: notes || null,
    },
  })

  return NextResponse.json(job, { status: 201 })
}
