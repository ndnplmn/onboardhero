'use client'

import { useTransition } from 'react'
import { markResourceRead } from '@/app/(platform)/hire/actions'

const iconMap: Record<string, string> = {
  document: 'fa-file-lines',
  video: 'fa-video',
  link: 'fa-link',
  contact: 'fa-user',
}

export default function ResourcesClient({ resources, userId }: { resources: any[]; userId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleMarkRead(resourceId: string) {
    startTransition(() => markResourceRead(resourceId, userId))
  }

  return (
    <div style={{ padding: '32px' }}>
      <h1 style={{ fontFamily: "'Outfit', sans-serif", marginBottom: '24px' }}>Resources</h1>
      {resources.length === 0 ? (
        <p style={{ color: 'var(--text3)' }}>No resources available yet.</p>
      ) : (
        <div className="hc-employees">
          {resources.map((r: any) => {
            const isRead = (r.read_by || []).includes(userId)
            return (
              <div key={r.id} className="hc-emp" style={{ opacity: isRead ? 0.7 : 1 }}>
                <i className={`fa-solid ${iconMap[r.type] || 'fa-file'}`}
                   style={{ color: 'var(--cyan)', fontSize: '1.2rem', width: '26px', textAlign: 'center' }}></i>
                <div className="hce-info" style={{ flex: 1 }}>
                  <strong>{r.title}</strong>
                  <span>{r.type} {r.ai_generated ? '· AI Generated' : ''}</span>
                </div>
                {isRead ? (
                  <span style={{
                    fontSize: '0.75rem', color: 'var(--green)', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}>
                    <i className="fa-solid fa-circle-check"></i> Read
                  </span>
                ) : (
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => handleMarkRead(r.id)}
                    disabled={isPending}
                  >
                    <i className="fa-solid fa-check"></i> Mark Read
                  </button>
                )}
                {r.url && (
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>
                    Open <i className="fa-solid fa-arrow-up-right-from-square"></i>
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
