import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const p = await prisma.presupuesto.findUnique({ where: { id } })
  if (!p) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(p)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.presupuesto.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
