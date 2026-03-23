'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ContentEditor from '@/components/ai/ContentEditor'

interface ResourceItem {
  id: string
  title: string
  type: string
  department: string | null
  ai_generated: boolean
  created_at: string
}

export default function ContentClient({ resources }: { resources: ResourceItem[] }) {
  const router = useRouter()
  const [showEditor, setShowEditor] = useState(false)

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontFamily: "'Outfit', sans-serif" }}>Content Studio</h1>
        <button className="btn btn-primary" onClick={() => setShowEditor(true)}>
          <i className="fa-solid fa-robot"></i> Generate with AI
        </button>
      </div>

      <div className="hc-employees">
        {resources.length === 0 ? (
          <p style={{ padding: '20px', color: 'var(--text3)', textAlign: 'center' }}>
            No resources yet. Use AI to generate your first onboarding content.
          </p>
        ) : (
          resources.map((r) => (
            <div key={r.id} className="card" style={{ padding: '16px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <i className={`fa-solid ${getTypeIcon(r.type)}`} style={{ color: 'var(--primary)', fontSize: '0.9rem' }}></i>
                    <strong style={{ fontFamily: "'Outfit', sans-serif" }}>{r.title}</strong>
                    {r.ai_generated && (
                      <span className="badge-on" style={{ fontSize: '0.7rem' }}>AI</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>
                    {r.type.charAt(0).toUpperCase() + r.type.slice(1)}
                    {r.department && ` · ${r.department}`}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showEditor && (
        <ContentEditor onClose={() => { setShowEditor(false); router.refresh() }} />
      )}
    </div>
  )
}

function getTypeIcon(type: string): string {
  switch (type) {
    case 'document': return 'fa-file-lines'
    case 'video': return 'fa-video'
    case 'link': return 'fa-link'
    case 'contact': return 'fa-address-card'
    default: return 'fa-file'
  }
}
