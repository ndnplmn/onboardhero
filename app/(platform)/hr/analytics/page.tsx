import { createSupabaseServer } from '@/lib/db/supabase-server'
import KPICard from '@/components/platform/KPICard'
import RiskScoreCard from '@/components/ai/RiskScoreCard'
import AIInsightBanner from '@/components/ai/AIInsightBanner'
import RunRiskScanButton from '@/components/ai/RunRiskScanButton'

export const dynamic = 'force-dynamic'

export default async function HRAnalytics() {
  const supabase = await createSupabaseServer()

  // Fetch all journeys with related data
  const { data: journeys } = await supabase
    .from('journeys')
    .select(
      '*, employee:profiles!employee_id(id, full_name, avatar_url, department), manager:profiles!manager_id(id, full_name)'
    )
    .order('risk_score', { ascending: false })

  const { data: tasks } = await supabase
    .from('journey_tasks')
    .select('journey_id, status, week')

  const allJourneys = journeys || []
  const allTasks = tasks || []

  const activeJourneys = allJourneys.filter(
    (j: any) => j.status !== 'completed'
  )
  const completedTasks = allTasks.filter(
    (t: any) => t.status === 'completed'
  ).length
  const atRisk = activeJourneys.filter((j: any) => j.risk_score > 60).length
  const onTrack =
    activeJourneys.length > 0
      ? Math.round(
          (activeJourneys.filter((j: any) => j.risk_score <= 30).length /
            activeJourneys.length) *
            100
        )
      : 100

  // Completion by week (weeks 1–12)
  const weekData = Array.from({ length: 12 }, (_, i) => {
    const week = i + 1
    const weekTasks = allTasks.filter((t: any) => t.week === week)
    const weekCompleted = weekTasks.filter(
      (t: any) => t.status === 'completed'
    ).length
    const rate = weekTasks.length > 0 ? Math.round((weekCompleted / weekTasks.length) * 100) : 0
    return { week, total: weekTasks.length, completed: weekCompleted, rate }
  })

  // Sort active journeys by risk score for the risk overview
  const sortedByRisk = [...activeJourneys].sort(
    (a: any, b: any) => (b.risk_score ?? 0) - (a.risk_score ?? 0)
  )

  const insightText =
    atRisk > 0
      ? `${atRisk} employee${atRisk > 1 ? 's' : ''} currently flagged as at-risk. ${onTrack}% of active journeys are on track. Run a risk analysis to get updated scores and actionable recommendations.`
      : `All ${activeJourneys.length} active journeys are on track. Run a risk analysis to verify scores and detect early signals.`

  return (
    <div style={{ padding: '32px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <h1 style={{ fontFamily: "'Outfit', sans-serif" }}>Analytics</h1>
        <RunRiskScanButton />
      </div>

      <AIInsightBanner text={insightText} />

      {/* KPIs */}
      <div className="kpi-row">
        <div className="kpi-box">
          <div className="kpi-icon-sm">&#x1F465;</div>
          <div className="kpi-n">{activeJourneys.length}</div>
          <div className="kpi-l">Active Journeys</div>
        </div>
        <div className="kpi-box green">
          <div className="kpi-icon-sm">&#x2705;</div>
          <div className="kpi-n">{onTrack}%</div>
          <div className="kpi-l">On Track</div>
        </div>
        <div className="kpi-box">
          <div className="kpi-icon-sm">&#x1F4CB;</div>
          <div className="kpi-n">{completedTasks}</div>
          <div className="kpi-l">Tasks Completed</div>
        </div>
        <div className="kpi-box red">
          <div className="kpi-icon-sm">&#x26A0;</div>
          <div className="kpi-n">{atRisk}</div>
          <div className="kpi-l">At Risk</div>
        </div>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px', marginTop: '22px' }}>
        {/* Risk Overview */}
        <div>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '1.1rem',
              marginBottom: '14px',
            }}
          >
            Risk Overview
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sortedByRisk.length === 0 ? (
              <p style={{ color: 'var(--text3)', fontSize: '13px' }}>
                No active journeys to display.
              </p>
            ) : (
              sortedByRisk.map((j: any) => (
                <RiskScoreCard
                  key={j.id}
                  employeeName={j.employee?.full_name || 'Unknown'}
                  department={j.employee?.department || 'General'}
                  score={j.risk_score ?? 0}
                  currentWeek={j.current_week ?? 1}
                  reasons={j.risk_reasons || []}
                  avatarUrl={j.employee?.avatar_url}
                  employeeId={j.employee?.id}
                />
              ))
            )}
          </div>
        </div>

        {/* Completion by Week */}
        <div>
          <h2
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: '1.1rem',
              marginBottom: '14px',
            }}
          >
            Completion by Week
          </h2>
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)',
              padding: '18px',
            }}
          >
            {weekData.map((w) => (
              <div
                key={w.week}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '10px',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--text3)',
                    minWidth: '50px',
                  }}
                >
                  Week {w.week}
                </span>
                <div className="hce-prog" style={{ flex: 1, height: '8px' }}>
                  <div
                    className={`hce-bar${w.rate < 50 ? ' risk' : ''}`}
                    style={{ width: `${w.rate}%` }}
                  />
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: w.rate < 50 ? 'var(--amber)' : 'var(--text2)',
                    minWidth: '36px',
                    textAlign: 'right',
                  }}
                >
                  {w.rate}%
                </span>
              </div>
            ))}

            {allTasks.length === 0 && (
              <p
                style={{
                  color: 'var(--text3)',
                  fontSize: '13px',
                  textAlign: 'center',
                  padding: '20px 0',
                }}
              >
                No task data available yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
