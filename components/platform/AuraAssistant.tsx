'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './AuraAssistant.module.css'
import { useAura } from '@/hooks/useAura'
import { askAura, getAuraHistory } from '@/lib/actions/aura'

interface AuraAssistantProps {
  role: string
  journeyContext?: string
  resources?: { id: string; title: string }[]
}

const ROLE_SUGGESTIONS: Record<string, string[]> = {
  hire: [
    'What should I focus on this week?',
    'Who should I connect with first?',
    'How am I doing compared to other hires?',
    'What does my manager expect by day 30?',
    'I have a blocker — can you help?',
  ],
  manager: [
    'Which of my hires needs attention today?',
    'Draft a check-in message for my at-risk hire',
    'What are common blockers at week 3?',
    'How can I improve my team\'s engagement?',
    'Summarize my team\'s progress this week',
  ],
  hr: [
    'Who is most at risk of churning?',
    'Which department has the most friction?',
    'What actions should I take today?',
    'Compare this cohort to last quarter',
    'How are we tracking against industry benchmarks?',
  ],
}

function buildProactiveGreeting(context: string, role: string): string | null {
  const lower = context.toLowerCase()
  if (lower.includes('pending tasks this week')) {
    const match = context.match(/Pending tasks this week:\s*'([^']+)'/)
    const taskHint = match ? ` Your next task is "${match[1]}".` : ''
    return `Hi! I can see you have tasks pending this week.${taskHint} Want me to walk you through what to prioritize?`
  }
  if (role === 'manager' && lower.includes('at-risk')) {
    return `Hey — I noticed you have at-risk hires that may need attention. Want me to help you draft a check-in message or coaching plan?`
  }
  if (lower.includes('wiki') || lower.includes('resources')) {
    return `I can see there are resources available that match your current onboarding stage. Want me to point you to the most relevant ones?`
  }
  return `Hi! I'm Aura, your onboarding assistant. I have context about your current journey — what can I help you with today?`
}

