'use client'

import { useState, useEffect } from 'react'
import { useT } from '@/lib/i18n/context'

interface PulseCheckProps {
  currentWeek: number
  journeyId: string
  previousPulses?: { week: number; score: number }[]
}

const EMOJIS: { label: string; value: number }[] = [
  { label: '😞', value: 1 },
  { label: '😕', value: 2 },
  { label: '😐', value: 3 },
  { label: '🙂', value: 4 },
  { label: '😊', value: 5 },
]

function getQuestionKey(week: number): string {
  if (week <= 2) return 'components.pulseCheck.question1'
  if (week <= 4) return 'components.pulseCheck.question2'
  if (week <= 8) return 'components.pulseCheck.question3'
  return 'components.pulseCheck.question4'
}

// English text for API payload — always sent in English regardless of UI language
function getQuestionEn(week: number): string {
  if (week <= 2) return 'How comfortable do you feel in your new role so far?'
  if (week <= 4) return 'How well are you connecting with your team?'
  if (week <= 8) return 'How productive do you feel this week?'
  return 'How aligned do you feel with team goals?'
}

const LOW_SCORE_PROMPT_KEYS: Record<number, string> = {
  1: 'components.pulseCheck.lowScore1',
  2: 'components.pulseCheck.lowScore2',
  3: 'components.pulseCheck.lowScore3',
}

export default function PulseCheck({ currentWeek, journeyId, previousPulses }: PulseCheckProps) {
  const { t } = useT()
  const storageKey = `pulse_check_week_${journeyId}`

  const [visible, setVisible]             = useState(false)
  const [myScore, setMyScore]             = useState<number | null>(null)
  const [teamAvg, setTeamAvg]             = useState<number | null>(null)
  const [hoveredValue, setHoveredValue]   = useState<number | null>(null)
  const [pendingScore, setPendingScore]   = useState<number | null>(null)
  const [followUpNote, setFollowUpNote]   = useState('')
  const [submitting, setSubmitting]       = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored !== null) {
        const storedWeek = parseInt(stored, 10)
        if (storedWeek === currentWeek) return
      }
    } catch { /* localStorage unavailable */ }
    setVisible(true)
  }, [storageKey, currentWeek])

  useEffect(() => {
    function onForceOpen() {
      setMyScore(null)
      setPendingScore(null)
      setFollowUpNote('')
      setVisible(true)
    }
    window.addEventListener('open-pulse', onForceOpen)
    return () => window.removeEventListener('open-pulse', onForceOpen)
  }, [])

  async function submitScore(score: number, note?: string) {
    setSubmitting(true)
    try {
      localStorage.setItem(storageKey, String(currentWeek))
    } catch { /* ignore */ }
    setMyScore(score)
    setTimeout(() => setVisible(false), 5000)
    if (score <= 3) {
      window.dispatchEvent(new CustomEvent('aura-pulse-submitted', { detail: { score } }))
    }
    try {
      const res = await fetch('/api/pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journey_id: journeyId, week: currentWeek, score, question: getQuestionEn(currentWeek), note }),
      })
      const data: { teamAvg?: number } = await res.json()
      if (data.teamAvg != null) setTeamAvg(data.teamAvg)
    } catch { /* ignore */ }
    setSubmitting(false)
  }

  function handleEmojiClick(value: number) {
    if (value <= 3) {
      setPendingScore(value)
    } else {
      submitScore(value)
    }
  }

  function dismiss() {
    try { localStorage.setItem(storageKey, String(currentWeek)) } catch { /* ignore */ }
    setVisible(false)
  }

  if (!visible) return null

  const question = t(getQuestionKey(currentWeek))

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: `4px solid ${pendingScore ? 'var(--amber)' : 'var(--cyan)'}`, borderRadius: 'var(--r-lg)', padding: '18px 20px', display: 'flex', alignItems: 'flex-start', gap: 14, boxShadow: 'var(--card-shadow)', transition: 'border-color 0.2s' }}>
      {/* Icon */}
      <div style={{ width: 38, height: 38, borderRadius: 'var(--r)', background: pendingScore ? 'rgba(245,158,11,0.12)' : 'var(--cyan-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <i className={pendingScore ? 'fa-solid fa-comment-dots' : 'fa-solid fa-heart-pulse'} style={{ fontSize: 16, color: pendingScore ? 'var(--amber)' : 'var(--cyan)' }} aria-hidden />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)', marginBottom: 3 }}>
          {pendingScore ? t(LOW_SCORE_PROMPT_KEYS[pendingScore]) : t('components.pulseCheck.weeklyQuestion')}
        </div>

        {myScore !== null ? (
          <AfterResponse myScore={myScore} teamAvg={teamAvg} previousPulses={previousPulses} currentWeek={currentWeek} />
        ) : pendingScore !== null ? (
          <div style={{ marginTop: 8 }}>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10, lineHeight: 1.4 }}>
              {t('components.pulseCheck.followUpDesc')}
            </p>
            <textarea
              autoFocus
              value={followUpNote}
              onChange={e => setFollowUpNote(e.target.value)}
              placeholder={t('components.pulseCheck.followUpPlaceholder')}
              rows={3}
              style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', color: 'var(--text)', fontSize: 13, padding: '10px 12px', resize: 'none', outline: 'none', lineHeight: 1.5, fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                onClick={() => submitScore(pendingScore, followUpNote || undefined)}
                disabled={submitting}
                style={{ flex: 1, background: 'var(--grad)', border: 'none', borderRadius: 'var(--r)', color: '#fff', fontSize: 12, fontWeight: 700, padding: '8px 16px', cursor: submitting ? 'wait' : 'pointer' }}
              >
                {submitting ? t('components.pulseCheck.sending') : t('components.pulseCheck.sendToManager')}
              </button>
              <button
                onClick={() => submitScore(pendingScore)}
                disabled={submitting}
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', color: 'var(--text3)', fontSize: 12, fontWeight: 600, padding: '8px 14px', cursor: 'pointer' }}
              >
                {t('components.pulseCheck.skip')}
              </button>
            </div>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 12 }}>{question}</p>

            {previousPulses && previousPulses.length >= 3 && (() => {
              const sorted = [...previousPulses].sort((a, b) => b.week - a.week).slice(0, 3)
              const isDecl = sorted[0].score < sorted[1].score && sorted[1].score < sorted[2].score
              if (!isDecl) return null
              return (
                <div style={{ marginBottom: 12, padding: '10px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--r)', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <i className="fa-solid fa-arrow-trend-down" style={{ fontSize: 12, color: 'var(--amber)', marginTop: 1, flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', display: 'block', marginBottom: 2 }}>{t('components.pulseCheck.moodDeclining')}</span>
                    <span style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.4 }}>{t('components.pulseCheck.moodDecliningDesc')}</span>
                  </div>
                </div>
              )
            })()}

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {EMOJIS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => handleEmojiClick(value)}
                  onMouseEnter={() => setHoveredValue(value)}
                  onMouseLeave={() => setHoveredValue(null)}
                  aria-label={`Rate ${value} out of 5`}
                  style={{ fontSize: 24, lineHeight: 1, background: hoveredValue === value ? 'var(--cyan-light)' : 'var(--surface2)', border: hoveredValue === value ? '2px solid var(--cyan)' : '2px solid var(--border)', borderRadius: 'var(--r)', width: 44, height: 44, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease', transform: hoveredValue === value ? 'scale(1.15)' : 'scale(1)' }}
                >
                  {label}
                </button>
              ))}
            </div>

            {previousPulses && previousPulses.length > 0 && (
              <HistorySparkline pulses={previousPulses} currentWeek={currentWeek} />
            )}
          </>
        )}
      </div>

      <button onClick={dismiss} aria-label={t('components.pulseCheck.dismissLabel')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4, flexShrink: 0, fontSize: 14, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="fa-solid fa-xmark" aria-hidden />
      </button>
    </div>
  )
}

