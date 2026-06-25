import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function ars(n: number) {
  return '$ ' + n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const p = await prisma.presupuesto.findUnique({ where: { id } })
  if (!p) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const items: { desc: string; amount: number }[] = JSON.parse(p.items || '[]')
  const fecha = new Date(p.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const vehiculo = [p.brand, p.model, p.year].filter(Boolean).join(' ')
  const numStr = p.number ? String(p.number).padStart(4, '0') : id.slice(-6).toUpperCase()
  const fileTitle = `presupuesto_${p.brand}_${p.model}_${fecha.replace(/\//g, '-')}`

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${fileTitle}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #111; background: #fff; padding: 40px 48px; }
  @media print {
    @page { size: A4; margin: 1.5cm; }
    body { padding: 0; }
    .no-print { display: none !important; }
  }

  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 20px; border-bottom: 3px solid #1d4ed8; margin-bottom: 24px; }
  .company-name { font-size: 26px; font-weight: 800; color: #1d4ed8; letter-spacing: 0.04em; }
  .company-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
  .doc-title { text-align: right; }
  .doc-label { font-size: 20px; font-weight: 700; color: #1d4ed8; letter-spacing: 0.08em; }
  .doc-meta { font-size: 11px; color: #64748b; margin-top: 4px; line-height: 1.6; }

  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
  .info-box { background: #f8fafc; border-radius: 6px; padding: 14px 16px; }
  .info-box-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 8px; }
  .info-box-value { font-size: 14px; font-weight: 600; color: #0f172a; }
  .info-box-value-small { font-size: 12px; color: #334155; margin-top: 3px; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  thead tr { background: #1d4ed8; color: #fff; }
  thead th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
  thead th:last-child { text-align: right; }
  tbody tr { border-bottom: 1px solid #f1f5f9; }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody td { padding: 11px 14px; font-size: 13px; color: #1e293b; vertical-align: top; line-height: 1.5; }
  tbody td:last-child { text-align: right; font-weight: 600; white-space: nowrap; }

  .total-row { display: flex; justify-content: flex-end; margin-top: 2px; }
  .total-box { background: #1d4ed8; color: #fff; border-radius: 6px; padding: 12px 20px; min-width: 220px; display: flex; justify-content: space-between; align-items: center; }
  .total-label { font-size: 13px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
  .total-amount { font-size: 20px; font-weight: 800; }

  .notes-section { margin-top: 28px; padding: 16px; background: #f8fafc; border-left: 3px solid #1d4ed8; border-radius: 0 6px 6px 0; }
  .notes-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 6px; }
  .notes-text { font-size: 12px; color: #334155; line-height: 1.6; }

  .validity { margin-top: 16px; font-size: 11px; color: #64748b; text-align: right; font-style: italic; }

  .footer { margin-top: 48px; padding-top: 14px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }

  .print-btn { position: fixed; bottom: 24px; right: 24px; background: #1d4ed8; color: #fff; border: none; border-radius: 8px; padding: 12px 24px; font-size: 14px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 14px rgba(29,78,216,0.4); }
  .print-btn:hover { background: #1e40af; }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="company-name">ICATRONIC</div>
    <div class="company-sub">Laboratorio de Electrónica Automotriz</div>
  </div>
  <div class="doc-title">
    <div class="doc-label">PRESUPUESTO</div>
    <div class="doc-meta">
      N° ${numStr}<br>
      Fecha: ${fecha}
    </div>
  </div>
</div>

<div class="info-grid">
  <div class="info-box">
    <div class="info-box-label">Vehículo</div>
    <div class="info-box-value">${vehiculo || '—'}</div>
    ${p.plate ? `<div class="info-box-value-small">Patente: ${p.plate}</div>` : ''}
  </div>
  <div class="info-box">
    <div class="info-box-label">Cliente</div>
    <div class="info-box-value">${p.clientName || '—'}</div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>Descripción</th>
      <th>Importe</th>
    </tr>
  </thead>
  <tbody>
    ${items.map(item => `
    <tr>
      <td>${item.desc || ''}</td>
      <td>${ars(Number(item.amount) || 0)}</td>
    </tr>`).join('')}
  </tbody>
</table>

<div class="total-row">
  <div class="total-box">
    <span class="total-label">Total</span>
    <span class="total-amount">${ars(p.total)}</span>
  </div>
</div>

${p.notes ? `
<div class="notes-section">
  <div class="notes-label">Notas</div>
  <div class="notes-text">${p.notes.replace(/\n/g, '<br>')}</div>
</div>` : ''}

<div class="validity">Válido por ${p.validHours} horas desde la fecha de emisión.</div>

<div class="footer">
  <span>ICATRONIC — Electrónica Automotriz</span>
  <span>Presupuesto N° ${numStr} · ${fecha}</span>
</div>

<button class="print-btn no-print" onclick="window.print()">⬇ Descargar / Imprimir</button>

<script>
  document.title = '${fileTitle}';
</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
