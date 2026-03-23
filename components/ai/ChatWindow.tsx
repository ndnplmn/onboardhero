'use client'

import { useChat } from '@ai-sdk/react'
import { useEffect, useRef, useState, type FormEvent } from 'react'

export default function ChatWindow() {
  const { messages, sendMessage, status, error } = useChat()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isLoading = status === 'submitted' || status === 'streaming'

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
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '60px 20px' }}>
            <p style={{ fontSize: '1.5rem', marginBottom: '8px' }}>👋</p>
            <p style={{ fontSize: '0.95rem' }}>
              Hi! I&apos;m your onboarding assistant. Ask me about your tasks, schedule, contacts, or anything else about your journey.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-msg ${msg.role}`}>
            <div className="chat-avatar">
              {msg.role === 'assistant' ? '🤖' : '👤'}
            </div>
            <div className="chat-bubble">
              {msg.parts
                .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
                .map((part, i) => (
                  <span key={i}>{part.text}</span>
                ))}
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
      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything about your onboarding..."
          disabled={isLoading}
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={isLoading || !input.trim()}
          style={{ padding: '12px 24px', borderRadius: 'var(--r-lg)' }}
        >
          Send
        </button>
      </form>
    </div>
  )
}
