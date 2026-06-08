'use client'

import { useState, useEffect } from 'react'

interface Day1BannerProps {
  dayNumber: number
  userName: string
  managerName?: string
  journeyId?: string
  templateName?: string
}

const FIRST_HOUR: { icon: string; text: string }[] = [
  { icon: 'fa-solid fa-mug-hot',       text: 'Grab a coffee and take a breath — you made it.' },
  { icon: 'fa-solid fa-laptop',        text: 'Log in and complete your IT setup tasks.' },
  { icon: 'fa-solid fa-people-arrows', text: 'Say hello to your team in the team channel.' },
]

interface PhaseMessage {
  headline: string
  sub: string
  accent: string
  phase: string
  tip?: string
}

function getPhaseMessage(dayNumber: number, userName: string, templateName?: string): PhaseMessage {
  const program = templateName ? ` · ${templateName}` : ''

  if (dayNumber === 1) return {
    phase: `Day 1 of 90${program}`,
    headline: `Welcome, ${userName}!`,
    sub: templateName
      ? `Your ${templateName} journey starts now. The whole team is rooting for you — take a breath and enjoy the moment.`
      : 'The whole team is rooting for you. Your 90-day journey starts right now — take a breath and enjoy the moment.',
    accent: 'var(--cyan)',
  }
  if (dayNumber <= 3) return {
    phase: `Day ${dayNumber} of 90${program}`,
    headline: 'You\'re already part of the team.',
    sub: 'The first days are all about absorbing. Don\'t worry about knowing everything — curiosity beats perfection right now.',
    accent: 'var(--blue)',
    tip: 'Tip: Write down 3 things you learned today.',
  }
  if (dayNumber <= 7) return {
    phase: `Week 1 · Day ${dayNumber}${program}`,
    headline: 'Week 1 — finding your rhythm.',
    sub: templateName
      ? `Your ${templateName} starts with meeting people and understanding how things work. Every question builds trust, not loses it.`
      : 'Focus on meeting people and understanding how things work. Every question you ask is building trust, not losing it.',
    accent: 'var(--aqua)',
    tip: 'Tip: Schedule a 15-min intro with one new teammate today.',
  }
  if (dayNumber <= 14) return {
    phase: `Week 2 · Day ${dayNumber}${program}`,
    headline: 'Week 2 — going deeper.',
    sub: 'You\'ve cleared the first-week jitters. Now it\'s time to start contributing. Small wins compound fast.',
    accent: 'var(--blue)',
    tip: 'Tip: Pick one task to own completely this week.',
  }
  if (dayNumber <= 21) return {
    phase: `Week 3 · Day ${dayNumber}${program}`,
    headline: 'Week 3 — you\'re making your mark.',
    sub: 'Three weeks in, you know more than you think. Your perspective as a newcomer is genuinely valuable — use it.',
    accent: 'var(--violet)',
    tip: 'Tip: Share one fresh idea or observation with your manager.',
  }
  if (dayNumber <= 28) return {
    phase: `Week 4 · Day ${dayNumber}${program}`,
    headline: 'Final stretch of Month 1.',
    sub: templateName
      ? `Almost at your 30-day ${templateName} milestone. Reflect on what\'s working and what you want to tackle next.`
      : 'Almost at your first major milestone. Reflect on what\'s working, what\'s unclear, and what you want to tackle next month.',
    accent: 'var(--amber)',
    tip: 'Tip: Prepare for your 30-day review — write down your wins.',
  }
  return {
    phase: `Day ${dayNumber}${program}`,
    headline: 'Month 1 complete — you\'re fully in the game.',
    sub: 'You\'ve built your foundation. Month 2 is where you start to accelerate and truly make your role your own.',
    accent: 'var(--green)',
    tip: 'Tip: Set one ambitious goal for Month 2.',
  }
}

