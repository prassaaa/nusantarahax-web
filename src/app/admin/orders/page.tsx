import { requireAdmin } from '@/lib/auth/admin-protection'
import { AdminOrdersPage } from '@/components/admin/admin-orders-page'

export default async function OrdersPage() {
  // Require admin authentication
  const user = await requireAdmin()

  return <AdminOrdersPage user={user} />
}
