'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { logHRInboxAction } from './actions'
import GlobalFrictionMap, { type DeptNode } from '@/components/platform/GlobalFrictionMap'
import TalentVelocity, { type DeptStat } from '@/components/platform/TalentVelocity'
import EmployeeTable from '@/components/platform/EmployeeTable'
import ActiveAlerts from '@/components/platform/ActiveAlerts'
import StageChecklist from '@/components/platform/StageChecklist'
import JourneyTemplate from '@/components/platform/JourneyTemplate'
import { CompletionRateCard, EngagementScoreCard } from '@/components/platform/AnalyticsSection'
import InviteUserModal from '@/components/platform/InviteUserModal'
import ProactiveAura from '@/components/platform/ProactiveAura'
import OnboardingTour from '@/components/platform/OnboardingTour'
import { AnimatePresence } from 'framer-motion'
import { useT } from '@/lib/i18n/context'

interface ActiveAlert {
  id: string
  type: 'warning' | 'info'
  title: string
  description: string
  action?: { label: string; href?: string; onClick?: string }
}

interface InboxItem {
  id:         string
  priority:   'high' | 'medium' | 'info'
  icon:       string
  title:      string
  desc:       string
  href?:      string
  hireName?:  string
  riskScore?: number
  week?:      number
  journeyId?: string
}

interface InterventionWin {
  hireName:  string
  before:    number
  after:     number
  daysAgo:   number
}

interface HRDashboardClientProps {
  journeys: any[]
  kpis: {
    totalWorkforce:     number
    newHires:           number
    activeJourneys:     number
    completedJourneys:  number
    atRisk:             number
    taskCompletionPct:  number
    taskDelta?:         number
    atRiskDelta?:       number
  }
  engagementData:  { label: string; value: number }[]
  completionData:  { label: string; value: number }[]
  stages:          { label: string; count: number }[]
  deptNodes?:      DeptNode[]
  managers?:       { id: string; full_name: string }[]
  templates?:      { id: string; name: string }[]
  employees?:      import('@/components/platform/EmployeeTable').Employee[]
  alerts?:         ActiveAlert[]
  avgSentiment?:   number
  retentionRisk?:  number
  deptStats?:      DeptStat[]
  avgTTP?:         number | null
  ttpDelta?:       number | null
  inboxItems?:        InboxItem[]
  interventionWins?:  InterventionWin[]
}


// ── Manager Effectiveness ──────────────────────────────────────────────────

function computeManagerStats(journeys: any[]) {
  const map = new Map<string, { name: string; hires: number; atRisk: number; avgRisk: number; avgProgress: number }>()

  for (const j of journeys) {
    const mgr = j.manager ?? { id: 'unknown', full_name: 'Unassigned' }
    const id = mgr.id ?? 'unknown'
    if (!map.has(id)) {
      map.set(id, { name: mgr.full_name ?? 'Unassigned', hires: 0, atRisk: 0, avgRisk: 0, avgProgress: 0 })
    }
    const s = map.get(id)!
    s.hires++
    if (j.risk_score > 60) s.atRisk++
    s.avgRisk += j.risk_score ?? 0
    const tpl = Array.isArray(j.template) ? j.template[0] : j.template
    const dw  = tpl?.duration_days ? Math.round(tpl.duration_days / 7) : 12
    s.avgProgress += j.current_week ? Math.round((j.current_week / dw) * 100) : 0
  }

  return Array.from(map.entries()).map(([id, s]) => ({
    id,
    name: s.name,
    hires: s.hires,
    atRisk: s.atRisk,
    avgRisk: Math.round(s.avgRisk / s.hires),
    avgProgress: Math.round(s.avgProgress / s.hires),
    // Effectiveness score: 100 - (atRiskRate * 50) - (avgRisk * 0.5)
    score: Math.max(0, Math.min(100, Math.round(100 - (s.atRisk / s.hires * 50) - (s.avgRisk / s.hires * 0.5)))),
  })).sort((a, b) => b.score - a.score)
}

type ManagerStat = ReturnType<typeof computeManagerStats>[number]

