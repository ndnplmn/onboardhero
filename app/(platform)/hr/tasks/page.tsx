import { createSupabaseAdmin } from '@/lib/db/supabase-server'
import TaskList from '@/components/platform/TaskList'

export const dynamic = 'force-dynamic'

export default async function HRTasksPage() {
  const supabase = createSupabaseAdmin()

  const { data: tasks } = await supabase
    .from('journey_tasks')
    .select('*, journey:journeys!journey_id(employee:profiles!employee_id(full_name))')
    .order('week', { ascending: true })

  // Mock tasks for 2026 High-Fidelity demo if DB is empty
  const hrTasks = (tasks && tasks.length > 0) ? tasks.map(t => ({
    ...t,
    title: `${(t.journey as any)?.employee?.full_name}: ${t.title}`
  })) : [
    { id: 'h1', title: 'Marcus Reed: Submit Hardware Request', description: 'Technical setup for new Senior Designer.', week: 1, status: 'completed', assigned_to_role: 'hr' },
    { id: 'h2', title: 'Priya Mehta: Benefits Enrollment', description: 'Verify health insurance and 401k setup.', week: 2, status: 'pending', assigned_to_role: 'hr' },
    { id: 'h3', title: 'Sarah Kim: Culture Workshop Invite', description: 'Send invitation for the monthly culture alignment session.', week: 1, status: 'completed', assigned_to_role: 'hr' },
    { id: 'h4', title: 'James Wilson: Final Exit Interview (Onboarding)', description: 'Gather qualitative data on the 90-day journey.', week: 12, status: 'pending', assigned_to_role: 'hr' },
    { id: 'h5', title: 'Liam Evans: Assign Peer Buddy', description: 'Cross-department buddy matching for social integration.', week: 1, status: 'pending', assigned_to_role: 'hr' },
  ]

  const completedCount = hrTasks.filter(t => t.status === 'completed').length
  const pendingCount = hrTasks.length - completedCount

  return (
    <div className="container" style={{ paddingTop: '20px', paddingBottom: '60px' }}>
      <header className="db-header" style={{ marginBottom: '40px' }}>
        <div>
          <span className="sec-tag">Operations Hub</span>
          <h1 className="hero-h1" style={{ fontSize: '32px', marginBottom: '8px' }}>Global Task Manager</h1>
          <p className="hero-sub" style={{ fontSize: '15px', marginBottom: 0 }}>
            Monitor and manage all onboarding tasks across the organization.
          </p>
        </div>
        <div className="db-header-actions">
           <button className="btn btn-primary btn-sm">
             <i className="fa-solid fa-plus"></i> Bulk Assign
           </button>
        </div>
      </header>

      <div className="db-row col2-1">
        <div className="db-card">
          <div className="db-card-hd">
            <h3><i className="fa-solid fa-list-ul" style={{ color: 'var(--blue)', marginRight: '8px' }}></i> Active Task Pipeline</h3>
          </div>
          <div className="db-card-bd">
            <TaskList tasks={hrTasks as any} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
           <div className="db-card" style={{ padding: '24px' }}>
              <div className="db-card-hd" style={{ marginBottom: '16px' }}>
                 <h3><i className="fa-solid fa-chart-line" style={{ color: 'var(--cyan)', marginRight: '8px' }}></i> Task Velocity</h3>
              </div>
              <div className="db-card-bd">
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text3)' }}>Completed</span>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>{completedCount}</span>
                 </div>
                 <div className="hce-prog" style={{ height: '8px', marginBottom: '20px' }}>
                    <div className="hce-bar" style={{ width: `${(completedCount/hrTasks.length)*100}%` }}></div>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text3)' }}>Pending Action</span>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>{pendingCount}</span>
                 </div>
                 <div className="hce-prog" style={{ height: '8px' }}>
                    <div className="hce-bar risk" style={{ width: `${(pendingCount/hrTasks.length)*100}%` }}></div>
                 </div>
              </div>
           </div>

           <div className="db-card">
              <div className="db-card-hd">
                 <h3><i className="fa-solid fa-filter" style={{ color: 'var(--blue)', marginRight: '8px' }}></i> Filters</h3>
              </div>
              <div className="db-card-bd" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                 <button className="btn btn-outline btn-sm btn-block" style={{ textAlign: 'left', justifyContent: 'flex-start' }}>Department: All</button>
                 <button className="btn btn-outline btn-sm btn-block" style={{ textAlign: 'left', justifyContent: 'flex-start' }}>Role: HR Manager</button>
                 <button className="btn btn-outline btn-sm btn-block" style={{ textAlign: 'left', justifyContent: 'flex-start' }}>Status: Pending</button>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}
