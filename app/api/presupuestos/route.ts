import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const presupuestos = await prisma.presupuesto.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(presupuestos)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const count = await prisma.presupuesto.count()

  const presupuesto = await prisma.presupuesto.create({
    data: {
      number: count + 1,
      brand: body.brand || '',
      model: body.model || '',
      year: body.year || null,
      plate: body.plate || null,
      clientName: body.clientName || null,
      items: typeof body.items === 'string' ? body.items : JSON.stringify(body.items),
      notes: body.notes || null,
      validHours: body.validHours ?? 48,
      date: new Date(body.date),
      total: body.total ?? 0,
    },
  })
  return NextResponse.json(presupuesto)
}
