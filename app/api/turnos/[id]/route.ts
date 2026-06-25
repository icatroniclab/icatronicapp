import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const appointment = await prisma.appointment.update({
    where: { id },
    data: {
      clientName: body.clientName,
      phone: body.phone ?? null,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      service: body.service,
      status: body.status,
      notes: body.notes ?? null,
    },
  })
  return NextResponse.json(appointment)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.appointment.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
