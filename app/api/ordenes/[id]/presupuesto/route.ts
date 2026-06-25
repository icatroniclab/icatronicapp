import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function recalcBudget(workOrderId: string) {
  const all = await prisma.budgetItem.findMany({ where: { workOrderId } })
  const total = all.reduce((s, i) => s + i.price * i.quantity, 0)
  await prisma.workOrder.update({ where: { id: workOrderId }, data: { budget: total } })
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const items = await prisma.budgetItem.findMany({
    where: { workOrderId: id },
    include: { product: { select: { id: true, name: true, quantity: true } } },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const qty = parseFloat(body.quantity) || 1

  try {
    const item = await prisma.$transaction(async (tx) => {
      // Si tiene producto de stock, descontar
      if (body.productId) {
        const product = await tx.product.findUnique({ where: { id: body.productId } })
        if (!product) throw new Error('Producto no encontrado')
        if (product.quantity < qty) throw new Error(`Stock insuficiente (disponible: ${product.quantity})`)
        await tx.product.update({ where: { id: body.productId }, data: { quantity: { decrement: qty } } })
      }

      // Si viene de stock y no se especificó costo, usar costPrice del producto
      const cost = parseFloat(body.cost) || (body.productId && product ? product.costPrice : 0)
      const price = parseFloat(body.price) || (body.productId && product ? product.unitPrice : 0)

      const budgetItem = await tx.budgetItem.create({
        data: {
          workOrderId: id,
          productId: body.productId || null,
          type: body.type || 'OTRO',
          description: body.description,
          quantity: qty,
          cost,
          price,
        },
        include: { product: { select: { id: true, name: true, quantity: true } } },
      })

      // Si se marcó como comprado en repuestera, registrar gasto
      if (body.boughtAtStore && cost > 0) {
        const workOrder = await tx.workOrder.findUnique({
          where: { id },
          include: { vehicle: true },
        })
        await tx.expense.create({
          data: {
            category: 'Repuestos',
            amount: cost * qty,
            date: new Date(),
            description: `${body.description} — ${workOrder?.vehicle?.plate ?? id}`,
          },
        })
      }

      return budgetItem
    })

    await recalcBudget(id)
    return NextResponse.json(item, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const { itemId } = await req.json()

  const item = await prisma.budgetItem.findUnique({ where: { id: itemId } })
  if (!item) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    // Restaurar stock si tenía producto
    if (item.productId) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { increment: item.quantity } },
      })
    }
    await tx.budgetItem.delete({ where: { id: itemId } })
  })

  await recalcBudget(id)
  return NextResponse.json({ ok: true })
}
