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
import SocialBridge, { type SocialContact } from '@/components/platform/SocialBridge'
import FrictionMap from '@/components/platform/FrictionMap'
import { getRecommendedResources } from '@/lib/ai/resource-logic'
import { createSupabaseAdmin } from '@/lib/db/supabase-server'
import { getUnlockedAchievements } from '../actions'
import HireHeader from './HireHeader'
import TodayFocus from '@/components/platform/TodayFocus'
import PulseCheck from '@/components/platform/PulseCheck'
import Day1Banner from '@/components/platform/Day1Banner'
import OnboardingTour from '@/components/platform/OnboardingTour'
import ReportBlockerButton from '@/components/platform/ReportBlockerButton'
import CollapseSection from '@/components/platform/CollapseSection'
import GoalsBoard, { type JourneyGoal } from '@/components/platform/GoalsBoard'
import ActivityFeed from '@/components/platform/ActivityFeed'
import AuraAssistant from '@/components/platform/AuraAssistant'
import PreboardingChecklist, { type PreboardingTask } from './PreboardingChecklist'
import { MoodArc } from '@/components/platform/PulseCheck'
import MobileTabs from './MobileTabs'
import JourneyOutcomeModal from '@/components/platform/JourneyOutcomeModal'
import MilestoneCelebration from '@/components/platform/MilestoneCelebration'
import CompletionCertificate from '@/components/platform/CompletionCertificate'
import AuraNudgeBanner from './AuraNudgeBanner'
import PeopleConnect, { type PersonMatch } from '@/components/platform/PeopleConnect'

export const dynamic = 'force-dynamic'

