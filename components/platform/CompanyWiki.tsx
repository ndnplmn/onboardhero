'use client'

import { useState, useMemo, useRef } from 'react'

const CATEGORIES = [
  { id: 'all',         name: 'All Articles',         icon: 'fa-solid fa-th-large' },
  { id: 'culture',     name: 'Culture & Values',      icon: 'fa-solid fa-heart' },
  { id: 'benefits',    name: 'Benefits & Perks',      icon: 'fa-solid fa-gift' },
  { id: 'it',          name: 'IT & Security',         icon: 'fa-solid fa-shield-halved' },
  { id: 'office',      name: 'Office Life',           icon: 'fa-solid fa-building-user' },
  { id: 'engineering', name: 'Engineering Standards', icon: 'fa-solid fa-code' },
  { id: 'product',     name: 'Product Roadmap',       icon: 'fa-solid fa-map-location-dot' },
]

const ARTICLES = [
  {
    id: 'a1',
    title: 'The OnboardHero Mission',
    date: 'Updated 2 days ago',
    excerpt: 'Our goal is to make every new employee feel like a hero from day one. Discover what drives our product philosophy and how we measure success.',
    category: 'culture',
    readTime: '4 min read',
    pinned: true,
  },
  {
    id: 'a2',
    title: 'Bio-luminescent Design Principles',
    date: 'Updated 1 week ago',
    excerpt: 'How we use light and motion to create organic, living interfaces that communicate state and guide attention without overwhelming users.',
    category: 'engineering',
    readTime: '7 min read',
    pinned: false,
  },
  {
    id: 'a3',
    title: 'Remote-First Guidelines',
    date: 'Updated 1 month ago',
    excerpt: 'Best practices for asynchronous communication, distributed teamwork, and maintaining culture across time zones.',
    category: 'culture',
    readTime: '5 min read',
    pinned: false,
  },
  {
    id: 'a4',
    title: 'Cybersecurity 101',
    date: 'Updated 3 days ago',
    excerpt: 'Essential security protocols for protecting company and client data. Required reading for all new hires before system access.',
    category: 'it',
    readTime: '6 min read',
    pinned: true,
  },
  {
    id: 'a5',
    title: 'Health & Wellness Benefits',
    date: 'Updated 2 weeks ago',
    excerpt: 'Full breakdown of medical, dental, vision, mental health, and gym stipend programs available from day one.',
    category: 'benefits',
    readTime: '3 min read',
    pinned: false,
  },
  {
    id: 'a6',
    title: 'Office Etiquette & Space Guide',
    date: 'Updated 5 days ago',
    excerpt: 'Everything you need to know about booking rooms, hot-desking policy, kitchen rules, and quiet zones.',
    category: 'office',
    readTime: '4 min read',
    pinned: false,
  },
  {
    id: 'a7',
    title: 'Product Roadmap Q2 2026',
    date: 'Updated 4 days ago',
    excerpt: 'Key initiatives for Q2: AI-powered friction detection, manager coaching upgrades, and the new hire journey builder 2.0.',
    category: 'product',
    readTime: '5 min read',
    pinned: false,
  },
  {
    id: 'a8',
    title: 'Engineering Onboarding Checklist',
    date: 'Updated 1 week ago',
    excerpt: 'Step-by-step setup guide for new engineers: repo access, local dev environment, CI/CD overview, and first PR workflow.',
    category: 'engineering',
    readTime: '8 min read',
    pinned: false,
  },
]

const CATEGORY_COLOR: Record<string, string> = {
  culture:     'var(--cyan)',
  benefits:    'var(--green)',
  it:          'var(--blue)',
  office:      'var(--amber)',
  engineering: 'var(--violet)',
  product:     'var(--aqua)',
}

interface ArticleDraft {
  title: string
  category: string
  excerpt: string
  readTime: string
  pinned: boolean
}

interface CompanyWikiProps {
  canManage?: boolean
}

