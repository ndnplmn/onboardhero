'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import TaskList from '@/components/platform/TaskList'
import TeamsModal from './TeamsModal'
import ResourceModal from './ResourceModal'
import { MOCK_JOURNEY, MOCK_CONTACTS } from '@/lib/constants/mock-journey'

interface JourneyViewProps {
  journey: any
  dbTasks: any[]
}

export default function JourneyView({ journey, dbTasks }: JourneyViewProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  const weekFromUrl = searchParams.get('week') || 'week1'
  const [activeWeek, setActiveWeek] = useState(weekFromUrl)

  // Sync state when URL changes
  useEffect(() => {
    if (weekFromUrl && weekFromUrl !== activeWeek) {
      setActiveWeek(weekFromUrl)
    }
  }, [weekFromUrl, activeWeek])

  const handleTabChange = (wk: string) => {
    setActiveWeek(wk)
    const params = new URLSearchParams(searchParams.toString())
    params.set('week', wk)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }
  const [teamsModal, setTeamsModal] = useState<{ isOpen: boolean; contact: string }>({ isOpen: false, contact: '' })
  const [resourceModal, setResourceModal] = useState<{ isOpen: boolean; resource: any | null }>({ isOpen: false, resource: null })

  const weekKeys = ['week1', 'week2', 'week3', 'week4', 'month2', 'month3']
  const currentWeekData = MOCK_JOURNEY[activeWeek] || { meetings: [], resources: [], expectations: [], equipment: [] }
  
  // Merge DB tasks with mock week logic
  // For simplicity in this restoration, we assume DB tasks have a 'week' field
  // If not, we'd fallback to mock ones or just show DB ones in the active week.
  const weekNumber = activeWeek.startsWith('week') ? parseInt(activeWeek.replace('week', '')) : (activeWeek === 'month2' ? 5 : 6)
  const displayTasks = dbTasks.filter(t => t.week === weekNumber || (!t.week && activeWeek === 'week1'))

  const progress = Math.min(Math.round((journey.current_week / 12) * 100), 100)

  return (
    <div className="jv-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="kpi-row" style={{ marginBottom: 0 }}>
        <div className="kpi-box cyan">
          <div className="kpi-icon-sm"><i className="fa-solid fa-calendar-day"></i></div>
          <div className="kpi-n">{activeWeek.replace('week', 'Week ').replace('month', 'Month ')}</div>
          <div className="kpi-l">Current Period</div>
        </div>
        <div className="kpi-box blue">
          <div className="kpi-icon-sm"><i className="fa-solid fa-spinner"></i></div>
          <div className="kpi-n">{progress}%</div>
          <div className="kpi-l">Overall Journey</div>
        </div>
        <div className="kpi-box aqua">
          <div className="kpi-icon-sm"><i className="fa-solid fa-list-check"></i></div>
          <div className="kpi-n">{displayTasks.filter(t => t.status === 'completed').length}/{displayTasks.length}</div>
          <div className="kpi-l">Tasks Done</div>
        </div>
        <div className="kpi-box green">
          <div className="kpi-icon-sm"><i className="fa-solid fa-award"></i></div>
          <div className="kpi-n">Level 2</div>
          <div className="kpi-l">Onboarding Rank</div>
        </div>
      </div>

      <div className="db-tabs" style={{ marginBottom: 0 }}>
        {weekKeys.map(wk => (
          <button 
            key={wk}
            className={`db-tab ${activeWeek === wk ? 'active' : ''}`}
            onClick={() => handleTabChange(wk)}
          >
            {MOCK_JOURNEY[wk].label}
          </button>
        ))}
      </div>

      <div className="db-row col2" style={{ margin: 0 }}>
        {/* TASKS */}
        <div className="db-card">
          <div className="db-card-hd">
            <h3><i className="fa-solid fa-tasks" style={{ color: 'var(--cyan)', marginRight: '6px' }}></i> {MOCK_JOURNEY[activeWeek].label} Tasks</h3>
          </div>
          <div className="db-card-bd">
            <TaskList tasks={displayTasks} currentWeek={weekNumber} />
          </div>
        </div>

        {/* MEETINGS */}
        <div className="db-card">
          <div className="db-card-hd">
            <h3><i className="fa-solid fa-calendar" style={{ color: 'var(--blue)', marginRight: '6px' }}></i> {MOCK_JOURNEY[activeWeek].label} Meetings</h3>
          </div>
          <div className="db-card-bd">
            <div className="meet-list">
              {currentWeekData.meetings.length > 0 ? (
                currentWeekData.meetings.map((m: any, i: number) => (
                  <div key={i} className="meet-card">
                    <div className="meet-date" style={{ background: 'var(--blue-light)', borderRadius: '8px' }}>
                      <div className="md">{m.day}</div>
                      <div className="mm">{m.mon}</div>
                    </div>
                    <div className="meet-info">
                      <strong>{m.title}</strong>
                      <span>{m.time} · with {m.contact}</span>
                    </div>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => setTeamsModal({ isOpen: true, contact: m.contact })}
                    >
                      <i className="fa-brands fa-microsoft"></i>
                    </button>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '13px', color: 'var(--text3)' }}>No meetings scheduled for this period.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="db-row col2">
        {/* RESOURCES */}
        <div className="db-card">
          <div className="db-card-hd">
            <h3><i className="fa-solid fa-folder-open" style={{ color: 'var(--cyan)', marginRight: '6px' }}></i> Resources & Documents</h3>
          </div>
          <div className="db-card-bd">
            {currentWeekData.resources.length > 0 ? (
              <div className="res-grid">
                {currentWeekData.resources.map((r: any) => (
                  <div 
                    key={r.id} 
                    className="res-card"
                    onClick={() => setResourceModal({ isOpen: true, resource: r })}
                  >
                    <div className="res-ico"><i className={r.icon} style={{ color: 'var(--blue)' }}></i></div>
                    <div className="res-info">
                      <strong>{r.title}</strong>
                      <span>{r.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text3)' }}>No additional resources for this period.</p>
            )}
          </div>
        </div>

        {/* EXPECTATIONS */}
        <div className="db-card">
          <div className="db-card-hd">
            <h3><i className="fa-solid fa-star" style={{ color: 'var(--amber)', marginRight: '6px' }}></i> What&apos;s expected from you</h3>
          </div>
          <div className="db-card-bd">
            <div className="expect-list">
              {currentWeekData.expectations.map((e: string, i: number) => (
                <div key={i} className="expect-item">
                  <i className="fa-solid fa-arrow-right"></i>
                  {e}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {activeWeek === 'week1' && currentWeekData.equipment && (
        <div className="db-row full">
          <div className="db-card">
            <div className="db-card-hd">
              <h3><i className="fa-solid fa-box-open" style={{ color: 'var(--cyan)', marginRight: '6px' }}></i> Equipment & Access Checklist</h3>
            </div>
            <div className="db-card-bd">
              <div className="equip-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {currentWeekData.equipment.map((eq: any, i: number) => (
                  <div key={i} className={`equip-item eq-${eq.status}`} style={{
                    padding: '14px',
                    borderRadius: 'var(--r)',
                    background: eq.status === 'done' ? 'var(--green-bg)' : 'var(--bg)',
                    border: `1px solid ${eq.status === 'done' ? 'var(--green)' : 'var(--border)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: eq.status === 'done' ? 1 : 0.7
                  }}>
                    <i className={eq.icon} style={{ fontSize: '20px', color: eq.status === 'done' ? 'var(--green)' : 'var(--text3)' }}></i>
                    <span style={{ fontSize: '12px', fontWeight: 700, textAlign: 'center' }}>{eq.label}</span>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: eq.status === 'done' ? 'var(--green)' : 'var(--text3)' }}>
                      {eq.status === 'done' ? '✓ Received' : '⏳ Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTACTS PREVIEW */}
      <div className="db-row full">
        <div className="db-card">
          <div className="db-card-hd">
            <h3><i className="fa-solid fa-address-book" style={{ color: 'var(--blue)', marginRight: '6px' }}></i> Key Contacts</h3>
          </div>
          <div className="db-card-bd">
            <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
              {MOCK_CONTACTS.map((c, i) => (
                <div key={i} className="contact-card" style={{
                  padding: '20px',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)',
                  background: 'var(--surface2)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}>
                  <img src={c.avatar} style={{ width: '60px', height: '60px', borderRadius: '50%', marginBottom: '12px', border: '3px solid var(--cyan-light)' }} alt={c.name} />
                  <div style={{ fontWeight: 800, fontSize: '15px' }}>{c.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '16px' }}>{c.role} · {c.dept}</div>
                  <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <button className="btn btn-outline btn-sm" style={{ flex: 1 }}>Message</button>
                    <button 
                      className="btn btn-primary btn-sm" 
                      style={{ flex: 1 }}
                      onClick={() => setTeamsModal({ isOpen: true, contact: c.name })}
                    >
                      <i className="fa-brands fa-microsoft"></i> Teams
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <TeamsModal 
        isOpen={teamsModal.isOpen} 
        onClose={() => setTeamsModal({ ...teamsModal, isOpen: false })} 
        contactName={teamsModal.contact} 
      />
      <ResourceModal 
        isOpen={resourceModal.isOpen} 
        onClose={() => setResourceModal({ ...resourceModal, isOpen: false })} 
        resource={resourceModal.resource} 
      />
    </div>
  )
}
