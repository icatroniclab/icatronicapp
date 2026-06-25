import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SERVICES = [
  { name: 'Diagnóstico ECU simples',           order: 1,  priceNaftaTaller: 46833.33,  priceDieselTaller: 93666.67,  priceNaftaParticular: 45662.50,  priceDieselParticular: 91325.00,  usdTaller: 33.33, usdParticular: 65   },
  { name: 'Diagnóstico ECUs complejas',         order: 2,  priceNaftaTaller: 93666.67,  priceDieselTaller: 140500.00, priceNaftaParticular: 145517.86, priceDieselParticular: 195696.43, usdTaller: 66.67, usdParticular: 139.29 },
  { name: 'Diagnóstico Fusibleras simples',     order: 3,  priceNaftaTaller: 55196.43,  priceDieselTaller: null,      priceNaftaParticular: 75653.85,  priceDieselParticular: null,       usdTaller: 39.29, usdParticular: 53.85 },
  { name: 'Diagnóstico Fusibleras complejas',   order: 4,  priceNaftaTaller: 84300.00,  priceDieselTaller: null,      priceNaftaParticular: 112400.00, priceDieselParticular: null,       usdTaller: 60,    usdParticular: 80   },
  { name: 'Copia llave simple',                 order: 5,  priceNaftaTaller: 54038.46,  priceDieselTaller: null,      priceNaftaParticular: 70250.00,  priceDieselParticular: null,       usdTaller: 38.46, usdParticular: 50   },
  { name: 'Copia llave telemando',              order: 6,  priceNaftaTaller: 108076.92, priceDieselTaller: null,      priceNaftaParticular: 140500.00, priceDieselParticular: null,       usdTaller: 76.92, usdParticular: 100  },
  { name: 'Diagnóstico simple (escaneo)',       order: 7,  priceNaftaTaller: 54038.46,  priceDieselTaller: null,      priceNaftaParticular: 70250.00,  priceDieselParticular: null,       usdTaller: 38.46, usdParticular: 50   },
  { name: 'Diagnóstico medio nafta/diesel básico', order: 8, priceNaftaTaller: 108076.92, priceDieselTaller: null,   priceNaftaParticular: 140500.00, priceDieselParticular: null,       usdTaller: 76.92, usdParticular: 100  },
  { name: 'Diagnóstico avanzado (diesel)',      order: 9,  priceNaftaTaller: 183730.77, priceDieselTaller: null,      priceNaftaParticular: 238850.00, priceDieselParticular: null,       usdTaller: 130.77, usdParticular: 170 },
  { name: 'Hora de trabajo',                    order: 10, priceNaftaTaller: 75653.85,  priceDieselTaller: null,      priceNaftaParticular: 98350.00,  priceDieselParticular: null,       usdTaller: 53.85, usdParticular: 70   },
]

async function main() {
  console.log('Cargando tarifario...')

  // Limpiar previos
  await prisma.servicePrice.deleteMany()

  for (const s of SERVICES) {
    await prisma.servicePrice.create({ data: s })
    console.log(`  ✔ ${s.name}`)
  }

  // Cotización inicial
  await prisma.config.upsert({
    where: { key: 'exchangeRate' },
    update: { value: '1405' },
    create: { key: 'exchangeRate', value: '1405' },
  })
  console.log('\n✅ Tarifario cargado. Cotización inicial: $1405')
}

main()
  .catch(e => { console.error('❌', e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
