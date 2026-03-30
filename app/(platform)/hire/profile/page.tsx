import { getUser } from '@/lib/auth/get-user'
import ProfileForm from '@/components/platform/ProfileForm'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const user = await getUser()

  return (
    <div style={{ padding: '32px', maxWidth: '600px' }}>
      <h1 style={{ fontFamily: "'Outfit', sans-serif", marginBottom: '24px' }}>My Profile</h1>
      <ProfileForm profile={user} />
    </div>
  )
}
