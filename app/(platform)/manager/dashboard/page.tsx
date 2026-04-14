import { getUser } from '@/lib/auth/get-user'
import { getManagerDashboardData } from '@/lib/db/queries/manager'
import ManagerDashboardClient from './ManagerDashboardClient'

export const dynamic = 'force-dynamic'

export default async function ManagerDashboard() {
  const user = await getUser()
  const { journeys, upcomingCheckIns } = await getManagerDashboardData(user.id)

  // ── Mock fallback journeys for demo ─────────────────────────────────────
  const MOCK_JOURNEYS = [
    { id: 'j1', status: 'in_progress', current_week: 3,  risk_score: 18, sentiment_score: 82, start_date: '2026-03-01', employee: { id: 'e1', full_name: 'Marcus Reed',  department: 'Product',     avatar_url: 'https://i.pravatar.cc/150?u=marcus' } },
    { id: 'j2', status: 'at_risk',     current_week: 7,  risk_score: 74, sentiment_score: 38, start_date: '2026-01-15', employee: { id: 'e2', full_name: 'Priya Mehta',  department: 'Engineering', avatar_url: 'https://i.pravatar.cc/150?u=priya'  } },
    { id: 'j4', status: 'in_progress', current_week: 2,  risk_score: 12, sentiment_score: 91, start_date: new Date(Date.now() - 12 * 86400000).toISOString(), employee: { id: 'e4', full_name: 'Diana Torres', department: 'Design', avatar_url: 'https://i.pravatar.cc/150?u=diana' } },
  ] as any[]

  const resolvedJourneys = journeys.length > 0 ? journeys : MOCK_JOURNEYS

  let activeJourney = (resolvedJourneys[1] as any) || null

  if (!activeJourney) {
    activeJourney = {
      id: 'demo-journey-id',
      employee_id: 'demo-emp-id',
      start_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      current_week: 6,
      risk_score: 75,
      employee: { full_name: 'Priya Mehta', avatar_url: null },
      status: 'at_risk'
    } as any
  }
  
  // Mock metrics for high-fidelity parity
  const mockIntegrationMetrics = [
    { label: 'Social Integration', value: 85, icon: 'fa-solid fa-users', color: 'var(--cyan)' },
    { label: 'Technical Ramp-up', value: 72, icon: 'fa-solid fa-laptop-code', color: 'var(--blue)' },
    { label: 'Culture Alignment', value: 94, icon: 'fa-solid fa-heart', color: 'var(--aqua)' }
  ]
  
  // Extract friction points with a demo fallback if the AI hasn't run yet
  let frictionPoints = []
  if (activeJourney?.friction_points) {
    frictionPoints = activeJourney.friction_points
  } else if (activeJourney?.risk_reasons && typeof activeJourney.risk_reasons === 'string') {
    try {
      const parsed = JSON.parse(activeJourney.risk_reasons)
      if (parsed.points) frictionPoints = parsed.points
    } catch (e) {}
  }

  // Demo Fallback for 2026 "State of the Art" presentation
  if (frictionPoints.length === 0 && activeJourney) {
    frictionPoints = [
      { 
        id: 'f1', type: 'technical', severity: 'medium', day: 14, 
        label: 'IT Setup Stall', 
        description: 'New hire has not completed the VPN and Security Setup tasks for over 5 days.',
        intervention: 'Directly message the IT support lead and cc the new hire to unblock access immediately.' 
      },
      { 
        id: 'f2', type: 'culture', severity: 'high', day: 45, 
        label: 'Social Disconnect', 
        description: 'Employee has skipped the last three team social events and the "Team Intro" coffee chat.',
        intervention: 'Organize a low-pressure luncheon and assign a different peer buddy to facilitate better informal bonding.' 
      }
    ]
  }

  const overallProgress = activeJourney ? Math.min(Math.round((activeJourney.current_week / 12) * 100), 100) : 0
  const atRiskCount = resolvedJourneys.filter((j: any) => j.risk_score > 60).length

  return (
    <ManagerDashboardClient
      user={user}
      journeys={resolvedJourneys}
      activeJourney={activeJourney}
      upcomingCheckIns={upcomingCheckIns}
      frictionPoints={frictionPoints as any}
      mockIntegrationMetrics={mockIntegrationMetrics}
      overallProgress={overallProgress}
      atRiskCount={atRiskCount}
    />
  )
}

