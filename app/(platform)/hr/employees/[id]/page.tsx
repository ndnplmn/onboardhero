import { createSupabaseAdmin } from '@/lib/db/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EmployeeJourneyClient from './EmployeeJourneyClient'

export const dynamic = 'force-dynamic'

export default async function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const admin = createSupabaseAdmin()

  const { data: employee } = await admin
    .from('profiles')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!employee) notFound()

  const { data: journeyData } = await admin
    .from('journeys')
    .select('*, template:journey_templates!template_id(duration_days)')
    .eq('employee_id', params.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let tasks: any[] = []
  if (journeyData) {
    const { data: taskData } = await admin
      .from('journey_tasks')
      .select('*')
      .eq('journey_id', journeyData.id)
      .order('week', { ascending: true })
    tasks = taskData ?? []
  }

  return (
    <EmployeeJourneyClient
      employee={employee}
      journey={journeyData ?? null}
      tasks={tasks}
    />
  )
}
