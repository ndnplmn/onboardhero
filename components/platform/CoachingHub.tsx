'use client'

import { useRouter } from 'next/navigation'

interface Journey {
  id: string
  status: string
  risk_score: number
  current_week: number
  employee?: { full_name?: string } | null
  friction_points?: string[] | { type?: string; label?: string; description?: string }[] | null
}

interface CoachingHubProps {
  journeys?: Journey[]
}

interface CoachingItem {
  id:      string
  title:   string
  desc:    string
  icon:    string
  href:    string
  color:   string
  bg:      string
  border:  string
  ctaLabel?: string
  ctaHref?:  string
}

const WEEK_PHASE_ITEMS: Record<'early' | 'mid' | 'feedback' | 'goals', CoachingItem[]> = {
  early: [
    {
      id: 'onboard-firstweek',
      title: 'First Week Best Practices',
      desc: 'Set clear 30-day expectations, introduce the team, and establish communication norms before week 2.',
      icon: 'fa-solid fa-rocket',
      href: '/manager/coaching',
      color: 'var(--cyan)',
      bg: 'var(--cyan-light)',
      border: 'rgba(0,200,224,0.2)',
      ctaLabel: 'Run roleplay →',
      ctaHref: '/manager/roleplay',
    },
    {
      id: 'onboard-expectations',
      title: 'Define Success Criteria Now',
      desc: "Write down what 'great' looks like at 30, 60, 90 days. Share it with your hire this week.",
      icon: 'fa-solid fa-bullseye',
      href: '/manager/coaching',
      color: 'var(--blue)',
      bg: 'var(--blue-light)',
      border: 'rgba(26,108,246,0.2)',
      ctaLabel: 'Review goals →',
      ctaHref: '/manager/hires',
    },
  ],
  mid: [
    {
      id: 'sim-candor',
      title: 'Simulation: Radical Candor',
      desc: 'Practice mid-journey feedback conversations. Builds the muscle before the 30-day review.',
      icon: 'fa-solid fa-vr-cardboard',
      href: '/manager/roleplay',
      color: 'var(--cyan)',
      bg: 'var(--cyan-light)',
      border: 'rgba(0,200,224,0.2)',
      ctaLabel: 'Start simulation →',
      ctaHref: '/manager/roleplay',
    },
    {
      id: 'mid-psych-safety',
      title: 'Building Psychological Safety',
      desc: 'Week 3–5 is when hires go quiet if they feel unsafe raising concerns. Ask "What\'s unclear?" in your next 1:1.',
      icon: 'fa-solid fa-shield-heart',
      href: '/manager/coaching',
      color: 'var(--blue)',
      bg: 'var(--blue-light)',
      border: 'rgba(26,108,246,0.2)',
      ctaLabel: 'Schedule 1:1 →',
      ctaHref: '/manager/calendar',
    },
  ],
  feedback: [
    {
      id: 'feedback-30day',
      title: 'Run Your 30-Day Feedback Session',
      desc: 'Open with "What\'s working?" then "What would accelerate your ramp?" Close with a written action item.',
      icon: 'fa-solid fa-comments',
      href: '/manager/coaching',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.1)',
      border: 'rgba(245,158,11,0.2)',
      ctaLabel: 'Log feedback →',
      ctaHref: '/manager/feedback',
    },
    {
      id: 'feedback-checkin-guide',
      title: 'Mid-Journey Check-in This Week',
      desc: 'Hires who receive structured 30–60 day check-ins are 2× more likely to stay past 12 months.',
      icon: 'fa-solid fa-calendar-check',
      href: '/manager/coaching',
      color: 'var(--cyan)',
      bg: 'var(--cyan-light)',
      border: 'rgba(0,200,224,0.2)',
      ctaLabel: 'Schedule now →',
      ctaHref: '/manager/calendar',
    },
  ],
  goals: [
    {
      id: 'goals-90day',
      title: '90-Day Review — Prepare Now',
      desc: 'Review their 30/60/90 goals together. Recognize wins publicly, address gaps privately.',
      icon: 'fa-solid fa-medal',
      href: '/manager/coaching',
      color: '#22c55e',
      bg: 'rgba(34,197,94,0.1)',
      border: 'rgba(34,197,94,0.2)',
      ctaLabel: 'Open coaching →',
      ctaHref: '/manager/coaching',
    },
    {
      id: 'goals-retention',
      title: 'Lock In Long-Term Engagement',
      desc: 'After 90 days, the hire decides if they\'re staying. Ask: "What would make this the best job you\'ve ever had?"',
      icon: 'fa-solid fa-chart-line',
      href: '/manager/coaching',
      color: 'var(--blue)',
      bg: 'var(--blue-light)',
      border: 'rgba(26,108,246,0.2)',
      ctaLabel: 'Give feedback →',
      ctaHref: '/manager/feedback',
    },
  ],
}

