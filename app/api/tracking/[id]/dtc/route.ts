import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const dtc = await prisma.dtcCode.create({
    data: { workTrackingId: id, code: body.code.toUpperCase(), description: body.description || null },
  })
  return NextResponse.json(dtc, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { dtcId } = await req.json()
  await prisma.dtcCode.delete({ where: { id: dtcId } })
  return NextResponse.json({ ok: true })
}
