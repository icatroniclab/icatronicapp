import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      vehicles: {
        include: {
          workOrders: { orderBy: { createdAt: 'desc' }, take: 3 },
        },
        orderBy: { updatedAt: 'desc' },
      },
    },
  })
  if (!client) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(client)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  try {
    const client = await prisma.client.update({
      where: { id },
      data: {
        name: body.name,
        phone: body.phone !== undefined ? body.phone || null : undefined,
        email: body.email !== undefined ? body.email || null : undefined,
        dni: body.dni !== undefined ? body.dni || null : undefined,
        type: body.type,
        discount: body.discount !== undefined ? (body.discount !== '' ? parseFloat(body.discount) : null) : undefined,
        notes: body.notes !== undefined ? body.notes || null : undefined,
      },
    })
    return NextResponse.json(client)
  } catch (e: any) {
    console.error('PATCH /clientes/[id]:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
  }
  const { id } = await params
  try {
    await prisma.client.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'No se puede eliminar: tiene vehículos asociados' }, { status: 400 })
  }
}
