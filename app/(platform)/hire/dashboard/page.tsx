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

// ── Mock fallback journey ──────────────────────────────────────────────────

function buildMockJourney() {
  return {
    id:           'mock-journey',
    status:       'active',
    current_week: 3,
    risk_score:   15,
    start_date:   new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    risk_reasons: null,
    friction_points: null,
    employee: null,
    manager:  null,
    template: null,
  } as any
}

const MOCK_TASKS: any[] = []

function buildMockCheckIns() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const iso = (offsetDays: number) => {
    const d = new Date(now)
    d.setDate(d.getDate() + offsetDays)
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }
  return [
    { id: 'ci1', type: 'weekly', scheduled_date: iso(2),  completed_date: null, notes: null },
    { id: 'ci2', type: 'day30',  scheduled_date: iso(16), completed_date: null, notes: null },
  ]
}

export default async function HireDashboard() {
  const user = await getUser()
  let { journey, tasks, checkIns } = await getHireDashboardData(user.id)

  if (!journey) {
    journey  = buildMockJourney()
    tasks    = MOCK_TASKS
    checkIns = buildMockCheckIns()
  }

  const dayNumber = Math.max(
    1,
    Math.ceil((Date.now() - new Date(journey.start_date).getTime()) / (1000 * 60 * 60 * 24))
  )

  // ── Mutations / AI suggestions ───────────────────────────────────────────
  let mutations: any[] = []
  if (journey.risk_reasons) {
    try {
      const parsed = JSON.parse(journey.risk_reasons)
      if (parsed.mutations) mutations = parsed.mutations
    } catch (e) {}
  }
  if (mutations.length === 0) {
    mutations = [{
      type:      'ADD_TASK',
      reason:    'Technical setup velocity is lower than peer average.',
      taskTitle: 'Advanced Environment Setup (AI Suggested)',
    }]
  }

  // ── Friction points ───────────────────────────────────────────────────────
  let frictionPoints: any[] = []
  if (journey.friction_points && Array.isArray(journey.friction_points)) {
    frictionPoints = journey.friction_points
  }
  if (frictionPoints.length === 0) {
    frictionPoints = [
      { id: 'f1', type: 'technical', severity: 'low',    day: 5,  label: 'IT Setup Complete',  description: 'You cleared the IT checklist 2 days faster than the company average.', intervention: 'Keep this pace for the technical ramp-up phase.' },
      { id: 'f2', type: 'culture',   severity: 'medium', day: 14, label: 'Culture Pulse',       description: 'You missed the last two optional coffee chats.', intervention: 'Schedule a sync with your buddy.' },
    ]
  }

  // ── Pending milestones from real check-ins ────────────────────────────────
  const MILESTONE_TYPES = ['day_7', 'day_14', 'day30', 'day60', 'day90']
  const upcomingCheckInTypes = new Set(
    checkIns.filter((c: any) => !c.completed_date).map((c: any) => c.type)
  )

  // Show feedback prompt for milestones that exist and are upcoming (not yet given feedback)
  const pendingMilestones = MILESTONE_TYPES.filter(m =>
    upcomingCheckInTypes.has(m) || upcomingCheckInTypes.has(m.replace('_', ''))
  )
  // If no real data, fall back to week-3 default
  const activeMilestones = pendingMilestones.length > 0
    ? pendingMilestones
    : journey.current_week >= 1 ? ['day_7'] : []

  // ── Today's meetings for MeetingTimeline ─────────────────────────────────
  const todayStr = new Date().toISOString().split('T')[0]
  const todayMeetings = checkIns
    .filter((c: any) => c.scheduled_date === todayStr && !c.completed_date)
    .map((c: any) => ({
      id:     c.id,
      title:  c.type === 'weekly' ? 'Weekly 1:1 with Manager'
             : c.type === 'day30' ? '30-Day Review'
             : c.type === 'day60' ? '60-Day Review'
             : c.type === 'day90' ? '90-Day Sign-off'
             : 'Check-in',
      time:   '10:00 AM',
      person: journey.manager?.full_name ?? 'Your Manager',
      avatar: journey.manager?.avatar_url ?? null,
    }))

  const recommendedIds = getRecommendedResources(mutations.map((m: any) => m.reason))

  return (
    <>
      <HireHeader />

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        {/* Row 1 — Welcome banner */}
        <WelcomeBanner
          userName={user.full_name?.split(' ')[0] ?? 'there'}
          dayNumber={dayNumber}
          avatarUrl={journey.employee?.avatar_url ?? undefined}
        />

        {/* Row 2 — Feedback prompt (conditional) */}
        <FeedbackPrompt journeyId={journey.id} pendingMilestones={activeMilestones} />

        {/* Row 3 — Journey Roadmap */}
        <JourneyRoadmap mutations={mutations} currentWeek={journey.current_week} />

        {/* Row 4 — Main 2/3 + Side 1/3 */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--gap-standard)', alignItems: 'start' }}>

          {/* Main column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>
            <Suspense fallback={
              <div className="db-card" style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 13 }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }} /> Loading journey...
              </div>
            }>
              <JourneyView journey={journey} dbTasks={tasks} />
            </Suspense>

            <FrictionMap points={frictionPoints} startDate={journey.start_date} />
          </div>

          {/* Side column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>
            <IntegrationRadar />
            <MeetingTimeline meetings={todayMeetings.length > 0 ? todayMeetings : undefined} />
            <SocialBridge />
            <AchievementWall />
            <ResourceHub recommendedIds={recommendedIds} />
          </div>
        </div>

      </div>
    </>
  )
}
