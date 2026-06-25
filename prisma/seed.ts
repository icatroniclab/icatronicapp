import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10)
  const operarioPassword = await bcrypt.hash('operario123', 10)

  await prisma.user.upsert({
    where: { email: 'admin@icatronic.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@icatronic.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  await prisma.user.upsert({
    where: { email: 'operario@icatronic.com' },
    update: {},
    create: {
      name: 'Operario',
      email: 'operario@icatronic.com',
      password: operarioPassword,
      role: 'OPERARIO',
    },
  })

  console.log('✅ Seed completado')
  console.log('   admin@icatronic.com / admin123')
  console.log('   operario@icatronic.com / operario123')
}

main().catch(console.error).finally(() => prisma.$disconnect())
