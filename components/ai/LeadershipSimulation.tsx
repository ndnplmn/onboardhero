'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface LeadershipSimulationProps {
  onClose: () => void
  employeeData: {
    id: string
    name: string
    role: string
    riskScore: number
    sentimentScore: number
    blockers: string[]
  }
}

export default function LeadershipSimulation({ onClose, employeeData }: LeadershipSimulationProps) {
  const [mode, setMode] = useState<'ROLEPLAY' | 'FEEDBACK'>('ROLEPLAY')
  const [simMode] = useState<'RISK_INTERVENTION' | 'PERIODIC_REVIEW'>(
    employeeData.riskScore >= 40 ? 'RISK_INTERVENTION' : 'PERIODIC_REVIEW'
  )

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/roleplay?mode=${simMode}&employeeName=${encodeURIComponent(employeeData.name)}&role=${encodeURIComponent(employeeData.role)}&riskScore=${employeeData.riskScore}&sentimentScore=${employeeData.sentimentScore}`,
    })
  })

  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const [feedback, setFeedback] = useState<string | null>(null)
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false)

  // Live coaching metrics
  const [metrics, setMetrics] = useState({ empathy: 65, authority: 40, clarity: 80 })

  useEffect(() => {
    if (status === 'streaming' || status === 'submitted') {
      const interval = setInterval(() => {
        setMetrics(prev => ({
          empathy: Math.min(100, Math.max(0, prev.empathy + (Math.random() * 4 - 2))),
          authority: Math.min(100, Math.max(0, prev.authority + (Math.random() * 4 - 2))),
          clarity: Math.min(100, Math.max(0, prev.clarity + (Math.random() * 4 - 2))),
        }))
      }, 500)
      return () => clearInterval(interval)
    }
  }, [status])

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim() || status === 'submitted' || status === 'streaming') return
    const text = input
    setInput('')
    await sendMessage({ text })
  }

  const generateFeedback = async () => {
    setIsGeneratingFeedback(true)
    setMode('FEEDBACK')

    const transcript = messages.map(m => {
      const text = m.parts.filter(p => p.type === 'text').map(p => (p as any).text).join(' ')
      return `${m.role === 'user' ? 'Manager' : employeeData.name}: ${text}`
    }).join('\n')

    try {
      const response = await fetch('/api/leadership-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Analyze this leadership simulation transcript and provide a short review (3 bullet points) on the manager's performance in terms of empathy, clarity, and outcome.

Employee: ${employeeData.name}
Context: ${simMode}

Transcript:
${transcript}`
        })
      })

      if (!response.ok) throw new Error('Feedback failed')
      const data = await response.json()
      setFeedback(data.text)
    } catch (err) {
      console.error('Feedback error:', err)
      setFeedback("Great job completing the simulation! Review the coaching metrics above for a summary of your performance.")
    } finally {
      setIsGeneratingFeedback(false)
    }
  }

  const isLoading = status === 'submitted' || status === 'streaming'
  const contextLabel = simMode === 'RISK_INTERVENTION' ? 'Risk Intervention' : 'Periodic Review'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(13,21,41,0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: 900,
          maxWidth: 'calc(100vw - 48px)',
          height: 680,
          maxHeight: 'calc(100vh - 80px)',
          background: 'var(--surface)',
          borderRadius: 'var(--r-xl)',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)',
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Metrics Sidebar */}
        <div style={{
          width: 220,
          background: 'var(--sb-bg)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          flexShrink: 0,
        }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: 'var(--cyan)',
                boxShadow: '0 0 8px var(--cyan)',
              }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: '#fff' }}>
                Coaching Metrics
              </span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--sb-text)', lineHeight: 1.4 }}>
              Live performance tracking
            </span>
          </div>

          {/* Employee card */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 'var(--r)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '12px 14px',
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--grad)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <i className="fa-solid fa-user" style={{ fontSize: 12, color: '#fff' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>{employeeData.name}</div>
                <div style={{ fontSize: 10, color: 'var(--sb-text)', lineHeight: 1.2 }}>{employeeData.role}</div>
              </div>
            </div>
            <span style={{
              display: 'inline-block',
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 100,
              background: simMode === 'RISK_INTERVENTION' ? 'rgba(239,68,68,0.15)' : 'rgba(0,200,224,0.12)',
              color: simMode === 'RISK_INTERVENTION' ? '#f87171' : 'var(--cyan)',
              border: `1px solid ${simMode === 'RISK_INTERVENTION' ? 'rgba(239,68,68,0.3)' : 'rgba(0,200,224,0.2)'}`,
            }}>
              {contextLabel}
            </span>
          </div>

          {/* Metric bars */}
          {[
            { label: 'Empathy', value: metrics.empathy, color: 'var(--cyan)' },
            { label: 'Authority', value: metrics.authority, color: 'var(--red)' },
            { label: 'Clarity', value: metrics.clarity, color: 'var(--blue)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--sb-text)', letterSpacing: '0.04em' }}>{label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'var(--font-display)' }}>
                  {Math.round(value)}
                </span>
              </div>
              <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden' }}>
                <motion.div
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  style={{ height: '100%', background: color, borderRadius: 100 }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Modal header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface)',
          }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, marginBottom: 2 }}>
                <i className="fa-solid fa-users" style={{ marginRight: 8, background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }} />
                Leadership Simulation
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text3)', margin: 0 }}>
                Practice your conversation with {employeeData.name} · {contextLabel}
              </p>
            </div>
            <button
              onClick={onClose}
              className="btn btn-ghost btn-sm"
              style={{ color: 'var(--text3)' }}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          {/* Chat / Feedback area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            <AnimatePresence mode="wait">
              {mode === 'ROLEPLAY' ? (
                <motion.div
                  key="roleplay"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
                >
                  {messages.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '48px 20px' }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: '50%',
                        background: 'var(--grad-soft)',
                        border: '1px solid var(--blue-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                      }}>
                        <i className="fa-solid fa-comments" style={{ fontSize: 20, background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }} />
                      </div>
                      <p style={{ fontSize: '0.95rem', marginBottom: 8, color: 'var(--text2)', fontWeight: 600 }}>
                        Simulation ready — {employeeData.name} is waiting
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>
                        Start the conversation as you would in a real check-in.
                      </p>
                    </div>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={`chat-msg ${m.role}`}
                      >
                        <div className="chat-avatar">
                          {m.role === 'assistant'
                            ? <i className="fa-solid fa-user" />
                            : <i className="fa-solid fa-user-tie" />
                          }
                        </div>
                        <div className="chat-bubble">
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: 4, opacity: 0.6 }}>
                            {m.role === 'user' ? 'You (Manager)' : employeeData.name}
                          </div>
                          {m.parts.map((p, i) => p.type === 'text' ? <span key={i}>{(p as any).text}</span> : null)}
                        </div>
                      </div>
                    ))
                  )}
                  {isLoading && (
                    <div className="chat-typing">
                      <i className="fa-solid fa-ellipsis" style={{ marginRight: 6 }} />
                      {employeeData.name} is typing...
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </motion.div>
              ) : (
                <motion.div
                  key="feedback"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ maxWidth: 560, margin: '0 auto', paddingTop: 12 }}
                >
                  <div style={{
                    background: 'var(--grad-soft)',
                    border: '1px solid var(--blue-light)',
                    borderRadius: 'var(--r-lg)',
                    padding: '24px',
                    marginBottom: 16,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 'var(--r)',
                        background: 'var(--grad)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <i className="fa-solid fa-chart-line" style={{ fontSize: 14, color: '#fff' }} />
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>Session Review</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>AI coaching feedback</div>
                      </div>
                    </div>
                    {isGeneratingFeedback ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text3)', padding: '12px 0' }}>
                        <i className="fa-solid fa-spinner fa-spin" style={{ color: 'var(--cyan)' }} />
                        Generating your coaching report...
                      </div>
                    ) : (
                      <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>
                        {feedback}
                      </p>
                    )}
                  </div>
                  <button onClick={onClose} className="btn btn-primary btn-block">
                    Close Simulation
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer input */}
          {mode === 'ROLEPLAY' && (
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
                <input
                  className="chat-input"
                  style={{ flex: 1 }}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Message ${employeeData.name}...`}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading || !input.trim()}
                >
                  <i className="fa-solid fa-paper-plane" />
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={generateFeedback}
                  disabled={messages.length === 0}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  End & Review
                </button>
              </form>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
