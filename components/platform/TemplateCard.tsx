'use client'

import { useState, useTransition } from 'react'
import { AnimatePresence } from 'framer-motion'
import { deleteTemplate, cloneTemplate } from '@/app/(platform)/hr/journeys/actions'
import AssignJourneyModal from './AssignJourneyModal'

interface Task {
  id: string
  title: string
  week: number
  assigned_to_role: 'new_hire' | 'manager' | 'hr'
}

interface Template {
  id: string
  name: string
  role_type: string
  department: string
  ai_generated: boolean
  duration_days: number
  description?: string
  created_at: string
}

interface TemplatePerf {
  activeHires: number
  completedHires: number
  avgCompletionPct: number
  avgTTP: number | null
}

interface Props {
  template: Template
  tasks?: Task[]
  performance?: TemplatePerf
  onRefresh?: () => void
}

const ROLE_CONFIG = {
  new_hire: { color: 'var(--cyan)', bg: 'var(--cyan-light)', label: 'Hire' },
  manager:  { color: 'var(--blue)', bg: 'var(--blue-light)', label: 'Mgr' },
  hr:       { color: 'var(--aqua)', bg: 'var(--aqua-light)', label: 'HR' },
}

function groupByWeek(tasks: Task[]) {
  const groups: Record<number, Task[]> = {}
  tasks.forEach(t => {
    if (!groups[t.week]) groups[t.week] = []
    groups[t.week].push(t)
  })
  return groups
}

