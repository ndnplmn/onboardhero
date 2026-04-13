'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import TemplateCard from '@/components/platform/TemplateCard'
import TemplateEditor from '@/components/platform/TemplateEditor'
import JourneyPreview from '@/components/ai/JourneyPreview'
import { seedStarterTemplate } from './actions'

const STARTER_TEMPLATES = [
  {
    key: 'standard',
    name: '90-Day Standard',
    icon: 'fa-solid fa-star',
    color: 'var(--blue)',
    bg: 'var(--blue-light)',
    roleType: 'General',
    dept: 'All Departments',
    desc: 'Universal onboarding covering culture, tools, and first deliverables. Best starting point for any new hire.',
    taskCount: 9,
  },
  {
    key: 'engineering',
    name: 'Engineering Fast-Track',
    icon: 'fa-solid fa-laptop-code',
    color: 'var(--cyan)',
    bg: 'var(--cyan-light)',
    roleType: 'Engineer',
    dept: 'Engineering',
    desc: 'Accelerated technical ramp-up: dev environment, first PR, code review standards, and sprint leadership.',
    taskCount: 9,
  },
  {
    key: 'sales',
    name: 'Sales Enablement',
    icon: 'fa-solid fa-chart-line',
    color: 'var(--green)',
    bg: 'var(--green-bg)',
    roleType: 'Sales',
    dept: 'Sales',
    desc: 'CRM setup, demo certification, pitch review, and a clear path to the first closed deal.',
    taskCount: 9,
  },
]

interface Props {
  templates: any[]
  tasksByTemplate: Record<string, any[]>
}

export default function JourneysClient({ templates, tasksByTemplate }: Props) {
  const router = useRouter()
  const [showEditor, setShowEditor] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [seedingKey, setSeedingKey] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Filter out starters already imported
  const existingNames = new Set(templates.map(t => t.name))
  const availableStarters = STARTER_TEMPLATES.filter(s => !existingNames.has(s.name))

  function handleSeedStarter(key: string) {
    setSeedingKey(key)
    startTransition(async () => {
      await seedStarterTemplate(key)
      setSeedingKey(null)
      router.refresh()
    })
  }

  return (
    <>
      {/* Page Header */}
      <div className="db-header">
        <div className="db-header-left">
          <h1>Journey Builder</h1>
          <p>
            Create, manage, and assign 90-day onboarding journeys to new hires.
            {templates.length > 0 && (
              <> · <strong style={{ color: 'var(--text2)' }}>{templates.length} template{templates.length !== 1 ? 's' : ''}</strong> in your library</>
            )}
          </p>
        </div>
        <div className="db-header-actions">
          <button className="btn btn-outline btn-sm" onClick={() => setShowEditor(true)} aria-label="Create a new journey template">
            <i className="fa-solid fa-plus" aria-hidden="true" /> Create Template
          </button>
          <button className="btn btn-primary btn-sm btn-glow" onClick={() => setShowAI(true)} aria-label="Generate a journey template with AI">
            <i className="fa-solid fa-sparkles" aria-hidden="true" /> Generate with AI
          </button>
        </div>
      </div>

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        {/* ── Quickstart Starters ─── shown when starters not yet imported */}
        {availableStarters.length > 0 && (
          <div className="db-card" style={{ overflow: 'hidden' }}>
            <div className="db-card-hd">
              <div>
                <h3>
                  <i className="fa-solid fa-bolt" style={{ color: 'var(--amber)' }} />
                  {' '}Quickstart Templates
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                  Pre-built templates to import into your library with one click.
                </p>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 0,
              borderTop: '1px solid var(--border)',
            }}>
              {availableStarters.map((s, i) => (
                <div
                  key={s.key}
                  style={{
                    padding: '20px 24px',
                    borderRight: i < availableStarters.length - 1 ? '1px solid var(--border)' : 'none',
                    display: 'flex', flexDirection: 'column', gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--r)',
                      background: s.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <i className={s.icon} style={{ fontSize: 16, color: s.color }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {s.roleType} · {s.dept} · {s.taskCount} tasks
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.55, margin: 0, flex: 1 }}>
                    {s.desc}
                  </p>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleSeedStarter(s.key)}
                    disabled={isPending && seedingKey === s.key}
                  >
                    {isPending && seedingKey === s.key
                      ? <><i className="fa-solid fa-spinner fa-spin" /> Importing...</>
                      : <><i className="fa-solid fa-download" /> Import to Library</>
                    }
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Template Library ───────────────────────────────────────── */}
        {templates.length === 0 && availableStarters.length === 0 ? (
          /* Edge case: all starters imported but none yet in DB — shouldn't happen */
          null
        ) : templates.length === 0 ? (
          /* Library empty state */
          <div className="db-card">
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 'var(--r-xl)',
                background: 'var(--grad-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <i className="fa-solid fa-route" style={{ fontSize: 24, color: 'var(--blue)' }} />
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
                Your template library is empty
              </div>
              <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6, marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
                Import a quickstart template above, create one manually, or let AI generate a custom journey based on the role.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setShowEditor(true)}>
                  <i className="fa-solid fa-plus" /> Create Template
                </button>
                <button className="btn btn-primary btn-sm btn-glow" onClick={() => setShowAI(true)}>
                  <i className="fa-solid fa-sparkles" /> Generate with AI
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Section label */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your Library — {templates.length} template{templates.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Template grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 'var(--gap-standard)',
            }}>
              {templates.map(t => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  tasks={tasksByTemplate[t.id] || []}
                  onRefresh={() => router.refresh()}
                />
              ))}
            </div>
          </>
        )}

        {/* ── How it works ────────────────────────────────────────────── */}
        <div className="db-card">
          <div className="db-card-hd">
            <h3>
              <i className="fa-solid fa-circle-info" style={{ color: 'var(--blue)' }} />
              {' '}How Journey Builder works
            </h3>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 0,
            borderTop: '1px solid var(--border)',
          }}>
            {[
              {
                step: '1',
                icon: 'fa-solid fa-sparkles',
                color: 'var(--blue)',
                title: 'Create a Template',
                desc: 'Build manually or generate a full journey with AI in seconds.',
              },
              {
                step: '2',
                icon: 'fa-solid fa-paper-plane',
                color: 'var(--cyan)',
                title: 'Assign to a Hire',
                desc: 'Click "Assign to Hire" on any template and pick the employee + manager.',
              },
              {
                step: '3',
                icon: 'fa-solid fa-gauge-high',
                color: 'var(--green)',
                title: 'Track Progress',
                desc: 'Monitor completion, friction signals, and engagement from the dashboard.',
              },
              {
                step: '4',
                icon: 'fa-solid fa-robot',
                color: 'var(--amber)',
                title: 'AI Adapts the Journey',
                desc: 'Aura detects friction and suggests task mutations to accelerate ramp-up.',
              },
            ].map((item, i, arr) => (
              <div
                key={item.step}
                style={{
                  padding: '20px 24px',
                  borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex', flexDirection: 'column', gap: 10,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--r)',
                  background: 'var(--bg)',
                  border: '1.5px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={item.icon} style={{ fontSize: 14, color: item.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                    {item.step}. {item.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.55 }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modals */}
      <AnimatePresence>
        {showEditor && <TemplateEditor onClose={() => { setShowEditor(false); router.refresh() }} />}
      </AnimatePresence>
      <AnimatePresence>
        {showAI && <JourneyPreview onClose={() => { setShowAI(false); router.refresh() }} />}
      </AnimatePresence>
    </>
  )
}
