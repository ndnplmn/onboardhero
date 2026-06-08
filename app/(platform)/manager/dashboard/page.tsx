import { getUser } from '@/lib/auth/get-user'
import { getManagerDashboardData } from '@/lib/db/queries/manager'
import ManagerDashboardClient from './ManagerDashboardClient'

export const dynamic = 'force-dynamic'

export default async function ManagerDashboard() {
  const user = await getUser()
  const { journeys, upcomingCheckIns, managerTasks, avgFeedbackRating, hireGoals, effectiveness } = await getManagerDashboardData(user.id)

  // No hires yet — show a guided empty state on the client side
  if (journeys.length === 0) {
    return (
      <ManagerDashboardClient
        user={user}
        journeys={[]}
        activeJourney={null}
        upcomingCheckIns={[]}
        managerTasks={managerTasks}
        frictionPoints={[]}
        overallProgress={0}
        atRiskCount={0}
        avgFeedbackRating={avgFeedbackRating ?? undefined}
        hireGoals={[]}
      />
    )
  }

  // Pick the highest-risk active journey as the default focus
  const activeJourney =
    journeys.find((j: any) => (j.risk_score ?? 0) > 60 && j.status !== 'completed') ??
    journeys[0]

  // Extract friction points from real AI scan data only — no fake fallbacks
  let frictionPoints: any[] = []
  if (activeJourney?.friction_points && Array.isArray(activeJourney.friction_points)) {
    frictionPoints = activeJourney.friction_points
  } else if (activeJourney?.risk_reasons && typeof activeJourney.risk_reasons === 'string') {
    try {
      const parsed = JSON.parse(activeJourney.risk_reasons)
      if (Array.isArray(parsed.points)) frictionPoints = parsed.points
    } catch {}
  }

  const overallProgress = activeJourney
    ? Math.min(Math.round(((activeJourney.current_week ?? 0) / (activeJourney.template?.duration_days ? Math.round(activeJourney.template.duration_days / 7) : 12)) * 100), 100)
    : 0
  const atRiskCount = journeys.filter((j: any) => (j.risk_score ?? 0) > 60).length

  return (
    <ManagerDashboardClient
      user={user}
      journeys={journeys}
      activeJourney={activeJourney}
      upcomingCheckIns={upcomingCheckIns}
      managerTasks={managerTasks}
      frictionPoints={frictionPoints}
      overallProgress={overallProgress}
      atRiskCount={atRiskCount}
      avgFeedbackRating={avgFeedbackRating ?? undefined}
      hireGoals={hireGoals}
      effectiveness={effectiveness}
    />
  )
}
