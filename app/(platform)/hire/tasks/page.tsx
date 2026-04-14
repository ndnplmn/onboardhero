import { getUser } from '@/lib/auth/get-user'
import { getHireDashboardData } from '@/lib/db/queries/hire'
import TaskList from '@/components/platform/TaskList'

export const dynamic = 'force-dynamic'

// ── Mock fallback ──────────────────────────────────────────────────────────

const MOCK_JOURNEY = {
  id:           'mock-journey',
  status:       'active',
  current_week: 3,
  risk_score:   15,
  start_date:   new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
} as any

const MOCK_TASKS = [
  { id: 'mt1', title: 'Complete IT security training',      description: 'Finish the mandatory cybersecurity module and pass the quiz.',                week: 1, status: 'completed', assigned_to_role: 'new_hire', due_date: null, completed_at: new Date(Date.now() - 12 * 86400000).toISOString() },
  { id: 'mt2', title: 'Set up development environment',     description: 'Install required tools, configure VPN, and clone the main repos.',          week: 1, status: 'completed', assigned_to_role: 'new_hire', due_date: null, completed_at: new Date(Date.now() - 11 * 86400000).toISOString() },
  { id: 'mt3', title: 'Read the company culture guide',     description: 'Review the wiki: values, remote-work norms, team rituals, and Slack etiquette.', week: 1, status: 'completed', assigned_to_role: 'new_hire', due_date: null, completed_at: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: 'mt4', title: 'Meet with your direct team',         description: 'Intro 1:1s with each team member — 20 min each to hear about their work.',  week: 2, status: 'completed', assigned_to_role: 'new_hire', due_date: null, completed_at: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: 'mt5', title: 'Join weekly team standup',           description: 'Attend daily standup to get familiar with the team workflow and current sprint.', week: 2, status: 'in_progress', assigned_to_role: 'new_hire', due_date: null, completed_at: null },
  { id: 'mt6', title: 'Submit benefits enrollment form',    description: 'Complete your health, dental, and 401k elections via the HR portal.',       week: 2, status: 'pending',     assigned_to_role: 'new_hire', due_date: null, completed_at: null },
  { id: 'mt7', title: 'Shadow a senior team member',        description: 'Spend one full day observing how a senior colleague approaches their work.',  week: 3, status: 'pending',     assigned_to_role: 'new_hire', due_date: null, completed_at: null },
  { id: 'mt8', title: 'Complete first independent task',    description: 'Deliver your first solo contribution — reviewed and merged by the team.',    week: 3, status: 'pending',     assigned_to_role: 'new_hire', due_date: null, completed_at: null },
  { id: 'mt9', title: 'Write a 30-day reflection note',     description: 'Share your first-month learnings, wins, and open questions with your manager.', week: 4, status: 'pending', assigned_to_role: 'new_hire', due_date: null, completed_at: null },
]

export default async function TasksPage() {
  const user = await getUser()
  const { journey: dbJourney, tasks: dbTasks } = await getHireDashboardData(user.id)

  const journey   = dbJourney ?? MOCK_JOURNEY
  const allTasks  = dbTasks.length > 0 ? dbTasks : MOCK_TASKS
  const hireTasks = allTasks.filter((t: any) => t.assigned_to_role === 'new_hire')

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
        <TaskList tasks={hireTasks} currentWeek={journey.current_week} />
      </div>
    </>
  )
}
