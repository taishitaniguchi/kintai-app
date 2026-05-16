'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'

export async function clockIn(): Promise<void> {
  const session = await verifySession()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const existing = await prisma.attendance.findFirst({
    where: {
      userId: session.userId,
      clockIn: { gte: today },
    },
  })

  if (existing) return

  await prisma.attendance.create({
    data: {
      userId: session.userId,
      clockIn: new Date(),
    },
  })

  revalidatePath('/dashboard')
  revalidatePath('/history')
}

export async function clockOut(): Promise<void> {
  const session = await verifySession()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const attendance = await prisma.attendance.findFirst({
    where: {
      userId: session.userId,
      clockIn: { gte: today },
      clockOut: null,
    },
  })

  if (!attendance) return

  await prisma.attendance.update({
    where: { id: attendance.id },
    data: { clockOut: new Date() },
  })

  revalidatePath('/dashboard')
  revalidatePath('/history')
}
