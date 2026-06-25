import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const search = req.nextUrl.searchParams.get('q') || ''
  const vehicles = await prisma.vehicle.findMany({
    where: search ? {
      OR: [
        { plate: { contains: search } },
        { brand: { contains: search } },
        { model: { contains: search } },
        { client: { name: { contains: search } } },
      ],
    } : undefined,
    include: {
      client: true,
      workOrders: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json(vehicles)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { client, vehicle, workOrder } = body

  const result = await prisma.$transaction(async (tx) => {
    // Buscar o crear cliente
    let clientRecord = client.id
      ? await tx.client.findUnique({ where: { id: client.id } })
      : null

    if (!clientRecord) {
      clientRecord = await tx.client.create({
        data: {
          name: client.name,
          phone: client.phone || null,
          email: client.email || null,
          dni: client.dni || null,
        },
      })
    }

    // Buscar o crear vehículo
    let vehicleRecord = await tx.vehicle.findUnique({ where: { plate: vehicle.plate.toUpperCase() } })
    if (!vehicleRecord) {
      vehicleRecord = await tx.vehicle.create({
        data: {
          plate: vehicle.plate.toUpperCase(),
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year ? parseInt(vehicle.year) : null,
          km: vehicle.km ? parseInt(vehicle.km) : null,
          color: vehicle.color || null,
          engineType: vehicle.engineType || null,
          displacement: vehicle.displacement || null,
          engineCode: vehicle.engineCode || null,
          clientId: clientRecord.id,
        },
      })
    } else {
      vehicleRecord = await tx.vehicle.update({
        where: { id: vehicleRecord.id },
        data: { km: vehicle.km ? parseInt(vehicle.km) : undefined },
      })
    }

    // Determinar próximo número de orden
    const maxOrden = await tx.workOrder.aggregate({ _max: { orderNumber: true } })
    const maxModulo = await tx.moduleJob.aggregate({ _max: { orderNumber: true } })
    const nextNumber = Math.max(maxOrden._max.orderNumber ?? 999, maxModulo._max.orderNumber ?? 999) + 1

    // Crear orden de trabajo
    const wo = await tx.workOrder.create({
      data: {
        orderNumber: nextNumber < 1000 ? 1000 : nextNumber,
        vehicleId: vehicleRecord.id,
        motive: workOrder.motive,
        entryDate: workOrder.entryDate ? new Date(workOrder.entryDate) : new Date(),
        checkEngine: workOrder.checkEngine || false,
        abs: workOrder.abs || false,
        airbag: workOrder.airbag || false,
        battery: workOrder.battery || false,
        oil: workOrder.oil || false,
        temperature: workOrder.temperature || false,
        brakes: workOrder.brakes || false,
        stability: workOrder.stability || false,
        steering: workOrder.steering || false,
        tpms: workOrder.tpms || false,
        fuel: workOrder.fuel || false,
        esp: workOrder.esp || false,
        damageZones: workOrder.damageZones ? JSON.stringify(workOrder.damageZones) : null,
        missingItems: workOrder.missingItems || null,
        valuables: workOrder.valuables || null,
        photos: workOrder.photos ? JSON.stringify(workOrder.photos) : null,
        budget: workOrder.budget ? parseFloat(workOrder.budget) : null,
        paymentStatus: workOrder.paymentStatus || 'PENDIENTE',
        workStatus: 'INGRESADO',
        notes: workOrder.notes || null,
      },
      include: { vehicle: { include: { client: true } } },
    })

    return wo
  })

  return NextResponse.json(result, { status: 201 })
}
