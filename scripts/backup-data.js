// Exporta todos los datos de Neon a un archivo JSON local
// Uso: node --env-file=.env scripts/backup-data.js

const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')

const prisma = new PrismaClient()

async function backup() {
  console.log('Conectando a Neon...')

  const [
    clients, vehicles, workOrders, workTrackings, diagnosticEntries,
    dtcCodes, products, partsUsed, budgetItems, expenses, appointments,
    configs, servicePrices, quickJobs, presupuestos, diagnosticCases,
    moduleTypes, moduleJobs, moduleTrackings, moduleDtcCodes,
    moduleDiagEntries, moduleJobItems, moduleBudgetItems,
  ] = await Promise.all([
    prisma.client.findMany(),
    prisma.vehicle.findMany(),
    prisma.workOrder.findMany(),
    prisma.workTracking.findMany(),
    prisma.diagnosticEntry.findMany(),
    prisma.dtcCode.findMany(),
    prisma.product.findMany(),
    prisma.partUsed.findMany(),
    prisma.budgetItem.findMany(),
    prisma.expense.findMany(),
    prisma.appointment.findMany(),
    prisma.config.findMany(),
    prisma.servicePrice.findMany(),
    prisma.quickJob.findMany(),
    prisma.presupuesto.findMany(),
    prisma.diagnosticCase.findMany(),
    prisma.moduleType.findMany(),
    prisma.moduleJob.findMany(),
    prisma.moduleTracking.findMany(),
    prisma.moduleDtcCode.findMany(),
    prisma.moduleDiagEntry.findMany(),
    prisma.moduleJobItem.findMany(),
    prisma.moduleBudgetItem.findMany(),
  ])

  const data = {
    exportedAt: new Date().toISOString(),
    counts: {
      clients: clients.length,
      vehicles: vehicles.length,
      workOrders: workOrders.length,
      products: products.length,
      expenses: expenses.length,
      appointments: appointments.length,
      quickJobs: quickJobs.length,
      moduleJobs: moduleJobs.length,
    },
    clients, vehicles, workOrders, workTrackings, diagnosticEntries,
    dtcCodes, products, partsUsed, budgetItems, expenses, appointments,
    configs, servicePrices, quickJobs, presupuestos, diagnosticCases,
    moduleTypes, moduleJobs, moduleTrackings, moduleDtcCodes,
    moduleDiagEntries, moduleJobItems, moduleBudgetItems,
  }

  const fecha = new Date().toISOString().split('T')[0]
  const fileName = `backup-icatronic-${fecha}.json`
  const filePath = path.join(__dirname, '..', fileName)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))

  console.log(`\n✅ Backup guardado en: ${fileName}`)
  console.log('Registros exportados:')
  Object.entries(data.counts).forEach(([k, v]) => console.log(`  ${k}: ${v}`))

  await prisma.$disconnect()
}

backup().catch(async e => {
  console.error('Error:', e.message)
  await prisma.$disconnect()
  process.exit(1)
})
