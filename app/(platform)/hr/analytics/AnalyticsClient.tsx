'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart,
} from 'recharts'
import RiskScoreCard from '@/components/ai/RiskScoreCard'
import RunRiskScanButton from '@/components/ai/RunRiskScanButton'
import { useT } from '@/lib/i18n/context'

// ── Types ──────────────────────────────────────────────────────────────────

interface Employee {
  id: string
  full_name: string
  department: string
  avatar_url?: string
}

interface Journey {
  id: string
  status: 'active' | 'at_risk' | 'completed' | 'paused'
  current_week: number
  risk_score: number
  risk_reasons: string[]
  start_date: string
  employee: Employee
  manager: { id: string; full_name: string }
}

interface Task {
  journey_id: string
  status: string
  week: number
}

interface CheckIn {
  id: string
  milestone: string
  scheduled_date: string
  completed_date: string | null
  journey: { employee: { full_name: string; department: string } }
  manager: { full_name: string }
}

interface Feedback {
  id: string
  milestone: string
  rating: number
  comments: string | null
  created_at: string
  employee: { full_name: string }
}

interface Props {
  journeys: Journey[]
  tasks: Task[]
  checkIns: CheckIn[]
  feedback: Feedback[]
  pulseData?: { week: number; score: number }[]
  cohortData?:  CohortRow[]
  deptData?:    DeptRow[]
  managerData?: ManagerRow[]
}

// ── Industry benchmarks ────────────────────────────────────────────────────

const INDUSTRY_BENCHMARKS = {
  taskCompletion:     68,  // % avg task completion rate industry
  checkInCompletion:  71,  // % of check-ins completed on time
  avgFeedbackRating:  3.9, // out of 5
  atRiskRate:         22,  // % of hires that become at-risk
  completionByWeek12: 74,  // % of journeys completed by week 12
}

// ── BenchmarkBadge ─────────────────────────────────────────────────────────

function BenchmarkBadge({ actual, benchmark, unit = '%', higherIsBetter = true }: {
  actual: number
  benchmark: number
  unit?: string
  higherIsBetter?: boolean
}) {
  const diff = actual - benchmark
  const isPositive = higherIsBetter ? diff >= 0 : diff <= 0
  const absDiff = Math.abs(diff)

  if (absDiff < 1) return (
    <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>
      = industry avg
    </span>
  )

  return (
    <span style={{
      fontSize: 11,
      fontWeight: 700,
      color: isPositive ? 'var(--green)' : 'var(--red)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
    }}>
      <i className={`fa-solid fa-arrow-${isPositive ? 'up' : 'down'}`} style={{ fontSize: 9 }} />
      {absDiff.toFixed(0)}{unit} vs industry
    </span>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

const MILESTONE_LABELS: Record<string, string> = {
  day_7:  'Day 7',
  day_30: 'Day 30',
  day_60: 'Day 60',
  day_90: 'Day 90',
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StarRow({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <i
          key={s}
          className="fa-solid fa-star"
          style={{ fontSize: size, color: s <= rating ? 'var(--amber)' : 'var(--border2)' }}
        />
      ))}
    </div>
  )
}

