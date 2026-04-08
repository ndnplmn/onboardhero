'use client'

import { useState, useEffect } from 'react'

interface Resource {
  id: string
  title: string
  type: string
  icon: string
  description: string
  href?: string
}

const MOCK_RESOURCES: Resource[] = [
  { id: '1', title: 'Company Handbook',  type: 'PDF Document', icon: 'fa-solid fa-book',          description: 'Company culture, policies, and benefits.',          href: '#' },
  { id: '2', title: 'IT Setup Guide',    type: 'Wiki Page',    icon: 'fa-solid fa-laptop-code',    description: 'Step-by-step local dev environment setup.',         href: '#' },
  { id: '3', title: 'Benefits & Perks',  type: 'HR Portal',    icon: 'fa-solid fa-heart-pulse',    description: 'Health insurance, wellness programs, and perks.',   href: '#' },
  { id: '4', title: 'Brand Assets',      type: 'Shared Drive', icon: 'fa-solid fa-palette',        description: 'Logos, fonts, and presentation templates.',        href: '#' },
]

interface ResourceHubProps {
  recommendedIds?: string[]
}

export default function ResourceHub({ recommendedIds: initialRecommended = [] }: ResourceHubProps) {
  const [recommendedIds, setRecommendedIds] = useState<string[]>(initialRecommended)
  const [highlightId, setHighlightId] = useState<string | null>(null)

  useEffect(() => {
    setRecommendedIds(initialRecommended)
  }, [initialRecommended])

  useEffect(() => {
    const handler = (e: any) => {
      const id = e.detail?.id
      if (!id) return
      setHighlightId(id)
      setRecommendedIds(prev => prev.includes(id) ? prev : [...prev, id])
      setTimeout(() => setHighlightId(null), 6000)
    }
    window.addEventListener('aura-highlight-resource', handler)
    return () => window.removeEventListener('aura-highlight-resource', handler)
  }, [])

  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-folder-open" style={{ color: 'var(--cyan)' }} />
          {' '}Resource Hub
        </h3>
        {recommendedIds.length > 0 && (
          <span className="badge-ai">
            <i className="fa-solid fa-wand-magic-sparkles" /> AI Optimized
          </span>
        )}
      </div>

      <div className="db-card-bd">
        <div className="rh-grid">
          {MOCK_RESOURCES.map(res => {
            const isRecommended = recommendedIds.includes(res.id)
            const isActive = highlightId === res.id

            return (
              <a
                key={res.id}
                href={res.href ?? '#'}
                className="rh-card"
                title={res.description}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textDecoration: 'none',
                  position: 'relative',
                  transition: 'all 0.2s var(--ease)',
                  border: `1px solid ${isActive ? 'var(--cyan)' : isRecommended ? 'rgba(0,200,224,0.35)' : 'var(--border)'}`,
                  background: isActive
                    ? 'var(--cyan-light)'
                    : isRecommended
                      ? 'var(--grad-soft)'
                      : 'var(--bg)',
                  transform: isActive ? 'scale(1.04)' : 'scale(1)',
                }}
              >
                {isRecommended && (
                  <div style={{
                    position: 'absolute', top: 0, right: 0,
                    background: 'var(--grad)',
                    color: '#fff',
                    fontSize: 8, fontWeight: 700,
                    padding: '2px 7px',
                    borderBottomLeftRadius: 8,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    <i className="fa-solid fa-star" style={{ marginRight: 3 }} />
                    AI Pick
                  </div>
                )}
                <div className="rh-ico">
                  <i className={res.icon} />
                </div>
                <div className="rh-meta">
                  <strong>{res.title}</strong>
                  <span>{res.type}</span>
                </div>
              </a>
            )
          })}
        </div>
        <button className="btn btn-outline btn-sm w-full mt-4">View All Resources</button>
      </div>
    </div>
  )
}
