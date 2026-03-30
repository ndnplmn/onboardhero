import { getUser } from '@/lib/auth/get-user'
import { getHireDashboardData } from '@/lib/db/queries/hire'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'
import TaskList from '@/components/platform/TaskList'
import ContactCard from '@/components/platform/ContactCard'
import JourneyTimeline from '@/components/platform/JourneyTimeline'
import FeedbackPrompt from './FeedbackPrompt'

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
  const managerTasks = tasks.filter((t: any) => t.week === journey.current_week && t.assigned_to_role === 'manager')

  // Check for completed check-ins without feedback
  const supabase = createSupabaseAdmin()
  const { data: existingFeedback } = await supabase
    .from('feedback_surveys')
    .select('milestone')
    .eq('journey_id', journey.id)
    .eq('employee_id', user.id)

  const feedbackMilestones = new Set((existingFeedback || []).map((f: any) => f.milestone))
  const completedCheckIns = checkIns.filter((ci: any) => ci.completed_date)
  const pendingFeedbackMilestones = completedCheckIns
    .filter((ci: any) => !feedbackMilestones.has(ci.milestone))
    .map((ci: any) => ci.milestone)

  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ fontFamily: "'Outfit', sans-serif", marginBottom: '4px' }}>
        Hello {user.full_name.split(' ')[0]}, you&apos;re on Day {dayNumber} — Week {journey.current_week}
      </h1>
      <div className="hce-prog" style={{ height: '8px', marginTop: '16px', marginBottom: '8px' }}>
        <div className="hce-bar" style={{ width: `${progress}%` }}></div>
      </div>
      <p style={{ color: 'var(--text2)', fontSize: '0.9rem', marginBottom: '24px' }}>{progress}% completed · {completedTasks}/{totalTasks} tasks done</p>

      {pendingFeedbackMilestones.length > 0 && (
        <FeedbackPrompt journeyId={journey.id} pendingMilestones={pendingFeedbackMilestones} />
      )}

      <JourneyTimeline currentWeek={journey.current_week} checkIns={checkIns} />

      <div style={{ marginTop: '32px' }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', marginBottom: '16px' }}>This Week&apos;s Tasks</h2>
        <TaskList tasks={currentWeekTasks} currentWeek={journey.current_week} />
      </div>

      {managerTasks.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', marginBottom: '16px' }}>Your Manager&apos;s Tasks</h2>
          {managerTasks.map((t: any) => (
            <div key={t.id} className="hc-emp" style={{ opacity: t.status === 'completed' ? 0.6 : 1 }}>
              <i className={`fa-solid ${t.status === 'completed' ? 'fa-circle-check' : 'fa-circle'}`}
                 style={{ color: t.status === 'completed' ? 'var(--green)' : 'var(--text3)', width: '26px', textAlign: 'center' }}></i>
              <div className="hce-info">
                <strong style={{ textDecoration: t.status === 'completed' ? 'line-through' : 'none' }}>{t.title}</strong>
                <span>{t.status === 'completed' ? 'Completed' : 'Pending'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '32px' }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', marginBottom: '16px' }}>Your Contacts</h2>
        <div className="hc-employees">
          <ContactCard name={journey.manager.full_name} role="Manager" avatarUrl={journey.manager.avatar_url} id={journey.manager.id} />
        </div>
      </div>
    </div>
  )
}
