import { getUser } from '@/lib/auth/get-user'
import ProfileForm from '@/components/platform/ProfileForm'

export const dynamic = 'force-dynamic'

export default async function ManagerProfilePage() {
  const user = await getUser()

  return (
    <>
      <div className="db-header">
        <div className="db-header-left">
          <h1>
            <i
              className="fa-solid fa-user-circle"
              style={{
                marginRight: 8,
                background: 'var(--grad)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              aria-hidden="true"
            />
            My Profile
          </h1>
          <p>Update your personal information and notification preferences.</p>
        </div>
      </div>
      <div className="db-body" style={{ maxWidth: 640 }}>
        <ProfileForm profile={user} />
      </div>
    </>
  )
}
