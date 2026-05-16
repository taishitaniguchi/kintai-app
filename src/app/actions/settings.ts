'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/dal'

export async function updateHourlyWage(formData: FormData): Promise<void> {
  const session = await verifySession()
  const raw = formData.get('hourlyWage')
  const wage = parseInt(String(raw), 10)

  if (isNaN(wage) || wage < 0) return

  await prisma.user.update({
    where: { id: session.userId },
    data: { hourlyWage: wage },
  })

  revalidatePath('/settings')
  revalidatePath('/calendar')
  revalidatePath('/history')
  redirect('/settings')
}
