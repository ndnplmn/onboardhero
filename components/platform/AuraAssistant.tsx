'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './AuraAssistant.module.css'
import { useAura } from '@/hooks/useAura'
import { askAura } from '@/lib/actions/aura'

interface AuraAssistantProps {
  role: string
}

export default function AuraAssistant({ role }: AuraAssistantProps) {
  const [state, setState] = useState<'IDLE' | 'WHISPERING' | 'ENGAGED'>('IDLE')
  const { whisper, setWhisper } = useAura()
  const [query, setQuery] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])

  // Whisper detection
  useEffect(() => {
    if (whisper && state === 'IDLE') {
      setState('WHISPERING')
    }
  }, [whisper, state])

  // External open trigger (dispatched by "Get Help" button etc.)
  useEffect(() => {
    const handler = () => setState('ENGAGED')
    window.addEventListener('aura-open', handler)
    return () => window.removeEventListener('aura-open', handler)
  }, [])

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

    const res = await askAura(query, `Current Role: ${role}. Resource Hub current IDs: 1 (Handbook), 2 (IT Setup), 3 (Benefits), 4 (Brand). If a resource is relevant, include [[RESOURCE:ID]] in your response.`, messages)
    
    if (res.success && res.data) {
      let content = res.data!.content
      
      // Aura Intelligence 2026: Resource Deep-linking
      const resourceMatch = content.match(/\[\[RESOURCE:(\d+)\]\]/)
      if (resourceMatch) {
        const resourceId = resourceMatch[1]
        window.dispatchEvent(new CustomEvent('aura-highlight-resource', { detail: { id: resourceId } }))
        content = content.replace(/\[\[RESOURCE:\d+\]\]/, "").trim()
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
            <i className={`fa-solid fa-brain ${styles.auraFabIcon}`} />
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
                  <div className={styles.suggestions}>
                    <button onClick={() => setQuery("What should I focus on this week?")} className={styles.btnSugg}>"What should I focus on this week?"</button>
                    <button onClick={() => setQuery("Who should I connect with first?")} className={styles.btnSugg}>"Who should I connect with first?"</button>
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
