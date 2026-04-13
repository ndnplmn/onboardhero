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
  if (journeys.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
        No active journeys yet. Invite employees to get started.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {journeys.map((j, i) => {
        const progress = Math.min(Math.round((j.current_week / 12) * 100), 100)
        return (
          <div
            key={j.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 0',
              borderBottom: i < journeys.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <img
              src={j.employee.avatar_url || `https://i.pravatar.cc/32?u=${j.employee.id}`}
              alt={j.employee.full_name}
              style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, border: '1px solid var(--border)' }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                {j.employee.full_name}
              </strong>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                Week {j.current_week} · {j.employee.department || 'General'}
              </span>
            </div>
            <div style={{ width: 72, height: 5, background: 'var(--border)', borderRadius: 100, overflow: 'hidden', flexShrink: 0 }}>
              <div style={{
                height: '100%', borderRadius: 100,
                width: `${progress}%`,
                background: j.risk_score > 60 ? 'var(--red)' : 'var(--grad)',
                transition: 'width 0.5s ease',
              }} />
            </div>
            <RiskBadge score={j.risk_score} />
          </div>
        )
      })}
    </div>
  )
}
