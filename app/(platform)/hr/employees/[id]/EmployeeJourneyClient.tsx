'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Employee {
  id: string
  full_name: string
  email: string
  role: string
  department: string | null
  avatar_url: string | null
  phone: string | null
  bio: string | null
  created_at: string
}

interface Journey {
  id: string
  status: string
  current_week: number
  risk_score: number
  sentiment_score: number
  start_date: string
  progress?: number
}

interface Task {
  id: string
  title: string
  week: number
  status: string
  assigned_to_role: string
  description: string
}

interface Props {
  employee: Employee
  journey: Journey | null
  tasks: Task[]
}

const STATUS_COLOR: Record<string, string> = {
  completed:   'var(--green)',
  in_progress: 'var(--blue)',
  at_risk:     'var(--red)',
  not_started: 'var(--text3)',
}

const STATUS_LABEL: Record<string, string> = {
  completed:   'Completed',
  in_progress: 'In Progress',
  at_risk:     'At Risk',
  not_started: 'Not Started',
}

const ROLE_COLOR: Record<string, string> = {
  new_hire: 'var(--blue)',
  manager:  'var(--cyan)',
  hr:       'var(--violet)',
}

function getRiskLabel(score: number) {
  if (score >= 70) return { label: 'High Risk', color: 'var(--red)', bg: 'var(--red-bg)' }
  if (score >= 40) return { label: 'Medium', color: 'var(--amber)', bg: 'var(--amber-bg)' }
  return { label: 'On Track', color: 'var(--green)', bg: 'var(--green-bg)' }
}

function getSentimentLabel(score: number) {
  if (score >= 80) return { emoji: '😊', label: 'High', color: 'var(--green)' }
  if (score >= 50) return { emoji: '😐', label: 'Neutral', color: 'var(--amber)' }
  return { emoji: '😟', label: 'Low', color: 'var(--red)' }
}

