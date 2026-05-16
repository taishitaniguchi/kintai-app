import { verifyAdminSession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { upsertReservation, deleteReservation } from '@/app/actions/admin'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'

export default async function ReservationManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; facilityId?: string }>
}) {
  await verifyAdminSession()
  const params = await searchParams

  const now = new Date()
  const year = parseInt(params.year ?? String(now.getFullYear()))
  const month = parseInt(params.month ?? String(now.getMonth() + 1))

  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0, 23, 59, 59)

  const [facilities, reservations] = await Promise.all([
    prisma.facility.findMany({ orderBy: { name: 'asc' } }),
    prisma.reservation.findMany({
      where: { date: { gte: startOfMonth, lte: endOfMonth } },
      include: { facility: { select: { displayName: true } } },
      orderBy: [{ date: 'asc' }, { facility: { name: 'asc' } }],
    }),
  ])

  const selectedFacilityId = params.facilityId ?? facilities[0]?.id ?? ''

  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 }

  const defaultDate = `${year}-${String(month).padStart(2, '0')}-01`

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">予約管理</h1>
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-sm text-blue-600 hover:underline">← 管理者画面</Link>
          <Link href="/admin/staff" className="text-sm bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors">スタッフ管理</Link>
          <Link href="/admin/shifts" className="text-sm bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 transition-colors">シフト管理</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* 月ナビゲーション */}
        <div className="flex items-center justify-between">
          <Link href={`/admin/reservations?year=${prevMonth.year}&month=${prevMonth.month}`} className="text-sm text-blue-600 hover:underline">← 前月</Link>
          <h2 className="text-lg font-bold text-gray-800">{format(startOfMonth, 'yyyy年M月', { locale: ja })}</h2>
          <Link href={`/admin/reservations?year=${nextMonth.year}&month=${nextMonth.month}`} className="text-sm text-blue-600 hover:underline">翌月 →</Link>
        </div>

        {/* 予約追加フォーム */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">予約入力</h2>
          <form action={upsertReservation} className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">施設</label>
              <select
                name="facilityId"
                required
                defaultValue={selectedFacilityId}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">宿泊者数（人）</label>
              <input
                name="guestCount"
                type="number"
                min="0"
                defaultValue={0}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">子供チェア（台）</label>
              <input
                name="childChairs"
                type="number"
                min="0"
                defaultValue={0}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ベビーベッド（台）</label>
              <input
                name="babyBeds"
                type="number"
                min="0"
                defaultValue={0}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">メモ</label>
              <input
                name="note"
                type="text"
                placeholder="任意"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="col-span-2">
              <button
                type="submit"
                className="w-full bg-orange-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                保存する（同じ施設・日付は上書き）
              </button>
            </div>
          </form>
        </div>

        {/* 予約一覧 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">日付</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">施設</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">宿泊者</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">子供チェア</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">ベビーベッド</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reservations.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400">予約なし</td>
                </tr>
              )}
              {reservations.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800">
                    {format(new Date(r.date), 'M/d(E)', { locale: ja })}
                  </td>
                  <td className="px-4 py-3 text-gray-800">{r.facility.displayName}</td>
                  <td className="px-4 py-3 text-center text-gray-800">{r.guestCount}人</td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {r.childChairs > 0 ? `${r.childChairs}台` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {r.babyBeds > 0 ? `${r.babyBeds}台` : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <form action={deleteReservation} className="inline">
                      <input type="hidden" name="id" value={r.id} />
                      <button
                        type="submit"
                        className="text-xs text-red-500 hover:text-red-700"
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
