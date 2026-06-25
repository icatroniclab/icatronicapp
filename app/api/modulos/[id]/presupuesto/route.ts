import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

async function recalcBudget(moduleJobId: string) {
  const all = await prisma.moduleBudgetItem.findMany({ where: { moduleJobId } })
  const total = all.reduce((s, i) => s + i.price * i.quantity, 0)
  await prisma.moduleJob.update({ where: { id: moduleJobId }, data: { budget: total } })
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const items = await prisma.moduleBudgetItem.findMany({
    where: { moduleJobId: id },
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
      let cost = parseFloat(body.cost) || 0
      let price = parseFloat(body.price) || 0

      if (body.productId) {
        const product = await tx.product.findUnique({ where: { id: body.productId } })
        if (!product) throw new Error('Producto no encontrado')
        if (product.quantity < qty) throw new Error(`Stock insuficiente (disponible: ${product.quantity})`)
        await tx.product.update({ where: { id: body.productId }, data: { quantity: { decrement: qty } } })
        if (!cost) cost = product.costPrice
        if (!price) price = product.unitPrice
      }

      const budgetItem = await tx.moduleBudgetItem.create({
        data: {
          moduleJobId: id,
          productId: body.productId || null,
          type: body.type || 'OTRO',
          description: body.description,
          quantity: qty,
          cost,
          price,
        },
        include: { product: { select: { id: true, name: true, quantity: true } } },
      })

      if (body.boughtAtStore && cost > 0) {
        const job = await tx.moduleJob.findUnique({ where: { id }, include: { moduleType: true } })
        await tx.expense.create({
          data: {
            category: 'Repuestos',
            amount: cost * qty,
            date: new Date(),
            description: `${body.description} — Módulo ${job?.moduleType?.name ?? id}`,
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

  const item = await prisma.moduleBudgetItem.findUnique({ where: { id: itemId } })
  if (!item) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    if (item.productId) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { increment: item.quantity } },
      })
    }
    await tx.moduleBudgetItem.delete({ where: { id: itemId } })
  })

  await recalcBudget(id)
  return NextResponse.json({ ok: true })
}
