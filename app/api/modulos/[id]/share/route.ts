import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  try {
    const job = await prisma.moduleJob.findUnique({
      where: { id },
      select: {
        shareToken:  true,
        orderNumber: true,
        techPhone:   true,
        client: { select: { phone: true } },
      },
    })

    if (!job) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    const token = job.shareToken ?? crypto.randomUUID()

    if (!job.shareToken) {
      await prisma.moduleJob.update({ where: { id }, data: { shareToken: token } })
    }

    const phone = job.client?.phone ?? job.techPhone ?? null

    return NextResponse.json({ token, phone, orderNumber: job.orderNumber })
  } catch (e: any) {
    console.error('Share error:', e)
    return NextResponse.json({ error: e.message ?? 'Error interno' }, { status: 500 })
  }
}
