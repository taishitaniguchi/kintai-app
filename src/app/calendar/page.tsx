import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { format, differenceInMinutes, getDaysInMonth, startOfMonth, getDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>
}) {
  const session = await verifySession()
  const params = await searchParams

  const now = new Date()
  const year = parseInt(params.year ?? String(now.getFullYear()))
  const month = parseInt(params.month ?? String(now.getMonth() + 1))

  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59)
  const daysInMonth = getDaysInMonth(start)
  const firstDayOfWeek = getDay(startOfMonth(start)) // 0=日

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, hourlyWage: true },
  })

  const attendances = await prisma.attendance.findMany({
    where: {
      userId: session.userId,
      clockIn: { gte: start, lte: end },
    },
  })

  // 日付 → 勤怠レコードのマップ
  const attendanceMap = new Map<number, { clockIn: Date; clockOut: Date | null; mins: number }>()
  for (const a of attendances) {
    const day = new Date(a.clockIn).getDate()
    const mins = a.clockOut
      ? differenceInMinutes(new Date(a.clockOut), new Date(a.clockIn))
      : 0
    attendanceMap.set(day, {
      clockIn: new Date(a.clockIn),
      clockOut: a.clockOut ? new Date(a.clockOut) : null,
      mins,
    })
  }

  const totalMinutes = Array.from(attendanceMap.values()).reduce((s, a) => s + a.mins, 0)
  const totalHours = totalMinutes / 60
  const wage = user?.hourlyWage ?? 0
  const totalWage = Math.floor(totalHours * wage)

  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }

  const WEEK_DAYS = ['日', '月', '火', '水', '木', '金', '土']

  // カレンダーのグリッド（空白 + 日付）
  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">カレンダー</h1>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">ダッシュボード</Link>
          <Link href="/history" className="text-sm text-blue-600 hover:underline">履歴</Link>
          <Link href="/settings" className="text-sm text-blue-600 hover:underline">設定</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* 月ナビゲーション */}
        <div className="flex items-center justify-between mb-4">
          <Link
            href={`/calendar?year=${prevMonth.year}&month=${prevMonth.month}`}
            className="text-sm text-blue-600 hover:underline"
          >
            ← 前月
          </Link>
          <h2 className="text-lg font-bold text-gray-800">
            {format(start, 'yyyy年M月', { locale: ja })}
          </h2>
          <Link
            href={`/calendar?year=${nextMonth.year}&month=${nextMonth.month}`}
            className="text-sm text-blue-600 hover:underline"
          >
            翌月 →
          </Link>
        </div>

        {/* 月次サマリー */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500 mb-1">出勤日数</p>
            <p className="text-2xl font-bold text-gray-800">{attendanceMap.size}<span className="text-sm font-normal text-gray-500"> 日</span></p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">合計勤務時間</p>
            <p className="text-2xl font-bold text-gray-800">
              {Math.floor(totalMinutes / 60)}<span className="text-sm font-normal text-gray-500">h</span>
              {totalMinutes % 60}<span className="text-sm font-normal text-gray-500">m</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">今月の給与</p>
            {wage > 0 ? (
              <p className="text-2xl font-bold text-green-600">
                ¥{totalWage.toLocaleString()}
              </p>
            ) : (
              <Link href="/settings" className="text-sm text-blue-500 hover:underline">
                時給を設定する
              </Link>
            )}
          </div>
        </div>

        {/* カレンダーグリッド */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 border-b">
            {WEEK_DAYS.map((d, i) => (
              <div
                key={d}
                className={`text-center text-xs font-medium py-2 ${
                  i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'
                }`}
              >
                {d}
              </div>
            ))}
          </div>
          {/* 日付グリッド */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              const rec = day ? attendanceMap.get(day) : null
              const isToday =
                day === now.getDate() &&
                month === now.getMonth() + 1 &&
                year === now.getFullYear()
              const dayOfWeek = (idx) % 7
              const isSun = dayOfWeek === 0
              const isSat = dayOfWeek === 6

              return (
                <div
                  key={idx}
                  className={`min-h-[72px] p-1 border-b border-r last:border-r-0 ${
                    !day ? 'bg-gray-50' : ''
                  }`}
                >
                  {day && (
                    <>
                      <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                        isToday
                          ? 'bg-blue-600 text-white'
                          : isSun
                          ? 'text-red-500'
                          : isSat
                          ? 'text-blue-500'
                          : 'text-gray-700'
                      }`}>
                        {day}
                      </div>
                      {rec && (
                        <div className="space-y-0.5">
                          <div className="text-[10px] text-green-700 bg-green-50 rounded px-1">
                            {format(rec.clockIn, 'HH:mm')}
                          </div>
                          {rec.clockOut ? (
                            <div className="text-[10px] text-red-700 bg-red-50 rounded px-1">
                              {format(rec.clockOut, 'HH:mm')}
                            </div>
                          ) : (
                            <div className="text-[10px] text-orange-600 bg-orange-50 rounded px-1">
                              出勤中
                            </div>
                          )}
                          {rec.mins > 0 && (
                            <div className="text-[10px] text-gray-500">
                              {Math.floor(rec.mins / 60)}h{rec.mins % 60}m
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
