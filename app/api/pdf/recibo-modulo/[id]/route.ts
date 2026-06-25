import { auth } from '@/auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function fecha(d: Date | string) {
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const WORK_TYPE_LABEL: Record<string, string> = {
  DIAGNOSTICO:  'Diagnóstico en banco',
  REPARACION:   'Reparación',
  PROGRAMACION: 'Programación / Codificación',
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params

  const [job, config] = await Promise.all([
    prisma.moduleJob.findUnique({
      where: { id },
      include: {
        modules: { include: { moduleType: true }, orderBy: { createdAt: 'asc' } },
        client:  { select: { id: true, name: true, phone: true } },
      },
    }),
    prisma.config.findMany(),
  ])

  if (!job) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const cfg: Record<string, string> = {}
  config.forEach(c => { cfg[c.key] = c.value })

  const tallerNombre    = cfg.tallerNombre    || 'ICATRONIC'
  const tallerSubtitulo = cfg.tallerSubtitulo || 'Laboratorio de Electrónica Automotriz'
  const tallerTelefono  = cfg.tallerTelefono  || ''
  const tallerDireccion = cfg.tallerDireccion || ''
  const tallerEmail     = cfg.tallerEmail     || ''

  const clientName  = job.client?.name  ?? job.techName  ?? 'Sin nombre'
  const clientPhone = job.client?.phone ?? job.techPhone ?? ''
  const vehicleInfo = [job.vehicleBrand, job.vehicleModel, job.vehicleYear].filter(Boolean).join(' ')
  const tipoTrabajo = WORK_TYPE_LABEL[job.workType] ?? job.workType
  const nroOrden    = job.orderNumber ? String(job.orderNumber) : '—'

  const modulesRows = job.modules.map((m, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${m.moduleType.name}</strong></td>
      <td>${m.moduleBrand   || '—'}</td>
      <td>${m.partNumber    || '—'}</td>
      <td>${m.serialNumber  || '—'}</td>
      <td>${m.notes         || ''}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Recibo de ingreso #${nroOrden}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; background: #fff; }

    /* ── Barra de descarga (oculta al imprimir) ── */
    #download-bar {
      position: fixed; top: 0; left: 0; right: 0;
      background: #1a1d27; padding: 10px 20px;
      display: flex; align-items: center; gap: 12px;
      z-index: 999; border-bottom: 1px solid #2d3148;
    }
    #download-bar button {
      background: #00e5ff; color: #000; border: none;
      padding: 7px 18px; border-radius: 6px; font-weight: bold;
      font-size: 13px; cursor: pointer;
    }
    #download-bar span { color: #9ca3af; font-size: 13px; }
    @media print { #download-bar { display: none !important; } }

    /* ── Contenido ── */
    .page { max-width: 720px; margin: 70px auto 40px; padding: 0 20px; }
    @media print { .page { margin: 0; padding: 20px; } }

    /* Header */
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #1a1a1a; }
    .taller-name { font-size: 22px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; }
    .taller-sub  { font-size: 11px; color: #555; margin-top: 2px; }
    .taller-info { font-size: 11px; color: #555; margin-top: 6px; line-height: 1.6; }
    .orden-box { text-align: right; }
    .orden-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
    .orden-num   { font-size: 32px; font-weight: 900; color: #000; line-height: 1; }
    .orden-fecha { font-size: 11px; color: #555; margin-top: 4px; }

    /* Título recibo */
    .recibo-title { font-size: 15px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #333; margin-bottom: 20px; border-left: 4px solid #000; padding-left: 10px; }

    /* Secciones */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .field-block { }
    .field-label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 2px; }
    .field-value { font-size: 13px; font-weight: 600; color: #111; }
    .field-value.light { font-weight: 400; color: #333; }

    /* Tabla de módulos */
    .section-title { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #555; margin: 20px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead tr { background: #f0f0f0; }
    th { text-align: left; padding: 6px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #555; font-weight: 700; }
    td { padding: 7px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    td:first-child { color: #888; font-size: 11px; width: 28px; text-align: center; }

    /* Motivo */
    .motive-box { background: #f7f7f7; border-left: 3px solid #ccc; padding: 10px 14px; border-radius: 0 4px 4px 0; font-size: 12px; line-height: 1.6; color: #333; margin-bottom: 20px; }

    /* Firma */
    .firmas { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
    .firma-box { border-top: 1px solid #999; padding-top: 6px; }
    .firma-label { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
    .firma-img { height: 64px; object-fit: contain; object-position: left bottom; margin-bottom: 4px; display: block; }

    /* Footer */
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 12px; }

    /* Aviso */
    .aviso { margin-top: 20px; background: #fffbe6; border: 1px solid #f0d060; border-radius: 4px; padding: 10px 14px; font-size: 11px; color: #7a6000; line-height: 1.5; }
  </style>
</head>
<body>

  <div id="download-bar">
    <button onclick="window.print()">⬇ Descargar / Imprimir PDF</button>
    <span>Recibo de ingreso de módulos · #${nroOrden}</span>
  </div>

  <div class="page">

    <!-- Header -->
    <div class="header">
      <div>
        <div class="taller-name">${tallerNombre}</div>
        <div class="taller-sub">${tallerSubtitulo}</div>
        <div class="taller-info">
          ${tallerTelefono  ? `Tel: ${tallerTelefono}<br>` : ''}
          ${tallerEmail     ? `${tallerEmail}<br>`         : ''}
          ${tallerDireccion ? `${tallerDireccion}`         : ''}
        </div>
      </div>
      <div class="orden-box">
        <div class="orden-label">Orden N.°</div>
        <div class="orden-num">${nroOrden}</div>
        <div class="orden-fecha">Ingreso: ${fecha(job.entryDate)}</div>
      </div>
    </div>

    <div class="recibo-title">Recibo de ingreso de módulos</div>

    <!-- Datos del cliente y vehículo -->
    <div class="grid-2">
      <div>
        <div class="field-label">Cliente / Taller</div>
        <div class="field-value">${clientName}</div>
        ${clientPhone ? `<div class="field-value light">${clientPhone}</div>` : ''}
        <div class="field-value light" style="font-size:11px;color:#888;">${job.clientType === 'TALLERISTA' ? 'Tallerista' : 'Particular'}</div>
      </div>
      <div>
        <div class="field-label">Vehículo</div>
        <div class="field-value">${vehicleInfo || '<span style="color:#aaa;font-weight:400;">No especificado</span>'}</div>
        <div class="field-label" style="margin-top:10px;">Tipo de trabajo</div>
        <div class="field-value">${tipoTrabajo}</div>
      </div>
    </div>

    <!-- Motivo -->
    <div class="field-label">Motivo de ingreso</div>
    <div class="motive-box">${job.motive}</div>

    <!-- Tabla de módulos -->
    <div class="section-title">Módulos ingresados (${job.modules.length})</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Módulo</th>
          <th>Marca</th>
          <th>Part Number</th>
          <th>N.° Serie</th>
          <th>Observaciones</th>
        </tr>
      </thead>
      <tbody>
        ${modulesRows}
      </tbody>
    </table>

    <!-- Aviso -->
    <div class="aviso">
      ⚠ Los módulos ingresados quedan bajo resguardo del taller durante el período de diagnóstico/reparación. En caso de no retirar el trabajo en un plazo de 30 días, el taller no se responsabiliza por la pérdida o deterioro de las piezas.
    </div>

    <!-- Firmas -->
    <div class="firmas">
      <div class="firma-box">
        <div class="firma-label">Firma del cliente</div>
      </div>
      <div class="firma-box">
        <img src="/firma.png" alt="Firma del taller" class="firma-img" />
        <div class="firma-label">Firma y sello del taller</div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      ${tallerNombre} · ${tallerSubtitulo}${tallerTelefono ? ` · Tel: ${tallerTelefono}` : ''}${tallerEmail ? ` · ${tallerEmail}` : ''}
    </div>

  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
