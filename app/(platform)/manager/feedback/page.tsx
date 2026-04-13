import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/db/supabase-server'
import { getManagerFeedbackData } from '@/lib/db/queries/forms'
import FeedbackClient from './FeedbackClient'

export const dynamic = 'force-dynamic'

// ── Mock fallback ──────────────────────────────────────────────────────────

const MOCK_FEEDBACK = [
  {
    id: 'f1',
    from: 'Marcus Reed',
    department: 'Product',
    avatar_url: 'https://i.pravatar.cc/150?u=marcus',
    date: '2026-04-10',
    content: 'The technical onboarding documentation is top-notch. I felt very supported by the IT team during the first week.',
    rating: 5,
    category: 'Technical',
    sentiment: 'positive' as const,
    source: 'form' as const,
  },
  {
    id: 'f2',
    from: 'Priya Mehta',
    department: 'Engineering',
    avatar_url: 'https://i.pravatar.cc/150?u=priya',
    date: '2026-04-08',
    content: 'The social buddy system is great, but I think the Week 2 orientation could be a bit more focused on architecture.',
    rating: 4,
    category: 'Social',
    sentiment: 'mixed' as const,
    source: 'form' as const,
  },
  {
    id: 'f3',
    from: 'James Wilson',
    department: 'Sales',
    avatar_url: 'https://i.pravatar.cc/150?u=james',
    date: '2026-04-05',
    content: 'The leadership simulation was incredibly helpful for understanding the company culture. Highly recommend it!',
    rating: 5,
    category: 'Culture',
    sentiment: 'positive' as const,
    source: 'check-in' as const,
  },
  {
    id: 'f4',
    from: 'Diana Torres',
    department: 'Design',
    avatar_url: 'https://i.pravatar.cc/150?u=diana',
    date: '2026-04-01',
    content: 'Final onboarding process was smooth. The integration radar provided clear visibility into my progress.',
    rating: 5,
    category: 'Process',
    sentiment: 'positive' as const,
    source: 'form' as const,
  },
  {
    id: 'f5',
    from: 'Priya Mehta',
    department: 'Engineering',
    avatar_url: 'https://i.pravatar.cc/150?u=priya',
    date: '2026-03-28',
    content: 'Week 3 felt overwhelming — too many tasks assigned at once. Would benefit from better pacing.',
    rating: 2,
    category: 'Process',
    sentiment: 'negative' as const,
    source: 'check-in' as const,
  },
]

export default async function ManagerFeedbackPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { submissions, checkInFeedback } = await getManagerFeedbackData(user.id)

  // ── Transform submissions into unified feedback shape ───────────────────
  type Sentiment = 'positive' | 'mixed' | 'negative'

  const fromForms = submissions.map((s: any) => {
    const emp = Array.isArray(s.employee) ? s.employee[0] : s.employee
    const form = Array.isArray(s.form) ? s.form[0] : s.form
    const rating: number = s.responses?.rating ?? s.responses?.satisfaction ?? 4
    const content: string = s.responses?.comments ?? s.responses?.feedback ?? s.responses?.text ?? 'No written response provided.'
    const sentiment: Sentiment = rating >= 4 ? 'positive' : rating === 3 ? 'mixed' : 'negative'
    return {
      id:          s.id,
      from:        emp?.full_name        ?? 'Unknown',
      department:  emp?.department       ?? 'General',
      avatar_url:  emp?.avatar_url       ?? null,
      date:        s.submitted_at?.split('T')[0] ?? '',
      content,
      rating,
      category:    form?.title           ?? 'General',
      sentiment,
      source:      'form' as const,
    }
  })

  const fromCheckIns = checkInFeedback
    .filter((c: any) => c.notes && c.notes.trim().length > 10)
    .map((c: any) => {
      const journey = Array.isArray(c.journey) ? c.journey[0] : c.journey
      const emp = Array.isArray(journey?.employee) ? journey?.employee[0] : journey?.employee
      return {
        id:         c.id,
        from:       emp?.full_name    ?? 'Team Member',
        department: emp?.department   ?? 'General',
        avatar_url: emp?.avatar_url   ?? null,
        date:       c.completed_date  ?? '',
        content:    c.notes,
        rating:     3,
        category:   c.type === 'day30' ? '30-Day Review' : c.type === 'day60' ? '60-Day Review' : c.type === 'day90' ? '90-Day Review' : 'Check-in',
        sentiment:  'mixed' as Sentiment,
        source:     'check-in' as const,
      }
    })

  const allFeedback = [...fromForms, ...fromCheckIns]
  const feedback = allFeedback.length > 0 ? allFeedback : MOCK_FEEDBACK

  // ── Derive KPIs ──────────────────────────────────────────────────────────
  const total         = feedback.length
  const withRating    = feedback.filter(f => f.rating > 0)
  const avgRating     = withRating.length > 0
    ? Math.round((withRating.reduce((s, f) => s + f.rating, 0) / withRating.length) * 10) / 10
    : 0
  const positiveCount = feedback.filter(f => f.sentiment === 'positive').length
  const positivePct   = total > 0 ? Math.round((positiveCount / total) * 100) : 0
  const negativeCount = feedback.filter(f => f.sentiment === 'negative').length

  // ── Category distribution ────────────────────────────────────────────────
  const catMap: Record<string, number> = {}
  feedback.forEach(f => {
    catMap[f.category] = (catMap[f.category] ?? 0) + 1
  })
  const categories = Object.entries(catMap)
    .map(([label, count]) => ({ label, count, pct: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count)

  return (
    <FeedbackClient
      feedback={feedback as any}
      kpis={{ total, avgRating, positivePct, negativeCount }}
      categories={categories}
    />
  )
}
