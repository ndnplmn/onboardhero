'use client'

interface Meeting {
  id: string
  title: string
  time: string
  organizer: string
  avatar: string
}

const MOCK_MEETINGS: Meeting[] = [
  { id: '1', title: 'Coffee with Buddy', time: '10:00 AM', organizer: 'Sarah Miller', avatar: 'https://i.pravatar.cc/150?u=sarah' },
  { id: '2', title: 'Team Standup', time: '11:15 AM', organizer: 'David Chen', avatar: 'https://i.pravatar.cc/150?u=david' },
  { id: '3', title: 'IT Setup Sync', time: '2:30 PM', organizer: 'Tech Support', avatar: 'https://i.pravatar.cc/150?u=tech' },
]

export default function MeetingTimeline() {
  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3><i className="fa-solid fa-calendar-alt" style={{ color: 'var(--blue)', marginRight: '6px' }}></i> Today&apos;s Schedule</h3>
      </div>
      <div className="db-card-bd">
        <div className="mt-list">
          {MOCK_MEETINGS.map(meet => (
            <div key={meet.id} className="mt-item">
              <div className="mt-time">{meet.time}</div>
              <div className="mt-info">
                <strong>{meet.title}</strong>
                <div className="mt-org">
                  <img src={meet.avatar} alt={meet.organizer} />
                  <span>{meet.organizer}</span>
                </div>
              </div>
              <button className="btn btn-primary btn-icon-sm">
                <i className="fa-brands fa-microsoft"></i>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
