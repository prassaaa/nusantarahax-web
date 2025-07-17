import { requireAdmin } from '@/lib/auth/admin-protection'
import { AdminContentPage } from '@/components/admin/admin-content-page'

export default async function ContentPage() {
  // Require admin authentication
  const user = await requireAdmin()

  return <AdminContentPage user={user} />
}
