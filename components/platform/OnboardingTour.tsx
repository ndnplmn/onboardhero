'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const STORAGE_KEY = 'onboardhero_tour_done'
const TOTAL_STEPS = 5

// ── Step dot indicator ───────────────────────────────────────────
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 28,
      }}
    >
      {Array.from({ length: total }, (_, i) => {
        const active = i === current
        return (
          <span
            key={i}
            style={{
              display: 'block',
              height: 8,
              width: active ? 24 : 8,
              borderRadius: 100,
              background: active
                ? 'linear-gradient(135deg, #00C8E0 0%, #1A6CF6 100%)'
                : '#E4E9F2',
              transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
              flexShrink: 0,
            }}
          />
        )
      })}
    </div>
  )
}

// ── Icon circle wrapper ──────────────────────────────────────────
function IconCircle({
  icon,
  gradBg = false,
}: {
  icon: React.ReactNode
  gradBg?: boolean
}) {
  return (
    <div
      style={{
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: gradBg
          ? 'linear-gradient(135deg, #00C8E0 0%, #1A6CF6 100%)'
          : 'linear-gradient(135deg, rgba(0,200,224,0.12) 0%, rgba(26,108,246,0.12) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
  )
}

// ── Individual step content definitions ─────────────────────────
function Step1() {
  return (
    <>
      <IconCircle
        icon={
          <i
            className="fa-solid fa-sparkles"
            style={{
              fontSize: 26,
              background: 'linear-gradient(135deg, #00C8E0 0%, #1A6CF6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
            aria-hidden="true"
          />
        }
      />
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 800,
          color: 'var(--text)',
          marginBottom: 10,
          lineHeight: 1.25,
        }}
      >
        Your onboarding command center
      </h2>
      <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7 }}>
        This dashboard gives you real-time visibility into every new hire's
        journey — from day 1 to day 90. Let's take a 2-minute tour.
      </p>
    </>
  )
}

function Step2() {
  const chips: { label: string; color: string; bg: string }[] = [
    { label: 'HR Admin', color: '#1A6CF6', bg: '#EBF1FF' },
    { label: 'Manager', color: '#00C8E0', bg: '#E0F9FC' },
    { label: 'New Hire', color: '#22C55E', bg: '#F0FDF4' },
  ]
  return (
    <>
      <IconCircle
        icon={
          <i
            className="fa-solid fa-people-roof"
            style={{ fontSize: 26, color: 'var(--blue)' }}
            aria-hidden="true"
          />
        }
      />
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 800,
          color: 'var(--text)',
          marginBottom: 10,
          lineHeight: 1.25,
        }}
      >
        HR, Manager &amp; New Hire views
      </h2>
      <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 20 }}>
        Use the role switcher in the sidebar to see the platform from each
        perspective. HR gets analytics, managers get coaching tools, and new
        hires get their personalized journey.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {chips.map((chip) => (
          <span
            key={chip.label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '5px 14px',
              borderRadius: 100,
              fontSize: 12,
              fontWeight: 700,
              color: chip.color,
              background: chip.bg,
              border: `1.5px solid ${chip.color}22`,
            }}
          >
            {chip.label}
          </span>
        ))}
      </div>
    </>
  )
}

function Step3() {
  return (
    <>
      <IconCircle
        icon={
          <i
            className="fa-solid fa-shield-halved"
            style={{ fontSize: 26, color: 'var(--blue)' }}
            aria-hidden="true"
          />
        }
      />
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 800,
          color: 'var(--text)',
          marginBottom: 10,
          lineHeight: 1.25,
        }}
      >
        Aura spots problems before they become crises
      </h2>
      <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 20 }}>
        OnboardHero's AI monitors each journey and flags friction points early.
        The risk score (0–100) tells you who needs attention. Scores above 60
        trigger automatic alerts.
      </p>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          background: '#FEF2F2',
          border: '1.5px solid #EF444433',
          borderRadius: 12,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#EF4444',
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#DC2626' }}>
          Score: 74
        </span>
        <span style={{ fontSize: 13, color: '#B91C1C' }}>
          🔴 High Risk — Take action
        </span>
      </div>
    </>
  )
}

