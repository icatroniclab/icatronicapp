import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const product = await prisma.product.update({
    where: { id },
    data: {
      name: body.name,
      quantity: body.quantity !== undefined ? parseInt(body.quantity) : undefined,
      minStock: body.minStock !== undefined ? parseInt(body.minStock) : undefined,
      costPrice: body.costPrice !== undefined ? parseFloat(body.costPrice) : undefined,
      unitPrice: body.unitPrice !== undefined ? parseFloat(body.unitPrice) : undefined,
      photo: body.photo !== undefined ? body.photo : undefined,
    },
  })
  return NextResponse.json(product)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
  }
  const { id } = await params
  await prisma.product.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
