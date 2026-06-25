import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const search = req.nextUrl.searchParams.get('q') || ''
  const products = await prisma.product.findMany({
    where: search ? { name: { contains: search } } : undefined,
    include: {
      partsUsed: {
        include: { workTracking: { include: { workOrder: { include: { vehicle: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json(products)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const product = await prisma.product.create({
    data: {
      name: body.name,
      quantity: parseInt(body.quantity) || 0,
      minStock: parseInt(body.minStock) || 0,
      costPrice: parseFloat(body.costPrice) || 0,
      unitPrice: parseFloat(body.unitPrice) || 0,
      photo: body.photo || null,
    },
  })
  return NextResponse.json(product, { status: 201 })
}
