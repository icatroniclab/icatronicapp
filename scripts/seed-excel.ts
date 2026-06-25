/**
 * Importación masiva desde icatronic.xlsx
 * Ejecutar: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-excel.ts
 *
 * Hojas importadas (marzo 2026 ya fue importado previamente):
 *   Hoja 1     → Octubre 2024
 *   febrero    → Febrero 2025
 *   marzo      → Marzo 2025
 *   abril      → Abril 2025
 *   mayo       → Mayo 2025
 *   noviembre  → Noviembre 2025
 *   diciembre  → Diciembre 2025
 *   ene2026    → Enero 2026
 *   febrero 2026 → Febrero 2026
 */
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'

const prisma = new PrismaClient()

// ── Conversión fecha Excel → JS Date ─────────────────────────────────────────
function excelToDate(serial: any): Date | null {
  if (!serial || typeof serial !== 'number') return null
  return new Date((serial - 25569) * 86400 * 1000)
}

// ── Detectar marca desde descripción de vehículo ─────────────────────────────
function detectBrand(v: string): string {
  const s = v.toLowerCase()
  if (/\bgol\b|bora|\bvento\b|\bgolf\b|\bpolo\b|amarok|saveiro|up!/.test(s)) return 'Volkswagen'
  if (/corsa|cruze|\bs10\b|tracker|onix|agile|meriva|spin|chevrolet/.test(s)) return 'Chevrolet'
  if (/\bp\s?206\b|\bp\s?308\b|\bp\s?408\b|peugeot|\bpartner\b|3008/.test(s)) return 'Peugeot'
  if (/focus|ranger|\bfiesta\b|ecosport|territory|\bka\b/.test(s)) return 'Ford'
  if (/\bc3\b|\bc4\b|\bc5\b|berlingo|picasso|citroen|c\.4/.test(s)) return 'Citroën'
  if (/\buno\b|palio|siena|\bpunto\b|\btoro\b|strada|ducato|fiat|bravo/.test(s)) return 'Fiat'
  if (/kangoo|duster|sandero|\bclio\b|megane|renault|logan|kwid/.test(s)) return 'Renault'
  if (/corolla|hilux|\betios\b|yaris|toyota|sw4|rav4/.test(s)) return 'Toyota'
  if (/honda|\bcivic\b|\bfit\b|hrv|cr-v/.test(s)) return 'Honda'
  if (/nissan|frontier|\bmarch\b|kicks|versa/.test(s)) return 'Nissan'
  if (/jeep|renegade|compass|cherokee/.test(s)) return 'Jeep'
  if (/\bastra\b|vectra|zafira/.test(s)) return 'Chevrolet'
  if (/\bram\b|\bdodge\b/.test(s)) return 'RAM'
  if (/ssangyong|musso/.test(s)) return 'SsangYong'
  if (/\bkia\b|sportage|cerato/.test(s)) return 'Kia'
  if (/hyundai|tucson|accent/.test(s)) return 'Hyundai'
  if (/\bvw\b/.test(s)) return 'Volkswagen'
  return 'Sin marca'
}

function parseVehicle(raw: string) {
  const clean = raw.replace(/,/g, '.').trim()
  const yearMatch = clean.match(/\b(19|20)\d{2}\b/)
  const year = yearMatch ? parseInt(yearMatch[0]) : null
  const model = clean.replace(/\b(19|20)\d{2}\b/, '').replace(/\s+/g, ' ').trim() || clean
  const brand = detectBrand(clean)
  return { brand, model, year }
}

// ── Normalizar tipo de cliente ────────────────────────────────────────────────
function mapClientType(raw: string): string {
  const s = raw.toLowerCase().trim()
  if (s.includes('taller') || s.includes('tallerista') || s.includes('asistencia')) return 'TALLER'
  if (s.includes('agencia')) return 'AGENCIA'
  return 'CLIENTE'
}

// ── Caché de clientes ya creados ──────────────────────────────────────────────
const clientCache = new Map<string, string>()

