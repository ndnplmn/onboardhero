import { getUser } from '@/lib/auth/get-user'
import { getHireDashboardData } from '@/lib/db/queries/hire'
import TaskList from '@/components/platform/TaskList'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
  const user = await getUser()
  const { journey, tasks } = await getHireDashboardData(user.id)

  const hireTasks = tasks.filter((t: any) => t.assigned_to_role === 'new_hire')

  return (
    <>
      <div className="db-header">
        <div className="db-header-left">
          <h1>
            <i
              className="fa-solid fa-list-check"
              style={{
                marginRight: 8,
                background: 'var(--grad)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              aria-hidden="true"
            />
            My Tasks
          </h1>
          <p>Complete your onboarding tasks to accelerate your integration.</p>
        </div>
      </div>
      <div className="db-body">
        {journey ? (
          <TaskList tasks={hireTasks} currentWeek={journey.current_week} />
        ) : (
          <div className="db-card">
            <div className="db-card-bd" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <i className="fa-solid fa-list-check" style={{ fontSize: 28, color: 'var(--border2)', display: 'block', marginBottom: 12 }} aria-hidden="true" />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>No tasks available yet</p>
              <p style={{ fontSize: 12, color: 'var(--text3)' }}>Your manager will assign tasks once your journey begins.</p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
