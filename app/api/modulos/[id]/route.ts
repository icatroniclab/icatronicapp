import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const job = await prisma.moduleJob.findUnique({
    where: { id },
    include: {
      modules: { include: { moduleType: true }, orderBy: { createdAt: 'asc' } },
      client: { select: { id: true, name: true, type: true, discount: true, phone: true } },
      budgetItems: { include: { product: { select: { id: true, name: true, quantity: true } } }, orderBy: { createdAt: 'asc' } },
    },
  })
  if (!job) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(job)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const job = await prisma.moduleJob.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.workType !== undefined && { workType: body.workType }),
      ...(body.paymentStatus !== undefined && { paymentStatus: body.paymentStatus }),
      ...(body.budget !== undefined && { budget: body.budget !== null ? parseFloat(body.budget) : null }),
      ...(body.amountPaid !== undefined && { amountPaid: parseFloat(body.amountPaid) }),
      ...(body.motive !== undefined && { motive: body.motive }),
      ...(body.findings !== undefined && { findings: body.findings }),
      ...(body.workDone !== undefined && { workDone: body.workDone }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.vehicleBrand !== undefined && { vehicleBrand: body.vehicleBrand }),
      ...(body.vehicleModel !== undefined && { vehicleModel: body.vehicleModel }),
      ...(body.vehicleYear !== undefined && { vehicleYear: body.vehicleYear ? parseInt(body.vehicleYear) : null }),
      ...(body.clientType !== undefined && { clientType: body.clientType }),
      ...(body.techName !== undefined && { techName: body.techName }),
      ...(body.techPhone !== undefined && { techPhone: body.techPhone }),
      ...(body.clientId !== undefined && { clientId: body.clientId || null }),
    },
    include: {
      modules: { include: { moduleType: true } },
      client: { select: { id: true, name: true, type: true, discount: true } },
    },
  })
  return NextResponse.json(job)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.moduleJob.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
