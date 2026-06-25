import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  if (!body.name?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })

  try {
    const type = await prisma.moduleType.update({
      where: { id },
      data: { name: body.name.trim(), description: body.description?.trim() || null },
    })
    return NextResponse.json(type)
  } catch {
    return NextResponse.json({ error: 'Ya existe un tipo con ese nombre' }, { status: 409 })
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  try {
    await prisma.moduleType.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'No se puede eliminar: tiene trabajos asociados' }, { status: 409 })
  }
}