export default function Day1Banner({ dayNumber, userName, managerName, journeyId, templateName }: Day1BannerProps) {
  const storageKey = journeyId ? `day1_checklist_${journeyId}` : null
  const [checkeds, setCheckeds] = useState<Set<number>>(new Set())
  const msg = getPhaseMessage(dayNumber, userName, templateName)

  useEffect(() => {
    if (!storageKey) return
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) setCheckeds(new Set(JSON.parse(raw) as number[]))
    } catch {}
  }, [storageKey])

  function toggle(idx: number) {
    setCheckeds(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      if (storageKey) {
        try { localStorage.setItem(storageKey, JSON.stringify([...next])) } catch {}
      }
      return next
    })
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0A0F1E 0%, #0D1D3E 100%)',
      borderRadius: 'var(--r-xl)',
      padding: '32px 36px',
      position: 'relative',
      overflow: 'hidden',
      color: '#fff',
      boxShadow: '0 16px 56px rgba(13,21,41,0.22)',
    }}>
      {/* Ambient glow */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)',
        width: 400, height: 400, borderRadius: '50%',
        background: `radial-gradient(circle, ${msg.accent}22 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Left: message */}
        <div style={{ flex: '1 1 260px' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: msg.accent, fontFamily: 'var(--font-display)', marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <i className="fa-solid fa-star" aria-hidden="true" />
            {msg.phase}
          </div>

          <h2 style={{
            fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 800,
            fontFamily: 'var(--font-display)', marginBottom: 10, lineHeight: 1.2,
          }}>
            {msg.headline}
          </h2>

          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, marginBottom: 16, maxWidth: 400 }}>
            {msg.sub}
          </p>

          {msg.tip && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 12px', borderRadius: 100,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500, marginBottom: 16,
            }}>
              <i className="fa-solid fa-lightbulb" style={{ color: msg.accent, fontSize: 10 }} />
              {msg.tip}
            </div>
          )}

          {managerName && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '7px 14px', borderRadius: 100,
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)',
              fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 500,
            }}>
              <i className="fa-solid fa-user-tie" style={{ color: msg.accent, fontSize: 10 }} />
              Your manager is <strong style={{ color: '#fff', marginLeft: 3 }}>{managerName}</strong>
            </div>
          )}
        </div>

        {/* Right: first-hour checklist */}
        {dayNumber === 1 && (
          <div style={{ flex: '1 1 220px' }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.5)', marginBottom: 12,
            }}>
              Your first hour
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FIRST_HOUR.map((item, idx) => {
                const done = checkeds.has(idx)
                return (
                  <button
                    key={idx}
                    onClick={() => toggle(idx)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 14px', borderRadius: 'var(--r)',
                      background: done ? 'rgba(34,211,184,0.14)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${done ? 'rgba(34,211,184,0.35)' : 'rgba(255,255,255,0.1)'}`,
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'background 0.2s, border-color 0.2s',
                    }}
                    aria-pressed={done}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      background: done ? 'var(--aqua)' : 'rgba(255,255,255,0.12)',
                      border: `1.5px solid ${done ? 'var(--aqua)' : 'rgba(255,255,255,0.2)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.2s',
                    }}>
                      {done
                        ? <i className="fa-solid fa-check" style={{ fontSize: 10, color: '#fff' }} />
                        : <i className={item.icon} style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }} />
                      }
                    </div>
                    <span style={{
                      fontSize: 12, color: done ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.85)',
                      textDecoration: done ? 'line-through' : 'none',
                      fontWeight: 500, lineHeight: 1.45,
                      transition: 'color 0.2s',
                    }}>
                      {item.text}
                    </span>
                  </button>
                )
              })}
            </div>

            {checkeds.size === FIRST_HOUR.length && (
              <div style={{
                marginTop: 12, padding: '8px 14px', borderRadius: 'var(--r)',
                background: 'rgba(34,211,184,0.12)', border: '1px solid rgba(34,211,184,0.3)',
                fontSize: 12, color: 'var(--aqua)', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 7,
              }}>
                <i className="fa-solid fa-party-horn" />
                You nailed your first hour!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
