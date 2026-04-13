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

const TYPE_ICON: Record<string, string> = {
  document: 'fa-file-lines',
  video:    'fa-video',
  link:     'fa-link',
  contact:  'fa-address-card',
}

const TYPE_COLOR: Record<string, string> = {
  document: 'var(--blue)',
  video:    'var(--red)',
  link:     'var(--cyan)',
  contact:  'var(--green)',
}

const TYPE_BG: Record<string, string> = {
  document: 'var(--blue-light)',
  video:    'var(--red-bg)',
  link:     'var(--cyan-light)',
  contact:  'var(--green-bg)',
}

export default function ContentClient({ resources }: { resources: ResourceItem[] }) {
  const router = useRouter()
  const [showEditor, setShowEditor] = useState(false)

  const aiCount = resources.filter(r => r.ai_generated).length

  return (
    <>
      {/* Header */}
      <div className="db-header">
        <div className="db-header-left">
          <h1>
            <i
              className="fa-solid fa-wand-magic-sparkles"
              style={{
                marginRight: 8,
                background: 'var(--grad)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              aria-hidden="true"
            />
            Content Studio
          </h1>
          <p>AI-generated and curated onboarding resources for your new hires.</p>
        </div>
        <div className="db-header-actions">
          <button
            className="btn btn-primary btn-sm btn-glow"
            onClick={() => setShowEditor(true)}
            aria-label="Generate onboarding content with AI"
          >
            <i className="fa-solid fa-robot" aria-hidden="true" style={{ marginRight: 6 }} />
            Generate with AI
          </button>
        </div>
      </div>

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        {/* KPI strip */}
        <div className="kpi-row" style={{ marginBottom: 0 }}>
          <div className="kpi-card">
            <div className="kpi-icon blue"><i className="fa-solid fa-layer-group" aria-hidden="true" /></div>
            <div className="kpi-value">{resources.length}</div>
            <div className="kpi-label">Total Resources</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon violet"><i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" /></div>
            <div className="kpi-value">{aiCount}</div>
            <div className="kpi-label">AI Generated</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon cyan"><i className="fa-solid fa-file-lines" aria-hidden="true" /></div>
            <div className="kpi-value">{resources.filter(r => r.type === 'document').length}</div>
            <div className="kpi-label">Documents</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon red"><i className="fa-solid fa-video" aria-hidden="true" /></div>
            <div className="kpi-value">{resources.filter(r => r.type === 'video').length}</div>
            <div className="kpi-label">Videos</div>
          </div>
        </div>

        {/* Resource list */}
        <div className="db-card">
          <div className="db-card-hd">
            <h3>
              <i className="fa-solid fa-layer-group" style={{ color: 'var(--blue)' }} aria-hidden="true" />
              {' '}All Resources
            </h3>
            {aiCount > 0 && (
              <span className="badge-ai">
                <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: 3 }} aria-hidden="true" />
                AI Curated
              </span>
            )}
          </div>

          <div className="db-card-bd">
            {resources.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                <i className="fa-solid fa-robot" style={{ fontSize: 32, color: 'var(--border2)', display: 'block', marginBottom: 12 }} aria-hidden="true" />
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>No content yet</p>
                <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 20 }}>
                  Use AI to generate your first onboarding content.
                </p>
                <button className="btn btn-primary btn-sm" onClick={() => setShowEditor(true)}>
                  <i className="fa-solid fa-robot" aria-hidden="true" style={{ marginRight: 6 }} />
                  Generate with AI
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {resources.map(r => {
                  const icon  = TYPE_ICON[r.type]  || 'fa-file'
                  const color = TYPE_COLOR[r.type] || 'var(--blue)'
                  const bg    = TYPE_BG[r.type]    || 'var(--blue-light)'

                  return (
                    <div
                      key={r.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '12px 14px',
                        borderRadius: 'var(--r)',
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                      }}
                    >
                      {/* Type icon */}
                      <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: bg, color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15, flexShrink: 0,
                      }}>
                        <i className={`fa-solid ${icon}`} aria-hidden="true" />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{
                          display: 'block', fontSize: 13, fontWeight: 700,
                          color: 'var(--text)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {r.title}
                        </strong>
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                          {r.type.charAt(0).toUpperCase() + r.type.slice(1)}
                          {r.department && ` · ${r.department}`}
                          {r.ai_generated && (
                            <span style={{ marginLeft: 6, color: 'var(--blue)', fontWeight: 700 }}>· AI</span>
                          )}
                        </span>
                      </div>

                      {/* Date */}
                      <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>
                        {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {showEditor && (
        <ContentEditor onClose={() => { setShowEditor(false); router.refresh() }} />
      )}
    </>
  )
}
