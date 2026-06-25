import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const service = await prisma.servicePrice.update({
    where: { id },
    data: {
      name: body.name,
      priceNaftaTaller: body.priceNaftaTaller != null ? parseFloat(body.priceNaftaTaller) : null,
      priceDieselTaller: body.priceDieselTaller != null ? parseFloat(body.priceDieselTaller) : null,
      priceNaftaParticular: body.priceNaftaParticular != null ? parseFloat(body.priceNaftaParticular) : null,
      priceDieselParticular: body.priceDieselParticular != null ? parseFloat(body.priceDieselParticular) : null,
      usdTaller: body.usdTaller != null ? parseFloat(body.usdTaller) : null,
      usdParticular: body.usdParticular != null ? parseFloat(body.usdParticular) : null,
    },
  })
  return NextResponse.json(service)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.servicePrice.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
