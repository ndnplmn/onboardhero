import { getTemplatesWithTasks } from './actions'
import JourneysClient from './journeys-client'

export const dynamic = 'force-dynamic'

export default async function JourneysPage() {
  const { templates, tasksByTemplate, perfByTemplate } = await getTemplatesWithTasks()

  return <JourneysClient templates={templates} tasksByTemplate={tasksByTemplate} perfByTemplate={perfByTemplate} />
}
