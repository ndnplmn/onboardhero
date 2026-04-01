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
    <div className="db-card">
      <div className="db-card-hd">
        <h3><i className="fa-solid fa-chart-simple" style={{ color: 'var(--cyan)', marginRight: '6px' }}></i> Integration Metrics</h3>
      </div>
      <div className="db-card-bd">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {metrics.map((m, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700 }}>
                  <i className={m.icon} style={{ color: m.color }}></i>
                  {m.label}
                </div>
                <span style={{ fontSize: '12px', fontWeight: 800, color: m.color }}>{m.value}%</span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg)', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${m.value}%`, background: m.color, borderRadius: '100px', opacity: 0.8 }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
