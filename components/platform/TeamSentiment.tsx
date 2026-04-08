import React from 'react'

interface SentimentData {
  score: number
  trend: 'up' | 'down' | 'steady'
  label: string
}

export default function TeamSentiment() {
  const sentiment: SentimentData = {
    score: 88,
    trend: 'up',
    label: 'High Resonance'
  }

  return (
    <div className="pro-max-card" style={{ padding: '24px' }}>
      <div className="db-card-hd" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-brain" style={{ color: 'var(--aqua)' }}></i>
          <h3>Team Sentiment</h3>
        </div>
        <div className="badge-ai">Predictive</div>
      </div>

      <div className="sentiment-hero" style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div className="s-value" style={{ fontSize: '38px', fontWeight: '900', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          {sentiment.score}%
          <span className={`s-trend-pill ${sentiment.trend}`}>
            <i className={`fa-solid fa-arrow-trend-up`}></i>
            +4%
          </span>
        </div>
        <div className="s-label" style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '4px' }}>{sentiment.label}</div>
      </div>

      <div className="sentiment-wave" style={{ height: '50px', margin: '15px 0' }}>
        <svg viewBox="0 0 400 60" className="wav-svg" style={{ width: '100%', height: '100%' }}>
          <path d="M 0 30 Q 50 10, 100 30 T 200 30 T 300 30 T 400 30" style={{ fill: 'none', stroke: 'var(--cyan)', strokeWidth: '2', strokeLinecap: 'round', opacity: 0.6 }} />
          <path d="M 0 30 Q 50 50, 100 30 T 200 30 T 300 30 T 400 30" style={{ fill: 'none', stroke: 'var(--blue)', strokeWidth: '1.5', strokeLinecap: 'round', opacity: 0.3 }} />
        </svg>
      </div>

      <div className="sentiment-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border)' }}>
        <div className="m-item">
          <span style={{ display: 'block', fontSize: '9px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase' }}>Engagement</span>
          <strong style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: 'var(--text)' }}>92%</strong>
        </div>
        <div className="m-item" style={{ textAlign: 'center' }}>
          <span style={{ display: 'block', fontSize: '9px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase' }}>Burnout Risk</span>
          <strong style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: 'var(--green)' }}>Low</strong>
        </div>
        <div className="m-item" style={{ textAlign: 'right' }}>
          <span style={{ display: 'block', fontSize: '9px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase' }}>Resonance</span>
          <strong style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: 'var(--text)' }}>94%</strong>
        </div>
      </div>

      <style jsx>{`
        .s-trend-pill { font-size: 11px; padding: 2px 8px; border-radius: 6px; background: var(--green-light); color: var(--green); font-weight: 800; display: flex; align-items: center; gap: 4px; }
      `}</style>
    </div>
  )
}
