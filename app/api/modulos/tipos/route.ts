import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const types = await prisma.moduleType.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json(types)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  if (!body.name?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })

  try {
    const type = await prisma.moduleType.create({
      data: { name: body.name.trim(), description: body.description?.trim() || null },
    })
    return NextResponse.json(type, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Ya existe un tipo con ese nombre' }, { status: 409 })
  }
}
