import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { format, differenceInMinutes } from 'date-fns'

export async function GET(req: NextRequest) {
  const cookie = (await cookies()).get('session')?.value
  const session = await decrypt(cookie)

  if (!session?.userId) {
    return new Response(null, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()))
  const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1))
  const exportAll = searchParams.get('all') === 'true' && session.role === 'ADMIN'

  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0, 23, 59, 59)

  const attendances = await prisma.attendance.findMany({
    where: {
      ...(exportAll ? {} : { userId: session.userId }),
      clockIn: { gte: startOfMonth, lte: endOfMonth },
    },
    include: { user: { select: { name: true, email: true } } },
    orderBy: [{ user: { name: 'asc' } }, { clockIn: 'asc' }],
  })

  const header = exportAll
    ? '名前,メールアドレス,日付,出勤時刻,退勤時刻,勤務時間(分)\n'
    : '日付,出勤時刻,退勤時刻,勤務時間(分)\n'

  const rows = attendances.map((a) => {
    const mins = a.clockOut
      ? differenceInMinutes(new Date(a.clockOut), new Date(a.clockIn))
      : ''
    const date = format(new Date(a.clockIn), 'yyyy/MM/dd')
    const clockIn = format(new Date(a.clockIn), 'HH:mm')
    const clockOut = a.clockOut ? format(new Date(a.clockOut), 'HH:mm') : ''

    if (exportAll) {
      return `${a.user.name},${a.user.email},${date},${clockIn},${clockOut},${mins}`
    }
    return `${date},${clockIn},${clockOut},${mins}`
  })

  const csv = '﻿' + header + rows.join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="kintai_${year}${String(month).padStart(2, '0')}.csv"`,
    },
  })
}
