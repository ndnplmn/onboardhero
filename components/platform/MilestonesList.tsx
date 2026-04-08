'use client'

interface Milestone {
  id: string
  title: string
  date: string
  employee: string
  avatar: string
}

const MOCK_MILESTONES: Milestone[] = [
  { id: '1', title: 'Day 15 Check-in', date: 'Tomorrow, 10:00 AM', employee: 'Marcus Reed', avatar: 'https://i.pravatar.cc/150?u=marcus' },
  { id: '2', title: 'Month 1 Review', date: 'Mar 24, 2:30 PM', employee: 'Priya Mehta', avatar: 'https://i.pravatar.cc/150?u=priya' },
  { id: '3', title: 'Final Probation Sync', date: 'Apr 12, 11:15 AM', employee: 'James Wilson', avatar: 'https://i.pravatar.cc/150?u=james' },
]

export default function MilestonesList() {
  return (
    <div className="pro-max-card" style={{ padding: '20px' }}>
      <div className="db-card-hd" style={{ marginBottom: '16px' }}>
        <h3><i className="fa-solid fa-calendar-check" style={{ color: 'var(--blue)' }}></i> Upcoming Milestones</h3>
      </div>
      <div className="ms-list">
        {MOCK_MILESTONES.map(ms => (
          <div key={ms.id} className="ms-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <div className="ms-avatar" style={{ position: 'relative' }}>
              <img src={ms.avatar} alt={ms.employee} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--bg)' }} />
              <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '12px', height: '12px', background: 'var(--blue)', borderRadius: '50%', border: '2px solid var(--bg)', fontSize: '6px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fa-solid fa-clock"></i>
              </div>
            </div>
            <div className="ms-info" style={{ flex: 1 }}>
              <strong style={{ display: 'block', fontSize: '13px', color: 'var(--text)' }}>{ms.title}</strong>
              <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{ms.date} · {ms.employee}</span>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ padding: '4px' }}><i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }}></i></button>
          </div>
        ))}
      </div>
    </div>
  )
}
