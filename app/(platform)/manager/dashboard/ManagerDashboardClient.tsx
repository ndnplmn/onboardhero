'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import TeamCard from '@/components/platform/TeamCard'
import KPICard from '@/components/platform/KPICard'
import ProgressRing from '@/components/platform/ProgressRing'
import ManagerNotes from '@/components/platform/ManagerNotes'
import MilestonesList from '@/components/platform/MilestonesList'
import FrictionMap, { FrictionPoint } from '@/components/platform/FrictionMap'
import ManagerPendingTasks from '@/components/platform/ManagerPendingTasks'
import TeamSentiment from '@/components/platform/TeamSentiment'
import CoachingHub from '@/components/platform/CoachingHub'
import VelocityScore from '@/components/platform/VelocityScore'
import AIRecommendations from '@/components/platform/AIRecommendations'
import InterventionBrief from '@/components/platform/InterventionBrief'
import InterventionApproval from '@/components/platform/InterventionApproval'
import ScheduleCheckInModal, { type CheckInHiree } from '@/components/platform/ScheduleCheckInModal'
import ProactiveAura from '@/components/platform/ProactiveAura'
import CulturalResonance from '@/components/platform/CulturalResonance'
import { useT } from '@/lib/i18n/context'
import OnboardingTour from '@/components/platform/OnboardingTour'

interface HireGoal {
  id:          string
  journey_id:  string
  milestone:   'day_30' | 'day_60' | 'day_90'
  title:       string
  description: string | null
  status:      'not_started' | 'in_progress' | 'completed'
  created_at:  string
}

interface ManagerEffectiveness {
  checkInCompletionRate: number | null
  atRiskResponseRate:    number | null
  teamHealthScore:       number | null
  totalCheckIns:         number
  completedCheckIns:     number
}

interface ManagerDashboardClientProps {
  user: any
  journeys: any[]
  activeJourney: any
  upcomingCheckIns: { id: string; date: string; employee: string; avatarUrl?: string | null }[]
  managerTasks?: any[]
  frictionPoints: FrictionPoint[]
  overallProgress: number
  atRiskCount: number
  avgFeedbackRating?: number
  hireGoals?: HireGoal[]
  effectiveness?: ManagerEffectiveness
}

// ─── Daily Action Card ────────────────────────────────────────────────────────

interface DailyAction {
  id:       string
  priority:     'urgent' | 'today' | 'watch'
  icon:         string
  title:        string
  desc:         string
  cta:          string
  href?:        string
  onClick?:     () => void
  practiceHref?: string
}

