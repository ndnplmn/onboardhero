'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useRef, useEffect, useState } from 'react'
import type { Profile } from '@/lib/db/types'

// ── Types ─────────────────────────────────────────────────────────────────────

type SimMode = 'RISK_INTERVENTION' | 'PERFORMANCE_COACHING' | 'CULTURE_FEEDBACK' | 'MILESTONE_REVIEW'
type Stage = 'selector' | 'setup' | 'chat' | 'review'

interface Scenario {
  mode: SimMode
  title: string
  description: string
  icon: string
  color: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
}

// ── Scenario definitions ───────────────────────────────────────────────────────

const SCENARIOS: Scenario[] = [
  {
    mode: 'RISK_INTERVENTION',
    title: 'Risk Intervention',
    description: 'Your new hire is disengaged. Practice having a supportive check-in conversation.',
    icon: 'fa-solid fa-life-ring',
    color: 'var(--amber)',
    difficulty: 'Intermediate',
  },
  {
    mode: 'PERFORMANCE_COACHING',
    title: 'Performance Coaching',
    description: 'A team member is struggling technically. Coach them without micromanaging.',
    icon: 'fa-solid fa-chart-line',
    color: 'var(--blue)',
    difficulty: 'Advanced',
  },
  {
    mode: 'CULTURE_FEEDBACK',
    title: 'Culture Feedback',
    description: 'Your hire feels excluded from the team culture. Navigate this sensitive conversation.',
    icon: 'fa-solid fa-people-group',
    color: 'var(--cyan)',
    difficulty: 'Advanced',
  },
  {
    mode: 'MILESTONE_REVIEW',
    title: '30-Day Review',
    description: 'Practice facilitating a constructive 30-day milestone conversation.',
    icon: 'fa-solid fa-calendar-check',
    color: 'var(--green)',
    difficulty: 'Beginner',
  },
]

// ── Difficulty badge colors ────────────────────────────────────────────────────

function difficultyStyle(difficulty: Scenario['difficulty']): React.CSSProperties {
  if (difficulty === 'Beginner')     return { background: 'rgba(34,197,94,0.12)',  color: 'var(--green)', border: '1px solid rgba(34,197,94,0.25)' }
  if (difficulty === 'Intermediate') return { background: 'rgba(245,158,11,0.12)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.25)' }
  return { background: 'rgba(239,68,68,0.10)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.25)' }
}

function riskColor(score: number) {
  if (score >= 70) return 'var(--red)'
  if (score >= 40) return 'var(--amber)'
  return 'var(--green)'
}

// ── Review feedback parser ────────────────────────────────────────────────────

function parseFeedback(text: string): { worked: string; improve: string; takeaway: string } {
  const lines = text.split('\n').map(l => l.replace(/^[-•*\d.]\s*/, '').trim()).filter(Boolean)
  return {
    worked:   lines[0] ?? '',
    improve:  lines[1] ?? '',
    takeaway: lines[2] ?? '',
  }
}

// ── Main component ────────────────────────────────────────────────────────────

interface RealHire {
  name:      string
  role:      string
  riskScore: number
  week:      number
}

