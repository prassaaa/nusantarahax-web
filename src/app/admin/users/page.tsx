import { requireAdmin } from '@/lib/auth/admin-protection'
import { AdminUsersPage } from '@/components/admin/admin-users-page'

export default async function UsersPage() {
  // Require admin authentication
  const user = await requireAdmin()

  return <AdminUsersPage user={user} />
}
