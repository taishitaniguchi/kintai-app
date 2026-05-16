import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { decrypt } from './session'

export const verifySession = cache(async () => {
  const cookie = (await cookies()).get('session')?.value
  const session = await decrypt(cookie)

  if (!session?.userId) {
    redirect('/login')
  }

  return { isAuth: true, userId: session.userId, role: session.role }
})

export const verifyAdminSession = cache(async () => {
  const session = await verifySession()
  if (session.role !== 'ADMIN') {
    redirect('/dashboard')
  }
  return session
})
