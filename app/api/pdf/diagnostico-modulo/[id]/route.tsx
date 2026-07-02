import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function fmtDateTime(d: Date | string) {
  const dt = new Date(d)
  const dd = String(dt.getDate()).padStart(2, '0')
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const hh = String(dt.getHours()).padStart(2, '0')
  const min = String(dt.getMinutes()).padStart(2, '0')
  return `${dd}/${mm} ${hh}:${min}`
}
function fmtCurrency(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)
}

const WORK_TYPE: Record<string, string> = {
  DIAGNOSTICO: 'Diagnostico en banco',
  REPARACION: 'Reparacion',
  PROGRAMACION: 'Programacion',
}
const RESPONSE_LABEL: Record<string, string> = {
  OK: 'Responde normalmente',
  NO_RESPONSE: 'Sin respuesta',
  ERROR: 'Responde con errores',
  SHORT: 'Cortocircuito / fusible',
}
const FINAL_LABEL: Record<string, string> = {
  REPARADO: 'REPARADO',
  PROGRAMADO: 'PROGRAMADO',
  SIN_FALLA: 'SIN FALLA ENCONTRADA',
  NO_REPARABLE: 'NO REPARABLE',
  EN_PROCESO: 'EN PROCESO',
}
const FINAL_COLORS: Record<string, { border: string; text: string; bg: string }> = {
  REPARADO:     { border: '#16a34a', text: '#15803d', bg: '#f0fdf4' },
  PROGRAMADO:   { border: '#0891b2', text: '#0e7490', bg: '#ecfeff' },
  SIN_FALLA:    { border: '#2563eb', text: '#1d4ed8', bg: '#eff6ff' },
  NO_REPARABLE: { border: '#dc2626', text: '#b91c1c', bg: '#fef2f2' },
  EN_PROCESO:   { border: '#d97706', text: '#b45309', bg: '#fffbeb' },
}

// ─── styles ───────────────────────────────────────────────────────────────────