function DailyActionCard({ journeys, managerTasks, upcomingCheckIns, onSchedule, onNudge }: {
  journeys:         any[]
  managerTasks:     any[]
  upcomingCheckIns: { id: string; date: string; employee: string }[]
  onSchedule:       () => void
  onNudge:          (hire: { name: string; week: number; riskScore: number; email?: string }) => void
}) {
  const { t } = useT()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)

  const actions: DailyAction[] = []

  // 1. Hires with overdue tasks (highest priority)
  for (const j of journeys) {
    if (j.risk_score > 60 && j.status !== 'completed' && actions.filter(a => a.priority === 'urgent').length < 1) {
      const firstName = j.employee?.full_name?.split(' ')[0] ?? 'your hire'
      // Build a human explanation of WHY risk is high
      const reasons: string[] = []
      const fps: any[] = Array.isArray(j.friction_points) ? j.friction_points : []
      const unresolvedFp = fps.filter((fp: any) => fp.status !== 'resolved').length
      if (unresolvedFp > 0) reasons.push(`${unresolvedFp} unresolved blocker${unresolvedFp > 1 ? 's' : ''}`)
      if (j.last_pulse_score != null && j.last_pulse_score <= 2) reasons.push(`low morale (${j.last_pulse_score}/5)`)
      if (j.overdue_tasks_count > 0) reasons.push(`${j.overdue_tasks_count} overdue task${j.overdue_tasks_count > 1 ? 's' : ''}`)
      const reasonText = reasons.length > 0
        ? `Risk ${j.risk_score}/100 — ${reasons.join(', ')}.`
        : `Risk score ${j.risk_score}/100 — week ${j.current_week ?? 1}. Send a check-in message now.`
      const roleplayContext = reasons.length > 0 ? reasons.join(', ') : 'risk'
      actions.push({
        id:           `risk-${j.id}`,
        priority:     'urgent',
        icon:         'fa-solid fa-triangle-exclamation',
        title:        `${firstName} needs attention`,
        desc:         reasonText,
        cta:          'Nudge Now',
        onClick:      () => onNudge({ name: j.employee?.full_name ?? 'Hire', week: j.current_week ?? 1, riskScore: j.risk_score ?? 0, email: j.employee?.email }),
        practiceHref: `/manager/roleplay?hire=${encodeURIComponent(j.employee?.full_name ?? firstName)}&context=${encodeURIComponent(roleplayContext)}`,
      })
    }
  }

  // 2. Check-ins today or tomorrow
  const todayCheckIns = upcomingCheckIns.filter(ci => {
    const d = new Date(ci.date); d.setHours(0,0,0,0)
    return d.getTime() === today.getTime() || d.getTime() === tomorrow.getTime()
  })
  if (todayCheckIns.length > 0) {
    const ci = todayCheckIns[0]
    const isToday = new Date(ci.date).setHours(0,0,0,0) === today.getTime()
    actions.push({
      id:       `checkin-${ci.id}`,
      priority: isToday ? 'urgent' : 'today',
      icon:     'fa-solid fa-calendar-check',
      title:    `Check-in with ${ci.employee} ${isToday ? 'today' : 'tomorrow'}`,
      desc:     `Scheduled: ${new Date(ci.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
      cta:      'Open Agenda',
      onClick:  onSchedule,
    })
  }

  // 3. Hires with no pulse check in 2+ weeks
  const noPulseHires = journeys.filter(j => {
    const lastPulseWeek = (j as any).last_pulse_week
    if (lastPulseWeek == null) return j.current_week && j.current_week >= 2
    return (j.current_week ?? 0) - lastPulseWeek >= 2
  })
  if (noPulseHires.length > 0 && actions.length < 3) {
    const names = noPulseHires.slice(0, 2).map((j: any) => j.employee?.full_name?.split(' ')[0]).filter(Boolean).join(', ')
    actions.push({
      id:       'no-pulse',
      priority: 'watch',
      icon:     'fa-solid fa-heart-pulse',
      title:    `No pulse from ${names}${noPulseHires.length > 2 ? ` +${noPulseHires.length - 2}` : ''}`,
      desc:     `${noPulseHires.length > 1 ? 'These hires have' : 'This hire has'} not submitted a pulse check in 2+ weeks.`,
      cta:      'Schedule Check-in',
      onClick:  onSchedule,
    })
  }

  // 4. Pending manager tasks overdue
  const overdueTasks = managerTasks.filter((t: any) => t.status === 'pending' || t.status === 'in_progress')
  if (overdueTasks.length > 0 && actions.length < 3) {
    actions.push({
      id:       'overdue-tasks',
      priority: 'today',
      icon:     'fa-solid fa-list-check',
      title:    `${overdueTasks.length} task${overdueTasks.length > 1 ? 's' : ''} need your action`,
      desc:     `"${overdueTasks[0].title}"${overdueTasks.length > 1 ? ` +${overdueTasks.length - 1} more` : ''}`,
      cta:      'View Tasks',
      href:     '/manager/tasks',
    })
  }

  // Nothing to do — all clear
  if (actions.length === 0) {
    return (
      <div className="db-card" style={{ borderLeft: '3px solid var(--green)' }}>
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'color-mix(in srgb, var(--green) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="fa-solid fa-circle-check" style={{ fontSize: 15, color: 'var(--green)' }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{t('components.dailyActions.noActions')}</div>
          </div>
        </div>
      </div>
    )
  }

  const PRIORITY_STYLE = {
    urgent: { color: 'var(--red)',   bg: 'color-mix(in srgb, var(--red) 10%, transparent)',   border: 'color-mix(in srgb, var(--red) 25%, transparent)',   label: t('components.dailyActions.urgent') },
    today:  { color: 'var(--amber)', bg: 'color-mix(in srgb, var(--amber) 10%, transparent)', border: 'color-mix(in srgb, var(--amber) 25%, transparent)', label: t('components.dailyActions.today')  },
    watch:  { color: 'var(--blue)',  bg: 'color-mix(in srgb, var(--blue) 10%, transparent)',  border: 'color-mix(in srgb, var(--blue) 25%, transparent)',  label: t('components.dailyActions.watch')  },
  }

  return (
    <div className="db-card" style={{ overflow: 'hidden', borderLeft: '3px solid var(--amber)' }}>
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-bolt-lightning" style={{ color: 'var(--amber)', marginRight: 7 }} aria-hidden="true" />
          Your {actions.length} Action{actions.length > 1 ? 's' : ''} Today
        </h3>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {actions.slice(0, 3).map((action, i) => {
          const ps = PRIORITY_STYLE[action.priority]
          const isLast = i === actions.length - 1 || i === 2
          return (
            <div key={action.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '12px 20px',
              borderBottom: isLast ? 'none' : '1px solid var(--border)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                background: ps.bg, border: `1px solid ${ps.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className={action.icon} style={{ fontSize: 13, color: ps.color }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{action.title}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 100,
                    background: ps.bg, color: ps.color, border: `1px solid ${ps.border}`,
                    textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0,
                  }}>{ps.label}</span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{action.desc}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {action.practiceHref && (
                  <a
                    href={action.practiceHref}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 10, color: 'var(--violet)', border: '1px solid color-mix(in srgb, var(--violet) 30%, transparent)', borderRadius: 'var(--r)', textDecoration: 'none', padding: '4px 10px', whiteSpace: 'nowrap' }}
                    title="Practice this conversation with Aura Roleplay"
                  >
                    <i className="fa-solid fa-masks-theater" style={{ marginRight: 4, fontSize: 9 }} />
                    {t('components.dailyActions.practice')}
                  </a>
                )}
                {action.href ? (
                  <a href={action.href} className="btn btn-sm btn-outline" style={{ fontSize: 11, textDecoration: 'none' }}>
                    {action.cta}
                  </a>
                ) : (
                  <button onClick={action.onClick} className="btn btn-sm" style={{
                    fontSize: 11,
                    background: action.priority === 'urgent' ? 'var(--grad)' : 'var(--surface2)',
                    color: action.priority === 'urgent' ? '#fff' : 'var(--text)',
                    border: action.priority === 'urgent' ? 'none' : '1px solid var(--border)',
                    borderRadius: 'var(--r)',
                  }}>
                    {action.cta}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Manager Briefing Card ───────────────────────────────────────────────────

interface BriefingHire {
  journeyId:   string
  name:        string
  riskScore:   number
  currentWeek: number
  pendingTasks: number
}

function ManagerBriefingCard({ hire }: { hire: BriefingHire }) {
  const { t } = useT()
  const [bullets,  setBullets]  = useState<string[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(false)
  const [savedAt,  setSavedAt]  = useState<string | null>(null)

  async function fetchBrief() {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch('/api/coaching-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:          hire.name,
          riskScore:     hire.riskScore,
          sentimentScore: Math.max(10, 100 - hire.riskScore),
          progress:      Math.min(100, Math.round((hire.currentWeek / 12) * 100)),
          currentWeek:   hire.currentWeek,
          lastPulse:     null,
          frictionPoints: [],
          pendingTasks:  hire.pendingTasks,
          journeyId:     hire.journeyId,
        }),
      })
      const data = await res.json()
      if (data.bullets?.length) {
        setBullets(data.bullets)
        setSavedAt(data.savedAt ?? null)
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBrief() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="db-card" style={{ overflow: 'hidden', borderLeft: '3px solid var(--blue)' }}>
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-brain" style={{ color: 'var(--blue)', marginRight: 7 }} aria-hidden="true" />
          {t('components.managerBriefing.title')} — {hire.name}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="badge-ai">AI</span>
          <button
            onClick={fetchBrief}
            disabled={loading}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 10, color: 'var(--text3)', padding: '2px 7px' }}
            aria-label="Refresh briefing"
          >
            <i className={`fa-solid fa-rotate${loading ? ' fa-spin' : ''}`} style={{ fontSize: 10 }} />
          </button>
        </div>
      </div>
      <div className="db-card-bd">
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[80, 65, 90].map(w => (
              <div key={w} style={{ height: 12, borderRadius: 6, background: 'var(--border)', width: `${w}%`, animation: 'pulse 1.4s ease-in-out infinite' }} />
            ))}
          </div>
        )}
        {!loading && error && (
          <p style={{ fontSize: 12, color: 'var(--text3)' }}>
            Could not load briefing. <button onClick={fetchBrief} style={{ background: 'none', border: 'none', color: 'var(--blue)', cursor: 'pointer', fontSize: 12, padding: 0 }}>Retry</button>
          </p>
        )}
        {!loading && !error && bullets.length > 0 && (
          <>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {bullets.map((b, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <i className="fa-solid fa-circle-dot" style={{ color: 'var(--blue)', fontSize: 9, marginTop: 4, flexShrink: 0 }} aria-hidden="true" />
                  <span style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.55 }}>{b}</span>
                </li>
              ))}
            </ul>
            {savedAt && (
              <p style={{ fontSize: 10, color: 'var(--text3)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                <i className="fa-solid fa-floppy-disk" style={{ fontSize: 9 }} />
                Saved to coaching notes · {new Date(savedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── Nudge Modal ────────────────────────────────────────────────────────────

interface NudgeHire {
  name:     string
  week:     number
  riskScore: number
  email?:   string
}

function NudgeModal({ hire, onClose }: { hire: NudgeHire; onClose: () => void }) {
  const { t } = useT()
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [toast, setToast] = useState('')

  const highRiskTemplates = [
    `Hey ${hire.name}, just wanted to check in — how are you feeling about your progress this week? Happy to jump on a quick call if there's anything I can help with.`,
    `Hi ${hire.name}, I noticed you might have some blockers. Let's sync for 15 minutes this week to work through them together.`,
    `${hire.name}, you're doing great for being in week ${hire.week}! I wanted to share some resources that helped me when I was ramping up. When's a good time to connect?`,
  ]

  const lowRiskTemplates = [
    `Hi ${hire.name}! Quick check-in — how's week ${hire.week} going? Anything I can do to support you?`,
    `Hey ${hire.name}, loving the energy you're bringing! Let's celebrate your progress so far in our next 1:1.`,
    `${hire.name}, you're crushing it in week ${hire.week}. Have you had a chance to connect with the team socially yet? I can make some introductions!`,
  ]

  const templates = hire.riskScore >= 70 ? highRiskTemplates : lowRiskTemplates

  function selectTemplate(idx: number) {
    setSelectedIdx(idx)
    setMessage(templates[idx])
  }

  function showToast(text: string) {
    setToast(text)
    setTimeout(() => setToast(''), 2800)
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(message).then(() => showToast('Copied! Paste into Teams, Slack, or email.'))
  }

  return (
    <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ maxWidth: 520 }}>
        <button className="modal-close" onClick={onClose} aria-label="Close nudge modal">
          <i className="fa-solid fa-xmark" />
        </button>

        <div style={{ marginBottom: 4 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
            {t('components.nudgeModal.title')} {hire.name}
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text3)' }}>
            {t('components.nudgeModal.week')} {hire.week} · {t('components.nudgeModal.risk')} {hire.riskScore}
          </p>
        </div>

        <p style={{ fontSize: 12, color: 'var(--text2)', margin: '14px 0 10px' }}>
          {t('components.nudgeModal.suggestions')}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {templates.map((tpl, idx) => (
            <button
              key={idx}
              onClick={() => selectTemplate(idx)}
              style={{
                background: selectedIdx === idx ? 'var(--cyan-light)' : 'var(--surface2)',
                border: `1px solid ${selectedIdx === idx ? 'var(--cyan)' : 'var(--border)'}`,
                borderRadius: 'var(--r)',
                padding: '12px 14px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 13,
                color: 'var(--text)',
                lineHeight: 1.5,
                transition: 'border-color 0.2s, background 0.2s',
              }}
            >
              {tpl}
            </button>
          ))}
        </div>

        {selectedIdx !== null && (
          <>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r)',
                padding: '10px 12px',
                fontSize: 13,
                color: 'var(--text)',
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: 1.6,
                boxSizing: 'border-box',
                marginBottom: 12,
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={copyToClipboard}>
                  <i className="fa-solid fa-copy" /> {t('common.copy')}
                </button>
                {hire.email && (
                  <a
                    href={`mailto:${hire.email}?subject=${encodeURIComponent(`Checking in — Week ${hire.week}`)}&body=${encodeURIComponent(message)}`}
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1, textDecoration: 'none', textAlign: 'center' }}
                  >
                    <i className="fa-solid fa-envelope" /> Send Email
                  </a>
                )}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text3)', margin: 0, textAlign: 'center' }}>
                Or paste into Teams, Slack, or any messenger
              </p>
            </div>
          </>
        )}

        {toast && (
          <div style={{
            marginTop: 10,
            padding: '8px 12px',
            background: 'var(--cyan-light)',
            border: '1px solid var(--cyan)',
            borderRadius: 'var(--r)',
            fontSize: 12,
            color: 'var(--text)',
          }}>
            <i className="fa-solid fa-circle-check" style={{ color: 'var(--cyan)', marginRight: 6 }} />
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── 1:1 Agenda Templates Card ───────────────────────────────────────────────

interface AgendaTemplate {
  label: string
  items: string[]
  amber?: boolean
}

const AGENDA_TEMPLATES: AgendaTemplate[] = [
  {
    label: 'Week 1-2 Check-in',
    items: [
      '✅ How are you settling in?',
      '✅ Any blockers with tools or access?',
      '✅ How is the team dynamic feeling?',
      '✅ What\'s one thing going really well?',
      '✅ What would make next week even better?',
      '📝 Action items: ___________',
    ],
  },
  {
    label: '30-Day Review',
    items: [
      '✅ Review week 1-4 accomplishments',
      '✅ Technical ramp-up assessment (1-10)',
      '✅ Culture integration check (comfortable? included?)',
      '✅ Discuss updated 60-day goals',
      '✅ Address any concerns openly',
      '✅ Celebrate quick wins!',
      '📝 Action items: ___________',
    ],
  },
  {
    label: 'Friction Intervention',
    amber: true,
    items: [
      '⚠️ Open with empathy: "I want to make sure you have what you need"',
      '✅ Identify specific blockers (technical / social / role clarity)',
      '✅ Agree on 1-2 concrete next steps',
      '✅ Set a follow-up in 3-5 days',
      '✅ Document the support plan',
      '📝 Action items: ___________',
    ],
  },
]

const MILESTONE_META: Record<string, { label: string; color: string; icon: string }> = {
  day_30: { label: '30-Day', color: 'var(--cyan)',   icon: 'fa-solid fa-seedling'   },
  day_60: { label: '60-Day', color: 'var(--blue)',   icon: 'fa-solid fa-chart-line' },
  day_90: { label: '90-Day', color: 'var(--violet)', icon: 'fa-solid fa-rocket'     },
}
const STATUS_COLOR: Record<string, string> = {
  not_started: 'var(--text3)',
  in_progress: 'var(--amber)',
  completed:   'var(--green)',
}
const STATUS_ICON: Record<string, string> = {
  not_started: 'fa-solid fa-circle',
  in_progress: 'fa-solid fa-circle-half-stroke',
  completed:   'fa-solid fa-circle-check',
}

function HireGoalsReview({ goals, journeys }: { goals: HireGoal[]; journeys: any[] }) {
  const newGoals = goals.filter(g => g.status === 'not_started')

  // Group goals by journey so manager knows whose goal it is
  const byJourney: Record<string, { hireName: string; goals: HireGoal[] }> = {}
  for (const g of goals) {
    if (!byJourney[g.journey_id]) {
      const j = journeys.find((j: any) => j.id === g.journey_id)
      byJourney[g.journey_id] = {
        hireName: j?.employee?.full_name ?? 'Your hire',
        goals: [],
      }
    }
    byJourney[g.journey_id].goals.push(g)
  }

  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-bullseye-arrow" style={{ color: 'var(--violet)' }} />
          Hire Goals
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {newGoals.length > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 800, padding: '2px 8px',
              borderRadius: 100, background: 'var(--amber-bg)', color: 'var(--amber)',
              border: '1px solid rgba(245,158,11,0.3)',
            }}>
              {newGoals.length} new
            </span>
          )}
          <span className="badge-ai">Co-created</span>
        </div>
      </div>
      <div className="db-card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {Object.entries(byJourney).map(([jid, { hireName, goals: jGoals }]) => (
          <div key={jid}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', marginBottom: 7, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="fa-solid fa-user-tie" style={{ fontSize: 10 }} />
              {hireName}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {jGoals.map(g => {
                const ms = MILESTONE_META[g.milestone] ?? MILESTONE_META['day_30']
                return (
                  <div key={g.id} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 10px', borderRadius: 'var(--r)',
                    background: 'var(--surface2)', border: '1px solid var(--border)',
                  }}>
                    <i className={STATUS_ICON[g.status]} style={{ fontSize: 13, color: STATUS_COLOR[g.status], flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: g.status === 'completed' ? 'var(--text3)' : 'var(--text)', textDecoration: g.status === 'completed' ? 'line-through' : 'none' }}>
                      {g.title}
                    </span>
                    <span style={{
                      fontSize: 9, fontWeight: 800, padding: '2px 7px',
                      borderRadius: 100, border: `1px solid color-mix(in srgb, ${ms.color} 30%, transparent)`,
                      color: ms.color, background: `color-mix(in srgb, ${ms.color} 10%, transparent)`,
                      flexShrink: 0,
                    }}>
                      {ms.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
          <i className="fa-solid fa-circle-info" style={{ marginRight: 5 }} />
          Revisit these goals at each milestone check-in.
        </p>
      </div>
    </div>
  )
}

function AgendaTemplatesCard() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  function toggle(idx: number) {
    setOpenIdx(prev => (prev === idx ? null : idx))
  }

  function copyAgenda(items: string[], idx: number) {
    navigator.clipboard.writeText(items.join('\n')).then(() => {
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 2000)
    })
  }

  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-clipboard-list" style={{ color: 'var(--blue)' }} aria-hidden="true" />{' '}
          1:1 Agenda Templates
        </h3>
      </div>
      <div className="db-card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {AGENDA_TEMPLATES.map((tpl, idx) => {
          const isOpen = openIdx === idx
          const borderColor = tpl.amber ? 'var(--amber)' : 'var(--border)'
          const btnColor = tpl.amber ? 'var(--amber)' : 'var(--text2)'

          return (
            <div key={idx} style={{ marginBottom: idx < AGENDA_TEMPLATES.length - 1 ? 8 : 0 }}>
              <button
                onClick={() => toggle(idx)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  background: 'transparent',
                  border: `1px solid ${borderColor}`,
                  borderRadius: isOpen ? 'var(--r) var(--r) 0 0' : 'var(--r)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  fontWeight: 600,
                  color: btnColor,
                  transition: 'border-radius 0.15s',
                }}
                aria-expanded={isOpen}
              >
                <span>
                  {tpl.amber && (
                    <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6, fontSize: 11 }} />
                  )}
                  {tpl.label}
                </span>
                <i
                  className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'}`}
                  style={{ fontSize: 10, opacity: 0.6 }}
                />
              </button>

              {isOpen && (
                <div
                  style={{
                    padding: '10px 12px',
                    background: 'var(--surface2)',
                    border: `1px solid ${borderColor}`,
                    borderTop: 'none',
                    borderRadius: '0 0 var(--r) var(--r)',
                  }}
                >
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {tpl.items.map((item, i) => (
                      <li key={i} style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ marginTop: 10, fontSize: 11 }}
                    onClick={() => copyAgenda(tpl.items, idx)}
                  >
                    <i className={`fa-solid fa-${copiedIdx === idx ? 'check' : 'copy'}`} />
                    {copiedIdx === idx ? ' Copied!' : ' Copy agenda'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Dashboard Client ───────────────────────────────────────────────────

export default function ManagerDashboardClient({
  user,
  journeys,
  activeJourney,
  upcomingCheckIns,
  managerTasks = [],
  frictionPoints,
  overallProgress,
  atRiskCount,
  avgFeedbackRating,
  hireGoals = [],
  effectiveness,
}: ManagerDashboardClientProps) {
  const { t } = useT()
  const [selectedPoint, setSelectedPoint]       = useState<FrictionPoint | null>(null)
  const [showCheckIn, setShowCheckIn]           = useState(false)
  const [showNudge, setShowNudge]               = useState(false)
  const [interventionDismissed, setInterventionDismissed] = useState(false)
  const [rowNudgeHire, setRowNudgeHire]         = useState<NudgeHire | null>(null)

  useEffect(() => {
    function onOpenNudge() { setShowNudge(true) }
    window.addEventListener('open-nudge-modal', onOpenNudge)
    return () => window.removeEventListener('open-nudge-modal', onOpenNudge)
  }, [])

  // Derive engagement signals from journeys for CulturalResonance
  const totalHires        = journeys.length
  const completedTasks    = managerTasks.filter((t: any) => t.status === 'completed').length
  const totalTasks        = managerTasks.length
  const taskCompletionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
  const checkInsCompleted = journeys.reduce((n: number, j: any) => n + (j.check_ins_completed ?? 0), 0)
  const totalCheckIns     = Math.max(checkInsCompleted, journeys.length * 2)

  const primaryAtRiskHire = journeys.find(
    (j: any) => j.risk_score > 60 && j.status !== 'completed'
  )

  const nudgeHire: NudgeHire | null = primaryAtRiskHire
    ? {
        name:      primaryAtRiskHire.employee?.full_name ?? 'Unknown',
        week:      primaryAtRiskHire.current_week ?? 1,
        riskScore: primaryAtRiskHire.risk_score ?? 0,
        email:     primaryAtRiskHire.employee?.email,
      }
    : null

  const interventionMessage = nudgeHire
    ? `Hi ${nudgeHire.name}, I've been reviewing our onboarding progress and wanted to reach out personally. I noticed you might have some blockers this week. Let's find 15 minutes to connect — I want to make sure you have everything you need to succeed. When works for you?`
    : ''

  // ── Empty state — no hires assigned yet ──────────────────────────────────
  if (journeys.length === 0) {
    return (
      <>
        <div className="db-header">
          <div className="db-header-left">
            <h1>{t('manager.dashboard.title')}</h1>
            <p>Your team is ready — waiting for your first hire.</p>
          </div>
        </div>
        <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)', alignItems: 'center', paddingTop: 40 }}>
          {/* Hero empty card */}
          <div style={{
            maxWidth: 560, width: '100%',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-xl)', padding: '48px 40px',
            textAlign: 'center', boxShadow: 'var(--card-shadow)', position: 'relative', overflow: 'hidden',
          }}>
            <div aria-hidden="true" style={{
              position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
              width: 320, height: 320, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(26,108,246,0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%', background: 'var(--grad)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
              }}>
                <i className="fa-solid fa-user-group" style={{ fontSize: 22, color: '#fff' }} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 10 }}>
                No hires assigned yet
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text3)', lineHeight: 1.65, marginBottom: 28, maxWidth: 380, margin: '0 auto 28px' }}>
                Once HR assigns a new hire to you, their onboarding journey will appear here. You&apos;ll get real-time risk signals, task queues, and coaching recommendations.
              </p>
              <a href="mailto:hr@company.com?subject=New hire assignment request&body=Hi, I'd like to request a new hire assignment in OnboardHero."
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'var(--grad)', color: '#fff',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
                  padding: '12px 28px', borderRadius: 'var(--r)', textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(26,108,246,0.25)',
                }}>
                <i className="fa-solid fa-envelope" />
                Request hire assignment from HR
              </a>
            </div>
          </div>

          {/* Preview cards — what you'll see */}
          <div style={{ maxWidth: 560, width: '100%' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, textAlign: 'center' }}>
              When hires are assigned, you'll get access to:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { icon: 'fa-solid fa-triangle-exclamation', color: 'var(--red)',   title: 'Risk Alerts',       desc: 'Daily AI-powered risk scoring per hire' },
                { icon: 'fa-solid fa-calendar-check',       color: 'var(--blue)',  title: 'Check-in Queue',    desc: 'Scheduled 7, 14, 30, 60, 90-day reviews' },
                { icon: 'fa-solid fa-heart-pulse',          color: 'var(--cyan)',  title: 'Sentiment Pulse',   desc: 'Weekly morale scores from each hire' },
                { icon: 'fa-solid fa-route',                color: 'var(--green)', title: 'Journey Timeline',  desc: 'Friction map with AI interventions' },
              ].map(({ icon, color, title, desc }) => (
                <div key={title} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--r)', padding: '16px',
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className={icon} style={{ fontSize: 13, color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.4 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <OnboardingTour />
      </>
    )
  }

  return (
    <>
      <div className="db-header">
        <div className="db-header-left">
          <h1>{t('manager.dashboard.title')}</h1>
          <p>{t('manager.dashboard.subtitle')}</p>
        </div>
        <div className="db-header-actions">
          <button className="btn btn-primary btn-sm btn-glow" onClick={() => setShowCheckIn(true)} aria-label="Schedule a check-in with a new hire">
            <i className="fa-solid fa-calendar-day" aria-hidden="true" /> {t('manager.dashboard.scheduleCheckIn')}
          </button>
        </div>
      </div>

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        <ProactiveAura
          role="manager"
          atRiskCount={atRiskCount}
          pendingTasks={upcomingCheckIns.length}
          employeeName={primaryAtRiskHire?.employee?.full_name}
          pendingTaskTitles={managerTasks.filter((t: any) => t.status !== 'completed').map((t: any) => t.title).filter(Boolean)}
          onSchedule={() => setShowCheckIn(true)}
        />

        {/* Daily action queue — top 3 things to do today */}
        <DailyActionCard
          journeys={journeys}
          managerTasks={managerTasks}
          upcomingCheckIns={upcomingCheckIns}
          onSchedule={() => setShowCheckIn(true)}
          onNudge={hire => setRowNudgeHire(hire)}
        />

        {/* Row 1 — 4 KPIs */}
        <div className="db-grid-kpi4">
          <KPICard value={journeys.length}         label={t('manager.dashboard.kpis.activeHires')}      colorClass="cyan"  icon="fa-solid fa-user-group" />
          <KPICard value={upcomingCheckIns.length}  label={t('manager.dashboard.kpis.pendingCheckIns')} colorClass="blue"  icon="fa-solid fa-calendar-check" />
          <KPICard value={atRiskCount}              label={t('manager.dashboard.kpis.atRisk')}           colorClass="red"   icon="fa-solid fa-triangle-exclamation" />
          <KPICard value={avgFeedbackRating != null ? `${avgFeedbackRating}/5` : '—'} label={t('manager.dashboard.kpis.teamFeedback')} colorClass="green" icon="fa-solid fa-face-smile" />
        </div>

        {/* Row 2 — Main 2/3 + Side 1/3 */}
        <div className="db-grid-2-1">

          {/* ── Main column ──────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)', minWidth: 0 }}>

            {/* 0. Manager Briefing — auto-loaded AI context for highest-risk hire */}
            {primaryAtRiskHire && (
              <ManagerBriefingCard hire={{
                journeyId:    primaryAtRiskHire.id,
                name:         primaryAtRiskHire.employee?.full_name ?? 'Your hire',
                riskScore:    primaryAtRiskHire.risk_score ?? 0,
                currentWeek:  primaryAtRiskHire.current_week ?? 1,
                pendingTasks: managerTasks.filter((t: any) => t.status !== 'completed' && t.journey_id === primaryAtRiskHire.id).length,
              }} />
            )}

            {/* 1. AI Intervention — highest priority, shown only when needed */}
            {nudgeHire && !interventionDismissed && (
              <InterventionApproval
                hireName={nudgeHire.name}
                riskScore={nudgeHire.riskScore}
                journeyId={primaryAtRiskHire?.id}
                riskReasons={
                  primaryAtRiskHire?.risk_reasons
                    ? (() => { try { const p = JSON.parse(primaryAtRiskHire.risk_reasons); return p.points?.map((pt: any) => pt.label ?? pt) ?? ['Review needed'] } catch { return ['Review needed'] } })()
                    : ['Low task completion', 'Reduced check-in attendance']
                }
                suggestedMessage={interventionMessage}
                onApprove={async (msg) => {
                  await fetch('/api/nudge', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      journeyId:  primaryAtRiskHire?.id,
                      employeeId: primaryAtRiskHire?.employee?.id,
                      reason:     msg,
                    }),
                  })
                }}
                onDismiss={() => setInterventionDismissed(true)}
              />
            )}

            {/* 2. Team — sorted by risk score, at-risk first with visual separator */}
            <div className="db-card">
              <div className="db-card-hd">
                <h3>
                  <i className="fa-solid fa-users" style={{ color: 'var(--blue)' }} aria-hidden="true" />{' '}
                  {t('manager.dashboard.teamIntegrationStatus')}
                </h3>
                <span className="badge-ai">{t('manager.dashboard.livePulse')}</span>
              </div>
              <div className="db-card-bd">
                {journeys.length === 0 ? (
                  <p style={{ color: 'var(--text3)', textAlign: 'center', padding: '20px 0' }}>
                    {t('manager.dashboard.noHiresYet')}
                  </p>
                ) : (() => {
                  const sorted   = [...journeys].sort((a: any, b: any) => (b.risk_score ?? 0) - (a.risk_score ?? 0))
                  const atRiskList  = sorted.filter((j: any) => (j.risk_score ?? 0) > 60)
                  const healthyList = sorted.filter((j: any) => (j.risk_score ?? 0) <= 60)

                  const renderRow = (j: any) => (
                    <div key={j.id}>
                      <TeamCard journey={j} />
                      <div style={{ display: 'flex', gap: 6, padding: '6px 0 10px', borderBottom: '1px solid var(--border)' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setShowCheckIn(true)} style={{ fontSize: 11 }} aria-label={`Schedule check-in with ${j.employee?.full_name}`}>
                          <i className="fa-solid fa-calendar-plus" aria-hidden="true" /> Schedule
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setRowNudgeHire({ name: j.employee?.full_name ?? 'Hire', week: j.current_week ?? 1, riskScore: j.risk_score ?? 0, email: j.employee?.email })} style={{ fontSize: 11 }} aria-label={`Send nudge to ${j.employee?.full_name}`}>
                          <i className="fa-solid fa-bolt" aria-hidden="true" /> Nudge
                        </button>
                        <a href={`/manager/coaching?focus=${j.id}`} className="btn btn-ghost btn-sm" style={{ fontSize: 11, textDecoration: 'none' }} aria-label={`Open coaching hub for ${j.employee?.full_name}`}>
                          <i className="fa-solid fa-user-tie" aria-hidden="true" /> Coach
                        </a>
                        <a href={`/manager/team/${j.id}`} className="btn btn-ghost btn-sm" style={{ fontSize: 11, textDecoration: 'none', marginLeft: 'auto' }} aria-label={`View journey for ${j.employee?.full_name}`}>
                          <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" /> View
                        </a>
                      </div>
                    </div>
                  )

                  return (
                    <>
                      {atRiskList.length > 0 && (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0 8px', marginBottom: 4 }}>
                            <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: 11, color: 'var(--red)' }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Needs Attention ({atRiskList.length})
                            </span>
                          </div>
                          {atRiskList.map(renderRow)}
                        </>
                      )}
                      {healthyList.length > 0 && (
                        <>
                          {atRiskList.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0 8px', marginTop: 4 }}>
                              <i className="fa-solid fa-circle-check" style={{ fontSize: 11, color: 'var(--green)' }} />
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                On Track ({healthyList.length})
                              </span>
                            </div>
                          )}
                          {healthyList.map(renderRow)}
                        </>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>

            {/* 3. Your action items */}
            <ManagerPendingTasks tasks={managerTasks} />

            {/* 4. Friction analysis — analytical, below fold */}
            {activeJourney && frictionPoints.length > 0 && (
              <FrictionMap
                points={frictionPoints}
                startDate={activeJourney.start_date}
                journeyId={activeJourney.id}
                managerName={user?.user_metadata?.full_name ?? user?.email ?? 'Your Manager'}
              />
            )}

            {/* 5. AI recommendations */}
            <AIRecommendations
              journeyId={activeJourney?.id ?? 'demo'}
              employeeName={nudgeHire?.name ?? 'Your Hire'}
              frictionPoints={frictionPoints}
            />

            {/* 6. Coaching tools — least urgent */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <CoachingHub journeys={journeys} />
            </div>
          </div>

          {/* ── Sidebar column ───────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)', minWidth: 0 }}>

            {/* 1. Upcoming check-ins — most actionable item in sidebar */}
            <MilestonesList milestones={upcomingCheckIns} />

            {/* 2. Team sentiment — live data */}
            <TeamSentiment journeys={journeys} />

            {/* 3. Cultural engagement — derived from real signals */}
            <CulturalResonance
              taskCompletionPct={taskCompletionPct}
              atRiskCount={atRiskCount}
              totalHires={totalHires}
              avgFeedbackRating={avgFeedbackRating}
              checkInsCompleted={checkInsCompleted}
              totalCheckIns={totalCheckIns}
            />

            {/* 4. Manager Effectiveness Score */}
            {effectiveness && (
              <div className="db-card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <i className="fa-solid fa-star-half-stroke" style={{ color: 'var(--blue)' }} />
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>Your Effectiveness</h3>
                  </div>
                  <span className="badge-ai">Self-Score</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Team Health */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>Team health score</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: effectiveness.teamHealthScore !== null
                        ? (effectiveness.teamHealthScore >= 70 ? 'var(--green)' : effectiveness.teamHealthScore >= 45 ? 'var(--amber)' : 'var(--red)')
                        : 'var(--text3)' }}>
                        {effectiveness.teamHealthScore !== null ? `${effectiveness.teamHealthScore}%` : '—'}
                      </span>
                    </div>
                    {effectiveness.teamHealthScore !== null && (
                      <div style={{ height: 4, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${effectiveness.teamHealthScore}%`, borderRadius: 100, transition: 'width 0.5s',
                          background: effectiveness.teamHealthScore >= 70 ? 'var(--green)' : effectiveness.teamHealthScore >= 45 ? 'var(--amber)' : 'var(--red)' }} />
                      </div>
                    )}
                  </div>

                  {/* Check-in completion */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>Check-in completion</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: effectiveness.checkInCompletionRate !== null
                        ? (effectiveness.checkInCompletionRate >= 80 ? 'var(--green)' : effectiveness.checkInCompletionRate >= 50 ? 'var(--amber)' : 'var(--red)')
                        : 'var(--text3)' }}>
                        {effectiveness.checkInCompletionRate !== null
                          ? `${effectiveness.completedCheckIns}/${effectiveness.totalCheckIns}`
                          : '—'}
                      </span>
                    </div>
                    {effectiveness.checkInCompletionRate !== null && (
                      <div style={{ height: 4, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${effectiveness.checkInCompletionRate}%`, borderRadius: 100, transition: 'width 0.5s',
                          background: effectiveness.checkInCompletionRate >= 80 ? 'var(--green)' : effectiveness.checkInCompletionRate >= 50 ? 'var(--amber)' : 'var(--red)' }} />
                      </div>
                    )}
                  </div>

                  {/* At-risk response */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)' }}>At-risk response rate</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: effectiveness.atRiskResponseRate !== null
                        ? (effectiveness.atRiskResponseRate >= 80 ? 'var(--green)' : effectiveness.atRiskResponseRate >= 50 ? 'var(--amber)' : 'var(--red)')
                        : 'var(--text3)' }}>
                        {effectiveness.atRiskResponseRate !== null ? `${effectiveness.atRiskResponseRate}%` : 'No at-risk hires'}
                      </span>
                    </div>
                    {effectiveness.atRiskResponseRate !== null && (
                      <div style={{ height: 4, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${effectiveness.atRiskResponseRate}%`, borderRadius: 100, transition: 'width 0.5s',
                          background: effectiveness.atRiskResponseRate >= 80 ? 'var(--green)' : effectiveness.atRiskResponseRate >= 50 ? 'var(--amber)' : 'var(--red)' }} />
                      </div>
                    )}
                  </div>
                </div>

                {effectiveness.totalCheckIns === 0 && (
                  <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 14, textAlign: 'center' }}>
                    Schedule check-ins with your hires to start tracking your effectiveness.
                  </p>
                )}
              </div>
            )}

            {/* 3. Progress overview */}
            <div className="db-card">
              <div className="db-card-hd">
                <h3>
                  <i className="fa-solid fa-chart-line" style={{ color: 'var(--blue)' }} aria-hidden="true" />{' '}
                  {t('manager.dashboard.onboardingProgress')}
                </h3>
                <span className="badge-ai">{t('manager.dashboard.predictive')}</span>
              </div>
              <div className="db-card-bd" style={{ display: 'flex', justifyContent: 'center', padding: '24px 20px' }}>
                <ProgressRing percentage={overallProgress} label={t('manager.dashboard.averageVitality')} />
              </div>
            </div>

            {/* 4. Hire goals review */}
            {hireGoals.length > 0 && (
              <HireGoalsReview goals={hireGoals} journeys={journeys} />
            )}

            {/* 5. Velocity + Agenda prep */}
            <VelocityScore journeys={journeys} />
            <AgendaTemplatesCard />

            {/* 5. Notes */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <ManagerNotes journeyId={activeJourney?.id} />
            </div>
          </div>
        </div>

      </div>

      {selectedPoint && (
        <InterventionBrief point={selectedPoint} onClose={() => setSelectedPoint(null)} />
      )}

      <AnimatePresence>
        {showCheckIn && (
          <ScheduleCheckInModal
            onClose={() => setShowCheckIn(false)}
            hirees={journeys
              .filter((j: any) => j.employee?.full_name)
              .map((j: any): CheckInHiree => ({
                journeyId: j.id,
                name: j.employee.full_name,
                role: j.employee.department ?? 'Team Member',
              }))}
          />
        )}
      </AnimatePresence>

      {showNudge && nudgeHire && (
        <NudgeModal hire={nudgeHire} onClose={() => setShowNudge(false)} />
      )}

      {rowNudgeHire && (
        <NudgeModal hire={rowNudgeHire} onClose={() => setRowNudgeHire(null)} />
      )}

      <OnboardingTour />
    </>
  )
}
