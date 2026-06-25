/**
 * Importación de datos: Icatronic — Marzo 2026
 * Ejecutar con: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-marzo.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseAmount(raw: string | undefined): number {
  if (!raw) return 0
  return parseInt(raw.replace(/[$.,]/g, '').trim()) || 0
}

function marzoDate(day: number): Date {
  return new Date(2026, 2, day, 10, 0, 0) // mes 2 = marzo (0-indexed)
}

// ── Datos de trabajos ─────────────────────────────────────────────────────────
const trabajos = [
  {
    clientName: 'Mariano',
    clientType: 'TALLER',
    vehicleDesc: 'Gol 1.6 2009',
    brand: 'Volkswagen', model: 'Gol 1.6', year: 2009,
    plate: 'ICA-M001',
    motive: 'No arranca',
    workDone: 'Programación transponder desde cajetín',
    budget: 250000, cost: 15000, paid: true, payMethod: 'VIRTUAL',
    notes: '', day: 3,
  },
  {
    clientName: 'Miguel Angel',
    clientType: 'CLIENTE',
    vehicleDesc: 'Peugeot 206 2003',
    brand: 'Peugeot', model: '206', year: 2003,
    plate: 'ICA-M002',
    motive: 'No anda velocímetro ni tacómetro',
    workDone: 'Reparación motores tablero',
    budget: 180000, cost: 0, paid: true, payMethod: 'VIRTUAL',
    notes: '', day: 3,
  },
  {
    clientName: 'Paulo Cortez',
    clientType: 'CLIENTE',
    vehicleDesc: 'Ford Focus 2017 GDI',
    brand: 'Ford', model: 'Focus GDI', year: 2017,
    plate: 'ICA-M003',
    motive: 'Falla',
    workDone: 'Diagnóstico y reseteo ECU falla sonda',
    budget: 120000, cost: 0, paid: true, payMethod: 'VIRTUAL',
    notes: 'Queda pendiente cambiar sonda', day: 4,
  },
  {
    clientName: 'Mariano',
    clientType: 'TALLER',
    vehicleDesc: 'Peugeot 308 2012',
    brand: 'Peugeot', model: '308', year: 2012,
    plate: 'ICA-M004',
    motive: 'Arranca y falla y se apaga',
    workDone: 'Baja presión de nafta — solo diagnóstico',
    budget: 90000, cost: 0, paid: true, payMethod: 'VIRTUAL',
    notes: '', day: 5,
  },
  {
    clientName: 'Santiago Berón',
    clientType: 'CLIENTE',
    vehicleDesc: 'Corsa 1.6',
    brand: 'Chevrolet', model: 'Corsa 1.6', year: null,
    plate: 'ICA-M005',
    motive: 'Falla',
    workDone: 'Ficha bobina — cambiar',
    budget: 60000, cost: 0, paid: true, payMethod: 'EFECTIVO',
    notes: '', day: 5,
  },
  {
    clientName: 'Wolves',
    clientType: 'AGENCIA',
    vehicleDesc: 'Peugeot Partner 2010',
    brand: 'Peugeot', model: 'Partner', year: 2010,
    plate: 'ICA-M006',
    motive: 'No arranca',
    workDone: 'Reprogramación de llave y copia de llave común',
    budget: 210000, cost: 15000, paid: true, payMethod: 'EFECTIVO',
    notes: 'Debo hacer la copia de llave', day: 6,
  },
  {
    clientName: 'Piston',
    clientType: 'TALLER',
    vehicleDesc: 'Corsa 1.6',
    brand: 'Chevrolet', model: 'Corsa 1.6', year: null,
    plate: 'ICA-M007',
    motive: 'Cuesta arrancar por la mañana',
    workDone: 'Se probó ECU y anda bien, se hizo diagnóstico y anda bien',
    budget: 50000, cost: 0, paid: true, payMethod: 'EFECTIVO',
    notes: '', day: 7,
  },
  {
    clientName: 'Sebastián MP Deportes',
    clientType: 'CLIENTE',
    vehicleDesc: 'Peugeot Partner 1.6 HDI',
    brand: 'Peugeot', model: 'Partner 1.6 HDI', year: null,
    plate: 'ICA-M008',
    motive: 'Se limita P1199',
    workDone: 'No se encontró la falla',
    budget: 140000, cost: 90000, paid: true, payMethod: 'VIRTUAL',
    notes: 'Solo se cobró combustible y sensores, transfirió +$50k extra', day: 8,
  },
  {
    clientName: 'Pedro Brunoldi',
    clientType: 'CLIENTE',
    vehicleDesc: 'Volkswagen Vento 2.5 2016',
    brand: 'Volkswagen', model: 'Vento 2.5', year: 2016,
    plate: 'ICA-M009',
    motive: 'Check encendido',
    workDone: 'Limpieza cuerpo y control de bujías',
    budget: 120000, cost: 0, paid: true, payMethod: 'VIRTUAL',
    notes: 'Se recomienda cambiar bujías urgente', day: 10,
  },
  {
    clientName: 'Amigo Águila',
    clientType: 'CLIENTE',
    vehicleDesc: 'Toyota Hilux 3.0',
    brand: 'Toyota', model: 'Hilux 3.0', year: null,
    plate: 'ICA-M010',
    motive: 'Copia de llave',
    workDone: 'Copia llave común',
    budget: 70000, cost: 10000, paid: true, payMethod: 'VIRTUAL',
    notes: '', day: 10,
  },
  {
    clientName: 'José Mangieri',
    clientType: 'TALLER',
    vehicleDesc: 'Ford Ranger 2018',
    brand: 'Ford', model: 'Ranger', year: 2018,
    plate: 'ICA-M011',
    motive: 'No arranca',
    workDone: 'Pin doblado en fusiblera motor — faltaba alimentación',
    budget: 90000, cost: 0, paid: true, payMethod: 'EFECTIVO',
    notes: '', day: 11,
  },
  {
    clientName: 'Wolves',
    clientType: 'AGENCIA',
    vehicleDesc: 'Jeep Renegade',
    brand: 'Jeep', model: 'Renegade', year: null,
    plate: 'ICA-M012',
    motive: 'Cambio carcasa',
    workDone: 'Cambio de carcasa',
    budget: 80000, cost: 35000, paid: false, payMethod: 'EFECTIVO',
    notes: '', day: 12,
  },
  {
    clientName: 'Sergio',
    clientType: 'TALLER',
    vehicleDesc: 'Chevrolet Cruze',
    brand: 'Chevrolet', model: 'Cruze', year: null,
    plate: 'ICA-M013',
    motive: 'Cuesta arrancar',
    workDone: 'RPM desconectado y fuera de punto + reparación cableado',
    budget: 120000, cost: 0, paid: false, payMethod: 'EFECTIVO',
    notes: '', day: 13,
  },
  {
    clientName: 'Fernando Martínez',
    clientType: 'CLIENTE',
    vehicleDesc: 'Volkswagen Bora 2.0 2012',
    brand: 'Volkswagen', model: 'Bora 2.0', year: 2012,
    plate: 'ICA-M014',
    motive: 'Falla en alta',
    workDone: 'Diagnóstico falla cilindro 1 — bobina',
    budget: 50000, cost: 0, paid: true, payMethod: 'EFECTIVO',
    notes: '', day: 14,
  },
  {
    clientName: 'Leo Ibáñez',
    clientType: 'CLIENTE',
    vehicleDesc: 'Volkswagen Vento 2011',
    brand: 'Volkswagen', model: 'Vento', year: 2011,
    plate: 'ICA-M015',
    motive: 'Luz check',
    workDone: 'Solo escaneo fallas cuerpo mariposa',
    budget: 30000, cost: 0, paid: true, payMethod: 'EFECTIVO',
    notes: '', day: 14,
  },
  {
    clientName: 'Faru',
    clientType: 'AGENCIA',
    vehicleDesc: 'Volkswagen Gol 1.6 2009',
    brand: 'Volkswagen', model: 'Gol 1.6', year: 2009,
    plate: 'ICA-M016',
    motive: 'Copia llave',
    workDone: 'Copia llave común',
    budget: 40000, cost: 10000, paid: true, payMethod: 'VIRTUAL',
    notes: '', day: 17,
  },
  {
    clientName: 'José Casco',
    clientType: 'CLIENTE',
    vehicleDesc: 'SsangYong Musso',
    brand: 'SsangYong', model: 'Musso', year: null,
    plate: 'ICA-M017',
    motive: 'No para',
    workDone: 'Manguera de vacío rota',
    budget: 90000, cost: 3000, paid: true, payMethod: 'EFECTIVO',
    notes: 'Copia de llave también', day: 18,
  },
  {
    clientName: 'Loco Corsa',
    clientType: 'CLIENTE',
    vehicleDesc: 'Chevrolet Corsa 2011',
    brand: 'Chevrolet', model: 'Corsa', year: 2011,
    plate: 'ICA-M018',
    motive: 'Falla tablero — se apaga',
    workDone: 'Falso contacto, limpieza cuerpo mariposa',
    budget: 80000, cost: 0, paid: true, payMethod: 'EFECTIVO',
    notes: '', day: 19,
  },
  {
    clientName: 'Martincho',
    clientType: 'TALLER',
    vehicleDesc: 'Volkswagen Bora 2012',
    brand: 'Volkswagen', model: 'Bora', year: 2012,
    plate: 'ICA-M019',
    motive: 'Escaneo por luz airbag',
    workDone: 'Se borró la falla solamente',
    budget: 30000, cost: 0, paid: true, payMethod: 'EFECTIVO',
    notes: '', day: 20,
  },
  {
    clientName: 'Piston',
    clientType: 'TALLER',
    vehicleDesc: 'Fiat Toro 2018',
    brand: 'Fiat', model: 'Toro', year: 2018,
    plate: 'ICA-M020',
    motive: 'Caja AT bloqueada',
    workDone: 'Se hizo alineación proxy y desbloqueó sola',
    budget: 80000, cost: 0, paid: true, payMethod: 'EFECTIVO',
    notes: '', day: 21,
  },
  {
    clientName: 'Sergio Topar',
    clientType: 'TALLER',
    vehicleDesc: 'Volkswagen Bora 2008',
    brand: 'Volkswagen', model: 'Bora', year: 2008,
    plate: 'ICA-M021',
    motive: 'Cuesta arrancar',
    workDone: 'Diagnóstico y reparación',
    budget: 300000, cost: 120000, paid: true, payMethod: 'EFECTIVO',
    notes: '', day: 24,
  },
  {
    clientName: 'Nacho Fox',
    clientType: 'TALLER',
    vehicleDesc: 'Volkswagen Bora 2005',
    brand: 'Volkswagen', model: 'Bora', year: 2005,
    plate: 'ICA-M022',
    motive: 'Se traba llave en el cilindro',
    workDone: 'Copia de llave común + tallado espadín para navaja',
    budget: 70000, cost: 15000, paid: true, payMethod: 'EFECTIVO',
    notes: '', day: 25,
  },
  {
    clientName: 'Pedro Saroff',
    clientType: 'CLIENTE',
    vehicleDesc: 'Chevrolet S10',
    brand: 'Chevrolet', model: 'S10', year: null,
    plate: 'ICA-M023',
    motive: 'No arranca',
    workDone: 'Fusible quemado de ECU',
    budget: 30000, cost: 100, paid: true, payMethod: 'VIRTUAL',
    notes: '', day: 26,
  },
]

// ── Gastos del mes ────────────────────────────────────────────────────────────
const gastos = [
  { category: 'Personal',          description: 'Almuerzo abuela',            amount: 83250,  day: 3  },
  { category: 'Personal',          description: 'Nafta Vento',                 amount: 50000,  day: 4  },
  { category: 'Materiales',        description: 'Gasoil Partner',              amount: 40000,  day: 5  },
  { category: 'Gastos del hogar',  description: 'Alquiler',                    amount: 380000, day: 5  },
  { category: 'Personal',          description: 'Carga gas',                   amount: 12500,  day: 6  },
  { category: 'Personal',          description: 'Carga gas',                   amount: 12600,  day: 7  },
  { category: 'Personal',          description: 'Roti',                        amount: 14000,  day: 8  },
  { category: 'Personal',          description: 'Compra super',                amount: 47030,  day: 9  },
  { category: 'Servicios',         description: 'Seguro auto',                 amount: 105455, day: 10 },
  { category: 'Servicios',         description: 'Tarjeta BNA y préstamo',      amount: 190000, day: 11 },
  { category: 'Gastos del hogar',  description: 'Milanesas',                   amount: 22000,  day: 12 },
  { category: 'Gastos del hogar',  description: 'Alimento perras',             amount: 21500,  day: 13 },
  { category: 'Gastos del hogar',  description: 'Bizcochos',                   amount: 1000,   day: 14 },
  { category: 'Personal',          description: 'GNC',                         amount: 11500,  day: 15 },
  { category: 'Servicios',         description: 'Pago tarjeta BBVA',           amount: 370000, day: 15 },
  { category: 'Gastos del hogar',  description: 'Alimento perras',             amount: 64300,  day: 17 },
  { category: 'Materiales',        description: 'Ficha para bobina Corsa',     amount: 3500,   day: 18 },
  { category: 'Gastos del hogar',  description: 'Carnicería',                  amount: 48000,  day: 19 },
  { category: 'Gastos del hogar',  description: 'Verdulería',                  amount: 11000,  day: 20 },
  { category: 'Gastos del hogar',  description: 'Compra super',                amount: 82900,  day: 21 },
  { category: 'Materiales',        description: 'Superchips y llave Toyota XN',amount: 81150,  day: 22 },
  { category: 'Gastos del hogar',  description: 'Compras',                     amount: 15000,  day: 24 },
  { category: 'Gastos del hogar',  description: 'Verdulería',                  amount: 7500,   day: 25 },
  { category: 'Gastos del hogar',  description: 'Verdulería',                  amount: 11000,  day: 25 },
  { category: 'Gastos del hogar',  description: 'Pollería',                    amount: 22000,  day: 26 },
  { category: 'Gastos del hogar',  description: 'Negocio',                     amount: 20000,  day: 27 },
  { category: 'Gastos del hogar',  description: 'Pinturería',                  amount: 24000,  day: 28 },
]

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Importando datos de Marzo 2026...\n')

  // Limpiar patentes previas de este import si se re-ejecuta
  const plates = trabajos.map(t => t.plate)
  const existing = await prisma.vehicle.findMany({ where: { plate: { in: plates } }, include: { workOrders: true } })
  for (const v of existing) {
    for (const wo of v.workOrders) {
      await prisma.workTracking.deleteMany({ where: { workOrderId: wo.id } })
      await prisma.budgetItem.deleteMany({ where: { workOrderId: wo.id } })
    }
    await prisma.workOrder.deleteMany({ where: { vehicleId: v.id } })
    await prisma.vehicle.delete({ where: { id: v.id } })
  }

  // Clientes únicos
  const clientMap = new Map<string, string>() // name → id

  for (const t of trabajos) {
    const key = t.clientName.toLowerCase()
    if (clientMap.has(key)) continue

    const existing = await prisma.client.findFirst({ where: { name: { equals: t.clientName } } })
    if (existing) {
      clientMap.set(key, existing.id)
    } else {
      const c = await prisma.client.create({
        data: { name: t.clientName, type: t.clientType },
      })
      clientMap.set(key, c.id)
    }
    console.log(`  ✔ Cliente: ${t.clientName}`)
  }

  // Vehículos y órdenes de trabajo
  let woCount = 0
  for (const t of trabajos) {
    const clientId = clientMap.get(t.clientName.toLowerCase())!
    const entryDate = marzoDate(t.day)

    const vehicle = await prisma.vehicle.create({
      data: {
        plate: t.plate,
        brand: t.brand,
        model: t.model,
        year: t.year,
        clientId,
      },
    })

    await prisma.workOrder.create({
      data: {
        vehicleId: vehicle.id,
        entryDate,
        motive: t.motive,
        notes: t.workDone + (t.notes ? `\n${t.notes}` : ''),
        budget: t.budget,
        amountPaid: t.paid ? t.budget : 0,
        paymentStatus: t.paid ? 'PAGADO' : 'PENDIENTE',
        workStatus: 'ENTREGADO',
      },
    })

    woCount++
    console.log(`  ✔ Trabajo: ${t.clientName} — ${t.brand} ${t.model} — $${t.budget.toLocaleString('es-AR')}`)
  }

  // Gastos
  let gastoCount = 0
  for (const g of gastos) {
    await prisma.expense.create({
      data: {
        category: g.category,
        description: g.description,
        amount: g.amount,
        date: marzoDate(g.day),
      },
    })
    gastoCount++
  }
  console.log(`\n  ✔ ${gastoCount} gastos importados`)

  // Resumen
  const totalIngresos = trabajos.reduce((s, t) => s + t.budget, 0)
  const totalGastos   = gastos.reduce((s, g) => s + g.amount, 0)
  console.log('\n─────────────────────────────────────')
  console.log(`✅ Importación completa`)
  console.log(`   Trabajos:  ${woCount}`)
  console.log(`   Ingresos:  $${totalIngresos.toLocaleString('es-AR')}`)
  console.log(`   Gastos:    $${totalGastos.toLocaleString('es-AR')}`)
  console.log(`   Neto:      $${(totalIngresos - totalGastos).toLocaleString('es-AR')}`)
  console.log('─────────────────────────────────────')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