async function getOrCreateClient(name: string, type: string): Promise<string> {
  const key = name.toLowerCase().trim()
  if (clientCache.has(key)) return clientCache.get(key)!
  const existing = await prisma.client.findFirst({ where: { name: { equals: name } } })
  if (existing) { clientCache.set(key, existing.id); return existing.id }
  const c = await prisma.client.create({ data: { name, type } })
  clientCache.set(key, c.id)
  return c.id
}

// ── Configuración de cada hoja ────────────────────────────────────────────────
const SHEETS: {
  name: string
  platePrefix: string
  defaultDate: Date
  vehicleCol: number  // 3 o 5
  problemaCol: number // 4 o 3
  trabajoCol: number  // 5 o 4
  hasCobrado: boolean
}[] = [
  { name: 'Hoja 1',       platePrefix: 'OCT24', defaultDate: new Date(2024, 9, 1),  vehicleCol: 5, problemaCol: 3, trabajoCol: 4, hasCobrado: false },
  { name: 'febrero',      platePrefix: 'FEB25', defaultDate: new Date(2025, 1, 1),  vehicleCol: 5, problemaCol: 3, trabajoCol: 4, hasCobrado: false },
  { name: 'marzo',        platePrefix: 'MAR25', defaultDate: new Date(2025, 2, 1),  vehicleCol: 3, problemaCol: 4, trabajoCol: 5, hasCobrado: false },
  { name: 'abril',        platePrefix: 'ABR25', defaultDate: new Date(2025, 3, 1),  vehicleCol: 3, problemaCol: 4, trabajoCol: 5, hasCobrado: false },
  { name: 'mayo',         platePrefix: 'MAY25', defaultDate: new Date(2025, 4, 1),  vehicleCol: 3, problemaCol: 4, trabajoCol: 5, hasCobrado: false },
  { name: 'noviembre',    platePrefix: 'NOV25', defaultDate: new Date(2025, 10, 1), vehicleCol: 3, problemaCol: 4, trabajoCol: 5, hasCobrado: true  },
  { name: 'diciembre',    platePrefix: 'DIC25', defaultDate: new Date(2025, 11, 1), vehicleCol: 3, problemaCol: 4, trabajoCol: 5, hasCobrado: true  },
  { name: 'ene2026',      platePrefix: 'ENE26', defaultDate: new Date(2026, 0, 1),  vehicleCol: 3, problemaCol: 4, trabajoCol: 5, hasCobrado: true  },
  { name: 'febrero 2026', platePrefix: 'FEB26', defaultDate: new Date(2026, 1, 1),  vehicleCol: 3, problemaCol: 4, trabajoCol: 5, hasCobrado: true  },
]

