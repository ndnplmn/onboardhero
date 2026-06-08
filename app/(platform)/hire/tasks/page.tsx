import { getUser } from '@/lib/auth/get-user'
import { getHireDashboardData } from '@/lib/db/queries/hire'
import TaskList from '@/components/platform/TaskList'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
  const user = await getUser()
  const { journey: dbJourney, tasks: dbTasks } = await getHireDashboardData(user.id)

  const hireTasks = dbTasks.filter((t: any) => t.assigned_to_role === 'new_hire')

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
        {!dbJourney ? (
          <div className="db-card" style={{ textAlign: 'center', padding: '56px 32px' }}>
            <i className="fa-solid fa-hourglass-half" style={{ fontSize: 40, color: 'var(--text3)', marginBottom: 16 }} />
            <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>Your journey is being set up</h3>
            <p style={{ color: 'var(--text3)', fontSize: 14, maxWidth: 380, margin: '0 auto' }}>
              Your HR team is configuring your onboarding plan. You&apos;ll receive a notification as soon as your tasks are ready.
            </p>
          </div>
        ) : hireTasks.length === 0 ? (
          <div className="db-card" style={{ textAlign: 'center', padding: '56px 32px' }}>
            <i className="fa-solid fa-clipboard-list" style={{ fontSize: 40, color: 'var(--text3)', marginBottom: 16 }} />
            <h3 style={{ color: 'var(--text)', marginBottom: 8 }}>No tasks assigned yet</h3>
            <p style={{ color: 'var(--text3)', fontSize: 14, maxWidth: 380, margin: '0 auto' }}>
              Your manager hasn&apos;t added any tasks to your onboarding plan yet. Check back soon or reach out to your manager directly.
            </p>
          </div>
        ) : (
          <TaskList tasks={hireTasks} currentWeek={dbJourney.current_week} />
        )}
      </div>
    </>
  )
}
