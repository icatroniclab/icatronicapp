import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const data: any = {}
  const fields = [
    'physicalInspection', 'supplyVoltage', 'currentDraw', 'moduleResponse',
    'protocol', 'scannerConnected', 'softwareVersion', 'partNumber',
    'pinMeasurements', 'rootCause', 'finalResult', 'notes',
  ]
  for (const f of fields) {
    if (body[f] !== undefined) data[f] = body[f]
  }
  if (body.photos !== undefined) {
    data.photos = Array.isArray(body.photos) ? JSON.stringify(body.photos) : body.photos
  }

  const tracking = await prisma.moduleTracking.update({ where: { id }, data })
  return NextResponse.json(tracking)
}
