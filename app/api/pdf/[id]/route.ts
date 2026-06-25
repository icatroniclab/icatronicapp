import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DASHBOARD_LIGHTS } from '@/lib/utils'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const showPagos = req.nextUrl.searchParams.get('pagos') === '1'
  const [order, budgetItems] = await Promise.all([
    prisma.workOrder.findUnique({
      where: { id },
      include: {
        vehicle: { include: { client: true } },
        tracking: { include: { dtcCodes: true, partsUsed: { include: { product: true } } } },
      },
    }),
    prisma.budgetItem.findMany({ where: { workOrderId: id }, orderBy: { createdAt: 'asc' } }),
  ])

  if (!order) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const activeLights = DASHBOARD_LIGHTS.filter(l => (order as any)[l.key]).map(l => l.label)
  const damageZones: string[] = order.damageZones ? JSON.parse(order.damageZones) : []

  const fecha = new Date(order.entryDate).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const paymentLabels: Record<string, string> = { PENDIENTE: 'Pendiente', SENA: 'Seña', PARCIAL: 'Parcial', PAGADO: 'Pagado' }
  const workLabels: Record<string, string> = { INGRESADO: 'Ingresado', EN_PROCESO: 'En proceso', LISTO: 'Listo', ENTREGADO: 'Entregado' }

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; padding: 30px; }
  h1 { font-size: 22px; font-weight: 700; color: #1d4ed8; }
  h2 { font-size: 14px; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 4px; margin: 16px 0 8px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #1d4ed8; padding-bottom: 12px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f3f4f6; }
  .label { color: #6b7280; }
  .chip { display: inline-block; background: #fef3c7; color: #92400e; border: 1px solid #f59e0b; border-radius: 4px; padding: 2px 8px; margin: 2px; font-size: 11px; }
  .chip-red { background: #fee2e2; color: #991b1b; border-color: #ef4444; }
  .chip-blue { background: #dbeafe; color: #1e40af; border-color: #3b82f6; }
  .badge { display: inline-block; background: #d1fae5; color: #065f46; border-radius: 4px; padding: 2px 10px; font-size: 11px; font-weight: 600; }
  .badge-pending { background: #fee2e2; color: #991b1b; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th { background: #f3f4f6; text-align: left; padding: 6px 8px; font-size: 11px; }
  td { padding: 5px 8px; border-bottom: 1px solid #f3f4f6; font-size: 11px; }
  .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 12px; color: #9ca3af; font-size: 10px; display: flex; justify-content: space-between; }
</style>
</head>
<body>
<div class="header">
  <div>
    <h1>Icatronic</h1>
    <p style="color:#6b7280;font-size:11px">Laboratorio de Electrónica Automotriz</p>
  </div>
  <div style="text-align:right">
    <p style="font-size:16px;font-weight:700">Ficha de Ingreso</p>
    <p style="color:#6b7280">Fecha: ${fecha}</p>
    <p style="color:#6b7280">ID: ${order.id.slice(-8).toUpperCase()}</p>
  </div>
</div>

<div class="grid2">
  <div>
    <h2>Datos del Cliente</h2>
    <div class="row"><span class="label">Nombre</span><span>${order.vehicle.client.name}</span></div>
    <div class="row"><span class="label">Teléfono</span><span>${order.vehicle.client.phone || '—'}</span></div>
    <div class="row"><span class="label">Email</span><span>${order.vehicle.client.email || '—'}</span></div>
    <div class="row"><span class="label">DNI/CUIT</span><span>${order.vehicle.client.dni || '—'}</span></div>
  </div>
  <div>
    <h2>Datos del Vehículo</h2>
    <div class="row"><span class="label">Patente</span><span><strong>${order.vehicle.plate}</strong></span></div>
    <div class="row"><span class="label">Vehículo</span><span>${order.vehicle.brand} ${order.vehicle.model}</span></div>
    <div class="row"><span class="label">Año</span><span>${order.vehicle.year || '—'}</span></div>
    <div class="row"><span class="label">Kilómetros</span><span>${order.vehicle.km ? order.vehicle.km.toLocaleString('es-AR') + ' km' : '—'}</span></div>
    <div class="row"><span class="label">Color</span><span>${order.vehicle.color || '—'}</span></div>
  </div>
</div>

<h2>Motivo de Ingreso</h2>
<p style="padding:8px;background:#f9fafb;border-radius:6px;border-left:3px solid #1d4ed8">${order.motive}</p>

${activeLights.length > 0 ? `<h2>Luces del Tablero</h2><div>${activeLights.map(l => `<span class="chip">${l}</span>`).join('')}</div>` : ''}
${damageZones.length > 0 ? `<h2>Daños</h2><div>${damageZones.map((z: string) => `<span class="chip chip-red">${z}</span>`).join('')}</div>` : ''}
${order.missingItems ? `<h2>Faltantes</h2><p>${order.missingItems}</p>` : ''}
${order.valuables ? `<h2>Objetos de Valor Declarados</h2><p>${order.valuables}</p>` : ''}

<h2>Estado</h2>
<div class="grid2">
  <div class="row"><span class="label">Trabajo</span><span class="badge">${workLabels[order.workStatus]}</span></div>
  <div class="row"><span class="label">Pago</span><span class="${order.paymentStatus === 'PAGADO' ? 'badge' : 'badge badge-pending'}">${paymentLabels[order.paymentStatus]}</span></div>
  ${order.budget ? `<div class="row"><span class="label">Presupuesto</span><span><strong>$${order.budget.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong></span></div>` : ''}
</div>

${showPagos && order.budget ? (() => {
  const total = order.budget ?? 0
  const pagado = order.amountPaid ?? 0
  const saldo = Math.max(0, total - pagado)
  return `
<div style="margin-top:12px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden">
  <div style="background:#f3f4f6;padding:6px 12px;font-weight:600;font-size:12px;color:#374151">Resumen de Pago</div>
  <div style="padding:10px 12px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center">
    <div>
      <div style="color:#6b7280;font-size:10px;margin-bottom:2px">TOTAL</div>
      <div style="font-weight:700;font-size:14px;color:#1d4ed8">$${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
    </div>
    <div>
      <div style="color:#6b7280;font-size:10px;margin-bottom:2px">ABONADO</div>
      <div style="font-weight:700;font-size:14px;color:#059669">$${pagado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
    </div>
    <div>
      <div style="color:#6b7280;font-size:10px;margin-bottom:2px">SALDO</div>
      <div style="font-weight:700;font-size:14px;color:${saldo > 0 ? '#dc2626' : '#059669'}">$${saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
    </div>
  </div>
</div>`
})() : ''}

${order.tracking?.dtcCodes?.length ? `<h2>Códigos DTC</h2><div>${order.tracking.dtcCodes.map(d => `<span class="chip chip-blue">${d.code}${d.description ? ` — ${d.description}` : ''}</span>`).join('')}</div>` : ''}

${budgetItems.length > 0 ? (() => {
  const typeLabels: Record<string, string> = { REPUESTO: 'Repuesto', MANO_DE_OBRA: 'Mano de obra', SERVICIO: 'Servicio', DIAGNOSTICO: 'Diagnóstico', OTRO: 'Otro' }
  const totalPrecio = budgetItems.reduce((s, i) => s + i.price * i.quantity, 0)
  return `
<h2>Detalle del Trabajo</h2>
<table>
  <thead><tr><th>Tipo</th><th>Descripción</th><th>Cant.</th><th>Precio unit.</th><th>Subtotal</th></tr></thead>
  <tbody>
    ${budgetItems.map(i => `<tr><td>${typeLabels[i.type] || i.type}</td><td>${i.description}</td><td>${i.quantity}</td><td>$${i.price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td><td>$${(i.price * i.quantity).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td></tr>`).join('')}
  </tbody>
</table>
<div style="display:flex;justify-content:flex-end;margin-top:8px">
  <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:8px 16px;text-align:right">
    <span style="color:#166534;font-size:13px;font-weight:700">Total: $${totalPrecio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
  </div>
</div>`
})() : order.budget ? `
<h2>Presupuesto</h2>
<div style="display:flex;justify-content:flex-end">
  <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:6px;padding:8px 16px">
    <span style="color:#166534;font-size:13px;font-weight:700">Total: $${order.budget.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
  </div>
</div>` : ''}

${order.notes ? `<h2>Notas</h2><p>${order.notes}</p>` : ''}

<div style="margin-top:40px;display:grid;grid-template-columns:1fr 1fr;gap:60px">
  <div style="border-top:1px solid #374151;padding-top:8px;text-align:center;color:#6b7280;font-size:11px">Firma del Cliente</div>
  <div style="border-top:1px solid #374151;padding-top:8px;text-align:center;color:#6b7280;font-size:11px">Firma del Taller</div>
</div>
<div class="footer"><span>Icatronic — ${fecha}</span><span>ID: ${order.id}</span></div>
</body></html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