const A = '#0077aa'
const LBG = '#f0f7fb'
const TXT = '#1a1a1a'
const MUT = '#666666'
const BRD = '#d0dde4'
const W = '#ffffff'

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8.5,
    color: TXT,
    backgroundColor: W,
    paddingTop: 36,
    paddingBottom: 52,
    paddingHorizontal: 36,
    lineHeight: 1.4,
  },
  // header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: A, paddingBottom: 10, marginBottom: 14 },
  companyName: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: A, letterSpacing: 0.5 },
  companyTag: { fontSize: 7.5, color: MUT, marginTop: 3 },
  docTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: TXT, textAlign: 'right' },
  docNum: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: A, textAlign: 'right', marginTop: 2 },
  docMeta: { fontSize: 7.5, color: MUT, textAlign: 'right', marginTop: 2 },
  // info cards row
  infoRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  card: { flex: 1, backgroundColor: LBG, borderRadius: 4, padding: 8, borderLeftWidth: 3, borderLeftColor: A },
  cardLabel: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: A, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  cardTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: TXT },
  cardSub: { fontSize: 7.5, color: MUT, marginTop: 2 },
  cardSub2: { fontSize: 7.5, color: MUT, marginTop: 1 },
  // section
  section: { marginBottom: 10 },
  secHead: { backgroundColor: A, borderRadius: 3, paddingVertical: 4, paddingHorizontal: 8, marginBottom: 7 },
  secTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: W, textTransform: 'uppercase', letterSpacing: 1 },
  secBody: { paddingHorizontal: 4 },
  bodyText: { fontSize: 8.5, color: TXT, lineHeight: 1.5 },
  // check items
  checkRow: { flexDirection: 'row', gap: 14, flexWrap: 'wrap', marginBottom: 6 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cbOn:  { width: 10, height: 10, borderWidth: 1, borderRadius: 2, backgroundColor: '#dc2626', borderColor: '#dc2626', justifyContent: 'center', alignItems: 'center' },
  cbOff: { width: 10, height: 10, borderWidth: 1, borderRadius: 2, backgroundColor: W, borderColor: BRD },
  cbMark: { fontSize: 7, color: W, textAlign: 'center' },
  cbLabelOn:  { fontSize: 8, color: '#dc2626', fontFamily: 'Helvetica-Bold' },
  cbLabelOff: { fontSize: 8, color: MUT },
  // field row
  fieldRow: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  field: { flex: 1 },
  fieldLabel: { fontSize: 6.5, color: MUT, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldVal: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: TXT },
  fieldEmpty: { fontSize: 8.5, color: MUT },
  // DTC
  dtcRow: { flexDirection: 'row', gap: 10, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#eef0f2', alignItems: 'center' },
  dtcCode: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: A, width: 55, letterSpacing: 0.5 },
  dtcDesc: { fontSize: 8.5, color: TXT, flex: 1 },
  // table
  tHead: { flexDirection: 'row', backgroundColor: '#e4eef4', paddingVertical: 4, paddingHorizontal: 4, borderRadius: 2, marginBottom: 1 },
  tRow:  { flexDirection: 'row', paddingVertical: 3, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  tRowAlt: { flexDirection: 'row', paddingVertical: 3, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', backgroundColor: '#fafafa' },
  tHCell: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: MUT, textTransform: 'uppercase', letterSpacing: 0.3 },
  tCell:  { fontSize: 8, color: TXT },
  cellOK:   { fontSize: 8, color: '#16a34a', fontFamily: 'Helvetica-Bold' },
  cellFALL: { fontSize: 8, color: '#dc2626', fontFamily: 'Helvetica-Bold' },
  cellDUD:  { fontSize: 8, color: '#d97706', fontFamily: 'Helvetica-Bold' },
  // result badge
  resultWrap: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 5, borderWidth: 1.5, alignSelf: 'flex-start' },
  resultText: { fontSize: 12, fontFamily: 'Helvetica-Bold' },
  // log
  logEntry: { flexDirection: 'row', gap: 8, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f4f4f4' },
  logDate: { fontSize: 7, color: MUT, width: 48, flexShrink: 0, paddingTop: 1 },
  logText: { fontSize: 8.5, color: TXT, flex: 1, lineHeight: 1.4 },
  // footer
  footer: { position: 'absolute', bottom: 20, left: 36, right: 36, borderTopWidth: 1, borderTopColor: BRD, paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerL: { fontSize: 7, color: MUT },
  footerR: { fontSize: 7, color: A },
  // divider
  divider: { borderBottomWidth: 1, borderBottomColor: BRD, marginVertical: 8 },
  // empty notice
  emptyMsg: { fontSize: 8, color: MUT, paddingHorizontal: 4 },
})

// ─── PDF Component ────────────────────────────────────────────────────────────

function Checkbox({ checked, label }: { checked: boolean; label: string }) {
  return (
    <View style={s.checkItem}>
      <View style={checked ? s.cbOn : s.cbOff}>
        {checked && <Text style={s.cbMark}>X</Text>}
      </View>
      <Text style={checked ? s.cbLabelOn : s.cbLabelOff}>{label}</Text>
    </View>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={s.secHead}>
      <Text style={s.secTitle}>{title}</Text>
    </View>
  )
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      {value ? <Text style={s.fieldVal}>{value}</Text> : <Text style={s.fieldEmpty}>—</Text>}
    </View>
  )
}

