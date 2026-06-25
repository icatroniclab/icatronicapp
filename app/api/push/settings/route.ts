import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const userId = (session.user as any).id as string
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { notificationsEnabled: true } })
  return NextResponse.json({ enabled: user?.notificationsEnabled ?? true })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const userId = (session.user as any).id as string
  const { enabled } = await req.json()

  await prisma.user.update({
    where: { id: userId },
    data: { notificationsEnabled: enabled },
  })

  // When disabling, remove all subscriptions for this user
  if (!enabled) {
    await prisma.pushSubscription.deleteMany({ where: { userId } })
  }

  return NextResponse.json({ ok: true })
}
