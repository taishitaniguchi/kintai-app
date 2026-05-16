import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { format, differenceInMinutes } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const session = await verifySession()
  const params = await searchParams

  const now = new Date()
  const year = parseInt(params.year ?? String(now.getFullYear()))
  const month = parseInt(params.month ?? String(now.getMonth() + 1))

  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0, 23, 59, 59)

  const [attendances, user] = await Promise.all([
    prisma.attendance.findMany({
      where: {
        userId: session.userId,
        clockIn: { gte: startOfMonth, lte: endOfMonth },
      },
      orderBy: { clockIn: 'desc' },
    }),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { hourlyWage: true },
    }),
  ])

  const totalMinutes = attendances.reduce((sum, a) => {
    if (!a.clockOut) return sum
    return sum + differenceInMinutes(new Date(a.clockOut), new Date(a.clockIn))
  }, 0)

  const wage = user?.hourlyWage ?? 0
  const totalWage = Math.floor((totalMinutes / 60) * wage)

  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">勤怠履歴</h1>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">ダッシュボード</Link>
          <Link href="/calendar" className="text-sm text-blue-600 hover:underline">カレンダー</Link>
          <a
            href={`/api/export?year=${year}&month=${month}`}
            className="text-sm bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors"
          >
            CSVエクスポート
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href={`/history?year=${prevMonth.year}&month=${prevMonth.month}`} className="text-sm text-blue-600 hover:underline">← 前月</Link>
          <h2 className="text-lg font-bold text-gray-800">{format(startOfMonth, 'yyyy年M月', { locale: ja })}</h2>
          <Link href={`/history?year=${nextMonth.year}&month=${nextMonth.month}`} className="text-sm text-blue-600 hover:underline">翌月 →</Link>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">出勤日数</p>
            <p className="text-2xl font-bold text-gray-800">{attendances.length}<span className="text-sm text-gray-500"> 日</span></p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">合計勤務時間</p>
            <p className="text-2xl font-bold text-gray-800">
              {Math.floor(totalMinutes / 60)}<span className="text-sm text-gray-500">h</span>
              {totalMinutes % 60}<span className="text-sm text-gray-500">m</span>
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">今月の給与</p>
            {wage > 0 ? (
              <p className="text-2xl font-bold text-green-600">¥{totalWage.toLocaleString()}</p>
            ) : (
              <Link href="/settings" className="text-xs text-blue-500 hover:underline">時給を設定 →</Link>
            )}
          </div>
        </div>

        {wage > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 text-sm text-blue-700">
            時給 ¥{wage.toLocaleString()} × {(totalMinutes / 60).toFixed(1)}時間 = <span className="font-bold">¥{totalWage.toLocaleString()}</span>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">日付</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">出勤</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">退勤</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">勤務時間</th>
                {wage > 0 && <th className="text-center px-4 py-3 font-medium text-gray-600">給与</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendances.length === 0 && (
                <tr>
                  <td colSpan={wage > 0 ? 5 : 4} className="text-center py-8 text-gray-400">記録がありません</td>
                </tr>
              )}
              {attendances.map((a) => {
                const mins = a.clockOut
                  ? differenceInMinutes(new Date(a.clockOut), new Date(a.clockIn))
                  : null
                const dayWage = mins != null ? Math.floor((mins / 60) * wage) : null
                return (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">{format(new Date(a.clockIn), 'M/d(E)', { locale: ja })}</td>
                    <td className="px-4 py-3 text-center text-gray-800">{format(new Date(a.clockIn), 'HH:mm')}</td>
                    <td className="px-4 py-3 text-center text-gray-800">
                      {a.clockOut ? format(new Date(a.clockOut), 'HH:mm') : (
                        <span className="text-green-600 font-medium">出勤中</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {mins != null ? `${Math.floor(mins / 60)}h${mins % 60}m` : '—'}
                    </td>
                    {wage > 0 && (
                      <td className="px-4 py-3 text-center text-green-700 font-medium">
                        {dayWage != null ? `¥${dayWage.toLocaleString()}` : '—'}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
