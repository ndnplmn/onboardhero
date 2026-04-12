import { createSupabaseServer } from '@/lib/db/supabase-server'
import TaskManagerClient from './TaskManagerClient'

export const dynamic = 'force-dynamic'

// Mock data for demo / empty DB
const MOCK_TASKS = [
  { id: 'h1', title: 'Submit Hardware Request',         description: 'Technical setup for new Senior Designer.',               week: 1,  status: 'completed', assigned_to_role: 'hr',       completed_at: new Date().toISOString(), order: 0, journey: { id: 'j1', current_week: 3, start_date: '2026-03-01', employee: { id: 'e1', full_name: 'Marcus Reed',  department: 'Product',     avatar_url: 'https://i.pravatar.cc/150?u=marcus' } } },
  { id: 'h2', title: 'Benefits Enrollment Review',      description: 'Verify health insurance and 401k setup.',               week: 2,  status: 'pending',   assigned_to_role: 'hr',       completed_at: null,                    order: 0, journey: { id: 'j2', current_week: 7, start_date: '2026-01-15', employee: { id: 'e2', full_name: 'Priya Mehta',  department: 'Engineering', avatar_url: 'https://i.pravatar.cc/150?u=priya'  } } },
  { id: 'h3', title: 'Culture Workshop Invite',         description: 'Send invitation for the monthly culture alignment.',    week: 1,  status: 'completed', assigned_to_role: 'hr',       completed_at: new Date().toISOString(), order: 1, journey: { id: 'j2', current_week: 7, start_date: '2026-01-15', employee: { id: 'e2', full_name: 'Priya Mehta',  department: 'Engineering', avatar_url: 'https://i.pravatar.cc/150?u=priya'  } } },
  { id: 'h4', title: 'Final Onboarding Exit Interview', description: 'Gather qualitative data on the 90-day journey.',       week: 12, status: 'pending',   assigned_to_role: 'hr',       completed_at: null,                    order: 0, journey: { id: 'j3', current_week: 12, start_date: '2025-12-01', employee: { id: 'e3', full_name: 'James Wilson', department: 'Sales',       avatar_url: 'https://i.pravatar.cc/150?u=james'  } } },
  { id: 'h5', title: 'Assign Peer Buddy',               description: 'Cross-department buddy matching for social integration.',week: 1,  status: 'pending',   assigned_to_role: 'hr',       completed_at: null,                    order: 2, journey: { id: 'j1', current_week: 3, start_date: '2026-03-01', employee: { id: 'e1', full_name: 'Marcus Reed',  department: 'Product',     avatar_url: 'https://i.pravatar.cc/150?u=marcus' } } },
  { id: 'h6', title: 'Week 1 Check-in with Manager',    description: 'Ensure manager has completed the first 1:1.',          week: 1,  status: 'completed', assigned_to_role: 'manager',  completed_at: new Date().toISOString(), order: 0, journey: { id: 'j1', current_week: 3, start_date: '2026-03-01', employee: { id: 'e1', full_name: 'Marcus Reed',  department: 'Product',     avatar_url: 'https://i.pravatar.cc/150?u=marcus' } } },
  { id: 'h7', title: 'IT Setup Checklist',              description: 'Complete laptop setup and tool access.',                week: 1,  status: 'completed', assigned_to_role: 'new_hire', completed_at: new Date().toISOString(), order: 0, journey: { id: 'j2', current_week: 7, start_date: '2026-01-15', employee: { id: 'e2', full_name: 'Priya Mehta',  department: 'Engineering', avatar_url: 'https://i.pravatar.cc/150?u=priya'  } } },
  { id: 'h8', title: '30-Day Review',                   description: 'First month review session with HR and manager.',      week: 4,  status: 'pending',   assigned_to_role: 'manager',  completed_at: null,                    order: 0, journey: { id: 'j2', current_week: 7, start_date: '2026-01-15', employee: { id: 'e2', full_name: 'Priya Mehta',  department: 'Engineering', avatar_url: 'https://i.pravatar.cc/150?u=priya'  } } },
  { id: 'h9', title: 'Review Company Handbook',         description: 'Complete handbook reading and acknowledge policies.',  week: 1,  status: 'pending',   assigned_to_role: 'new_hire', completed_at: null,                    order: 1, journey: { id: 'j3', current_week: 12, start_date: '2025-12-01', employee: { id: 'e3', full_name: 'James Wilson', department: 'Sales',       avatar_url: 'https://i.pravatar.cc/150?u=james'  } } },
]

const MOCK_JOURNEYS = [
  { id: 'j1', employee: { id: 'e1', full_name: 'Marcus Reed',  department: 'Product'     } },
  { id: 'j2', employee: { id: 'e2', full_name: 'Priya Mehta',  department: 'Engineering' } },
  { id: 'j3', employee: { id: 'e3', full_name: 'James Wilson', department: 'Sales'       } },
]

export default async function HRTasksPage() {
  const supabase = await createSupabaseServer()

  const [tasksRes, journeysRes] = await Promise.all([
    supabase
      .from('journey_tasks')
      .select(`
        id, title, description, week, status, assigned_to_role, completed_at, order,
        journey:journeys!journey_id(
          id, current_week, start_date,
          employee:profiles!employee_id(id, full_name, department, avatar_url)
        )
      `)
      .order('week', { ascending: true }),
    supabase
      .from('journeys')
      .select('id, employee:profiles!employee_id(id, full_name, department)')
      .eq('status', 'active'),
  ])

  const tasks    = (tasksRes.data && tasksRes.data.length > 0)    ? tasksRes.data    : MOCK_TASKS
  const journeys = (journeysRes.data && journeysRes.data.length > 0) ? journeysRes.data : MOCK_JOURNEYS

  return <TaskManagerClient tasks={tasks as any} journeys={journeys as any} />
}
