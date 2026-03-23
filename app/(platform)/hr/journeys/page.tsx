import { createSupabaseServer } from '@/lib/db/supabase-server'
import JourneysClient from './journeys-client'

export const dynamic = 'force-dynamic'

export default async function JourneysPage() {
  const supabase = await createSupabaseServer()

  const { data: templates } = await supabase
    .from('journey_templates')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: tasks } = await supabase
    .from('template_tasks')
    .select('template_id')

  // Count tasks per template
  const taskCounts: Record<string, number> = {}
  tasks?.forEach((t: any) => {
    taskCounts[t.template_id] = (taskCounts[t.template_id] || 0) + 1
  })

  return <JourneysClient templates={templates || []} taskCounts={taskCounts} />
}
