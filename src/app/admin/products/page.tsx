import { requireAdmin } from '@/lib/auth/admin-protection'
import { AdminProductsPage } from '@/components/admin/admin-products-page'

export default async function ProductsPage() {
  // Require admin authentication
  const user = await requireAdmin()

  return <AdminProductsPage user={user} />
}
