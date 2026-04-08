'use client'

interface Alert {
  id: string
  type: 'warning' | 'info'
  title: string
  description: string
}

const MOCK_ALERTS: Alert[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Priya Mehta — At Risk',
    description: '3 overdue tasks in Week 7. Manager check-in not completed. Journey stalled for 9 days.'
  },
  {
    id: '2',
    type: 'info',
    title: 'Sarah Kim — 30-day review due',
    description: 'First month review scheduled for March 18. Action required from manager.'
  },
  {
    id: '3',
    type: 'info',
    title: '2 new hires starting next week',
    description: 'Jordan Blake (Product) and Wei Li (Data Science) — journeys not yet assigned.'
  }
]

export default function ActiveAlerts() {
  return (
    <div className="pro-max-card" style={{ padding: '24px' }}>
      <div className="db-card-hd" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-bell" style={{ color: 'var(--amber)' }}></i>
          <h3>Active Alerts</h3>
        </div>
      </div>
      <div className="alert-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {MOCK_ALERTS.map(alert => (
          <div key={alert.id} className={`alert-box-pro ${alert.type}`} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', gap: '12px' }}>
            <i className={`fa-solid ${alert.type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info'}`} style={{ color: alert.type === 'warning' ? 'var(--red)' : 'var(--blue)', marginTop: '4px' }}></i>
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', fontSize: '13px', color: 'var(--text)', marginBottom: '2px' }}>{alert.title}</strong>
              <span style={{ fontSize: '11px', color: 'var(--text3)', lineHeight: '1.4' }}>{alert.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
