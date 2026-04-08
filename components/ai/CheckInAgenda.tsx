'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useEffect, useRef, useState, type FormEvent } from 'react'

const transport = new DefaultChatTransport({
  api: '/api/coach',
})

function isToolPart(part: { type: string }): part is { type: string; toolName: string; toolCallId: string; state: string; output?: unknown } {
  return part.type === 'dynamic-tool' || part.type.startsWith('tool-')
}

const TOOL_LABELS: Record<string, string> = {
  getTeamProgress: 'Fetching team overview...',
  getEmployeeDetail: 'Looking up employee details...',
  generateCheckinAgenda: 'Gathering check-in data...',
  saveCheckinNotes: 'Saving notes...',
  getRiskIndicators: 'Analyzing risk indicators...',
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

  // Auto-send initial message if employee context is provided
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
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <button className="modal-close" onClick={onClose}>
          <i className="fa-solid fa-xmark"></i>
        </button>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", marginBottom: '4px' }}>
          <i className="fa-solid fa-user-tie" style={{ marginRight: '8px', background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}></i>
          AI Manager Coach
        </h2>
        <p style={{ color: 'var(--text3)', fontSize: '0.85rem', marginBottom: '16px' }}>
          {employeeName
            ? `Preparing check-in for ${employeeName}`
            : 'Get coaching tips, generate agendas, and manage check-ins.'}
        </p>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px', minHeight: '300px' }}>
          {messages.length === 0 && !employeeName && (
            <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '40px 20px' }}>
              <p style={{ fontSize: '0.95rem', marginBottom: '12px' }}>
                Ask me to help you prepare for check-ins or get coaching advice.
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>
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
                          <div key={i} style={{ padding: '12px', background: 'var(--green-bg, #e8f5e9)', borderRadius: 'var(--r)', marginTop: '8px' }}>
                            <i className="fa-solid fa-check-circle" style={{ color: 'var(--green, #4caf50)', marginRight: '8px' }}></i>
                            {output.message as string}
                          </div>
                        )
                      }
                      if (output?.error) {
                        return (
                          <div key={i} style={{ padding: '12px', background: 'var(--red-bg, #fbe9e7)', borderRadius: 'var(--r)', marginTop: '8px', color: 'var(--red)' }}>
                            <i className="fa-solid fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
                            {output.error as string}
                          </div>
                        )
                      }
                    }
                    if (state === 'input-available' || state === 'input-streaming') {
                      return (
                        <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text3)', fontStyle: 'italic', marginTop: '4px' }}>
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

          {isLoading && (
            <div className="chat-typing">Thinking...</div>
          )}
          {error && (
            <div style={{ color: 'var(--red)', fontSize: '0.85rem', padding: '8px 0' }}>
              Something went wrong. Please try again.
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
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
      </div>
    </div>
  )
}