export default function CompanyWiki({ canManage = false }: CompanyWikiProps) {
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch]                 = useState('')
  const [articles, setArticles]             = useState(ARTICLES)
  const [showAddModal, setShowAddModal]     = useState(false)
  const [readArticleId, setReadArticleId]   = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return articles.filter((a) => {
      const matchCat = activeCategory === 'all' || a.category === activeCategory
      const matchQ   = !q || a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q)
      return matchCat && matchQ
    })
  }, [activeCategory, search])

  const pinned  = filtered.filter(a => a.pinned)
  const regular = filtered.filter(a => !a.pinned)

  return (
    <>
      <div className="db-header">
        <div className="db-header-left">
          <h1>
            <i
              className="fa-solid fa-book-open"
              style={{
                marginRight: 8,
                background: 'var(--grad)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              aria-hidden="true"
            />
            Company Wiki
          </h1>
          <p>The definitive guide to everything at OnboardHero.</p>
        </div>
        <div className="db-header-actions">
          {canManage && (
            <button className="btn btn-primary btn-sm btn-glow" aria-label="Add new wiki article" onClick={() => setShowAddModal(true)}>
              <i className="fa-solid fa-plus" aria-hidden="true" /> Add Article
            </button>
          )}
          <div style={{ position: 'relative' }}>
            <i
              className="fa-solid fa-magnifying-glass"
              aria-hidden="true"
              style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text3)', fontSize: 12, pointerEvents: 'none',
              }}
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles…"
              aria-label="Search wiki articles"
              style={{
                width: 220,
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r)',
                padding: '8px 12px 8px 34px',
                fontSize: 13,
                color: 'var(--text)',
                outline: 'none',
                fontFamily: 'var(--font-body)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--cyan)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,200,224,0.1)' }}
              onBlur={e  => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
            />
          </div>
        </div>
      </div>

      <div className="db-body">
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 'var(--gap-standard)', alignItems: 'start' }}>

          {/* Categories sidebar */}
          <nav aria-label="Wiki categories">
            <div className="db-card">
              <div className="db-card-hd">
                <h3>
                  <i className="fa-solid fa-folder-tree" style={{ color: 'var(--blue)' }} aria-hidden="true" />
                  {' '}Categories
                </h3>
                {canManage && (
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: 'var(--blue-light)', color: 'var(--blue)' }}>
                    Admin
                  </span>
                )}
              </div>
              <div style={{ padding: '8px' }}>
                {CATEGORIES.map((cat) => {
                  const isActive = activeCategory === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      aria-current={isActive ? 'page' : undefined}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        width: '100%', padding: '9px 12px',
                        borderRadius: 'var(--r)',
                        background: isActive ? 'var(--blue-light)' : 'transparent',
                        color: isActive ? 'var(--blue)' : 'var(--text2)',
                        border: 'none', cursor: 'pointer',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: 13,
                        textAlign: 'left',
                        transition: 'background 0.15s, color 0.15s',
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--surface2)' }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                    >
                      <i className={cat.icon} style={{ width: 16, textAlign: 'center', fontSize: 12, flexShrink: 0 }} aria-hidden="true" />
                      {cat.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Stats */}
            <div className="db-card" style={{ marginTop: 14 }}>
              <div className="db-card-bd" style={{ padding: '16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  {canManage ? 'Wiki Stats' : 'Your Progress'}
                </div>
                {canManage ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                      <span style={{ color: 'var(--text2)' }}>Total articles</span>
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--cyan)' }}>{articles.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}>
                      <span style={{ color: 'var(--text2)' }}>Required reading</span>
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--amber)' }}>{articles.filter(a => a.pinned).length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--text2)' }}>Categories</span>
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--blue)' }}>{CATEGORIES.length - 1}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                      <span style={{ color: 'var(--text2)' }}>Articles read</span>
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--cyan)' }}>2 / {articles.length}</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${Math.round(2 / ARTICLES.length * 100)}%`,
                        background: 'var(--grad)', borderRadius: 100,
                      }} />
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8, lineHeight: 1.4 }}>
                      <i className="fa-solid fa-star" style={{ color: 'var(--amber)', marginRight: 4 }} aria-hidden="true" />
                      Complete all pinned articles first.
                    </p>
                  </>
                )}
              </div>
            </div>
          </nav>

          {/* Article list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.length === 0 ? (
              <div className="db-card">
                <div className="db-card-bd" style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <i className="fa-solid fa-magnifying-glass" style={{ fontSize: 24, color: 'var(--text3)', display: 'block', marginBottom: 12 }} aria-hidden="true" />
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>No articles found</p>
                  <p style={{ fontSize: 12, color: 'var(--text3)' }}>Try a different search or category.</p>
                </div>
              </div>
            ) : (
              <>
                {pinned.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className="fa-solid fa-thumbtack" style={{ color: 'var(--amber)' }} aria-hidden="true" />
                      Required Reading
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {pinned.map(a => <ArticleCard key={a.id} article={a} canManage={canManage} onRead={() => setReadArticleId(a.id)} />)}
                    </div>
                  </div>
                )}
                {regular.length > 0 && (
                  <div>
                    {pinned.length > 0 && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, marginTop: 4 }}>
                        All Articles
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {regular.map(a => <ArticleCard key={a.id} article={a} canManage={canManage} onRead={() => setReadArticleId(a.id)} />)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Article Modal */}
      {showAddModal && (
        <AddArticleModal
          onClose={() => setShowAddModal(false)}
          onSave={(draft) => {
            const newArticle = {
              id: `a${Date.now()}`,
              title: draft.title,
              date: 'Just now',
              excerpt: draft.excerpt,
              category: draft.category,
              readTime: draft.readTime || '3 min read',
              pinned: draft.pinned,
            }
            setArticles(prev => [newArticle, ...prev])
            setShowAddModal(false)
          }}
        />
      )}

      {/* Read Article Modal */}
      {readArticleId && (() => {
        const article = articles.find(a => a.id === readArticleId)
        if (!article) return null
        const accentColor = CATEGORY_COLOR[article.category] ?? 'var(--blue)'
        const catLabel = CATEGORIES.find(c => c.id === article.category)?.name ?? article.category
        return (
          <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && setReadArticleId(null)}>
            <div className="modal-box" style={{ maxWidth: 680, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
              <button className="modal-close" onClick={() => setReadArticleId(null)}><i className="fa-solid fa-xmark" /></button>
              <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: accentColor }}>{catLabel}</span>
                {article.pinned && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', background: 'var(--amber-bg)', color: 'var(--amber)', borderRadius: 100 }}>Required</span>}
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 8, lineHeight: 1.3 }}>{article.title}</h2>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 20, display: 'flex', gap: 12 }}>
                <span><i className="fa-regular fa-clock" style={{ marginRight: 4 }} />{article.readTime}</span>
                <span>{article.date}</span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.8, marginBottom: 16 }}>{article.excerpt}</p>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.8, marginBottom: 16 }}>
                  This article provides detailed guidance to help you navigate this topic effectively at OnboardHero.
                  Our team has compiled best practices, internal processes, and practical tips to make sure you have
                  everything you need to get started and thrive.
                </p>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.8 }}>
                  If you have questions after reading this article, reach out to your manager or the HR team — we're here to help.
                  You can also ask Aura, our AI assistant, for a quick summary or more context on any topic.
                </p>
              </div>
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn btn-outline btn-sm" onClick={() => setReadArticleId(null)}>Close</button>
                {canManage && <button className="btn btn-primary btn-sm"><i className="fa-solid fa-pen-to-square" style={{ marginRight: 6 }} />Edit Article</button>}
              </div>
            </div>
          </div>
        )
      })()}
    </>
  )
}

