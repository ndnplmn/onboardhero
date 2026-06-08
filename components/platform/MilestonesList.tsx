'use client'

interface Milestone {
  id: string
  date: string
  employee: string
  avatarUrl?: string | null
}

interface MilestonesListProps {
  milestones?: Milestone[]
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = (d.getTime() - now.getTime()) / 86400000
  if (diff < 1 && diff >= 0) return 'Today'
  if (diff < 2 && diff >= 1) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function MilestonesList({ milestones = [] }: MilestonesListProps) {
  return (
    <div className="pro-max-card" style={{ padding: '20px' }}>
      <div className="db-card-hd" style={{ marginBottom: '16px' }}>
        <h3><i className="fa-solid fa-calendar-check" style={{ color: 'var(--blue)' }} /> Upcoming Check-ins</h3>
        {milestones.length > 0 && (
          <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{milestones.length} scheduled</span>
        )}
      </div>

      {milestones.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)' }}>
          <i className="fa-solid fa-calendar-plus" style={{ fontSize: 20, display: 'block', marginBottom: 8 }} />
          <p style={{ fontSize: 12, fontWeight: 500 }}>No upcoming check-ins scheduled.</p>
        </div>
      ) : (
        <div className="ms-list">
          {milestones.slice(0, 5).map(ms => (
            <div key={ms.id} className="ms-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="ms-avatar" style={{ position: 'relative', flexShrink: 0 }}>
                {ms.avatarUrl ? (
                  <img
                    src={ms.avatarUrl}
                    alt={ms.employee}
                    style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--bg)', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--cyan), var(--blue))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: '#fff',
                    border: '2px solid var(--bg)',
                  }}>
                    {getInitials(ms.employee)}
                  </div>
                )}
                <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '12px', height: '12px', background: 'var(--blue)', borderRadius: '50%', border: '2px solid var(--bg)', fontSize: '6px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-solid fa-clock" />
                </div>
              </div>
              <div className="ms-info" style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: 'block', fontSize: '13px', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ms.employee}
                </strong>
                <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{formatDate(ms.date)}</span>
              </div>
              <button className="btn btn-ghost btn-sm" style={{ padding: '4px', flexShrink: 0 }}>
                <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
