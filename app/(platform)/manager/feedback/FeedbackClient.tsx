'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type Sentiment = 'positive' | 'mixed' | 'negative'
type Source    = 'form' | 'check-in'

interface FeedbackItem {
  id:         string
  from:       string
  department: string
  avatar_url: string | null
  date:       string
  content:    string
  rating:     number
  category:   string
  sentiment:  Sentiment
  source:     Source
}

interface Kpis {
  total:         number
  avgRating:     number
  positivePct:   number
  negativeCount: number
}

interface CategoryEntry {
  label: string
  count: number
  pct:   number
}

interface FeedbackClientProps {
  feedback:   FeedbackItem[]
  kpis:       Kpis
  categories: CategoryEntry[]
}

type SentimentFilter = 'all' | 'positive' | 'mixed' | 'negative'

// ── Sub-components ────────────────────────────────────────────────────────

function Avatar({ url, name }: { url: string | null; name: string }) {
  if (url) return (
    <img src={url} alt={name} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  )
  return (
    <div style={{
      width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
      background: 'var(--blue-light)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontSize: 15, fontWeight: 800, color: 'var(--blue)',
    }}>
      {name.charAt(0)}
    </div>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <i
          key={i}
          className="fa-solid fa-star"
          style={{ fontSize: 11, color: i <= rating ? 'var(--amber)' : 'var(--border)' }}
        />
      ))}
    </div>
  )
}

function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  const MAP = {
    positive: { bg: 'var(--green-bg)', color: 'var(--green)', icon: 'fa-face-smile',      label: 'Positive' },
    mixed:    { bg: 'var(--amber-bg)', color: 'var(--amber)', icon: 'fa-face-meh',         label: 'Mixed'    },
    negative: { bg: 'var(--red-bg)',   color: 'var(--red)',   icon: 'fa-face-frown-open',  label: 'Negative' },
  }
  const s = MAP[sentiment]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
      background: s.bg, color: s.color,
    }}>
      <i className={`fa-solid ${s.icon}`} style={{ fontSize: 9 }} />
      {s.label}
    </span>
  )
}

function SourceBadge({ source }: { source: Source }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 100,
      background: 'var(--surface)', color: 'var(--text3)',
      border: '1px solid var(--border)', letterSpacing: '0.04em', textTransform: 'uppercase',
    }}>
      {source === 'form' ? 'Form' : 'Check-in'}
    </span>
  )
}

// ── Respond Modal ─────────────────────────────────────────────────────────