function AddArticleModal({ onClose, onSave }: { onClose: () => void; onSave: (draft: ArticleDraft) => void }) {
  const [title, setTitle]     = useState('')
  const [category, setCategory] = useState('culture')
  const [excerpt, setExcerpt] = useState('')
  const [readTime, setReadTime] = useState('3 min read')
  const [pinned, setPinned]   = useState(false)
  const [error, setError]     = useState('')

  function handleSave() {
    if (!title.trim()) { setError('Title is required.'); return }
    if (!excerpt.trim()) { setError('Summary is required.'); return }
    onSave({ title: title.trim(), category, excerpt: excerpt.trim(), readTime, pinned })
  }

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 560 }}>
        <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 4 }}>
          <i className="fa-solid fa-plus" style={{ marginRight: 8, color: 'var(--blue)' }} />New Article
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>Add a new article to the company wiki.</p>

        <div className="fg">
          <label>Title <span style={{ color: 'var(--red)' }}>*</span></label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Remote Work Best Practices" />
        </div>
        <div className="fg">
          <label>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--surface)', color: 'var(--text)', fontSize: 13, width: '100%' }}>
            {CATEGORIES.filter(c => c.id !== 'all').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="fg">
          <label>Summary / Excerpt <span style={{ color: 'var(--red)' }}>*</span></label>
          <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Brief description of what this article covers..." rows={3} style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--surface)', width: '100%', resize: 'vertical', fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-body)' }} />
        </div>
        <div className="fg">
          <label>Read Time</label>
          <input type="text" value={readTime} onChange={e => setReadTime(e.target.value)} placeholder="e.g. 4 min read" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <input type="checkbox" id="pinned-check" checked={pinned} onChange={e => setPinned(e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
          <label htmlFor="pinned-check" style={{ fontSize: 13, color: 'var(--text2)', cursor: 'pointer', margin: 0 }}>
            Mark as Required Reading
          </label>
        </div>
        {error && <p style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12 }}><i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 5 }} />{error}</p>}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave}><i className="fa-solid fa-floppy-disk" style={{ marginRight: 6 }} />Save Article</button>
        </div>
      </div>
    </div>
  )
}

