'use client'

interface Meeting {
  id:       string
  title:    string
  time:     string
  person:   string
  avatar:   string | null
  date?:    string  // ISO date string YYYY-MM-DD
  joinUrl?: string
}

interface MeetingTimelineProps {
  meetings?: Meeting[]
}

function dayLabel(dateStr: string | undefined): string {
  if (!dateStr) return 'Today'
  const today    = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  if (dateStr === today)    return 'Today'
  if (dateStr === tomorrow) return 'Tomorrow'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

export default function MeetingTimeline({ meetings = [] }: MeetingTimelineProps) {
  // Group by date
  const grouped = meetings.reduce<Record<string, Meeting[]>>((acc, m) => {
    const key = m.date ?? new Date().toISOString().split('T')[0]
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  const dateKeys = Object.keys(grouped).sort()

  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-calendar-day" style={{ color: 'var(--blue)' }} />
          Upcoming Meetings
        </h3>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>
          Next 72h · {meetings.length} meeting{meetings.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="db-card-bd">
        {meetings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)' }}>
            <i className="fa-solid fa-sun" style={{ fontSize: 22, display: 'block', marginBottom: 8, color: 'var(--amber)' }} aria-hidden="true" />
            <p style={{ fontSize: 12, fontWeight: 500 }}>No meetings in the next 72 hours.</p>
            <p style={{ fontSize: 11, marginTop: 4 }}>Enjoy your focus time!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {dateKeys.map(dateKey => (
              <div key={dateKey}>
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: dateKey === new Date().toISOString().split('T')[0] ? 'var(--blue)' : 'var(--text3)',
                  marginBottom: 8,
                }}>
                  {dayLabel(dateKey)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {grouped[dateKey].map((meet) => (
                    <div
                      key={meet.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 12px', borderRadius: 'var(--r)',
                        border: '1px solid var(--border)', background: 'var(--surface)',
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', flexShrink: 0, minWidth: 56 }}>
                        {meet.time}
                      </span>

                      {meet.avatar ? (
                        <img src={meet.avatar} alt={meet.person} style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />
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

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ display: 'block', fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {meet.title}
                        </strong>
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{meet.person}</span>
                      </div>

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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