function getFrictionSummary(j: Journey): string {
  const fp = j.friction_points
  if (!fp || !Array.isArray(fp) || fp.length === 0) return `Week ${j.current_week} · Risk ${j.risk_score} — schedule a check-in now.`
  const first = fp[0]
  if (typeof first === 'string') return first
  if (typeof first === 'object' && first !== null) {
    return (first as any).label ?? (first as any).description ?? `Week ${j.current_week} · Risk ${j.risk_score}`
  }
  return `Week ${j.current_week} · Risk ${j.risk_score}`
}

function getPhaseItems(journeys: Journey[]): CoachingItem[] {
  const active = journeys.filter(j => j.status !== 'completed')
  if (!active.length) return WEEK_PHASE_ITEMS.early
  const avgWeek = active.reduce((s, j) => s + j.current_week, 0) / active.length
  if (avgWeek <= 2)  return WEEK_PHASE_ITEMS.early
  if (avgWeek <= 5)  return WEEK_PHASE_ITEMS.mid
  if (avgWeek <= 8)  return WEEK_PHASE_ITEMS.feedback
  return WEEK_PHASE_ITEMS.goals
}

export default function CoachingHub({ journeys = [] }: CoachingHubProps) {
  const router = useRouter()

  const atRiskHires = journeys.filter((j) => j.risk_score > 60 && j.status !== 'completed')

  const dynamicItems = atRiskHires.slice(0, 2).map<CoachingItem>((j) => {
    const name = j.employee?.full_name ?? 'At-Risk Hire'
    const frictionSummary = getFrictionSummary(j)
    return {
      id:       `brief-${j.id}`,
      title:    `Action Required: ${name}`,
      desc:     frictionSummary,
      icon:     'fa-solid fa-triangle-exclamation',
      href:     `/manager/roleplay`,
      color:    'var(--red)',
      bg:       'var(--red-bg)',
      border:   'rgba(239,68,68,0.2)',
      ctaLabel: 'Practice conversation →',
      ctaHref:  `/manager/roleplay`,
    }
  })

  const phaseItems = getPhaseItems(journeys)
  const items = [...dynamicItems, ...phaseItems].slice(0, 3)

  return (
    <div className="db-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-graduation-cap" style={{ color: 'var(--blue)' }} />
          {' '}AI Coaching & Intelligence
        </h3>
        <span className="badge-ai">Proactive</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {items.map((rec, i) => (
          <button
            key={rec.id}
            onClick={() => router.push(rec.href)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              padding: '18px 20px',
              background: 'transparent',
              border: 'none',
              borderBottomColor: 'var(--border)',
              borderBottomStyle: i < items.length - 1 ? 'solid' : undefined,
              borderBottomWidth: i < items.length - 1 ? 1 : 0,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s',
              width: '100%',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--r)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              flexShrink: 0,
              background: rec.bg,
              color: rec.color,
              border: `1px solid ${rec.border}`,
            }}>
              <i className={rec.icon} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
                {rec.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>
                {rec.desc}
              </div>
              {rec.ctaLabel && rec.ctaHref && (
                <button
                  onClick={(e) => { e.stopPropagation(); router.push(rec.ctaHref!) }}
                  style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: rec.color, background: rec.bg, border: `1px solid ${rec.border}`, borderRadius: 'var(--r)', padding: '3px 10px', cursor: 'pointer' }}
                >
                  {rec.ctaLabel}
                </button>
              )}
            </div>
            <i className="fa-solid fa-chevron-right" style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }} />
          </button>
        ))}
      </div>

      <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)' }}>
        <button
          className="btn btn-outline btn-sm"
          style={{ width: '100%' }}
          onClick={() => router.push('/manager/roleplay')}
        >
          <i className="fa-solid fa-plus" /> Request Custom Simulation
        </button>
      </div>
    </div>
  )
}
