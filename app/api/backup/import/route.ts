import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
  }

  const body = await req.json()
  const stats = { vehiculos: 0, clientes: 0, stock: 0, gastos: 0, casos: 0, ordenes: 0 }

  // Importar stock
  if (Array.isArray(body.stock)) {
    for (const p of body.stock) {
      await prisma.product.upsert({
        where: { id: p.id || 'noop' },
        update: { name: p.nombre || p.name, quantity: p.cantidad ?? p.quantity ?? 0, minStock: p.stockMinimo ?? p.minStock ?? 0, unitPrice: p.precioUnitario ?? p.unitPrice ?? 0 },
        create: { id: p.id, name: p.nombre || p.name, quantity: p.cantidad ?? p.quantity ?? 0, minStock: p.stockMinimo ?? p.minStock ?? 0, unitPrice: p.precioUnitario ?? p.unitPrice ?? 0 },
      }).catch(() => null)
      stats.stock++
    }
  }

  // Importar gastos
  if (Array.isArray(body.gastos)) {
    for (const g of body.gastos) {
      await prisma.expense.upsert({
        where: { id: g.id || 'noop' },
        update: {},
        create: {
          id: g.id,
          category: g.categoria || g.category || 'OTROS',
          amount: g.monto ?? g.amount ?? 0,
          date: new Date(g.fecha || g.date || Date.now()),
          description: g.descripcion || g.description || null,
        },
      }).catch(() => null)
      stats.gastos++
    }
  }

  // Importar casos
  if (Array.isArray(body.casos)) {
    for (const c of body.casos) {
      await prisma.diagnosticCase.upsert({
        where: { id: c.id || 'noop' },
        update: {},
        create: {
          id: c.id,
          title: c.titulo || c.title,
          vehicle: c.vehiculo || c.vehicle || '',
          dtcCodes: c.dtcCodes || c.codigos || null,
          symptoms: c.sintomas || c.symptoms || '',
          rootCause: c.causaRaiz || c.rootCause || null,
          solution: c.solucion || c.solution || null,
          parts: c.repuestos || c.parts || null,
          difficulty: c.dificultad || c.difficulty || 'MEDIA',
          status: c.estado || c.status || 'BORRADOR',
        },
      }).catch(() => null)
      stats.casos++
    }
  }

  // Importar vehículos con clientes
  if (Array.isArray(body.vehiculos)) {
    for (const v of body.vehiculos) {
      // Cliente
      const clientData = v.cliente || v.client || {}
      let client = null
      if (clientData.id) {
        client = await prisma.client.upsert({
          where: { id: clientData.id },
          update: {},
          create: {
            id: clientData.id,
            name: clientData.nombre || clientData.name || 'Sin nombre',
            phone: clientData.telefono || clientData.phone || null,
            email: clientData.email || null,
            dni: clientData.dni || null,
          },
        }).catch(() => null)
        if (client) stats.clientes++
      }

      if (!client) continue

      await prisma.vehicle.upsert({
        where: { plate: (v.patente || v.plate || '').toUpperCase() },
        update: {},
        create: {
          id: v.id,
          plate: (v.patente || v.plate || '').toUpperCase(),
          brand: v.marca || v.brand || '',
          model: v.modelo || v.model || '',
          year: v.año ?? v.year ?? null,
          km: v.km ?? null,
          color: v.color || null,
          clientId: client.id,
        },
      }).catch(() => null)
      stats.vehiculos++
    }
  }

  return NextResponse.json({ ok: true, stats })
}
