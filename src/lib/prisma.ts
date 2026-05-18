import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

// Extendemos el objeto global para cachear la instancia en desarrollo
// Esto evita crear múltiples conexiones con el hot reload de Next.js
const globalForPrisma = global as unknown as {
  prisma?: PrismaClient
  pool?: Pool
}

// Reutilizar el pool de conexiones si ya existe en el global
const pool =
  globalForPrisma.pool ??
  new Pool({ connectionString: process.env.DATABASE_URL })

const adapter = new PrismaPg(pool)

// Reutilizar el cliente Prisma si ya existe en el global
export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter })

// En desarrollo, guardar las instancias en el global para sobrevivir hot reloads
// En producción no hace falta porque el proceso no se reinicia
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
  globalForPrisma.pool = pool
}