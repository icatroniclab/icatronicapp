import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const workType = searchParams.get('workType')

  const jobs = await prisma.moduleJob.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(workType ? { workType } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      modules: { include: { moduleType: true }, orderBy: { createdAt: 'asc' } },
      client: { select: { id: true, name: true, type: true } },
    },
  })
  return NextResponse.json(jobs)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()

  if (!body.modules || body.modules.length === 0) {
    return NextResponse.json({ error: 'Debe agregar al menos un módulo' }, { status: 400 })
  }

  const maxOrden = await prisma.workOrder.aggregate({ _max: { orderNumber: true } })
  const maxModulo = await prisma.moduleJob.aggregate({ _max: { orderNumber: true } })
  const nextNumber = Math.max(maxOrden._max.orderNumber ?? 999, maxModulo._max.orderNumber ?? 999) + 1

  const job = await prisma.moduleJob.create({
    data: {
      orderNumber: nextNumber < 1000 ? 1000 : nextNumber,
      clientId: body.clientId || null,
      techName: body.techName || null,
      techPhone: body.techPhone || null,
      clientType: body.clientType || 'TALLERISTA',
      vehicleBrand: body.vehicleBrand || null,
      vehicleModel: body.vehicleModel || null,
      vehicleYear: body.vehicleYear ? parseInt(body.vehicleYear) : null,
      motive: body.motive,
      workType: body.workType || 'DIAGNOSTICO',
      notes: body.notes || null,
      modules: {
        create: body.modules.map((m: any) => ({
          moduleTypeId: m.moduleTypeId,
          moduleBrand: m.moduleBrand || null,
          partNumber: m.partNumber || null,
          serialNumber: m.serialNumber || null,
          notes: m.notes || null,
        })),
      },
    },
    include: {
      modules: { include: { moduleType: true } },
      client: true,
    },
  })
  return NextResponse.json(job, { status: 201 })
}
