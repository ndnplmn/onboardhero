'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { saveSettings, type SettingsPayload } from './actions'
import { useT } from '@/lib/i18n/context'

// ── Types ──────────────────────────────────────────────────────────────────

type SectionId = 'org' | 'roles' | 'ai' | 'integrations' | 'notifications' | 'templates'

// ── Save Toast ─────────────────────────────────────────────────────────────

function SaveToast({ visible, onHide, savedMsg }: { visible: boolean; onHide: () => void; savedMsg: string }) {
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
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>{savedMsg}</span>
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

const NAV_ITEM_DEFS: { id: SectionId; icon: string; color: string }[] = [
  { id: 'org',           icon: 'fa-building',           color: 'var(--blue)'   },
  { id: 'roles',         icon: 'fa-user-shield',        color: 'var(--cyan)'   },
  { id: 'ai',            icon: 'fa-brain',              color: 'var(--purple)' },
  { id: 'integrations',  icon: 'fa-plug',               color: 'var(--green)'  },
  { id: 'notifications', icon: 'fa-envelope-open-text', color: 'var(--amber)'  },
  { id: 'templates',     icon: 'fa-route',              color: 'var(--aqua)'   },
]

interface SettingsClientProps {
  initialSettings?: SettingsPayload | null
}

export default function SettingsClient({ initialSettings }: SettingsClientProps) {
  const router = useRouter()
  const { t } = useT()
  const [active, setActive]   = useState<SectionId>('org')
  const [saved, setSaved]     = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // ── Org settings state ───────────────────────────────────────────────────
  const [orgName, setOrgName]           = useState(initialSettings?.org?.name        ?? 'Acme Corp')
  const [orgIndustry, setOrgIndustry]   = useState(initialSettings?.org?.industry    ?? 'Technology')
  const [orgSize, setOrgSize]           = useState(initialSettings?.org?.size        ?? '50-200')
  const [orgTimezone, setOrgTimezone]   = useState(initialSettings?.org?.timezone    ?? 'America/New_York')
  const [departments, setDepartments]   = useState(initialSettings?.org?.departments ?? ['Engineering', 'Product', 'Design', 'Sales', 'People', 'Finance'])
  const [newDept, setNewDept]           = useState('')

  // ── Role settings state ──────────────────────────────────────────────────
  const [roles, setRoles] = useState({
    manager_invite:      initialSettings?.roles?.manager_invite      ?? true,
    manager_view_all:    initialSettings?.roles?.manager_view_all    ?? false,
    manager_edit_tasks:  initialSettings?.roles?.manager_edit_tasks  ?? true,
    hr_risk_scan:        initialSettings?.roles?.hr_risk_scan        ?? true,
    hr_edit_templates:   initialSettings?.roles?.hr_edit_templates   ?? true,
    hr_export_reports:   initialSettings?.roles?.hr_export_reports   ?? true,
  })

  // ── AI settings state ────────────────────────────────────────────────────
  const [riskThreshold, setRiskThreshold]       = useState(initialSettings?.ai?.riskThreshold     ?? 60)
  const [scanFrequency, setScanFrequency]        = useState(initialSettings?.ai?.scanFrequency     ?? 'weekly')
  const [sentimentEnabled, setSentimentEnabled]  = useState(initialSettings?.ai?.sentimentEnabled  ?? true)
  const [autoAlerts, setAutoAlerts]              = useState(initialSettings?.ai?.autoAlerts        ?? true)
  const [aiModel, setAiModel]                    = useState(initialSettings?.ai?.aiModel           ?? 'claude-sonnet-4-6')
  const [taskOverdueDays, setTaskOverdueDays]   = useState(initialSettings?.ai?.taskOverdueDays   ?? 3)
  const [hireInactiveDays, setHireInactiveDays] = useState(initialSettings?.ai?.hireInactiveDays  ?? 5)
  const [lowMoraleThreshold, setLowMorale]      = useState(initialSettings?.ai?.lowMoraleThreshold ?? 2)

  // ── Integration settings ─────────────────────────────────────────────────
  const [integrations, setIntegrations] = useState({
    slack:    { enabled: true,  webhook: 'https://hooks.slack.com/services/T00/B00/xxxx', channel: '#onboarding-alerts' },
    teams:    { enabled: false, webhook: '', channel: '' },
    workday:  { enabled: false, apiKey: '' },
    bamboohr: { enabled: false, apiKey: '' },
  })

  // ── Webhook test state ───────────────────────────────────────────────────
  const [webhookTest, setWebhookTest] = useState<Record<string, 'idle' | 'loading' | 'ok' | 'error'>>({
    slack: 'idle', teams: 'idle',
  })

  async function testWebhook(platform: 'slack' | 'teams') {
    const url = integrations[platform].webhook.trim()
    if (!url) return
    setWebhookTest(p => ({ ...p, [platform]: 'loading' }))
    try {
      const body = platform === 'slack'
        ? JSON.stringify({ text: '✅ *Onboarding Hero* — Test connection successful!' })
        : JSON.stringify({ type: 'message', text: '✅ Onboarding Hero — Test connection successful!' })
      const res = await fetch(url, { method: 'POST', body, headers: { 'Content-Type': 'application/json' } })
      setWebhookTest(p => ({ ...p, [platform]: res.ok ? 'ok' : 'error' }))
    } catch {
      setWebhookTest(p => ({ ...p, [platform]: 'error' }))
    }
    setTimeout(() => setWebhookTest(p => ({ ...p, [platform]: 'idle' })), 4000)
  }

  // ── Notification settings ─────────────────────────────────────────────────
  const [notifs, setNotifs] = useState({
    journey_complete:  initialSettings?.notifications?.events?.journey_complete  ?? true,
    task_overdue:      initialSettings?.notifications?.events?.task_overdue      ?? true,
    risk_increase:     initialSettings?.notifications?.events?.risk_increase     ?? true,
    checkin_reminder:  initialSettings?.notifications?.events?.checkin_reminder  ?? true,
    weekly_digest:     initialSettings?.notifications?.events?.weekly_digest     ?? true,
    new_hire_joined:   initialSettings?.notifications?.events?.new_hire_joined   ?? true,
  })
  const [digestDay, setDigestDay]   = useState(initialSettings?.notifications?.digestDay  ?? 'monday')
  const [digestTime, setDigestTime] = useState(initialSettings?.notifications?.digestTime ?? '09:00')

  function handleSave() {
    setSaveError(null)
    startTransition(async () => {
      const payload: SettingsPayload = {
        org:           { name: orgName, industry: orgIndustry, size: orgSize, timezone: orgTimezone, departments },
        roles:         roles as Record<string, boolean>,
        ai:            { riskThreshold, scanFrequency, sentimentEnabled, autoAlerts, aiModel, taskOverdueDays, hireInactiveDays, lowMoraleThreshold },
        notifications: { events: notifs as Record<string, boolean>, digestDay, digestTime },
      }
      const result = await saveSettings(payload)
      if (result.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3500)
      } else {
        setSaveError(result.error ?? 'Save failed')
      }
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
          <h1>{t('settings.title')}</h1>
          <p>{t('settings.subtitle')}</p>
        </div>
        <div className="db-header-actions">
          <button
            className="btn btn-primary btn-sm btn-glow"
            onClick={handleSave}
            disabled={isPending}
            aria-label={t('settings.saveChanges')}
          >
            {isPending
              ? <><i className="fa-solid fa-spinner fa-spin" aria-hidden="true" /> {t('settings.saving')}</>
              : <><i className="fa-solid fa-floppy-disk" aria-hidden="true" /> {t('settings.saveChanges')}</>
            }
          </button>
        </div>
      </div>

      <div className="db-body">
        <div className="db-grid-nav-1fr">

          {/* Sidebar nav */}
          <div className="db-card" style={{ padding: 8, position: 'sticky', top: 80 }}>
            {NAV_ITEM_DEFS.map(item => (
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
                {t(`settings.nav.${item.id}` as never)}
              </button>
            ))}

            <div style={{ height: 1, background: 'var(--border)', margin: '8px 4px' }} />

            <div style={{ padding: '10px 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                {t('settings.system')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span>{t('settings.version')}</span><span style={{ fontWeight: 700, color: 'var(--text2)' }}>v2.6.4</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span>{t('settings.statusLabel')}</span>
                  <span style={{ fontWeight: 700, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
                    {t('settings.operational')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{t('settings.build')}</span><span style={{ fontWeight: 700, color: 'var(--text2)' }}>#9821</span>
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
                  <SectionHeader icon="fa-building" title={t('settings.org.sectionTitle')} description={t('settings.org.sectionDesc')} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    <SettingRow label={t('settings.org.companyName')} description={t('settings.org.companyNameDesc')}>
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

                    <SettingRow label={t('settings.org.industry')} description={t('settings.org.industryDesc')}>
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

                    <SettingRow label={t('settings.org.companySize')}>
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
                          <option key={s} value={s}>{s} {t('settings.org.employeesLabel')}</option>
                        ))}
                      </select>
                    </SettingRow>

                    <SettingRow label={t('settings.org.timezone')} description={t('settings.org.timezoneDesc')} last>
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
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{t('settings.org.departments')}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 14 }}>{t('settings.org.departmentsDesc')}</div>
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
                        placeholder={t('settings.org.addDeptPlaceholder')}
                        style={{
                          flex: 1, padding: '8px 12px', borderRadius: 'var(--r)',
                          border: '1.5px solid var(--border)', background: 'var(--bg)',
                          color: 'var(--text)', fontSize: 13, outline: 'none',
                          fontFamily: 'var(--font-body)',
                        }}
                      />
                      <button className="btn btn-outline btn-sm" onClick={addDepartment} disabled={!newDept.trim()}>
                        <i className="fa-solid fa-plus" /> {t('settings.org.addDeptBtn')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── ROLES & ACCESS ───────────────────────────────── */}
              {active === 'roles' && (
                <div className="db-card" style={{ padding: '24px' }}>
                  <SectionHeader icon="fa-user-shield" title={t('settings.roles.sectionTitle')} description={t('settings.roles.sectionDesc')} color="var(--cyan)" />

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
                    <SettingRow label={t('settings.roles.managerInvite')} description={t('settings.roles.managerInviteDesc')}>
                      <Toggle on={roles.manager_invite} onChange={() => toggleRole('manager_invite')} />
                    </SettingRow>
                    <SettingRow label={t('settings.roles.managerViewAll')} description={t('settings.roles.managerViewAllDesc')}>
                      <Toggle on={roles.manager_view_all} onChange={() => toggleRole('manager_view_all')} />
                    </SettingRow>
                    <SettingRow label={t('settings.roles.managerEditTasks')} description={t('settings.roles.managerEditTasksDesc')} last>
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
                    <SettingRow label={t('settings.roles.hrRiskScan')} description={t('settings.roles.hrRiskScanDesc')}>
                      <Toggle on={roles.hr_risk_scan} onChange={() => toggleRole('hr_risk_scan')} />
                    </SettingRow>
                    <SettingRow label={t('settings.roles.hrEditTemplates')} description={t('settings.roles.hrEditTemplatesDesc')}>
                      <Toggle on={roles.hr_edit_templates} onChange={() => toggleRole('hr_edit_templates')} />
                    </SettingRow>
                    <SettingRow label={t('settings.roles.hrExportReports')} description={t('settings.roles.hrExportReportsDesc')} last>
                      <Toggle on={roles.hr_export_reports} onChange={() => toggleRole('hr_export_reports')} />
                    </SettingRow>
                  </div>
                </div>
              )}

              {/* ── AI CONFIGURATION ─────────────────────────────── */}
              {active === 'ai' && (
                <div className="db-card" style={{ padding: '24px' }}>
                  <SectionHeader icon="fa-brain" title={t('settings.ai.sectionTitle')} description={t('settings.ai.sectionDesc')} color="var(--purple)" />

                  <SettingRow label={t('settings.ai.aiModel')} description={t('settings.ai.aiModelDesc')}>
                    <select
                      value={aiModel}
                      onChange={e => setAiModel(e.target.value)}
                      style={{
                        width: 220, padding: '8px 12px', borderRadius: 'var(--r)',
                        border: '1.5px solid var(--border)', background: 'var(--bg)',
                        color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer',
                      }}
                    >
                      <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
                      <option value="claude-haiku-4-5">Claude Haiku 4.5</option>
                      <option value="claude-opus-4-6">Claude Opus 4.6</option>
                    </select>
                  </SettingRow>

                  <SettingRow label={t('settings.ai.sentimentAnalysis')} description={t('settings.ai.sentimentAnalysisDesc')}>
                    <Toggle on={sentimentEnabled} onChange={setSentimentEnabled} />
                  </SettingRow>

                  <SettingRow label={t('settings.ai.autoAlerts')} description={t('settings.ai.autoAlertsDesc')}>
                    <Toggle on={autoAlerts} onChange={setAutoAlerts} />
                  </SettingRow>

                  <SettingRow label={t('settings.ai.scanFrequency')} description={t('settings.ai.scanFrequencyDesc')} last>
                    <select
                      value={scanFrequency}
                      onChange={e => setScanFrequency(e.target.value)}
                      style={{
                        width: 160, padding: '8px 12px', borderRadius: 'var(--r)',
                        border: '1.5px solid var(--border)', background: 'var(--bg)',
                        color: 'var(--text)', fontSize: 13, outline: 'none', cursor: 'pointer',
                      }}
                    >
                      <option value="realtime">{t('settings.ai.realtime')}</option>
                      <option value="daily">{t('settings.ai.daily')}</option>
                      <option value="weekly">{t('settings.ai.weekly')}</option>
                      <option value="manual">{t('settings.ai.manualOnly')}</option>
                    </select>
                  </SettingRow>

                  {/* Risk threshold slider */}
                  <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{t('settings.ai.riskThreshold')}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{t('settings.ai.riskThresholdDesc')}</div>
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
                      <span>{t('settings.ai.riskSensitive')}</span>
                      <span>{t('settings.ai.riskConservative')}</span>
                    </div>
                  </div>

                  {/* ── Operational thresholds ── */}
                  <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: -8 }}>{t('settings.ai.opThresholds')}</div>

                    {/* Task overdue days */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{t('settings.ai.taskOverdue')}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{t('settings.ai.taskOverdueDesc')}</div>
                        </div>
                        <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--amber)' }}>
                          {taskOverdueDays}d
                        </span>
                      </div>
                      <input
                        type="range" min={1} max={14} step={1}
                        value={taskOverdueDays}
                        onChange={e => setTaskOverdueDays(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--amber)', marginTop: 4 }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)', marginTop: 5 }}>
                        <span>{t('settings.ai.taskStrict')}</span>
                        <span>{t('settings.ai.taskLenient')}</span>
                      </div>
                    </div>

                    {/* Hire inactive days */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{t('settings.ai.inactiveAlert')}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{t('settings.ai.inactiveAlertDesc')}</div>
                        </div>
                        <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--red)' }}>
                          {hireInactiveDays}d
                        </span>
                      </div>
                      <input
                        type="range" min={2} max={14} step={1}
                        value={hireInactiveDays}
                        onChange={e => setHireInactiveDays(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--red)', marginTop: 4 }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)', marginTop: 5 }}>
                        <span>{t('settings.ai.inactiveSensitive')}</span>
                        <span>{t('settings.ai.inactiveRelaxed')}</span>
                      </div>
                    </div>

                    {/* Low morale threshold */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{t('settings.ai.lowMorale')}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{t('settings.ai.lowMoraleDesc')}</div>
                        </div>
                        <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', color: lowMoraleThreshold <= 2 ? 'var(--red)' : 'var(--amber)' }}>
                          {lowMoraleThreshold}/5
                        </span>
                      </div>
                      <input
                        type="range" min={1} max={4} step={1}
                        value={lowMoraleThreshold}
                        onChange={e => setLowMorale(Number(e.target.value))}
                        style={{ width: '100%', accentColor: 'var(--red)', marginTop: 4 }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text3)', marginTop: 5 }}>
                        <span>{t('settings.ai.moraleCritical')}</span>
                        <span>{t('settings.ai.moraleAverage')}</span>
                      </div>
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
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{t('settings.integrations.slackDesc')}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {integrations.slack.enabled && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} />
                            {t('settings.integrations.connected')}
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
                          <label style={{ fontSize: 11 }}>{t('settings.integrations.webhookUrl')}</label>
                          <input
                            value={integrations.slack.webhook}
                            onChange={e => setIntegrations(p => ({ ...p, slack: { ...p.slack, webhook: e.target.value } }))}
                            placeholder="https://hooks.slack.com/services/..."
                            style={{ fontSize: 12 }}
                          />
                        </div>
                        <div className="fg" style={{ margin: 0 }}>
                          <label style={{ fontSize: 11 }}>{t('settings.integrations.defaultChannel')}</label>
                          <input
                            value={integrations.slack.channel}
                            onChange={e => setIntegrations(p => ({ ...p, slack: { ...p.slack, channel: e.target.value } }))}
                            placeholder="#onboarding-alerts"
                            style={{ fontSize: 12 }}
                          />
                        </div>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ alignSelf: 'flex-start', fontSize: 11, minWidth: 140 }}
                          disabled={!integrations.slack.webhook.trim() || webhookTest.slack === 'loading'}
                          onClick={() => testWebhook('slack')}
                        >
                          {webhookTest.slack === 'loading' && <i className="fa-solid fa-spinner fa-spin" />}
                          {webhookTest.slack === 'ok'      && <i className="fa-solid fa-circle-check" style={{ color: 'var(--green)' }} />}
                          {webhookTest.slack === 'error'   && <i className="fa-solid fa-circle-xmark" style={{ color: 'var(--red)' }} />}
                          {webhookTest.slack === 'idle'    && <i className="fa-solid fa-paper-plane" />}
                          {' '}
                          {webhookTest.slack === 'loading' ? t('settings.integrations.sending')
                            : webhookTest.slack === 'ok'    ? t('settings.integrations.messageSent')
                            : webhookTest.slack === 'error' ? t('settings.integrations.failed')
                            : t('settings.integrations.testConnection')}
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
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{t('settings.integrations.teamsDesc')}</div>
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
                          <label style={{ fontSize: 11 }}>{t('settings.integrations.webhookUrl')}</label>
                          <input
                            value={integrations.teams.webhook}
                            onChange={e => setIntegrations(p => ({ ...p, teams: { ...p.teams, webhook: e.target.value } }))}
                            placeholder="https://outlook.office.com/webhook/..."
                            style={{ fontSize: 12 }}
                          />
                        </div>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ alignSelf: 'flex-start', fontSize: 11, minWidth: 140 }}
                          disabled={!integrations.teams.webhook.trim() || webhookTest.teams === 'loading'}
                          onClick={() => testWebhook('teams')}
                        >
                          {webhookTest.teams === 'loading' && <i className="fa-solid fa-spinner fa-spin" />}
                          {webhookTest.teams === 'ok'      && <i className="fa-solid fa-circle-check" style={{ color: 'var(--green)' }} />}
                          {webhookTest.teams === 'error'   && <i className="fa-solid fa-circle-xmark" style={{ color: 'var(--red)' }} />}
                          {webhookTest.teams === 'idle'    && <i className="fa-solid fa-paper-plane" />}
                          {' '}
                          {webhookTest.teams === 'loading' ? t('settings.integrations.sending')
                            : webhookTest.teams === 'ok'    ? t('settings.integrations.messageSent')
                            : webhookTest.teams === 'error' ? t('settings.integrations.failed')
                            : t('settings.integrations.testConnection')}
                        </button>
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
                            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{t('settings.integrations.hrisDesc')}</div>
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
                            <label style={{ fontSize: 11 }}>{t('settings.integrations.apiKey')}</label>
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
                  <SectionHeader icon="fa-envelope-open-text" title={t('settings.notifications.sectionTitle')} description={t('settings.notifications.sectionDesc')} color="var(--amber)" />

                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                    {t('settings.notifications.eventTriggers')}
                  </div>
                  {([
                    { key: 'journey_complete' as const,  labelKey: 'journeyComplete',  descKey: 'journeyCompleteDesc' },
                    { key: 'task_overdue' as const,      labelKey: 'taskOverdue',      descKey: 'taskOverdueDesc' },
                    { key: 'risk_increase' as const,     labelKey: 'riskIncrease',     descKey: 'riskIncreaseDesc' },
                    { key: 'checkin_reminder' as const,  labelKey: 'checkinReminder',  descKey: 'checkinReminderDesc' },
                    { key: 'weekly_digest' as const,     labelKey: 'weeklyDigest',     descKey: 'weeklyDigestDesc' },
                    { key: 'new_hire_joined' as const,   labelKey: 'newHireJoined',    descKey: 'newHireJoinedDesc' },
                  ] as const).map((item, i, arr) => (
                    <SettingRow
                      key={item.key}
                      label={t(`settings.notifications.${item.labelKey}` as never)}
                      description={t(`settings.notifications.${item.descKey}` as never)}
                      last={i === arr.length - 1}
                    >
                      <Toggle on={notifs[item.key]} onChange={() => toggleNotif(item.key)} />
                    </SettingRow>
                  ))}

                  {/* Digest schedule + preview */}
                  {notifs.weekly_digest && (
                    <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14 }}>
                        {t('settings.notifications.digestSchedule')}
                      </div>
                      <div className="db-grid-2col" style={{ gap: 12 }}>
                        <div className="fg" style={{ margin: 0 }}>
                          <label>{t('settings.notifications.sendOn')}</label>
                          <select value={digestDay} onChange={e => setDigestDay(e.target.value)}>
                            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].map(d => (
                              <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                            ))}
                          </select>
                        </div>
                        <div className="fg" style={{ margin: 0 }}>
                          <label>{t('settings.notifications.atTime')}</label>
                          <input
                            type="time"
                            value={digestTime}
                            onChange={e => setDigestTime(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Digest preview */}
                      <div style={{ marginTop: 16, padding: '14px 16px', background: 'var(--surface2)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <i className="fa-solid fa-eye" style={{ fontSize: 10 }} />
                          {t('settings.notifications.digestPreview')}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.8 }}>
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>
                            <i className="fa-solid fa-chart-bar" style={{ color: 'var(--blue)', marginRight: 6, fontSize: 11 }} />
                            {t('settings.notifications.weeklyDigestTitle')}
                          </div>
                          <div style={{ color: 'var(--text3)', fontSize: 11, marginBottom: 8 }}>
                            Sent every {digestDay.charAt(0).toUpperCase() + digestDay.slice(1)} at {digestTime}
                          </div>
                          {[
                            '📊 Team completion rate this week',
                            '⚠️ At-risk hires requiring attention',
                            '✅ Hires who completed a milestone',
                            '📅 Upcoming check-ins this week',
                            '💡 AI-recommended actions',
                          ].map((line, i) => (
                            <div key={i} style={{ fontSize: 11, color: 'var(--text2)', padding: '2px 0' }}>{line}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── JOURNEY TEMPLATES ─────────────────────────────── */}
              {active === 'templates' && (
                <div className="db-card" style={{ padding: '24px' }}>
                  <SectionHeader icon="fa-route" title={t('settings.templates.sectionTitle')} description={t('settings.templates.sectionDesc')} color="var(--aqua)" />

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
                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{t('settings.templates.builderTitle')}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>
                          {t('settings.templates.builderDesc')}
                        </div>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => router.push('/hr/journeys')}
                      >
                        <i className="fa-solid fa-arrow-right" /> {t('settings.templates.openBuilder')}
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
                    {t('settings.templates.templateInfo')}
                  </div>

                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                    <SettingRow label={t('settings.templates.defaultDuration')} description={t('settings.templates.defaultDurationDesc')}>
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
                    <SettingRow label={t('settings.templates.autoAssign')} description={t('settings.templates.autoAssignDesc')} last>
                      <Toggle on={false} onChange={() => {}} />
                    </SettingRow>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <SaveToast visible={saved} onHide={() => setSaved(false)} savedMsg={t('settings.savedToast')} />
      {saveError && (
        <div style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 3000,
          background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 'var(--r-xl)', padding: '12px 18px',
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: 'var(--shadow-lg)',
        }}>
          <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--red)', fontSize: 14 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--red)' }}>
            {saveError.includes('does not exist') ? 'Run the DB migration first — see supabase/migrations/' : saveError}
          </span>
          <button onClick={() => setSaveError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', marginLeft: 4, padding: 0 }}>
            <i className="fa-solid fa-xmark" style={{ fontSize: 11 }} />
          </button>
        </div>
      )}
    </>
  )
}
