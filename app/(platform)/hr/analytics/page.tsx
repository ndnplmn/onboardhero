import { createSupabaseServer } from '@/lib/db/supabase-server'
import AnalyticsClient from './AnalyticsClient'

export const dynamic = 'force-dynamic'

// ── Mock data fallback ─────────────────────────────────────────────────────

const MOCK_JOURNEYS = [
  { id: 'j1', status: 'active',    current_week: 3,  risk_score: 72, risk_reasons: ['No check-in completed', '2 overdue tasks', 'Manager not logged in this week'], start_date: '2026-03-01', employee: { id: 'e1', full_name: 'Marcus Reed',  department: 'Product',     avatar_url: 'https://i.pravatar.cc/150?u=marcus' }, manager: { id: 'm1', full_name: 'Sarah Chen' } },
  { id: 'j2', status: 'active',    current_week: 7,  risk_score: 44, risk_reasons: ['Feedback survey pending', '1 overdue task'], start_date: '2026-01-15', employee: { id: 'e2', full_name: 'Priya Mehta',  department: 'Engineering', avatar_url: 'https://i.pravatar.cc/150?u=priya'  }, manager: { id: 'm1', full_name: 'Sarah Chen' } },
  { id: 'j3', status: 'completed', current_week: 12, risk_score: 12, risk_reasons: [], start_date: '2025-12-01', employee: { id: 'e3', full_name: 'James Wilson', department: 'Sales',       avatar_url: 'https://i.pravatar.cc/150?u=james'  }, manager: { id: 'm2', full_name: 'David Park' } },
  { id: 'j4', status: 'active',    current_week: 2,  risk_score: 18, risk_reasons: [], start_date: '2026-03-15', employee: { id: 'e4', full_name: 'Diana Torres', department: 'Design',      avatar_url: 'https://i.pravatar.cc/150?u=diana'  }, manager: { id: 'm2', full_name: 'David Park' } },
]

const MOCK_TASKS = [
  ...Array.from({ length: 12 }, (_, i) => [
    { journey_id: 'j1', week: i + 1, status: i < 2 ? 'completed' : 'pending' },
    { journey_id: 'j2', week: i + 1, status: i < 6 ? 'completed' : 'pending' },
    { journey_id: 'j3', week: i + 1, status: 'completed' },
  ]).flat(),
]

const MOCK_CHECKINS = [
  { id: 'c1', milestone: 'day_30',  scheduled_date: '2026-03-31', completed_date: '2026-03-31', journey: { employee: { full_name: 'Marcus Reed',  department: 'Product'     } }, manager: { full_name: 'Sarah Chen' } },
  { id: 'c2', milestone: 'day_60',  scheduled_date: '2026-04-30', completed_date: null,         journey: { employee: { full_name: 'Marcus Reed',  department: 'Product'     } }, manager: { full_name: 'Sarah Chen' } },
  { id: 'c3', milestone: 'day_30',  scheduled_date: '2026-02-14', completed_date: null,         journey: { employee: { full_name: 'Priya Mehta',  department: 'Engineering' } }, manager: { full_name: 'Sarah Chen' } },
  { id: 'c4', milestone: 'day_90',  scheduled_date: '2026-04-15', completed_date: null,         journey: { employee: { full_name: 'Priya Mehta',  department: 'Engineering' } }, manager: { full_name: 'Sarah Chen' } },
  { id: 'c5', milestone: 'day_90',  scheduled_date: '2026-02-28', completed_date: '2026-02-28', journey: { employee: { full_name: 'James Wilson', department: 'Sales'       } }, manager: { full_name: 'David Park' } },
]

const MOCK_FEEDBACK = [
  { id: 'f1', milestone: 'day_30', rating: 5, comments: 'Really smooth onboarding experience. The buddy program was a highlight.', created_at: '2026-02-01', employee: { full_name: 'James Wilson' } },
  { id: 'f2', milestone: 'day_60', rating: 4, comments: 'Good overall. Would appreciate more structured goals in week 3.', created_at: '2026-03-01', employee: { full_name: 'James Wilson' } },
  { id: 'f3', milestone: 'day_30', rating: 3, comments: 'Missing clarity on team norms. Manager check-ins felt rushed.', created_at: '2026-02-20', employee: { full_name: 'Priya Mehta' } },
]

export default async function HRAnalyticsPage() {
  const supabase = await createSupabaseServer()

  const [journeysRes, tasksRes, checkInsRes, feedbackRes] = await Promise.all([
    supabase
      .from('journeys')
      .select('id, status, current_week, risk_score, risk_reasons, start_date, employee:profiles!employee_id(id, full_name, avatar_url, department), manager:profiles!manager_id(id, full_name)')
      .order('risk_score', { ascending: false }),
    supabase
      .from('journey_tasks')
      .select('journey_id, status, week'),
    supabase
      .from('check_ins')
      .select('id, milestone, scheduled_date, completed_date, journey:journeys!journey_id(employee:profiles!employee_id(full_name, department)), manager:profiles!manager_id(full_name)')
      .order('scheduled_date', { ascending: true }),
    supabase
      .from('feedback_surveys')
      .select('id, milestone, rating, comments, created_at, employee:profiles!employee_id(full_name)')
      .order('created_at', { ascending: false })
      .limit(30),
  ])

  const journeys  = (journeysRes.data  && journeysRes.data.length  > 0) ? journeysRes.data  : MOCK_JOURNEYS
  const tasks     = (tasksRes.data     && tasksRes.data.length     > 0) ? tasksRes.data     : MOCK_TASKS
  const checkIns  = (checkInsRes.data  && checkInsRes.data.length  > 0) ? checkInsRes.data  : MOCK_CHECKINS
  const feedback  = (feedbackRes.data  && feedbackRes.data.length  > 0) ? feedbackRes.data  : MOCK_FEEDBACK

  return (
    <AnalyticsClient
      journeys={journeys as any}
      tasks={tasks as any}
      checkIns={checkIns as any}
      feedback={feedback as any}
    />
  )
}
