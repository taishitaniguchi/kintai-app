'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createSession, deleteSession } from '@/lib/session'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export type LoginState = { error?: string } | undefined

export async function login(state: LoginState, formData: FormData): Promise<LoginState> {
  const validated = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validated.success) {
    return { error: 'メールアドレスまたはパスワードが正しくありません' }
  }

  const { email, password } = validated.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    return { error: 'メールアドレスまたはパスワードが正しくありません' }
  }

  const passwordMatch = await bcrypt.compare(password, user.password)
  if (!passwordMatch) {
    return { error: 'メールアドレスまたはパスワードが正しくありません' }
  }

  await createSession(user.id, user.role)
  redirect('/dashboard')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