export default function AuraAssistant({ role, journeyContext, resources }: AuraAssistantProps) {
  const [state, setState] = useState<'IDLE' | 'WHISPERING' | 'ENGAGED'>('IDLE')
  const { whisper, setWhisper } = useAura()
  const [query, setQuery] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const historyLoaded = useRef(false)

  // Load conversation history from Supabase on first open
  useEffect(() => {
    if (state !== 'ENGAGED' || historyLoaded.current) return
    historyLoaded.current = true
    getAuraHistory().then(history => {
      if (history.length > 0) setMessages(history)
    })
  }, [state])

  // Whisper detection
  useEffect(() => {
    if (whisper && state === 'IDLE') {
      setState('WHISPERING')
    }
  }, [whisper, state])

  // External open trigger (dispatched by "Get Help" button etc.)
  useEffect(() => {
    const handler = () => {
      setState('ENGAGED')
      // Inject proactive opening message from context when panel opens cold
      if (messages.length === 0 && journeyContext) {
        const proactiveGreeting = buildProactiveGreeting(journeyContext, role)
        if (proactiveGreeting) {
          setMessages([{ role: 'assistant', content: proactiveGreeting }])
        }
      }
    }
    window.addEventListener('aura-open', handler)
    return () => window.removeEventListener('aura-open', handler)
  }, [journeyContext, role, messages.length])

  const toggleEngage = () => {
    setState(prev => prev === 'ENGAGED' ? 'IDLE' : 'ENGAGED')
    setWhisper(null)
  }

  const handleSend = async () => {
    if (!query.trim()) return
    const userMsg = { role: 'user' as const, content: query }
    setMessages(prev => [...prev, userMsg])
    setQuery('')
    setIsTyping(true)
    setState('ENGAGED')

    const resourceMap = resources?.length
      ? `Available resources — reference with [[RESOURCE:id]]: ${resources.map(r => `[[RESOURCE:${r.id}]] = "${r.title}"`).join(', ')}.`
      : ''
    const systemContext = `Current Role: ${role}. ${journeyContext ?? ''} ${resourceMap} If a specific resource is relevant, include [[RESOURCE:id]] (use the exact id) in your response.`.trim()

    const res = await askAura(query, systemContext, messages)

    if (res.success && res.data) {
      let content = res.data!.content

      // Resource deep-linking — match UUID or any non-whitespace id
      const resourceMatch = content.match(/\[\[RESOURCE:([^\]]+)\]\]/)
      if (resourceMatch) {
        const resourceId = resourceMatch[1]
        window.dispatchEvent(new CustomEvent('aura-highlight-resource', { detail: { id: resourceId } }))
        content = content.replace(/\[\[RESOURCE:[^\]]+\]\]/, '').trim()
      }

      setMessages(prev => [...prev, { role: 'assistant', content }])
    } else {
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm having a bit of a glitch. Can we try that again?" }])
    }
    setIsTyping(false)
  }

  return (
    <div className={styles.auraContainer}>
      <AnimatePresence mode="wait">
        {state === 'WHISPERING' && whisper && (
          <motion.div 
            key="whisper"
            initial={{ opacity: 0, x: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: 30, filter: 'blur(10px)' }}
            transition={{ type: 'spring', damping: 20 }}
            className={styles.auraWhisper}
          >
            <div className={styles.whisperContent}>
              <i className={`fa-solid fa-sparkles ${styles.whisperIcon}`} />
              <p>{whisper}</p>
            </div>
            <button onClick={toggleEngage} className={styles.btnDeepDive}>Ask Aura</button>
          </motion.div>
        )}

        {state !== 'ENGAGED' && (
          <motion.button
            key="fab"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className={styles.auraFab}
            onClick={toggleEngage}
          >
            <i className={`fa-solid fa-sparkles ${styles.auraFabIcon}`} />
            Ask Aura
            <span className={styles.auraFabDot} />
          </motion.button>
        )}

        {state === 'ENGAGED' && (
          <motion.div 
            key="panel"
            initial={{ opacity: 0, scale: 0.4, x: 100, y: 100, originX: 1, originY: 1, filter: 'blur(20px)' }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.4, x: 100, y: 100, filter: 'blur(20px)' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={styles.auraPanel}
          >
            <div className={styles.scanline} />
            <div className={styles.header}>
              <div className={styles.brand}>
                <div className={styles.statusDot} />
                <h3>Aura Assistant</h3>
              </div>
              <button onClick={() => setState('IDLE')} className={styles.btnClose}>
                <i className="fa-solid fa-chevron-down" />
              </button>
            </div>

            <div className={styles.body}>
              {messages.length === 0 ? (
                <div className={styles.welcome}>
                  <div className={styles.titleGlow}>Your Onboarding Assistant</div>
                  <p>Ask me anything about your tasks, team, resources, or onboarding journey.</p>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6, marginTop: 12 }}>
                    What can I ask?
                  </div>
                  <div className={styles.suggestions}>
                    {ROLE_SUGGESTIONS[role as keyof typeof ROLE_SUGGESTIONS]?.map((q, i) => (
                      <button key={i} onClick={() => setQuery(q)} className={styles.btnSugg}>&ldquo;{q}&rdquo;</button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.messages}>
                  {messages.map((m, i) => (
                    <div key={i} className={`${styles.bubble} ${m.role === 'user' ? styles.userBubble : styles.assistantBubble}`}>
                      <div className={styles.bubbleContent}>{m.content}</div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className={`${styles.bubble} ${styles.assistantBubble}`}>
                      <div className={styles.bubbleContent}>
                         <div className={`${styles.neuralTyping} ${styles.dots}`} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={styles.footer}>
              <div className={styles.inputWrapper}>
                 <input 
                  type="text" 
                  placeholder="Ask me anything..." 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button onClick={handleSend} className={styles.btnSend}>
                  <i className="fa-solid fa-bolt-lightning" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
