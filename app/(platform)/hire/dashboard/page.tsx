import { getUser } from '@/lib/auth/get-user'
import { getHireDashboardData } from '@/lib/db/queries/hire'
import JourneyView from '@/components/platform/JourneyView'
import FeedbackPrompt from './FeedbackPrompt'
import WelcomeBanner from '@/components/platform/WelcomeBanner'
import JourneyRoadmap from '@/components/platform/JourneyRoadmap'
import ResourceHub from '@/components/platform/ResourceHub'
import MeetingTimeline from '@/components/platform/MeetingTimeline'

export const dynamic = 'force-dynamic'

export default async function HireDashboard() {
  const user = await getUser()
  const { journey, tasks } = await getHireDashboardData(user.id)

  if (!journey) {
    return (
      <div className="app-main">
        <div style={{ padding: '64px 32px', textAlign: 'center' }}>
          <h1 style={{ fontFamily: "var(--font-display)" }}>Welcome to Onboarding Hero!</h1>
          <p style={{ color: 'var(--text2)', marginTop: '12px' }}>Your onboarding journey hasn&apos;t started yet. Please check back soon.</p>
        </div>
      </div>
    )
  }

  const dayNumber = Math.max(1, Math.ceil((Date.now() - new Date(journey.start_date).getTime()) / (1000 * 60 * 60 * 24)))

  return (
    <div className="app-main">
      <header className="db-header">
        <div>
          <h1>My Journey</h1>
          <p>Track your progress, access resources, and meet your team.</p>
        </div>
        <div className="db-header-actions">
           <button className="btn btn-outline btn-sm"><i className="fa-solid fa-circle-question"></i> Get Help</button>
        </div>
      </header>

      <div className="db-body">
        <WelcomeBanner userName={user.full_name.split(' ')[0]} dayNumber={dayNumber} />
        
        <div className="db-row full">
          <JourneyRoadmap />
        </div>

        <div className="db-row col2" style={{ alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <JourneyView journey={journey} dbTasks={tasks} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <MeetingTimeline />
            <ResourceHub />
          </div>
        </div>
      </div>
    </div>
  )
}