function ManagerEffectivenessCard({ journeys }: { journeys: any[] }) {
  const { t } = useT()
  const stats: ManagerStat[] = computeManagerStats(journeys)
  const uniqueManagers = stats.filter(s => s.id !== 'unknown').length
  const showComparison = uniqueManagers > 1

  return (
    <div className="db-card">
      <div className="db-card-header">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
          <i className="fa-solid fa-shield-halved" style={{ color: 'var(--blue)' }} aria-hidden="true" />
          {t('components.managerEffectiveness.title')}
        </h3>
        <span className="badge-ai">{t('components.managerEffectiveness.aiScored')}</span>
      </div>

      <div className="db-card-body">
        {journeys.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '16px 0' }}>
            {t('components.managerEffectiveness.noJourneys')}
          </p>
        ) : !showComparison ? (
          <p style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '16px 0' }}>
            {t('components.managerEffectiveness.noManagers')}
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {stats.map((mgr) => (
                <div key={mgr.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text1)', flex: 1, minWidth: 0 }}>
                      {mgr.name}
                    </span>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: 99,
                      background: 'var(--surface2)',
                      color: 'var(--text2)',
                      whiteSpace: 'nowrap',
                    }}>
                      {mgr.hires} {t('components.managerEffectiveness.hires')}
                    </span>
                    {mgr.atRisk > 0 && (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '2px 7px',
                        borderRadius: 99,
                        background: 'color-mix(in srgb, var(--red) 12%, transparent)',
                        color: 'var(--red)',
                        whiteSpace: 'nowrap',
                      }}>
                        {mgr.atRisk} {t('components.managerEffectiveness.atRisk')}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${mgr.score}%`,
                        borderRadius: 3,
                        background: mgr.score >= 80 ? 'var(--green)' : mgr.score >= 60 ? 'var(--amber)' : 'var(--red)',
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                    <span style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: mgr.score >= 80 ? 'var(--green)' : mgr.score >= 60 ? 'var(--amber)' : 'var(--red)',
                      minWidth: 28,
                      textAlign: 'right',
                    }}>
                      {mgr.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 12 }}>
              Score = 100 − (at-risk rate × 50) − (avg risk score × 0.5). Higher is better.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// ── ROI Dashboard ─────────────────────────────────────────────────────────

const INDUSTRY_REPLACEMENT_COST = 22000   // USD — avg cost to replace an early-exit hire
const INDUSTRY_CHURN_RATE = 0.30           // 30% early attrition without structured onboarding

function ROIDashboard({ journeys, kpis }: {
  journeys: any[]
  kpis: HRDashboardClientProps['kpis']
}) {
  const { t } = useT()
  const total      = kpis.totalWorkforce || journeys.length
  const completed  = kpis.completedJourneys
  const active     = kpis.activeJourneys
  const atRisk     = kpis.atRisk

  // Estimate retained = (completed + active − atRisk) vs industry baseline
  const platformRetained = Math.max(0, completed + active - atRisk)
  const industryWouldChurn = Math.round(total * INDUSTRY_CHURN_RATE)
  const prevented  = Math.max(0, industryWouldChurn - atRisk)
  const costAvoided = prevented * INDUSTRY_REPLACEMENT_COST

  // Retention rate on the platform
  const retentionRate = total > 0 ? Math.round((platformRetained / total) * 100) : 0
  const industryRate  = Math.round((1 - INDUSTRY_CHURN_RATE) * 100)

  // Avg pulse score across all journeys
  const pulsedJourneys = journeys.filter(j => j.last_pulse_score != null)
  const avgPulse = pulsedJourneys.length > 0
    ? Math.round(pulsedJourneys.reduce((s, j) => s + (j.last_pulse_score ?? 0), 0) / pulsedJourneys.length * 10) / 10
    : null

  const metrics = [
    {
      label: t('components.roiDashboard.costAvoided'),
      value: `$${costAvoided >= 1000 ? `${(costAvoided / 1000).toFixed(0)}k` : costAvoided}`,
      sub: `${prevented} ${t('components.roiDashboard.costAvoidedDesc')}`,
      icon: 'fa-solid fa-sack-dollar',
      color: 'var(--green)',
      bg: 'color-mix(in srgb, var(--green) 10%, transparent)',
    },
    {
      label: t('components.roiDashboard.retentionRate'),
      value: `${retentionRate}%`,
      sub: `${retentionRate - industryRate > 0 ? `+${retentionRate - industryRate}pp` : `${retentionRate - industryRate}pp`} ${t('components.roiDashboard.retentionRateDesc')}`,
      icon: 'fa-solid fa-shield-check',
      color: retentionRate >= industryRate ? 'var(--blue)' : 'var(--amber)',
      bg: 'color-mix(in srgb, var(--blue) 10%, transparent)',
    },
    {
      label: t('components.roiDashboard.avgMorale'),
      value: avgPulse != null ? `${avgPulse}/5` : '—',
      sub: avgPulse != null ? t('components.roiDashboard.avgMoraleDesc') : '—',
      icon: 'fa-solid fa-face-smile',
      color: avgPulse != null ? (avgPulse >= 4 ? 'var(--green)' : avgPulse >= 3 ? 'var(--amber)' : 'var(--red)') : 'var(--text3)',
      bg: 'color-mix(in srgb, var(--cyan) 10%, transparent)',
    },
    {
      label: t('components.roiDashboard.onTrack'),
      value: `${Math.max(0, active - atRisk)}`,
      sub: t('components.roiDashboard.onTrackDesc'),
      icon: 'fa-solid fa-chart-line',
      color: 'var(--cyan)',
      bg: 'color-mix(in srgb, var(--cyan) 10%, transparent)',
    },
  ]

  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-trophy" style={{ color: 'var(--amber)', marginRight: 7 }} aria-hidden="true" />
          {t('components.roiDashboard.title')}
        </h3>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          vs. ${Math.round(INDUSTRY_REPLACEMENT_COST / 1000)}k industry replacement cost
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, background: 'var(--border)' }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ background: 'var(--bg)', padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className={m.icon} style={{ fontSize: 12, color: m.color }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{m.label}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: m.color, marginBottom: 3 }}>
              {m.value}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', lineHeight: 1.4 }}>{m.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: '10px 20px', background: 'var(--surface2)', borderTop: '1px solid var(--border)' }}>
        <span style={{ fontSize: 10, color: 'var(--text3)' }}>
          <i className="fa-solid fa-circle-info" style={{ marginRight: 5 }} />
          Estimates based on ${(INDUSTRY_REPLACEMENT_COST / 1000).toFixed(0)}k avg replacement cost and {Math.round(INDUSTRY_CHURN_RATE * 100)}% industry early-exit rate without structured onboarding.
        </span>
      </div>
    </div>
  )
}

// ── Template Performance Analytics ────────────────────────────────────────

function TemplatePerformance({ journeys }: { journeys: any[] }) {
  const { t } = useT()
  const templateMap = new Map<string, { name: string; count: number; totalCompletion: number; totalRisk: number; totalPulse: number; pulseCount: number }>()

  for (const j of journeys) {
    const tpl = Array.isArray(j.template) ? j.template[0] : j.template
    if (!tpl?.id) continue
    if (!templateMap.has(tpl.id)) templateMap.set(tpl.id, { name: tpl.name ?? 'Unnamed', count: 0, totalCompletion: 0, totalRisk: 0, totalPulse: 0, pulseCount: 0 })
    const s = templateMap.get(tpl.id)!
    s.count++
    const jTasks = j.tasks ?? []
    if (jTasks.length > 0) s.totalCompletion += Math.round((jTasks.filter((t: any) => t.status === 'completed').length / jTasks.length) * 100)
    s.totalRisk += j.risk_score ?? 0
    if (j.last_pulse_score != null) { s.totalPulse += j.last_pulse_score; s.pulseCount++ }
  }

  const rows = Array.from(templateMap.entries())
    .map(([id, s]) => ({
      id,
      name:       s.name,
      count:      s.count,
      avgCompletion: s.count > 0 ? Math.round(s.totalCompletion / s.count) : 0,
      avgRisk:    s.count > 0 ? Math.round(s.totalRisk / s.count) : 0,
      avgPulse:   s.pulseCount > 0 ? Math.round((s.totalPulse / s.pulseCount) * 10) / 10 : null,
    }))
    .sort((a, b) => b.avgCompletion - a.avgCompletion)

  if (rows.length < 2) return null

  return (
    <div className="db-card" style={{ overflow: 'hidden' }}>
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-chart-bar" style={{ color: 'var(--aqua)', marginRight: 7 }} />
          {t('components.templatePerformance.title')}
        </h3>
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{rows.length} templates · {journeys.length} journeys</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Template', 'Journeys', 'Avg Completion', 'Avg Risk', 'Avg Pulse'].map(h => (
                <th key={h} style={{ padding: '8px 16px', textAlign: h === 'Template' ? 'left' : 'center', fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const isTop = i === 0
              return (
                <tr key={r.id} style={{ borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--border)', background: isTop ? 'color-mix(in srgb, var(--green) 4%, transparent)' : 'transparent' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      {isTop && <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--green)', background: 'color-mix(in srgb, var(--green) 14%, transparent)', padding: '1px 6px', borderRadius: 100, whiteSpace: 'nowrap' }}>Top</span>}
                      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{r.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', color: 'var(--text2)' }}>{r.count}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                    <span style={{ fontWeight: 700, color: r.avgCompletion >= 70 ? 'var(--green)' : r.avgCompletion >= 45 ? 'var(--amber)' : 'var(--red)' }}>{r.avgCompletion}%</span>
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                    <span style={{ fontWeight: 700, color: r.avgRisk > 60 ? 'var(--red)' : r.avgRisk > 40 ? 'var(--amber)' : 'var(--green)' }}>{r.avgRisk}</span>
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'center', color: 'var(--text2)' }}>
                    {r.avgPulse != null ? `${r.avgPulse}/5` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── HR Inbox ───────────────────────────────────────────────────────────────

const PRIORITY_CONFIG = {
  high:   { color: 'var(--red)',   bg: 'color-mix(in srgb, var(--red) 10%, transparent)',   border: 'color-mix(in srgb, var(--red) 25%, transparent)',   label: 'Urgent' },
  medium: { color: 'var(--amber)', bg: 'color-mix(in srgb, var(--amber) 10%, transparent)', border: 'color-mix(in srgb, var(--amber) 25%, transparent)', label: 'Today' },
  info:   { color: 'var(--cyan)',  bg: 'color-mix(in srgb, var(--cyan) 10%, transparent)',  border: 'color-mix(in srgb, var(--cyan) 25%, transparent)',  label: 'FYI' },
}

function InboxDraftPanel({ item, onDismiss }: { item: InboxItem; onDismiss: () => void }) {
  const [draft, setDraft]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied]   = useState(false)

  async function generate() {
    setLoading(true)
    try {
      const res = await fetch('/api/draft-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hireName:    item.hireName ?? item.title.replace(' is at risk', '').replace(' needs attention', ''),
          riskScore:   item.riskScore ?? 75,
          currentWeek: item.week ?? 3,
          context:     item.desc,
        }),
      })
      const data = await res.json()
      setDraft(data.message ?? 'AI unavailable.')
    } catch { setDraft('AI unavailable. Try again.') }
    finally   { setLoading(false) }
  }

  function copy() {
    if (!draft) return
    navigator.clipboard.writeText(draft).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <div style={{ padding: '10px 20px 14px', borderTop: '1px solid var(--border)', background: 'var(--surface2)' }}>
      {!draft && !loading && (
        <button
          onClick={generate}
          className="btn btn-sm"
          style={{ fontSize: 11, background: 'var(--grad)', color: '#fff', border: 'none', borderRadius: 'var(--r)' }}
        >
          <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: 5 }} />
          Generate AI check-in message
        </button>
      )}
      {loading && (
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 6 }} />Drafting…
        </span>
      )}
      {draft && !loading && (
        <>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={4}
            style={{
              width: '100%', fontSize: 12, color: 'var(--text2)', lineHeight: 1.6,
              background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--r)',
              padding: '8px 10px', resize: 'vertical', fontFamily: 'inherit', outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button onClick={copy} className="btn btn-sm btn-outline" style={{ fontSize: 10 }}>
              <i className={`fa-solid fa-${copied ? 'check' : 'copy'}`} style={{ marginRight: 4 }} />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <a
              href={`mailto:?subject=${encodeURIComponent(`Check-in: ${item.hireName ?? ''}`)}&body=${encodeURIComponent(draft)}`}
              className="btn btn-sm btn-outline"
              style={{ fontSize: 10, textDecoration: 'none' }}
            >
              <i className="fa-solid fa-envelope" style={{ marginRight: 4 }} />Send via Email
            </a>
            <button onClick={() => { setDraft(null); generate() }} className="btn btn-sm btn-ghost" style={{ fontSize: 10 }}>
              <i className="fa-solid fa-rotate" style={{ marginRight: 4 }} />Regenerate
            </button>
            <button onClick={onDismiss} className="btn btn-sm btn-ghost" style={{ fontSize: 10, marginLeft: 'auto', color: 'var(--text3)' }}>
              Done <i className="fa-solid fa-check" style={{ marginLeft: 4 }} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function HRInbox({ items, wins = [] }: { items: InboxItem[]; wins?: InterventionWin[] }) {
  const { t } = useT()
  const [dismissed, setDismissed]   = useState<Set<string>>(new Set())
  const [expanded,  setExpanded]    = useState<string | null>(null)
  const [, startTransition]         = useTransition()
  const visible = items.filter(i => !dismissed.has(i.id))

  function handleDismiss(item: InboxItem) {
    setDismissed(prev => new Set([...prev, item.id]))
    if (expanded === item.id) setExpanded(null)
    if (item.journeyId && item.hireName) {
      startTransition(() => {
        logHRInboxAction(item.journeyId!, 'hr_intervention_dismissed', item.hireName!, item.riskScore ?? 0)
      })
    }
  }

  function handleAct(item: InboxItem) {
    setDismissed(prev => new Set([...prev, item.id]))
    setExpanded(null)
    if (item.journeyId && item.hireName) {
      startTransition(() => {
        logHRInboxAction(item.journeyId!, 'hr_intervention_acted', item.hireName!, item.riskScore ?? 0)
      })
    }
  }

  if (visible.length === 0 && wins.length === 0) return null

  return (
    <div className="db-card" style={{ overflow: 'hidden' }}>
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-inbox" style={{ color: 'var(--blue)' }} />
          {t('components.hrInbox.title')}
        </h3>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>
          {visible.filter(i => i.priority === 'high').length} urgent · {visible.filter(i => i.priority === 'medium').length} today
        </span>
      </div>

      {/* Intervention wins banner */}
      {wins.length > 0 && (
        <div style={{
          margin: '0 16px 12px',
          padding: '10px 14px',
          borderRadius: 'var(--r)',
          background: 'color-mix(in srgb, var(--green) 8%, transparent)',
          border: '1px solid color-mix(in srgb, var(--green) 25%, transparent)',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <i className="fa-solid fa-trophy" style={{ fontSize: 11, color: 'var(--green)' }} />
            <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Your interventions worked
            </span>
          </div>
          {wins.map((w, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="fa-solid fa-arrow-trend-down" style={{ fontSize: 10, color: 'var(--green)', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.4 }}>
                <strong>{w.hireName}</strong> risk dropped from {w.before} → {w.after}
                <span style={{ color: 'var(--text3)', fontSize: 10 }}> · {w.daysAgo}d ago</span>
              </span>
            </div>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <div style={{ padding: '20px 20px 24px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
          <i className="fa-solid fa-circle-check" style={{ fontSize: 20, color: 'var(--green)', display: 'block', marginBottom: 8 }} />
          {t('components.hrInbox.empty')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {visible.map((item, i) => {
            const pc     = PRIORITY_CONFIG[item.priority]
            const isLast = i === visible.length - 1
            const isExp  = expanded === item.id
            return (
              <div key={item.id} style={{ borderBottom: isLast && !isExp ? 'none' : '1px solid var(--border)' }}>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 20px', background: 'transparent', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                    background: pc.bg, border: `1px solid ${pc.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <i className={item.icon} style={{ fontSize: 13, color: pc.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
                      <strong style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{item.title}</strong>
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: '1px 6px', borderRadius: 100,
                        background: pc.bg, color: pc.color, border: `1px solid ${pc.border}`,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>{pc.label}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>{item.desc}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {item.priority === 'high' && (
                      <button
                        className="btn btn-sm"
                        onClick={() => setExpanded(isExp ? null : item.id)}
                        style={{
                          fontSize: 10, fontWeight: 700, borderRadius: 'var(--r)',
                          background: isExp ? 'var(--surface)' : 'var(--grad)',
                          color: isExp ? 'var(--text3)' : '#fff',
                          border: 'none', display: 'flex', alignItems: 'center', gap: 5,
                        }}
                      >
                        <i className="fa-solid fa-paper-plane" style={{ fontSize: 9 }} />
                        {isExp ? 'Close' : 'Draft Message'}
                      </button>
                    )}
                    {item.href && item.priority !== 'high' && (
                      <a href={item.href} className="btn btn-ghost btn-sm" style={{ fontSize: 11, textDecoration: 'none' }}>
                        <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: 10 }} /> View
                      </a>
                    )}
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 11, color: 'var(--text3)' }}
                      onClick={() => handleDismiss(item)}
                      aria-label={`Dismiss: ${item.title}`}
                    >
                      <i className="fa-solid fa-xmark" style={{ fontSize: 10 }} />
                    </button>
                  </div>
                </div>
                {isExp && (
                  <InboxDraftPanel
                    item={item}
                    onDismiss={() => handleAct(item)}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Churn Risk Forecast ────────────────────────────────────────────────────

function ChurnRiskForecast({ journeys }: { journeys: any[] }) {
  const [expandedBucket, setExpandedBucket] = useState<'high' | 'medium' | 'low' | null>(null)

  const high   = journeys.filter(j => j.risk_score >= 70 && (j.current_week ?? 0) <= 10)
  const medium = journeys.filter(j =>
    (j.risk_score >= 45 && j.risk_score < 70) ||
    (j.risk_score >= 70 && (j.current_week ?? 0) > 10)
  )
  const low    = journeys.filter(j => j.risk_score < 45)

  const deptMap = new Map<string, { total: number; highRisk: number }>()
  for (const j of journeys) {
    const dept = j.employee?.department ?? 'Unknown'
    if (!deptMap.has(dept)) deptMap.set(dept, { total: 0, highRisk: 0 })
    const s = deptMap.get(dept)!
    s.total++
    if (j.risk_score >= 70 && (j.current_week ?? 0) <= 10) s.highRisk++
  }
  const deptBars = Array.from(deptMap.entries())
    .filter(([, s]) => s.total > 0)
    .map(([dept, s]) => ({ dept, pct: Math.round((s.highRisk / s.total) * 100), highRisk: s.highRisk, total: s.total }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5)

  const buckets: { key: 'high' | 'medium' | 'low'; label: string; count: number; color: string; hires: any[] }[] = [
    { key: 'high',   label: 'High risk', count: high.length,   color: 'var(--red)',   hires: high   },
    { key: 'medium', label: 'Medium',    count: medium.length, color: 'var(--amber)', hires: medium },
    { key: 'low',    label: 'Low',       count: low.length,    color: 'var(--green)', hires: low    },
  ]

  return (
    <div className="db-card" style={{ overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 24, padding: '18px 20px', alignItems: 'start' }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fa-solid fa-brain" style={{ color: 'var(--blue)', fontSize: 14 }} aria-hidden="true" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>Predicted Churn Risk</h3>
            <span className="badge-ai">AI</span>
          </div>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>
            Next 30 days — based on risk score, velocity &amp; sentiment trends
          </p>
        </div>

        {/* Middle */}
        <div style={{ display: 'flex', gap: 12, alignSelf: 'center' }}>
          {buckets.map(({ key, label, count, color, hires }) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <button
                onClick={() => setExpandedBucket(expandedBucket === key ? null : key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: expandedBucket === key ? 'var(--r) var(--r) 0 0' : 99,
                  background: expandedBucket === key ? `color-mix(in srgb, ${color} 12%, var(--surface2))` : 'var(--surface2)',
                  border: `1px solid ${expandedBucket === key ? color : 'var(--border)'}`,
                  borderBottom: expandedBucket === key ? 'none' : undefined,
                  whiteSpace: 'nowrap', cursor: count > 0 ? 'pointer' : 'default',
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{count}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{label}</span>
                {count > 0 && <i className={`fa-solid fa-chevron-${expandedBucket === key ? 'up' : 'down'}`} style={{ fontSize: 8, color: 'var(--text3)', marginLeft: 2 }} />}
              </button>
              {expandedBucket === key && count > 0 && (
                <div style={{
                  background: `color-mix(in srgb, ${color} 5%, var(--surface))`,
                  border: `1px solid ${color}`, borderTop: 'none',
                  borderRadius: '0 0 var(--r) var(--r)',
                  padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  {hires.slice(0, 6).map((j: any) => (
                    <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {j.employee?.full_name ?? 'Unknown'}
                      </span>
                      <span style={{ fontSize: 10, color, fontWeight: 700, flexShrink: 0 }}>{j.risk_score ?? '—'}</span>
                    </div>
                  ))}
                  {hires.length > 6 && <span style={{ fontSize: 10, color: 'var(--text3)' }}>+{hires.length - 6} more</span>}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {deptBars.length === 0 ? (
            <p style={{ fontSize: 11, color: 'var(--text3)', margin: 0 }}>No department data yet.</p>
          ) : deptBars.map(({ dept, pct, highRisk, total }) => (
            <div key={dept} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: 'var(--text3)', width: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>{dept}</span>
              <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  borderRadius: 3,
                  background: pct >= 50 ? 'var(--red)' : pct >= 25 ? 'var(--amber)' : 'var(--green)',
                  transition: 'width 0.6s ease',
                }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: pct >= 50 ? 'var(--red)' : pct >= 25 ? 'var(--amber)' : 'var(--green)', minWidth: 28, textAlign: 'right', flexShrink: 0 }}>
                {highRisk}/{total}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Team Health Card ───────────────────────────────────────────────────────

interface TeamHealthCardProps {
  avgSentiment?: number
  retentionRisk?: number
  kpis: HRDashboardClientProps['kpis']
  avgTTP?: number | null
  ttpDelta?: number | null
}

function TeamHealthCard({ avgSentiment, retentionRisk, kpis, avgTTP, ttpDelta }: TeamHealthCardProps) {
  const sentiment = avgSentiment ?? null
  const riskPct   = retentionRisk != null ? retentionRisk : kpis.atRisk > 0 ? Math.round((kpis.atRisk / Math.max(kpis.newHires, 1)) * 100) : 0
  const taskPct   = kpis.taskCompletionPct

  function sentimentLabel(s: number) {
    if (s >= 70) return { label: 'Positive', color: 'var(--green)' }
    if (s >= 40) return { label: 'Neutral',  color: 'var(--amber)' }
    return               { label: 'Low',     color: 'var(--red)'   }
  }

  return (
    <div className="db-card">
      <div className="db-card-header">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
          <i className="fa-solid fa-heart-pulse" style={{ color: 'var(--red)' }} aria-hidden="true" />
          Team Health
        </h3>
        <span className="badge-ai">Live</span>
      </div>
      <div className="db-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Sentiment */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>Avg Sentiment</span>
            {sentiment != null ? (
              <span style={{ fontSize: 12, fontWeight: 700, color: sentimentLabel(sentiment).color }}>
                {sentimentLabel(sentiment).label} · {sentiment}%
              </span>
            ) : (
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>No data yet</span>
            )}
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${sentiment ?? 0}%`,
              borderRadius: 3,
              background: sentiment != null ? sentimentLabel(sentiment).color : 'var(--border)',
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>

        {/* Retention risk */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>Retention Risk</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: riskPct > 30 ? 'var(--red)' : riskPct > 15 ? 'var(--amber)' : 'var(--green)' }}>
              {riskPct}%
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${riskPct}%`,
              borderRadius: 3,
              background: riskPct > 30 ? 'var(--red)' : riskPct > 15 ? 'var(--amber)' : 'var(--green)',
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>

        {/* Task completion */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>Task Completion</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: taskPct >= 80 ? 'var(--green)' : taskPct >= 50 ? 'var(--amber)' : 'var(--red)' }}>
              {taskPct}%
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${taskPct}%`,
              borderRadius: 3,
              background: taskPct >= 80 ? 'var(--green)' : taskPct >= 50 ? 'var(--amber)' : 'var(--red)',
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>

        {/* Time to Productivity */}
        {avgTTP != null && (
          <div style={{ paddingTop: 4, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div>
                <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600 }}>Time to Productivity</span>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>Days to 80% task completion</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-display)', color: ttpDelta != null && ttpDelta >= 0 ? 'var(--green)' : 'var(--amber)', lineHeight: 1 }}>
                  {avgTTP}d
                </span>
                {ttpDelta != null && (
                  <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2, color: ttpDelta >= 0 ? 'var(--green)' : 'var(--amber)' }}>
                    {ttpDelta >= 0 ? `${ttpDelta}d faster` : `${Math.abs(ttpDelta)}d slower`} than avg
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, Math.round((45 / Math.max(avgTTP, 1)) * 100))}%`,
                  borderRadius: 3,
                  background: ttpDelta != null && ttpDelta >= 0 ? 'var(--green)' : 'var(--amber)',
                  transition: 'width 0.6s ease',
                }} />
              </div>
              <span style={{ fontSize: 10, color: 'var(--text3)', flexShrink: 0 }}>Benchmark: 45d</span>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// ── CSV Export ─────────────────────────────────────────────────────────────

function exportReportCSV(journeys: any[]) {
  const header = ['Name', 'Department', 'Week', 'Risk Score', 'Status', 'Start Date']
  const rows = journeys.map(j => [
    j.employee?.full_name ?? 'Unknown',
    j.employee?.department ?? '—',
    j.current_week ?? 0,
    j.risk_score ?? 0,
    j.status ?? '—',
    j.start_date ?? '—',
  ])
  const csv = [header, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `onboarding-report-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function HRDashboardClient({
  journeys,
  kpis,
  engagementData,
  completionData,
  stages,
  deptNodes    = [],
  managers     = [],
  templates    = [],
  employees    = [],
  alerts       = [],
  avgSentiment,
  retentionRisk,
  deptStats,
  avgTTP,
  ttpDelta,
  inboxItems        = [],
  interventionWins  = [],
}: HRDashboardClientProps) {
  const router     = useRouter()
  const { t }      = useT()
  const [showInvite, setShowInvite]         = useState(false)
  const [stageFilter, setStageFilter]       = useState<string>('')
  const [deptFilter, setDeptFilter]         = useState<string>('')
  const [showHealthDrilldown, setShowHealthDrilldown] = useState(false)

  // Group employees by department for GlobalFrictionMap hire panels
  const hiresByDept = employees.reduce<Record<string, typeof employees>>((acc, emp) => {
    const key = emp.dept || 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(emp)
    return acc
  }, {})

  // Onboarding Health Score — single 0-100 company-wide metric
  const healthScore = (() => {
    if (!kpis.activeJourneys && !kpis.completedJourneys) return null
    const taskWeight      = kpis.taskCompletionPct * 0.40
    const riskWeight      = kpis.activeJourneys > 0
      ? ((kpis.activeJourneys - kpis.atRisk) / kpis.activeJourneys) * 100 * 0.35
      : 100 * 0.35
    const sentimentWeight = avgSentiment != null ? (avgSentiment / 100) * 100 * 0.25 : 65 * 0.25
    return Math.round(taskWeight + riskWeight + sentimentWeight)
  })()

  return (
    <>
      <div className="db-header">
        <div className="db-header-left">
          <h1>{t('hr.dashboard.title')}</h1>
          <p>{t('hr.dashboard.subtitle')}</p>
        </div>
        <div className="db-header-actions">
          <button className="btn btn-outline btn-sm" onClick={() => exportReportCSV(journeys)} aria-label="Export onboarding report as CSV">
            <i className="fa-solid fa-download" aria-hidden="true" /> {t('hr.dashboard.exportReport')}
          </button>
          <button className="btn btn-primary btn-sm btn-glow" onClick={() => setShowInvite(true)} aria-label="Invite a new hire">
            <i className="fa-solid fa-user-plus" aria-hidden="true" /> {t('hr.dashboard.inviteNewHire')}
          </button>
        </div>
      </div>

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        <ProactiveAura
          role="hr"
          atRiskCount={kpis.atRisk}
          taskCompletionPct={kpis.taskCompletionPct}
          avgSentiment={avgSentiment}
          overdueCheckIns={alerts.length}
        />

        <HRInbox items={inboxItems} wins={interventionWins} />

        <ChurnRiskForecast journeys={journeys} />

        {/* Onboarding Health Score — single company-wide metric */}
        {healthScore !== null && (() => {
          const color = healthScore >= 70 ? 'var(--green)' : healthScore >= 45 ? 'var(--amber)' : 'var(--red)'
          const label = healthScore >= 70 ? 'Healthy' : healthScore >= 45 ? 'Needs Attention' : 'Critical'
          const weights = [
            { name: 'Task Completion', pct: Math.round(kpis.taskCompletionPct * 0.40), weight: '40%' },
            { name: 'At-Risk Rate', pct: kpis.activeJourneys > 0 ? Math.round(((kpis.activeJourneys - kpis.atRisk) / kpis.activeJourneys) * 100 * 0.35) : Math.round(100 * 0.35), weight: '35%' },
            { name: 'Avg Sentiment', pct: avgSentiment != null ? Math.round((avgSentiment / 100) * 100 * 0.25) : Math.round(65 * 0.25), weight: '25%' },
          ]
          // Compute actionable recommendations to improve score
          const gap = 75 - healthScore
          const taskGap  = Math.max(0, 75 - kpis.taskCompletionPct)
          const riskGap  = kpis.atRisk
          const sentGap  = avgSentiment != null ? Math.max(0, 65 - avgSentiment) : null
          const recommendations: { action: string; impact: number; icon: string }[] = []
          if (taskGap > 0) recommendations.push({ action: `Increase task completion by ${Math.min(taskGap, 15)}pp → +${Math.round(Math.min(taskGap, 15) * 0.4)} pts`, impact: Math.round(Math.min(taskGap, 15) * 0.4), icon: 'fa-solid fa-list-check' })
          if (riskGap > 1) recommendations.push({ action: `Resolve ${Math.ceil(riskGap / 2)} at-risk hires → +${Math.round((riskGap / 2 / Math.max(kpis.activeJourneys, 1)) * 35)} pts`, impact: Math.round((riskGap / 2 / Math.max(kpis.activeJourneys, 1)) * 35), icon: 'fa-solid fa-shield-halved' })
          if (sentGap && sentGap > 5) recommendations.push({ action: `Lift avg sentiment by ${Math.min(sentGap, 10)}% → +${Math.round(Math.min(sentGap, 10) * 0.25)} pts`, impact: Math.round(Math.min(sentGap, 10) * 0.25), icon: 'fa-solid fa-heart-pulse' })

          return (
            <>
            <div className="db-card" style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 28, padding: '20px 24px' }}>
                {/* Score ring — clickable to open drill-down */}
                <button
                  onClick={() => setShowHealthDrilldown(true)}
                  style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  title="Click to see how to improve this score"
                >
                  <div style={{
                    width: 88, height: 88, borderRadius: '50%',
                    border: `4px solid ${color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `color-mix(in srgb, ${color} 10%, transparent)`,
                    boxShadow: `0 0 24px color-mix(in srgb, ${color} 25%, transparent)`,
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <span style={{ fontSize: 28, fontWeight: 900, fontFamily: 'var(--font-display)', color, lineHeight: 1 }}>
                      {healthScore}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '0.04em' }}>{label}</span>
                  <span style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600 }}>Click to improve ↗</span>
                </button>

                {/* Label + breakdown */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>Onboarding Health Score</h3>
                    <span className="badge-ai">Live</span>
                  </div>
                  <p style={{ margin: '0 0 12px', fontSize: 11, color: 'var(--text3)', lineHeight: 1.5 }}>
                    Composite metric: task completion (40%) + at-risk rate (35%) + avg sentiment (25%)
                  </p>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {weights.map(w => (
                      <div key={w.name} style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{w.name}</span>
                          <span style={{ fontSize: 10, color: 'var(--text3)' }}>{w.weight}</span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(100, (w.pct / (w.weight === '40%' ? 40 : w.weight === '35%' ? 35 : 25)) * 100)}%`, borderRadius: 2, background: color, transition: 'width 0.6s ease' }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)' }}>+{w.pct} pts</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trend hint */}
                <div style={{ flexShrink: 0, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Benchmark</span>
                  <span style={{ fontSize: 22, fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--text3)' }}>75</span>
                  <span style={{ fontSize: 10, color: healthScore >= 75 ? 'var(--green)' : 'var(--amber)', fontWeight: 700 }}>
                    {healthScore >= 75 ? '▲ Above avg' : `▼ ${75 - healthScore} pts gap`}
                  </span>
                </div>
              </div>
            </div>

            {/* Health Score Drill-Down Modal */}
            {showHealthDrilldown && (
              <div
                style={{ position: 'fixed', inset: 0, background: 'rgba(13,21,41,0.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
                onClick={() => setShowHealthDrilldown(false)}
              >
                <div
                  onClick={e => e.stopPropagation()}
                  style={{ width: '100%', maxWidth: 480, background: 'var(--surface)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}
                >
                  <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', border: `3px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `color-mix(in srgb, ${color} 10%, transparent)`, flexShrink: 0 }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color }}>{healthScore}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>How to reach {Math.min(100, healthScore + 10)} pts</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{gap > 0 ? `${gap} pts below industry benchmark (75)` : 'Above industry benchmark — keep going!'}</div>
                    </div>
                    <button onClick={() => setShowHealthDrilldown(false)} className="btn btn-ghost btn-sm" style={{ color: 'var(--text3)' }}>
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>
                  <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {recommendations.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '16px 0' }}>
                        <i className="fa-solid fa-trophy" style={{ fontSize: 24, color: 'var(--green)', display: 'block', marginBottom: 8 }} />
                        <p style={{ fontSize: 13, color: 'var(--text2)', margin: 0 }}>Your score is excellent. Focus on maintaining consistency.</p>
                      </div>
                    ) : recommendations.sort((a, b) => b.impact - a.impact).map((rec, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--surface2)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: `color-mix(in srgb, ${color} 12%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <i className={rec.icon} style={{ fontSize: 13, color }} />
                        </div>
                        <span style={{ flex: 1, fontSize: 12, color: 'var(--text2)', lineHeight: 1.45 }}>{rec.action}</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color, flexShrink: 0, background: `color-mix(in srgb, ${color} 12%, transparent)`, padding: '2px 7px', borderRadius: 100 }}>+{rec.impact} pts</span>
                      </div>
                    ))}
                    <p style={{ fontSize: 10, color: 'var(--text3)', margin: '4px 0 0', textAlign: 'center' }}>
                      Projections based on current metrics. Actual impact may vary.
                    </p>
                  </div>
                </div>
              </div>
            )}
            </>
          )
        })()}

        {/* Row 1 — 5 KPIs */}
        <div className="db-grid-kpi5">
          <div className="kpi-card">
            <div className="kpi-icon cyan"><i className="fa-solid fa-users" aria-hidden="true" /></div>
            <div className="kpi-value">{kpis.totalWorkforce.toLocaleString()}</div>
            <div className="kpi-label">{t('hr.dashboard.kpis.totalWorkforce')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon blue"><i className="fa-solid fa-user-tie" aria-hidden="true" /></div>
            <div className="kpi-value">{kpis.newHires}</div>
            <div className="kpi-label">{t('hr.dashboard.kpis.activeNewHires')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon green"><i className="fa-solid fa-circle-check" aria-hidden="true" /></div>
            <div className="kpi-value">{kpis.completedJourneys}</div>
            <div className="kpi-label">{t('hr.dashboard.kpis.completedJourneys')}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon amber"><i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /></div>
            <div className="kpi-value">{kpis.atRisk}</div>
            <div className="kpi-label">{t('hr.dashboard.kpis.atRiskEmployees')}</div>
            {kpis.atRiskDelta != null && kpis.atRiskDelta !== 0 && (
              <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2, color: kpis.atRiskDelta > 0 ? 'var(--red)' : 'var(--green)' }}>
                {kpis.atRiskDelta > 0 ? '▲' : '▼'} {Math.abs(kpis.atRiskDelta)} vs last week
              </div>
            )}
          </div>
          <div className="kpi-card">
            <div className="kpi-icon aqua"><i className="fa-solid fa-list-check" aria-hidden="true" /></div>
            <div className="kpi-value">{kpis.taskCompletionPct}%</div>
            <div className="kpi-label">{t('hr.dashboard.kpis.taskCompletion')}</div>
            {kpis.taskDelta != null && kpis.taskDelta !== 0 && (
              <div style={{ fontSize: 10, fontWeight: 700, marginTop: 2, color: kpis.taskDelta > 0 ? 'var(--green)' : 'var(--red)' }}>
                {kpis.taskDelta > 0 ? '▲' : '▼'} {Math.abs(kpis.taskDelta)}pp vs last week
              </div>
            )}
          </div>
        </div>

        {/* Row 2 — Analytics belt: 3 equal-weight cards */}
        <div className="db-grid-3col">
          <CompletionRateCard data={completionData} />
          <EngagementScoreCard data={engagementData} />
          <StageChecklist stages={stages} activeStage={stageFilter} onStageClick={setStageFilter} />
        </div>

        {/* Row 3 — Main 2/3 + Side 1/3 */}
        <div className="db-grid-2-1">
          {/* Columna principal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>
            <GlobalFrictionMap nodes={deptNodes} activeDept={deptFilter} onDeptFilter={setDeptFilter} hiresByDept={hiresByDept} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <EmployeeTable onInviteNew={() => setShowInvite(true)} employees={employees} stageFilter={stageFilter || undefined} externalDeptFilter={deptFilter || undefined} />
            </div>
          </div>

          {/* Columna lateral */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>
            <ActiveAlerts alerts={alerts} onScheduleCheckIn={() => router.push('/hr/alerts')} onInviteNew={() => setShowInvite(true)} />
            <TeamHealthCard avgSentiment={avgSentiment} retentionRisk={retentionRisk} kpis={kpis} avgTTP={avgTTP} ttpDelta={ttpDelta} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <TalentVelocity deptStats={deptStats} />
            </div>
          </div>
        </div>

        {/* Row 4 — Manager Effectiveness + Template Performance */}
        <ROIDashboard journeys={journeys} kpis={kpis} />
        <ManagerEffectivenessCard journeys={journeys} />
        <TemplatePerformance journeys={journeys} />

        {/* Row 5 — Cohort shortcut */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: 'var(--r)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--r)', background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-table-list" style={{ color: 'var(--blue)', fontSize: 14 }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Cohort View</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>All hires this month — risk, week, check-ins, progress in one table.</div>
            </div>
          </div>
          <a href="/hr/cohort" className="btn btn-outline btn-sm" style={{ fontSize: 12, flexShrink: 0 }}>
            Open Cohort <i className="fa-solid fa-arrow-right" style={{ fontSize: 10, marginLeft: 4 }} />
          </a>
        </div>

        {/* Row 6 — Full-width */}
        <JourneyTemplate />

      </div>

      <AnimatePresence>
        {showInvite && (
          <InviteUserModal
            managers={managers}
            templates={templates}
            onClose={() => setShowInvite(false)}
          />
        )}
      </AnimatePresence>

      <OnboardingTour />
    </>
  )
}
