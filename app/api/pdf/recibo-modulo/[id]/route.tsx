import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function fmtCurrency(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n)
}

const WORK_TYPE: Record<string, string> = {
  DIAGNOSTICO: 'Diagnostico en banco',
  REPARACION: 'Reparacion',
  PROGRAMACION: 'Programacion',
}
const PAYMENT_STATUS: Record<string, string> = {
  PENDIENTE: 'PENDIENTE',
  SENA: 'SENA',
  PARCIAL: 'PARCIAL',
  PAGADO: 'PAGADO',
}
const PAYMENT_COLORS: Record<string, { border: string; text: string; bg: string }> = {
  PENDIENTE: { border: '#dc2626', text: '#b91c1c', bg: '#fef2f2' },
  SENA:      { border: '#d97706', text: '#b45309', bg: '#fffbeb' },
  PARCIAL:   { border: '#d97706', text: '#b45309', bg: '#fffbeb' },
  PAGADO:    { border: '#16a34a', text: '#15803d', bg: '#f0fdf4' },
}
const FINAL_LABEL: Record<string, string> = {
  REPARADO:     'Reparado',
  PROGRAMADO:   'Programado',
  SIN_FALLA:    'Sin falla encontrada',
  NO_REPARABLE: 'No reparable',
  EN_PROCESO:   'En proceso',
}

const A = '#0077aa'
const LBG = '#f0f7fb'
const TXT = '#1a1a1a'
const MUT = '#666666'
const BRD = '#d0dde4'
const W = '#ffffff'

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: TXT,
    backgroundColor: W,
    padding: 48,
    lineHeight: 1.5,
  },
  // header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: A, paddingBottom: 12, marginBottom: 20 },
  companyName: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: A, letterSpacing: 0.5 },
  companyTag: { fontSize: 8, color: MUT, marginTop: 3 },
  docTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: TXT, textAlign: 'right' },
  docNum: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: A, textAlign: 'right', marginTop: 3 },
  docMeta: { fontSize: 8, color: MUT, textAlign: 'right', marginTop: 2 },
  // info section
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  card: { flex: 1, backgroundColor: LBG, borderRadius: 4, padding: 10, borderLeftWidth: 3, borderLeftColor: A },
  cardLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: A, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  cardTitle: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: TXT },
  cardSub: { fontSize: 8.5, color: MUT, marginTop: 3 },
  // modules
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: A, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: BRD, paddingBottom: 4 },
  moduleRow: { flexDirection: 'row', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#eef0f2' },
  moduleName: { fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: TXT, flex: 2 },
  moduleSub: { fontSize: 8, color: MUT },
  // budget table
  tHead: { flexDirection: 'row', backgroundColor: '#e4eef4', paddingVertical: 5, paddingHorizontal: 6, borderRadius: 2, marginBottom: 1 },
  tRow:  { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  tRowAlt: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', backgroundColor: '#fafafa' },
  tHCell: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: MUT, textTransform: 'uppercase', letterSpacing: 0.3 },
  tCell:  { fontSize: 8.5, color: TXT },
  // totals
  totalsBox: { marginTop: 12, marginLeft: 'auto', width: 220 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#eef0f2' },
  totalLabel: { fontSize: 8.5, color: MUT },
  totalVal: { fontSize: 8.5, color: TXT, fontFamily: 'Helvetica-Bold' },
  totalFinalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, backgroundColor: A, paddingHorizontal: 8, borderRadius: 3, marginTop: 4 },
  totalFinalLabel: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: W },
  totalFinalVal: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: W },
  // status badge
  badgeWrap: { paddingVertical: 5, paddingHorizontal: 14, borderRadius: 4, borderWidth: 1.5, alignSelf: 'flex-start', marginTop: 8 },
  badgeText: { fontSize: 10, fontFamily: 'Helvetica-Bold' },
  // notes area
  notesBox: { marginTop: 20, borderTopWidth: 1, borderTopColor: BRD, paddingTop: 12 },
  notesLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: MUT, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 },
  notesText: { fontSize: 8.5, color: TXT, lineHeight: 1.5 },
  // signature
  sigRow: { flexDirection: 'row', gap: 40, marginTop: 48 },
  sigLine: { flex: 1, borderTopWidth: 1, borderTopColor: TXT, paddingTop: 6 },
  sigLabel: { fontSize: 7.5, color: MUT, textAlign: 'center' },
  // footer
  footer: { position: 'absolute', bottom: 24, left: 48, right: 48, borderTopWidth: 1, borderTopColor: BRD, paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  footerL: { fontSize: 7, color: MUT },
  footerR: { fontSize: 7, color: A },
})

