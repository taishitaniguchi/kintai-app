import { verifyAdminSession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { createShift, deleteShift } from '@/app/actions/admin'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'

export default async function ShiftManagementPage({
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

  const [users, facilities, shifts] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'EMPLOYEE' },
      orderBy: [{ team: 'asc' }, { name: 'asc' }],
    }),
    prisma.facility.findMany({ orderBy: { name: 'asc' } }),
    prisma.shift.findMany({
      where: { date: { gte: startOfMonth, lte: endOfMonth } },
      include: {
        user: { select: { name: true, team: true } },
        facility: { select: { displayName: true } },
      },
      orderBy: [{ date: 'asc' }, { user: { name: 'asc' } }],
    }),
  ])

  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }

  const defaultDate = `${year}-${String(month).padStart(2, '0')}-01`

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">シフト管理</h1>
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-sm text-blue-600 hover:underline">← 管理者画面</Link>
          <Link href="/admin/staff" className="text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors">スタッフ管理</Link>
          <Link href="/admin/reservations" className="text-sm bg-orange-500 text-white px-3 py-1 rounded-lg hover:bg-orange-600 transition-colors">予約管理</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* 月ナビゲーション */}
        <div className="flex items-center justify-between">
          <Link href={`/admin/shifts?year=${prevMonth.year}&month=${prevMonth.month}`} className="text-sm text-blue-600 hover:underline">← 前月</Link>
          <h2 className="text-lg font-bold text-gray-800">{format(startOfMonth, 'yyyy年M月', { locale: ja })}</h2>
          <Link href={`/admin/shifts?year=${nextMonth.year}&month=${nextMonth.month}`} className="text-sm text-blue-600 hover:underline">翌月 →</Link>
        </div>

        {/* シフト追加フォーム */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">シフト追加</h2>
          <form action={createShift} className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">スタッフ</label>
              <select
                name="userId"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">選択...</option>
                <optgroup label="谷口チーム">
                  {users.filter(u => u.team === 'taniguchi').map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </optgroup>
                <optgroup label="鈴鹿チーム">
                  {users.filter(u => u.team === 'suzuka').map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">施設</label>
              <select
                name="facilityId"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">選択...</option>
                {facilities.map(f => (
                  <option key={f.id} value={f.id}>{f.displayName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">日付</label>
              <input
                name="date"
                type="date"
                required
                defaultValue={defaultDate}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">開始時刻</label>
                <input
                  name="startTime"
                  type="time"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">終了時刻</label>
                <input
                  name="endTime"
                  type="time"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">メモ</label>
              <input
                name="note"
                type="text"
                placeholder="任意"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-purple-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                シフト追加
              </button>
            </div>
          </form>
        </div>

        {/* シフト一覧 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">日付</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">スタッフ</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">施設</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">時間</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {shifts.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-400">シフトなし</td>
                </tr>
              )}
              {shifts.map((shift) => (
                <tr key={shift.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800">
                    {format(new Date(shift.date), 'M/d(E)', { locale: ja })}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-800">{shift.user.name}</span>
                    <span className={`text-xs ml-1 px-1.5 py-0.5 rounded-full ${shift.user.team === 'taniguchi' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                      {shift.user.team === 'taniguchi' ? '谷口' : '鈴鹿'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-800">{shift.facility.displayName}</td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {shift.startTime && shift.endTime
                      ? `${shift.startTime}〜${shift.endTime}`
                      : shift.startTime
                      ? `${shift.startTime}〜`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <form action={deleteShift} className="inline">
                      <input type="hidden" name="id" value={shift.id} />
                      <button
                        type="submit"
                        className="text-xs text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          if (!confirm('このシフトを削除しますか？')) e.preventDefault()
                        }}
                      >
                        削除
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
