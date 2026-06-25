import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const [clients, vehicles, orders] = await Promise.all([
    prisma.client.count(),
    prisma.vehicle.count(),
    prisma.workOrder.count(),
  ])
  const dbUrl = process.env.DATABASE_URL ?? 'NOT SET'
  const dbHost = dbUrl.includes('@') ? dbUrl.split('@')[1]?.split('/')[0] : 'unknown'
  return NextResponse.json({ clients, vehicles, orders, dbHost })
}
