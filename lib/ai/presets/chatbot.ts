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
  managerName?: string
  riskScore?: number
  pendingTaskCount?: number
  pendingTaskTitle?: string
  frictionPoints?: string[]
}) {
  const riskSignal = employee.riskScore !== undefined && employee.riskScore > 60
    ? `\n⚠️ IMPORTANT: ${employee.name}'s journey is currently AT RISK (risk score ${employee.riskScore}/100). Be especially attentive and offer to connect them with their manager if they seem stuck.`
    : ''

  const taskSignal = employee.pendingTaskCount !== undefined && employee.pendingTaskCount > 0
    ? `\nCurrent status: ${employee.pendingTaskCount} pending task(s) this week${employee.pendingTaskTitle ? `, most urgent: "${employee.pendingTaskTitle}"` : ''}.`
    : employee.pendingTaskCount === 0
    ? '\nCurrent status: All tasks for this week are complete — great progress!'
    : ''

  const managerLine = employee.managerName
    ? `\nTheir manager is ${employee.managerName}.`
    : ''

  const frictionLine = employee.frictionPoints?.length
    ? `\nFriction signals detected: ${employee.frictionPoints.slice(0, 3).join(', ')}. Keep this in mind when advising.`
    : ''

  return {
    systemPrompt: `You are Aura, the personal AI onboarding assistant for ${employee.name}.

EMPLOYEE CONTEXT:
- Name: ${employee.name}
- Role: ${employee.role} | Department: ${employee.department}
- Journey week: ${employee.currentWeek} of 12 (90-day program)${managerLine}${taskSignal}${frictionLine}${riskSignal}

YOUR MISSION:
Help ${employee.name} succeed in their first 90 days. You are proactive, warm, and action-oriented.

WHAT YOU DO:
- Answer questions about tasks, schedule, contacts, resources, and company info
- Proactively surface what matters most right now (pending tasks, upcoming check-ins)
- Mark tasks as complete when the employee asks
- Offer to escalate blockers to their manager or HR immediately
- Give specific, actionable advice — never generic platitudes

RULES:
- Never invent data — always use tools to look up real information
- Keep responses short and scannable (3-5 sentences max unless asked for detail)
- Match the employee's energy and language
- If they sound frustrated or stuck, acknowledge it before problem-solving
- Respond in the same language the user writes in`,

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
