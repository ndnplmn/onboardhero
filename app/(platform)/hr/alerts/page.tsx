import { createSupabaseAdmin } from '@/lib/db/supabase-server'
import RiskScoreCard from '@/components/ai/RiskScoreCard'

export const dynamic = 'force-dynamic'

export default async function HRAlertsPage() {
  const supabase = createSupabaseAdmin()

  const { data: journeys } = await supabase
    .from('journeys')
    .select('*, employee:profiles!employee_id(id, full_name, avatar_url, department)')
    .gt('risk_score', 50)
    .order('risk_score', { ascending: false })

  const atRiskJourneys = journeys || []

  // Mock Alerts for 2026 High-Fidelity demo if DB is empty
  const alerts = atRiskJourneys.length > 0 ? atRiskJourneys : [
    { id: 'a1', employee: { full_name: 'Liam Evans', avatar_url: 'https://i.pravatar.cc/150?u=liam', department: 'Product' }, risk_score: 82, risk_reasons: ['Missed 30-day survey', 'Low social engagement', 'Unresolved IT tickets'], current_week: 5 },
    { id: 'a2', employee: { full_name: 'Marcus Reed', avatar_url: 'https://i.pravatar.cc/150?u=marcus', department: 'Design' }, risk_score: 65, risk_reasons: ['Hardware delay', 'Missed Week 1 sync'], current_week: 1 },
    { id: 'a3', employee: { full_name: 'Sarah Kim', avatar_url: 'https://i.pravatar.cc/150?u=sarah', department: 'HR' }, risk_score: 54, risk_reasons: ['Low sentiment score in Week 4'], current_week: 4 },
  ]

  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '60px' }}>
      <header className="db-header" style={{ marginBottom: '40px' }}>
        <div>
          <span className="sec-tag">Intelligence Feed</span>
          <h1 className="hero-h1" style={{ fontSize: '32px', marginBottom: '8px' }}>Active Alerts</h1>
          <p className="hero-sub" style={{ fontSize: '15px', marginBottom: 0 }}>
            Critical integration risks and systemic onboarding bottlenecks.
          </p>
        </div>
        <div className="db-header-actions">
           <button className="btn btn-primary btn-sm">
             <i className="fa-solid fa-bolt"></i> Run Deep Scan
           </button>
        </div>
      </header>

      <div className="db-row col2-1">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="db-card" style={{ padding: '0', background: 'transparent', border: 'none' }}>
             <h3 style={{ fontSize: '16px', marginBottom: '16px', color: 'var(--text2)' }}>High Priority Risks</h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {alerts.map((a: any) => (
                  <RiskScoreCard 
                    key={a.id}
                    employeeName={a.employee.full_name}
                    department={a.employee.department}
                    score={a.risk_score}
                    reasons={a.risk_reasons}
                    avatarUrl={a.employee.avatar_url}
                    currentWeek={a.current_week}
                  />
                ))}
             </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
           <div className="db-card">
              <div className="db-card-hd">
                 <h3><i className="fa-solid fa-robot" style={{ color: 'var(--cyan)', marginRight: '8px' }}></i> AI Strategy</h3>
              </div>
              <div className="db-card-bd">
                 <div style={{ fontSize: '13px', color: 'var(--text2)', padding: '12px', background: 'var(--surface2)', borderRadius: '8px', borderLeft: '3px solid var(--amber)', marginBottom: '16px' }}>
                    <strong>Action Recommended:</strong> Schedule adaptive culture alignment session for Liam Evans. Signals suggest social friction in the Product department.
                 </div>
                 <div style={{ fontSize: '13px', color: 'var(--text2)', padding: '12px', background: 'var(--surface2)', borderRadius: '8px', borderLeft: '3px solid var(--blue)' }}>
                    <strong>System Note:</strong> IT bottleneck detected in 'Dublin' office affecting 2 hires. Hardware procurement SLA is currently 4.2 days above target.
                 </div>
              </div>
           </div>

           <div className="db-card">
              <div className="db-card-hd">
                 <h3><i className="fa-solid fa-bell" style={{ color: 'var(--blue)', marginRight: '8px' }}></i> Alert Settings</h3>
              </div>
              <div className="db-card-bd">
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px' }}>Push Notifications</span>
                    <i className="fa-solid fa-toggle-on" style={{ color: 'var(--blue)' }}></i>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '12px' }}>Weekly Risk Summary</span>
                    <i className="fa-solid fa-toggle-on" style={{ color: 'var(--blue)' }}></i>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px' }}>Department-Specific Slack Alerts</span>
                    <i className="fa-solid fa-toggle-off" style={{ color: 'var(--text4)' }}></i>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
