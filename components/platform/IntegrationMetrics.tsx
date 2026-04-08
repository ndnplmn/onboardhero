'use client'

interface Metric {
  label: string
  value: number
  icon: string
  color: string
}

interface IntegrationMetricsProps {
  metrics: Metric[]
}

export default function IntegrationMetrics({ metrics }: IntegrationMetricsProps) {
  return (
    <div className="pro-max-card" style={{ padding: '20px' }}>
      <div className="db-card-hd" style={{ marginBottom: '16px' }}>
        <h3><i className="fa-solid fa-chart-line" style={{ color: 'var(--blue)' }}></i> Integration Metrics</h3>
      </div>
      <div className="im-list">
        {metrics.map((m, i) => (
          <div key={i} className="im-item" style={{ marginBottom: '14px' }}>
            <div className="im-row-top" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className={m.icon} style={{ color: m.color, fontSize: '14px' }}></i>
                <strong style={{ fontSize: '13px', color: 'var(--text)' }}>{m.label}</strong>
              </div>
              <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text2)' }}>{m.value}%</span>
            </div>
            <div className="im-pw" style={{ height: '5px', background: 'var(--bg)', borderRadius: '100px', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <div className="im-pf" style={{ width: `${m.value}%`, background: m.color, height: '100%', borderRadius: '100px' }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
