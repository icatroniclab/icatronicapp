import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
  }
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, createdAt: true } })
  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
  }

  const body = await req.json()
  if (!body.name || !body.email || !body.password) {
    return NextResponse.json({ error: 'Nombre, email y contraseña son requeridos' }, { status: 400 })
  }
  try {
    const hashed = await bcrypt.hash(body.password, 10)
    const user = await prisma.user.create({
      data: { name: body.name, email: body.email, password: hashed, role: body.role || 'OPERARIO' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })
    return NextResponse.json(user, { status: 201 })
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 400 })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
