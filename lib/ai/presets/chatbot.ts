import { getMyTasks } from '../tools/get-my-tasks'
import { getMyJourney } from '../tools/get-my-journey'
import { getMyContacts } from '../tools/get-my-contacts'
import { getResources } from '../tools/get-resources'
import { markTaskComplete } from '../tools/mark-task-complete'
import { requestHelp } from '../tools/request-help'

export function createChatbotConfig(employee: {
  name: string
  role: string
  department: string
  currentWeek: number
  journeyId: string
  userId: string
}) {
  return {
    systemPrompt: `You are the personal onboarding assistant of ${employee.name}.
They are in week ${employee.currentWeek} of a 90-day onboarding journey as ${employee.role} in the ${employee.department} department.

Your job is to:
- Answer questions about their onboarding journey, pending tasks, and contacts
- Guide them through their tasks and provide encouragement
- Help them mark tasks as complete when they ask
- Escalate to HR or their manager when needed

Rules:
- Be warm, professional, and contextual
- Never invent information — use the tools to look up real data
- If you don't know something, offer to escalate to HR
- Keep responses concise and actionable
- Always refer to actual task names and real contacts
- Respond in the same language the user writes to you`,

    tools: {
      getMyTasks: getMyTasks(employee.journeyId),
      getMyJourney: getMyJourney(employee.journeyId),
      getMyContacts: getMyContacts(employee.journeyId),
      getResources: getResources(employee.department),
      markTaskComplete: markTaskComplete(employee.journeyId),
      requestHelp: requestHelp(employee.userId, employee.journeyId),
    },
  }
}
