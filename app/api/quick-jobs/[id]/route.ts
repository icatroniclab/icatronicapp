import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const job = await prisma.quickJob.update({
    where: { id },
    data: {
      ...(body.service !== undefined      && { service: body.service }),
      ...(body.description !== undefined  && { description: body.description }),
      ...(body.clientName !== undefined   && { clientName: body.clientName }),
      ...(body.price !== undefined        && { price: Number(body.price) }),
      ...(body.paymentStatus !== undefined && { paymentStatus: body.paymentStatus }),
      ...(body.amountPaid !== undefined   && { amountPaid: Number(body.amountPaid) }),
      ...(body.notes !== undefined        && { notes: body.notes }),
    },
  })

  return NextResponse.json(job)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.quickJob.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
