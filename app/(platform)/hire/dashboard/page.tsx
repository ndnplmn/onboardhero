import { getUser } from '@/lib/auth/get-user'
import { getHireDashboardData } from '@/lib/db/queries/hire'
import TaskList from '@/components/platform/TaskList'
import ContactCard from '@/components/platform/ContactCard'
import JourneyTimeline from '@/components/platform/JourneyTimeline'

export const dynamic = 'force-dynamic'

export default async function HireDashboard() {
  const user = await getUser()
  const { journey, tasks, checkIns } = await getHireDashboardData(user.id)

  if (!journey) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: "'Outfit', sans-serif" }}>Welcome to OnboardHero!</h1>
        <p style={{ color: 'var(--text2)', marginTop: '12px' }}>Your onboarding journey hasn&apos;t started yet. Please check back soon.</p>
      </div>
    )
  }

  const dayNumber = Math.max(1, Math.ceil((Date.now() - new Date(journey.start_date).getTime()) / (1000 * 60 * 60 * 24)))
  const completedTasks = tasks.filter((t: any) => t.status === 'completed').length
  const totalTasks = tasks.length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const currentWeekTasks = tasks.filter((t: any) => t.week === journey.current_week && t.assigned_to_role === 'new_hire')

  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ fontFamily: "'Outfit', sans-serif", marginBottom: '4px' }}>
        Hello {user.full_name.split(' ')[0]}, you&apos;re on Day {dayNumber} — Week {journey.current_week}
      </h1>
      <div className="hce-prog" style={{ height: '8px', marginTop: '16px', marginBottom: '8px' }}>
        <div className="hce-bar" style={{ width: `${progress}%` }}></div>
      </div>
      <p style={{ color: 'var(--text2)', fontSize: '0.9rem', marginBottom: '24px' }}>{progress}% completed · {completedTasks}/{totalTasks} tasks done</p>

      <JourneyTimeline currentWeek={journey.current_week} checkIns={checkIns} />

      <div style={{ marginTop: '32px' }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', marginBottom: '16px' }}>This Week&apos;s Tasks</h2>
        <TaskList tasks={currentWeekTasks} currentWeek={journey.current_week} />
      </div>

      <div style={{ marginTop: '32px' }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', marginBottom: '16px' }}>Your Contacts</h2>
        <div className="hc-employees">
          <ContactCard name={journey.manager.full_name} role="Manager" avatarUrl={journey.manager.avatar_url} id={journey.manager.id} />
        </div>
      </div>
    </div>
  )
}
