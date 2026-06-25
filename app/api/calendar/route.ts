import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function toICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function escapeICS(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

const STATUS_MAP: Record<string, string> = {
  PENDIENTE: 'TENTATIVE',
  CONFIRMADO: 'CONFIRMED',
  CANCELADO: 'CANCELLED',
  COMPLETADO: 'CONFIRMED',
}

export async function GET() {
  const turnos = await prisma.appointment.findMany({
    orderBy: { scheduledAt: 'asc' },
  })

  const events = turnos.map(t => {
    const start = new Date(t.scheduledAt)
    const end = new Date(start.getTime() + 60 * 60 * 1000) // +1 hora
    const status = STATUS_MAP[t.status] ?? 'TENTATIVE'
    const summary = escapeICS(`${t.service} - ${t.clientName}`)
    const lines = [
      'BEGIN:VEVENT',
      `UID:turno-${t.id}@icatronic`,
      `DTSTAMP:${toICSDate(new Date())}`,
      `DTSTART:${toICSDate(start)}`,
      `DTEND:${toICSDate(end)}`,
      `SUMMARY:${summary}`,
      `STATUS:${status}`,
    ]
    if (t.phone) lines.push(`DESCRIPTION:Tel: ${escapeICS(t.phone)}${t.notes ? '\\n' + escapeICS(t.notes) : ''}`)
    else if (t.notes) lines.push(`DESCRIPTION:${escapeICS(t.notes)}`)
    lines.push('END:VEVENT')
    return lines.join('\r\n')
  }).join('\r\n')

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//IcatronicApp//Turnos//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Turnos Icatronic',
    'X-WR-TIMEZONE:America/Argentina/Buenos_Aires',
    events,
    'END:VCALENDAR',
  ].join('\r\n')

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="turnos.ics"',
      'Cache-Control': 'no-cache',
    },
  })
}
