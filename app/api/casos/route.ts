import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const search = req.nextUrl.searchParams.get('q') || ''
  const casos = await prisma.diagnosticCase.findMany({
    where: search ? {
      OR: [
        { title: { contains: search } },
        { symptoms: { contains: search } },
        { dtcCodes: { contains: search } },
        { vehicle: { contains: search } },
      ],
    } : undefined,
    orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
  })
  return NextResponse.json(casos)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const caso = await prisma.diagnosticCase.create({
    data: {
      title: body.title,
      vehicle: body.vehicle,
      dtcCodes: body.dtcCodes || null,
      symptoms: body.symptoms,
      rootCause: body.rootCause || null,
      solution: body.solution || null,
      parts: body.parts || null,
      difficulty: body.difficulty || 'MEDIA',
      status: body.status || 'BORRADOR',
    },
  })
  return NextResponse.json(caso, { status: 201 })
}
