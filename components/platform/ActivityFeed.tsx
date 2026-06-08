'use client'

import { useState, useMemo } from 'react'
import { useT } from '@/lib/i18n/context'

interface ActivityEntry {
  id:          string
  action_type: string
  actor_role:  string
  label:       string
  created_at:  string
}

interface ActivityFeedProps {
  entries: ActivityEntry[]
}

const ACTION_ICON: Record<string, string> = {
  task_completed:       'fa-solid fa-circle-check',
  task_uncompleted:     'fa-solid fa-circle-xmark',
  goal_added:           'fa-solid fa-flag',
  goal_status_changed:  'fa-solid fa-arrow-right-arrow-left',
  friction_reported:    'fa-solid fa-triangle-exclamation',
  friction_resolved:    'fa-solid fa-circle-check',
  check_in_completed:   'fa-solid fa-calendar-check',
  check_in_scheduled:   'fa-solid fa-calendar-plus',
  progress_reviewed:    'fa-solid fa-eye',
  nudge_sent:           'fa-solid fa-bell',
  ai_suggestion_accepted: 'fa-solid fa-wand-magic-sparkles',
}

const ACTION_COLOR: Record<string, string> = {
  task_completed:       '#22c55e',
  check_in_completed:   '#00c8e0',
  check_in_scheduled:   '#818cf8',
  progress_reviewed:    '#60a5fa',
  goal_added:           '#f59e0b',
  goal_status_changed:  '#f59e0b',
  friction_reported:    '#f97316',
  friction_resolved:    '#22c55e',
  nudge_sent:           '#e879f9',
  ai_suggestion_accepted: '#a78bfa',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)   return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const MANAGER_KEY_MAP: Record<string, string> = {
  progress_reviewed:       'managerReviewedProgress',
  check_in_scheduled:      'managerScheduledCheckIn',
  check_in_completed:      'managerCompletedCheckIn',
  nudge_sent:              'managerSentNudge',
  ai_suggestion_accepted:  'managerAcceptedAI',
  goal_status_changed:     'managerUpdatedGoal',
  friction_resolved:       'managerResolvedConcern',
}

const HR_KEY_MAP: Record<string, string> = {
  progress_reviewed:  'hrReviewedProgress',
  check_in_scheduled: 'hrScheduledCheckIn',
  nudge_sent:         'hrSentNudge',
}

const BUDDY_KEY_MAP: Record<string, string> = {
  check_in_completed: 'buddyCompletedCheckIn',
  check_in_scheduled: 'buddyScheduledMeeting',
}

type FilterTab = 'all' | 'tasks' | 'checkins' | 'manager'

const TASK_TYPES    = new Set(['task_completed', 'task_uncompleted', 'ai_suggestion_accepted'])
const CHECKIN_TYPES = new Set(['check_in_completed', 'check_in_scheduled'])

const PAGE_SIZE = 10

