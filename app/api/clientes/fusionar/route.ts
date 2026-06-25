import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { clientePrincipalId, clienteSecundarioId } = await req.json()

  if (!clientePrincipalId || !clienteSecundarioId) {
    return NextResponse.json({ error: 'Faltan IDs' }, { status: 400 })
  }
  if (clientePrincipalId === clienteSecundarioId) {
    return NextResponse.json({ error: 'Los IDs deben ser distintos' }, { status: 400 })
  }

  const [principal, secundario] = await Promise.all([
    prisma.client.findUnique({ where: { id: clientePrincipalId } }),
    prisma.client.findUnique({ where: { id: clienteSecundarioId } }),
  ])

  if (!principal || !secundario) {
    return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
  }

  const updated = await prisma.$transaction(async tx => {
    // Mover vehículos
    await tx.vehicle.updateMany({
      where: { clientId: secundario.id },
      data: { clientId: principal.id },
    })

    // Mover trabajos de módulos
    await tx.moduleJob.updateMany({
      where: { clientId: secundario.id },
      data: { clientId: principal.id },
    })

    // Copiar datos de contacto faltantes
    const patch: any = {}
    if (!principal.phone && secundario.phone) patch.phone = secundario.phone
    if (!principal.email && secundario.email) patch.email = secundario.email
    if (!principal.dni && secundario.dni) patch.dni = secundario.dni
    if (!principal.notes && secundario.notes) patch.notes = secundario.notes

    const updatedPrincipal = Object.keys(patch).length > 0
      ? await tx.client.update({ where: { id: principal.id }, data: patch })
      : principal

    // Eliminar cliente secundario
    await tx.client.delete({ where: { id: secundario.id } })

    return updatedPrincipal
  })

  return NextResponse.json(updated)
}
