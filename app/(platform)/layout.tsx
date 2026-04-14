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
        {/* Desktop topbar — hidden on mobile (mobile bar is inside Sidebar) */}
        <div className="app-topbar app-topbar-desktop">
          <NotificationBell userId={user.id} />
        </div>
        {children}
      </main>
      <AuraAssistant role={user.role} />
    </div>
  )
}
