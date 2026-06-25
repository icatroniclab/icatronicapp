import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const doc = await prisma.techDoc.update({
    where: { id },
    data: {
      name: body.name,
      category: body.category,
      vehicleModel: body.vehicleModel || null,
      description: body.description ?? null,
    },
  })
  return NextResponse.json(doc)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.techDoc.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
