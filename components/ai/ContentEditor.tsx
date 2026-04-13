'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useEffect, useRef, useState, type FormEvent } from 'react'

const transport = new DefaultChatTransport({
  api: '/api/content',
})

function isToolPart(part: { type: string }): part is { type: string; toolName: string; toolCallId: string; state: string; output?: unknown } {
  return part.type === 'dynamic-tool' || part.type.startsWith('tool-')
}

export default function ContentEditor({ onClose }: { onClose: () => void }) {
  const { messages, sendMessage, status, error } = useChat({ transport })
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isLoading = status === 'submitted' || status === 'streaming'

  // Check if content was saved (look for tool outputs with success)
  const contentSaved = messages.some((msg) =>
    msg.parts.some((part) => {
      if (!isToolPart(part)) return false
      return (
        part.toolName === 'saveResource' &&
        part.state === 'output-available' &&
        (part.output as Record<string, unknown>)?.success
      )
    })
  )

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
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '4px' }}>
          <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: '8px', background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}></i>
          AI Content Studio
        </h2>
        <p style={{ color: 'var(--text3)', fontSize: '0.85rem', marginBottom: '16px' }}>
          Describe the onboarding content you need and the AI will generate it for you.
        </p>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '12px', minHeight: '300px' }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '40px 20px' }}>
              <p style={{ fontSize: '0.95rem', marginBottom: '12px' }}>
                Describe the content you want to create.
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>
                Example: &quot;Create an onboarding checklist for new engineers covering their first two weeks.&quot;
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
                    if (toolName === 'saveResource' && state === 'output-available') {
                      const output = part.output as Record<string, unknown>
                      if (output?.success) {
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
                          {toolName === 'getOrgContext' && 'Checking existing resources...'}
                          {toolName === 'getTemplateContext' && 'Loading template details...'}
                          {toolName === 'saveResource' && 'Saving content...'}
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
            <div className="chat-typing">Generating...</div>
          )}
          {error && (
            <div style={{ color: 'var(--red)', fontSize: '0.85rem', padding: '8px 0' }}>
              Something went wrong. Please try again.
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {contentSaved ? (
          <button className="btn btn-primary btn-block" onClick={onClose}>
            Done
          </button>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
            <input
              className="chat-input"
              style={{ flex: 1 }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe the content you need..."
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
        )}
      </div>
    </div>
  )
}
