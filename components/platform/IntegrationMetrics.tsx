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
        <h3><i className="fa-solid fa-chart-line" style={{ color: 'var(--cyan)', marginRight: '6px' }}></i> Integration Metrics</h3>
      </div>
      <div className="db-card-bd">
        <div className="im-list">
          {metrics.map((m, i) => (
            <div key={i} className="im-item">
              <div className="im-ico" style={{ border: `1.5px solid ${m.color}`, color: m.color }}>
                <i className={m.icon}></i>
              </div>
              <div className="im-meta">
                <div className="im-lbl">
                  <strong>{m.label}</strong>
                  <span>{m.value}% Score</span>
                </div>
                <div className="im-pw">
                  <div className="im-pf" style={{ width: `${m.value}%`, background: m.color }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
