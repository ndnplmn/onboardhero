'use client'

import { useState, useMemo } from 'react'

const CATEGORIES = [
  { id: 'all',          name: 'All Articles',         icon: 'fa-solid fa-th-large' },
  { id: 'culture',      name: 'Culture & Values',      icon: 'fa-solid fa-heart' },
  { id: 'benefits',     name: 'Benefits & Perks',      icon: 'fa-solid fa-gift' },
  { id: 'it',           name: 'IT & Security',         icon: 'fa-solid fa-shield-halved' },
  { id: 'office',       name: 'Office Life',           icon: 'fa-solid fa-building-user' },
  { id: 'engineering',  name: 'Engineering Standards', icon: 'fa-solid fa-code' },
  { id: 'product',      name: 'Product Roadmap',       icon: 'fa-solid fa-map-location-dot' },
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
]

const CATEGORY_COLOR: Record<string, string> = {
  culture:     'var(--cyan)',
  benefits:    'var(--green)',
  it:          'var(--blue)',
  office:      'var(--amber)',
  engineering: 'var(--violet)',
  product:     'var(--aqua)',
}

export default function CompanyWikiPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return ARTICLES.filter((a) => {
      const matchCat = activeCategory === 'all' || a.category === activeCategory
      const matchQ   = !q || a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q)
      return matchCat && matchQ
    })
  }, [activeCategory, search])

  const pinned  = filtered.filter(a => a.pinned)
  const regular = filtered.filter(a => !a.pinned)

  return (
    <>
      {/* Header */}
      <div className="db-header">
        <div className="db-header-left">
          <h1>
            <i className="fa-solid fa-book-open" style={{
              marginRight: 8,
              background: 'var(--grad)', WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }} />
            Company Wiki
          </h1>
          <p>The definitive guide to everything at OnboardHero.</p>
        </div>

        {/* Search */}
        <div className="db-header-actions">
          <div style={{ position: 'relative' }}>
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text3)', fontSize: 12, pointerEvents: 'none',
            }} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles..."
              aria-label="Search wiki articles"
              style={{
                width: 240,
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
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
            />
          </div>
        </div>
      </div>

      <div className="db-body">
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 'var(--gap-standard)', alignItems: 'start' }}>

          {/* Sidebar — Categories */}
          <nav aria-label="Wiki categories">
            <div className="db-card">
              <div className="db-card-hd">
                <h3>
                  <i className="fa-solid fa-folder-tree" style={{ color: 'var(--blue)' }} />
                  Categories
                </h3>
              </div>
              <div style={{ padding: '8px' }}>
                {CATEGORIES.map((cat) => {
                  const isActive = activeCategory === cat.id
                  return (
                    <button
                      key={cat.id}
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
                    >
                      <i className={cat.icon} style={{ width: 16, textAlign: 'center', fontSize: 12, flexShrink: 0 }} aria-hidden="true" />
                      {cat.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Stats card */}
            <div className="db-card" style={{ marginTop: 14 }}>
              <div className="db-card-bd" style={{ padding: '16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                  Your Progress
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                  <span style={{ color: 'var(--text2)' }}>Articles read</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--cyan)' }}>2 / {ARTICLES.length}</span>
                </div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${Math.round(2 / ARTICLES.length * 100)}%`,
                    background: 'var(--grad)', borderRadius: 100,
                  }} />
                </div>
                <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8, lineHeight: 1.4 }}>
                  <i className="fa-solid fa-star" style={{ color: 'var(--amber)', marginRight: 4 }} />
                  Complete all pinned articles first.
                </p>
              </div>
            </div>
          </nav>

          {/* Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {filtered.length === 0 ? (
              <div className="db-card">
                <div className="db-card-bd" style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <i className="fa-solid fa-magnifying-glass" style={{ fontSize: 24, color: 'var(--text3)', display: 'block', marginBottom: 12 }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>No articles found</p>
                  <p style={{ fontSize: 12, color: 'var(--text3)' }}>Try a different search or category.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Pinned */}
                {pinned.length > 0 && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <i className="fa-solid fa-thumbtack" style={{ color: 'var(--amber)' }} />
                      Required Reading
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {pinned.map(a => <ArticleCard key={a.id} article={a} />)}
                    </div>
                  </div>
                )}

                {/* Regular */}
                {regular.length > 0 && (
                  <div>
                    {pinned.length > 0 && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, marginTop: 4 }}>
                        All Articles
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {regular.map(a => <ArticleCard key={a.id} article={a} />)}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function ArticleCard({ article }: { article: typeof ARTICLES[0] }) {
  const catLabel = CATEGORIES.find(c => c.id === article.category)?.name ?? article.category
  const accentColor = CATEGORY_COLOR[article.category] ?? 'var(--blue)'

  return (
    <article
      className="db-card"
      tabIndex={0}
      role="button"
      aria-label={`Read article: ${article.title}`}
      style={{ cursor: 'pointer', transition: 'transform 0.15s var(--ease), box-shadow 0.15s var(--ease)' }}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.transform = 'translateY(-2px)'
        el.style.boxShadow = 'var(--shadow-md)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = ''
      }}
    >
      <div className="db-card-hd" style={{ borderBottom: `2px solid ${accentColor}20` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em',
            fontWeight: 800, color: accentColor,
          }}>
            {catLabel}
          </span>
          {article.pinned && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '1px 6px',
              background: 'var(--amber-bg)', color: 'var(--amber)',
              borderRadius: 100,
            }}>
              <i className="fa-solid fa-thumbtack" style={{ marginRight: 3 }} />
              Required
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{article.date}</span>
      </div>

      <div className="db-card-bd">
        <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8, color: 'var(--text)', lineHeight: 1.3 }}>
          {article.title}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.65, marginBottom: 14 }}>
          {article.excerpt}
        </p>
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
