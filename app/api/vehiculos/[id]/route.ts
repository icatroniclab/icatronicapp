import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      client: true,
      workOrders: {
        orderBy: { createdAt: 'desc' },
        include: {
          tracking: {
            include: { dtcCodes: true, partsUsed: { include: { product: true } } },
          },
        },
      },
    },
  })
  if (!vehicle) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(vehicle)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const vehicle = await prisma.vehicle.update({ where: { id }, data: body })
  return NextResponse.json(vehicle)
}
