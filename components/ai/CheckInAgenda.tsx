'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const transport = new DefaultChatTransport({
  api: '/api/coach',
})

function isToolPart(part: { type: string }): part is { type: string; toolName: string; toolCallId: string; state: string; output?: unknown } {
  return part.type === 'dynamic-tool' || part.type.startsWith('tool-')
}

const TOOL_LABELS: Record<string, string> = {
  getTeamProgress:       'Fetching team overview...',
  getEmployeeDetail:     'Looking up employee details...',
  generateCheckinAgenda: 'Gathering check-in data...',
  saveCheckinNotes:      'Saving notes...',
  getRiskIndicators:     'Analyzing risk indicators...',
}

interface CheckInAgendaProps {
  onClose: () => void
  employeeName?: string
  journeyId?: string
}

export default function CheckInAgenda({ onClose, employeeName, journeyId }: CheckInAgendaProps) {
  const { messages, sendMessage, status, error } = useChat({ transport })
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasSentInitial = useRef(false)

  const isLoading = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    if (employeeName && journeyId && !hasSentInitial.current) {
      hasSentInitial.current = true
      sendMessage({
        text: `Generate a check-in agenda for ${employeeName} (journey ID: ${journeyId}). Include their current progress, any risk indicators, and suggested talking points.`,
      })
    }
  }, [employeeName, journeyId, sendMessage])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    const text = input
    setInput('')
    await sendMessage({ text })
  }

  return (
    <AnimatePresence>
      <div
        className="modal-overlay open"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className="modal-box"
          style={{ maxWidth: 800, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <button className="modal-close" onClick={onClose}>
            <i className="fa-solid fa-xmark" />
          </button>

          <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 4 }}>
            <i className="fa-solid fa-user-tie" style={{
              marginRight: 8,
              background: 'var(--grad)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }} />
            AI Manager Coach
          </h2>
          <p style={{ color: 'var(--text3)', fontSize: '0.85rem', marginBottom: 16 }}>
            {employeeName
              ? `Preparing check-in for ${employeeName}`
              : 'Get coaching tips, generate agendas, and manage check-ins.'}
          </p>

          <div style={{ flex: 1, overflowY: 'auto', marginBottom: 12, minHeight: 300, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.length === 0 && !employeeName && (
              <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '40px 20px' }}>
                <p style={{ fontSize: '0.95rem', marginBottom: 12 }}>
                  Ask me to help you prepare for check-ins or get coaching advice.
                </p>
                <p style={{ fontSize: '0.85rem' }}>
                  Try: &quot;Show me my team&apos;s progress&quot; or &quot;How should I handle a new hire who is falling behind?&quot;
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`chat-msg ${msg.role}`}>
                <div className="chat-avatar">
                  {msg.role === 'assistant'
                    ? <i className="fa-solid fa-sparkles" />
                    : <i className="fa-solid fa-user" />
                  }
                </div>
                <div className="chat-bubble">
                  {msg.parts.map((part, i) => {
                    if (part.type === 'text') {
                      return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part.text}</span>
                    }
                    if (isToolPart(part)) {
                      const { toolName, state } = part
                      if (toolName === 'saveCheckinNotes' && state === 'output-available') {
                        const output = part.output as Record<string, unknown>
                        if (output?.message) {
                          return (
                            <div key={i} style={{ padding: '12px', background: 'var(--green-bg)', borderRadius: 'var(--r)', marginTop: 8 }}>
                              <i className="fa-solid fa-circle-check" style={{ color: 'var(--green)', marginRight: 8 }} />
                              {output.message as string}
                            </div>
                          )
                        }
                        if (output?.error) {
                          return (
                            <div key={i} style={{ padding: '12px', background: 'var(--red-bg)', borderRadius: 'var(--r)', marginTop: 8, color: 'var(--red)' }}>
                              <i className="fa-solid fa-circle-exclamation" style={{ marginRight: 8 }} />
                              {output.error as string}
                            </div>
                          )
                        }
                      }
                      if (state === 'input-available' || state === 'input-streaming') {
                        return (
                          <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text3)', fontStyle: 'italic', marginTop: 4 }}>
                            {TOOL_LABELS[toolName] || 'Processing...'}
                          </div>
                        )
                      }
                      return null
                    }
                    return null
                  })}
                </div>
              </div>
            ))}

            {isLoading && <div className="chat-typing">Thinking...</div>}
            {error && (
              <div style={{ color: 'var(--red)', fontSize: '0.85rem', padding: '8px 0' }}>
                Something went wrong. Please try again.
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
            <input
              className="chat-input"
              style={{ flex: 1 }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your team, request an agenda, or get coaching tips..."
              disabled={isLoading}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !input.trim()}
            >
              Send
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
