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

  const attendances = await prisma.attendance.findMany({
    where: {
      userId: session.userId,
      clockIn: { gte: startOfMonth, lte: endOfMonth },
    },
    orderBy: { clockIn: 'desc' },
  })

  const totalMinutes = attendances.reduce((sum, a) => {
    if (!a.clockOut) return sum
    return sum + differenceInMinutes(new Date(a.clockOut), new Date(a.clockIn))
  }, 0)

  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">勤怠履歴</h1>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">ダッシュボード</Link>
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
          <Link
            href={`/history?year=${prevMonth.year}&month=${prevMonth.month}`}
            className="text-sm text-blue-600 hover:underline"
          >
            ← 前月
          </Link>
          <h2 className="text-lg font-bold text-gray-800">
            {format(startOfMonth, 'yyyy年M月', { locale: ja })}
          </h2>
          <Link
            href={`/history?year=${nextMonth.year}&month=${nextMonth.month}`}
            className="text-sm text-blue-600 hover:underline"
          >
            翌月 →
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <p className="text-sm text-gray-500">今月の合計勤務時間</p>
          <p className="text-3xl font-bold text-gray-800">
            {Math.floor(totalMinutes / 60)}時間 {totalMinutes % 60}分
          </p>
          <p className="text-sm text-gray-500">{attendances.length} 日出勤</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">日付</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">出勤</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">退勤</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">勤務時間</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendances.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-gray-400">
                    記録がありません
                  </td>
                </tr>
              )}
              {attendances.map((a) => {
                const mins = a.clockOut
                  ? differenceInMinutes(new Date(a.clockOut), new Date(a.clockIn))
                  : null
                return (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">
                      {format(new Date(a.clockIn), 'M/d(E)', { locale: ja })}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-800">
                      {format(new Date(a.clockIn), 'HH:mm')}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-800">
                      {a.clockOut ? format(new Date(a.clockOut), 'HH:mm') : (
                        <span className="text-green-600 font-medium">出勤中</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {mins != null
                        ? `${Math.floor(mins / 60)}h${mins % 60}m`
                        : '—'}
                    </td>
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