export default function TemplateCard({ template, tasks = [], performance, onRefresh }: Props) {
  const [isPending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState(false)
  const [showAssign, setShowAssign] = useState(false)

  const weekGroups = groupByWeek(tasks)
  const weekKeys = Object.keys(weekGroups).map(Number).sort((a, b) => a - b)

  const taskCount = tasks.length
  const duration = template.duration_days || 90

  return (
    <>
      <div
        className="db-card"
        style={{ display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}
      >
        {/* Card Header */}
        <div style={{ padding: '20px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 'var(--r)',
              background: template.ai_generated ? 'var(--grad-soft)' : 'var(--blue-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <i
                className={template.ai_generated ? 'fa-solid fa-sparkles' : 'fa-solid fa-route'}
                style={{ fontSize: 18, color: template.ai_generated ? 'var(--blue)' : 'var(--blue)' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                  {template.name}
                </span>
                {template.ai_generated && (
                  <span className="badge-ai" style={{ fontSize: 9 }}>
                    <i className="fa-solid fa-sparkles" /> AI Generated
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span>{template.role_type}</span>
                <span style={{ color: 'var(--border2)' }}>·</span>
                <span>{template.department}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {template.description && (
            <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.55, marginBottom: 12 }}>
              {template.description}
            </p>
          )}

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 100, padding: '3px 10px',
              fontSize: 11, fontWeight: 600, color: 'var(--text2)',
            }}>
              <i className="fa-solid fa-list-check" style={{ color: 'var(--blue)', fontSize: 10 }} />
              {taskCount} task{taskCount !== 1 ? 's' : ''}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 100, padding: '3px 10px',
              fontSize: 11, fontWeight: 600, color: 'var(--text2)',
            }}>
              <i className="fa-solid fa-calendar-days" style={{ color: 'var(--aqua)', fontSize: 10 }} />
              {duration} days
            </div>
            {weekKeys.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'var(--bg)', border: '1px solid var(--border)',
                borderRadius: 100, padding: '3px 10px',
                fontSize: 11, fontWeight: 600, color: 'var(--text2)',
              }}>
                <i className="fa-solid fa-calendar-week" style={{ color: 'var(--cyan)', fontSize: 10 }} />
                {weekKeys.length} week{weekKeys.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        {/* Performance analytics */}
        {performance && (performance.activeHires > 0 || performance.completedHires > 0) && (
          <div style={{ margin: '0 20px 16px', padding: '12px 14px', background: 'var(--surface2)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Template Performance
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--cyan)', lineHeight: 1 }}>
                  {performance.activeHires + performance.completedHires}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>Hires used</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-display)', color: performance.avgCompletionPct >= 80 ? 'var(--green)' : performance.avgCompletionPct >= 50 ? 'var(--amber)' : 'var(--red)', lineHeight: 1 }}>
                  {performance.avgCompletionPct}%
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>Avg completion</div>
              </div>
              {performance.avgTTP != null && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-display)', color: performance.avgTTP <= 45 ? 'var(--green)' : 'var(--amber)', lineHeight: 1 }}>
                    {performance.avgTTP}d
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>Avg TTP</div>
                </div>
              )}
              {performance.activeHires > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--blue)', lineHeight: 1 }}>
                    {performance.activeHires}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>Active now</div>
                </div>
              )}
            </div>
            {performance.avgCompletionPct > 0 && (
              <div style={{ marginTop: 10, height: 4, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${performance.avgCompletionPct}%`, background: performance.avgCompletionPct >= 80 ? 'var(--green)' : performance.avgCompletionPct >= 50 ? 'var(--amber)' : 'var(--red)', borderRadius: 100, transition: 'width 0.6s ease' }} />
              </div>
            )}
          </div>
        )}

        {/* Expandable task preview */}
        {taskCount > 0 && (
          <>
            <button
              onClick={() => setExpanded(e => !e)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px',
                background: 'var(--surface2)',
                border: 'none',
                borderTop: '1px solid var(--border)',
                borderBottom: expanded ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
                fontSize: 11, fontWeight: 700, color: 'var(--text3)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                transition: 'background 0.15s',
                width: '100%',
                textAlign: 'left',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface2)')}
            >
              <i className={`fa-solid fa-chevron-${expanded ? 'up' : 'down'}`} style={{ fontSize: 10 }} />
              {expanded ? 'Hide' : 'Preview'} tasks
            </button>

            {expanded && (
              <div style={{ padding: '16px 20px', maxHeight: 280, overflowY: 'auto' }}>
                {weekKeys.map(week => (
                  <div key={week} style={{ marginBottom: 14 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: 'var(--text3)',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      marginBottom: 8,
                    }}>
                      Week {week}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {weekGroups[week].map(task => {
                        const rc = ROLE_CONFIG[task.assigned_to_role] || ROLE_CONFIG.new_hire
                        return (
                          <div key={task.id} style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '6px 10px',
                            background: 'var(--bg)',
                            borderRadius: 'var(--r)',
                            border: '1px solid var(--border)',
                          }}>
                            <span style={{
                              fontSize: 9, fontWeight: 800,
                              color: rc.color, background: rc.bg,
                              padding: '1px 6px', borderRadius: 100,
                              flexShrink: 0,
                            }}>
                              {rc.label}
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--text2)', flex: 1 }}>
                              {task.title}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Actions footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex', gap: 8, alignItems: 'center',
          background: 'var(--surface2)',
        }}>
          {/* Primary action */}
          <button
            className="btn btn-primary btn-sm"
            style={{ flex: 1 }}
            onClick={() => setShowAssign(true)}
            disabled={isPending}
          >
            <i className="fa-solid fa-paper-plane" /> Assign to Hire
          </button>

          {/* Secondary actions */}
          <button
            className="btn btn-ghost btn-sm"
            title="Clone template"
            onClick={() => startTransition(() => { cloneTemplate(template.id) })}
            disabled={isPending}
          >
            <i className="fa-solid fa-copy" />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            title="Delete template"
            style={{ color: 'var(--red)' }}
            onClick={() => {
              if (window.confirm(`Delete "${template.name}"? This cannot be undone.`)) {
                startTransition(() => { deleteTemplate(template.id) })
              }
            }}
            disabled={isPending}
          >
            <i className="fa-solid fa-trash" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAssign && (
          <AssignJourneyModal
            templateId={template.id}
            templateName={template.name}
            onClose={() => setShowAssign(false)}
            onSuccess={onRefresh}
          />
        )}
      </AnimatePresence>
    </>
  )
}
