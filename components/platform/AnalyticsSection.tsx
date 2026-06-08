export function EngagementScoreCard({ data }: { data: { label: string; value: number }[] }) {
  return (
    <div className="db-card" style={{ padding: '24px' }}>
      <div className="db-card-hd" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-chart-line" style={{ color: 'var(--blue)' }} />
          <h3>Weekly Engagement</h3>
        </div>
      </div>
      {data.length === 0 ? (
        <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 12 }}>
          No engagement data yet.
        </div>
      ) : (
        <div style={{ height: '120px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '10px 0' }}>
          {data.map((d, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
              <div style={{
                width: '20px',
                height: `${d.value}%`,
                background: 'var(--blue)',
                borderRadius: '4px 4px 0 0',
                position: 'relative',
                opacity: 0.85,
              }}>
                <span style={{
                  position: 'absolute', top: '-18px', left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '9px', fontWeight: 800, color: 'var(--text2)',
                  whiteSpace: 'nowrap',
                }}>
                  {d.value}%
                </span>
              </div>
              <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase' }}>
                {d.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function CompletionRateCard({ data }: { data: { label: string; value: number }[] }) {
  return (
    <div className="db-card" style={{ padding: '24px' }}>
      <div className="db-card-hd" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-chart-pie" style={{ color: 'var(--cyan)' }} />
          <h3>Completion Rate</h3>
        </div>
      </div>
      {data.length === 0 ? (
        <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
          No completion data yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {data.map((d, i) => (
            <div key={i}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: '11px', fontWeight: 700, color: 'var(--text2)', marginBottom: '6px',
              }}>
                <span>{d.label}</span>
                <span style={{ color: 'var(--cyan)' }}>{d.value}%</span>
              </div>
              <div style={{ height: '6px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${d.value}%`, background: 'var(--cyan)', borderRadius: '100px' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AnalyticsSection() {
  const engagementData = [
    { label: 'W1', value: 85 },
    { label: 'W2', value: 92 },
    { label: 'W3', value: 89 },
    { label: 'W4', value: 94 },
    { label: 'W5', value: 91 },
  ]

  const completionData = [
    { label: 'Product', value: 95 },
    { label: 'Sales',   value: 82 },
    { label: 'Eng',     value: 88 },
    { label: 'HR',      value: 100 },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>
      <CompletionRateCard data={completionData} />
      <EngagementScoreCard data={engagementData} />
    </div>
  )
}
