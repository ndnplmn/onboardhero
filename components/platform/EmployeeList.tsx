import RiskBadge from './RiskBadge'

interface JourneyWithRelations {
  id: string
  status: string
  current_week: number
  risk_score: number
  start_date: string
  employee: { id: string; full_name: string; avatar_url: string | null; department: string | null }
  manager: { full_name: string }
}

export default function EmployeeList({ journeys }: { journeys: JourneyWithRelations[] }) {
  return (
    <div className="hc-employees">
      {journeys.length === 0 ? (
        <p style={{ padding: '20px', color: 'var(--text3)', textAlign: 'center' }}>No active journeys yet. Invite employees to get started.</p>
      ) : (
        journeys.map((j) => {
          const progress = Math.min(Math.round((j.current_week / 12) * 100), 100)
          return (
            <div className="hc-emp" key={j.id}>
              <img src={j.employee.avatar_url || `https://i.pravatar.cc/26?u=${j.employee.id}`} alt="" />
              <div className="hce-info">
                <strong>{j.employee.full_name}</strong>
                <span>Week {j.current_week} · {j.employee.department || 'General'}</span>
              </div>
              <div className="hce-prog">
                <div className={`hce-bar${j.risk_score > 60 ? ' risk' : ''}`} style={{ width: `${progress}%` }}></div>
              </div>
              <RiskBadge score={j.risk_score} />
            </div>
          )
        })
      )}
    </div>
  )
}