function ReciboPdf({ job, budgetItems, cfg }: { job: any; budgetItems: any[]; cfg: Record<string, string> }) {
  const tallerNombre = cfg.tallerNombre || 'ICATRONIC'
  const tallerTel    = cfg.tallerTelefono || cfg.tallerPhone || ''
  const tallerEmail  = cfg.tallerEmail || ''

  const clientName  = job.client?.name ?? job.techName ?? 'Sin nombre'
  const clientPhone = job.client?.phone ?? job.techPhone ?? null
  const vehicleInfo = [job.vehicleBrand, job.vehicleModel, job.vehicleYear].filter(Boolean).join(' ')

  const paymentColors = PAYMENT_COLORS[job.paymentStatus] ?? PAYMENT_COLORS.PENDIENTE
  const finalResult = job.tracking?.finalResult ?? null

  const subtotal = budgetItems.reduce((acc: number, it: any) => acc + it.price * it.quantity, 0)

  return (
    <Document title={`Recibo ${job.orderNumber ? '#' + job.orderNumber : ''} - ${clientName}`} author={tallerNombre}>
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
            <Text style={s.docTitle}>RECIBO DE TRABAJO</Text>
            {job.orderNumber && <Text style={s.docNum}>#{String(job.orderNumber).padStart(4, '0')}</Text>}
            <Text style={s.docMeta}>Fecha de ingreso: {fmtDate(job.entryDate)}</Text>
            <Text style={s.docMeta}>Tipo de trabajo: {WORK_TYPE[job.workType] ?? job.workType}</Text>
            <Text style={s.docMeta}>Fecha de emision: {fmtDate(new Date())}</Text>
          </View>
        </View>

        {/* ── CLIENTE + VEHICULO ── */}
        <View style={s.infoRow} wrap={false}>
          <View style={s.card}>
            <Text style={s.cardLabel}>Cliente</Text>
            <Text style={s.cardTitle}>{clientName}</Text>
            {clientPhone && <Text style={s.cardSub}>Tel: {clientPhone}</Text>}
            <Text style={s.cardSub}>{job.clientType === 'TALLERISTA' ? 'Tallerista' : 'Particular'}</Text>
          </View>
          <View style={s.card}>
            <Text style={s.cardLabel}>Vehiculo</Text>
            {vehicleInfo
              ? <Text style={s.cardTitle}>{vehicleInfo}</Text>
              : <Text style={s.cardSub}>No especificado</Text>}
          </View>
        </View>

        {/* ── MODULOS ── */}
        <View style={{ marginBottom: 20 }}>
          <Text style={s.sectionTitle}>Modulo(s) ingresado(s)</Text>
          {job.modules.map((m: any) => (
            <View key={m.id} style={s.moduleRow} wrap={false}>
              <View style={{ flex: 1 }}>
                <Text style={s.moduleName}>{m.moduleType.name}{m.moduleBrand ? ` — ${m.moduleBrand}` : ''}</Text>
                {m.partNumber   && <Text style={s.moduleSub}>PN: {m.partNumber}</Text>}
                {m.serialNumber && <Text style={s.moduleSub}>S/N: {m.serialNumber}</Text>}
              </View>
            </View>
          ))}
        </View>

        {/* ── TRABAJO REALIZADO ── */}
        {(job.workDone || finalResult) && (
          <View style={{ marginBottom: 20 }}>
            <Text style={s.sectionTitle}>Trabajo realizado</Text>
            {job.workDone && <Text style={{ fontSize: 8.5, color: TXT, lineHeight: 1.5 }}>{job.workDone}</Text>}
            {finalResult && (
              <Text style={{ fontSize: 8.5, color: MUT, marginTop: 4 }}>
                Resultado: {FINAL_LABEL[finalResult] ?? finalResult}
              </Text>
            )}
          </View>
        )}

        {/* ── PRESUPUESTO DETALLADO ── */}
        {budgetItems.length > 0 && (
          <View style={{ marginBottom: 12 }}>
            <Text style={s.sectionTitle}>Detalle</Text>
            <View style={s.tHead}>
              <Text style={[s.tHCell, { flex: 3 }]}>Descripcion</Text>
              <Text style={[s.tHCell, { width: 40, textAlign: 'center' }]}>Cant.</Text>
              <Text style={[s.tHCell, { width: 70, textAlign: 'right' }]}>P. unit.</Text>
              <Text style={[s.tHCell, { width: 70, textAlign: 'right' }]}>Total</Text>
            </View>
            {budgetItems.map((it: any, i: number) => (
              <View key={it.id} style={i % 2 === 0 ? s.tRow : s.tRowAlt} wrap={false}>
                <Text style={[s.tCell, { flex: 3 }]}>{it.description}</Text>
                <Text style={[s.tCell, { width: 40, textAlign: 'center' }]}>{it.quantity}</Text>
                <Text style={[s.tCell, { width: 70, textAlign: 'right' }]}>{fmtCurrency(it.price)}</Text>
                <Text style={[s.tCell, { width: 70, textAlign: 'right' }]}>{fmtCurrency(it.price * it.quantity)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── TOTALES ── */}
        {job.budget != null && (
          <View style={s.totalsBox}>
            {budgetItems.length > 0 && Math.abs(subtotal - job.budget) > 0.01 && (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Subtotal</Text>
                <Text style={s.totalVal}>{fmtCurrency(subtotal)}</Text>
              </View>
            )}
            {job.amountPaid > 0 && (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Pagado</Text>
                <Text style={s.totalVal}>{fmtCurrency(job.amountPaid)}</Text>
              </View>
            )}
            {job.amountPaid > 0 && (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Saldo pendiente</Text>
                <Text style={s.totalVal}>{fmtCurrency(job.budget - job.amountPaid)}</Text>
              </View>
            )}
            <View style={s.totalFinalRow}>
              <Text style={s.totalFinalLabel}>TOTAL</Text>
              <Text style={s.totalFinalVal}>{fmtCurrency(job.budget)}</Text>
            </View>
            <View style={[s.badgeWrap, { borderColor: paymentColors.border, backgroundColor: paymentColors.bg }]}>
              <Text style={[s.badgeText, { color: paymentColors.text }]}>
                {PAYMENT_STATUS[job.paymentStatus] ?? job.paymentStatus}
              </Text>
            </View>
          </View>
        )}

        {/* ── NOTAS ── */}
        {job.notes && (
          <View style={s.notesBox}>
            <Text style={s.notesLabel}>Notas</Text>
            <Text style={s.notesText}>{job.notes}</Text>
          </View>
        )}

        {/* ── FIRMA ── */}
        <View style={s.sigRow}>
          <View style={s.sigLine}>
            <Text style={s.sigLabel}>Firma y aclaracion del cliente</Text>
          </View>
          <View style={s.sigLine}>
            <Text style={s.sigLabel}>{tallerNombre}</Text>
          </View>
        </View>

        {/* ── FOOTER ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerL}>{tallerNombre} — Electronica automotriz</Text>
          <Text render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} de ${totalPages}`} style={s.footerR} />
        </View>

      </Page>
    </Document>
  )
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [job, configRows] = await Promise.all([
    prisma.moduleJob.findUnique({
      where: { id },
      include: {
        modules: { include: { moduleType: true }, orderBy: { createdAt: 'asc' } },
        client:  { select: { name: true, phone: true } },
        budgetItems: { orderBy: { createdAt: 'asc' } },
        tracking: { select: { finalResult: true } },
      },
    }),
    prisma.config.findMany(),
  ])

  if (!job) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const cfg: Record<string, string> = {}
  configRows.forEach(c => { cfg[c.key] = c.value })

  const buffer = await renderToBuffer(
    <ReciboPdf job={job} budgetItems={job.budgetItems} cfg={cfg} />
  )

  const filename = `recibo-${job.orderNumber ? String(job.orderNumber).padStart(4, '0') : id}.pdf`
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  })
}
