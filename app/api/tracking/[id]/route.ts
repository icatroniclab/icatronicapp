import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const tracking = await prisma.workTracking.update({
    where: { id },
    data: {
      ...(body.scannerReport !== undefined && { scannerReport: body.scannerReport }),
      ...(body.scannerPdf !== undefined && { scannerPdf: body.scannerPdf }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.photos !== undefined && { photos: JSON.stringify(body.photos) }),
      ...(body.measurements !== undefined && { measurements: JSON.stringify(body.measurements) }),
      ...(body.scannedModules !== undefined && { scannedModules: JSON.stringify(body.scannedModules) }),
      ...(body.rootCause !== undefined && { rootCause: body.rootCause }),
    },
    include: { dtcCodes: true, partsUsed: { include: { product: true } } },
  })
  return NextResponse.json(tracking)
}
