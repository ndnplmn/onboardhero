import CompanyWiki from '@/components/platform/CompanyWiki'
import { getWikiArticles } from '@/lib/db/queries/wiki'
import { createSupabaseServer } from '@/lib/db/supabase-server'

export const dynamic = 'force-dynamic'

export default async function HireWikiPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const [articles, frictionAxes] = await Promise.all([
    getWikiArticles(),
    (async () => {
      if (!user) return []
      const { data: journey } = await supabase
        .from('journeys')
        .select('friction_points, risk_reasons')
        .eq('employee_id', user.id)
        .in('status', ['in_progress', 'at_risk', 'active'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      if (!journey) return []
      // friction_points may be an array of { axis, ... } objects or strings
      const raw: unknown[] = Array.isArray(journey.friction_points) ? journey.friction_points : []
      const axes = raw
        .map((fp: any) => (typeof fp === 'string' ? fp : (fp?.axis ?? fp?.dimension ?? '')))
        .filter(Boolean)
      // Also derive from risk_reasons if no explicit friction points
      if (!axes.length && Array.isArray(journey.risk_reasons)) {
        const reasonMap: Record<string, string> = {
          'low_engagement': 'Process',
          'missed_checkins': 'Feedback',
          'social_isolation': 'Social',
          'technical_blockers': 'Technical',
          'culture_fit': 'Culture',
        }
        journey.risk_reasons.forEach((r: string) => {
          const mapped = reasonMap[r]
          if (mapped) axes.push(mapped)
        })
      }
      return [...new Set(axes)] as string[]
    })(),
  ])

  return <CompanyWiki articles={articles} frictionAxes={frictionAxes} />
}
