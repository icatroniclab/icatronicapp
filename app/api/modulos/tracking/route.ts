import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST { moduleJobId } → get or create tracking record
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { moduleJobId } = await req.json()
    const tracking = await prisma.moduleTracking.upsert({
      where:  { moduleJobId },
      create: { moduleJobId },
      update: {},
      include: {
        dtcCodes:      { orderBy: { createdAt: 'asc' } },
        diagnosticLog: { orderBy: { createdAt: 'asc' } },
      },
    })
    return NextResponse.json(tracking)
  } catch (e: any) {
    console.error('ModuleTracking error:', e)
    return NextResponse.json({ error: e.message ?? 'Error interno' }, { status: 500 })
  }
}
