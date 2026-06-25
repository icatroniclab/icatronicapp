import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const { code, description } = await req.json()
  const dtc = await prisma.moduleDtcCode.create({
    data: { moduleTrackingId: id, code: code.toUpperCase().trim(), description: description || null },
  })
  return NextResponse.json(dtc, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { dtcId } = await req.json()
  await prisma.moduleDtcCode.delete({ where: { id: dtcId } })
  return NextResponse.json({ ok: true })
}
