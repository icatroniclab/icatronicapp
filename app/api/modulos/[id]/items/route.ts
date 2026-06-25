import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const item = await prisma.moduleJobItem.create({
    data: {
      moduleJobId: id,
      moduleTypeId: body.moduleTypeId,
      moduleBrand: body.moduleBrand || null,
      partNumber: body.partNumber || null,
      serialNumber: body.serialNumber || null,
      notes: body.notes || null,
    },
    include: { moduleType: true },
  })
  return NextResponse.json(item, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const { itemId } = await req.json()

  // Verificar que pertenece al job
  const item = await prisma.moduleJobItem.findFirst({ where: { id: itemId, moduleJobId: id } })
  if (!item) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  // No permitir eliminar si es el último módulo
  const count = await prisma.moduleJobItem.count({ where: { moduleJobId: id } })
  if (count <= 1) return NextResponse.json({ error: 'Debe quedar al menos un módulo en el ingreso' }, { status: 400 })

  await prisma.moduleJobItem.delete({ where: { id: itemId } })
  return NextResponse.json({ ok: true })
}
