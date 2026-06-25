import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const job = await prisma.moduleJob.findUnique({
    where: { shareToken: token },
    select: {
      orderNumber:  true,
      status:       true,
      workType:     true,
      vehicleBrand: true,
      vehicleModel: true,
      vehicleYear:  true,
      entryDate:    true,
      modules: {
        select: { moduleType: { select: { name: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!job) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  return NextResponse.json(job)
}
