import { schedule } from 'node-cron'
import { prisma } from './prisma'
import { webpush } from './webpush'

const g = globalThis as any

export function startNotificationCron() {
  if (g.__notifCronStarted) return
  g.__notifCronStarted = true

  // Runs every 15 minutes
  schedule('*/15 * * * *', async () => {
    try {
      const now = new Date()
      const windowStart = new Date(now.getTime() + 5 * 60 * 1000)    // +5 min
      const windowEnd   = new Date(now.getTime() + 2 * 60 * 60 * 1000) // +2 hours

      const upcoming = await prisma.appointment.findMany({
        where: {
          scheduledAt: { gte: windowStart, lte: windowEnd },
          status: { not: 'CANCELADO' },
          notifiedAt: null,
        },
      })

      if (upcoming.length === 0) return

      const subscriptions = await prisma.pushSubscription.findMany({
        include: { user: { select: { notificationsEnabled: true } } },
        where: { user: { notificationsEnabled: true } },
      })

      if (subscriptions.length === 0) return

      for (const appt of upcoming) {
        const timeStr = new Date(appt.scheduledAt).toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
        const minutesAway = Math.round((new Date(appt.scheduledAt).getTime() - now.getTime()) / 60000)

        const payload = JSON.stringify({
          title: `⏰ Turno en ${minutesAway} minutos`,
          body: `${appt.clientName} · ${appt.service} a las ${timeStr}`,
          url: '/turnos',
        })

        const sends = subscriptions.map(sub =>
          webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
          ).catch(async err => {
            // Remove expired/invalid subscriptions
            if (err.statusCode === 410 || err.statusCode === 404) {
              await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
            }
          })
        )

        await Promise.allSettled(sends)

        await prisma.appointment.update({
          where: { id: appt.id },
          data: { notifiedAt: now },
        })
      }
    } catch (err) {
      console.error('[notif-cron]', err)
    }
  })

  console.log('[notif-cron] Iniciado — revisión cada 15 minutos')
}