export default async function HireDashboard() {
  const user = await getUser()
  const { journey, tasks, checkIns, resources, pulseChecks } = await getHireDashboardData(user.id)

  // No journey assigned yet — show a friendly holding state
  if (!journey) {
    return <NoJourneyView userName={user.full_name?.split(' ')[0] ?? 'there'} />
  }

  // Raw day number — can be negative if start_date is in the future
  // Fetch one HR contact to surface in SocialBridge (admin bypasses RLS — new hires can't query profiles directly)
  const admin = createSupabaseAdmin()
  const { data: hrRow } = await admin
    .from('profiles')
    .select('full_name, email, avatar_url')
    .eq('role', 'hr')
    .limit(1)
    .single()

  const rawDayNumber = Math.ceil(
    (Date.now() - new Date(journey.start_date).getTime()) / (1000 * 60 * 60 * 24),
  )
  const dayNumber = Math.max(1, rawDayNumber)

  const seenAchievements = await getUnlockedAchievements(journey.id)

  // ── People discovery — colleagues with shared interests ──────────────────
  const myInterests: string[] = Array.isArray((user as any).interests) ? (user as any).interests : []
  let peopleMatches: PersonMatch[] = []
  if (myInterests.length > 0) {
    const { data: matchedProfiles } = await admin
      .from('profiles')
      .select('id, full_name, avatar_url, department, email, interests')
      .neq('id', user.id)
      .not('interests', 'is', null)
      .limit(50)
      .then(r => r, () => ({ data: null, error: null }))

    if (matchedProfiles) {
      for (const p of matchedProfiles) {
        const theirInterests: string[] = Array.isArray((p as any).interests) ? (p as any).interests : []
        const shared = myInterests.filter((i: string) => theirInterests.includes(i))
        if (shared.length > 0) {
          peopleMatches.push({
            id:              (p as any).id,
            name:            (p as any).full_name ?? 'Colleague',
            avatarUrl:       (p as any).avatar_url,
            department:      (p as any).department,
            email:           (p as any).email,
            sharedInterests: shared,
          })
        }
      }
      peopleMatches.sort((a: PersonMatch, b: PersonMatch) => b.sharedInterests.length - a.sharedInterests.length)
      peopleMatches = peopleMatches.slice(0, 20)
    }
  }

  // ── Mutations / AI suggestions ───────────────────────────────────────────
  let mutations: any[] = []
  if (journey.risk_reasons) {
    try {
      const parsed = JSON.parse(journey.risk_reasons)
      if (parsed.mutations) mutations = parsed.mutations
    } catch (e) {}
  }

  // ── Friction points ───────────────────────────────────────────────────────
  const frictionPoints: any[] = (journey.friction_points && Array.isArray(journey.friction_points))
    ? journey.friction_points
    : []

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

  // ── Upcoming meetings (next 72h) for MeetingTimeline ────────────────────
  const now72h = new Date(Date.now() + 72 * 60 * 60 * 1000)
  const upcomingMeetings = checkIns
    .filter((c: any) => {
      if (!c.scheduled_date || c.completed_date) return false
      const d = new Date(c.scheduled_date)
      return d >= new Date() && d <= now72h
    })
    .map((c: any) => ({
      id:     c.id,
      title:  c.type === 'weekly' ? 'Weekly 1:1 with Manager'
             : c.type === 'day30' ? '30-Day Review'
             : c.type === 'day60' ? '60-Day Review'
             : c.type === 'day90' ? '90-Day Sign-off'
             : 'Check-in',
      time:   c.scheduled_date
               ? new Date(c.scheduled_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
               : 'TBD',
      person: journey.manager?.full_name ?? 'Your Manager',
      avatar: journey.manager?.avatar_url ?? null,
      date:   c.scheduled_date,
    }))

  const recommendedIds = getRecommendedResources(mutations.map((m: any) => m.reason))

  // ── IntegrationRadar — honest formulas based on real signals ────────────
  const allCompleted      = tasks.filter((t: any) => t.status === 'completed').length
  const totalTasks        = tasks.length
  const completedCheckins = checkIns.filter((c: any) => c.completed_date).length
  const totalCheckins     = checkIns.length
  const safeChecks        = pulseChecks ?? []

  // Social: % of check-ins completed (real engagement signal, not a cap at 3)
  const socialValue = totalCheckins > 0
    ? Math.round((completedCheckins / totalCheckins) * 100)
    : 0

  // Technical: task completion rate for current and previous weeks only
  const technicalTasks = tasks.filter((t: any) => t.week <= journey.current_week)
  const technicalValue = technicalTasks.length
    ? Math.round(technicalTasks.filter((t: any) => t.status === 'completed').length / technicalTasks.length * 100)
    : 0

  // Culture: real pulse avg → 0–100 scale. No fake defaults.
  const avgPulse = safeChecks.length
    ? Math.round(safeChecks.reduce((s: number, p: any) => s + (p.score ?? 3), 0) / safeChecks.length * 20)
    : 0

  // Process: overall task completion across all weeks
  const processValue = totalTasks > 0 ? Math.round(allCompleted / totalTasks * 100) : 0

  // Feedback: completion rate of check-ins that had notes (real quality signal)
  const checkInsWithNotes = checkIns.filter((c: any) => c.completed_date && c.notes).length
  const feedbackValue = totalCheckins > 0
    ? Math.round((checkInsWithNotes / Math.max(completedCheckins, 1)) * 100)
    : 0

  const radarData = [
    { label: 'Social',    value: socialValue },
    { label: 'Technical', value: technicalValue },
    { label: 'Culture',   value: avgPulse },
    { label: 'Process',   value: processValue },
    { label: 'Feedback',  value: feedbackValue },
  ]

  // ── IntegrationRadar history from Supabase (cross-device persistence) ────
  const radarHistory = safeChecks
    .filter((p: any) => p.radar_snapshot)
    .map((p: any) => ({
      week: p.week as number,
      avg:  Math.round((p.radar_snapshot as { value: number }[]).reduce((s, d) => s + d.value, 0) / p.radar_snapshot.length),
    }))
    .sort((a: any, b: any) => a.week - b.week)

  // ── Cohort rank — hire's task-completion percentile vs all active journeys ──
  const { data: cohortJourneys } = await admin
    .from('onboarding_journeys')
    .select('id')
    .neq('id', journey.id)
    .eq('status', 'active')
  const cohortIds = (cohortJourneys ?? []).map((j: any) => j.id)
  let cohortRankPct: number | null = null
  if (cohortIds.length > 0) {
    const { data: cohortTasks } = await admin
      .from('journey_tasks')
      .select('journey_id, status')
      .in('journey_id', cohortIds)
    if (cohortTasks && cohortTasks.length > 0) {
      const cohortMap = new Map<string, { total: number; done: number }>()
      for (const t of cohortTasks) {
        if (!cohortMap.has(t.journey_id)) cohortMap.set(t.journey_id, { total: 0, done: 0 })
        const s = cohortMap.get(t.journey_id)!
        s.total++
        if (t.status === 'completed') s.done++
      }
      const cohortPcts = Array.from(cohortMap.values()).map(s => s.total > 0 ? Math.round((s.done / s.total) * 100) : 0)
      const belowHire = cohortPcts.filter(p => p < processValue).length
      cohortRankPct = Math.round((belowHire / cohortPcts.length) * 100)
    }
  }

  // ── Previous week pulse score (for trend narrative) ──────────────────────
  const sortedPulses = [...safeChecks].sort((a: any, b: any) => b.week - a.week)
  const prevPulseScore = sortedPulses.length >= 2 ? (sortedPulses[1]?.score ?? null) : null
  const completedLastWeek = journey.current_week > 1
    ? tasks.filter((t: any) => t.status === 'completed' && t.week === journey.current_week - 1).length
    : null

  // ── Manager feedback (last 5 entries) ───────────────────────────────────
  const { data: managerFeedback } = await admin
    .from('manager_notes')
    .select('id, content, source, created_at')
    .eq('journey_id', journey.id)
    .in('source', ['positive', 'constructive'])
    .order('created_at', { ascending: false })
    .limit(5)

  // ── Action log (last 8 entries) ──────────────────────────────────────────
  const { data: activityData } = await admin
    .from('action_log')
    .select('id, action_type, actor_role, label, created_at')
    .eq('journey_id', journey.id)
    .order('created_at', { ascending: false })
    .limit(8)
  const activityEntries = activityData ?? []

  // ── Proactive Aura message (generated today by inngest job) ──────────────
  const { data: latestPush } = await admin
    .from('action_log')
    .select('label, created_at')
    .eq('journey_id', journey.id)
    .eq('action_type', 'proactive_push')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  const proactiveMessage =
    latestPush?.created_at &&
    new Date(latestPush.created_at).toDateString() === new Date().toDateString()
      ? latestPush.label
      : null

  // ── 30/60/90 Goals ───────────────────────────────────────────────────────
  const { data: goalsData } = await admin
    .from('journey_goals')
    .select('id, milestone, title, description, status')
    .eq('journey_id', journey.id)
    .order('created_at', { ascending: true })
  const goals: JourneyGoal[] = (goalsData ?? []) as JourneyGoal[]

  // ── Preboarding view (start_date is in the future) ────────────────────────
  if (rawDayNumber < 0) {
    const daysUntilStart   = Math.abs(rawDayNumber)
    const preboardingTasks = (journey.template?.preboarding_tasks ?? []) as PreboardingTask[]
    return <PreboardingView daysUntilStart={daysUntilStart} journeyId={journey.id} preboardingTasks={preboardingTasks} />
  }

  return (
    <>
      <HireHeader />

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>
        <MobileTabs children={{
          today: (
            <>
              <AuraNudgeBanner
                dayNumber={dayNumber}
                pendingTasks={tasks.filter((t: any) => t.status !== 'completed' && t.week === journey.current_week).length}
                nextCheckIn={checkIns.find((c: any) => !c.completed_date)?.scheduled_date ?? null}
                managerName={journey.manager?.full_name ?? undefined}
                proactiveMessage={proactiveMessage}
              />
              <WelcomeBanner
                userName={user.full_name?.split(' ')[0] ?? 'there'}
                dayNumber={dayNumber}
                avatarUrl={journey.employee?.avatar_url ?? undefined}
                pendingTaskCount={tasks.filter((t: any) => t.status === 'pending' && t.week === journey.current_week).length}
                completedThisWeek={tasks.filter((t: any) => t.status === 'completed' && t.week === journey.current_week).length}
                totalThisWeek={tasks.filter((t: any) => t.week === journey.current_week).length}
                nextCheckInDate={checkIns.find((c: any) => !c.completed_date)?.scheduled_date ?? null}
                managerName={journey.manager?.full_name ?? undefined}
                focusTaskTitle={
                  (tasks.find((t: any) => t.week === journey.current_week && (t.status === 'in_progress' || t.status === 'pending')) ??
                   tasks.find((t: any) => t.week === journey.current_week + 1 && (t.status === 'in_progress' || t.status === 'pending')))?.title ?? null
                }
                overallCompletionPct={processValue}
                lastPulseScore={safeChecks.length > 0 ? safeChecks[safeChecks.length - 1]?.score ?? null : null}
                prevPulseScore={prevPulseScore}
                riskScore={journey.risk_score ?? null}
                cohortRankPct={cohortRankPct}
                completedLastWeek={completedLastWeek ?? undefined}
              />
              <TodayFocus
                tasks={tasks}
                currentWeek={journey.current_week}
                dayNumber={dayNumber}
                goals={goals}
                recommendedResource={(() => {
                  const rec = resources.find((r: any) => recommendedIds.includes(r.id)) ?? resources[0] ?? null
                  return rec ? { title: rec.title, url: rec.url ?? `/hire/resources` } : undefined
                })()}
              />
              {dayNumber <= 30 && (
                <Day1Banner
                  dayNumber={dayNumber}
                  userName={user.full_name?.split(' ')[0] ?? 'there'}
                  managerName={journey.manager?.full_name ?? undefined}
                  journeyId={journey.id}
                  templateName={journey.template?.name ?? undefined}
                />
              )}
              <PulseCheck
                currentWeek={journey.current_week}
                journeyId={journey.id}
                previousPulses={(pulseChecks ?? []).map((p: any) => ({ week: p.week, score: p.score }))}
              />
              {/* Report a blocker — surfaces friction reporting in the most-used tab */}
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <ReportBlockerButton journeyId={journey.id} />
              </div>
              <MeetingTimeline meetings={upcomingMeetings} />
              <PeopleConnect myInterests={myInterests} matches={peopleMatches} />
              <FeedbackPrompt journeyId={journey.id} pendingMilestones={activeMilestones} />
              <CheckInNotesCard checkIns={checkIns} managerName={journey.manager?.full_name ?? undefined} />
              <ManagerFeedbackCard feedback={managerFeedback ?? []} />
              {/* Show SocialBridge in today tab during first 14 days — connection is the #1 retention predictor */}
              {dayNumber <= 14 && (
                <SocialBridge contacts={[
                  ...(journey.manager?.full_name ? [{
                    name: journey.manager.full_name,
                    role: 'Your Manager',
                    email: journey.manager.email ?? undefined,
                    avatarUrl: journey.manager.avatar_url ?? undefined,
                    nextMeetingDate: checkIns.find((c: any) => !c.completed_date)?.scheduled_date ?? null,
                    lastNote: null,
                  } satisfies SocialContact] : []),
                  ...(hrRow?.full_name ? [{
                    name: hrRow.full_name,
                    role: 'HR',
                    email: hrRow.email ?? undefined,
                    avatarUrl: hrRow.avatar_url ?? undefined,
                  } satisfies SocialContact] : []),
                ]} />
              )}
            </>
          ),
          journey: (
            <>
              <SectionDivider label="Your Journey" icon="fa-solid fa-map" />
              <SuccessPlaybookCard
                dayNumber={dayNumber}
                goals={goals}
                tasks={tasks}
                checkIns={checkIns}
              />
              <JourneyRoadmap mutations={mutations} currentWeek={journey.current_week} journeyId={journey.id} tasks={tasks} />
              <div className="db-grid-2-1 hire-dashboard-grid" style={{ alignItems: 'start' }}>
                <div className="hire-dashboard-main" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>
                  <Suspense fallback={
                    <div className="db-card" style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 13 }}>
                      <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }} /> Loading journey...
                    </div>
                  }>
                    <JourneyView
                      journey={journey}
                      dbTasks={tasks}
                      checkIns={checkIns}
                      contacts={[
                        ...(journey.manager?.full_name ? [{ name: journey.manager.full_name, role: 'Direct Manager', dept: journey.manager.department ?? undefined, avatar: journey.manager.avatar_url ?? null }] : []),
                        ...(hrRow?.full_name ? [{ name: hrRow.full_name, role: 'HR Business Partner', dept: 'HR & People', avatar: hrRow.avatar_url ?? null }] : []),
                      ]}
                    />
                  </Suspense>
                  <FrictionMap points={frictionPoints} startDate={journey.start_date} journeyId={journey.id} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <ReportBlockerButton journeyId={journey.id} />
                  </div>
                </div>
                <div className="hire-dashboard-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>
                  <IntegrationRadar data={radarData} currentWeek={journey.current_week} journeyId={journey.id} initialHistory={radarHistory} />
                  <ActivityFeed entries={activityEntries} />
                  <MoodArc pulses={(pulseChecks ?? []).map((p: any) => ({ week: p.week, score: p.score }))} currentWeek={journey.current_week} />
                  <CollapseSection label="People & Achievements" count={3}>
                    <SocialBridge contacts={[
                      ...(journey.manager?.full_name ? [{
                        name:            journey.manager.full_name,
                        role:            'Your Manager',
                        email:           journey.manager.email ?? undefined,
                        avatarUrl:       journey.manager.avatar_url ?? undefined,

                        nextMeetingDate: checkIns.find((c: any) => !c.completed_date)?.scheduled_date ?? null,
                        lastNote:        (() => {
                          const last = checkIns.filter((c: any) => c.completed_date).pop()
                          if (!last) return null
                          const d = new Date(last.completed_date)
                          return `Last 1:1 on ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                        })(),
                      } satisfies SocialContact] : []),
                      ...(hrRow?.full_name ? [{
                        name:      hrRow.full_name,
                        role:      'HR',
                        email:     hrRow.email ?? undefined,
                        avatarUrl: hrRow.avatar_url ?? undefined,
                      } satisfies SocialContact] : []),
                    ]} />
                    <AchievementWall tasks={tasks} dayNumber={dayNumber} checkIns={checkIns} journeyId={journey.id} pulseChecks={(pulseChecks ?? []).map((p: any) => ({ week: p.week, score: p.score }))} seenAchievements={seenAchievements} />
                    <ResourceHub resources={resources} recommendedIds={recommendedIds} />
                  </CollapseSection>
                </div>
              </div>
            </>
          ),
          goals: (
            <>
              <SectionDivider label="Goals & Growth" icon="fa-solid fa-flag" />
              <GoalsBoard
                journeyId={journey.id}
                goals={goals}
                dayNumber={dayNumber}
                role={user.role}
                department={user.department ?? undefined}
                currentWeek={journey.current_week}
              />
            </>
          ),
        }} />
      </div>

      {/* Milestone celebration — shown once per milestone day */}
      <MilestoneCelebration
        journeyId={journey.id}
        dayNumber={dayNumber}
        userName={user.full_name ?? 'there'}
        tasksCompleted={allCompleted}
        totalTasks={totalTasks}
        checkInsCompleted={completedCheckins}
        goalsSet={goals.length}
      />

      {/* Journey outcome form — shown once when journey is completed */}
      {journey.status === 'completed' && (
        <JourneyOutcomeModal journeyId={journey.id} userName={user.full_name ?? 'there'} />
      )}

      {/* Completion certificate — downloadable at day 90 */}
      {journey.status === 'completed' && (
        <CompletionCertificate
          hireName={user.full_name ?? 'You'}
          managerName={journey.manager?.full_name}
          department={journey.employee?.department}
          completedAt={journey.start_date}
        />
      )}

      {/* Aura — floating AI assistant with full journey context */}
      <AuraAssistant
        role="hire"
        journeyContext={[
          // Tasks
          tasks.filter((t: any) => (t.status === 'pending' || t.status === 'in_progress') && t.week === journey.current_week).length > 0
            ? `Pending tasks this week: '${tasks.find((t: any) => (t.status === 'pending' || t.status === 'in_progress') && t.week === journey.current_week)?.title}'`
            : 'All tasks this week are complete.',
          `Current week: ${journey.current_week}. Day ${dayNumber} of onboarding.`,
          // Risk
          journey.risk_score > 60 ? 'Journey is currently at risk — you may be falling behind.' : 'Journey is progressing well.',
          // Check-ins
          checkIns.some((c: any) => !c.completed_date)
            ? `Next check-in with manager: ${checkIns.find((c: any) => !c.completed_date)?.scheduled_date?.split('T')[0]}.`
            : 'No upcoming check-ins scheduled yet.',
          // Goals
          goals.length > 0
            ? `You have ${goals.filter(g => g.milestone === 'day_30').length} goals for Day 30, ${goals.filter(g => g.milestone === 'day_60').length} for Day 60, ${goals.filter(g => g.milestone === 'day_90').length} for Day 90. Active goals: ${goals.filter(g => g.status !== 'completed').map(g => `'${g.title}'`).slice(0, 3).join(', ')}.`
            : 'No goals set yet. Use the Goals section to add your 30/60/90-day goals.',
          // Friction
          frictionPoints.length > 0
            ? `Active friction points: ${frictionPoints.slice(0, 2).map((fp: any) => fp.label ?? fp.type ?? String(fp)).join('; ')}.`
            : '',
          // Pulse trend + full history so Aura knows emotional state
          safeChecks.length > 0
            ? (() => {
                const scores = safeChecks.slice(-4).map((p: any) => p.score)
                const last   = scores[scores.length - 1]
                const trend  = scores.length >= 2
                  ? (scores[scores.length - 1] > scores[scores.length - 2] ? 'improving' : scores[scores.length - 1] < scores[scores.length - 2] ? 'declining' : 'stable')
                  : 'not enough data'
                const sustained = scores.length >= 3 && scores.every((s: number) => s <= 2)
                return `Pulse history (last ${scores.length} weeks): ${scores.join(' → ')}/5. Current: ${last}/5 (${trend})${sustained ? ' — ALERT: sustained low morale for 3+ weeks.' : ''}.`
              })()
            : 'No pulse checks submitted yet.',
          // Manager
          journey.manager?.full_name ? `Your manager is ${journey.manager.full_name}.` : '',
        ].filter(Boolean).join(' ')}
        resources={resources.slice(0, 8).map((r: any) => ({ id: r.id, title: r.title }))}
      />
    </>
  )
}

// ── CheckInNotesCard ──────────────────────────────────────────────────────
// Shows the manager's notes from the most recently completed check-in.

function CheckInNotesCard({
  checkIns,
  managerName,
}: {
  checkIns: { completed_date?: string | null; manager_notes?: string | null; type?: string }[]
  managerName?: string
}) {
  const last = checkIns
    .filter(c => c.completed_date && c.manager_notes)
    .sort((a, b) => new Date(b.completed_date!).getTime() - new Date(a.completed_date!).getTime())[0]

  if (!last) return null

  const typeLabel: Record<string, string> = {
    weekly: 'Weekly 1:1', day_7: '7-Day Review', day30: '30-Day Review',
    day60: '60-Day Review', day90: '90-Day Sign-off',
  }
  const label = typeLabel[last.type ?? ''] ?? 'Check-in'
  const date  = new Date(last.completed_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-note-sticky" style={{ color: 'var(--blue)', marginRight: 7 }} aria-hidden="true" />
          Notes from your {label}
        </h3>
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{date}{managerName ? ` · ${managerName}` : ''}</span>
      </div>
      <div className="db-card-bd">
        <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap' }}>
          {last.manager_notes}
        </p>
      </div>
    </div>
  )
}

// ── ManagerFeedbackCard ───────────────────────────────────────────────────

interface ManagerFeedbackEntry {
  id: string
  content: string
  source: string
  created_at: string
}

function ManagerFeedbackCard({ feedback }: { feedback: ManagerFeedbackEntry[] }) {
  if (feedback.length === 0) return null

  function relativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return '1 day ago'
    return `${days} days ago`
  }

  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-heart" style={{ color: 'var(--red)', marginRight: 7 }} aria-hidden="true" />
          From your manager
        </h3>
      </div>
      <div className="db-card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {feedback.map(note => (
          <div
            key={note.id}
            style={{
              borderLeft: `3px solid ${note.source === 'positive' ? 'var(--green)' : 'var(--amber)'}`,
              paddingLeft: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <p style={{ fontSize: 13, color: 'var(--text)', margin: 0, lineHeight: 1.6 }}>{note.content}</p>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{relativeTime(note.created_at)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── SectionDivider ────────────────────────────────────────────────────────

function SectionDivider({ label, icon }: { label: string; icon: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 -4px' }}>
      <i className={icon} style={{ fontSize: 12, color: 'var(--cyan)', flexShrink: 0 }} aria-hidden="true" />
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

// ── SuccessPlaybookCard ────────────────────────────────────────────────────

const PLAYBOOK_MILESTONES = [
  {
    milestone: 'day_30' as const,
    label: 'Day 30',
    icon: 'fa-solid fa-seedling',
    color: 'var(--cyan)',
    defaultItems: [
      "Understand your team's priorities and working style",
      'Complete all setup and access tasks',
      'Have your first 1:1 with your manager',
      'Learn the product or service end-to-end',
    ],
  },
  {
    milestone: 'day_60' as const,
    label: 'Day 60',
    icon: 'fa-solid fa-chart-line',
    color: 'var(--blue)',
    defaultItems: [
      'Contribute to at least one project or initiative',
      'Build relationships with key stakeholders',
      'Identify an area where you can add unique value',
      'Complete your first full sprint or delivery cycle',
    ],
  },
  {
    milestone: 'day_90' as const,
    label: 'Day 90',
    icon: 'fa-solid fa-rocket',
    color: 'var(--violet)',
    defaultItems: [
      'Operate independently on your core responsibilities',
      'Propose one improvement or initiative',
      'Receive a formal 90-day review from your manager',
      'Set your 6-month goals with your manager',
    ],
  },
]

function SuccessPlaybookCard({
  dayNumber,
  goals,
  tasks,
  checkIns,
}: {
  dayNumber: number
  goals: { milestone: string; title: string; status: string }[]
  tasks: { week: number; status: string }[]
  checkIns: { completed_date?: string | null; type?: string }[]
}) {
  const currentMilestone = dayNumber <= 30 ? 'day_30' : dayNumber <= 60 ? 'day_60' : 'day_90'
  const activePb = PLAYBOOK_MILESTONES.find(p => p.milestone === currentMilestone) ?? PLAYBOOK_MILESTONES[0]

  // Surface hire's own goals for this milestone if they exist
  const milestoneGoals = goals.filter(g => g.milestone === currentMilestone)
  const items = milestoneGoals.length > 0
    ? milestoneGoals.map(g => ({ text: g.title, done: g.status === 'completed' }))
    : activePb.defaultItems.map(text => ({ text, done: false }))

  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3>
          <i className={activePb.icon} style={{ color: activePb.color, marginRight: 7 }} aria-hidden="true" />
          {activePb.label} Success Playbook
        </h3>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: `color-mix(in srgb, ${activePb.color} 12%, transparent)`, color: activePb.color, border: `1px solid color-mix(in srgb, ${activePb.color} 30%, transparent)` }}>
          Day {dayNumber}
        </span>
      </div>
      <div className="db-card-bd">
        <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12, lineHeight: 1.5 }}>
          What great looks like by {activePb.label.toLowerCase()}
          {milestoneGoals.length > 0 ? ' — based on your goals' : ' — default playbook'}:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <i
                className={item.done ? 'fa-solid fa-circle-check' : 'fa-regular fa-circle'}
                style={{ fontSize: 13, color: item.done ? 'var(--green)' : 'var(--border)', flexShrink: 0, marginTop: 1 }}
                aria-hidden="true"
              />
              <span style={{ fontSize: 13, color: item.done ? 'var(--text3)' : 'var(--text)', lineHeight: 1.55, textDecoration: item.done ? 'line-through' : 'none' }}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
        {milestoneGoals.length === 0 && (
          <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 12 }}>
            <i className="fa-solid fa-circle-info" style={{ marginRight: 5 }} aria-hidden="true" />
            Set goals in the Goals tab to personalise this playbook.
          </p>
        )}
      </div>
    </div>
  )
}

// ── NoJourneyView ──────────────────────────────────────────────────────────
// Shown when the user has no journey assigned yet.

function NoJourneyView({ userName }: { userName: string }) {
  return (
    <>
      <HireHeader />
      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-xl)',
            padding: '48px 40px',
            maxWidth: 520,
            width: '100%',
            textAlign: 'center',
            boxShadow: 'var(--card-shadow)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: -60,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 280,
              height: 280,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(0,200,224,0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'var(--grad)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <i className="fa-solid fa-hourglass-half" style={{ fontSize: 22, color: '#fff' }} aria-hidden="true" />
            </div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                color: 'var(--text)',
                marginBottom: 10,
              }}
            >
              Hey {userName}, we&apos;re getting ready for you!
            </h2>
            <p style={{ fontSize: 14, color: 'var(--text3)', lineHeight: 1.65, marginBottom: 28 }}>
              Your onboarding journey is being set up by your HR team. You&apos;ll have full access to your tasks, roadmap, and resources shortly.
            </p>
            <a
              href="/hire/resources/wiki"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--grad)',
                color: '#fff',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 14,
                padding: '12px 28px',
                borderRadius: 'var(--r)',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(0,200,224,0.25)',
              }}
            >
              <i className="fa-solid fa-book-open" aria-hidden="true" />
              Explore the company wiki in the meantime
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

// ── PreboardingView ────────────────────────────────────────────────────────

interface PreboardingViewProps {
  daysUntilStart:   number
  journeyId:        string
  preboardingTasks: PreboardingTask[]
}

function PreboardingView({ daysUntilStart, journeyId, preboardingTasks }: PreboardingViewProps) {
  return (
    <>
      <HireHeader />

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        {/* Countdown hero card */}
        <div style={{
          background: 'linear-gradient(135deg, #0A0F1E 0%, #0D1D3E 100%)',
          borderRadius: 'var(--r-xl)', padding: '40px 36px',
          position: 'relative', overflow: 'hidden',
          color: '#fff', boxShadow: '0 16px 56px rgba(13,21,41,0.22)', textAlign: 'center',
        }}>
          <div aria-hidden="true" style={{
            position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
            width: 360, height: 360, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,200,224,0.16) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--cyan)', fontFamily: 'var(--font-display)', marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}>
              <i className="fa-solid fa-hourglass-half" aria-hidden="true" />
              Your journey begins soon
            </div>

            <div style={{
              fontSize: 64, fontWeight: 900, fontFamily: 'var(--font-display)',
              lineHeight: 1, marginBottom: 8,
              background: 'linear-gradient(135deg, #00C8E0, #fff)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              {daysUntilStart}
            </div>

            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 12 }}>
              {daysUntilStart === 1 ? 'day' : 'days'} until you start!
            </div>

            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.72)', maxWidth: 440, margin: '0 auto' }}>
              We&apos;re excited to have you on board. Use this time to get a head start on your
              onboarding so day one feels like day two.
            </p>
          </div>
        </div>

        {/* Dynamic checklist — template-driven, completion tracked in localStorage */}
        <PreboardingChecklist journeyId={journeyId} tasks={preboardingTasks} />

      </div>
      <OnboardingTour />
    </>
  )
}
