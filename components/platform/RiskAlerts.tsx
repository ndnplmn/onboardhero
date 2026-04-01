'use client'

interface RiskAlert {
  id: string
  name: string
  avatar: string
  issue: string
  level: 'high' | 'mid'
}

interface RiskAlertsProps {
  alerts: RiskAlert[]
}

export default function RiskAlerts({ alerts }: RiskAlertsProps) {
  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3><i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--red)', marginRight: '6px' }}></i> Risk & Attention Required</h3>
      </div>
      <div className="db-card-bd">
        <div className="risk-alerts">
          {alerts.length > 0 ? (
            alerts.map((alert) => (
              <div key={alert.id} className={`risk-alert ${alert.level === 'high' ? 'high' : 'mid'}`}>
                <img src={alert.avatar} className="risk-avatar" alt={alert.name} />
                <div className="risk-info">
                  <strong>{alert.name}</strong>
                  <span>{alert.issue}</span>
                </div>
                <div className={`risk-level ${alert.level === 'high' ? 'high' : 'mid'}`}>
                  {alert.level === 'high' ? 'High Risk' : 'Action Needed'}
                </div>
              </div>
            ))
          ) : (
            <p style={{ fontSize: '13px', color: 'var(--text3)', textAlign: 'center', padding: '20px 0' }}>
              All new hires are currently on track. ✨
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
