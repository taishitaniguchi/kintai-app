import { PrismaClient } from '@/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient() {
  const url = process.env.TURSO_DATABASE_URL
    ?? `file:${path.resolve(process.cwd(), 'dev.db')}`

  const adapter = new PrismaLibSql({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  return new PrismaClient({ adapter } as never)
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
