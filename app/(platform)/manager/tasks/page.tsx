import TaskList from '@/components/platform/TaskList'

const MOCK_MANAGER_TASKS = [
  { id: 'mt1', title: 'Schedule Week 1 Check-in', description: 'Meet with Liam Evans for his initial integration review.', week: 1, status: 'pending', assigned_to_role: 'manager' },
  { id: 'mt2', title: 'Review 30-Day Feedback', description: 'Analyze the 30-day survey results for Sarah Kim.', week: 4, status: 'completed', assigned_to_role: 'manager' },
  { id: 'mt3', title: 'Assigned Buddy for Priya', description: 'Ensure Priya has a clear social buddy for the technical onboarding phase.', week: 2, status: 'pending', assigned_to_role: 'manager' },
  { id: 'mt4', title: 'IT Setup Final Approval', description: 'Verify all hardware and software access for Marcus Reed.', week: 1, status: 'completed', assigned_to_role: 'manager' },
  { id: 'mt5', title: 'Conduct Performance Review', description: 'Final onboarding review for James Wilson (Day 90).', week: 12, status: 'pending', assigned_to_role: 'manager' },
]

export default function ManagerTasksPage() {
  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '60px' }}>
      <header className="db-header" style={{ marginBottom: '40px' }}>
        <div>
          <span className="sec-tag">Productivity Hub</span>
          <h1 className="hero-h1" style={{ fontSize: '32px', marginBottom: '8px' }}>My Tasks</h1>
          <p className="hero-sub" style={{ fontSize: '15px', marginBottom: 0 }}>
            Track and manage your onboarding-related actions and follow-ups.
          </p>
        </div>
      </header>

      <div className="db-row col2">
        <div className="db-card">
          <div className="db-card-hd">
            <h3><i className="fa-solid fa-list-check" style={{ color: 'var(--blue)', marginRight: '8px' }}></i> Active Actions</h3>
          </div>
          <div className="db-card-bd">
            <TaskList tasks={MOCK_MANAGER_TASKS} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="db-card">
            <div className="db-card-hd">
              <h3><i className="fa-solid fa-chart-pie" style={{ color: 'var(--cyan)', marginRight: '8px' }}></i> Task Analytics</h3>
            </div>
            <div className="db-card-bd">
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)' }}>60%</div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Completion Rate</div>
                </div>
                <div style={{ flex: 2, height: '8px', background: 'var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: '60%', height: '100%', background: 'var(--grad)' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="db-card">
            <div className="db-card-hd">
              <h3><i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--blue)', marginRight: '8px' }}></i> Recently Completed</h3>
            </div>
            <div className="db-card-bd">
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {MOCK_MANAGER_TASKS.filter(t => t.status === 'completed').map(t => (
                  <li key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', fontSize: '13px' }}>
                    <i className="fa-solid fa-check-circle" style={{ color: 'var(--green)' }}></i>
                    <span>{t.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
