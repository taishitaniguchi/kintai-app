import { verifyAdminSession } from '@/lib/dal'
import { prisma } from '@/lib/prisma'
import { updateStaff } from '@/app/actions/admin'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await verifyAdminSession()
  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id, role: 'EMPLOYEE' },
  })

  if (!user) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">スタッフ編集</h1>
        <Link href="/admin/staff" className="text-sm text-blue-600 hover:underline">← スタッフ一覧</Link>
      </header>

      <main className="max-w-md mx-auto px-4 py-10">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <form action={updateStaff} className="space-y-4">
            <input type="hidden" name="id" value={user.id} />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">名前</label>
              <input
                name="name"
                type="text"
                required
                defaultValue={user.name}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">メールアドレス</label>
              <input
                type="text"
                value={user.email}
                disabled
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">時給（円）</label>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm">¥</span>
                <input
                  name="hourlyWage"
                  type="number"
                  min="0"
                  step="10"
                  defaultValue={user.hourlyWage}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500 text-sm">円/時</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">チーム</label>
              <select
                name="team"
                defaultValue={user.team}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="taniguchi">谷口チーム</option>
                <option value="suzuka">鈴鹿チーム</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">新しいパスワード（変更する場合のみ）</label>
              <input
                name="password"
                type="text"
                placeholder="変更しない場合は空欄"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
