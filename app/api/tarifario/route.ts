import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const services = await prisma.servicePrice.findMany({ orderBy: { order: 'asc' } })
  return NextResponse.json(services)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const service = await prisma.servicePrice.create({
    data: {
      name: body.name,
      order: body.order ?? 99,
      priceNaftaTaller: body.priceNaftaTaller ? parseFloat(body.priceNaftaTaller) : null,
      priceDieselTaller: body.priceDieselTaller ? parseFloat(body.priceDieselTaller) : null,
      priceNaftaParticular: body.priceNaftaParticular ? parseFloat(body.priceNaftaParticular) : null,
      priceDieselParticular: body.priceDieselParticular ? parseFloat(body.priceDieselParticular) : null,
      usdTaller: body.usdTaller ? parseFloat(body.usdTaller) : null,
      usdParticular: body.usdParticular ? parseFloat(body.usdParticular) : null,
    },
  })
  return NextResponse.json(service, { status: 201 })
}