function exportCSV(filename: string, rows: string[][]) {
  const csv = rows.map(r => r.map(c => `"${(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Main Component ─────────────────────────────────────────────────────────

type Tab = 'overview' | 'risk' | 'checkins' | 'feedback' | 'cohort' | 'roi'

// ── Cohort & ROI static data ───────────────────────────────────────────────

interface CohortRow {
  label: string
  hired: number
  avgProgress: number
  atRisk: number
  completed: number
  avgDays: number
}

const COHORT_DATA: CohortRow[] = [
  { label: 'Jan 2025', hired: 8,  avgProgress: 82, atRisk: 1, completed: 6, avgDays: 34 },
  { label: 'Feb 2025', hired: 5,  avgProgress: 71, atRisk: 2, completed: 2, avgDays: 41 },
  { label: 'Mar 2025', hired: 12, avgProgress: 68, atRisk: 3, completed: 4, avgDays: 38 },
  { label: 'Apr 2025', hired: 6,  avgProgress: 91, atRisk: 0, completed: 6, avgDays: 29 },
]

interface DeptRow {
  name: string
  progress: number
  atRisk: number
  avgWeek: number
}

const DEPT_DATA: DeptRow[] = [
  { name: 'Engineering', progress: 78, atRisk: 2, avgWeek: 4.2 },
  { name: 'Design',      progress: 94, atRisk: 0, avgWeek: 3.1 },
  { name: 'Product',     progress: 61, atRisk: 3, avgWeek: 5.8 },
  { name: 'Sales',       progress: 80, atRisk: 1, avgWeek: 3.9 },
  { name: 'Marketing',   progress: 72, atRisk: 1, avgWeek: 4.5 },
]

interface ManagerRow {
  name: string
  avatar: string
  hires: number
  successRate: number
  trend: 'top' | 'good' | 'support' | 'risk'
}

const MANAGER_DATA: ManagerRow[] = [
  { name: 'Sarah Mitchell', avatar: 'https://i.pravatar.cc/40?u=sarah',   hires: 3, successRate: 94, trend: 'top'     },
  { name: 'David Park',     avatar: 'https://i.pravatar.cc/40?u=david',   hires: 2, successRate: 87, trend: 'good'    },
  { name: 'Laura Chen',     avatar: 'https://i.pravatar.cc/40?u=laura',   hires: 4, successRate: 72, trend: 'support' },
  { name: 'Tom Richards',   avatar: 'https://i.pravatar.cc/40?u=tom',     hires: 2, successRate: 58, trend: 'risk'    },
]

const PRODUCTIVITY_TREND = [
  { quarter: 'Q1 2024', days: 46 },
  { quarter: 'Q2 2024', days: 41 },
  { quarter: 'Q3 2024', days: 38 },
  { quarter: 'Q4 2024', days: 34 },
]
const INDUSTRY_AVG_DAYS = 47

// ── Drill-Through Modal ────────────────────────────────────────────────────

interface DrillThroughJourney {
  id: string
  name: string
  department: string
  riskScore: number
  week: number
  employeeId?: string
}

function DrillThroughModal({ title, journeys: drillJourneys, onClose }: {
  title: string
  journeys: DrillThroughJourney[]
  onClose: () => void
}) {
  const router = useRouter()
  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ maxWidth: 520 }}>
        <button className="modal-close" onClick={onClose} aria-label="Close"><i className="fa-solid fa-xmark" /></button>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, marginBottom: 4 }}>{title}</h3>
        <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 16 }}>{drillJourneys.length} journey{drillJourneys.length !== 1 ? 's' : ''}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 420, overflowY: 'auto' }}>
          {drillJourneys.map(j => (
            <div key={j.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{j.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{j.department} · Week {j.week}</div>
              </div>
              <span style={{
                fontSize: 11, fontWeight: 800, padding: '2px 9px', borderRadius: 100,
                background: j.riskScore > 60 ? 'var(--red-bg)' : j.riskScore > 30 ? 'var(--amber-bg)' : 'var(--green-bg)',
                color: j.riskScore > 60 ? 'var(--red)' : j.riskScore > 30 ? 'var(--amber)' : 'var(--green)',
              }}>
                {j.riskScore}/100
              </span>
              {j.employeeId && (
                <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => { onClose(); router.push(`/hr/employees/${j.employeeId}`) }}>
                  <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: 10 }} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsClient({ journeys, tasks, checkIns, feedback, pulseData, cohortData: cohortDataProp, deptData: deptDataProp, managerData: managerDataProp }: Props) {
  const router = useRouter()
  const { t } = useT()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [drillThrough, setDrillThrough] = useState<{ title: string; journeys: DrillThroughJourney[] } | null>(null)
  const [aiInsights, setAiInsights] = useState<Partial<Record<Tab, string>>>({})
  const [insightLoading, setInsightLoading] = useState(false)
  const fetchedTabs = useRef<Set<Tab>>(new Set())

  // ── ROI Calculator state ────────────────────────────────────────────────
  const [roiSalary,       setRoiSalary]       = useState<number>(75000)
  const [roiHires,        setRoiHires]        = useState<number>(24)
  const [roiTimeToFill,   setRoiTimeToFill]   = useState<number>(42)   // days — industry default
  const [roiCostPerHire,  setRoiCostPerHire]  = useState<number>(4700) // USD — SHRM benchmark
  const [roiTurnoverPct,  setRoiTurnoverPct]  = useState<number>(15)   // % first-year turnover

  // ── KPIs ────────────────────────────────────────────────────────────────
  const activeJourneys   = useMemo(() => journeys.filter(j => j.status !== 'completed'), [journeys])
  const completedJourneys = useMemo(() => journeys.filter(j => j.status === 'completed'), [journeys])
  const atRisk           = useMemo(() => activeJourneys.filter(j => j.risk_score > 60).length, [activeJourneys])
  const onTrackPct       = activeJourneys.length > 0
    ? Math.round((activeJourneys.filter(j => j.risk_score <= 30).length / activeJourneys.length) * 100)
    : 100
  const completedTasks   = useMemo(() => tasks.filter(t => t.status === 'completed').length, [tasks])
  const avgRating        = useMemo(() => {
    if (!feedback.length) return 0
    return +(feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1)
  }, [feedback])

  // ── Benchmark-comparable metrics ────────────────────────────────────────
  const taskCompletionRate = useMemo(() => {
    if (!tasks.length) return 0
    return Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
  }, [tasks])

  const checkInCompletionRate = useMemo(() => {
    if (!checkIns.length) return 0
    return Math.round((checkIns.filter(ci => !!ci.completed_date).length / checkIns.length) * 100)
  }, [checkIns])

  const atRiskRatePct = useMemo(() => {
    if (!journeys.length) return 0
    return Math.round((journeys.filter(j => j.status === 'at_risk').length / journeys.length) * 100)
  }, [journeys])

  const completionByWeek12Pct = useMemo(() => {
    if (!journeys.length) return 0
    return Math.round((journeys.filter(j => j.status === 'completed').length / journeys.length) * 100)
  }, [journeys])

  // ── AI Insight fetch per tab ─────────────────────────────────────────────
  const fetchInsight = useCallback(async (tab: Tab) => {
    if (fetchedTabs.current.has(tab)) return
    fetchedTabs.current.add(tab)
    setInsightLoading(true)
    try {
      const now_ = new Date()
      const ciCompleted = checkIns.filter(ci => !!ci.completed_date).length
      const ciOverdue   = checkIns.filter(ci => !ci.completed_date && new Date(ci.scheduled_date) < now_).length
      const ciUpcoming  = checkIns.filter(ci => !ci.completed_date && new Date(ci.scheduled_date) >= now_).length
      const payloads: Record<Tab, object> = {
        overview:  { chartType: 'overview',  data: { totalJourneys: journeys.length, active: activeJourneys.length, completed: completedJourneys.length, atRisk, onTrackPct, taskCompletionRate, checkInCompletionRate } },
        risk:      { chartType: 'risk',      data: { atRisk, avgRiskScores: activeJourneys.map(j => j.risk_score).slice(0, 20), atRiskRate: atRiskRatePct }, benchmarks: { atRiskRate: INDUSTRY_BENCHMARKS.atRiskRate } },
        checkins:  { chartType: 'checkins',  data: { total: checkIns.length, completed: ciCompleted, overdue: ciOverdue, upcoming: ciUpcoming, completionRate: checkInCompletionRate }, benchmarks: { checkInCompletion: INDUSTRY_BENCHMARKS.checkInCompletion } },
        feedback:  { chartType: 'feedback',  data: { count: feedback.length, avgRating, ratings: feedback.map(f => f.rating).slice(0, 20) }, benchmarks: { avgFeedbackRating: INDUSTRY_BENCHMARKS.avgFeedbackRating } },
        cohort:    { chartType: 'cohort',    data: cohortDataProp?.length ? cohortDataProp : COHORT_DATA },
        roi:       { chartType: 'roi',       data: { avgTTPDays: PRODUCTIVITY_TREND[PRODUCTIVITY_TREND.length - 1]?.days, industryAvg: INDUSTRY_AVG_DAYS } },
      }
      const res = await fetch('/api/analytics-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloads[tab]),
      })
      const json = await res.json()
      if (json.insight) setAiInsights(prev => ({ ...prev, [tab]: json.insight }))
    } catch { /* silently ignore */ } finally {
      setInsightLoading(false)
    }
  }, [journeys, activeJourneys, completedJourneys, atRisk, onTrackPct, taskCompletionRate, checkInCompletionRate, atRiskRatePct, checkIns, feedback, avgRating])

  useEffect(() => { fetchInsight(activeTab) }, [activeTab, fetchInsight])

  // ── Weekly completion data ───────────────────────────────────────────────
  const weekData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const week = i + 1
      const wt   = tasks.filter(t => t.week === week)
      const done = wt.filter(t => t.status === 'completed').length
      const rate = wt.length > 0 ? Math.round((done / wt.length) * 100) : 0
      return { week, total: wt.length, done, rate }
    })
  }, [tasks])

  // ── Check-ins data ───────────────────────────────────────────────────────
  const now           = new Date()
  const overdueCI     = checkIns.filter(ci => !ci.completed_date && new Date(ci.scheduled_date) < now)
  const upcomingCI    = checkIns.filter(ci => !ci.completed_date && new Date(ci.scheduled_date) >= now)
  const completedCI   = checkIns.filter(ci => !!ci.completed_date)

  // ── Chart data ───────────────────────────────────────────────────────────
  const riskTrendData = useMemo(() => {
    const weekMap = new Map<number, number[]>()
    journeys.forEach(j => {
      const w = j.current_week ?? 1
      if (!weekMap.has(w)) weekMap.set(w, [])
      weekMap.get(w)!.push(j.risk_score ?? 0)
    })
    if (!weekMap.size) return [{ week: 'W1', avg: 0, atRisk: 0 }]
    return [...weekMap.keys()].sort((a, b) => a - b).map(w => {
      const scores = weekMap.get(w)!
      const avg = Math.round(scores.reduce((s, r) => s + r, 0) / scores.length)
      return { week: `W${w}`, avg, atRisk: scores.filter(r => r > 60).length }
    })
  }, [journeys])

  const avgTTPDays = useMemo(() => {
    if (!completedJourneys.length) return PRODUCTIVITY_TREND[PRODUCTIVITY_TREND.length - 1]?.days ?? 34
    const total = completedJourneys.reduce((s, j) => s + (j.current_week ?? 8) * 7, 0)
    return Math.round(total / completedJourneys.length)
  }, [completedJourneys])

  const pulseTrendData = useMemo(() => {
    if (!pulseData?.length) return []
    return Array.from({ length: 12 }, (_, i) => {
      const week = i + 1
      const entries = pulseData.filter(p => p.week === week)
      if (!entries.length) return null
      const avgMood = +(entries.reduce((s, p) => s + p.score, 0) / entries.length).toFixed(1)
      return { week: `W${week}`, avgMood }
    }).filter((d): d is { week: string; avgMood: number } => d !== null)
  }, [pulseData])




  // ── AI insight text ──────────────────────────────────────────────────────
  const insightText = atRisk > 0
    ? `${atRisk} employee${atRisk > 1 ? 's are' : ' is'} currently at risk. ${onTrackPct}% of active journeys are on track. ${overdueCI.length > 0 ? `${overdueCI.length} check-in${overdueCI.length > 1 ? 's are' : ' is'} overdue.` : 'All check-ins are up to date.'}`
    : `All ${activeJourneys.length} active journeys are on track. ${completedJourneys.length} journeys completed so far.${avgRating > 0 ? ` Average feedback rating: ${avgRating}/5.` : ''}`

  // ── Export handlers ───────────────────────────────────────────────────────
  function handleExport() {
    if (activeTab === 'overview' || activeTab === 'risk') {
      exportCSV(`risk-report-${new Date().toISOString().split('T')[0]}.csv`, [
        ['Employee', 'Department', 'Week', 'Risk Score', 'Status', 'Risk Factors'],
        ...activeJourneys.map(j => [
          j.employee?.full_name || '',
          j.employee?.department || '',
          String(j.current_week),
          String(j.risk_score),
          j.status,
          (j.risk_reasons || []).join('; '),
        ]),
      ])
    } else if (activeTab === 'checkins') {
      exportCSV(`checkins-report-${new Date().toISOString().split('T')[0]}.csv`, [
        ['Employee', 'Department', 'Milestone', 'Manager', 'Scheduled', 'Completed', 'Status'],
        ...checkIns.map(ci => [
          ci.journey?.employee?.full_name || '',
          ci.journey?.employee?.department || '',
          MILESTONE_LABELS[ci.milestone] || ci.milestone,
          ci.manager?.full_name || '',
          fmtDate(ci.scheduled_date),
          ci.completed_date ? fmtDate(ci.completed_date) : '',
          ci.completed_date ? 'Completed' : new Date(ci.scheduled_date) < now ? 'Overdue' : 'Upcoming',
        ]),
      ])
    } else if (activeTab === 'feedback') {
      exportCSV(`feedback-report-${new Date().toISOString().split('T')[0]}.csv`, [
        ['Employee', 'Milestone', 'Rating', 'Comments', 'Date'],
        ...feedback.map(f => [
          f.employee?.full_name || '',
          MILESTONE_LABELS[f.milestone] || f.milestone,
          String(f.rating),
          f.comments || '',
          fmtDate(f.created_at),
        ]),
      ])
    }
  }

  const TABS: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: 'overview',  label: 'Overview',        icon: 'fa-solid fa-chart-pie' },
    { id: 'risk',      label: 'Risk',            icon: 'fa-solid fa-triangle-exclamation', badge: atRisk > 0 ? atRisk : undefined },
    { id: 'checkins',  label: 'Check-ins',       icon: 'fa-solid fa-calendar-check',       badge: overdueCI.length > 0 ? overdueCI.length : undefined },
    { id: 'feedback',  label: 'Feedback',        icon: 'fa-solid fa-star' },
    { id: 'cohort',    label: 'Cohort Analysis', icon: 'fa-solid fa-layer-group' },
    { id: 'roi',       label: 'ROI & Impact',    icon: 'fa-solid fa-sack-dollar' },
  ]

  return (
    <>
      {/* Header */}
      <div className="db-header">
        <div className="db-header-left">
          <h1>{t('hr.analytics.title')}</h1>
          <p>{t('hr.analytics.subtitle')}</p>
        </div>
        <div className="db-header-actions">
          <button className="btn btn-outline btn-sm" onClick={handleExport} aria-label="Export analytics as CSV">
            <i className="fa-solid fa-download" aria-hidden="true" /> Export
          </button>
          <RunRiskScanButton />
        </div>
      </div>

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        {/* AI Insight Banner */}
        <div style={{
          background: 'var(--grad-soft)',
          border: '1px solid var(--blue-light)',
          borderRadius: 'var(--r-xl)',
          padding: '14px 18px',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 'var(--r)',
            background: 'var(--grad)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {insightLoading
              ? <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 13, color: '#fff' }} />
              : <i className="fa-solid fa-sparkles" style={{ fontSize: 13, color: '#fff' }} />
            }
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 11, fontWeight: 800, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em',
              background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>
              AI Insight · {TABS.find(t => t.id === activeTab)?.label}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
              {insightLoading && !aiInsights[activeTab]
                ? <span style={{ color: 'var(--text3)', fontStyle: 'italic' }}>Analyzing {TABS.find(t => t.id === activeTab)?.label.toLowerCase()} data…</span>
                : aiInsights[activeTab] ?? insightText
              }
            </p>
          </div>
        </div>

        {/* Industry Benchmarks Card */}
        <div className="db-card" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fa-solid fa-chart-bar" style={{ color: 'var(--blue)', fontSize: 13 }} />
              Industry Benchmarks
            </div>
            <span className="badge-ai" style={{ fontSize: 10 }}>2026 Data</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
            {[
              {
                label: 'Task Completion',
                yours: taskCompletionRate,
                industry: INDUSTRY_BENCHMARKS.taskCompletion,
                unit: '%',
                higherIsBetter: true,
              },
              {
                label: 'Check-in Completion',
                yours: checkInCompletionRate,
                industry: INDUSTRY_BENCHMARKS.checkInCompletion,
                unit: '%',
                higherIsBetter: true,
              },
              {
                label: 'Avg Feedback Rating',
                yours: avgRating,
                industry: INDUSTRY_BENCHMARKS.avgFeedbackRating,
                unit: '/5',
                higherIsBetter: true,
              },
              {
                label: 'At-Risk Rate',
                yours: atRiskRatePct,
                industry: INDUSTRY_BENCHMARKS.atRiskRate,
                unit: '%',
                higherIsBetter: false,
              },
              {
                label: 'Journeys Completed',
                yours: completionByWeek12Pct,
                industry: INDUSTRY_BENCHMARKS.completionByWeek12,
                unit: '%',
                higherIsBetter: true,
              },
            ].map(row => {
              const diff = row.yours - row.industry
              const isPositive = row.higherIsBetter ? diff >= 0 : diff <= 0
              const absDiff = Math.abs(diff)
              const deltaColor = absDiff < 1 ? 'var(--text3)' : isPositive ? 'var(--green)' : 'var(--red)'
              return (
                <div key={row.label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--bg)',
                  borderRadius: 'var(--r)',
                  border: '1px solid var(--border)',
                  gap: 12,
                }}>
                  <span style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, flex: 1, minWidth: 0 }}>{row.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
                        {row.yours}{row.unit}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500 }}>Your company</div>
                    </div>
                    <div style={{ width: 1, height: 28, background: 'var(--border)', flexShrink: 0 }} />
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text3)', fontFamily: 'var(--font-display)' }}>
                        {row.industry}{row.unit}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500 }}>Industry avg</div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 68 }}>
                      {absDiff < 1 ? (
                        <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>= avg</span>
                      ) : (
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          color: deltaColor,
                          display: 'inline-flex', alignItems: 'center', gap: 3,
                        }}>
                          <i className={`fa-solid fa-arrow-${isPositive ? 'up' : 'down'}`} style={{ fontSize: 8 }} />
                          {absDiff.toFixed(0)}{row.unit}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* KPI Row */}
        <div className="kpi-row">
          <div className="kpi-card">
            <div className="kpi-icon blue">
              <i className="fa-solid fa-route" aria-hidden="true" />
            </div>
            <div className="kpi-value">{activeJourneys.length}</div>
            <div className="kpi-label">{t('hr.analytics.totalJourneys')}</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon green">
              <i className="fa-solid fa-circle-check" aria-hidden="true" />
            </div>
            <div className="kpi-value">{onTrackPct}%</div>
            <div className="kpi-label">{t('hr.analytics.onTrack')}</div>
            <div style={{ marginTop: 4 }}>
              <BenchmarkBadge actual={taskCompletionRate} benchmark={INDUSTRY_BENCHMARKS.taskCompletion} />
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-icon cyan">
              <i className="fa-solid fa-list-check" aria-hidden="true" />
            </div>
            <div className="kpi-value">{completedTasks}</div>
            <div className="kpi-label">{t('hr.analytics.totalTasks')}</div>
            <div style={{ marginTop: 4 }}>
              <BenchmarkBadge actual={checkInCompletionRate} benchmark={INDUSTRY_BENCHMARKS.checkInCompletion} />
            </div>
          </div>

          <div className="kpi-card">
            <div
            className={`kpi-icon ${atRisk > 0 ? 'red' : 'green'}`}
            onClick={() => atRisk > 0 && setDrillThrough({ title: 'At-Risk Journeys', journeys: activeJourneys.filter(j => j.risk_score > 60).map(j => ({ id: j.id, name: j.employee?.full_name ?? 'Unknown', department: j.employee?.department ?? '—', riskScore: j.risk_score ?? 0, week: j.current_week ?? 1, employeeId: j.employee?.id })) })}
            style={{ cursor: atRisk > 0 ? 'pointer' : 'default' }}
          >
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
            </div>
            <div className="kpi-value" style={{ cursor: atRisk > 0 ? 'pointer' : 'default' }} onClick={() => atRisk > 0 && setDrillThrough({ title: 'At-Risk Journeys', journeys: activeJourneys.filter(j => j.risk_score > 60).map(j => ({ id: j.id, name: j.employee?.full_name ?? 'Unknown', department: j.employee?.department ?? '—', riskScore: j.risk_score ?? 0, week: j.current_week ?? 1, employeeId: j.employee?.id })) })}>{atRisk}</div>
            <div className="kpi-label">{t('hr.analytics.atRisk')}</div>
            <div style={{ marginTop: 4 }}>
              <BenchmarkBadge actual={atRiskRatePct} benchmark={INDUSTRY_BENCHMARKS.atRiskRate} higherIsBetter={false} />
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="db-card" style={{ padding: '4px 8px', display: 'flex', gap: 2 }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 14px', borderRadius: 'var(--r)',
                border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                background: activeTab === tab.id ? 'var(--grad-soft)' : 'transparent',
                color: activeTab === tab.id ? 'var(--blue)' : 'var(--text3)',
                transition: 'all 0.15s', position: 'relative',
              }}
            >
              <i className={tab.icon} style={{ fontSize: 11 }} />
              {tab.label}
              {tab.badge !== undefined && (
                <span style={{
                  fontSize: 9, fontWeight: 800, padding: '1px 5px',
                  borderRadius: 100, background: 'var(--red)', color: '#fff',
                  lineHeight: 1.4,
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {/* ── OVERVIEW TAB ──────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="db-grid-2col" style={{ gap: 20 }}>
                {/* Journey health breakdown */}
                <div className="db-card" style={{ padding: '20px 24px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="fa-solid fa-heart-pulse" style={{ color: 'var(--blue)', fontSize: 13 }} />
                    {t('hr.analytics.journeyHealth')}
                  </div>
                  {[
                    { label: t('hr.analytics.onTrack'),   filter: (j: Journey) => j.risk_score <= 30,                         src: activeJourneys,   color: 'var(--green)',  bg: 'var(--green-bg)' },
                    { label: 'Needs Attention', filter: (j: Journey) => j.risk_score > 30 && j.risk_score <= 60,              src: activeJourneys,   color: 'var(--amber)',  bg: 'var(--amber-bg)' },
                    { label: t('hr.analytics.atRisk'),    filter: (j: Journey) => j.risk_score > 60,                         src: activeJourneys,   color: 'var(--red)',    bg: 'var(--red-bg)'   },
                    { label: t('hr.analytics.completed'), filter: (_j: Journey) => true,                                       src: completedJourneys, color: 'var(--blue)',  bg: 'var(--blue-light)' },
                  ].map(row => {
                    const matched = row.src.filter(row.filter)
                    return (
                    <div
                      key={row.label}
                      onClick={() => matched.length > 0 && setDrillThrough({ title: row.label, journeys: matched.map(j => ({ id: j.id, name: j.employee?.full_name ?? 'Unknown', department: j.employee?.department ?? '—', riskScore: j.risk_score ?? 0, week: j.current_week ?? 1, employeeId: j.employee?.id })) })}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, cursor: matched.length > 0 ? 'pointer' : 'default', borderRadius: 'var(--r)', padding: '4px 6px', margin: '0 -6px 8px', transition: 'background 0.15s' }}
                      onMouseEnter={e => { if (matched.length > 0) e.currentTarget.style.background = 'var(--surface2)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: row.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, color: 'var(--text2)' }}>{row.label}</span>
                      {matched.length > 0 && <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: 9, color: 'var(--text3)' }} />}
                      <span style={{
                        fontSize: 12, fontWeight: 800, padding: '2px 10px',
                        borderRadius: 100, color: row.color, background: row.bg,
                      }}>
                        {matched.length}
                      </span>
                    </div>
                  )})}
                  <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />
                  <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{journeys.length} total employees</span>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: 11, color: 'var(--blue)', padding: '2px 6px' }}
                      onClick={() => setActiveTab('risk')}
                    >
                      View Risk Details <i className="fa-solid fa-arrow-right" />
                    </button>
                  </div>
                </div>

                {/* Weekly completion chart */}
                <div className="db-card" style={{ padding: '20px 24px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="fa-solid fa-chart-bar" style={{ color: 'var(--cyan)', fontSize: 13 }} />
                    {t('hr.analytics.taskProgress')}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {weekData.map(w => (
                      <div key={w.week} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', minWidth: 48, flexShrink: 0 }}>
                          Week {w.week}
                        </span>
                        <div style={{ flex: 1, height: 7, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 100,
                            width: `${w.rate}%`,
                            background: w.rate < 50 ? 'var(--amber)' : w.rate === 100 ? 'var(--green)' : 'var(--grad)',
                            transition: 'width 0.5s ease',
                          }} />
                        </div>
                        <span style={{
                          fontSize: 10, fontWeight: 700, minWidth: 32, textAlign: 'right',
                          color: w.rate < 50 ? 'var(--amber)' : 'var(--text2)',
                        }}>
                          {w.total > 0 ? `${w.rate}%` : '—'}
                        </span>
                      </div>
                    ))}
                    {tasks.length === 0 && (
                      <p style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '16px 0' }}>
                        No task data yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* Check-in snapshot */}
                <div className="db-card" style={{ padding: '20px 24px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                    <span><i className="fa-solid fa-calendar-check" style={{ color: 'var(--aqua)', fontSize: 13, marginRight: 8 }} />{t('hr.analytics.upcomingCheckIns')}</span>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, color: 'var(--blue)', padding: '2px 6px' }} onClick={() => setActiveTab('checkins')}>
                      View All <i className="fa-solid fa-arrow-right" />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                    {[
                      { label: 'Total',     value: checkIns.length,    color: 'var(--text2)' },
                      { label: 'Done',      value: completedCI.length, color: 'var(--green)' },
                      { label: 'Overdue',   value: overdueCI.length,   color: overdueCI.length > 0 ? 'var(--red)' : 'var(--text3)' },
                    ].map(s => (
                      <div key={s.label} style={{ flex: 1, textAlign: 'center', padding: '10px 8px', background: 'var(--bg)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
                        <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                  {overdueCI.length > 0 && (
                    <div style={{ background: 'var(--red-bg)', borderRadius: 'var(--r)', padding: '10px 12px', fontSize: 12, color: 'var(--red)' }}>
                      <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }} />
                      {overdueCI.length} overdue check-in{overdueCI.length > 1 ? 's need' : ' needs'} immediate attention.
                    </div>
                  )}
                </div>

                {/* Feedback snapshot */}
                <div className="db-card" style={{ padding: '20px 24px' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                    <span><i className="fa-solid fa-star" style={{ color: 'var(--amber)', fontSize: 13, marginRight: 8 }} />{t('hr.analytics.feedbackSummary')}</span>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, color: 'var(--blue)', padding: '2px 6px' }} onClick={() => setActiveTab('feedback')}>
                      View All <i className="fa-solid fa-arrow-right" />
                    </button>
                  </div>
                  {feedback.length > 0 ? (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: 36, fontWeight: 800, lineHeight: 1,
                            fontFamily: 'var(--font-display)', color: 'var(--amber)',
                          }}>
                            {avgRating}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, marginTop: 4 }}>out of 5</div>
                          <div style={{ marginTop: 6 }}>
                            <BenchmarkBadge actual={avgRating} benchmark={INDUSTRY_BENCHMARKS.avgFeedbackRating} unit="/5" />
                          </div>
                        </div>
                        <div>
                          <StarRow rating={Math.round(avgRating)} size={14} />
                          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>
                            Based on {feedback.length} response{feedback.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      {/* Distribution */}
                      {[5, 4, 3, 2, 1].map(star => {
                        const count = feedback.filter(f => f.rating === star).length
                        const pct   = feedback.length > 0 ? Math.round((count / feedback.length) * 100) : 0
                        return (
                          <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                            <span style={{ fontSize: 10, color: 'var(--text3)', minWidth: 10 }}>{star}</span>
                            <i className="fa-solid fa-star" style={{ fontSize: 9, color: 'var(--amber)', flexShrink: 0 }} />
                            <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--amber)', borderRadius: 100 }} />
                            </div>
                            <span style={{ fontSize: 10, color: 'var(--text3)', minWidth: 24, textAlign: 'right' }}>{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <i className="fa-solid fa-comment-slash" style={{ fontSize: 24, color: 'var(--text3)', display: 'block', marginBottom: 8 }} />
                      <p style={{ fontSize: 13, color: 'var(--text3)' }}>No feedback yet.</p>
                    </div>
                  )}
                </div>

                {/* Risk Score Trend chart — full width */}
                <div className="db-card" style={{ padding: '20px 24px', gridColumn: '1 / -1' }}>
                  <div className="db-card-hd">
                    <h3><i className="fa-solid fa-chart-line" style={{ color: 'var(--blue)' }} /> Risk Score Trend</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={riskTrendData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                      <defs>
                        <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.18} />
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E4E9F2" />
                      <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#8893A8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#8893A8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #E4E9F2', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                      <Area type="monotone" dataKey="avg" stroke="#EF4444" strokeWidth={2} fill="url(#riskGrad)" name="Avg Risk Score" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* ── Team Morale Trend ──────────────────────────────── */}
                {pulseTrendData.length > 0 && (
                  <div className="db-card" style={{ padding: '20px 24px', gridColumn: '1 / -1' }}>
                    <div className="db-card-hd">
                      <h3><i className="fa-solid fa-face-smile" style={{ color: 'var(--green)' }} /> Team Morale Trend</h3>
                      <span className="badge-ai">Pulse Data</span>
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={pulseTrendData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E4E9F2" />
                        <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#8893A8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#8893A8' }} axisLine={false} tickLine={false} domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #E4E9F2', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} formatter={(v) => [`${v}/5`, 'Avg Mood']} />
                        <Line type="monotone" dataKey="avgMood" stroke="#22C55E" strokeWidth={2} dot={{ fill: '#22C55E', r: 4 }} name="Avg Mood" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* ── RISK TAB ──────────────────────────────────────────── */}
            {activeTab === 'risk' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {activeJourneys.length === 0 ? (
                  <div className="db-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <i className="fa-solid fa-circle-check" style={{ fontSize: 32, color: 'var(--green)', display: 'block', marginBottom: 12 }} />
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>All Clear</div>
                    <div style={{ fontSize: 13, color: 'var(--text3)' }}>No active journeys to display.</div>
                  </div>
                ) : (
                  [...activeJourneys]
                    .sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0))
                    .map(j => (
                      <RiskScoreCard
                        key={j.id}
                        employeeName={j.employee?.full_name || 'Unknown'}
                        department={j.employee?.department || ''}
                        score={j.risk_score ?? 0}
                        currentWeek={j.current_week ?? 1}
                        reasons={j.risk_reasons || []}
                        avatarUrl={j.employee?.avatar_url}
                        employeeId={j.employee?.id}
                        onViewJourney={() => router.push(`/hr/employees/${j.employee?.id}`)}
                      />
                    ))
                )}
              </div>
            )}

            {/* ── CHECK-INS TAB ─────────────────────────────────────── */}
            {activeTab === 'checkins' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Sub-summary */}
                <div style={{ display: 'flex', gap: 12 }}>
                  {[
                    { label: 'Total',     value: checkIns.length,    icon: 'fa-solid fa-calendar',         color: 'var(--text2)',  bg: 'var(--surface)' },
                    { label: 'Completed', value: completedCI.length, icon: 'fa-solid fa-circle-check',     color: 'var(--green)', bg: 'var(--green-bg)' },
                    { label: 'Upcoming',  value: upcomingCI.length,  icon: 'fa-solid fa-calendar-clock',   color: 'var(--blue)',  bg: 'var(--blue-light)' },
                    { label: 'Overdue',   value: overdueCI.length,   icon: 'fa-solid fa-triangle-exclamation', color: 'var(--red)',   bg: 'var(--red-bg)' },
                  ].map(s => (
                    <div key={s.label} style={{
                      flex: 1, padding: '14px 16px', borderRadius: 'var(--r-xl)',
                      background: s.bg, border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <i className={s.icon} style={{ fontSize: 14, color: s.color }} />
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
                        <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>{s.label}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Overdue section */}
                {overdueCI.length > 0 && (
                  <div className="db-card" style={{ overflow: 'hidden', padding: 0 }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--red-bg)' }}>
                      <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--red)', fontSize: 12 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--red)' }}>Overdue ({overdueCI.length})</span>
                    </div>
                    {overdueCI.map((ci, i) => (
                      <CheckInRow key={ci.id} ci={ci} isLast={i === overdueCI.length - 1} isOverdue />
                    ))}
                  </div>
                )}

                {/* Upcoming section */}
                {upcomingCI.length > 0 && (
                  <div className="db-card" style={{ overflow: 'hidden', padding: 0 }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fa-solid fa-calendar-clock" style={{ color: 'var(--blue)', fontSize: 12 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>Upcoming ({upcomingCI.length})</span>
                    </div>
                    {upcomingCI.map((ci, i) => (
                      <CheckInRow key={ci.id} ci={ci} isLast={i === upcomingCI.length - 1} />
                    ))}
                  </div>
                )}

                {/* Completed section */}
                {completedCI.length > 0 && (
                  <div className="db-card" style={{ overflow: 'hidden', padding: 0 }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fa-solid fa-circle-check" style={{ color: 'var(--green)', fontSize: 12 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>Completed ({completedCI.length})</span>
                    </div>
                    {completedCI.map((ci, i) => (
                      <CheckInRow key={ci.id} ci={ci} isLast={i === completedCI.length - 1} isDone />
                    ))}
                  </div>
                )}

                {checkIns.length === 0 && (
                  <div className="db-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <i className="fa-solid fa-calendar-check" style={{ fontSize: 32, color: 'var(--text3)', display: 'block', marginBottom: 12 }} />
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>No check-ins yet</div>
                    <div style={{ fontSize: 13, color: 'var(--text3)' }}>Check-ins will appear here once journeys are active.</div>
                  </div>
                )}
              </div>
            )}

            {/* ── FEEDBACK TAB ──────────────────────────────────────── */}
            {activeTab === 'feedback' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {feedback.length > 0 ? (
                  <>
                    {/* Score summary card */}
                    <div className="db-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 24 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{
                          fontSize: 48, fontWeight: 800, lineHeight: 1,
                          fontFamily: 'var(--font-display)', color: 'var(--amber)',
                        }}>
                          {avgRating}
                        </div>
                        <StarRow rating={Math.round(avgRating)} size={16} />
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
                          {feedback.length} response{feedback.length !== 1 ? 's' : ''}
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <BenchmarkBadge actual={avgRating} benchmark={INDUSTRY_BENCHMARKS.avgFeedbackRating} unit="/5" />
                        </div>
                      </div>
                      <div style={{ flex: 1, borderLeft: '1px solid var(--border)', paddingLeft: 24 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 10 }}>{t('hr.analytics.avgRating')}</div>
                        {[5, 4, 3, 2, 1].map(star => {
                          const count = feedback.filter(f => f.rating === star).length
                          const pct   = Math.round((count / feedback.length) * 100)
                          return (
                            <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <span style={{ fontSize: 11, color: 'var(--text3)', minWidth: 8 }}>{star}</span>
                              <i className="fa-solid fa-star" style={{ fontSize: 9, color: 'var(--amber)', flexShrink: 0 }} />
                              <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: 'var(--amber)', borderRadius: 100, transition: 'width 0.5s ease' }} />
                              </div>
                              <span style={{ fontSize: 10, color: 'var(--text3)', minWidth: 40, textAlign: 'right' }}>{count} ({pct}%)</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Individual responses */}
                    <div className="db-card" style={{ overflow: 'hidden', padding: 0 }}>
                      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>All Responses</span>
                      </div>
                      {feedback.map((f, i) => (
                        <div
                          key={f.id}
                          style={{
                            padding: '16px 20px',
                            borderBottom: i < feedback.length - 1 ? '1px solid var(--border)' : 'none',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: '50%',
                                background: 'var(--grad-soft)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                              }}>
                                <i className="fa-solid fa-user" style={{ fontSize: 12, color: 'var(--blue)' }} />
                              </div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                                  {f.employee?.full_name || 'Anonymous'}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                                  {MILESTONE_LABELS[f.milestone] || f.milestone} · {fmtDate(f.created_at)}
                                </div>
                              </div>
                            </div>
                            <StarRow rating={f.rating} size={12} />
                          </div>
                          {f.comments && (
                            <div style={{
                              fontSize: 13, color: 'var(--text2)', lineHeight: 1.6,
                              padding: '10px 14px', background: 'var(--bg)',
                              borderRadius: 'var(--r)', borderLeft: '3px solid var(--blue-light)',
                              fontStyle: 'italic',
                            }}>
                              &ldquo;{f.comments}&rdquo;
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="db-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
                    <i className="fa-solid fa-comment-slash" style={{ fontSize: 32, color: 'var(--text3)', display: 'block', marginBottom: 12 }} />
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>No feedback yet</div>
                    <div style={{ fontSize: 13, color: 'var(--text3)' }}>Feedback will appear here once employees complete surveys.</div>
                  </div>
                )}
              </div>
            )}
            {/* ── COHORT TAB ────────────────────────────────────────── */}
            {activeTab === 'cohort' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Section A: Hiring Cohorts Comparison */}
                <div className="db-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="db-card-hd" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                    <h3>
                      <i className="fa-solid fa-users-rectangle" style={{ color: 'var(--blue)' }} />
                      Hiring Cohorts Comparison
                    </h3>
                  </div>
                  <div className="emp-tbl-wrap">
                    <table className="emp-tbl">
                      <thead>
                        <tr>
                          <th>Cohort</th>
                          <th>Hired</th>
                          <th>Avg Progress</th>
                          <th>At Risk</th>
                          <th>Completed</th>
                          <th>Avg Days to Productive</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(cohortDataProp?.length ? cohortDataProp : COHORT_DATA).map(row => {
                          const daysColor = row.avgDays < 35
                            ? 'var(--green)'
                            : row.avgDays <= 42
                              ? 'var(--amber)'
                              : 'var(--red)'
                          const daysBg = row.avgDays < 35
                            ? 'var(--green-bg)'
                            : row.avgDays <= 42
                              ? 'var(--amber-bg)'
                              : 'var(--red-bg)'
                          return (
                            <tr key={row.label}>
                              <td style={{ fontWeight: 700, color: 'var(--text)', fontSize: 13 }}>{row.label}</td>
                              <td>
                                <span style={{ fontWeight: 700, color: 'var(--text2)' }}>{row.hired}</span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div className="pw" style={{ width: 80, flexShrink: 0 }}>
                                    <div className="pf" style={{ width: `${row.avgProgress}%` }} />
                                  </div>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>{row.avgProgress}%</span>
                                </div>
                              </td>
                              <td>
                                {row.atRisk > 0 ? (
                                  <span style={{
                                    fontSize: 12, fontWeight: 800, padding: '2px 10px',
                                    borderRadius: 100, color: 'var(--amber)', background: 'var(--amber-bg)',
                                  }}>
                                    {row.atRisk}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>—</span>
                                )}
                              </td>
                              <td>
                                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>{row.completed}</span>
                              </td>
                              <td>
                                <span style={{
                                  fontSize: 12, fontWeight: 800, padding: '3px 10px',
                                  borderRadius: 100, color: daysColor, background: daysBg,
                                }}>
                                  {row.avgDays} days
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section B: Department Performance */}
                <div className="db-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="db-card-hd" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                    <h3>
                      <i className="fa-solid fa-building" style={{ color: 'var(--cyan)' }} />
                      Department Performance
                    </h3>
                  </div>
                  <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {(deptDataProp?.length ? deptDataProp : DEPT_DATA).map(dept => {
                      const barColor = dept.progress >= 85
                        ? 'var(--green)'
                        : dept.progress >= 70
                          ? 'var(--grad)'
                          : 'var(--amber)'
                      return (
                        <div key={dept.name} style={{
                          padding: '14px 16px',
                          background: 'var(--bg)',
                          borderRadius: 'var(--r-xl)',
                          border: '1px solid var(--border)',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{dept.name}</span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text2)' }}>{dept.progress}%</span>
                          </div>
                          <div className="pw" style={{ marginBottom: 10 }}>
                            <div className="pf" style={{ width: `${dept.progress}%`, background: barColor }} />
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {dept.atRisk > 0 ? (
                              <span style={{
                                fontSize: 10, fontWeight: 700, padding: '2px 8px',
                                borderRadius: 100, color: 'var(--amber)', background: 'var(--amber-bg)',
                              }}>
                                {dept.atRisk} at-risk
                              </span>
                            ) : (
                              <span style={{
                                fontSize: 10, fontWeight: 700, padding: '2px 8px',
                                borderRadius: 100, color: 'var(--green)', background: 'var(--green-bg)',
                              }}>
                                0 at-risk
                              </span>
                            )}
                            <span style={{
                              fontSize: 10, fontWeight: 600, padding: '2px 8px',
                              borderRadius: 100, color: 'var(--text3)', background: 'var(--surface)',
                              border: '1px solid var(--border)',
                            }}>
                              Avg week {dept.avgWeek}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Section C: Manager Effectiveness */}
                <div className="db-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="db-card-hd" style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                    <h3>
                      <i className="fa-solid fa-ranking-star" style={{ color: 'var(--violet)' }} />
                      Manager Effectiveness
                    </h3>
                  </div>
                  <div style={{ padding: '8px 0' }}>
                    {(managerDataProp?.length ? managerDataProp : MANAGER_DATA).map((mgr, idx) => {
                      const trendConfig: Record<ManagerRow['trend'], { icon: string; label: string; color: string; bg: string }> = {
                        top:     { icon: '↑', label: 'Top performer',  color: 'var(--green)',  bg: 'var(--green-bg)'  },
                        good:    { icon: '✓', label: 'On track',       color: 'var(--blue)',   bg: 'var(--blue-light)' },
                        support: { icon: '↓', label: 'Needs support',  color: 'var(--amber)',  bg: 'var(--amber-bg)'  },
                        risk:    { icon: '⚠', label: 'At risk',        color: 'var(--red)',    bg: 'var(--red-bg)'    },
                      }
                      const tc = trendConfig[mgr.trend]
                      const scoreColor = mgr.successRate >= 85
                        ? 'var(--green)'
                        : mgr.successRate >= 70
                          ? 'var(--blue)'
                          : mgr.successRate >= 60
                            ? 'var(--amber)'
                            : 'var(--red)'
                      return (
                        <div key={mgr.name} style={{
                          display: 'flex', alignItems: 'center', gap: 14,
                          padding: '14px 20px',
                          borderBottom: idx < (managerDataProp?.length ? managerDataProp : MANAGER_DATA).length - 1 ? '1px solid var(--border)' : 'none',
                        }}>
                          <span style={{
                            fontSize: 11, fontWeight: 800, color: 'var(--text3)',
                            minWidth: 20, textAlign: 'center',
                          }}>
                            #{idx + 1}
                          </span>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={mgr.avatar}
                            alt={mgr.name}
                            width={36}
                            height={36}
                            style={{ borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{mgr.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
                              {mgr.hires} hire{mgr.hires !== 1 ? 's' : ''}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: scoreColor, fontFamily: 'var(--font-display)' }}>
                              {mgr.successRate}% success
                            </span>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 8px',
                              borderRadius: 100, color: tc.color, background: tc.bg,
                            }}>
                              {tc.icon} {tc.label}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* ── ROI TAB ───────────────────────────────────────────── */}
            {activeTab === 'roi' && (() => {
              const dailyRate               = roiSalary / 260
              const onboardingCostReduction = roiHires * roiCostPerHire * 0.18        // 18% saved per structured program
              const productivityGain        = roiHires * Math.max(0, roiTimeToFill - 28) * dailyRate  // days saved vs 28-day baseline
              const turnoverPrevention      = roiHires * (roiTurnoverPct / 100) * roiSalary * 0.5     // each turnover = 50% salary
              const totalRoi                = onboardingCostReduction + productivityGain + turnoverPrevention

              function fmtMoney(n: number) {
                return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
              }

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                  {/* KPI Cards */}
                  <div className="db-grid-kpi3">
                    {[
                      {
                        icon: 'fa-solid fa-sack-dollar',
                        colorClass: 'green',
                        label: 'Estimated ROI',
                        value: fmtMoney(totalRoi),
                        sub: `${roiHires} hires · structured program`,
                      },
                      {
                        icon: 'fa-solid fa-clock',
                        colorClass: 'blue',
                        label: 'Time to Productivity',
                        value: `${avgTTPDays} days avg`,
                        sub: avgTTPDays < INDUSTRY_AVG_DAYS ? `−${INDUSTRY_AVG_DAYS - avgTTPDays} days vs industry` : `+${avgTTPDays - INDUSTRY_AVG_DAYS} days vs industry`,
                      },
                      {
                        icon: 'fa-solid fa-chart-line',
                        colorClass: 'cyan',
                        label: 'Retention Impact',
                        value: atRiskRatePct <= INDUSTRY_BENCHMARKS.atRiskRate ? `+${INDUSTRY_BENCHMARKS.atRiskRate - atRiskRatePct}pp better` : `−${atRiskRatePct - INDUSTRY_BENCHMARKS.atRiskRate}pp vs industry`,
                        sub: `${atRisk} active at-risk hire${atRisk !== 1 ? 's' : ''}`,
                      },
                    ].map(k => (
                      <div key={k.label} className="kpi-card">
                        <div className={`kpi-icon ${k.colorClass}`}>
                          <i className={k.icon} aria-hidden="true" />
                        </div>
                        <div className="kpi-value" style={{ fontSize: 18 }}>{k.value}</div>
                        <div className="kpi-label">{k.label}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{k.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* ROI Calculator */}
                  <div className="db-card" style={{ padding: '24px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fa-solid fa-calculator" style={{ color: 'var(--blue)', fontSize: 13 }} />
                      Estimated Annual Impact
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text3)', margin: '0 0 20px' }}>
                      Adjust your inputs to estimate the value of your onboarding program.
                    </p>

                    {/* Inputs */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                      {/* Salary */}
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Avg Employee Salary
                        </label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text3)', pointerEvents: 'none' }}>$</span>
                          <input
                            type="number" min={20000} max={500000} step={1000}
                            value={roiSalary}
                            onChange={e => setRoiSalary(Math.max(0, Number(e.target.value)))}
                            style={{ width: '100%', padding: '10px 12px 10px 24px', border: '1px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                      {/* Hires per year */}
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          New Hires / Year
                        </label>
                        <input
                          type="number" min={1} max={500} step={1}
                          value={roiHires}
                          onChange={e => setRoiHires(Math.max(1, Number(e.target.value)))}
                          style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', boxSizing: 'border-box' }}
                        />
                      </div>
                      {/* Cost per hire */}
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Cost Per Hire
                          <span style={{ fontSize: 9, marginLeft: 4, color: 'var(--text3)', fontWeight: 500, textTransform: 'none' }}>(SHRM avg $4,700)</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text3)', pointerEvents: 'none' }}>$</span>
                          <input
                            type="number" min={500} max={100000} step={100}
                            value={roiCostPerHire}
                            onChange={e => setRoiCostPerHire(Math.max(0, Number(e.target.value)))}
                            style={{ width: '100%', padding: '10px 12px 10px 24px', border: '1px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>
                      {/* Time to fill */}
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          Avg Time to Fill
                          <span style={{ fontSize: 9, marginLeft: 4, color: 'var(--text3)', fontWeight: 500, textTransform: 'none' }}>(days, industry 42)</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="number" min={1} max={365} step={1}
                            value={roiTimeToFill}
                            onChange={e => setRoiTimeToFill(Math.max(1, Number(e.target.value)))}
                            style={{ width: '100%', padding: '10px 42px 10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', boxSizing: 'border-box' }}
                          />
                          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text3)', pointerEvents: 'none' }}>days</span>
                        </div>
                      </div>
                      {/* Turnover */}
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          First-Year Turnover
                          <span style={{ fontSize: 9, marginLeft: 4, color: 'var(--text3)', fontWeight: 500, textTransform: 'none' }}>(industry avg 15%)</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="number" min={0} max={100} step={1}
                            value={roiTurnoverPct}
                            onChange={e => setRoiTurnoverPct(Math.min(100, Math.max(0, Number(e.target.value))))}
                            style={{ width: '100%', padding: '10px 36px 10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--bg)', color: 'var(--text)', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', boxSizing: 'border-box' }}
                          />
                          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text3)', pointerEvents: 'none' }}>%</span>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                      {[
                        { label: 'Onboarding cost reduction',   value: onboardingCostReduction, note: '18% reduction in cost-per-hire via structured program' },
                        { label: 'Productivity gain',           value: productivityGain,         note: `${Math.max(0, roiTimeToFill - 28)} days faster ramp vs 28-day baseline × daily rate` },
                        { label: 'Turnover prevention savings', value: turnoverPrevention,       note: `${roiTurnoverPct}% turnover, each worth 50% of salary to replace` },
                      ].map(row => (
                        <div key={row.label} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '10px 14px',
                          background: 'var(--bg)', borderRadius: 'var(--r)',
                          border: '1px solid var(--border)',
                        }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>{row.label}</div>
                            <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>{row.note}</div>
                          </div>
                          <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--green)', fontFamily: 'var(--font-display)', flexShrink: 0, marginLeft: 16 }}>
                            {fmtMoney(row.value)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Total ROI banner */}
                    <div style={{
                      background: 'var(--grad-soft)',
                      border: '1px solid var(--blue-light)',
                      borderRadius: 'var(--r-xl)',
                      padding: '16px 20px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                          Your estimated annual ROI
                        </div>
                        <div style={{
                          fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)',
                          background: 'var(--grad)', WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                        }}>
                          {fmtMoney(totalRoi)}
                        </div>
                      </div>
                      <i className="fa-solid fa-trophy" style={{ fontSize: 32, color: 'var(--amber)', flexShrink: 0 }} />
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text3)', margin: '10px 0 0', textAlign: 'center' }}>
                      Estimates based on SHRM research benchmarks
                    </p>
                  </div>

                  {/* Time-to-Productivity Trend */}
                  <div className="db-card" style={{ padding: '20px 24px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fa-solid fa-arrow-trend-down" style={{ color: 'var(--green)', fontSize: 13 }} />
                      Time-to-Productivity Trend
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {PRODUCTIVITY_TREND.map((q, i) => {
                        const pct = Math.round((q.days / 60) * 100)
                        const isCurrent = i === PRODUCTIVITY_TREND.length - 1
                        return (
                          <div key={q.quarter} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', minWidth: 56, flexShrink: 0 }}>
                              {q.quarter}
                            </span>
                            <div style={{ flex: 1, height: 10, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', borderRadius: 100,
                                width: `${pct}%`,
                                background: isCurrent ? 'var(--green)' : 'var(--grad)',
                                transition: 'width 0.5s ease',
                              }} />
                            </div>
                            <span style={{
                              fontSize: 11, fontWeight: 700, minWidth: 56, textAlign: 'right',
                              color: isCurrent ? 'var(--green)' : 'var(--text2)',
                            }}>
                              {q.days} days{isCurrent ? ' ← Current' : ''}
                            </span>
                          </div>
                        )
                      })}
                      {/* Industry avg line */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', minWidth: 56, flexShrink: 0 }}>
                          Industry
                        </span>
                        <div style={{ flex: 1, height: 2, background: 'var(--amber)', borderRadius: 100, position: 'relative' }}>
                          <div style={{
                            position: 'absolute', top: '50%', left: `${Math.round((INDUSTRY_AVG_DAYS / 60) * 100)}%`,
                            transform: 'translate(-50%, -50%)',
                            width: 8, height: 8, borderRadius: '50%',
                            background: 'var(--amber)', flexShrink: 0,
                          }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, minWidth: 56, textAlign: 'right', color: 'var(--amber)' }}>
                          {INDUSTRY_AVG_DAYS} days avg
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Engagement Score Impact */}
                  <div className="db-card" style={{ padding: '20px 24px' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <i className="fa-solid fa-heart-pulse" style={{ color: 'var(--red)', fontSize: 13 }} />
                      Engagement Score Impact
                    </div>
                    <div className="db-grid-kpi3">
                      {[
                        { label: '30-Day Engagement', value: 78,    suffix: '',  delta: '↑6 pts',  color: 'var(--blue)'  },
                        { label: '60-Day Confidence',  value: 82,    suffix: '',  delta: '↑9 pts',  color: 'var(--cyan)'  },
                        { label: '90-Day Retention',   value: '94%', suffix: '',  delta: '↑3%',     color: 'var(--green)' },
                      ].map(tile => (
                        <div key={tile.label} style={{
                          textAlign: 'center', padding: '20px 16px',
                          background: 'var(--bg)', borderRadius: 'var(--r-xl)',
                          border: '1px solid var(--border)',
                        }}>
                          <div style={{
                            fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)',
                            color: tile.color, lineHeight: 1, marginBottom: 6,
                          }}>
                            {tile.value}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>
                            {tile.label}
                          </div>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '2px 8px',
                            borderRadius: 100, color: 'var(--green)', background: 'var(--green-bg)',
                          }}>
                            {tile.delta}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )
            })()}

          </motion.div>
        </AnimatePresence>
      </div>

      {drillThrough && (
        <DrillThroughModal
          title={drillThrough.title}
          journeys={drillThrough.journeys}
          onClose={() => setDrillThrough(null)}
        />
      )}
    </>
  )
}

// ── CheckInRow sub-component ───────────────────────────────────────────────

function CheckInRow({ ci, isLast, isOverdue, isDone }: { ci: CheckIn; isLast: boolean; isOverdue?: boolean; isDone?: boolean }) {
  const { t } = useT()
  const color = isOverdue ? 'var(--red)' : isDone ? 'var(--green)' : 'var(--blue)'
  const icon  = isOverdue ? 'fa-solid fa-triangle-exclamation' : isDone ? 'fa-solid fa-circle-check' : 'fa-solid fa-calendar-clock'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 20px',
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
    }}>
      <i className={icon} style={{ color, fontSize: 13, flexShrink: 0, width: 16, textAlign: 'center' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
          {MILESTONE_LABELS[ci.milestone] || ci.milestone} Check-in
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
          {ci.journey?.employee?.full_name || 'Unknown'} · {ci.journey?.employee?.department || ''}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: isOverdue ? 'var(--red)' : 'var(--text3)', fontWeight: isOverdue ? 700 : 400 }}>
          {isDone ? `Done ${new Date(ci.completed_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : new Date(ci.scheduled_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 1 }}>
          {t('hr.analytics.manager')}: {ci.manager?.full_name || '—'}
        </div>
      </div>
    </div>
  )
}
