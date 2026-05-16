'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifyAdminSession } from '@/lib/dal'
import bcrypt from 'bcryptjs'

export async function createStaff(formData: FormData): Promise<void> {
  await verifyAdminSession()

  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '').trim()
  const team = String(formData.get('team') ?? 'taniguchi')
  const hourlyWage = parseInt(String(formData.get('hourlyWage') ?? '0'), 10)

  if (!name || !email || !password) return

  const hashed = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: 'EMPLOYEE',
      team,
      hourlyWage: isNaN(hourlyWage) ? 0 : hourlyWage,
    },
  })

  revalidatePath('/admin/staff')
  redirect('/admin/staff')
}

export async function updateStaff(formData: FormData): Promise<void> {
  await verifyAdminSession()

  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const team = String(formData.get('team') ?? 'taniguchi')
  const hourlyWage = parseInt(String(formData.get('hourlyWage') ?? '0'), 10)
  const newPassword = String(formData.get('password') ?? '').trim()

  if (!id || !name) return

  const data: { name: string; team: string; hourlyWage: number; password?: string } = {
    name,
    team,
    hourlyWage: isNaN(hourlyWage) ? 0 : hourlyWage,
  }

  if (newPassword) {
    data.password = await bcrypt.hash(newPassword, 10)
  }

  await prisma.user.update({ where: { id }, data })

  revalidatePath('/admin/staff')
  redirect('/admin/staff')
}

export async function createShift(formData: FormData): Promise<void> {
  await verifyAdminSession()

  const userId = String(formData.get('userId') ?? '')
  const facilityId = String(formData.get('facilityId') ?? '')
  const dateStr = String(formData.get('date') ?? '')
  const startTime = String(formData.get('startTime') ?? '').trim()
  const endTime = String(formData.get('endTime') ?? '').trim()
  const note = String(formData.get('note') ?? '').trim()

  if (!userId || !facilityId || !dateStr) return

  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return

  await prisma.shift.create({
    data: {
      userId,
      facilityId,
      date,
      startTime: startTime || null,
      endTime: endTime || null,
      note: note || null,
    },
  })

  revalidatePath('/admin/shifts')
  revalidatePath('/calendar')
  redirect('/admin/shifts')
}

export async function deleteShift(formData: FormData): Promise<void> {
  await verifyAdminSession()

  const id = String(formData.get('id') ?? '')
  if (!id) return

  await prisma.shift.delete({ where: { id } })

  revalidatePath('/admin/shifts')
  revalidatePath('/calendar')
  redirect('/admin/shifts')
}

export async function upsertReservation(formData: FormData): Promise<void> {
  await verifyAdminSession()

  const facilityId = String(formData.get('facilityId') ?? '')
  const dateStr = String(formData.get('date') ?? '')
  const guestCount = parseInt(String(formData.get('guestCount') ?? '0'), 10)
  const childChairs = parseInt(String(formData.get('childChairs') ?? '0'), 10)
  const babyBeds = parseInt(String(formData.get('babyBeds') ?? '0'), 10)
  const note = String(formData.get('note') ?? '').trim()

  if (!facilityId || !dateStr) return

  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return

  await prisma.reservation.upsert({
    where: { facilityId_date: { facilityId, date } },
    update: {
      guestCount: isNaN(guestCount) ? 0 : guestCount,
      childChairs: isNaN(childChairs) ? 0 : childChairs,
      babyBeds: isNaN(babyBeds) ? 0 : babyBeds,
      note: note || null,
    },
    create: {
      facilityId,
      date,
      guestCount: isNaN(guestCount) ? 0 : guestCount,
      childChairs: isNaN(childChairs) ? 0 : childChairs,
      babyBeds: isNaN(babyBeds) ? 0 : babyBeds,
      note: note || null,
    },
  })

  revalidatePath('/admin/reservations')
  revalidatePath('/calendar')
  redirect('/admin/reservations')
}

export async function deleteReservation(formData: FormData): Promise<void> {
  await verifyAdminSession()

  const id = String(formData.get('id') ?? '')
  if (!id) return

  await prisma.reservation.delete({ where: { id } })

  revalidatePath('/admin/reservations')
  revalidatePath('/calendar')
  redirect('/admin/reservations')
}