// ── MoodArc — standalone always-visible history card ─────────────────────────

export function MoodArc({ pulses, currentWeek }: { pulses: { week: number; score: number }[]; currentWeek: number }) {
  const { t } = useT()
  if (pulses.length < 2) return null
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '16px 20px', boxShadow: 'var(--card-shadow)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 'var(--r)', background: 'var(--cyan-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="fa-solid fa-chart-line" style={{ fontSize: 13, color: 'var(--cyan)' }} aria-hidden />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{t('components.pulseCheck.moodArcTitle')}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
              {t('components.pulseCheck.moodArcLastWeeks').replace('{n}', String(Math.min(pulses.length, 6)))}
            </div>
          </div>
        </div>
        <button
          onClick={() => window.dispatchEvent(new Event('open-pulse'))}
          style={{ fontSize: 11, fontWeight: 600, color: 'var(--cyan)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}
        >
          {t('components.pulseCheck.checkIn')} <i className="fa-solid fa-plus" style={{ fontSize: 9 }} />
        </button>
      </div>
      <HistorySparkline pulses={pulses} currentWeek={currentWeek} />
    </div>
  )
}

// ── HistorySparkline ──────────────────────────────────────────────────────────

function HistorySparkline({ pulses, currentWeek }: { pulses: { week: number; score: number }[]; currentWeek: number }) {
  const { t } = useT()
  const sorted = [...pulses].sort((a, b) => a.week - b.week).slice(-6)
  if (sorted.length < 1) return null
  const last = sorted[sorted.length - 1]
  const prev = sorted.length >= 2 ? sorted[sorted.length - 2] : null
  const trend = prev == null ? null : last.score > prev.score ? 'up' : last.score < prev.score ? 'down' : 'flat'
  const trendColor = trend === 'up' ? 'var(--green)' : trend === 'down' ? 'var(--red)' : 'var(--text3)'
  const trendIcon  = trend === 'up' ? 'fa-solid fa-arrow-trend-up' : trend === 'down' ? 'fa-solid fa-arrow-trend-down' : 'fa-solid fa-minus'

  return (
    <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--surface2)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {t('components.pulseCheck.moodHistory')}
        </span>
        {trend && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: trendColor }}>
            <i className={trendIcon} style={{ fontSize: 10 }} />
            {trend === 'up' ? t('components.pulseCheck.trendUp') : trend === 'down' ? t('components.pulseCheck.trendDown') : t('components.pulseCheck.trendFlat')}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
        {sorted.map((p) => {
          const barH = Math.max(4, Math.round((p.score / 5) * 32))
          const color = p.score >= 4 ? 'var(--green)' : p.score >= 3 ? 'var(--cyan)' : 'var(--red)'
          const isLatest = p.week === last.week
          return (
            <div key={p.week} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1 }}>
              <span style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600 }}>{p.score}/5</span>
              <div
                title={`Week ${p.week}: ${EMOJIS[p.score - 1]?.label} ${p.score}/5`}
                style={{
                  width: '100%', maxWidth: 20, height: barH, background: color,
                  borderRadius: 3, opacity: isLatest ? 1 : 0.55,
                  outline: isLatest ? `2px solid ${color}` : 'none',
                  outlineOffset: 1,
                }}
              />
              <span style={{ fontSize: 9, color: p.week === currentWeek ? 'var(--cyan)' : 'var(--text3)', fontWeight: p.week === currentWeek ? 700 : 500 }}>
                W{p.week}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── AfterResponse ─────────────────────────────────────────────────────────────

function AfterResponse({
  myScore,
  teamAvg,
  previousPulses,
  currentWeek,
}: {
  myScore: number
  teamAvg: number | null
  previousPulses?: { week: number; score: number }[]
  currentWeek: number
}) {
  const { t } = useT()
  const allPulses = [...(previousPulses ?? []), { week: currentWeek, score: myScore }]

  const followUpKey =
    myScore <= 2 ? 'components.pulseCheck.followUpLow'
    : myScore === 3 ? 'components.pulseCheck.followUpMid'
    : 'components.pulseCheck.followUpHigh'

  const followUpColor =
    myScore <= 2 ? 'var(--amber)' : myScore === 3 ? 'var(--cyan)' : 'var(--green)'

  const followUpIcon =
    myScore <= 2 ? 'fa-solid fa-user-check' : myScore === 3 ? 'fa-solid fa-comment-dots' : 'fa-solid fa-rocket'

  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--cyan)', fontWeight: 600, marginBottom: 8 }}>
        <i className="fa-solid fa-circle-check" style={{ fontSize: 14 }} aria-hidden="true" />
        {t('components.pulseCheck.recorded')}
      </div>
      <div style={{
        padding: '10px 12px', borderRadius: 'var(--r)',
        background: myScore <= 2 ? 'rgba(245,158,11,0.08)' : myScore === 3 ? 'var(--cyan-light)' : 'rgba(34,197,94,0.08)',
        border: `1px solid ${myScore <= 2 ? 'rgba(245,158,11,0.25)' : myScore === 3 ? 'rgba(0,200,224,0.25)' : 'rgba(34,197,94,0.25)'}`,
        display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12,
      }}>
        <i className={followUpIcon} style={{ fontSize: 11, color: followUpColor, marginTop: 2, flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>{t(followUpKey)}</span>
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('components.pulseCheck.yourScore')}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 22 }}>{EMOJIS[myScore - 1]?.label}</span>
            <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>{myScore}/5</span>
          </div>
        </div>
        <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('components.pulseCheck.teamAvgThisWeek')}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {teamAvg != null ? (
              <>
                <span style={{ fontSize: 22 }}>{EMOJIS[Math.round(teamAvg) - 1]?.label}</span>
                <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>{teamAvg}/5</span>
              </>
            ) : (
              <span style={{ fontSize: 13, color: 'var(--text3)' }}>{t('components.pulseCheck.loadingAvg')}</span>
            )}
          </div>
        </div>
      </div>

      {allPulses.length > 1 && (
        <HistorySparkline pulses={allPulses} currentWeek={currentWeek} />
      )}
    </div>
  )
}
