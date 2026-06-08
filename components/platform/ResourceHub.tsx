'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Resource {
  id: string
  title: string
  type: string
  icon?: string
  description: string
  href?: string | null
}

const ICON_MAP: Record<string, string> = {
  handbook:    'fa-solid fa-book',
  guide:       'fa-solid fa-laptop-code',
  benefits:    'fa-solid fa-heart-pulse',
  brand:       'fa-solid fa-palette',
  policy:      'fa-solid fa-file-shield',
  video:       'fa-solid fa-circle-play',
  link:        'fa-solid fa-link',
  document:    'fa-solid fa-file-lines',
  it:          'fa-solid fa-laptop-code',
  engineering: 'fa-solid fa-code',
  product:     'fa-solid fa-lightbulb',
}

// Fallback shown when Supabase resources table is empty
const FALLBACK_RESOURCES: Resource[] = [
  { id: '1', title: 'Company Handbook',  type: 'handbook', description: 'Company culture, policies, and benefits.',         href: null },
  { id: '2', title: 'IT Setup Guide',    type: 'it',       description: 'Step-by-step local dev environment setup.',        href: null },
  { id: '3', title: 'Benefits & Perks',  type: 'benefits', description: 'Health insurance, wellness programs, and perks.',  href: null },
  { id: '4', title: 'Brand Assets',      type: 'brand',    description: 'Logos, fonts, and presentation templates.',        href: null },
]

interface ResourceHubProps {
  resources?: Resource[]
  recommendedIds?: string[]
}

export default function ResourceHub({ resources: initialResources = [], recommendedIds: initialRecommended = [] }: ResourceHubProps) {
  const router = useRouter()
  const [recommendedIds, setRecommendedIds] = useState<string[]>(initialRecommended)
  const [highlightId, setHighlightId]       = useState<string | null>(null)

  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  function markRead(resourceId: string) {
    if (readIds.has(resourceId)) return
    setReadIds(prev => new Set([...prev, resourceId]))
    fetch('/api/resources/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceId }),
    }).catch(() => {})
  }

  const displayResources = initialResources.length > 0 ? initialResources.slice(0, 8) : FALLBACK_RESOURCES

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
          {displayResources.map(res => {
            const isRecommended = recommendedIds.includes(res.id)
            const isActive = highlightId === res.id
            const icon = res.icon ?? ICON_MAP[res.type?.toLowerCase()] ?? 'fa-solid fa-file'

            const inner = (
              <>
                {isRecommended && (
                  <div style={{ position: 'absolute', top: 0, right: 0, background: 'var(--grad)', color: '#fff', fontSize: 8, fontWeight: 700, padding: '2px 7px', borderBottomLeftRadius: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <i className="fa-solid fa-star" style={{ marginRight: 3 }} />AI Pick
                  </div>
                )}
                <div className="rh-ico">
                  <i className={icon} />
                </div>
                <div className="rh-meta">
                  <strong>{res.title}</strong>
                  <span style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'capitalize' }}>{res.type}</span>
                </div>
              </>
            )

            const sharedStyle: React.CSSProperties = {
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              textDecoration: 'none', position: 'relative',
              transition: 'all 0.2s var(--ease)',
              border: `1px solid ${isActive ? 'var(--cyan)' : isRecommended ? 'rgba(0,200,224,0.35)' : 'var(--border)'}`,
              background: isActive ? 'var(--cyan-light)' : isRecommended ? 'var(--grad-soft)' : 'var(--bg)',
              transform: isActive ? 'scale(1.04)' : 'scale(1)',
              cursor: 'pointer',
            }

            return res.href ? (
              <a key={res.id} href={res.href} target="_blank" rel="noreferrer" className="rh-card" title={res.description} style={sharedStyle} onClick={() => markRead(res.id)}>
                {inner}
              </a>
            ) : (
              <div key={res.id} className="rh-card" title={res.description} style={sharedStyle} onClick={() => markRead(res.id)}>
                {inner}
              </div>
            )
          })}
        </div>

        <button
          className="btn btn-outline btn-sm w-full mt-4"
          onClick={() => router.push('/hire/resources')}
        >
          View All Resources
        </button>
      </div>
    </div>
  )
}
