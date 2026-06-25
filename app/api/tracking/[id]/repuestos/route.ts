import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const qty = parseInt(body.quantity) || 1
  try {
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: body.productId } })
      if (!product) throw new Error('Producto no encontrado')
      if (product.quantity < qty) throw new Error('Stock insuficiente')

      await tx.product.update({
        where: { id: body.productId },
        data: { quantity: { decrement: qty } },
      })

      return tx.partUsed.create({
        data: {
          workTrackingId: id,
          productId: body.productId,
          quantity: qty,
          unitPrice: product.unitPrice,
        },
        include: { product: true },
      })
    })
    return NextResponse.json(result, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { partUsedId } = await req.json()
  const part = await prisma.partUsed.findUnique({ where: { id: partUsedId } })
  if (!part) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  await prisma.$transaction([
    prisma.product.update({
      where: { id: part.productId },
      data: { quantity: { increment: part.quantity } },
    }),
    prisma.partUsed.delete({ where: { id: partUsedId } }),
  ])
  return NextResponse.json({ ok: true })
}