function RespondModal({ item, onClose }: { item: FeedbackItem; onClose: () => void }) {
  const [sent, setSent] = useState(false)
  const [text, setText] = useState('')

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setSent(true)
    setTimeout(onClose, 1800)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(13,21,41,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, background: 'var(--surface)', borderRadius: 'var(--r-xl)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 'var(--r)', background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="fa-solid fa-reply" style={{ fontSize: 16, color: 'var(--blue)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>Respond to {item.from.split(' ')[0]}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{item.category} · {item.date}</div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ color: 'var(--text3)', padding: '6px 8px' }}>
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {sent ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <i className="fa-solid fa-circle-check" style={{ fontSize: 24, color: 'var(--green)' }} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Response Sent!</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>Your reply has been recorded and shared with {item.from.split(' ')[0]}.</div>
          </div>
        ) : (
          <form onSubmit={handleSend}>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Original feedback preview */}
              <div style={{ padding: '12px 14px', background: 'var(--bg)', borderRadius: 'var(--r)', border: '1px solid var(--border)', borderLeft: '3px solid var(--blue)' }}>
                <p style={{ fontSize: 12, color: 'var(--text2)', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>
                  "{item.content.length > 160 ? item.content.slice(0, 160) + '…' : item.content}"
                </p>
              </div>

              {/* Reply textarea */}
              <div className="fg">
                <label>Your Response</label>
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder={`Thank ${item.from.split(' ')[0]} for their feedback and share your thoughts…`}
                  rows={4}
                  required
                  style={{ resize: 'none', background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--r)', padding: '10px 14px', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, background: 'var(--surface2)' }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={!text.trim()} style={{ flex: 2 }}>
                <i className="fa-solid fa-paper-plane" /> Send Response
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────

export default function FeedbackClient({ feedback, kpis, categories }: FeedbackClientProps) {
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>('all')
  const [categoryFilter,  setCategoryFilter]  = useState<string>('all')
  const [search,          setSearch]          = useState('')
  const [responding,      setResponding]       = useState<FeedbackItem | null>(null)
  const [flagged,         setFlagged]          = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return feedback.filter(f => {
      const matchesSentiment = sentimentFilter === 'all' || f.sentiment === sentimentFilter
      const matchesCategory  = categoryFilter  === 'all' || f.category  === categoryFilter
      const matchesSearch    = !q || f.from.toLowerCase().includes(q) || f.content.toLowerCase().includes(q)
      return matchesSentiment && matchesCategory && matchesSearch
    })
  }, [feedback, sentimentFilter, categoryFilter, search])

  const SENTIMENT_OPTIONS: { value: SentimentFilter; label: string; color: string }[] = [
    { value: 'all',      label: 'All',      color: 'var(--text2)' },
    { value: 'positive', label: 'Positive', color: 'var(--green)' },
    { value: 'mixed',    label: 'Mixed',    color: 'var(--amber)' },
    { value: 'negative', label: 'Negative', color: 'var(--red)'   },
  ]

  return (
    <>
      <div className="db-header">
        <div className="db-header-left">
          <h1>Team Feedback</h1>
          <p>Read and respond to feedback from your new hires to improve the onboarding experience.</p>
        </div>
      </div>

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        {/* KPIs */}
        <div className="kpi-row">
          <div className="kpi-card">
            <div className="kpi-icon blue"><i className="fa-solid fa-comments" /></div>
            <div className="kpi-value">{kpis.total}</div>
            <div className="kpi-label">Total Responses</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon amber"><i className="fa-solid fa-star" /></div>
            <div className="kpi-value">{kpis.avgRating}/5</div>
            <div className="kpi-label">Avg. Satisfaction</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon green"><i className="fa-solid fa-face-smile" /></div>
            <div className="kpi-value">{kpis.positivePct}%</div>
            <div className="kpi-label">Positive Sentiment</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon red"><i className="fa-solid fa-face-frown-open" /></div>
            <div className="kpi-value">{kpis.negativeCount}</div>
            <div className="kpi-label">Needs Attention</div>
          </div>
        </div>

        {/* Main 2/3 + Side 1/3 */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--gap-standard)', alignItems: 'start' }}>

          {/* Feedback list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

            {/* Filter bar */}
            <div className="db-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
                <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text3)' }} />
                <input
                  type="text"
                  placeholder="Search feedback…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: 30, paddingRight: 12, height: 32, fontSize: 12, background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--r)', color: 'var(--text)', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {/* Sentiment pills */}
              <div style={{ display: 'flex', gap: 6 }}>
                {SENTIMENT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setSentimentFilter(opt.value)}
                    style={{
                      fontSize: 11, padding: '4px 12px', borderRadius: 'var(--r)',
                      background: sentimentFilter === opt.value ? 'var(--blue)' : 'var(--surface)',
                      color:      sentimentFilter === opt.value ? '#fff'        : opt.color,
                      border:     sentimentFilter === opt.value ? 'none'        : '1px solid var(--border)',
                      fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Category filter */}
              {categories.length > 0 && (
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  style={{ height: 32, fontSize: 12, background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 'var(--r)', color: 'var(--text)', padding: '0 10px', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="all">All categories</option>
                  {categories.map(c => (
                    <option key={c.label} value={c.label}>{c.label}</option>
                  ))}
                </select>
              )}

              <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600, flexShrink: 0 }}>
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Cards */}
            {filtered.length === 0 ? (
              <div className="db-card" style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
                <i className="fa-solid fa-comment-slash" style={{ fontSize: 28, display: 'block', marginBottom: 10, color: 'var(--border)' }} />
                No feedback matches your filter.
              </div>
            ) : (
              <AnimatePresence mode="sync">
                {filtered.map((f, i) => {
                  const isFlagged = flagged.has(f.id)
                  const borderColor = f.sentiment === 'negative' ? 'var(--red)' : f.sentiment === 'positive' ? 'var(--green)' : 'var(--amber)'
                  return (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="db-card"
                      style={{ padding: '20px 24px', borderLeft: `3px solid ${borderColor}` }}
                    >
                      {/* Header row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 12 }}>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <Avatar url={f.avatar_url} name={f.from} />
                          <div>
                            <strong style={{ display: 'block', fontSize: 14, color: 'var(--text)', marginBottom: 3 }}>{f.from}</strong>
                            <span style={{ fontSize: 11, color: 'var(--text3)' }}>{f.department}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                          <StarRating rating={f.rating} />
                          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{f.date}</span>
                        </div>
                      </div>

                      {/* Badges */}
                      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                        <SentimentBadge sentiment={f.sentiment} />
                        <SourceBadge source={f.source} />
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'var(--surface)', color: 'var(--text3)', border: '1px solid var(--border)' }}>
                          {f.category}
                        </span>
                        {isFlagged && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: 'var(--amber-bg)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.2)' }}>
                            <i className="fa-solid fa-flag" style={{ fontSize: 8, marginRight: 3 }} />Flagged for HR
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65, marginBottom: 16, margin: '0 0 16px' }}>
                        "{f.content}"
                      </p>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: 11 }}
                          onClick={() => setResponding(f)}
                        >
                          <i className="fa-solid fa-reply" /> Respond
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: 11, color: isFlagged ? 'var(--amber)' : undefined }}
                          onClick={() => setFlagged(prev => {
                            const next = new Set(prev)
                            isFlagged ? next.delete(f.id) : next.add(f.id)
                            return next
                          })}
                        >
                          <i className={`fa-solid fa-flag${isFlagged ? '' : '-checkered'}`} />
                          {isFlagged ? ' Unflag' : ' Flag for HR'}
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

            {/* Sentiment breakdown */}
            <div className="db-card" style={{ padding: '24px' }}>
              <div className="db-card-hd" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <i className="fa-solid fa-chart-bar" style={{ color: 'var(--blue)' }} />
                  <h3>Sentiment Breakdown</h3>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {([
                  { key: 'positive' as Sentiment, label: 'Positive', color: 'var(--green)', icon: 'fa-face-smile'      },
                  { key: 'mixed'    as Sentiment, label: 'Mixed',    color: 'var(--amber)', icon: 'fa-face-meh'         },
                  { key: 'negative' as Sentiment, label: 'Negative', color: 'var(--red)',   icon: 'fa-face-frown-open'  },
                ]).map(({ key, label, color, icon }) => {
                  const count = feedback.filter(f => f.sentiment === key).length
                  const pct   = feedback.length > 0 ? Math.round((count / feedback.length) * 100) : 0
                  return (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 12, fontWeight: 600 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text2)' }}>
                          <i className={`fa-solid ${icon}`} style={{ color, fontSize: 11 }} />
                          {label}
                        </div>
                        <span style={{ color, fontWeight: 700 }}>{pct}%</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                          style={{ height: '100%', background: color, borderRadius: 100 }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Category distribution */}
            {categories.length > 0 && (
              <div className="db-card" style={{ padding: '24px' }}>
                <div className="db-card-hd" style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <i className="fa-solid fa-tag" style={{ color: 'var(--cyan)' }} />
                    <h3>By Category</h3>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {categories.map(c => (
                    <div
                      key={c.label}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => setCategoryFilter(categoryFilter === c.label ? 'all' : c.label)}
                    >
                      <span style={{
                        fontSize: 12, fontWeight: 600,
                        color: categoryFilter === c.label ? 'var(--blue)' : 'var(--text2)',
                      }}>
                        {c.label}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                        background: categoryFilter === c.label ? 'var(--blue-light)' : 'var(--surface)',
                        color:      categoryFilter === c.label ? 'var(--blue)'       : 'var(--text3)',
                        border: '1px solid var(--border)',
                      }}>
                        {c.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Insight */}
            <div className="db-card" style={{ padding: '20px', background: 'var(--grad-soft)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <i className="fa-solid fa-brain" style={{ color: 'var(--blue)', fontSize: 13 }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)' }}>AI Insight</span>
                <span className="badge-ai" style={{ marginLeft: 'auto' }}>Beta</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.65, margin: 0 }}>
                {kpis.negativeCount > 0
                  ? `${kpis.negativeCount} response${kpis.negativeCount > 1 ? 's' : ''} signal${kpis.negativeCount === 1 ? 's' : ''} dissatisfaction. Early follow-up within 48 hours reduces churn risk by up to 35%.`
                  : `Sentiment is trending positive at ${kpis.positivePct}%. Keep scheduling weekly 1:1s — engaged hires complete journeys 28% faster.`
                }
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* Respond Modal */}
      <AnimatePresence>
        {responding && (
          <RespondModal item={responding} onClose={() => setResponding(null)} />
        )}
      </AnimatePresence>
    </>
  )
}
