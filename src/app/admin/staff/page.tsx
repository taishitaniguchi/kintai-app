import { verifyAdminSession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { createStaff } from '@/app/actions/admin'
import Link from 'next/link'

export default async function StaffManagementPage() {
  await verifyAdminSession()

  const users = await prisma.user.findMany({
    where: { role: 'EMPLOYEE' },
    orderBy: [{ team: 'asc' }, { name: 'asc' }],
  })

  const taniguchiUsers = users.filter(u => u.team === 'taniguchi')
  const suzukaUsers = users.filter(u => u.team === 'suzuka')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">スタッフ管理</h1>
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-sm text-blue-600 hover:underline">← 管理者画面</Link>
          <Link href="/admin/shifts" className="text-sm bg-purple-600 text-white px-3 py-1 rounded-lg hover:bg-purple-700 transition-colors">シフト管理</Link>
          <Link href="/admin/reservations" className="text-sm bg-orange-500 text-white px-3 py-1 rounded-lg hover:bg-orange-600 transition-colors">予約管理</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* 新規スタッフ追加 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">新規スタッフ追加</h2>
          <form action={createStaff} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">名前</label>
              <input
                name="name"
                type="text"
                required
                placeholder="山田 花子"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">メールアドレス</label>
              <input
                name="email"
                type="email"
                required
                placeholder="staff@example.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">初期パスワード</label>
              <input
                name="password"
                type="text"
                required
                placeholder="password123"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">時給（円）</label>
              <input
                name="hourlyWage"
                type="number"
                min="0"
                step="10"
                defaultValue={1000}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">チーム</label>
              <select
                name="team"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="taniguchi">谷口チーム</option>
                <option value="suzuka">鈴鹿チーム</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                追加する
              </button>
            </div>
          </form>
        </div>

        {/* チーム別スタッフ一覧 */}
        {[
          { label: '谷口チーム', list: taniguchiUsers, color: 'text-green-700 bg-green-50' },
          { label: '鈴鹿チーム', list: suzukaUsers, color: 'text-blue-700 bg-blue-50' },
        ].map(({ label, list, color }) => (
          <div key={label}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{label}</h2>
            <div className="space-y-3">
              {list.length === 0 && (
                <p className="text-sm text-gray-400 bg-white rounded-xl p-4">スタッフなし</p>
              )}
              {list.map((user) => (
                <div key={user.id} className="bg-white rounded-xl shadow-sm p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-800">{user.name}</span>
                      <span className="text-xs text-gray-500 ml-2">{user.email}</span>
                      <span className={`text-xs ml-2 px-2 py-0.5 rounded-full ${color}`}>{label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {user.hourlyWage > 0 ? `¥${user.hourlyWage.toLocaleString()}/h` : '時給未設定'}
                      </span>
                      <Link
                        href={`/admin/staff/${user.id}`}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        編集
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
