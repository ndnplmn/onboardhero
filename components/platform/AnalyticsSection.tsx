export function EngagementScoreCard({ data }: { data: any[] }) {
  return (
    <div className="pro-max-card" style={{ padding: '24px' }}>
      <div className="db-card-hd" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-chart-line" style={{ color: 'var(--blue)' }}></i>
          <h3>Engagement Score</h3>
        </div>
      </div>
      <div className="db-card-bd">
        <div className="chart-container" style={{ height: '120px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '10px 0' }}>
          {data.map((d, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
              <div style={{ width: '20px', height: `${d.value}%`, background: 'var(--blue)', borderRadius: '4px 4px 0 0', position: 'relative', opacity: 0.8 }}>
                <span style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', fontWeight: 800, color: 'var(--text2)' }}>{d.value}%</span>
              </div>
              <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CompletionRateCard({ data }: { data: any[] }) {
  return (
    <div className="pro-max-card" style={{ padding: '24px' }}>
      <div className="db-card-hd" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-chart-pie" style={{ color: 'var(--cyan)' }}></i>
          <h3>Completion Rate</h3>
        </div>
      </div>
      <div className="db-card-bd">
        <div className="dept-comp-list" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {data.map((d, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--text2)', marginBottom: '6px' }}>
                <span>{d.label}</span>
                <span style={{ color: 'var(--cyan)' }}>{d.value}%</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${d.value}%`, background: 'var(--cyan)', borderRadius: '100px', boxShadow: '0 0 10px var(--cyan)' }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsSection() {
  const engagementData = [
    { label: 'Mon', value: 85 },
    { label: 'Tue', value: 92 },
    { label: 'Wed', value: 89 },
    { label: 'Thu', value: 94 },
    { label: 'Fri', value: 91 },
  ]

  const completionData = [
    { label: 'Product', value: 95 },
    { label: 'Sales', value: 82 },
    { label: 'Eng', value: 88 },
    { label: 'HR', value: 100 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>
      <CompletionRateCard data={completionData} />
      <EngagementScoreCard data={engagementData} />
    </div>
  )
}
