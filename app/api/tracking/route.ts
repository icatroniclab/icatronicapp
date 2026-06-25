import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const tracking = await prisma.workTracking.upsert({
    where: { workOrderId: body.workOrderId },
    create: { workOrderId: body.workOrderId },
    update: {},
  })
  return NextResponse.json(tracking, { status: 201 })
}
