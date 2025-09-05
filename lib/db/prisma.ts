// lib/db/prisma.ts
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })
}

declare global {
  var prismaGlobal: PrismaClient | undefined
}

// En desarrollo, reutilizar la instancia global para evitar múltiples conexiones
// En producción, crear nueva instancia solo si no existe
const prisma = global.prismaGlobal || prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  global.prismaGlobal = prisma
}

export { prisma }