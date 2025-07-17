import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/utils'
import { ProfileSettingsContent } from '@/components/dashboard/profile-settings-content'

export const metadata: Metadata = {
  title: 'Profile Settings - NusantaraHax',
  description: 'Manage your account settings and preferences',
}

export default async function ProfileSettingsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/signin')
  }

  return <ProfileSettingsContent user={user} />
}