function Step4({ onSkip }: { onSkip: () => void }) {
  return (
    <>
      <IconCircle
        icon={
          <i
            className="fa-solid fa-user-plus"
            style={{ fontSize: 26, color: 'var(--blue)' }}
            aria-hidden="true"
          />
        }
      />
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 800,
          color: 'var(--text)',
          marginBottom: 10,
          lineHeight: 1.25,
        }}
      >
        Add HR team, managers &amp; new hires
      </h2>
      <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 20 }}>
        Use the Employees section to invite your team. Assign managers to new
        hires, select journey templates, and let OnboardHero handle the rest.
      </p>
      {/* Inline action row — handled by the parent nav, but surfaced here visually */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          background: 'var(--surface2)',
          border: '1.5px solid var(--border)',
          borderRadius: 10,
          fontSize: 13,
          color: 'var(--text3)',
        }}
      >
        <i className="fa-solid fa-circle-info" aria-hidden="true" />
        Click <strong style={{ color: 'var(--blue)', marginLeft: 4, marginRight: 4 }}>Invite Now →</strong> below or skip to continue the tour.
      </div>
    </>
  )
}

function Step5() {
  return (
    <>
      <IconCircle
        gradBg
        icon={
          <i
            className="fa-solid fa-rocket"
            style={{ fontSize: 26, color: '#fff' }}
            aria-hidden="true"
          />
        }
      />
      <h2
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 22,
          fontWeight: 800,
          color: 'var(--text)',
          marginBottom: 10,
          lineHeight: 1.25,
        }}
      >
        Let's build your first journey
      </h2>
      <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7 }}>
        You're all set. Start by exploring the dashboard or use the AI Journey
        Builder to create your first onboarding template in seconds.
      </p>
    </>
  )
}