function ArticleCard({ article, canManage, onRead }: { article: typeof ARTICLES[0]; canManage: boolean; onRead: () => void }) {
  const catLabel   = CATEGORIES.find(c => c.id === article.category)?.name ?? article.category
  const accentColor = CATEGORY_COLOR[article.category] ?? 'var(--blue)'

  return (
    <article
      className="db-card"
      tabIndex={0}
      role="button"
      aria-label={`Read article: ${article.title}`}
      style={{ cursor: 'pointer', transition: 'transform 0.15s var(--ease), box-shadow 0.15s var(--ease)' }}
      onClick={onRead}
      onKeyDown={e => e.key === 'Enter' && onRead()}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '' }}
    >
      <div className="db-card-hd" style={{ borderBottom: `2px solid ${accentColor}20` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, color: accentColor }}>
            {catLabel}
          </span>
          {article.pinned && (
            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', background: 'var(--amber-bg)', color: 'var(--amber)', borderRadius: 100 }}>
              <i className="fa-solid fa-thumbtack" style={{ marginRight: 3 }} aria-hidden="true" />Required
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{article.date}</span>
          {canManage && (
            <button
              type="button"
              onClick={e => e.stopPropagation()}
              aria-label={`Edit ${article.title}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 11, padding: '2px 4px', borderRadius: 4 }}
            >
              <i className="fa-solid fa-pen-to-square" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
      <div className="db-card-bd">
        <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8, color: 'var(--text)', lineHeight: 1.3 }}>{article.title}</h3>
        <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.65, marginBottom: 14 }}>{article.excerpt}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="fa-regular fa-clock" aria-hidden="true" />
            {article.readTime}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: accentColor }}>
            Read article
            <i className="fa-solid fa-arrow-right" style={{ fontSize: 10 }} aria-hidden="true" />
          </span>
        </div>
      </div>
    </article>
  )
}
