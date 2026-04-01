'use client'

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
    <div className="db-row col2">
      <div className="db-card">
        <div className="db-card-hd">
          <h3><i className="fa-solid fa-chart-line" style={{ color: 'var(--blue)', marginRight: '6px' }}></i> Engagement Score (Weekly)</h3>
        </div>
        <div className="db-card-bd">
          <div className="chart-container" style={{ height: '140px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '10px 0' }}>
            {engagementData.map((d, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                <div style={{ width: '30px', height: `${d.value}%`, background: 'var(--grad)', borderRadius: '6px 6px 0 0', position: 'relative' }}>
                  <span style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', fontWeight: 700, color: 'var(--text2)' }}>{d.value}%</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="db-card">
        <div className="db-card-hd">
          <h3><i className="fa-solid fa-chart-pie" style={{ color: 'var(--cyan)', marginRight: '6px' }}></i> Completion Rate by Dept</h3>
        </div>
        <div className="db-card-bd">
          <div className="dept-comp-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {completionData.map((d, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '5px' }}>
                  <span>{d.label}</span>
                  <span>{d.value}%</span>
                </div>
                <div style={{ height: '8px', background: 'var(--bg)', borderRadius: '100px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${d.value}%`, background: 'var(--grad)', borderRadius: '100px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
