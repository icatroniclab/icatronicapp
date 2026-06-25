import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const { text } = await req.json()
  const entry = await prisma.moduleDiagEntry.create({
    data: { moduleTrackingId: id, text },
  })
  return NextResponse.json(entry, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { entryId } = await req.json()
  await prisma.moduleDiagEntry.delete({ where: { id: entryId } })
  return NextResponse.json({ ok: true })
}
