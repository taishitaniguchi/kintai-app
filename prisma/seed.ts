import { PrismaLibSql } from '@prisma/adapter-libsql'
import { PrismaClient } from '../src/generated/prisma/client'
import bcrypt from 'bcryptjs'
import path from 'path'

const dbPath = path.resolve(process.cwd(), 'dev.db')
const adapter = new PrismaLibSql({ url: `file:${dbPath}` })
const prisma = new PrismaClient({ adapter } as never)

async function main() {
  const adminPassword = await bcrypt.hash('admin123', 10)
  const userPassword = await bcrypt.hash('user123', 10)

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: '管理者 太郎',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  await prisma.user.upsert({
    where: { email: 'user1@example.com' },
    update: {},
    create: {
      name: '山田 花子',
      email: 'user1@example.com',
      password: userPassword,
      role: 'EMPLOYEE',
    },
  })

  await prisma.user.upsert({
    where: { email: 'user2@example.com' },
    update: {},
    create: {
      name: '田中 一郎',
      email: 'user2@example.com',
      password: userPassword,
      role: 'EMPLOYEE',
    },
  })

  console.log('シードデータの投入が完了しました')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
