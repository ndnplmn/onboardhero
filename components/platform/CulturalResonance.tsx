'use client'

interface CulturalResonanceProps {
  taskCompletionPct:   number   // 0-100
  atRiskCount:         number
  totalHires:          number
  avgFeedbackRating?:  number   // 1-5 scale
  checkInsCompleted:   number
  totalCheckIns:       number
  prevEngagementIndex?: number  // provided by parent when historical data exists
}

function getSentimentLabel(rating?: number): { label: string; color: string } {
  if (!rating) return { label: 'No data', color: 'var(--text3)' }
  if (rating >= 4.2) return { label: 'Positive',  color: 'var(--green)' }
  if (rating >= 3.0) return { label: 'Neutral',   color: 'var(--amber)' }
  return                     { label: 'Concerned', color: 'var(--red)'   }
}

export default function CulturalResonance({
  taskCompletionPct,
  atRiskCount,
  totalHires,
  avgFeedbackRating,
  checkInsCompleted,
  totalCheckIns,
  prevEngagementIndex,
}: CulturalResonanceProps) {
  const checkInRate   = totalCheckIns > 0 ? Math.round((checkInsCompleted / totalCheckIns) * 100) : 0
  const feedbackScore = avgFeedbackRating ? Math.round((avgFeedbackRating / 5) * 100) : 0
  const retentionRisk = totalHires > 0 ? Math.round((atRiskCount / totalHires) * 100) : 0
  const sentiment     = getSentimentLabel(avgFeedbackRating)

  // Engagement Index: weighted average of task completion (40%), check-in rate (35%), feedback (25%)
  const hasData = totalHires > 0
  const engagementIndex = hasData
    ? Math.round(taskCompletionPct * 0.4 + checkInRate * 0.35 + feedbackScore * 0.25)
    : 0

  // Real delta — only shown when historical data is provided by parent (from DB)
  const hasDelta = prevEngagementIndex !== undefined
  const delta    = hasDelta ? engagementIndex - prevEngagementIndex! : 0

  // Alignment: average of task velocity and check-in engagement — a real measure of
  // "is the hire keeping pace with both work and human touchpoints?"
  const alignmentScore = hasData
    ? Math.round((taskCompletionPct + checkInRate) / 2)
    : 0

  const SIGNALS = [
    {
      label: 'Task velocity',
      value: `${taskCompletionPct}%`,
      color: taskCompletionPct >= 70 ? 'var(--green)' : taskCompletionPct >= 40 ? 'var(--amber)' : 'var(--red)',
      pct:   taskCompletionPct,
    },
    {
      label: 'Check-in rate',
      value: `${checkInRate}%`,
      color: checkInRate >= 80 ? 'var(--green)' : checkInRate >= 50 ? 'var(--amber)' : 'var(--red)',
      pct:   checkInRate,
    },
    {
      label: 'Feedback score',
      value: avgFeedbackRating ? `${avgFeedbackRating.toFixed(1)}/5` : '—',
      color: feedbackScore >= 70 ? 'var(--green)' : feedbackScore >= 50 ? 'var(--amber)' : 'var(--text3)',
      pct:   feedbackScore,
    },
  ]

  return (
    <div className="db-card" style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-brain" style={{ color: 'var(--purple)' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)' }}>Cultural Resonance</h3>
        </div>
        <div className="badge-ai">Live Signals</div>
      </div>

      {/* Hero metric */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        {hasData ? (
          <>
            <div style={{ fontSize: '42px', fontWeight: 900, letterSpacing: '-2px', color: 'var(--text)' }}>
              {engagementIndex}%
            </div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text3)', margin: '2px 0' }}>
              Engagement Index
            </div>
            {hasDelta ? (
              <span style={{
                fontSize: '10px', fontWeight: 700,
                color: delta >= 0 ? 'var(--green)' : 'var(--red)',
                background: delta >= 0 ? 'var(--green-bg)' : 'var(--red-bg)',
                padding: '2px 8px', borderRadius: '4px', display: 'inline-block',
              }}>
                {delta >= 0 ? `↑ +${delta}pt` : `↓ ${delta}pt`} vs last month
              </span>
            ) : (
              <span style={{
                fontSize: '10px', fontWeight: 700,
                color: 'var(--text3)',
                background: 'var(--surface2)',
                padding: '2px 8px', borderRadius: '4px', display: 'inline-block',
              }}>
                Baseline established
              </span>
            )}
          </>
        ) : (
          <div style={{ color: 'var(--text3)', fontSize: 13, padding: '12px 0' }}>
            No hires yet — data will appear once journeys start.
          </div>
        )}
      </div>

      {/* Signal bars */}
      {hasData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {SIGNALS.map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', width: 88, flexShrink: 0 }}>{s.label}</span>
              <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: 100, transition: 'width 0.6s var(--ease)' }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: s.color, width: 36, textAlign: 'right', flexShrink: 0 }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stats grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
        marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)',
      }}>
        <div>
          <span style={{ display: 'block', fontSize: '9px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '2px' }}>
            Alignment
          </span>
          <strong style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: 'var(--text)' }}>
            {hasData ? `${alignmentScore}%` : '—'}
          </strong>
        </div>
        <div>
          <span style={{ display: 'block', fontSize: '9px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '2px' }}>
            Sentiment
          </span>
          <strong style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: sentiment.color }}>
            {sentiment.label}
          </strong>
        </div>
        <div>
          <span style={{ display: 'block', fontSize: '9px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '2px' }}>
            Retention Risk
          </span>
          <strong style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: retentionRisk > 20 ? 'var(--red)' : retentionRisk > 10 ? 'var(--amber)' : 'var(--green)' }}>
            {hasData ? `${retentionRisk}%` : '—'}
          </strong>
        </div>
      </div>
    </div>
  )
}
