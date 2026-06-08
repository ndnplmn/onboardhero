'use client'

import { useState, useEffect } from 'react'

interface ProactiveAuraProps {
  role: 'hr' | 'manager' | 'hire'
  atRiskCount?: number
  pendingTasks?: number
  weekNumber?: number
  employeeName?: string
  taskCompletionPct?: number
  avgSentiment?: number
  riskScore?: number
  pendingTaskTitles?: string[]
  managerName?: string
  // New: names of hires whose risk score crossed 60 recently
  newAtRiskNames?: string[]
  // New: number of overdue check-ins
  overdueCheckIns?: number
  onSchedule?: () => void
}

// Build a deterministic state key from the actionable signals.
// When this key changes, the dismiss clears and a new insight shows.
function buildStateKey(props: ProactiveAuraProps): string {
  const { role, atRiskCount, pendingTasks, taskCompletionPct, riskScore, overdueCheckIns } = props
  const risk    = Math.round((atRiskCount ?? 0))
  const pct     = Math.round((taskCompletionPct ?? 0) / 10) * 10   // bucket by 10%
  const pending = Math.min(pendingTasks ?? 0, 5)                    // cap at 5 to avoid per-task churn
  const rs      = riskScore !== undefined ? (riskScore > 60 ? 'hi' : 'ok') : 'n'
  const oci     = Math.min(overdueCheckIns ?? 0, 3)
  return `${role}-${risk}-${pct}-${pending}-${rs}-${oci}`
}

function getInsight(props: ProactiveAuraProps): { text: string; isEvent: boolean } {
  const {
    role, atRiskCount, pendingTasks, weekNumber, employeeName,
    taskCompletionPct, avgSentiment, riskScore,
    pendingTaskTitles, managerName, newAtRiskNames, overdueCheckIns,
  } = props

  // ── HR ──────────────────────────────────────────────────────────────────────
  if (role === 'hr') {
    if (atRiskCount !== undefined && atRiskCount > 0) {
      const names = newAtRiskNames?.length
        ? newAtRiskNames.slice(0, 2).join(' and ') + (newAtRiskNames.length > 2 ? ` +${newAtRiskNames.length - 2}` : '')
        : null
      const who = names ?? `${atRiskCount} ${atRiskCount === 1 ? 'journey' : 'journeys'}`
      const sentiment = avgSentiment != null
        ? ` Team sentiment: ${avgSentiment}% — ${avgSentiment < 50 ? 'act now to reverse the trend.' : 'still positive.'}`
        : ''
      return {
        isEvent: true,
        text: `⚡ ${who} ${atRiskCount === 1 ? 'needs' : 'need'} your attention. Early intervention increases success rates by 3×.${sentiment}`,
      }
    }
    if (overdueCheckIns !== undefined && overdueCheckIns > 0) {
      return {
        isEvent: true,
        text: `📅 ${overdueCheckIns} check-in${overdueCheckIns > 1 ? 's are' : ' is'} overdue. Completing them reduces early attrition risk by 40%.`,
      }
    }
    if (atRiskCount === 0) {
      const completion = taskCompletionPct != null ? ` Task completion: ${taskCompletionPct}%.` : ''
      return {
        isEvent: false,
        text: `✨ All journeys on track.${completion} A good time to review upcoming 30-day milestones proactively.`,
      }
    }
    return {
      isEvent: false,
      text: '🔍 Review your highest-risk departments in the Friction Map — early patterns predict 90-day outcomes.',
    }
  }

  // ── Manager ──────────────────────────────────────────────────────────────────
  if (role === 'manager') {
    if (atRiskCount !== undefined && atRiskCount > 0) {
      const name = newAtRiskNames?.[0] ?? employeeName ?? 'One of your hires'
      return {
        isEvent: true,
        text: `⚡ ${name}'s risk score crossed the threshold. Aura recommends a casual 1:1 this week — informal conversations work 2× better than formal check-ins at this stage.`,
      }
    }
    if (overdueCheckIns !== undefined && overdueCheckIns > 0) {
      return {
        isEvent: true,
        text: `📅 You have ${overdueCheckIns} overdue check-in${overdueCheckIns > 1 ? 's' : ''}. Rescheduling now keeps your hires on track and signals that you're invested.`,
      }
    }
    if (pendingTasks !== undefined && pendingTasks > 0) {
      const first = pendingTaskTitles?.[0]
      return {
        isEvent: true,
        text: first
          ? `📋 Pending: "${first}"${pendingTasks > 1 ? ` and ${pendingTasks - 1} more` : ''}. Completing them now improves your team's 30-day retention by 28%.`
          : `📋 You have ${pendingTasks} pending coaching ${pendingTasks === 1 ? 'task' : 'tasks'}. Completing them improves 30-day retention by 28%.`,
      }
    }
    return {
      isEvent: false,
      text: '💡 Managers who check in during weeks 2–3 see 40% higher 90-day retention. Your team may be in that window.',
    }
  }

  // ── Hire ─────────────────────────────────────────────────────────────────────
  if (riskScore !== undefined && riskScore > 60) {
    const mgr = managerName ? `${managerName} has been alerted` : 'Your manager has been alerted'
    return {
      isEvent: true,
      text: `🤝 Aura detected friction in your journey. ${mgr} — a check-in is coming. Focus on your top 2 tasks this week.`,
    }
  }
  if (pendingTaskTitles && pendingTaskTitles.length > 0) {
    const topTask = pendingTaskTitles[0]
    return {
      isEvent: true,
      text: `📋 Your next task: "${topTask}". Completing it keeps your journey on track${managerName ? ` — ${managerName} can see your progress` : ''}.`,
    }
  }
  if (weekNumber !== undefined && weekNumber <= 2) {
    return {
      isEvent: false,
      text: `👋 You're in the most critical window${managerName ? ` — ${managerName} is watching for your early wins` : ''}. Relationships built in weeks 1–2 predict 6-month success.`,
    }
  }
  if (weekNumber !== undefined && weekNumber >= 3 && weekNumber <= 6) {
    return {
      isEvent: false,
      text: `🎯 Week ${weekNumber}: find one thing you can own independently and drive it to completion.`,
    }
  }
  return {
    isEvent: false,
    text: "💪 Past the halfway mark — the hardest part is over. Now it's about contributing and growing.",
  }
}

