'use client'

import { useTransition } from 'react'
import { markResourceRead } from '@/app/(platform)/hire/actions'
import { useT } from '@/lib/i18n/context'

const TYPE_ICON: Record<string, string> = {
  document: 'fa-file-lines',
  video:    'fa-video',
  link:     'fa-link',
  contact:  'fa-user',
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

export default function ResourcesClient({ resources, userId }: { resources: any[]; userId: string }) {
  const { t } = useT()
  const [isPending, startTransition] = useTransition()

  function handleMarkRead(resourceId: string) {
    startTransition(() => markResourceRead(resourceId, userId))
  }

  const readCount   = resources.filter(r => (r.read_by || []).includes(userId)).length
  const totalCount  = resources.length
  const readPct     = totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0

  return (
    <>
      {/* Header */}
      <div className="db-header">
        <div className="db-header-left">
          <h1>
            <i className="fa-solid fa-folder-open" style={{
              marginRight: 8,
              background: 'var(--grad)', WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }} />
            {t('hire.resources.title')}
          </h1>
          <p>{t('hire.resources.subtitle')}</p>
        </div>
        {totalCount > 0 && (
          <div className="db-header-actions">
            <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>
              {readCount} / {totalCount} read
            </span>
          </div>
        )}
      </div>

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        {/* Progress card — only if resources exist */}
        {totalCount > 0 && (
          <div className="db-card">
            <div className="db-card-bd">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                <span style={{ color: 'var(--text2)' }}>{t('hire.resources.readingProgress')}</span>
                <span style={{ color: 'var(--text3)', fontFamily: 'var(--font-display)' }}>{readPct}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${readPct}%`,
                  background: readPct === 100 ? 'var(--green)' : 'var(--grad)',
                  borderRadius: 100,
                  transition: 'width 0.5s var(--ease)',
                }} />
              </div>
            </div>
          </div>
        )}

        {/* Resource list */}
        <div className="db-card">
          <div className="db-card-hd">
            <h3>
              <i className="fa-solid fa-layer-group" style={{ color: 'var(--blue)' }} />
              {t('hire.resources.allResources')}
            </h3>
            {resources.some((r: any) => r.ai_generated) && (
              <span className="badge-ai">
                <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: 3 }} />
                AI Curated
              </span>
            )}
          </div>

          <div className="db-card-bd">
            {totalCount === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
                <i className="fa-solid fa-folder-open" style={{ fontSize: 28, display: 'block', marginBottom: 12, color: 'var(--border2)' }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)', marginBottom: 4 }}>No resources yet</p>
                <p style={{ fontSize: 12 }}>Your HR team will add resources as your journey progresses.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {resources.map((r: any) => {
                  const isRead  = (r.read_by || []).includes(userId)
                  const icon    = TYPE_ICON[r.type]  || 'fa-file'
                  const color   = TYPE_COLOR[r.type] || 'var(--blue)'
                  const bg      = TYPE_BG[r.type]    || 'var(--blue-light)'

                  return (
                    <div
                      key={r.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '12px 14px',
                        borderRadius: 'var(--r)',
                        border: '1px solid var(--border)',
                        background: isRead ? 'var(--surface2)' : 'var(--surface)',
                        opacity: isRead ? 0.7 : 1,
                        transition: 'opacity 0.2s',
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
                          color: isRead ? 'var(--text3)' : 'var(--text)',
                          textDecoration: isRead ? 'line-through' : 'none',
                          textDecorationColor: 'var(--text3)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {r.title}
                        </strong>
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                          {r.type.charAt(0).toUpperCase() + r.type.slice(1)}
                          {r.ai_generated && (
                            <span style={{ marginLeft: 6, color: 'var(--blue)', fontWeight: 700 }}>· AI</span>
                          )}
                        </span>
                      </div>

                      {/* Read status */}
                      {isRead ? (
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          fontSize: 11, color: 'var(--green)', fontWeight: 700, flexShrink: 0,
                        }}>
                          <i className="fa-solid fa-circle-check" aria-hidden="true" />
                          Read
                        </span>
                      ) : (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: 11, flexShrink: 0 }}
                          onClick={() => handleMarkRead(r.id)}
                          disabled={isPending}
                          aria-label={`Mark "${r.title}" as read`}
                        >
                          <i className="fa-solid fa-check" style={{ marginRight: 4 }} aria-hidden="true" />
                          Mark Read
                        </button>
                      )}

                      {/* Open link */}
                      {r.url && (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: 11, flexShrink: 0 }}
                          aria-label={`Open "${r.title}" in new tab`}
                        >
                          Open
                          <i className="fa-solid fa-arrow-up-right-from-square" style={{ marginLeft: 5, fontSize: 9 }} aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  )
}
