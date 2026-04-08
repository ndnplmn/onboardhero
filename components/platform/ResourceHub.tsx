'use client'

import React, { useState, useEffect } from 'react'

interface Resource {
  id: string
  title: string
  type: string
  icon: string
  description?: string
}

const MOCK_RESOURCES: Resource[] = [
  { id: '1', title: 'Company Handbook', type: 'PDF Document', icon: 'fa-solid fa-book', description: 'The complete guide to company culture, policies, and benefits.' },
  { id: '2', title: 'IT Setup Guide', type: 'Wiki Page', icon: 'fa-solid fa-laptop-code', description: 'Step-by-step instructions for setting up your local dev environment.' },
  { id: '3', title: 'Benefits & Perks', type: 'HR Portal', icon: 'fa-solid fa-heart-pulse', description: 'Health insurance, wellness programs, and employee perks.' },
  { id: '4', title: 'Brand Assets', type: 'Shared Drive', icon: 'fa-solid fa-palette', description: 'Logos, fonts, and presentation templates for design consistency.' },
]

interface ResourceHubProps {
  recommendedIds?: string[]
}

export default function ResourceHub({ recommendedIds: initialRecommended = [] }: ResourceHubProps) {
  const [recommendedIds, setRecommendedIds] = useState<string[]>(initialRecommended)
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null)

  useEffect(() => {
    setRecommendedIds(initialRecommended)
  }, [initialRecommended])

  useEffect(() => {
    const handleAuraHighlight = (e: any) => {
      const id = e.detail.id
      if (id) {
        setActiveHighlightId(id)
        if (!recommendedIds.includes(id)) {
          setRecommendedIds(prev => [...prev, id])
        }
        // Multi-agent 2026: Clear highlight after 8s for maximum visibility
        setTimeout(() => setActiveHighlightId(null), 8000)
      }
    }

    window.addEventListener('aura-highlight-resource', handleAuraHighlight)
    return () => window.removeEventListener('aura-highlight-resource', handleAuraHighlight)
  }, [recommendedIds])

  return (
    <div className="db-card">
      <div className="db-card-hd">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <h3>
            <i className="fa-solid fa-folder-open" style={{ color: 'var(--cyan)', marginRight: '6px' }}></i> 
            Resource Hub
          </h3>
          {recommendedIds.length > 0 && (
            <span className="badge-ai" style={{ fontSize: '10px', padding: '2px 8px' }}>
              <i className="fa-solid fa-wand-magic-sparkles"></i> AI Optimized
            </span>
          )}
        </div>
      </div>
      <div className="db-card-bd">
        <div className="rh-grid">
          {MOCK_RESOURCES.map(res => {
            const isRecommended = recommendedIds.includes(res.id)
            const isActive = activeHighlightId === res.id
            
            // Premium 2026-grade highlights
            const cardStyle: React.CSSProperties = {
              position: 'relative',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              overflow: 'hidden',
              borderColor: isActive ? 'var(--violet)' : isRecommended ? 'var(--cyan)' : undefined,
              background: isActive ? 'rgba(var(--violet-rgb), 0.1)' : isRecommended ? 'rgba(var(--cyan-rgb), 0.05)' : undefined,
              boxShadow: isActive ? '0 0 30px rgba(var(--violet-rgb), 0.3)' : isRecommended ? '0 0 15px rgba(var(--cyan-rgb), 0.1)' : undefined,
              zIndex: isActive ? 10 : 1,
              transform: isActive ? 'scale(1.05)' : 'scale(1)'
            }

            return (
              <div 
                key={res.id} 
                className={`rh-card ${isRecommended ? 'recommended' : ''} ${isActive ? 'active-highlight' : ''}`}
                style={cardStyle}
                title={res.description}
              >
                {isRecommended && (
                  <div 
                    className="rh-recommended-badge"
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      background: 'var(--grad-premium)',
                      color: 'white',
                      fontSize: '8px',
                      padding: '2px 6px',
                      borderBottomLeftRadius: '8px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      zIndex: 2
                    }}
                  >
                    <i className="fa-solid fa-star"></i> Recommended
                  </div>
                )}
                <div className="rh-ico"><i className={res.icon}></i></div>
                <div className="rh-meta">
                  <strong>{res.title}</strong>
                  <span>{res.type}</span>
                </div>
                {isRecommended && (
                  <div 
                    className="rh-glow-effect"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'radial-gradient(circle at center, rgba(var(--cyan-rgb), 0.15) 0%, transparent 70%)',
                      pointerEvents: 'none',
                      opacity: isActive ? 0.8 : 0.4
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
        <button className="btn btn-outline btn-sm w-full mt-4">View All Resources</button>
      </div>
    </div>
  )
}