export default function ProactiveAura(props: ProactiveAuraProps) {
  const { role, onSchedule } = props
  const [dismissed, setDismissed] = useState(true)
  const [visible, setVisible]     = useState(false)
  const [stateKey, setStateKey]   = useState('')

  useEffect(() => {
    const key    = buildStateKey(props)
    const stored = localStorage.getItem(`aura_dismissed_${key}`)
    setStateKey(key)
    if (stored !== '1') {
      setDismissed(false)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  // Re-show if actionable state changes (new risk event, task completed, etc.)
  useEffect(() => {
    const newKey = buildStateKey(props)
    if (newKey === stateKey) return
    setStateKey(newKey)
    const stored = localStorage.getItem(`aura_dismissed_${newKey}`)
    if (stored !== '1') {
      setDismissed(false)
      setVisible(false)
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.atRiskCount, props.pendingTasks, props.taskCompletionPct, props.riskScore, props.overdueCheckIns])

  function handleDismiss() {
    setVisible(false)
    setTimeout(() => {
      localStorage.setItem(`aura_dismissed_${stateKey}`, '1')
      setDismissed(true)
    }, 280)
  }

  if (dismissed) return null

  const { text, isEvent } = getInsight(props)

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 14,
        padding: '14px 20px', borderRadius: 'var(--r)',
        background: 'var(--grad-soft)', border: '1px solid var(--border)',
        borderLeft: `3px solid ${isEvent ? 'var(--amber)' : 'var(--cyan)'}`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(-8px)',
        transition: 'opacity 0.28s ease, transform 0.28s ease',
      }}
      role="status"
      aria-live="polite"
    >
      <div style={{
        width: 36, height: 36, borderRadius: '50%', background: 'var(--grad)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, boxShadow: '0 0 0 3px rgba(0,200,224,0.18)',
      }} aria-hidden="true">
        <i className={`fa-solid fa-${isEvent ? 'bell' : 'sparkles'}`} style={{ color: '#fff', fontSize: 14 }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: isEvent ? 'var(--amber)' : 'var(--cyan)', marginBottom: 3,
        }}>
          {isEvent ? 'Action needed' : 'Aura Insight'}
        </div>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, margin: 0 }}>
          {text}
        </p>
      </div>

      {role === 'manager' && onSchedule && (
        <button onClick={onSchedule} style={{
          flexShrink: 0, background: 'var(--grad)', border: 'none', borderRadius: 'var(--r)',
          color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-display)',
          padding: '7px 14px', cursor: 'pointer', whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <i className="fa-solid fa-calendar-plus" style={{ fontSize: 11 }} aria-hidden="true" />
          Schedule Now
        </button>
      )}

      <button onClick={handleDismiss} aria-label="Dismiss Aura insight" style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 6,
        borderRadius: 'var(--r)', color: 'var(--text3)', flexShrink: 0, lineHeight: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.15s',
      }}
        onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text)')}
        onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text3)')}
      >
        <i className="fa-solid fa-xmark" style={{ fontSize: 13 }} aria-hidden="true" />
      </button>
    </div>
  )
}
