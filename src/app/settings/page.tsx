import { verifySession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { updateHourlyWage } from '@/app/actions/settings'
import Link from 'next/link'

export default async function SettingsPage() {
  const session = await verifySession()

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, hourlyWage: true },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">設定</h1>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">ダッシュボード</Link>
          <Link href="/calendar" className="text-sm text-blue-600 hover:underline">カレンダー</Link>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-10">
        {/* プロフィール */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">アカウント</h2>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-400">名前</p>
              <p className="text-gray-800 font-medium">{user?.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">メールアドレス</p>
              <p className="text-gray-800">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* 時給設定 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">給与設定</h2>
          <form action={updateHourlyWage} className="space-y-4">
            <div>
              <label htmlFor="hourlyWage" className="block text-sm font-medium text-gray-700 mb-1">
                時給（円）
              </label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">¥</span>
                <input
                  id="hourlyWage"
                  name="hourlyWage"
                  type="number"
                  min="0"
                  step="10"
                  defaultValue={user?.hourlyWage ?? 0}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="1000"
                />
                <span className="text-gray-500 text-sm">円/時</span>
              </div>
              {user?.hourlyWage && user.hourlyWage > 0 ? (
                <p className="text-xs text-gray-400 mt-1">現在: ¥{user.hourlyWage.toLocaleString()}/時</p>
              ) : (
                <p className="text-xs text-gray-400 mt-1">設定すると給与計算が使えます</p>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              保存する
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
