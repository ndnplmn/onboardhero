'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import TaskList from '@/components/platform/TaskList'
import TeamsModal from './TeamsModal'
import ResourceModal from './ResourceModal'

interface JourneyViewProps {
  journey: any
  dbTasks: any[]
  checkIns?: any[]
  contacts?: { name: string; role: string; dept?: string; avatar?: string | null }[]
}

// Static per-week content — labels and generic expectations only
const WEEK_CONTENT: Record<string, { label: string; expectations: string[]; equipment?: { icon: string; label: string; status: 'done' | 'pending' }[] }> = {
  week1: {
    label: 'Week 1',
    expectations: [
      'Complete all mandatory training modules',
      'Meet with your direct manager for 1:1',
      'Set up your development environment',
      'Introduce yourself in the #general Slack channel',
    ],
    equipment: [
      { icon: 'fa-solid fa-laptop',         label: 'Laptop',             status: 'done'    },
      { icon: 'fa-solid fa-keyboard',        label: 'Keyboard & Mouse',   status: 'done'    },
      { icon: 'fa-solid fa-id-card',         label: 'Office Access Badge',status: 'pending' },
      { icon: 'fa-solid fa-network-wired',   label: 'VPN Access',         status: 'pending' },
    ],
  },
  week2: {
    label: 'Week 2',
    expectations: [
      'Start your first sprint tasks',
      'Request access to all necessary repositories',
      'Shadow 2 customer discovery calls',
    ],
  },
  week3: {
    label: 'Week 3',
    expectations: [
      'Deliver your first PR for review',
      'Participate in the bi-weekly town hall meeting',
    ],
  },
  week4: {
    label: 'Week 4',
    expectations: [
      'Complete your first independent task end-to-end',
      'Submit the Month 1 Employee Experience survey',
      'Finalize your OKRs for the remainder of the quarter',
    ],
  },
  month2: {
    label: 'Month 2',
    expectations: [
      'Contribute to a major project feature',
      'Lead a team ritual (e.g., Standup or Retro)',
      'Shadow 1-on-1 customer interview sessions',
    ],
  },
  month3: {
    label: 'Month 3',
    expectations: [
      'Fully own a specific product area or process',
      'Present a proposal for a process improvement',
      'Mentor a newer hire or peer in a specific domain',
    ],
  },
}

const WEEK_KEYS = ['week1', 'week2', 'week3', 'week4', 'month2', 'month3']

// Return the [startDay, endDay) range for a given week key (relative to start_date)
function weekDayRange(wk: string): [number, number] {
  switch (wk) {
    case 'week1':  return [0, 7]
    case 'week2':  return [7, 14]
    case 'week3':  return [14, 21]
    case 'week4':  return [21, 28]
    case 'month2': return [28, 60]
    case 'month3': return [60, 999]
    default:       return [0, 7]
  }
}

function meetingsForWeek(checkIns: any[], startDate: string, wk: string, managerName: string): any[] {
  const [minDay, maxDay] = weekDayRange(wk)
  const startMs = new Date(startDate).getTime()
  return checkIns
    .filter((c: any) => {
      if (!c.scheduled_date || c.completed_date) return false
      const diffDays = Math.floor((new Date(c.scheduled_date).getTime() - startMs) / 86400000)
      return diffDays >= minDay && diffDays < maxDay
    })
    .map((c: any) => {
      const d = new Date(c.scheduled_date)
      return {
        day: String(d.getDate()).padStart(2, '0'),
        mon: d.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
        title: c.type === 'weekly' ? 'Weekly 1:1 with Manager'
             : c.type === 'day30'  ? '30-Day Review'
             : c.type === 'day60'  ? '60-Day Review'
             : c.type === 'day90'  ? '90-Day Sign-off'
             : 'Check-in',
        time: '10:00 AM',
        contact: managerName,
      }
    })
}

