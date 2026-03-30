import { createSupabaseAdmin } from '@/lib/db/supabase-server'
import RiskScoreCard from '@/components/ai/RiskScoreCard'
import AIInsightBanner from '@/components/ai/AIInsightBanner'
import RunRiskScanButton from '@/components/ai/RunRiskScanButton'

export const dynamic = 'force-dynamic'

export default async function HRAnalytics() {
  const supabase = createSupabaseAdmin()

  // Fetch all journeys with related data
  const { data: journeys } = await supabase
    .from('journeys')
    .select(
      '*, employee:profiles!employee_id(id, full_name, avatar_url, department), manager:profiles!manager_id(id, full_name)'
    )
    .order('risk_score', { ascending: false })

  const [tasksRes, checkInsRes, feedbackRes] = await Promise.all([
    supabase.from('journey_tasks').select('journey_id, status, week'),
    supabase.from('check_ins')
      .select('*, journey:journeys!journey_id(employee:profiles!employee_id(full_name, department)), manager:profiles!manager_id(full_name)')
      .order('scheduled_date', { ascending: true }),
    supabase.from('feedback_surveys')
      .select('*, employee:profiles!employee_id(full_name)')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const { data: tasks } = tasksRes
  const allCheckIns = checkInsRes.data || []
  const allFeedback = feedbackRes.data || []

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

      {/* Check-ins Overview */}
      <div style={{ marginTop: '32px' }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem', marginBottom: '14px' }}>
          Check-ins Overview
        </h2>
        <div className="kpi-row" style={{ marginBottom: '16px' }}>
          <div className="kpi-box">
            <div className="kpi-n">{allCheckIns.length}</div>
            <div className="kpi-l">Total</div>
          </div>
          <div className="kpi-box green">
            <div className="kpi-n">{allCheckIns.filter((ci: any) => ci.completed_date).length}</div>
            <div className="kpi-l">Completed</div>
          </div>
          <div className="kpi-box red">
            <div className="kpi-n">{allCheckIns.filter((ci: any) => !ci.completed_date && new Date(ci.scheduled_date) < new Date()).length}</div>
            <div className="kpi-l">Overdue</div>
          </div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '16px' }}>
          {allCheckIns.filter((ci: any) => !ci.completed_date).slice(0, 10).map((ci: any) => {
            const isPast = new Date(ci.scheduled_date) < new Date()
            return (
              <div key={ci.id} style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0',
                borderBottom: '1px solid var(--border)',
              }}>
                <i className={`fa-solid ${isPast ? 'fa-triangle-exclamation' : 'fa-calendar-check'}`}
                   style={{ color: isPast ? 'var(--amber)' : 'var(--blue)', width: '20px', textAlign: 'center' }}></i>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '0.85rem' }}>
                    {ci.milestone?.replace('_', ' ').replace('day', 'Day ')}
                  </strong>
                  <span style={{ color: 'var(--text3)', fontSize: '0.8rem', marginLeft: '8px' }}>
                    {(ci.journey as any)?.employee?.full_name || 'Unknown'}
                  </span>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>
                  Manager: {(ci.manager as any)?.full_name || 'Unknown'}
                </span>
                <span style={{ fontSize: '0.75rem', color: isPast ? 'var(--amber)' : 'var(--text3)' }}>
                  {new Date(ci.scheduled_date).toLocaleDateString()}
                  {isPast && ' (overdue)'}
                </span>
              </div>
            )
          })}
          {allCheckIns.filter((ci: any) => !ci.completed_date).length === 0 && (
            <p style={{ color: 'var(--text3)', fontSize: '0.85rem', textAlign: 'center', padding: '12px' }}>
              All check-ins completed.
            </p>
          )}
        </div>
      </div>

      {/* Feedback & NPS */}
      <div style={{ marginTop: '32px' }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem', marginBottom: '14px' }}>
          Feedback & NPS
        </h2>
        {allFeedback.length > 0 ? (
          <>
            <div style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)', padding: '16px', marginBottom: '16px',
              display: 'flex', alignItems: 'center', gap: '16px',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--amber, #ffa726)' }}>
                  {(allFeedback.reduce((sum: number, f: any) => sum + f.rating, 0) / allFeedback.length).toFixed(1)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>Avg Rating</div>
              </div>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <i key={star} className="fa-solid fa-star" style={{
                    fontSize: '1.2rem',
                    color: star <= Math.round(allFeedback.reduce((sum: number, f: any) => sum + f.rating, 0) / allFeedback.length)
                      ? 'var(--amber, #ffa726)' : 'var(--text4)',
                  }}></i>
                ))}
              </div>
              <span style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>
                from {allFeedback.length} response{allFeedback.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '16px' }}>
              {allFeedback.map((f: any) => (
                <div key={f.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '0.85rem' }}>{(f.employee as any)?.full_name || 'Unknown'}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>
                      {f.milestone?.replace('_', ' ').replace('day', 'Day ')} · {new Date(f.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i key={star} className="fa-solid fa-star" style={{
                        fontSize: '0.7rem',
                        color: star <= f.rating ? 'var(--amber, #ffa726)' : 'var(--text4)',
                      }}></i>
                    ))}
                  </div>
                  {f.comments && (
                    <p style={{ color: 'var(--text3)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                      &ldquo;{f.comments}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>No feedback surveys submitted yet.</p>
        )}
      </div>
    </div>
  )
}