export default function RoleplayClient({ user: _user, hires = [] }: { user: Profile; hires?: RealHire[] }) {
  const [stage, setStage] = useState<Stage>('selector')
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null)

  // Setup fields
  const [employeeName, setEmployeeName]     = useState('Alex Jordan')
  const [employeeRole, setEmployeeRole]     = useState('Software Engineer')
  const [riskScore, setRiskScore]           = useState(65)
  const [sentimentScore, setSentimentScore] = useState(45)

  // Review state
  const [reviewText, setReviewText]                 = useState<string | null>(null)
  const [isLoadingReview, setIsLoadingReview]       = useState(false)
  const [reviewError, setReviewError]               = useState<string | null>(null)
  const [noteSaved, setNoteSaved]                   = useState<'idle' | 'saving' | 'ok' | 'error'>('idle')
  const chatTranscriptRef = useRef<string>('')

  // ── Handlers ──────────────────────────────────────────────────────────────

  function selectScenario(scenario: Scenario) {
    setSelectedScenario(scenario)
    setStage('setup')
  }

  function beginSimulation() {
    setStage('chat')
  }

  async function endSimulation() {
    setStage('review')
    setIsLoadingReview(true)
    setReviewText(null)
    setReviewError(null)

    const transcript = chatTranscriptRef.current || '(No conversation recorded)'

    try {
      const response = await fetch('/api/leadership-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Analyze this leadership simulation transcript and provide constructive feedback in exactly 3 bullet points:
1. What the manager did well
2. One key area to improve
3. The single most important takeaway

Employee: ${employeeName} (${employeeRole})
Scenario: ${selectedScenario?.title}

Transcript:
${transcript}`,
        }),
      })

      if (!response.ok) throw new Error('Review request failed')
      const data: { text?: string; error?: string } = await response.json()
      if (data.error) throw new Error(data.error)
      setReviewText(data.text ?? null)
      // Log completion for HR visibility (fire-and-forget)
      fetch('/api/roleplay/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioTitle: selectedScenario?.title, difficulty: selectedScenario?.difficulty }),
      }).catch(() => { /* non-critical */ })
    } catch (err) {
      console.error('Leadership review error:', err)
      setReviewError('Could not generate review. Please try again.')
    } finally {
      setIsLoadingReview(false)
    }
  }

  async function saveToCoachingNotes() {
    if (!reviewText) return
    setNoteSaved('saving')
    try {
      const note = [
        `Roleplay: ${selectedScenario?.title ?? 'Unknown'} (${selectedScenario?.difficulty ?? ''})`,
        `Employee: ${employeeName} — ${employeeRole}`,
        '',
        reviewText,
      ].join('\n')
      const res = await fetch('/api/coaching-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note, source: 'roleplay' }),
      })
      setNoteSaved(res.ok ? 'ok' : 'error')
    } catch {
      setNoteSaved('error')
    }
    setTimeout(() => setNoteSaved('idle'), 3500)
  }

  function resetAll() {
    setStage('selector')
    setSelectedScenario(null)
    setEmployeeName('Alex Jordan')
    setEmployeeRole('Software Engineer')
    setRiskScore(65)
    setSentimentScore(45)
    setReviewText(null)
    setReviewError(null)
    setNoteSaved('idle')
    chatTranscriptRef.current = ''
  }

  // ── Render: Scenario Selector ─────────────────────────────────────────────

  if (stage === 'selector') {
    return (
      <>
        <div className="db-header">
          <div className="db-header-left">
            <h1>
              <i className="fa-solid fa-masks-theater" style={{
                marginRight: 8,
                background: 'var(--grad)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }} />
              Leadership Simulation
            </h1>
            <p>Choose a scenario to practice your management conversations with an AI-powered employee.</p>
          </div>
        </div>

        <div className="db-body">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 'var(--gap-standard)',
          }}>
            {SCENARIOS.map((scenario) => (
              <div
                key={scenario.mode}
                className="db-card"
                style={{
                  cursor: 'pointer',
                  transition: 'transform 0.15s var(--ease), box-shadow 0.15s var(--ease), border-color 0.15s',
                  border: '1px solid var(--border)',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget
                  el.style.transform = 'translateY(-2px)'
                  el.style.boxShadow = 'var(--shadow-lg)'
                  el.style.borderColor = scenario.color
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget
                  el.style.transform = ''
                  el.style.boxShadow = ''
                  el.style.borderColor = 'var(--border)'
                }}
                onClick={() => selectScenario(scenario)}
              >
                <div className="db-card-bd" style={{ padding: '24px' }}>
                  {/* Icon */}
                  <div style={{
                    width: 48, height: 48, borderRadius: 'var(--r-lg)',
                    background: `${scenario.color}18`,
                    border: `1px solid ${scenario.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 16,
                  }}>
                    <i className={scenario.icon} style={{ fontSize: 20, color: scenario.color }} />
                  </div>

                  {/* Title + difficulty */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                      {scenario.title}
                    </h3>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                      ...difficultyStyle(scenario.difficulty),
                    }}>
                      {scenario.difficulty}
                    </span>
                  </div>

                  {/* Description */}
                  <p style={{ fontSize: '0.875rem', color: 'var(--text3)', margin: '0 0 20px', lineHeight: 1.6 }}>
                    {scenario.description}
                  </p>

                  {/* CTA */}
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%' }}
                    onClick={(e) => { e.stopPropagation(); selectScenario(scenario) }}
                  >
                    Start Simulation
                    <i className="fa-solid fa-arrow-right" style={{ marginLeft: 6 }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    )
  }

  // ── Render: Pre-simulation Setup ──────────────────────────────────────────

  if (stage === 'setup' && selectedScenario) {
    return (
      <>
        <div className="db-header">
          <div className="db-header-left">
            <h1>
              <i className={selectedScenario.icon} style={{ marginRight: 8, color: selectedScenario.color }} />
              {selectedScenario.title}
            </h1>
            <p>Configure the employee profile before starting the simulation.</p>
          </div>
        </div>

        <div className="db-body">
          <div className="db-card" style={{ maxWidth: 560 }}>
            <div className="db-card-hd">
              <h3>
                <i className="fa-solid fa-sliders" style={{ color: 'var(--blue)' }} />
                Simulation Setup
              </h3>
            </div>
            <div className="db-card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Load a real hire from your team */}
              {hires.length > 0 && (
                <div style={{ padding: '14px', background: 'var(--surface2)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="fa-solid fa-users" style={{ color: 'var(--cyan)', fontSize: 11 }} />
                    Practice with a real hire
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {hires.map((h, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setEmployeeName(h.name)
                          setEmployeeRole(h.role)
                          setRiskScore(h.riskScore)
                          setSentimentScore(Math.max(10, 100 - h.riskScore))
                        }}
                        style={{
                          fontSize: 11, fontWeight: 700, padding: '5px 12px',
                          borderRadius: 100, cursor: 'pointer',
                          background: employeeName === h.name ? 'var(--cyan-light)' : 'var(--surface)',
                          border: `1px solid ${employeeName === h.name ? 'var(--cyan)' : 'var(--border)'}`,
                          color: employeeName === h.name ? 'var(--cyan)' : 'var(--text2)',
                          transition: 'all 0.15s',
                        }}
                      >
                        {h.name}
                        {h.riskScore > 60 && (
                          <i className="fa-solid fa-triangle-exclamation" style={{ marginLeft: 5, fontSize: 9, color: 'var(--amber)' }} />
                        )}
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 8 }}>
                    Click a hire to pre-fill this scenario with their real data
                  </div>
                </div>
              )}

              {/* Employee Name */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text2)' }}>
                  Employee Name
                </label>
                <input
                  className="chat-input"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="Alex Jordan"
                />
              </div>

              {/* Employee Role */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text2)' }}>
                  Role / Position
                </label>
                <input
                  className="chat-input"
                  value={employeeRole}
                  onChange={(e) => setEmployeeRole(e.target.value)}
                  placeholder="Software Engineer"
                />
              </div>

              {/* Risk Score */}
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text2)' }}>
                  <span>Risk Score</span>
                  <span style={{ color: riskColor(riskScore), fontFamily: 'var(--font-display)' }}>{riskScore}</span>
                </label>
                <input
                  type="range" min={0} max={100}
                  value={riskScore}
                  onChange={(e) => setRiskScore(Number(e.target.value))}
                  style={{ width: '100%', accentColor: riskColor(riskScore) }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                  <span>Low Risk (0)</span>
                  <span>High Risk (100)</span>
                </div>
              </div>

              {/* Sentiment Score */}
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text2)' }}>
                  <span>Sentiment Score</span>
                  <span style={{ color: riskColor(100 - sentimentScore), fontFamily: 'var(--font-display)' }}>{sentimentScore}</span>
                </label>
                <input
                  type="range" min={0} max={100}
                  value={sentimentScore}
                  onChange={(e) => setSentimentScore(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--cyan)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                  <span>Negative (0)</span>
                  <span>Positive (100)</span>
                </div>
              </div>

              {/* Scenario summary */}
              <div style={{
                padding: '14px 16px',
                borderRadius: 'var(--r-lg)',
                background: `${selectedScenario.color}0f`,
                border: `1px solid ${selectedScenario.color}25`,
                fontSize: 13,
                color: 'var(--text2)',
                lineHeight: 1.6,
              }}>
                <i className={selectedScenario.icon} style={{ color: selectedScenario.color, marginRight: 8 }} />
                {selectedScenario.description}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button className="btn btn-ghost" onClick={() => setStage('selector')}>
                  <i className="fa-solid fa-arrow-left" style={{ marginRight: 6 }} />
                  Back
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={beginSimulation}
                  disabled={!employeeName.trim() || !employeeRole.trim()}
                >
                  Begin Simulation
                  <i className="fa-solid fa-arrow-right" style={{ marginLeft: 6 }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── Render: Chat Simulation ───────────────────────────────────────────────

  if (stage === 'chat' && selectedScenario) {
    return (
      <SimChat
        scenario={selectedScenario}
        employeeName={employeeName}
        employeeRole={employeeRole}
        riskScore={riskScore}
        sentimentScore={sentimentScore}
        transcriptRef={chatTranscriptRef}
        onEnd={endSimulation}
      />
    )
  }

  // ── Render: Leadership Review ─────────────────────────────────────────────

  if (stage === 'review') {
    const parsed = reviewText ? parseFeedback(reviewText) : null

    return (
      <>
        <div className="db-header">
          <div className="db-header-left">
            <h1>
              <i className="fa-solid fa-chart-bar" style={{
                marginRight: 8,
                background: 'var(--grad)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }} />
              Session Review
            </h1>
            <p>Aura has analyzed your simulation conversation and prepared coaching feedback.</p>
          </div>
        </div>

        <div className="db-body">
          <div className="db-card" style={{ maxWidth: 600 }}>
            <div className="db-card-hd">
              <h3>
                <i className="fa-solid fa-robot" style={{ color: 'var(--cyan)' }} />
                AI Leadership Feedback
              </h3>
            </div>

            <div className="db-card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {isLoadingReview ? (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '32px 20px', color: 'var(--text3)',
                }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ color: 'var(--cyan)', fontSize: 18 }} />
                  <span style={{ fontSize: '0.95rem' }}>Aura is reviewing your conversation...</span>
                </div>
              ) : reviewError ? (
                <div style={{
                  padding: '16px', borderRadius: 'var(--r-lg)',
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                  color: 'var(--red)', fontSize: 14,
                }}>
                  <i className="fa-solid fa-circle-exclamation" style={{ marginRight: 8 }} />
                  {reviewError}
                </div>
              ) : parsed ? (
                <>
                  {/* What worked */}
                  <div style={{
                    padding: '16px 18px', borderRadius: 'var(--r-lg)',
                    background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <i className="fa-solid fa-circle-check" style={{ color: 'var(--green)', fontSize: 14 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        What worked well
                      </span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text2)', margin: 0, lineHeight: 1.65 }}>
                      {parsed.worked}
                    </p>
                  </div>

                  {/* Areas to improve */}
                  <div style={{
                    padding: '16px 18px', borderRadius: 'var(--r-lg)',
                    background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <i className="fa-solid fa-circle-arrow-up" style={{ color: 'var(--amber)', fontSize: 14 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Areas to improve
                      </span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text2)', margin: 0, lineHeight: 1.65 }}>
                      {parsed.improve}
                    </p>
                  </div>

                  {/* Key takeaway */}
                  <div style={{
                    padding: '16px 18px', borderRadius: 'var(--r-lg)',
                    background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <i className="fa-solid fa-lightbulb" style={{ color: 'var(--blue)', fontSize: 14 }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Key takeaway
                      </span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text2)', margin: 0, lineHeight: 1.65 }}>
                      {parsed.takeaway}
                    </p>
                  </div>
                </>
              ) : (
                <p style={{ color: 'var(--text3)', fontSize: '0.9rem' }}>No feedback available.</p>
              )}

              {/* Footer actions */}
              {!isLoadingReview && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, paddingTop: 8 }}>
                  {parsed && (
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: 12, color: noteSaved === 'ok' ? 'var(--green)' : noteSaved === 'error' ? 'var(--red)' : undefined }}
                      disabled={noteSaved === 'saving' || noteSaved === 'ok'}
                      onClick={saveToCoachingNotes}
                    >
                      {noteSaved === 'saving' && <i className="fa-solid fa-spinner fa-spin" />}
                      {noteSaved === 'ok'     && <i className="fa-solid fa-circle-check" />}
                      {noteSaved === 'error'  && <i className="fa-solid fa-circle-xmark" />}
                      {noteSaved === 'idle'   && <i className="fa-solid fa-bookmark" />}
                      {' '}
                      {noteSaved === 'saving' ? 'Saving…'
                        : noteSaved === 'ok'  ? 'Saved to Coaching Notes'
                        : noteSaved === 'error' ? 'Save failed'
                        : 'Save to Coaching Notes'}
                    </button>
                  )}
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={resetAll}>
                    <i className="fa-solid fa-rotate-left" style={{ marginRight: 6 }} />
                    Start New Simulation
                  </button>
                  <a href="/manager/coaching" className="btn btn-outline" style={{ whiteSpace: 'nowrap' }}>
                    <i className="fa-solid fa-arrow-left" style={{ marginRight: 6 }} />
                    Coaching Hub
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    )
  }

  return null
}

// ── SimChat — chat stage that surfaces transcript to parent ───────────────────

interface SimChatProps {
  scenario: Scenario
  employeeName: string
  employeeRole: string
  riskScore: number
  sentimentScore: number
  onEnd: () => void
  transcriptRef: React.MutableRefObject<string>
}

function SimChat({ transcriptRef, ...props }: SimChatProps) {
  const apiUrl = `/api/roleplay?mode=${props.scenario.mode}&employeeName=${encodeURIComponent(props.employeeName)}&role=${encodeURIComponent(props.employeeRole)}&riskScore=${props.riskScore}&sentimentScore=${props.sentimentScore}`

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: apiUrl }),
  })

  const [localInput, setLocalInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isLoading = status === 'submitted' || status === 'streaming'

  // Keep transcript ref current
  useEffect(() => {
    transcriptRef.current = messages
      .map(m => {
        const text = m.parts.filter(p => p.type === 'text').map(p => (p as { type: 'text'; text: string }).text).join(' ')
        return `${m.role === 'user' ? 'Manager' : props.employeeName}: ${text}`
      })
      .join('\n')
  }, [messages, props.employeeName, transcriptRef])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!localInput.trim() || isLoading) return
    const text = localInput
    setLocalInput('')
    await sendMessage({ text })
  }

  const initials = props.employeeName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <>
      {/* Chat page header */}
      <div className="db-header">
        <div className="db-header-left">
          <h1 style={{ fontSize: '1.15rem', marginBottom: 4 }}>
            <i className={props.scenario.icon} style={{ marginRight: 8, color: props.scenario.color }} />
            Simulation: {props.scenario.title}
          </h1>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 100,
              background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)',
            }}>
              <i className="fa-solid fa-user" style={{ marginRight: 5, fontSize: 10 }} />
              {props.employeeName} · {props.employeeRole}
            </span>
            <span style={{
              fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
              background: props.riskScore >= 70 ? 'rgba(239,68,68,0.1)' : props.riskScore >= 40 ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)',
              color: riskColor(props.riskScore),
              border: `1px solid ${riskColor(props.riskScore)}40`,
            }}>
              Risk {props.riskScore}
            </span>
          </div>
        </div>
        <div className="db-header-actions">
          <button className="btn btn-outline btn-sm" onClick={props.onEnd} style={{ whiteSpace: 'nowrap' }}>
            <i className="fa-solid fa-flag-checkered" style={{ marginRight: 6 }} />
            End Simulation
          </button>
        </div>
      </div>

      <div className="db-body">
        <div className="db-card" style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Messages */}
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '56px 24px', color: 'var(--text3)' }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'var(--grad-soft)', border: '1px solid var(--blue-light)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}>
                  <i className="fa-solid fa-comments" style={{
                    fontSize: 20,
                    background: 'var(--grad)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }} />
                </div>
                <p style={{ fontSize: '0.95rem', marginBottom: 6, color: 'var(--text2)', fontWeight: 600 }}>
                  {props.employeeName} is waiting for you
                </p>
                <p style={{ fontSize: '0.85rem' }}>
                  Start the conversation as you would in a real check-in.
                </p>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`chat-msg ${m.role}`}>
                  <div className="chat-avatar">
                    {m.role === 'assistant' ? (
                      <span style={{ fontSize: 11, fontWeight: 700 }}>{initials}</span>
                    ) : (
                      <i className="fa-solid fa-user-tie" style={{ fontSize: 13 }} />
                    )}
                  </div>
                  <div className="chat-bubble">
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, marginBottom: 4, opacity: 0.55 }}>
                      {m.role === 'user' ? 'You (Manager)' : props.employeeName}
                    </div>
                    {m.parts.map((p, i) =>
                      p.type === 'text' ? (
                        <span key={i}>{(p as { type: 'text'; text: string }).text}</span>
                      ) : null
                    )}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="chat-typing">
                <i className="fa-solid fa-ellipsis" style={{ marginRight: 6 }} />
                {props.employeeName} is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input form */}
          <form className="chat-input-form" onSubmit={handleSubmit}>
            <input
              className="chat-input"
              value={localInput}
              onChange={(e) => setLocalInput(e.target.value)}
              placeholder={`Message ${props.employeeName}...`}
              disabled={isLoading}
              autoFocus
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !localInput.trim()}
            >
              <i className="fa-solid fa-paper-plane" />
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
