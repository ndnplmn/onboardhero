'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { getTemplatesWithTasks, seedStarterTemplate } from '@/app/(platform)/hr/journeys/actions'
import AssignJourneyModal from './AssignJourneyModal'

interface TemplateRow {
  id: string
  name: string
  role_type: string
  department: string
  duration_days: number
  ai_generated: boolean
  taskCount: number
}

// Shown as stubs when DB is empty
const STARTER_STUBS = [
  { key: 'standard',    name: '90-Day Standard',       icon: 'fa-solid fa-star',        color: 'var(--blue)',  desc: '9 tasks · 90 days · General' },
  { key: 'engineering', name: 'Engineering Fast-Track', icon: 'fa-solid fa-laptop-code', color: 'var(--cyan)',  desc: '9 tasks · 90 days · Engineering' },
  { key: 'sales',       name: 'Sales Enablement',       icon: 'fa-solid fa-chart-line',  color: 'var(--green)', desc: '9 tasks · 90 days · Sales' },
]

export default function JourneyTemplate() {
  const router = useRouter()
  const [templates, setTemplates]         = useState<TemplateRow[]>([])
  const [loading, setLoading]             = useState(true)
  const [assignTarget, setAssignTarget]   = useState<{ id: string; name: string } | null>(null)
  const [seedingKey, setSeedingKey]       = useState<string | null>(null)
  const [isPending, startTransition]      = useTransition()

  useEffect(() => {
    getTemplatesWithTasks().then(({ templates: t, tasksByTemplate }) => {
      setTemplates(
        t.map((tmpl: any) => ({
          id: tmpl.id,
          name: tmpl.name,
          role_type: tmpl.role_type,
          department: tmpl.department,
          duration_days: tmpl.duration_days || 90,
          ai_generated: tmpl.ai_generated || false,
          taskCount: (tasksByTemplate[tmpl.id] || []).length,
        }))
      )
      setLoading(false)
    })
  }, [])

  function handleSeedStarter(key: string) {
    setSeedingKey(key)
    startTransition(async () => {
      await seedStarterTemplate(key)
      setSeedingKey(null)
      // Reload templates
      const { templates: t, tasksByTemplate } = await getTemplatesWithTasks()
      setTemplates(
        t.map((tmpl: any) => ({
          id: tmpl.id,
          name: tmpl.name,
          role_type: tmpl.role_type,
          department: tmpl.department,
          duration_days: tmpl.duration_days || 90,
          ai_generated: tmpl.ai_generated || false,
          taskCount: (tasksByTemplate[tmpl.id] || []).length,
        }))
      )
    })
  }

  const existingNames = new Set(templates.map(t => t.name))
  const availableStubs = STARTER_STUBS.filter(s => !existingNames.has(s.name))

  return (
    <>
      <div className="db-card">
        <div className="db-card-hd">
          <h3>
            <i className="fa-solid fa-route" style={{ color: 'var(--blue)' }} />
            {' '}Journey Templates
          </h3>
          <button
            className="btn btn-primary btn-sm btn-glow"
            onClick={() => router.push('/hr/journeys')}
          >
            <i className="fa-solid fa-arrow-up-right-from-square" /> Open Builder
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
            <i className="fa-solid fa-spinner fa-spin" style={{ display: 'block', fontSize: 20, marginBottom: 10 }} />
            Loading templates...
          </div>
        ) : templates.length === 0 && availableStubs.length > 0 ? (
          /* Empty state — show starter stubs to import */
          <div>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--amber-bg)',
              borderTop: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--amber)' }}>
                <i className="fa-solid fa-triangle-exclamation" />
                <span style={{ fontWeight: 700 }}>No templates yet.</span>
                <span style={{ color: 'var(--text3)' }}>Import a quickstart to get started.</span>
              </div>
            </div>
            {availableStubs.map((s, i) => (
              <div
                key={s.key}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 20px',
                  borderBottom: i < availableStubs.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <i className={s.icon} style={{ fontSize: 14, color: s.color, width: 18, textAlign: 'center' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{s.desc}</div>
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: 11 }}
                  onClick={() => handleSeedStarter(s.key)}
                  disabled={isPending && seedingKey === s.key}
                >
                  {isPending && seedingKey === s.key
                    ? <i className="fa-solid fa-spinner fa-spin" />
                    : <><i className="fa-solid fa-download" /> Import</>
                  }
                </button>
              </div>
            ))}
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface2)' }}>
              <button
                className="btn btn-outline btn-sm"
                style={{ width: '100%' }}
                onClick={() => router.push('/hr/journeys')}
              >
                <i className="fa-solid fa-plus" /> Create Custom Template
              </button>
            </div>
          </div>
        ) : (
          /* Template list */
          <div>
            {templates.slice(0, 5).map((t, i) => (
              <div
                key={t.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 20px',
                  borderBottom: i < Math.min(templates.length, 5) - 1 ? '1px solid var(--border)' : 'none',
                  borderTop: i === 0 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--r)',
                  background: t.ai_generated ? 'var(--grad-soft)' : 'var(--blue-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <i
                    className={t.ai_generated ? 'fa-solid fa-sparkles' : 'fa-solid fa-route'}
                    style={{ fontSize: 14, color: 'var(--blue)' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {t.name}
                    {t.ai_generated && (
                      <span className="badge-ai" style={{ fontSize: 9 }}>AI</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {t.role_type} · {t.department} · {t.taskCount} tasks · {t.duration_days}d
                  </div>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ fontSize: 11, padding: '5px 12px', flexShrink: 0 }}
                  onClick={() => setAssignTarget({ id: t.id, name: t.name })}
                >
                  <i className="fa-solid fa-paper-plane" /> Assign
                </button>
              </div>
            ))}

            {/* Footer */}
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'var(--surface2)',
            }}>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                {templates.length} template{templates.length !== 1 ? 's' : ''} in library
              </span>
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11 }}
                onClick={() => router.push('/hr/journeys')}
              >
                View all <i className="fa-solid fa-arrow-right" />
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {assignTarget && (
          <AssignJourneyModal
            templateId={assignTarget.id}
            templateName={assignTarget.name}
            onClose={() => setAssignTarget(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
