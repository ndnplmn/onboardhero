'use client'

interface Meeting {
  id:       string
  title:    string
  time:     string
  person:   string
  avatar:   string | null
  joinUrl?: string
}

const DEFAULT_MEETINGS: Meeting[] = [
  { id: '1', title: 'Weekly 1:1 — Marcus', time: '10:00 AM', person: 'Marcus Reed', avatar: 'https://i.pravatar.cc/150?u=marcus' },
  { id: '2', title: 'Team Standup',        time: '11:15 AM', person: 'All Hires',   avatar: null },
  { id: '3', title: '30-Day Review — Priya', time: '2:30 PM', person: 'Priya Mehta', avatar: 'https://i.pravatar.cc/150?u=priya' },
]

interface MeetingTimelineProps {
  meetings?: Meeting[]
}

export default function MeetingTimeline({ meetings }: MeetingTimelineProps) {
  const items = meetings && meetings.length > 0 ? meetings : DEFAULT_MEETINGS

  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-calendar-day" style={{ color: 'var(--blue)' }} />
          Today&apos;s Schedule
        </h3>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>
          {items.length} meeting{items.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="db-card-bd">
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)' }}>
            <i className="fa-solid fa-sun" style={{ fontSize: 22, display: 'block', marginBottom: 8, color: 'var(--amber)' }} aria-hidden="true" />
            <p style={{ fontSize: 12, fontWeight: 500 }}>No meetings scheduled today.</p>
            <p style={{ fontSize: 11, marginTop: 4 }}>Enjoy your focus time!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map((meet) => (
              <div
                key={meet.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 'var(--r)',
                  border: '1px solid var(--border)', background: 'var(--surface)',
                }}
              >
                {/* Time */}
                <span style={{
                  fontSize: 11, fontWeight: 700, color: 'var(--text3)',
                  flexShrink: 0, minWidth: 56,
                }}>
                  {meet.time}
                </span>

                {/* Avatar */}
                {meet.avatar ? (
                  <img
                    src={meet.avatar}
                    alt={meet.person}
                    style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }}
                  />
                ) : (
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--blue-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: 'var(--blue)',
                  }}>
                    {meet.person.charAt(0)}
                  </div>
                )}

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{
                    display: 'block', fontSize: 12, color: 'var(--text)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {meet.title}
                  </strong>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{meet.person}</span>
                </div>

                {/* Join button */}
                {meet.joinUrl ? (
                  <a
                    href={meet.joinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: 10, padding: '4px 10px', flexShrink: 0 }}
                  >
                    <i className="fa-brands fa-microsoft" style={{ marginRight: 4 }} />
                    Join
                  </a>
                ) : (
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: 10, padding: '4px 10px', flexShrink: 0 }}
                    aria-label={`Join ${meet.title}`}
                  >
                    <i className="fa-solid fa-video" style={{ marginRight: 4 }} />
                    Join
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
