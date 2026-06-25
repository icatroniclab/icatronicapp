import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const status = req.nextUrl.searchParams.get('status') || ''
  const appointments = await prisma.appointment.findMany({
    where: status ? { status } : undefined,
    orderBy: { scheduledAt: 'asc' },
  })
  return NextResponse.json(appointments)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const appointment = await prisma.appointment.create({
    data: {
      clientName: body.clientName,
      phone: body.phone || null,
      scheduledAt: new Date(body.scheduledAt),
      service: body.service,
      status: body.status || 'PENDIENTE',
      notes: body.notes || null,
    },
  })
  return NextResponse.json(appointment, { status: 201 })
}
