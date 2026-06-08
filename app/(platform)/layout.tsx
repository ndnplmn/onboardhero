import { getUser } from '@/lib/auth/get-user'
import { createSupabaseServer } from '@/lib/db/supabase-server'
import Sidebar from '@/components/platform/Sidebar'
import NotificationBell from '@/components/platform/NotificationBell'
import AuraAssistant from '@/components/platform/AuraAssistant'
import CommandPalette from '@/components/platform/CommandPalette'
import HireMobileNav from '@/components/platform/HireMobileNav'

async function getJourneyContext(userId: string, role: string): Promise<string> {
  if (role !== 'new_hire') return ''
  try {
    const supabase = await createSupabaseServer()
    const { data: journey } = await supabase
      .from('journeys')
      .select('id, current_week, risk_score, manager:profiles!manager_id(full_name)')
      .eq('employee_id', userId)
      .in('status', ['in_progress', 'at_risk', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!journey) return ''

    const manager = Array.isArray((journey as any).manager) ? (journey as any).manager[0] : (journey as any).manager

    // Fetch actual pending task titles for the current week
    const [tasksRes, wikiRes] = await Promise.all([
      supabase
        .from('journey_tasks')
        .select('title, status, week')
        .eq('journey_id', (journey as any).id)
        .eq('assigned_to_role', 'new_hire')
        .in('status', ['pending', 'in_progress'])
        .eq('week', journey.current_week)
        .order('week')
        .limit(5),
      supabase
        .from('resources')
        .select('title, type')
        .order('created_at', { ascending: false })
        .limit(8),
    ])

    const pendingTitles = (tasksRes.data ?? []).map((t: any) => `"${t.title}" (${t.status})`).join(', ')
    const wikiArticles  = (wikiRes.data ?? []).map((r: any) => `"${r.title}" [${r.type}]`).join(', ')

    return [
      `Employee is on Week ${journey.current_week} of their 12-week onboarding journey.`,
      `Risk score: ${journey.risk_score ?? 0}/100.`,
      `Manager: ${manager?.full_name ?? 'assigned manager'}.`,
      pendingTitles ? `Pending tasks this week: ${pendingTitles}.` : 'No pending tasks this week.',
      wikiArticles  ? `Available resources/wiki articles: ${wikiArticles}.` : '',
    ].filter(Boolean).join(' ')
  } catch {
    return ''
  }
}

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser()
  const journeyContext = await getJourneyContext(user.id, user.role)

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
      <AuraAssistant role={user.role} journeyContext={journeyContext} />
      <CommandPalette />
      <HireMobileNav />
    </div>
  )
}
