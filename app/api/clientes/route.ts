import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const search = req.nextUrl.searchParams.get('q') || ''
  const type = req.nextUrl.searchParams.get('type') || ''

  const clients = await prisma.client.findMany({
    where: {
      AND: [
        search ? {
          OR: [
            { name: { contains: search } },
            { phone: { contains: search } },
            { email: { contains: search } },
            { dni: { contains: search } },
          ],
        } : {},
        type ? { type } : {},
      ],
    },
    include: {
      vehicles: {
        include: {
          workOrders: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      },
      moduleJobs: {
        orderBy: { createdAt: 'desc' },
        include: { modules: { include: { moduleType: true }, take: 3 } },
      },
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(clients)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const client = await prisma.client.create({
    data: {
      name: body.name,
      phone: body.phone || null,
      email: body.email || null,
      dni: body.dni || null,
      type: body.type || 'CLIENTE',
      discount: body.discount ? parseFloat(body.discount) : null,
      notes: body.notes || null,
    },
  })
  return NextResponse.json(client, { status: 201 })
}
