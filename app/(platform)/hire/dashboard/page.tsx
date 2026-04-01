import { getUser } from '@/lib/auth/get-user'
import { getHireDashboardData } from '@/lib/db/queries/hire'
import JourneyView from '@/components/platform/JourneyView'
import FeedbackPrompt from './FeedbackPrompt'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export const dynamic = 'force-dynamic'

export default async function HireDashboard() {
  const user = await getUser()
  const { journey, tasks, checkIns } = await getHireDashboardData(user.id)

  if (!journey) {
    return (
      <div className="app-main">
        <div style={{ padding: '64px 32px', textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Outfit', sans-serif" }}>Welcome to OnboardHero!</h1>
          <p style={{ color: 'var(--text2)', marginTop: '12px' }}>Your onboarding journey hasn&apos;t started yet. Please check back soon.</p>
        </div>
      </div>
    )
  }

  const dayNumber = Math.max(1, Math.ceil((Date.now() - new Date(journey.start_date).getTime()) / (1000 * 60 * 60 * 24)))
  
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
    <div className="app-main">
      <header className="db-header">
        <div>
          <h1>Journey Dashboard</h1>
          <p>Hello {user.full_name.split(' ')[0]}, you&apos;re on Day {dayNumber} of your onboarding journey.</p>
        </div>
        <div className="db-header-actions">
           <button className="btn btn-outline btn-sm"><i className="fa-solid fa-circle-question"></i> Get Help</button>
        </div>
      </header>

      {pendingFeedbackMilestones.length > 0 && (
        <div style={{ padding: '0 28px', marginTop: '24px' }}>
          <FeedbackPrompt journeyId={journey.id} pendingMilestones={pendingFeedbackMilestones} />
        </div>
      )}

      <JourneyView journey={journey} dbTasks={tasks} />
    </div>
  )
}

