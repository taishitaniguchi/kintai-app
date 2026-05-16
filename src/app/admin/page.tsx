import { verifyAdminSession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { format, differenceInMinutes } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  await verifyAdminSession()
  const params = await searchParams

  const now = new Date()
  const year = parseInt(params.year ?? String(now.getFullYear()))
  const month = parseInt(params.month ?? String(now.getMonth() + 1))

  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0, 23, 59, 59)

  const users = await prisma.user.findMany({
    where: { role: 'EMPLOYEE' },
    include: {
      attendances: {
        where: {
          clockIn: { gte: startOfMonth, lte: endOfMonth },
        },
        orderBy: { clockIn: 'desc' },
      },
    },
    orderBy: { name: 'asc' },
  })

  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }

  const taniguchiUsers = users.filter(u => u.team === 'taniguchi')
  const suzukaUsers = users.filter(u => u.team === 'suzuka')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">管理者画面</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">ダッシュボード</Link>
          <Link href="/admin/staff" className="text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors">スタッフ管理</Link>
          <Link href="/admin/shifts" className="text-sm bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 transition-colors">シフト管理</Link>
          <Link href="/admin/reservations" className="text-sm bg-orange-500 text-white px-3 py-1 rounded-lg hover:bg-orange-600 transition-colors">予約管理</Link>
          <a
            href={`/api/export?year=${year}&month=${month}&all=true`}
            className="text-sm bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors"
          >
            全員CSV
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href={`/admin?year=${prevMonth.year}&month=${prevMonth.month}`} className="text-sm text-blue-600 hover:underline">← 前月</Link>
          <h2 className="text-lg font-bold text-gray-800">{format(startOfMonth, 'yyyy年M月', { locale: ja })} 勤怠集計</h2>
          <Link href={`/admin?year=${nextMonth.year}&month=${nextMonth.month}`} className="text-sm text-blue-600 hover:underline">翌月 →</Link>
        </div>

        {[{ label: '谷口チーム', list: taniguchiUsers }, { label: '鈴鹿チーム', list: suzukaUsers }].map(({ label, list }) => (
          <div key={label} className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{label}</h3>
            <div className="space-y-4">
              {list.length === 0 && (
                <p className="text-sm text-gray-400 bg-white rounded-xl p-4">スタッフなし</p>
              )}
              {list.map((user) => {
                const totalMinutes = user.attendances.reduce((sum, a) => {
                  if (!a.clockOut) return sum
                  return sum + differenceInMinutes(new Date(a.clockOut), new Date(a.clockIn))
                }, 0)
                const wage = user.hourlyWage ?? 0
                const totalWage = Math.floor((totalMinutes / 60) * wage)

                return (
                  <div key={user.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-800">{user.name}</span>
                        <span className="text-xs text-gray-500 ml-2">{user.email}</span>
                      </div>
                      <div className="text-right text-sm">
                        <span className="font-bold text-gray-800">{Math.floor(totalMinutes / 60)}h{totalMinutes % 60}m</span>
                        <span className="text-gray-500 ml-2">/ {user.attendances.length}日</span>
                        {wage > 0 && (
                          <span className="text-green-700 font-bold ml-3">¥{totalWage.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-gray-100">
                        {user.attendances.length === 0 && (
                          <tr><td className="text-center py-4 text-gray-400">記録なし</td></tr>
                        )}
                        {user.attendances.slice(0, 5).map((a) => {
                          const mins = a.clockOut
                            ? differenceInMinutes(new Date(a.clockOut), new Date(a.clockIn))
                            : null
                          return (
                            <tr key={a.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-gray-700">{format(new Date(a.clockIn), 'M/d(E)', { locale: ja })}</td>
                              <td className="px-4 py-2 text-center">{format(new Date(a.clockIn), 'HH:mm')}</td>
                              <td className="px-4 py-2 text-center">
                                {a.clockOut ? format(new Date(a.clockOut), 'HH:mm') : <span className="text-green-600">出勤中</span>}
                              </td>
                              <td className="px-4 py-2 text-center text-gray-500">
                                {mins != null ? `${Math.floor(mins / 60)}h${mins % 60}m` : '—'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