// ── Main component ───────────────────────────────────────────────
export default function OnboardingTour() {
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)   // 0-indexed
  const [mounted, setMounted] = useState(false)

  // Run only on client after hydration
  useEffect(() => {
    if (typeof window === 'undefined') return
    const done = localStorage.getItem(STORAGE_KEY)
    if (!done) {
      setVisible(true)
    }
    setMounted(true)
  }, [])

  const complete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }, [])

  const next = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1)
    } else {
      complete()
    }
  }, [step, complete])

  const prev = useCallback(() => {
    setStep((s) => Math.max(0, s - 1))
  }, [])

  // Don't render until client-side check is done
  if (!mounted || !visible) return null

  // Step titles for the heading above the modal
  const stepTitles = [
    'Welcome to OnboardHero! 👋',
    'Three Roles, One Platform',
    'AI-Powered Risk Detection',
    'Invite Your Team',
    "You're ready! 🎉",
  ]

  const isLastStep = step === TOTAL_STEPS - 1
  const isStep4 = step === 3

  return (
    // Backdrop
    <div
      role="dialog"
      aria-modal="true"
      aria-label={stepTitles[step]}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      {/* Modal card */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 20,
          padding: '40px 36px',
          maxWidth: 480,
          width: '100%',
          position: 'relative',
          boxShadow: '0 16px 56px rgba(13,21,41,0.18)',
          animation: 'ohTourIn 0.28s cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        {/* Keyframe injection — single declarative block, no <style> tag at render level */}
        <OhTourKeyframes />

        {/* Close / skip button */}
        <button
          onClick={complete}
          aria-label="Skip tour"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 30,
            height: 30,
            borderRadius: 8,
            border: 'none',
            background: '#F4F6FB',
            color: '#4B5773',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 14,
            transition: 'background 0.2s, color 0.2s',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = '#E4E9F2'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#0D1529'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = '#F4F6FB'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#4B5773'
          }}
        >
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>

        {/* Step dots */}
        <StepDots current={step} total={TOTAL_STEPS} />

        {/* Step heading */}
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#8893A8',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          Step {step + 1} of {TOTAL_STEPS}
        </p>

        {/* Step label */}
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 13,
            fontWeight: 700,
            color: '#1A6CF6',
            marginBottom: 14,
            textAlign: 'center',
            letterSpacing: '0.01em',
          }}
        >
          {stepTitles[step]}
        </p>

        {/* Step body — centered icon + content */}
        <div style={{ textAlign: 'center' }}>
          {step === 0 && <Step1 />}
          {step === 1 && <Step2 />}
          {step === 2 && <Step3 />}
          {step === 3 && <Step4 onSkip={next} />}
          {step === 4 && <Step5 />}
        </div>

        {/* Navigation row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: step > 0 ? 'space-between' : 'flex-end',
            gap: 12,
            marginTop: 32,
          }}
        >
          {/* Previous — visible from step 2 onward */}
          {step > 0 && (
            <button
              onClick={prev}
              style={{
                background: 'transparent',
                border: '1.5px solid #E4E9F2',
                borderRadius: 10,
                padding: '10px 18px',
                fontSize: 14,
                fontWeight: 600,
                color: '#4B5773',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.borderColor = '#00C8E0'
                el.style.color = '#1A6CF6'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement
                el.style.borderColor = '#E4E9F2'
                el.style.color = '#4B5773'
              }}
            >
              Previous
            </button>
          )}

          {/* Right side — context-aware buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {/* Step 1: "Start Tour →" */}
            {step === 0 && (
              <button
                onClick={next}
                style={{
                  background: 'linear-gradient(135deg, #00C8E0 0%, #1A6CF6 100%)',
                  border: 'none',
                  borderRadius: 10,
                  padding: '11px 22px',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  boxShadow: '0 4px 16px rgba(26,108,246,0.28)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.transform = 'translateY(-1px)'
                  el.style.boxShadow = '0 8px 24px rgba(26,108,246,0.38)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = '0 4px 16px rgba(26,108,246,0.28)'
                }}
              >
                Start Tour →
              </button>
            )}

            {/* Step 4: "Invite Now →" + "Skip for now" */}
            {isStep4 && (
              <>
                <button
                  onClick={next}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#8893A8',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  Skip for now
                </button>
                <button
                  onClick={() => {
                    complete()
                    router.push('/hr/employees')
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #00C8E0 0%, #1A6CF6 100%)',
                    border: 'none',
                    borderRadius: 10,
                    padding: '11px 22px',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#fff',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    boxShadow: '0 4px 16px rgba(26,108,246,0.28)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.transform = 'translateY(-1px)'
                    el.style.boxShadow = '0 8px 24px rgba(26,108,246,0.38)'
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.transform = 'translateY(0)'
                    el.style.boxShadow = '0 4px 16px rgba(26,108,246,0.28)'
                  }}
                >
                  Invite Now →
                </button>
              </>
            )}

            {/* Step 5: "Open Journey Builder" + "Go to Dashboard" */}
            {isLastStep && (
              <>
                <button
                  onClick={() => {
                    complete()
                    router.push('/hr/journeys')
                  }}
                  style={{
                    background: 'transparent',
                    border: '1.5px solid #E4E9F2',
                    borderRadius: 10,
                    padding: '10px 18px',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#4B5773',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    transition: 'border-color 0.2s, color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.borderColor = '#00C8E0'
                    el.style.color = '#1A6CF6'
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.borderColor = '#E4E9F2'
                    el.style.color = '#4B5773'
                  }}
                >
                  Open Journey Builder
                </button>
                <button
                  onClick={complete}
                  style={{
                    background: 'linear-gradient(135deg, #00C8E0 0%, #1A6CF6 100%)',
                    border: 'none',
                    borderRadius: 10,
                    padding: '11px 22px',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#fff',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    boxShadow: '0 4px 16px rgba(26,108,246,0.28)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.transform = 'translateY(-1px)'
                    el.style.boxShadow = '0 8px 24px rgba(26,108,246,0.38)'
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.transform = 'translateY(0)'
                    el.style.boxShadow = '0 4px 16px rgba(26,108,246,0.28)'
                  }}
                >
                  Go to Dashboard
                </button>
              </>
            )}

            {/* Steps 2 & 3: generic Next → */}
            {step > 0 && !isStep4 && !isLastStep && (
              <button
                onClick={next}
                style={{
                  background: 'linear-gradient(135deg, #00C8E0 0%, #1A6CF6 100%)',
                  border: 'none',
                  borderRadius: 10,
                  padding: '11px 22px',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  boxShadow: '0 4px 16px rgba(26,108,246,0.28)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.transform = 'translateY(-1px)'
                  el.style.boxShadow = '0 8px 24px rgba(26,108,246,0.38)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement
                  el.style.transform = 'translateY(0)'
                  el.style.boxShadow = '0 4px 16px rgba(26,108,246,0.28)'
                }}
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Inject keyframes once via a singleton portal-style component ─
// No <style> tag inside render — this component renders into <head>
// via a single dangerouslySetInnerHTML node that is idempotent.
function OhTourKeyframes() {
  useEffect(() => {
    const id = 'oh-tour-keyframes'
    if (document.getElementById(id)) return
    const el = document.createElement('style')
    el.id = id
    el.textContent = `
      @keyframes ohTourIn {
        from { opacity: 0; transform: scale(0.96); }
        to   { opacity: 1; transform: scale(1); }
      }
    `
    document.head.appendChild(el)
    return () => {
      document.getElementById(id)?.remove()
    }
  }, [])
  return null
}
