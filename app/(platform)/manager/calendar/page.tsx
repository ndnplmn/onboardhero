import MeetingTimeline from '@/components/platform/MeetingTimeline'

export default function ManagerCalendarPage() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dates = Array.from({ length: 31 }, (_, i) => i + 1)

  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '60px' }}>
      <header className="db-header" style={{ marginBottom: '40px' }}>
        <div>
          <span className="sec-tag">Schedule Managment</span>
          <h1 className="hero-h1" style={{ fontSize: '32px', marginBottom: '8px' }}>Team Calendar</h1>
          <p className="hero-sub" style={{ fontSize: '15px', marginBottom: 0 }}>
            Oversee all onboarding-related check-ins, orientation sessions, and social events.
          </p>
        </div>
        <div className="db-header-actions">
           <button className="btn btn-primary btn-sm">
             <i className="fa-solid fa-calendar-plus"></i> New Event
           </button>
        </div>
      </header>

      <div className="db-row col2-1">
        <div className="db-card" style={{ padding: '24px' }}>
          <div className="db-card-hd" style={{ marginBottom: '20px', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '18px' }}>October 2026</h3>
            <div style={{ display: 'flex', gap: '4px' }}>
               <button className="btn btn-ghost btn-sm"><i className="fa-solid fa-chevron-left"></i></button>
               <button className="btn btn-ghost btn-sm"><i className="fa-solid fa-chevron-right"></i></button>
            </div>
          </div>
          <div className="db-card-bd">
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              gap: '10px',
              textAlign: 'center'
            }}>
              {days.map(d => (
                <div key={d} style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text3)', paddingBottom: '10px' }}>
                  {d}
                </div>
              ))}
              {/* Offset for October 2026 (starts on Thursday) */}
              <div style={{ pointerEvents: 'none', opacity: 0 }}></div>
              <div style={{ pointerEvents: 'none', opacity: 0 }}></div>
              <div style={{ pointerEvents: 'none', opacity: 0 }}></div>
              <div style={{ pointerEvents: 'none', opacity: 0 }}></div>
              
              {dates.map(date => (
                <div key={date} style={{
                  aspectRatio: '1 / 1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  position: 'relative',
                  backgroundColor: date === 12 ? 'var(--blue-light)' : 'transparent',
                  borderColor: date === 12 ? 'var(--blue)' : 'var(--border)',
                  color: date === 12 ? 'var(--blue)' : 'var(--text)',
                }}>
                  {date}
                  {(date === 5 || date === 12 || date === 24) && (
                    <div style={{
                      position: 'absolute',
                      bottom: '6px',
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: 'var(--cyan)'
                    }}></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <MeetingTimeline />
          <div className="db-card" style={{ padding: '20px' }}>
            <div className="db-card-hd" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px' }}><i className="fa-solid fa-clock" style={{ color: 'var(--aqua)', marginRight: '8px' }}></i> Upcoming Deadlines</h3>
            </div>
            <div className="db-card-bd">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--surface2)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                   <div style={{ background: 'var(--red-bg)', color: 'var(--red)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                      <i className="fa-solid fa-triangle-exclamation" style={{ margin: 'auto' }}></i>
                   </div>
                   <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>Marcus: Week 1 Approval</div>
                      <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Due by 5:00 PM Today</div>
                   </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--surface2)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                   <div style={{ background: 'var(--cyan-light)', color: 'var(--blue)', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                      <i className="fa-solid fa-info-circle" style={{ margin: 'auto' }}></i>
                   </div>
                   <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>Priya: Buddy Assigned</div>
                      <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Due tomorrow</div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