export default function JourneyView({ journey, dbTasks, checkIns = [], contacts = [] }: JourneyViewProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const weekFromUrl = searchParams.get('week') || 'week1'
  const [activeWeek, setActiveWeek] = useState(weekFromUrl)

  useEffect(() => {
    if (weekFromUrl && weekFromUrl !== activeWeek) setActiveWeek(weekFromUrl)
  }, [weekFromUrl, activeWeek])

  const handleTabChange = (wk: string) => {
    setActiveWeek(wk)
    const params = new URLSearchParams(searchParams.toString())
    params.set('week', wk)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const [teamsModal, setTeamsModal] = useState<{ isOpen: boolean; contact: string }>({ isOpen: false, contact: '' })
  const [resourceModal, setResourceModal] = useState<{ isOpen: boolean; resource: any | null }>({ isOpen: false, resource: null })

  const weekData     = WEEK_CONTENT[activeWeek] ?? WEEK_CONTENT.week1
  const weekNumber   = activeWeek.startsWith('week') ? parseInt(activeWeek.replace('week', '')) : (activeWeek === 'month2' ? 5 : 6)
  const displayTasks = dbTasks.filter(t => t.week === weekNumber || (!t.week && activeWeek === 'week1'))
  const progress     = Math.min(Math.round((journey.current_week / 12) * 100), 100)
  const managerName  = journey.manager?.full_name ?? 'Your Manager'
  const weekMeetings = meetingsForWeek(checkIns, journey.start_date, activeWeek, managerName)

  return (
    <div className="jv-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="kpi-row" style={{ marginBottom: 0 }}>
        <div className="kpi-card">
          <div className="kpi-icon cyan"><i className="fa-solid fa-calendar-day" /></div>
          <div className="kpi-value">{activeWeek.replace('week', 'Week ').replace('month', 'Month ')}</div>
          <div className="kpi-label">Current Period</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon blue"><i className="fa-solid fa-chart-line" /></div>
          <div className="kpi-value">{progress}%</div>
          <div className="kpi-label">Overall Journey</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon aqua"><i className="fa-solid fa-list-check" /></div>
          <div className="kpi-value">{displayTasks.filter(t => t.status === 'completed').length}/{displayTasks.length || '—'}</div>
          <div className="kpi-label">Tasks Done</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon green"><i className="fa-solid fa-award" /></div>
          <div className="kpi-value">Week {journey.current_week}</div>
          <div className="kpi-label">Journey Stage</div>
        </div>
      </div>

      <div className="db-tabs" style={{ marginBottom: 0 }}>
        {WEEK_KEYS.map(wk => (
          <button
            key={wk}
            className={`db-tab ${activeWeek === wk ? 'active' : ''}`}
            onClick={() => handleTabChange(wk)}
          >
            {WEEK_CONTENT[wk].label}
          </button>
        ))}
      </div>

      <div className="db-row col2" style={{ margin: 0 }}>
        {/* TASKS */}
        <div className="db-card">
          <div className="db-card-hd">
            <h3><i className="fa-solid fa-list-check" style={{ color: 'var(--cyan)', marginRight: '6px' }} /> {weekData.label} Tasks</h3>
          </div>
          <div className="db-card-bd">
            <TaskList tasks={displayTasks} currentWeek={weekNumber} />
          </div>
        </div>

        {/* MEETINGS */}
        <div className="db-card">
          <div className="db-card-hd">
            <h3><i className="fa-solid fa-calendar" style={{ color: 'var(--blue)', marginRight: '6px' }} /> {weekData.label} Meetings</h3>
          </div>
          <div className="db-card-bd">
            <div className="meet-list">
              {weekMeetings.length > 0 ? (
                weekMeetings.map((m: any, i: number) => (
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
                      <i className="fa-brands fa-microsoft" />
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
            <h3><i className="fa-solid fa-folder-open" style={{ color: 'var(--cyan)', marginRight: '6px' }} /> Resources & Documents</h3>
          </div>
          <div className="db-card-bd">
            <p style={{ fontSize: '13px', color: 'var(--text3)' }}>
              Resources for this period are available in the{' '}
              <a href="/hire/resources" style={{ color: 'var(--blue)', fontWeight: 600 }}>Resource Hub</a>.
            </p>
          </div>
        </div>

        {/* EXPECTATIONS — real tasks for this week, static fallback if none */}
        <div className="db-card">
          <div className="db-card-hd">
            <h3><i className="fa-solid fa-star" style={{ color: 'var(--amber)', marginRight: '6px' }} /> What&apos;s expected from you</h3>
          </div>
          <div className="db-card-bd">
            {displayTasks.length > 0 ? (
              <div className="expect-list">
                {displayTasks.map((t: any) => {
                  const isDone = t.status === 'completed'
                  return (
                    <div
                      key={t.id}
                      className="expect-item"
                      style={{ opacity: isDone ? 0.55 : 1, textDecoration: isDone ? 'line-through' : 'none' }}
                    >
                      <i
                        className={isDone ? 'fa-solid fa-circle-check' : 'fa-solid fa-arrow-right'}
                        style={{ color: isDone ? 'var(--green)' : undefined, flexShrink: 0 }}
                      />
                      {t.title}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="expect-list">
                {weekData.expectations.map((e: string, i: number) => (
                  <div key={i} className="expect-item">
                    <i className="fa-solid fa-arrow-right" />
                    {e}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {activeWeek === 'week1' && weekData.equipment && (
        <div className="db-row full">
          <div className="db-card">
            <div className="db-card-hd">
              <h3><i className="fa-solid fa-box-open" style={{ color: 'var(--cyan)', marginRight: '6px' }} /> Equipment & Access Checklist</h3>
            </div>
            <div className="db-card-bd">
              <div className="equip-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                {weekData.equipment.map((eq, i: number) => (
                  <div key={i} className={`equip-item eq-${eq.status}`} style={{
                    padding: '14px',
                    borderRadius: 'var(--r)',
                    background: eq.status === 'done' ? 'var(--green-bg)' : 'var(--bg)',
                    border: `1px solid ${eq.status === 'done' ? 'var(--green)' : 'var(--border)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: eq.status === 'done' ? 1 : 0.7,
                  }}>
                    <i className={eq.icon} style={{ fontSize: '20px', color: eq.status === 'done' ? 'var(--green)' : 'var(--text3)' }} />
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

      {/* KEY CONTACTS — real data from props */}
      {contacts.length > 0 && (
        <div className="db-row full">
          <div className="db-card">
            <div className="db-card-hd">
              <h3><i className="fa-solid fa-address-book" style={{ color: 'var(--blue)', marginRight: '6px' }} /> Key Contacts</h3>
            </div>
            <div className="db-card-bd">
              <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                {contacts.map((c, i) => (
                  <div key={i} className="contact-card" style={{
                    padding: '20px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-lg)',
                    background: 'var(--surface2)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                  }}>
                    {c.avatar ? (
                      <img src={c.avatar} style={{ width: '60px', height: '60px', borderRadius: '50%', marginBottom: '12px', border: '3px solid var(--cyan-light)' }} alt={c.name} />
                    ) : (
                      <div style={{ width: 60, height: 60, borderRadius: '50%', marginBottom: 12, border: '3px solid var(--cyan-light)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: 'var(--text2)' }}>
                        {c.name.charAt(0)}
                      </div>
                    )}
                    <div style={{ fontWeight: 800, fontSize: '15px' }}>{c.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '16px' }}>{c.role}{c.dept ? ` · ${c.dept}` : ''}</div>
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      <button className="btn btn-outline btn-sm" style={{ flex: 1 }}>Message</button>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => setTeamsModal({ isOpen: true, contact: c.name })}
                      >
                        <i className="fa-brands fa-microsoft" /> Teams
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
