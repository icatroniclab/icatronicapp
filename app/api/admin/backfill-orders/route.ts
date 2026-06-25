import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Órdenes de trabajo sin número, ordenadas por fecha de creación
  const ordenes = await prisma.workOrder.findMany({
    where: { orderNumber: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })

  // Módulos sin número, ordenados por fecha de creación
  const modulos = await prisma.moduleJob.findMany({
    where: { orderNumber: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })

  // Determinar el próximo número libre (considerando ambos modelos)
  const maxOrden = await prisma.workOrder.aggregate({ _max: { orderNumber: true } })
  const maxModulo = await prisma.moduleJob.aggregate({ _max: { orderNumber: true } })
  let next = Math.max(maxOrden._max.orderNumber ?? 999, maxModulo._max.orderNumber ?? 999) + 1
  if (next < 1000) next = 1000

  // Asignar números a órdenes de trabajo
  for (const o of ordenes) {
    await prisma.workOrder.update({ where: { id: o.id }, data: { orderNumber: next++ } })
  }

  // Asignar números a módulos
  for (const m of modulos) {
    await prisma.moduleJob.update({ where: { id: m.id }, data: { orderNumber: next++ } })
  }

  return NextResponse.json({
    ok: true,
    assigned: ordenes.length + modulos.length,
    ordenes: ordenes.length,
    modulos: modulos.length,
  })
}
