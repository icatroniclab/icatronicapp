import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[] = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j]
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1])
      prev = tmp
    }
  }
  return dp[n]
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const clients = await prisma.client.findMany({
    include: {
      vehicles: { include: { workOrders: true } },
      moduleJobs: true,
    },
    orderBy: { name: 'asc' },
  })

  const groups: { clientes: any[]; razon: string }[] = []
  const grouped = new Set<string>()

  for (let i = 0; i < clients.length; i++) {
    for (let j = i + 1; j < clients.length; j++) {
      const a = clients[i], b = clients[j]
      if (grouped.has(a.id) && grouped.has(b.id)) continue

      let razon = ''

      // Mismo teléfono (no nulo)
      if (a.phone && b.phone && a.phone === b.phone) {
        razon = 'telefono_igual'
      } else {
        // Nombre similar (distancia de edición <= 2)
        const na = normalize(a.name)
        const nb = normalize(b.name)
        if (Math.abs(na.length - nb.length) <= 2 && levenshtein(na, nb) <= 2) {
          razon = 'nombre_similar'
        }
      }

      if (razon) {
        // Buscar si alguno ya está en un grupo existente
        const existingGroup = groups.find(g =>
          g.clientes.some(c => c.id === a.id || c.id === b.id)
        )
        if (existingGroup) {
          if (!existingGroup.clientes.find((c: any) => c.id === a.id)) existingGroup.clientes.push(a)
          if (!existingGroup.clientes.find((c: any) => c.id === b.id)) existingGroup.clientes.push(b)
        } else {
          groups.push({ clientes: [a, b], razon })
        }
        grouped.add(a.id)
        grouped.add(b.id)
      }
    }
  }

  // Agregar conteo de trabajos por cliente
  const result = groups.map(g => ({
    razon: g.razon,
    clientes: g.clientes.map(c => ({
      ...c,
      totalTrabajos: c.vehicles.reduce((sum: number, v: any) => sum + v.workOrders.length, 0) + c.moduleJobs.length,
    })),
  }))

  return NextResponse.json(result)
}
