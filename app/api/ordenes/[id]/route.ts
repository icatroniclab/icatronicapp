import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const order = await prisma.workOrder.update({
    where: { id },
    data: {
      workStatus: body.workStatus,
      paymentStatus: body.paymentStatus,
      budget: body.budget !== undefined ? parseFloat(body.budget) : undefined,
      amountPaid: body.amountPaid !== undefined ? parseFloat(body.amountPaid) : undefined,
      notes: body.notes,
      ...(body.entryDate !== undefined && { entryDate: new Date(body.entryDate) }),
      ...(body.motive !== undefined && { motive: body.motive }),
      ...(body.missingItems !== undefined && { missingItems: body.missingItems }),
      ...(body.valuables !== undefined && { valuables: body.valuables }),
      ...(body.damageZones !== undefined && { damageZones: JSON.stringify(body.damageZones) }),
      ...(body.checkEngine !== undefined && { checkEngine: body.checkEngine }),
      ...(body.abs !== undefined && { abs: body.abs }),
      ...(body.airbag !== undefined && { airbag: body.airbag }),
      ...(body.battery !== undefined && { battery: body.battery }),
      ...(body.oil !== undefined && { oil: body.oil }),
      ...(body.temperature !== undefined && { temperature: body.temperature }),
      ...(body.brakes !== undefined && { brakes: body.brakes }),
      ...(body.stability !== undefined && { stability: body.stability }),
      ...(body.steering !== undefined && { steering: body.steering }),
      ...(body.tpms !== undefined && { tpms: body.tpms }),
      ...(body.fuel !== undefined && { fuel: body.fuel }),
      ...(body.esp !== undefined && { esp: body.esp }),
      ...(body.reports !== undefined && { reports: JSON.stringify(body.reports) }),
      ...(body.csvLogs !== undefined && { csvLogs: JSON.stringify(body.csvLogs) }),
    },
    include: { vehicle: { include: { client: true } } },
  })
  return NextResponse.json(order)
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const order = await prisma.workOrder.findUnique({
    where: { id },
    include: {
      vehicle: { include: { client: true } },
      tracking: { include: { dtcCodes: true, partsUsed: { include: { product: true } } } },
    },
  })
  if (!order) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(order)
}
