import EmployeeTable from '@/components/platform/EmployeeTable'

export default function ManagerHiresPage() {
  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '60px' }}>
      <header className="db-header" style={{ marginBottom: '40px' }}>
        <div>
          <span className="sec-tag">Team Management</span>
          <h1 className="hero-h1" style={{ fontSize: '32px', marginBottom: '8px' }}>My New Hires</h1>
          <p className="hero-sub" style={{ fontSize: '15px', marginBottom: 0 }}>
            Manage and monitor the onboarding journey of your direct reports.
          </p>
        </div>
        <div className="db-header-actions">
           <button className="btn btn-primary btn-sm">
             <i className="fa-solid fa-user-plus"></i> Add New Hire
           </button>
        </div>
      </header>

      <div className="db-row">
        <div style={{ width: '100%' }}>
          <EmployeeTable />
        </div>
      </div>

      <div className="db-row col3" style={{ marginTop: '30px' }}>
        <div className="db-card">
          <div className="db-card-hd">
            <h3><i className="fa-solid fa-bolt" style={{ color: 'var(--cyan)' }}></i> Integration Velocity</h3>
          </div>
          <div className="db-card-bd">
            <p style={{ fontSize: '13px', color: 'var(--text2)' }}>
              Your team's average onboarding velocity is <strong>12% higher</strong> than the department average this month.
            </p>
          </div>
        </div>
        <div className="db-card">
          <div className="db-card-hd">
            <h3><i className="fa-solid fa-shield-halved" style={{ color: 'var(--blue)' }}></i> Retention Signal</h3>
          </div>
          <div className="db-card-bd">
            <p style={{ fontSize: '13px', color: 'var(--text2)' }}>
              Predictive markers show <strong>high engagement</strong> across all new hires. 0 at-risk signals detected in the last 7 days.
            </p>
          </div>
        </div>
        <div className="db-card">
          <div className="db-card-hd">
            <h3><i className="fa-solid fa-award" style={{ color: 'var(--aqua)' }}></i> Milestones Reached</h3>
          </div>
          <div className="db-card-bd">
            <p style={{ fontSize: '13px', color: 'var(--text2)' }}>
              <strong>4 key milestones</strong> have been completed by your team in the last 48 hours. Keep it up!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
