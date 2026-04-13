'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

// ── Types ──────────────────────────────────────────────────────────────────

type SectionId = 'org' | 'roles' | 'ai' | 'integrations' | 'notifications' | 'templates'

// ── Save Toast ─────────────────────────────────────────────────────────────

function SaveToast({ visible, onHide }: { visible: boolean; onHide: () => void }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ duration: 0.18 }}
          style={{
            position: 'fixed', bottom: 28, right: 28, zIndex: 3000,
            background: 'var(--green-bg)', border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 'var(--r-xl)', padding: '12px 18px',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <i className="fa-solid fa-circle-check" style={{ color: 'var(--green)', fontSize: 14 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>Settings saved successfully</span>
          <button onClick={onHide} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', marginLeft: 4, padding: 0 }}>
            <i className="fa-solid fa-xmark" style={{ fontSize: 11 }} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Toggle component ───────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      style={{
        width: 44, height: 24, borderRadius: 12, flexShrink: 0,
        background: on ? 'var(--blue)' : 'var(--border2)',
        border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
      }}
    >
      <span style={{
        position: 'absolute', top: 3,
        left: on ? 23 : 3,
        width: 18, height: 18, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

// ── Section header ─────────────────────────────────────────────────────────

function SectionHeader({ icon, title, description, color = 'var(--blue)' }: { icon: string; title: string; description: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
      <div style={{
        width: 44, height: 44, borderRadius: 'var(--r)',
        background: color + '20',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <i className={`fa-solid ${icon}`} style={{ fontSize: 18, color }} />
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.5 }}>{description}</div>
      </div>
    </div>
  )
}

// ── Setting row ────────────────────────────────────────────────────────────

function SettingRow({ label, description, children, last = false }: { label: string; description?: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      padding: '14px 0',
      borderBottom: last ? 'none' : '1px solid var(--border)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: description ? 3 : 0 }}>{label}</div>
        {description && <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.4 }}>{description}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────

const NAV_ITEMS: { id: SectionId; label: string; icon: string; color: string }[] = [
  { id: 'org',           label: 'Organization',    icon: 'fa-building',           color: 'var(--blue)'   },
  { id: 'roles',         label: 'Roles & Access',  icon: 'fa-user-shield',        color: 'var(--cyan)'   },
  { id: 'ai',            label: 'AI Configuration',icon: 'fa-brain',              color: 'var(--purple)' },
  { id: 'integrations',  label: 'Integrations',    icon: 'fa-plug',               color: 'var(--green)'  },
  { id: 'notifications', label: 'Notifications',   icon: 'fa-envelope-open-text', color: 'var(--amber)'  },
  { id: 'templates',     label: 'Journey Templates',icon: 'fa-route',             color: 'var(--aqua)'   },
]

export default function SettingsClient() {
  const router = useRouter()
  const [active, setActive]   = useState<SectionId>('org')
  const [saved, setSaved]     = useState(false)
  const [isPending, startTransition] = useTransition()

  // ── Org settings state ───────────────────────────────────────────────────
  const [orgName, setOrgName]           = useState('Acme Corp')
  const [orgIndustry, setOrgIndustry]   = useState('Technology')
  const [orgSize, setOrgSize]           = useState('50-200')
  const [orgTimezone, setOrgTimezone]   = useState('America/New_York')
  const [departments, setDepartments]   = useState(['Engineering', 'Product', 'Design', 'Sales', 'People', 'Finance'])
  const [newDept, setNewDept]           = useState('')

  // ── Role settings state ──────────────────────────────────────────────────
  const [roles, setRoles] = useState({
    manager_invite:      true,
    manager_view_all:    false,
    manager_edit_tasks:  true,
    hr_risk_scan:        true,
    hr_edit_templates:   true,
    hr_export_reports:   true,
  })

  // ── AI settings state ────────────────────────────────────────────────────
  const [riskThreshold, setRiskThreshold]       = useState(60)
  const [scanFrequency, setScanFrequency]        = useState('weekly')
  const [sentimentEnabled, setSentimentEnabled]  = useState(true)
  const [autoAlerts, setAutoAlerts]              = useState(true)
  const [aiModel, setAiModel]                    = useState('claude-sonnet-4-6')

  // ── Integration settings ─────────────────────────────────────────────────
  const [integrations, setIntegrations] = useState({
    slack:    { enabled: true,  webhook: 'https://hooks.slack.com/services/T00/B00/xxxx', channel: '#onboarding-alerts' },
    teams:    { enabled: false, webhook: '', channel: '' },
    workday:  { enabled: false, apiKey: '' },
    bamboohr: { enabled: false, apiKey: '' },
  })

  // ── Notification settings ─────────────────────────────────────────────────
  const [notifs, setNotifs] = useState({
    journey_complete:  true,
    task_overdue:      true,
    risk_increase:     true,
    checkin_reminder:  true,
    weekly_digest:     true,
    new_hire_joined:   true,
  })
  const [digestDay, setDigestDay]   = useState('monday')
  const [digestTime, setDigestTime] = useState('09:00')

  function handleSave() {
    startTransition(() => {
      // Simulate async save
      setTimeout(() => {
        setSaved(true)
        setTimeout(() => setSaved(false), 3500)
      }, 400)
    })
  }

  function addDepartment() {
    const d = newDept.trim()
    if (d && !departments.includes(d)) {
      setDepartments(prev => [...prev, d])
      setNewDept('')
    }
  }

  function removeDepartment(d: string) {
    setDepartments(prev => prev.filter(x => x !== d))
  }

  function toggleRole(key: keyof typeof roles) {
    setRoles(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function toggleNotif(key: keyof typeof notifs) {
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <>
      <div className="db-header">
        <div className="db-header-left">
          <h1>Settings</h1>
          <p>Configure your organization&apos;s onboarding platform and preferences.</p>
        </div>
        <div className="db-header-actions">
          <button
            className="btn btn-primary btn-sm btn-glow"
            onClick={handleSave}
            disabled={isPending}
            aria-label="Save settings changes"
          >
            {isPending
              ? <><i className="fa-solid fa-spinner fa-spin" aria-hidden="true" /> Saving...</>
              : <><i className="fa-solid fa-floppy-disk" aria-hidden="true" /> Save Changes</>
            }
          </button>
        </div>
      </div>

      <div className="db-body">
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'start' }}>

          {/* Sidebar nav */}
          <div className="db-card" style={{ padding: 8, position: 'sticky', top: 80 }}>
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '10px 12px', borderRadius: 'var(--r)',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  background: active === item.id ? item.color + '15' : 'transparent',
                  color: active === item.id ? item.color : 'var(--text2)',
                  fontWeight: active === item.id ? 700 : 500,
                  fontSize: 13, transition: 'all 0.15s',
                  borderLeft: active === item.id ? `3px solid ${item.color}` : '3px solid transparent',
                }}
              >
                <i className={`fa-solid ${item.icon}`} style={{ fontSize: 13, width: 16, textAlign: 'center', flexShrink: 0 }} />
                {item.label}
              </button>
            ))}

            <div style={{ height: 1, background: 'var(--border)', margin: '8px 4px' }} />

            <div style={{ padding: '10px 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                System
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span>Version</span><span style={{ fontWeight: 700, color: 'var(--text2)' }}>v2.6.4</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span>Status</span>
                  <span style={{ fontWeight: 700, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
                    Operational
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Build</span><span style={{ fontWeight: 700, color: 'var(--text2)' }}>#9821</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panel area */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
            >

              {/* ── ORGANIZATION ─────────────────────────────────── */}
              {active === 'org' && (
                <div className="db-card" style={{ padding: '24px' }}>
                  <SectionHeader icon="fa-building" title="Organization Profile" description="Manage company details, departments, and workspace configuration." />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    <SettingRow label="Company Name" description="Displayed across all employee-facing screens.">
                      <input
                        value={orgName}
                        onChange={e => setOrgName(e.target.value)}
                        style={{
                          width: 220, padding: '8px 12px', borderRadius: 'var(--r)',
                          border: '1.5px solid var(--border)', background: 'var(--bg)',
                          color: 'var(--text)', fontSize: 13, outline: 'none',
                          fontFamily: 'var(--font-body)',
                        }}
                      />
                    </SettingRow>

                    <SettingRow label="Industry" description="Used to tailor AI recommendations.">
                      <select
                        value={orgIndustry}
                        onChange={e => setOrgIndustry(e.target.value)}
                        style={{
                          width: 180, padding: '8px 12px', borderRadius: 'var(--r)',
                          border: '1.5px solid var(--border)', background: 'var(--bg)',
                          color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer',
                        }}
                      >
                        {['Technology', 'Finance', 'Healthcare', 'Retail', 'Education', 'Manufacturing', 'Media', 'Other'].map(i => (
                          <option key={i} value={i}>{i}</option>
                        ))}
                      </select>
                    </SettingRow>

                    <SettingRow label="Company Size">
                      <select
                        value={orgSize}
                        onChange={e => setOrgSize(e.target.value)}
                        style={{
                          width: 180, padding: '8px 12px', borderRadius: 'var(--r)',
                          border: '1.5px solid var(--border)', background: 'var(--bg)',
                          color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer',
                        }}
                      >
                        {['1-10', '11-50', '50-200', '200-1000', '1000+'].map(s => (
                          <option key={s} value={s}>{s} employees</option>
                        ))}
                      </select>
                    </SettingRow>

                    <SettingRow label="Default Timezone" description="Used for scheduling check-ins and notifications." last>
                      <select
                        value={orgTimezone}
                        onChange={e => setOrgTimezone(e.target.value)}
                        style={{
                          width: 220, padding: '8px 12px', borderRadius: 'var(--r)',
                          border: '1.5px solid var(--border)', background: 'var(--bg)',
                          color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer',
                        }}
                      >
                        {['America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Europe/London', 'Europe/Madrid', 'Asia/Tokyo', 'Asia/Kolkata', 'UTC'].map(tz => (
                          <option key={tz} value={tz}>{tz}</option>
                        ))}
                      </select>
                    </SettingRow>
                  </div>

                  {/* Departments */}
                  <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Departments</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 14 }}>These appear in employee profiles and journey filters.</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                      {departments.map(d => (
                        <span key={d} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          fontSize: 12, fontWeight: 600, padding: '4px 10px',
                          borderRadius: 100, background: 'var(--blue-light)',
                          color: 'var(--blue)', border: '1px solid var(--border)',
                        }}>
                          {d}
                          <button
                            onClick={() => removeDepartment(d)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 0, lineHeight: 1 }}
                          >
                            <i className="fa-solid fa-xmark" style={{ fontSize: 9 }} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        value={newDept}
                        onChange={e => setNewDept(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addDepartment()}
                        placeholder="Add department..."
                        style={{
                          flex: 1, padding: '8px 12px', borderRadius: 'var(--r)',
                          border: '1.5px solid var(--border)', background: 'var(--bg)',
                          color: 'var(--text)', fontSize: 13, outline: 'none',
                          fontFamily: 'var(--font-body)',
                        }}
                      />
                      <button className="btn btn-outline btn-sm" onClick={addDepartment} disabled={!newDept.trim()}>
                        <i className="fa-solid fa-plus" /> Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── ROLES & ACCESS ───────────────────────────────── */}
              {active === 'roles' && (
                <div className="db-card" style={{ padding: '24px' }}>
                  <SectionHeader icon="fa-user-shield" title="Roles & Access" description="Define what each role can see and do within the platform." color="var(--cyan)" />

                  {/* Manager permissions */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 100,
                        background: 'var(--blue-light)', color: 'var(--blue)',
                      }}>
                        <i className="fa-solid fa-user-tie" style={{ marginRight: 4, fontSize: 9 }} />Manager
                      </span>
                    </div>
                    <SettingRow label="Can invite new hires" description="Allow managers to send invitations without HR approval.">
                      <Toggle on={roles.manager_invite} onChange={() => toggleRole('manager_invite')} />
                    </SettingRow>
                    <SettingRow label="View all journeys" description="Access journeys outside their direct reports.">
                      <Toggle on={roles.manager_view_all} onChange={() => toggleRole('manager_view_all')} />
                    </SettingRow>
                    <SettingRow label="Edit & add tasks" description="Create and modify tasks on active journeys." last>
                      <Toggle on={roles.manager_edit_tasks} onChange={() => toggleRole('manager_edit_tasks')} />
                    </SettingRow>
                  </div>

                  {/* HR permissions */}
                  <div style={{ paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 100,
                        background: 'var(--aqua-light)', color: 'var(--aqua)',
                      }}>
                        <i className="fa-solid fa-id-badge" style={{ marginRight: 4, fontSize: 9 }} />HR
                      </span>
                    </div>
                    <SettingRow label="Run risk scans" description="Trigger AI-powered risk analysis across all journeys.">
                      <Toggle on={roles.hr_risk_scan} onChange={() => toggleRole('hr_risk_scan')} />
                    </SettingRow>
                    <SettingRow label="Edit journey templates" description="Create, modify, and delete onboarding templates.">
                      <Toggle on={roles.hr_edit_templates} onChange={() => toggleRole('hr_edit_templates')} />
                    </SettingRow>
                    <SettingRow label="Export reports" description="Download CSV and analytics reports." last>
                      <Toggle on={roles.hr_export_reports} onChange={() => toggleRole('hr_export_reports')} />
                    </SettingRow>
                  </div>
                </div>
              )}

              {/* ── AI CONFIGURATION ─────────────────────────────── */}
              {active === 'ai' && (
                <div className="db-card" style={{ padding: '24px' }}>
                  <SectionHeader icon="fa-brain" title="AI Configuration" description="Tune sentiment analysis, risk scoring, and scan behavior." color="var(--purple)" />

                  <SettingRow label="AI Model" description="Model used for journey analysis and risk scoring.">
                    <select
                      value={aiModel}
                      onChange={e => setAiModel(e.target.value)}
                      style={{
                        width: 220, padding: '8px 12px', borderRadius: 'var(--r)',
                        border: '1.5px solid var(--border)', background: 'var(--bg)',
                        color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer',
                      }}
                    >
                      <option value="claude-sonnet-4-6">Claude Sonnet 4.6 (Recommended)</option>
                      <option value="claude-haiku-4-5">Claude Haiku 4.5 (Faster)</option>
                      <option value="claude-opus-4-6">Claude Opus 4.6 (Most accurate)</option>
                    </select>
                  </SettingRow>

                  <SettingRow label="Sentiment Analysis" description="Analyze feedback text and survey responses for emotional signals.">
                    <Toggle on={sentimentEnabled} onChange={setSentimentEnabled} />
                  </SettingRow>

                  <SettingRow label="Automatic Risk Alerts" description="Send alerts when a risk score exceeds the threshold automatically.">
                    <Toggle on={autoAlerts} onChange={setAutoAlerts} />
                  </SettingRow>

                  <SettingRow label="Scan Frequency" description="How often AI re-evaluates all active journeys." last>
                    <select
                      value={scanFrequency}
                      onChange={e => setScanFrequency(e.target.value)}
                      style={{
                        width: 160, padding: '8px 12px', borderRadius: 'var(--r)',
                        border: '1.5px solid var(--border)', background: 'var(--bg)',
                        color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer',
                      }}
                    >
                      <option value="realtime">Real-time</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="manual">Manual only</option>
                    </select>
                  </SettingRow>

                  {/* Risk threshold slider */}
                  <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>Risk Alert Threshold</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>Trigger an alert when a journey risk score exceeds this value.</div>
                      </div>
                      <span style={{
                        fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)',
                        color: riskThreshold > 70 ? 'var(--red)' : riskThreshold > 50 ? 'var(--amber)' : 'var(--green)',
                      }}>
                        {riskThreshold}
                      </span>
                    </div>
                    <input
                      type="range" min={20} max={90} step={5}
                      value={riskThreshold}
                      onChange={e => setRiskThreshold(Number(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--blue)', marginTop: 4 }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)', marginTop: 5 }}>
                      <span>Sensitive (20) — more alerts</span>
                      <span>Conservative (90) — fewer alerts</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── INTEGRATIONS ─────────────────────────────────── */}
              {active === 'integrations' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Slack */}
                  <div className="db-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: integrations.slack.enabled ? 20 : 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 'var(--r)',
                          background: '#4a154b20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <i className="fa-brands fa-slack" style={{ fontSize: 20, color: '#4a154b' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Slack</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>Send alerts and journey updates to Slack channels.</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {integrations.slack.enabled && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
                            Connected
                          </span>
                        )}
                        <Toggle
                          on={integrations.slack.enabled}
                          onChange={v => setIntegrations(p => ({ ...p, slack: { ...p.slack, enabled: v } }))}
                        />
                      </div>
                    </div>
                    {integrations.slack.enabled && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div className="fg" style={{ margin: 0 }}>
                          <label style={{ fontSize: 11 }}>Webhook URL</label>
                          <input
                            value={integrations.slack.webhook}
                            onChange={e => setIntegrations(p => ({ ...p, slack: { ...p.slack, webhook: e.target.value } }))}
                            placeholder="https://hooks.slack.com/services/..."
                            style={{ fontSize: 12 }}
                          />
                        </div>
                        <div className="fg" style={{ margin: 0 }}>
                          <label style={{ fontSize: 11 }}>Default Channel</label>
                          <input
                            value={integrations.slack.channel}
                            onChange={e => setIntegrations(p => ({ ...p, slack: { ...p.slack, channel: e.target.value } }))}
                            placeholder="#onboarding-alerts"
                            style={{ fontSize: 12 }}
                          />
                        </div>
                        <button className="btn btn-outline btn-sm" style={{ alignSelf: 'flex-start', fontSize: 11 }}>
                          <i className="fa-solid fa-paper-plane" /> Test Connection
                        </button>
                      </div>
                    )}
                  </div>

                  {/* MS Teams */}
                  <div className="db-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 'var(--r)',
                          background: '#464eb820', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <i className="fa-brands fa-microsoft" style={{ fontSize: 20, color: '#464eb8' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Microsoft Teams</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>Post notifications to Teams channels via webhook.</div>
                        </div>
                      </div>
                      <Toggle
                        on={integrations.teams.enabled}
                        onChange={v => setIntegrations(p => ({ ...p, teams: { ...p.teams, enabled: v } }))}
                      />
                    </div>
                    {integrations.teams.enabled && (
                      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div className="fg" style={{ margin: 0 }}>
                          <label style={{ fontSize: 11 }}>Webhook URL</label>
                          <input
                            value={integrations.teams.webhook}
                            onChange={e => setIntegrations(p => ({ ...p, teams: { ...p.teams, webhook: e.target.value } }))}
                            placeholder="https://outlook.office.com/webhook/..."
                            style={{ fontSize: 12 }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* HRIS */}
                  {[
                    { key: 'workday' as const, name: 'Workday', icon: 'fa-briefcase', color: '#e85429' },
                    { key: 'bamboohr' as const, name: 'BambooHR', icon: 'fa-seedling', color: '#73b234' },
                  ].map(hris => (
                    <div key={hris.key} className="db-card" style={{ padding: '24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: 'var(--r)',
                            background: hris.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <i className={`fa-solid ${hris.icon}`} style={{ fontSize: 18, color: hris.color }} />
                          </div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{hris.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>Sync employee data and org structure automatically.</div>
                          </div>
                        </div>
                        <Toggle
                          on={integrations[hris.key].enabled}
                          onChange={v => setIntegrations(p => ({ ...p, [hris.key]: { ...p[hris.key], enabled: v } }))}
                        />
                      </div>
                      {integrations[hris.key].enabled && (
                        <div style={{ marginTop: 16 }}>
                          <div className="fg" style={{ margin: 0 }}>
                            <label style={{ fontSize: 11 }}>API Key</label>
                            <input
                              type="password"
                              value={integrations[hris.key].apiKey}
                              onChange={e => setIntegrations(p => ({ ...p, [hris.key]: { ...p[hris.key], apiKey: e.target.value } }))}
                              placeholder="sk-••••••••••••"
                              style={{ fontSize: 12 }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ── NOTIFICATIONS ─────────────────────────────────── */}
              {active === 'notifications' && (
                <div className="db-card" style={{ padding: '24px' }}>
                  <SectionHeader icon="fa-envelope-open-text" title="Notification System" description="Configure which events trigger automated notifications and how they are delivered." color="var(--amber)" />

                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                    Event Triggers
                  </div>
                  {[
                    { key: 'journey_complete' as const,  label: 'Journey completed',       desc: 'Notify HR and manager when a hire completes all 90 days.' },
                    { key: 'task_overdue' as const,       label: 'Task overdue',            desc: 'Alert when tasks are past their target week.' },
                    { key: 'risk_increase' as const,      label: 'Risk score increase',     desc: 'Notify when a journey risk score crosses the threshold.' },
                    { key: 'checkin_reminder' as const,   label: 'Check-in reminder',       desc: 'Remind managers 24h before scheduled check-ins.' },
                    { key: 'weekly_digest' as const,      label: 'Weekly digest email',     desc: 'Summary of all active journeys sent on the configured day.' },
                    { key: 'new_hire_joined' as const,    label: 'New hire joined',         desc: 'Notify the team when a new hire accepts their invitation.' },
                  ].map((item, i, arr) => (
                    <SettingRow key={item.key} label={item.label} description={item.desc} last={i === arr.length - 1}>
                      <Toggle on={notifs[item.key]} onChange={() => toggleNotif(item.key)} />
                    </SettingRow>
                  ))}

                  {/* Digest schedule */}
                  {notifs.weekly_digest && (
                    <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
                        Weekly Digest Schedule
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="fg" style={{ margin: 0 }}>
                          <label>Send on</label>
                          <select value={digestDay} onChange={e => setDigestDay(e.target.value)}>
                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(d => (
                              <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                            ))}
                          </select>
                        </div>
                        <div className="fg" style={{ margin: 0 }}>
                          <label>At time</label>
                          <input
                            type="time"
                            value={digestTime}
                            onChange={e => setDigestTime(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── JOURNEY TEMPLATES ─────────────────────────────── */}
              {active === 'templates' && (
                <div className="db-card" style={{ padding: '24px' }}>
                  <SectionHeader icon="fa-route" title="Journey Templates" description="Manage the onboarding templates used when assigning new hires to journeys." color="var(--aqua)" />

                  <div style={{
                    padding: '20px', borderRadius: 'var(--r-xl)',
                    background: 'var(--grad-soft)', border: '1px solid var(--blue-light)',
                    marginBottom: 20,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 'var(--r)',
                        background: 'var(--grad)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <i className="fa-solid fa-route" style={{ fontSize: 18, color: '#fff' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Journey Builder</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>
                          Create, edit, and manage all onboarding journey templates. You can also generate templates with AI.
                        </div>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => router.push('/hr/journeys')}
                      >
                        <i className="fa-solid fa-arrow-right" /> Open Builder
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
                    Journey templates define the tasks, milestones, and check-ins that each new hire follows during their onboarding journey. Changes to templates only affect <strong>new</strong> journeys — existing active journeys are not modified.
                  </div>

                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                    <SettingRow label="Default onboarding duration" description="Applied when creating journeys without a specific template.">
                      <select
                        style={{
                          width: 160, padding: '8px 12px', borderRadius: 'var(--r)',
                          border: '1.5px solid var(--border)', background: 'var(--bg)',
                          color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer',
                        }}
                        defaultValue="12"
                      >
                        <option value="4">4 weeks</option>
                        <option value="8">8 weeks</option>
                        <option value="12">12 weeks (90 days)</option>
                        <option value="24">24 weeks (6 months)</option>
                      </select>
                    </SettingRow>
                    <SettingRow label="Auto-assign template" description="Automatically assign a default template when a new hire is invited." last>
                      <Toggle on={false} onChange={() => {}} />
                    </SettingRow>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <SaveToast visible={saved} onHide={() => setSaved(false)} />
    </>
  )
}
