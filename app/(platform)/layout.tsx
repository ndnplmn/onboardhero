import { getUser } from '@/lib/auth/get-user'
import Sidebar from '@/components/platform/Sidebar'
import NotificationBell from '@/components/platform/NotificationBell'
import AuraAssistant from '@/components/platform/AuraAssistant'

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()

  return (
    <div className="app-layout">
      <Sidebar user={user} />
      <main className="app-main">
        <div className="app-topbar">
          <NotificationBell userId={user.id} />
        </div>
        {children}
      </main>
      <AuraAssistant role={user.role} />
    </div>
  )
}
