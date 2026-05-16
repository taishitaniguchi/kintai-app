import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { clockIn, clockOut } from '@/app/actions/attendance'
import { logout } from '@/app/actions/auth'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

export default async function DashboardPage() {
  const session = await verifySession()

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, role: true },
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayAttendance = await prisma.attendance.findFirst({
    where: {
      userId: session.userId,
      clockIn: { gte: today },
    },
    orderBy: { clockIn: 'desc' },
  })

  const isClockedIn = !!todayAttendance && !todayAttendance.clockOut
  const isClockedOut = !!todayAttendance?.clockOut

  const now = new Date()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">勤怠管理システム</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user?.name}</span>
          {session.role === 'ADMIN' && (
            <a href="/admin" className="text-sm text-blue-600 hover:underline">管理者画面</a>
          )}
          <a href="/history" className="text-sm text-blue-600 hover:underline">履歴</a>
          <form action={logout}>
            <button type="submit" className="text-sm text-gray-500 hover:text-gray-700">
              ログアウト
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-md p-8 text-center">
          <p className="text-sm text-gray-500 mb-1">
            {format(now, 'yyyy年M月d日(E)', { locale: ja })}
          </p>
          <p className="text-5xl font-bold text-gray-800 mb-8">
            {format(now, 'HH:mm')}
          </p>

          {!isClockedIn && !isClockedOut && (
            <form action={clockIn}>
              <button
                type="submit"
                className="w-48 h-48 rounded-full bg-green-500 text-white text-2xl font-bold hover:bg-green-600 transition-colors shadow-lg"
              >
                出勤
              </button>
            </form>
          )}

          {isClockedIn && (
            <div className="space-y-4">
              <p className="text-green-600 font-medium">
                出勤中 — {todayAttendance && format(new Date(todayAttendance.clockIn), 'HH:mm')} から
              </p>
              <form action={clockOut}>
                <button
                  type="submit"
                  className="w-48 h-48 rounded-full bg-red-500 text-white text-2xl font-bold hover:bg-red-600 transition-colors shadow-lg"
                >
                  退勤
                </button>
              </form>
            </div>
          )}

          {isClockedOut && (
            <div className="space-y-2">
              <p className="text-gray-600 font-medium">本日は退勤済みです</p>
              {todayAttendance && (
                <p className="text-sm text-gray-500">
                  {format(new Date(todayAttendance.clockIn), 'HH:mm')} →{' '}
                  {todayAttendance.clockOut && format(new Date(todayAttendance.clockOut), 'HH:mm')}
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
