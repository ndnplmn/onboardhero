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
    <div className="db-card">
      <div className="db-card-hd">
        <h3><i className="fa-solid fa-calendar-check" style={{ color: 'var(--blue)', marginRight: '6px' }}></i> Upcoming Milestones</h3>
      </div>
      <div className="db-card-bd">
        <div className="ms-list">
          {MOCK_MILESTONES.map(ms => (
            <div key={ms.id} className="ms-item">
              <div className="ms-date">
                <i className="fa-solid fa-clock-rotate-left"></i>
              </div>
              <div className="ms-info">
                <strong>{ms.title}</strong>
                <span>{ms.date} · {ms.employee}</span>
              </div>
              <button className="btn btn-ghost btn-sm"><i className="fa-solid fa-chevron-right"></i></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
