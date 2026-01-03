
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getUsers } from '@/lib/db'
import { UsersTable } from '@/components/admin/UsersTable'

export default async function AdminUsersPage() {
  const session = await auth()
  
  if (!session || (session.user as any)?.role !== 'admin') {
    redirect('/')
  }

  const users = await getUsers()
  // Remove passwords for safety
  const safeUsers = users.map(({ password, ...user }) => user)

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="mb-8 text-3xl font-bold">Manage Users</h1>
      <UsersTable initialUsers={safeUsers} />
    </div>
  )
}
