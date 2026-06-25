import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
p.servicePrice.findMany().then(r => {
  console.log('Servicios en DB:', r.length)
  r.forEach(s => console.log(' -', s.name))
}).finally(() => p.$disconnect())