export default function ActivityFeed({ entries }: ActivityFeedProps) {
  const { t } = useT()
  const [visible, setVisible]   = useState(PAGE_SIZE)
  const [filter, setFilter]     = useState<FilterTab>('all')

  const FILTER_TABS: { key: FilterTab; labelKey: string; icon: string }[] = [
    { key: 'all',      labelKey: 'components.activityFeed.filterAll',      icon: 'fa-solid fa-timeline' },
    { key: 'tasks',    labelKey: 'components.activityFeed.filterTasks',    icon: 'fa-solid fa-circle-check' },
    { key: 'checkins', labelKey: 'components.activityFeed.filterCheckIns', icon: 'fa-solid fa-calendar-check' },
    { key: 'manager',  labelKey: 'components.activityFeed.filterManager',  icon: 'fa-solid fa-user-tie' },
  ]

  function resolveLabel(entry: ActivityEntry): string {
    if (entry.actor_role === 'manager') {
      const key = MANAGER_KEY_MAP[entry.action_type]
      return key ? t(`components.activityFeed.${key}`) : entry.label
    }
    if (entry.actor_role === 'hr') {
      const key = HR_KEY_MAP[entry.action_type]
      return key ? t(`components.activityFeed.${key}`) : entry.label
    }
    if (entry.actor_role === 'buddy') {
      const key = BUDDY_KEY_MAP[entry.action_type]
      return key ? t(`components.activityFeed.${key}`) : entry.label
    }
    return entry.label
  }

  const filtered = useMemo(() => {
    if (filter === 'tasks')    return entries.filter(e => TASK_TYPES.has(e.action_type))
    if (filter === 'checkins') return entries.filter(e => CHECKIN_TYPES.has(e.action_type))
    if (filter === 'manager')  return entries.filter(e => e.actor_role === 'manager')
    return entries
  }, [entries, filter])

  if (!entries.length) return null

  const shown   = filtered.slice(0, visible)
  const hasMore = filtered.length > visible

  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fa-solid fa-timeline" style={{ color: 'var(--cyan)', fontSize: 13 }} aria-hidden="true" />
          {t('components.activityFeed.title')}
        </h3>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>
          {entries.length} {t('components.activityFeed.events')}
        </span>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '0 20px 12px', overflowX: 'auto' }}>
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setFilter(tab.key); setVisible(PAGE_SIZE) }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100,
              border: `1px solid ${filter === tab.key ? 'var(--cyan)' : 'var(--border)'}`,
              background: filter === tab.key ? 'color-mix(in srgb, var(--cyan) 12%, transparent)' : 'var(--surface2)',
              color: filter === tab.key ? 'var(--cyan)' : 'var(--text3)',
              cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}
          >
            <i className={tab.icon} style={{ fontSize: 9 }} />
            {t(tab.labelKey)}
          </button>
        ))}
      </div>
      <div className="db-card-bd" style={{ padding: '0 20px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {shown.map((entry, i) => {
            const icon  = ACTION_ICON[entry.action_type]  ?? 'fa-solid fa-circle'
            const color = ACTION_COLOR[entry.action_type] ?? 'var(--text3)'
            const isManager = entry.actor_role === 'manager'
            const isLast = i === shown.length - 1
            const label = resolveLabel(entry)

            return (
              <div key={entry.id} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                {!isLast && (
                  <div style={{ position: 'absolute', left: 11, top: 26, width: 2, bottom: -2, background: 'var(--border)', zIndex: 0 }} />
                )}

                <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${color}22`, border: `1.5px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 12, position: 'relative', zIndex: 1 }}>
                  <i className={icon} style={{ fontSize: 9, color }} aria-hidden="true" />
                </div>

                <div style={{ flex: 1, paddingTop: 10, paddingBottom: 12 }}>
                  <p style={{ fontSize: 12.5, color: isManager ? 'var(--text)' : 'var(--text2)', fontWeight: isManager ? 600 : 400, margin: 0, lineHeight: 1.45 }}>
                    {label}
                    {isManager && (
                      <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, background: 'rgba(0,200,224,0.12)', color: 'var(--cyan)', padding: '1px 6px', borderRadius: 4 }}>
                        {t('components.activityFeed.managerBadge')}
                      </span>
                    )}
                  </p>
                  <span style={{ fontSize: 10.5, color: 'var(--text3)', marginTop: 2, display: 'block' }}>
                    {timeAgo(entry.created_at)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {hasMore && (
          <button
            onClick={() => setVisible(v => v + PAGE_SIZE)}
            style={{
              marginTop: 8, width: '100%', padding: '8px',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 'var(--r)', fontSize: 12, fontWeight: 600,
              color: 'var(--text3)', cursor: 'pointer', transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text3)')}
          >
            {t('components.activityFeed.showMore').replace('{n}', String(Math.min(PAGE_SIZE, entries.length - visible)))}
            <i className="fa-solid fa-chevron-down" style={{ marginLeft: 6, fontSize: 10 }} />
          </button>
        )}
      </div>
    </div>
  )
}