// ── Importar una hoja ─────────────────────────────────────────────────────────
async function importSheet(
  wb: XLSX.WorkBook,
  cfg: typeof SHEETS[0]
): Promise<{ jobs: number; ingresos: number }> {
  const ws = wb.Sheets[cfg.name]
  if (!ws) { console.log(`  ⚠ Hoja "${cfg.name}" no encontrada, saltando.`); return { jobs: 0, ingresos: 0 } }

  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
  const dataRows = rows.slice(1).filter(r => r[0] && String(r[0]).trim())

  // Limpiar placas previas del mismo prefijo si se re-ejecuta
  const prefix = `${cfg.platePrefix}-`
  const existingVehicles = await prisma.vehicle.findMany({
    where: { plate: { startsWith: prefix } },
    include: { workOrders: true },
  })
  for (const v of existingVehicles) {
    for (const wo of v.workOrders) {
      await prisma.workTracking.deleteMany({ where: { workOrderId: wo.id } })
      await prisma.budgetItem.deleteMany({ where: { workOrderId: wo.id } })
    }
    await prisma.workOrder.deleteMany({ where: { vehicleId: v.id } })
    await prisma.vehicle.delete({ where: { id: v.id } })
  }

  let count = 0
  let ingresos = 0

  for (let i = 0; i < dataRows.length; i++) {
    const r = dataRows[i]

    const nombre    = String(r[0]).trim()
    const tipoCliente = String(r[1]).trim()
    const vehicleRaw  = String(r[cfg.vehicleCol]).trim()
    const problema    = String(r[cfg.problemaCol]).trim()
    const trabajoDesc = String(r[cfg.trabajoCol]).trim()
    const dominio     = String(r[6]).trim()
    const notas       = String(r[8]).trim()
    const dateSerial  = r[9]
    const valor       = typeof r[11] === 'number' ? r[11] : 0
    const costo       = typeof r[12] === 'number' ? r[12] : 0
    const cobradoRaw  = cfg.hasCobrado ? String(r[16]).toLowerCase().trim() : 'si'
    const paid        = cobradoRaw === 'si' || cobradoRaw === 's'

    if (!nombre || !vehicleRaw) continue

    const entryDate = excelToDate(dateSerial) ?? cfg.defaultDate
    const plate     = dominio && dominio.length > 2
      ? dominio.toUpperCase().replace(/\s/g, '')
      : `${cfg.platePrefix}-${String(i + 1).padStart(3, '0')}`

    const { brand, model, year } = parseVehicle(vehicleRaw)
    const clientId = await getOrCreateClient(nombre, mapClientType(tipoCliente))

    // Si la placa ya existe (por dominio real), agregar orden al vehículo existente
    let vehicle = await prisma.vehicle.findUnique({ where: { plate } })
    if (!vehicle) {
      vehicle = await prisma.vehicle.create({
        data: { plate, brand, model, year, clientId },
      })
    }

    const motive = problema || trabajoDesc || 'Sin descripción'
    const notes  = [trabajoDesc, notas].filter(Boolean).join('\n')

    await prisma.workOrder.create({
      data: {
        vehicleId:     vehicle.id,
        entryDate,
        motive,
        notes,
        budget:        valor,
        amountPaid:    paid ? valor : 0,
        paymentStatus: paid ? 'PAGADO' : 'PENDIENTE',
        workStatus:    'ENTREGADO',
      },
    })

    count++
    ingresos += valor
    console.log(`    ✔ ${nombre} — ${brand} ${model}${year ? ` ${year}` : ''} — $${valor.toLocaleString('es-AR')}`)
  }

  return { jobs: count, ingresos }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const wb = XLSX.readFile('icatronic.xlsx')

  // Pre-cargar clientes ya existentes en caché
  const existingClients = await prisma.client.findMany()
  for (const c of existingClients) {
    clientCache.set(c.name.toLowerCase().trim(), c.id)
  }

  console.log('🚀 Importando datos históricos desde icatronic.xlsx\n')

  let totalJobs = 0
  let totalIngresos = 0

  const monthNames: Record<string, string> = {
    'Hoja 1':       'Octubre 2024',
    'febrero':      'Febrero 2025',
    'marzo':        'Marzo 2025',
    'abril':        'Abril 2025',
    'mayo':         'Mayo 2025',
    'noviembre':    'Noviembre 2025',
    'diciembre':    'Diciembre 2025',
    'ene2026':      'Enero 2026',
    'febrero 2026': 'Febrero 2026',
  }

  for (const cfg of SHEETS) {
    console.log(`\n📅 ${monthNames[cfg.name]} (${cfg.name})`)
    const { jobs, ingresos } = await importSheet(wb, cfg)
    totalJobs += jobs
    totalIngresos += ingresos
    console.log(`   → ${jobs} trabajos | $${ingresos.toLocaleString('es-AR')} facturado`)
  }

  console.log('\n══════════════════════════════════════════')
  console.log(`✅ Importación completa`)
  console.log(`   Total trabajos: ${totalJobs}`)
  console.log(`   Total facturado: $${totalIngresos.toLocaleString('es-AR')}`)
  console.log('══════════════════════════════════════════')
}

main()
  .catch(e => { console.error('❌ Error:', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