export default function EmployeeJourneyClient({ employee, journey, tasks }: Props) {
  const [activeWeek, setActiveWeek] = useState<number | 'all'>('all')

  const weeks = [...new Set(tasks.map(t => t.week))].sort((a, b) => a - b)
  const visibleTasks = activeWeek === 'all' ? tasks : tasks.filter(t => t.week === activeWeek)

  const completedCount = tasks.filter(t => t.status === 'completed').length
  const progress = journey?.progress ?? (tasks.length > 0 ? Math.round(completedCount / tasks.length * 100) : 0)
  const risk     = getRiskLabel(journey?.risk_score ?? 0)
  const sentiment = getSentimentLabel(journey?.sentiment_score ?? 0)

  const daysSinceStart = journey?.start_date
    ? Math.floor((Date.now() - new Date(journey.start_date).getTime()) / 86400000)
    : 0

  return (
    <>
      {/* Back */}
      <div className="db-header" style={{ paddingBottom: 0 }}>
        <div className="db-header-left">
          <div style={{ marginBottom: 8 }}>
            <Link
              href="/hr/dashboard"
              style={{ fontSize: 12, color: 'var(--text3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <i className="fa-solid fa-arrow-left" style={{ fontSize: 10 }} />
              Back to Dashboard
            </Link>
          </div>
          <h1 style={{ marginBottom: 4 }}>{employee.full_name}&apos;s Journey</h1>
          <p style={{ color: 'var(--text3)', fontSize: 13 }}>
            {employee.department ?? 'No Department'} · {employee.email}
          </p>
        </div>
        <div className="db-header-actions">
          <button className="btn btn-outline btn-sm">
            <i className="fa-solid fa-envelope" style={{ marginRight: 6 }} />Message
          </button>
          <button className="btn btn-primary btn-sm btn-glow">
            <i className="fa-solid fa-clipboard-list" style={{ marginRight: 6 }} />Schedule Check-in
          </button>
        </div>
      </div>

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        {/* Profile + Journey Overview */}
        <div className="db-grid-2-1" style={{ alignItems: 'start' }}>

          {/* Profile card */}
          <div className="db-card">
            <div className="db-card-hd">
              <h3><i className="fa-solid fa-user" style={{ color: 'var(--blue)' }} /> Employee Profile</h3>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                background: journey ? `${STATUS_COLOR[journey.status]}20` : 'var(--surface)',
                color: journey ? STATUS_COLOR[journey.status] : 'var(--text3)',
              }}>
                {journey ? STATUS_LABEL[journey.status] : 'No Journey'}
              </span>
            </div>
            <div className="db-card-bd">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <img
                  src={employee.avatar_url || `https://i.pravatar.cc/80?u=${employee.id}`}
                  alt={employee.full_name}
                  style={{ width: 72, height: 72, borderRadius: '50%', flexShrink: 0, border: '2px solid var(--border)' }}
                />
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{employee.full_name}</h3>
                  <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span><i className="fa-solid fa-building" style={{ marginRight: 6, width: 12, textAlign: 'center' }} />{employee.department ?? '—'}</span>
                    <span><i className="fa-solid fa-envelope" style={{ marginRight: 6, width: 12, textAlign: 'center' }} />{employee.email}</span>
                    {employee.phone && <span><i className="fa-solid fa-phone" style={{ marginRight: 6, width: 12, textAlign: 'center' }} />{employee.phone}</span>}
                  </div>
                </div>
              </div>
              {employee.bio && (
                <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, padding: '12px 14px', background: 'var(--surface)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                  {employee.bio}
                </p>
              )}
              <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 12 }}>
                <div>
                  <div style={{ color: 'var(--text3)', marginBottom: 2 }}>Start Date</div>
                  <div style={{ fontWeight: 700 }}>{journey?.start_date ? new Date(journey.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text3)', marginBottom: 2 }}>Days In</div>
                  <div style={{ fontWeight: 700 }}>{daysSinceStart}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text3)', marginBottom: 2 }}>Week</div>
                  <div style={{ fontWeight: 700 }}>{journey?.current_week ?? '—'} / 12</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text3)', marginBottom: 2 }}>Tasks Done</div>
                  <div style={{ fontWeight: 700 }}>{completedCount} / {tasks.length}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Progress */}
            <div className="db-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>Journey Progress</span>
                <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {progress}%
                </span>
              </div>
              <div style={{ height: 8, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: journey?.status === 'at_risk' ? 'var(--red)' : 'var(--grad)', borderRadius: 100, transition: 'width 0.6s ease' }} />
              </div>
            </div>

            {/* Risk */}
            <div className="db-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>Risk Score</span>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100, background: risk.bg, color: risk.color }}>{risk.label}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: risk.color }}>{journey?.risk_score ?? 0}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>out of 100 — lower is better</div>
            </div>

            {/* Sentiment */}
            <div className="db-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>Sentiment Score</span>
                <span style={{ fontSize: 14 }}>{sentiment.emoji}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: sentiment.color }}>{journey?.sentiment_score ?? 0}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>{sentiment.label} engagement signal</div>
            </div>
          </div>
        </div>

        {/* Task Timeline */}
        {tasks.length > 0 && (
          <div className="db-card">
            <div className="db-card-hd">
              <h3><i className="fa-solid fa-list-check" style={{ color: 'var(--blue)' }} /> Journey Tasks</h3>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setActiveWeek('all')}
                  style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100, cursor: 'pointer',
                    background: activeWeek === 'all' ? 'var(--blue)' : 'var(--surface)',
                    color: activeWeek === 'all' ? '#fff' : 'var(--text3)',
                    border: '1px solid var(--border)',
                  }}
                >All</button>
                {weeks.map(w => (
                  <button
                    key={w}
                    onClick={() => setActiveWeek(w)}
                    style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100, cursor: 'pointer',
                      background: activeWeek === w ? 'var(--blue)' : 'var(--surface)',
                      color: activeWeek === w ? '#fff' : 'var(--text3)',
                      border: '1px solid var(--border)',
                    }}
                  >Wk {w}</button>
                ))}
              </div>
            </div>
            <div className="db-card-bd">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {visibleTasks.map(task => {
                  const isDone    = task.status === 'completed'
                  const isActive  = task.status === 'in_progress'
                  const roleColor = ROLE_COLOR[task.assigned_to_role] ?? 'var(--text3)'
                  return (
                    <div
                      key={task.id}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '14px 16px',
                        borderRadius: 'var(--r)',
                        background: isDone ? 'var(--green-bg)' : isActive ? 'var(--blue-light)' : 'var(--surface)',
                        border: `1px solid ${isDone ? 'rgba(34,197,94,0.2)' : isActive ? 'rgba(26,108,246,0.2)' : 'var(--border)'}`,
                        borderLeft: `3px solid ${isDone ? 'var(--green)' : isActive ? 'var(--blue)' : 'var(--border)'}`,
                      }}
                    >
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        background: isDone ? 'var(--green)' : isActive ? 'var(--blue)' : 'var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1,
                      }}>
                        <i
                          className={`fa-solid ${isDone ? 'fa-check' : isActive ? 'fa-spinner fa-spin' : 'fa-circle'}`}
                          style={{ fontSize: isDone ? 10 : isActive ? 9 : 6, color: isDone || isActive ? '#fff' : 'var(--text3)' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', textDecoration: isDone ? 'line-through' : 'none', opacity: isDone ? 0.7 : 1 }}>
                            {task.title}
                          </span>
                          <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 100, background: `${roleColor}20`, color: roleColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {task.assigned_to_role.replace('_', ' ')}
                          </span>
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5, margin: 0 }}>{task.description}</p>
                      </div>
                      <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>Wk {task.week}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
