import { Suspense } from 'react'
import { getUser } from '@/lib/auth/get-user'
import { getHireDashboardData } from '@/lib/db/queries/hire'
import JourneyView from '@/components/platform/JourneyView'
import FeedbackPrompt from './FeedbackPrompt'
import WelcomeBanner from '@/components/platform/WelcomeBanner'
import JourneyRoadmap from '@/components/platform/JourneyRoadmap'
import ResourceHub from '@/components/platform/ResourceHub'
import MeetingTimeline from '@/components/platform/MeetingTimeline'
import IntegrationRadar from '@/components/platform/IntegrationRadar'
import AchievementWall from '@/components/platform/AchievementWall'
import SocialBridge from '@/components/platform/SocialBridge'
import FrictionMap from '@/components/platform/FrictionMap'
import { getRecommendedResources } from '@/lib/ai/resource-logic'
import HireHeader from './HireHeader'

export const dynamic = 'force-dynamic'

export default async function HireDashboard() {
  const user = await getUser()
  let { journey, tasks } = await getHireDashboardData(user.id)

  if (!journey) {
    journey = {
      id: 'mock-journey',
      start_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      current_week: 3,
      risk_score: 15,
      risk_reasons: JSON.stringify({
        mutations: [
          {
            type: 'ADD_TASK',
            reason: 'Technical setup velocity is lower than peer average.',
            taskTitle: 'Advanced Environment Setup (AI Suggested)',
          },
        ],
      }),
    } as any
    tasks = []
  }

  const dayNumber = Math.max(
    1,
    Math.ceil((Date.now() - new Date(journey.start_date).getTime()) / (1000 * 60 * 60 * 24))
  )

  let mutations: any[] = []
  if (journey.risk_reasons) {
    try {
      const parsed = JSON.parse(journey.risk_reasons)
      if (parsed.mutations) mutations = parsed.mutations
    } catch (e) {}
  }
  if (mutations.length === 0) {
    mutations = [
      {
        type: 'ADD_TASK',
        reason: 'Technical setup velocity is lower than peer average.',
        taskTitle: 'Advanced Environment Setup (AI Suggested)',
      },
    ]
  }

  const frictionPoints: any[] = [
    {
      id: 'f1', type: 'technical', severity: 'low', day: 5,
      label: 'IT Setup Complete',
      description: 'You cleared the IT checklist 2 days faster than the company average.',
      intervention: 'Keep this pace for the technical ramp-up phase.',
    },
    {
      id: 'f2', type: 'culture', severity: 'medium', day: 14,
      label: 'Culture Pulse',
      description: 'You missed the last two optional coffee chats. Take some time to bond!',
      intervention: 'Schedule a sync with your buddy.',
    },
  ]

  const pendingMilestones = ['day_7', 'day_14']
  const recommendedIds = getRecommendedResources(mutations.map((m: any) => m.reason))

  return (
    <>
      <HireHeader />

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        {/* Row 1 — Welcome banner (full width) */}
        <WelcomeBanner userName={user.full_name.split(' ')[0]} dayNumber={dayNumber} />

        {/* Row 2 — Feedback prompt (full width, conditional) */}
        <FeedbackPrompt journeyId={journey.id} pendingMilestones={pendingMilestones} />

        {/* Row 3 — Journey Roadmap full width */}
        <JourneyRoadmap mutations={mutations} currentWeek={journey.current_week} />

        {/* Row 4 — Main 2/3 + Side 1/3 */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--gap-standard)', alignItems: 'start' }}>

          {/* Main column — tasks + friction */}
          <div className="db-col-main">
            <Suspense fallback={<div className="pro-max-card" style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)' }}>Loading journey...</div>}>
              <JourneyView journey={journey} dbTasks={tasks} />
            </Suspense>

            <FrictionMap points={frictionPoints} startDate={journey.start_date} />
          </div>

          {/* Side column — integration + social + resources */}
          <div className="db-col-side">
            <IntegrationRadar />
            <MeetingTimeline />
            <SocialBridge />
            <AchievementWall />
            <ResourceHub recommendedIds={recommendedIds} />
          </div>
        </div>

      </div>
    </>
  )
}
