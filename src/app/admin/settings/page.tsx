import { requireAdmin } from '@/lib/auth/admin-protection'
import { AdminSettingsPage } from '@/components/admin/admin-settings-page'

export default async function SettingsPage() {
  // Require admin authentication
  const user = await requireAdmin()

  return <AdminSettingsPage user={user} />
}