function DiagnosticoPdf({ job, cfg }: { job: any; cfg: Record<string, string> }) {
  const tallerNombre = cfg.tallerNombre || 'ICATRONIC'
  const tallerTel    = cfg.tallerTelefono || cfg.tallerPhone || ''
  const tallerEmail  = cfg.tallerEmail || ''

  const clientName  = job.client?.name ?? job.techName ?? 'Sin nombre'
  const clientPhone = job.client?.phone ?? job.techPhone ?? null
  const vehicleInfo = [job.vehicleBrand, job.vehicleModel, job.vehicleYear].filter(Boolean).join(' ')

  const tracking = job.tracking ?? null
  const physical = tracking?.physicalInspection ? JSON.parse(tracking.physicalInspection) : null
  const pins: any[] = tracking?.pinMeasurements ? JSON.parse(tracking.pinMeasurements) : []
  const dtcCodes: any[] = tracking?.dtcCodes ?? []
  const logEntries: any[] = tracking?.diagnosticLog ?? []

  const finalResult = tracking?.finalResult ?? null
  const finalColors = finalResult ? (FINAL_COLORS[finalResult] ?? FINAL_COLORS.EN_PROCESO) : null

  return (
    <Document title={`Diagnostico ${job.orderNumber ? '#' + job.orderNumber : ''} - ${clientName}`} author={tallerNombre}>
      <Page size="A4" style={s.page}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View>
            <Text style={s.companyName}>{tallerNombre.toUpperCase()}</Text>
            <Text style={s.companyTag}>Electronica automotriz</Text>
            {tallerTel   && <Text style={s.companyTag}>Tel: {tallerTel}</Text>}
            {tallerEmail && <Text style={s.companyTag}>{tallerEmail}</Text>}
          </View>
          <View>
            <Text style={s.docTitle}>INFORME DE DIAGNOSTICO</Text>
            {job.orderNumber && <Text style={s.docNum}>#{String(job.orderNumber).padStart(4, '0')}</Text>}
            <Text style={s.docMeta}>Fecha de ingreso: {fmtDate(job.entryDate)}</Text>
            <Text style={s.docMeta}>Tipo de trabajo: {WORK_TYPE[job.workType] ?? job.workType}</Text>
            <Text style={s.docMeta}>Fecha de emision: {fmtDate(new Date())}</Text>
          </View>
        </View>

        {/* ── INFO CARDS ── */}
        <View style={s.infoRow}>
          {/* Cliente */}
          <View style={s.card}>
            <Text style={s.cardLabel}>Cliente</Text>
            <Text style={s.cardTitle}>{clientName}</Text>
            {clientPhone && <Text style={s.cardSub}>Tel: {clientPhone}</Text>}
            <Text style={s.cardSub2}>{job.clientType === 'TALLERISTA' ? 'Tallerista' : 'Particular'}</Text>
          </View>
          {/* Vehiculo */}
          <View style={s.card}>
            <Text style={s.cardLabel}>Vehiculo</Text>
            {vehicleInfo
              ? <Text style={s.cardTitle}>{vehicleInfo}</Text>
              : <Text style={s.fieldEmpty}>No especificado</Text>}
          </View>
          {/* Modulo(s) */}
          <View style={s.card}>
            <Text style={s.cardLabel}>{job.modules.length === 1 ? 'Modulo' : `Kit - ${job.modules.length} modulos`}</Text>
            {job.modules.map((m: any, i: number) => (
              <View key={m.id}>
                <Text style={s.cardTitle}>{m.moduleType.name}{m.moduleBrand ? ` - ${m.moduleBrand}` : ''}</Text>
                {m.partNumber   && <Text style={s.cardSub}>PN: {m.partNumber}</Text>}
                {m.serialNumber && <Text style={s.cardSub2}>S/N: {m.serialNumber}</Text>}
                {m.notes        && <Text style={s.cardSub2}>{m.notes}</Text>}
                {i < job.modules.length - 1 && <View style={{ marginTop: 4, borderTopWidth: 1, borderTopColor: BRD, paddingTop: 4 }} />}
              </View>
            ))}
          </View>
        </View>

        {/* ── MOTIVO ── */}
        <View style={s.section}>
          <SectionHeader title="Motivo de ingreso" />
          <View style={s.secBody}>
            <Text style={s.bodyText}>{job.motive || '—'}</Text>
          </View>
        </View>

        {/* ── INSPECCION FISICA ── */}
        {physical && (
          <View style={s.section}>
            <SectionHeader title="1. Inspeccion fisica" />
            <View style={s.secBody}>
              <View style={s.checkRow}>
                <Checkbox checked={!!physical.damage}           label="Dano fisico"          />
                <Checkbox checked={!!physical.corrosion}        label="Corrosion / humedad"  />
                <Checkbox checked={!!physical.burnedComponents} label="Componentes quemados" />
                <Checkbox checked={!!physical.connectorDamage}  label="Conectores danados"   />
              </View>
              {physical.description && <Text style={s.bodyText}>{physical.description}</Text>}
            </View>
          </View>
        )}

        {/* ── ALIMENTACION EN BANCO ── */}
        {tracking && (tracking.supplyVoltage || tracking.currentDraw || tracking.moduleResponse) && (
          <View style={s.section}>
            <SectionHeader title="2. Prueba de alimentacion en banco" />
            <View style={s.secBody}>
              <View style={s.fieldRow}>
                <Field label="Tension aplicada" value={tracking.supplyVoltage ? `${tracking.supplyVoltage} V` : null} />
                <Field label="Consumo de corriente" value={tracking.currentDraw ? `${tracking.currentDraw} mA` : null} />
                <Field label="Respuesta del modulo" value={tracking.moduleResponse ? RESPONSE_LABEL[tracking.moduleResponse] ?? tracking.moduleResponse : null} />
              </View>
            </View>
          </View>
        )}

        {/* ── PROTOCOLO Y COMUNICACION ── */}
        {tracking && (tracking.protocol || tracking.scannerConnected || tracking.softwareVersion || tracking.partNumber) && (
          <View style={s.section}>
            <SectionHeader title="3. Protocolo y comunicacion" />
            <View style={s.secBody}>
              <View style={s.fieldRow}>
                <Field label="Protocolo detectado" value={tracking.protocol} />
                <Field label="Conexion con escaner" value={tracking.scannerConnected === 'SI' ? 'Si' : tracking.scannerConnected === 'NO' ? 'No' : null} />
                <Field label="Version SW / FW" value={tracking.softwareVersion} />
                <Field label="Part Number (escaner)" value={tracking.partNumber} />
              </View>
            </View>
          </View>
        )}

        {/* ── CODIGOS DTC ── */}
        <View style={s.section}>
          <SectionHeader title="4. Codigos DTC" />
          <View style={s.secBody}>
            {dtcCodes.length === 0
              ? <Text style={s.emptyMsg}>Sin codigos DTC registrados</Text>
              : dtcCodes.map((d: any) => (
                <View key={d.id} style={s.dtcRow}>
                  <Text style={s.dtcCode}>{d.code}</Text>
                  <Text style={s.dtcDesc}>{d.description || '—'}</Text>
                </View>
              ))
            }
          </View>
        </View>

        {/* ── MEDICIONES EN PINES ── */}
        {pins.length > 0 && (
          <View style={s.section}>
            <SectionHeader title="5. Mediciones en pines" />
            <View style={s.secBody}>
              <View style={s.tHead}>
                <Text style={[s.tHCell, { flex: 3 }]}>Pin / Punto de prueba</Text>
                <Text style={[s.tHCell, { width: 48 }]}>Tipo</Text>
                <Text style={[s.tHCell, { width: 48 }]}>Medido</Text>
                <Text style={[s.tHCell, { width: 48 }]}>Esperado</Text>
                <Text style={[s.tHCell, { width: 52 }]}>Resultado</Text>
              </View>
              {pins.map((row: any, i: number) => (
                <View key={i} style={i % 2 === 0 ? s.tRow : s.tRowAlt}>
                  <Text style={[s.tCell, { flex: 3 }]}>{row.pin || '—'}</Text>
                  <Text style={[s.tCell, { width: 48 }]}>{row.tipo || '—'}</Text>
                  <Text style={[s.tCell, { width: 48 }]}>{row.medido || '—'}</Text>
                  <Text style={[s.tCell, { width: 48 }]}>{row.esperado || '—'}</Text>
                  <Text style={[
                    { width: 52 },
                    row.result === 'OK' ? s.cellOK : row.result === 'FALLA' ? s.cellFALL : row.result === 'DUDOSO' ? s.cellDUD : s.tCell,
                  ]}>
                    {row.result || '—'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── CAUSA RAIZ ── */}
        {tracking?.rootCause && (
          <View style={s.section}>
            <SectionHeader title="6. Causa raiz confirmada" />
            <View style={s.secBody}>
              <Text style={s.bodyText}>{tracking.rootCause}</Text>
            </View>
          </View>
        )}

        {/* ── RESULTADO FINAL ── */}
        {finalResult && finalColors && (
          <View style={s.section}>
            <SectionHeader title="7. Resultado final" />
            <View style={[s.secBody, { paddingTop: 4 }]}>
              <View style={[s.resultWrap, { borderColor: finalColors.border, backgroundColor: finalColors.bg }]}>
                <Text style={[s.resultText, { color: finalColors.text }]}>
                  {FINAL_LABEL[finalResult] ?? finalResult}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── BITACORA ── */}
        {logEntries.length > 0 && (
          <View style={s.section}>
            <SectionHeader title="8. Bitacora de diagnostico" />
            <View style={s.secBody}>
              {logEntries.map((e: any) => (
                <View key={e.id} style={s.logEntry}>
                  <Text style={s.logDate}>{fmtDateTime(e.createdAt)}</Text>
                  <Text style={s.logText}>{e.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── HALLAZGOS Y TRABAJO ── */}
        {(job.findings || job.workDone) && (
          <View style={s.section}>
            <SectionHeader title="9. Hallazgos y trabajo realizado" />
            <View style={s.secBody}>
              {job.findings && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={[s.fieldLabel, { marginBottom: 4 }]}>Hallazgos</Text>
                  <Text style={s.bodyText}>{job.findings}</Text>
                </View>
              )}
              {job.workDone && (
                <View>
                  <Text style={[s.fieldLabel, { marginBottom: 4 }]}>Trabajo realizado</Text>
                  <Text style={s.bodyText}>{job.workDone}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── PRESUPUESTO ── */}
        {(job.budget != null || job.amountPaid > 0) && (
          <View style={s.section}>
            <SectionHeader title="Informacion economica" />
            <View style={s.secBody}>
              <View style={s.fieldRow}>
                {job.budget != null && <Field label="Presupuesto" value={fmtCurrency(job.budget)} />}
                {job.amountPaid > 0 && <Field label="Monto pagado" value={fmtCurrency(job.amountPaid)} />}
                {job.budget != null && job.amountPaid > 0 && (
                  <Field label="Saldo pendiente" value={fmtCurrency(job.budget - job.amountPaid)} />
                )}
              </View>
            </View>
          </View>
        )}

        {/* ── FOOTER ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerL}>{tallerNombre} — Electronica automotriz</Text>
          <Text render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} de ${totalPages}`} style={s.footerR} />
        </View>

      </Page>
    </Document>
  )
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [job, configRows] = await Promise.all([
    prisma.moduleJob.findUnique({
      where: { id },
      include: {
        modules: { include: { moduleType: true }, orderBy: { createdAt: 'asc' } },
        client:  { select: { name: true, phone: true } },
        tracking: {
          include: {
            dtcCodes:      { orderBy: { createdAt: 'asc' } },
            diagnosticLog: { orderBy: { createdAt: 'asc' } },
          },
        },
      },
    }),
    prisma.config.findMany(),
  ])

  if (!job) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const cfg: Record<string, string> = {}
  configRows.forEach(c => { cfg[c.key] = c.value })

  const buffer = await renderToBuffer(<DiagnosticoPdf job={job} cfg={cfg} />)

  const filename = `diagnostico-${job.orderNumber ? String(job.orderNumber).padStart(4, '0') : id}.pdf`
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  })
}
