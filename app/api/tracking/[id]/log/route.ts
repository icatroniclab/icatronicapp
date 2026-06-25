import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  if (!body.text?.trim()) return NextResponse.json({ error: 'Texto requerido' }, { status: 400 })

  const entry = await prisma.diagnosticEntry.create({
    data: { workTrackingId: id, text: body.text.trim() },
  })
  return NextResponse.json(entry, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  await prisma.diagnosticEntry.delete({ where: { id: body.entryId } })
  return NextResponse.json({ ok: true })
}
