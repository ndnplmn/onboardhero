import React from 'react'

interface Journey {
  sentiment_score?: number | null
  risk_score?: number | null
}

interface TeamSentimentProps {
  journeys?: Journey[]
}

export default function TeamSentiment({ journeys = [] }: TeamSentimentProps) {
  const withScores = journeys.filter(j => typeof j.sentiment_score === 'number' && j.sentiment_score > 0)

  // Derive score from sentiment_score (0-1 range) → percentage, fall back to inverse of avg risk
  let score: number
  let trend: 'up' | 'down' | 'steady'
  let label: string

  if (withScores.length > 0) {
    const avg = withScores.reduce((s, j) => s + (j.sentiment_score! * 100), 0) / withScores.length
    score = Math.round(avg)

    const half = Math.ceil(withScores.length / 2)
    const first  = withScores.slice(0, half).reduce((s, j) => s + j.sentiment_score!, 0) / half
    const second = withScores.slice(half).reduce((s, j) => s + j.sentiment_score!, 0) / Math.max(withScores.length - half, 1)
    trend = second > first + 0.05 ? 'up' : second < first - 0.05 ? 'down' : 'steady'
  } else if (journeys.length > 0) {
    const avgRisk = journeys.reduce((s, j) => s + (j.risk_score ?? 50), 0) / journeys.length
    score = Math.round(100 - avgRisk)
    trend = score >= 70 ? 'up' : score <= 40 ? 'down' : 'steady'
  } else {
    score = 0
    trend = 'steady'
  }

  label = score >= 75 ? 'High Resonance' : score >= 50 ? 'Moderate' : score > 0 ? 'Needs Attention' : 'No Data'

  const trendColor = trend === 'up' ? 'var(--green)' : trend === 'down' ? 'var(--red)' : 'var(--text3)'
  const trendIcon  = trend === 'up' ? 'fa-arrow-trend-up' : trend === 'down' ? 'fa-arrow-trend-down' : 'fa-minus'

  const atRisk     = journeys.filter(j => (j.risk_score ?? 0) > 60).length
  const burnoutRisk = atRisk > 0 ? (atRisk >= 2 ? 'High' : 'Medium') : 'Low'
  const burnoutColor = atRisk > 0 ? (atRisk >= 2 ? 'var(--red)' : 'var(--amber)') : 'var(--green)'

  const engagementScore = journeys.length > 0
    ? Math.round(journeys.filter(j => (j.risk_score ?? 100) <= 60).length / journeys.length * 100)
    : 0
  const resonanceScore = score

  return (
    <div className="pro-max-card" style={{ padding: '24px' }}>
      <div className="db-card-hd" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-brain" style={{ color: 'var(--aqua)' }} />
          <h3>Team Sentiment</h3>
        </div>
        <div className="badge-ai">Live Data</div>
      </div>

      <div className="sentiment-hero" style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div className="s-value" style={{ fontSize: '38px', fontWeight: '900', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          {score > 0 ? `${score}%` : '—'}
          {score > 0 && (
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: trend === 'up' ? 'var(--green-light)' : trend === 'down' ? 'var(--red-bg)' : 'var(--surface)', color: trendColor, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className={`fa-solid ${trendIcon}`} />
              {trend === 'steady' ? 'Steady' : trend === 'up' ? '+' : '−'}
            </span>
          )}
        </div>
        <div className="s-label" style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '4px' }}>{label}</div>
      </div>

      <div className="sentiment-wave" style={{ height: '50px', margin: '15px 0' }}>
        <svg viewBox="0 0 400 60" className="wav-svg" style={{ width: '100%', height: '100%' }}>
          <path d="M 0 30 Q 50 10, 100 30 T 200 30 T 300 30 T 400 30" style={{ fill: 'none', stroke: 'var(--cyan)', strokeWidth: '2', strokeLinecap: 'round', opacity: score > 0 ? 0.6 : 0.2 }} />
          <path d="M 0 30 Q 50 50, 100 30 T 200 30 T 300 30 T 400 30" style={{ fill: 'none', stroke: 'var(--blue)', strokeWidth: '1.5', strokeLinecap: 'round', opacity: score > 0 ? 0.3 : 0.1 }} />
        </svg>
      </div>

      <div className="sentiment-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
        <div className="m-item">
          <span style={{ display: 'block', fontSize: '9px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase' }}>Engagement</span>
          <strong style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: 'var(--text)' }}>
            {engagementScore > 0 ? `${engagementScore}%` : '—'}
          </strong>
        </div>
        <div className="m-item" style={{ textAlign: 'center' }}>
          <span style={{ display: 'block', fontSize: '9px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase' }}>Burnout Risk</span>
          <strong style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: burnoutColor }}>{burnoutRisk}</strong>
        </div>
        <div className="m-item" style={{ textAlign: 'right' }}>
          <span style={{ display: 'block', fontSize: '9px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase' }}>Resonance</span>
          <strong style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: 'var(--text)' }}>
            {resonanceScore > 0 ? `${resonanceScore}%` : '—'}
          </strong>
        </div>
      </div>
    </div>
  )
}
