import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { DASHBOARD_LIGHTS } from '@/lib/utils'

function ars(n: number) {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fecha(d: Date | string) {
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function safeJson<T>(val: string | null | undefined, fallback: T): T {
  try { return val ? JSON.parse(val) : fallback } catch { return fallback }
}

// Filtra URLs que son imágenes (no videos ni PDFs)
function isImage(url: string) {
  const lower = url.toLowerCase()
  return (
    lower.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/) ||
    lower.includes('drive.google.com/uc') ||
    lower.includes('lh3.googleusercontent.com')
  )
}

function photosGrid(urls: string[], title: string) {
  const images = urls.filter(isImage)
  if (images.length === 0) return ''
  return `
  <div class="section">
    <div class="section-title">${title}</div>
    <div class="photo-grid">
      ${images.map(url => `
        <div class="photo-item">
          <img src="${url}" alt="" onerror="this.parentElement.style.display='none'" />
        </div>`).join('')}
    </div>
  </div>`
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const showPagos = req.nextUrl.searchParams.get('pagos') !== '0'

  const [order, budgetItems, config] = await Promise.all([
    prisma.workOrder.findUnique({
      where: { id },
      include: {
        vehicle: { include: { client: true } },
        tracking: {
          include: {
            dtcCodes: { orderBy: { createdAt: 'asc' } },
            partsUsed: { include: { product: true }, orderBy: { createdAt: 'asc' } },
            diagnosticLog: { orderBy: { createdAt: 'asc' } },
          },
        },
      },
    }),
    prisma.budgetItem.findMany({ where: { workOrderId: id }, orderBy: { createdAt: 'asc' } }),
    prisma.config.findMany(),
  ])

  if (!order) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const cfg: Record<string, string> = {}
  config.forEach(c => { cfg[c.key] = c.value })

  const tallerNombre    = cfg.tallerNombre    ?? 'ICATRONIC'
  const tallerSubtitulo = cfg.tallerSubtitulo ?? 'Laboratorio de Electrónica Automotriz'
  const tallerTelefono  = cfg.tallerTelefono  ?? ''
  const tallerDireccion = cfg.tallerDireccion ?? ''
  const tallerEmail     = cfg.tallerEmail     ?? ''

  const activeLights   = DASHBOARD_LIGHTS.filter(l => (order as any)[l.key]).map(l => l.label)
  const tracking       = order.tracking
  const fotosIngreso   = safeJson<string[]>(order.photos, [])
  const fotosProceso   = safeJson<string[]>(tracking?.photos ?? null, [])
  const measurements   = safeJson<Record<string, string>>(tracking?.measurements ?? null, {})
  const scannedModules = safeJson<string[]>(tracking?.scannedModules ?? null, [])

  const totalPrecio = budgetItems.reduce((s, i) => s + i.price * i.quantity, 0)
  const pagado      = order.amountPaid ?? 0
  const saldo       = Math.max(0, totalPrecio - pagado)

  const typeLabels: Record<string, string> = {
    REPUESTO: 'Repuesto', MANO_DE_OBRA: 'Mano de obra', SERVICIO: 'Servicio',
    DIAGNOSTICO: 'Diagnóstico', PROGRAMACION: 'Programación', OTRO: 'Otro',
  }

  // Mediciones eléctricas — solo muestra las que tienen valor
  const measRows: { label: string; value: string; unit: string }[] = [
    { label: 'Batería reposo',    value: measurements.batteryRest,        unit: 'V'  },
    { label: 'Batería con motor', value: measurements.batteryLoad,        unit: 'V'  },
    { label: 'Batería arranque',  value: measurements.batteryStart,       unit: 'V'  },
    { label: 'Alternador',        value: measurements.alternator,         unit: 'V'  },
    { label: 'Resistencia tierra',value: measurements.ground,             unit: 'Ω'  },
    { label: 'Analizador bat.',   value: measurements.batteryAnalyzerState, unit: '' },
    { label: 'CCA medido',        value: measurements.batteryCcaMeasured, unit: 'A'  },
    { label: 'CCA nominal',       value: measurements.batteryCcaNominal,  unit: 'A'  },
    { label: 'Transponder',       value: measurements.transponder,        unit: ''   },
  ].filter(r => r.value && r.value.trim() !== '')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Informe de Trabajo — ${order.vehicle.plate}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', Arial, sans-serif; font-size: 11.5px; color: #1e2530; background: #fff; }
  .page { max-width: 800px; margin: 0 auto; padding: 32px 36px; }

  /* Header */
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 18px; border-bottom: 3px solid #0f172a; margin-bottom: 22px; }
  .taller-nombre { font-size: 26px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px; }
  .taller-sub { font-size: 11px; color: #64748b; margin-top: 2px; }
  .taller-contact { font-size: 10.5px; color: #64748b; margin-top: 4px; line-height: 1.6; }
  .doc-info { text-align: right; }
  .doc-tipo { font-size: 18px; font-weight: 700; color: #1d4ed8; }
  .doc-nro { font-size: 11px; color: #64748b; margin-top: 3px; }
  .doc-fecha { font-size: 11px; color: #64748b; }

  /* Secciones */
  .section { margin-bottom: 18px; }
  .section-title {
    font-size: 10px; font-weight: 700; color: #1d4ed8;
    text-transform: uppercase; letter-spacing: 0.12em;
    border-bottom: 1.5px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px;
  }

  /* Grids */
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

  /* Rows datos */
  .data-row { display: flex; justify-content: space-between; align-items: baseline; padding: 4px 0; border-bottom: 1px solid #f1f5f9; gap: 8px; }
  .data-label { color: #64748b; font-size: 10.5px; flex-shrink: 0; }
  .data-value { color: #0f172a; font-weight: 500; font-size: 11px; text-align: right; }

  /* Chips */
  .chips { display: flex; flex-wrap: wrap; gap: 4px; }
  .chip { display: inline-block; border-radius: 3px; padding: 2px 7px; font-size: 10px; font-weight: 600; }
  .chip-dtc { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; font-family: monospace; }
  .chip-warning { background: #fefce8; color: #854d0e; border: 1px solid #fde68a; }
  .chip-blue { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }

  /* Cajas */
  .highlight-box { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #1d4ed8; border-radius: 0 4px 4px 0; padding: 10px 14px; }
  .highlight-box p { font-size: 11.5px; color: #1e2530; line-height: 1.6; }

  /* Tabla presupuesto */
  table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
  thead tr { background: #f1f5f9; }
  th { padding: 6px 8px; text-align: left; font-weight: 600; color: #475569; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
  th.right, td.right { text-align: right; }
  td { padding: 5.5px 8px; border-bottom: 1px solid #f1f5f9; color: #334155; }
  tr:last-child td { border-bottom: none; }
  .type-badge { display: inline-block; padding: 1px 5px; border-radius: 2px; font-size: 9.5px; font-weight: 600; }
  .type-REPUESTO     { background: #eff6ff; color: #1e40af; }
  .type-MANO_DE_OBRA { background: #f0fdf4; color: #166534; }
  .type-SERVICIO     { background: #faf5ff; color: #6b21a8; }
  .type-DIAGNOSTICO  { background: #fefce8; color: #854d0e; }
  .type-PROGRAMACION { background: #ecfeff; color: #155e75; }
  .type-OTRO         { background: #f8fafc; color: #475569; }

  /* Resumen pago */
  .payment-box { border: 1.5px solid #e2e8f0; border-radius: 6px; overflow: hidden; margin-top: 14px; }
  .payment-box-header { background: #f1f5f9; padding: 6px 14px; font-weight: 600; font-size: 10px; color: #475569; text-transform: uppercase; letter-spacing: 0.08em; }
  .payment-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; }
  .payment-cell { padding: 12px 14px; text-align: center; border-right: 1px solid #e2e8f0; }
  .payment-cell:last-child { border-right: none; }
  .payment-label { font-size: 9.5px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
  .payment-value { font-size: 16px; font-weight: 700; }
  .val-blue  { color: #1d4ed8; }
  .val-green { color: #059669; }
  .val-red   { color: #dc2626; }

  /* Fotos */
  .photo-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }
  .photo-item {
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
  }
  .photo-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  /* Mediciones */
  .meas-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .meas-cell { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 7px 10px; }
  .meas-cell-label { font-size: 9.5px; color: #64748b; margin-bottom: 2px; }
  .meas-cell-value { font-size: 13px; font-weight: 700; color: #0f172a; font-family: monospace; }
  .meas-cell-unit  { font-size: 9px; color: #94a3b8; margin-left: 2px; font-family: sans-serif; font-weight: 400; }

  /* Log */
  .log-entry { display: flex; gap: 8px; padding: 5.5px 0; border-bottom: 1px solid #f1f5f9; align-items: baseline; }
  .log-bullet { color: #1d4ed8; flex-shrink: 0; font-size: 14px; line-height: 1; }
  .log-text { color: #334155; line-height: 1.5; font-size: 10.5px; }

  /* Botón descarga — oculto al imprimir */
  .download-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: #0f172a; padding: 10px 24px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
  .download-bar span { color: #94a3b8; font-size: 12px; }
  .download-btn { background: #1d4ed8; color: #fff; border: none; border-radius: 4px; padding: 7px 18px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; }
  .download-btn:hover { background: #1e40af; }
  .page-with-bar { padding-top: 52px; }
  @media print {
    .download-bar { display: none !important; }
    .page-with-bar { padding-top: 0; }
    .page { padding: 16px 20px; }
    .photo-grid { grid-template-columns: repeat(4, 1fr); }
  }

  /* Firma */
  .firma-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 40px; }
  .firma-line { border-top: 1.5px solid #94a3b8; padding-top: 8px; text-align: center; color: #64748b; font-size: 10px; }

  /* Footer */
  .footer { margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; color: #94a3b8; font-size: 9.5px; }

  /* Salto de página antes de fotos */
  .page-break-before { page-break-before: always; }

</style>
</head>
<body>

<div class="download-bar">
  <span>Informe de Trabajo — ${order.vehicle.plate} · ${order.vehicle.client.name}</span>
  <button class="download-btn" onclick="window.print()">⬇ Descargar PDF</button>
</div>

<div class="page page-with-bar">

  <!-- HEADER -->
  <div class="header">
    <div>
      <div class="taller-nombre">${tallerNombre}</div>
      <div class="taller-sub">${tallerSubtitulo}</div>
      ${tallerTelefono || tallerDireccion || tallerEmail ? `
      <div class="taller-contact">
        ${tallerTelefono  ? `Tel: ${tallerTelefono}<br>` : ''}
        ${tallerDireccion ? `${tallerDireccion}<br>`      : ''}
        ${tallerEmail     ? `${tallerEmail}`              : ''}
      </div>` : ''}
    </div>
    <div class="doc-info">
      <div class="doc-tipo">Informe de Trabajo</div>
      <div class="doc-nro">N° ${order.id.slice(-8).toUpperCase()}</div>
      <div class="doc-fecha">Emisión: ${fecha(new Date())}</div>
      <div class="doc-fecha">Ingreso: ${fecha(order.entryDate)}</div>
    </div>
  </div>

  <!-- CLIENTE Y VEHÍCULO -->
  <div class="section grid2">
    <div>
      <div class="section-title">Datos del Cliente</div>
      <div class="data-row"><span class="data-label">Nombre</span><span class="data-value">${order.vehicle.client.name}</span></div>
      <div class="data-row"><span class="data-label">Teléfono</span><span class="data-value">${order.vehicle.client.phone || '—'}</span></div>
      ${order.vehicle.client.email ? `<div class="data-row"><span class="data-label">Email</span><span class="data-value">${order.vehicle.client.email}</span></div>` : ''}
      ${order.vehicle.client.dni   ? `<div class="data-row"><span class="data-label">DNI/CUIT</span><span class="data-value">${order.vehicle.client.dni}</span></div>` : ''}
    </div>
    <div>
      <div class="section-title">Datos del Vehículo</div>
      <div class="data-row"><span class="data-label">Patente</span><span class="data-value" style="font-size:13px;font-weight:700">${order.vehicle.plate}</span></div>
      <div class="data-row"><span class="data-label">Vehículo</span><span class="data-value">${order.vehicle.brand} ${order.vehicle.model}${order.vehicle.year ? ` (${order.vehicle.year})` : ''}</span></div>
      ${order.vehicle.km    ? `<div class="data-row"><span class="data-label">Kilometraje</span><span class="data-value">${order.vehicle.km.toLocaleString('es-AR')} km</span></div>` : ''}
      ${order.vehicle.color ? `<div class="data-row"><span class="data-label">Color</span><span class="data-value">${order.vehicle.color}</span></div>` : ''}
      ${order.vehicle.engineType ? `<div class="data-row"><span class="data-label">Motor</span><span class="data-value">${order.vehicle.engineType}${order.vehicle.displacement ? ' ' + order.vehicle.displacement : ''}${order.vehicle.engineCode ? ' — ' + order.vehicle.engineCode : ''}</span></div>` : ''}
    </div>
  </div>

  <!-- MOTIVO -->
  <div class="section">
    <div class="section-title">Motivo de Ingreso</div>
    <div class="highlight-box"><p>${order.motive}</p></div>
  </div>

  ${activeLights.length > 0 ? `
  <div class="section">
    <div class="section-title">Testigos Encendidos al Ingreso</div>
    <div class="chips">${activeLights.map(l => `<span class="chip chip-warning">${l}</span>`).join('')}</div>
  </div>` : ''}

  ${tracking ? `

  <!-- DIAGNÓSTICO -->
  <div class="section">
    <div class="section-title">Diagnóstico</div>

    ${scannedModules.length > 0 ? `
    <p style="font-size:10px;color:#64748b;margin-bottom:6px;font-weight:600">MÓDULOS ESCANEADOS</p>
    <div class="chips" style="margin-bottom:12px">
      ${scannedModules.map((m: string) => `<span class="chip chip-blue">${m}</span>`).join('')}
    </div>` : ''}

    ${tracking.dtcCodes.length > 0 ? `
    <p style="font-size:10px;color:#64748b;margin-bottom:6px;font-weight:600">CÓDIGOS DE FALLA (DTC)</p>
    <div class="chips" style="margin-bottom:12px">
      ${tracking.dtcCodes.map(d => `<span class="chip chip-dtc">${d.code}${d.description ? ` — ${d.description}` : ''}</span>`).join('')}
    </div>` : ''}

    ${measRows.length > 0 ? `
    <p style="font-size:10px;color:#64748b;margin-bottom:8px;font-weight:600">MEDICIONES ELÉCTRICAS</p>
    <div class="meas-grid" style="margin-bottom:12px">
      ${measRows.map(r => `
      <div class="meas-cell">
        <div class="meas-cell-label">${r.label}</div>
        <div class="meas-cell-value">${r.value}<span class="meas-cell-unit">${r.unit}</span></div>
      </div>`).join('')}
    </div>` : ''}

    ${tracking.rootCause ? `
    <p style="font-size:10px;color:#64748b;margin-bottom:4px;font-weight:600">CAUSA RAÍZ IDENTIFICADA</p>
    <div class="highlight-box" style="margin-bottom:12px;border-left-color:#dc2626;background:#fff7f7"><p style="font-weight:500">${tracking.rootCause}</p></div>` : ''}

    ${tracking.notes ? `
    <p style="font-size:10px;color:#64748b;margin-bottom:4px;font-weight:600">NOTAS DE DIAGNÓSTICO</p>
    <p style="font-size:11px;color:#334155;line-height:1.6">${tracking.notes}</p>` : ''}
  </div>

  ${tracking.diagnosticLog.length > 0 ? `
  <div class="section">
    <div class="section-title">Registro Técnico del Proceso</div>
    ${tracking.diagnosticLog.map(e => `
    <div class="log-entry">
      <span class="log-bullet">·</span>
      <span class="log-text">${e.text}</span>
    </div>`).join('')}
  </div>` : ''}
  ` : ''}

  ${order.notes ? `
  <div class="section">
    <div class="section-title">Trabajo Realizado</div>
    <div class="highlight-box" style="border-left-color:#059669;background:#f0fdf4"><p>${order.notes}</p></div>
  </div>` : ''}

  <!-- DETALLE PRESUPUESTO -->
  ${budgetItems.length > 0 ? `
  <div class="section">
    <div class="section-title">Detalle de Materiales y Servicios</div>
    <table>
      <thead>
        <tr>
          <th>Tipo</th><th>Descripción</th>
          <th class="right">Cant.</th><th class="right">P. unit.</th><th class="right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${budgetItems.map(item => `
        <tr>
          <td><span class="type-badge type-${item.type}">${typeLabels[item.type] ?? item.type}</span></td>
          <td>${item.description}</td>
          <td class="right">${item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(1)}</td>
          <td class="right">$${ars(item.price)}</td>
          <td class="right" style="font-weight:600">$${ars(item.price * item.quantity)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <div style="display:flex;justify-content:flex-end;margin-top:10px">
      <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:5px;padding:10px 20px;text-align:right;min-width:200px">
        <div style="font-size:10px;color:#64748b;margin-bottom:2px">TOTAL DEL TRABAJO</div>
        <div style="font-size:18px;font-weight:700;color:#166534">$${ars(totalPrecio)}</div>
      </div>
    </div>
  </div>` : order.budget ? `
  <div class="section">
    <div class="section-title">Presupuesto</div>
    <div style="display:flex;justify-content:flex-end">
      <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:5px;padding:10px 20px;text-align:right;min-width:200px">
        <div style="font-size:10px;color:#64748b;margin-bottom:2px">TOTAL DEL TRABAJO</div>
        <div style="font-size:18px;font-weight:700;color:#166534">$${ars(order.budget)}</div>
      </div>
    </div>
  </div>` : ''}

  ${showPagos && (totalPrecio > 0 || order.budget) ? `
  <div class="payment-box">
    <div class="payment-box-header">Resumen de Pago</div>
    <div class="payment-grid">
      <div class="payment-cell">
        <div class="payment-label">Total</div>
        <div class="payment-value val-blue">$${ars(totalPrecio || order.budget || 0)}</div>
      </div>
      <div class="payment-cell">
        <div class="payment-label">Abonado</div>
        <div class="payment-value val-green">$${ars(pagado)}</div>
      </div>
      <div class="payment-cell">
        <div class="payment-label">Saldo pendiente</div>
        <div class="payment-value ${saldo > 0 ? 'val-red' : 'val-green'}">$${ars(saldo)}</div>
      </div>
    </div>
  </div>` : ''}

  <!-- FIRMAS -->
  <div class="firma-grid">
    <div class="firma-line">Firma y aclaración del Cliente</div>
    <div class="firma-line">Firma y sello del Taller</div>
  </div>

  <!-- FOTOS DE INGRESO -->
  ${fotosIngreso.length > 0 ? `<div class="page-break-before"></div>${photosGrid(fotosIngreso, 'Fotografías de Ingreso del Vehículo')}` : ''}

  <!-- FOTOS DEL PROCESO -->
  ${fotosProceso.length > 0 ? photosGrid(fotosProceso, 'Fotografías del Proceso de Trabajo') : ''}

  <!-- SERVICIOS -->
  <div style="margin-top:28px;border:1.5px solid #e2e8f0;border-radius:6px;overflow:hidden">
    <div style="background:#0f172a;padding:8px 16px;text-align:center">
      <span style="color:#fff;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase">Nuestros Servicios</span>
    </div>
    <div style="padding:14px 20px;background:#f8fafc">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        ${[
          { icon: '⚙️', label: 'Reparación de ECUs' },
          { icon: '🖥️', label: 'Reparación de Tableros' },
          { icon: '🔌', label: 'Reparación de Fusibleras' },
          { icon: '🔑', label: 'Llaves Codificadas' },
          { icon: '💾', label: 'Reprogramaciones' },
          { icon: '🔧', label: 'Asistencia para Talleristas' },
        ].map(s => `
        <div style="display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #e2e8f0;border-radius:4px;padding:8px 10px">
          <span style="font-size:16px;line-height:1">${s.icon}</span>
          <span style="font-size:10.5px;font-weight:600;color:#1e2530">${s.label}</span>
        </div>`).join('')}
      </div>
      ${tallerTelefono || tallerEmail ? `
      <p style="text-align:center;margin-top:10px;font-size:10px;color:#64748b">
        Contactanos: ${[tallerTelefono, tallerEmail].filter(Boolean).join(' · ')}
      </p>` : ''}
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <span>${tallerNombre} — ${tallerSubtitulo}</span>
    <span>Ref: ${order.id.slice(-8).toUpperCase()} · Emitido: ${fecha(new Date())}</span>
  </div>

</div>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
