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
    <div className="db-card">
      <div className="db-card-hd">
        <h3><i className="fa-solid fa-bell" style={{ color: 'var(--amber)', marginRight: '8px' }}></i> Active Alerts</h3>
      </div>
      <div className="db-card-bd">
        {MOCK_ALERTS.map(alert => (
          <div key={alert.id} className={`alert-box ${alert.type === 'warning' ? 'w' : 'i'}`}>
            <i className={`fa-solid ${alert.type === 'warning' ? 'fa-triangle-exclamation' : 'fa-calendar-check'}`}></i>
            <div>
              <strong>{alert.title}</strong>
              <span>{alert.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
