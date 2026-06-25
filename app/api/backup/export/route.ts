import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
  }

  const [vehicles, clients, workOrders, workTrackings, dtcCodes, partsUsed, products, expenses, casos] = await Promise.all([
    prisma.vehicle.findMany({ include: { client: true } }),
    prisma.client.findMany(),
    prisma.workOrder.findMany(),
    prisma.workTracking.findMany(),
    prisma.dtcCode.findMany(),
    prisma.partUsed.findMany(),
    prisma.product.findMany(),
    prisma.expense.findMany(),
    prisma.diagnosticCase.findMany(),
  ])

  const backup = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    vehiculos: vehicles,
    clientes: clients,
    ordenes: workOrders,
    seguimientos: workTrackings,
    dtcCodes,
    repuestosUsados: partsUsed,
    stock: products,
    gastos: expenses,
    casos,
  }

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="icatronic-backup-${new Date().toISOString().split('T')[0]}.json"`,
    },
  })
}
