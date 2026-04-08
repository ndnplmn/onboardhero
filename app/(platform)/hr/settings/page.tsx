export default function HRSettingsPage() {
  const sections = [
    { title: 'Organization Profile', icon: 'fa-building', description: 'Manage company branding, office locations, and departments.' },
    { title: 'Journey Templates', icon: 'fa-route', description: 'Configure standard onboarding workflows and milestones.' },
    { title: 'Role & Permissions', icon: 'fa-user-shield', description: 'Define access levels for Managers, Buddies, and HR admins.' },
    { title: 'AI Configuration', icon: 'fa-brain', description: 'Adjust sentiment analysis thresholds and risk scan frequency.' },
    { title: 'Integrations', icon: 'fa-plug', description: 'Connect with Slack, MS Teams, and your existing HRIS.' },
    { title: 'Notification System', icon: 'fa-envelope-open-text', description: 'Manage automated email triggers and push notification logic.' },
  ]

  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '60px' }}>
      <header className="db-header" style={{ marginBottom: '40px' }}>
        <div>
          <span className="sec-tag">Control Center</span>
          <h1 className="hero-h1" style={{ fontSize: '32px', marginBottom: '8px' }}>Platform Settings</h1>
          <p className="hero-sub" style={{ fontSize: '15px', marginBottom: 0 }}>
            Configure your organization's onboarding infrastructure and logic.
          </p>
        </div>
      </header>

      <div className="db-row col3">
        {sections.map((section, idx) => (
          <div key={idx} className="db-card" style={{ padding: '24px', cursor: 'pointer', transition: 'transform 0.3s ease' }}>
             <div style={{ width: '48px', height: '48px', background: 'var(--surface2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', border: '1px solid var(--border)' }}>
                <i className={`fa-solid ${section.icon}`} style={{ fontSize: '20px', color: 'var(--blue)' }}></i>
             </div>
             <h3 style={{ fontSize: '16px', marginBottom: '12px', fontWeight: 700 }}>{section.title}</h3>
             <p style={{ fontSize: '13px', color: 'var(--text3)', lineHeight: '1.5', marginBottom: '20px' }}>
                {section.description}
             </p>
             <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: 'var(--cyan)' }}>
                Configure <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px' }}></i>
             </div>
          </div>
        ))}
      </div>

      <div className="db-card" style={{ marginTop: '40px', padding: '24px', background: 'var(--grad)', border: 'none' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: 'white' }}>
               <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '8px' }}>Pinnacle 2026 Core Engine</h3>
               <p style={{ fontSize: '14px', opacity: 0.9 }}>System Status: Operational • v2.6.4 Build 9821</p>
            </div>
            <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: 'white' }}>
               Restart Engine
            </button>
         </div>
      </div>
    </div>
  )
}
