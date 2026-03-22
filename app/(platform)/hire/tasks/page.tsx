import { getUser } from '@/lib/auth/get-user'
import { getHireDashboardData } from '@/lib/db/queries/hire'
import TaskList from '@/components/platform/TaskList'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
  const user = await getUser()
  const { journey, tasks } = await getHireDashboardData(user.id)

  const hireTasks = tasks.filter((t: any) => t.assigned_to_role === 'new_hire')

  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ fontFamily: "'Outfit', sans-serif", marginBottom: '24px' }}>My Tasks</h1>
      {journey ? (
        <TaskList tasks={hireTasks} currentWeek={journey.current_week} />
      ) : (
        <p style={{ color: 'var(--text3)' }}>No tasks available yet.</p>
      )}
    </div>
  )
}
