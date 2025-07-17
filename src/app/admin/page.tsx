import { requireAdmin } from '@/lib/auth/admin-protection'
import { AdminDashboard } from '@/components/admin/admin-dashboard'

export default async function AdminPage() {
  // Require admin authentication
  const user = await requireAdmin()

  return <AdminDashboard user={user} />
}
