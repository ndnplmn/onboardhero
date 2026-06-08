'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function PlatformError({ error, reset }: ErrorProps) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <>
      <div className="db-header">
        <div className="db-header-left">
          <h1>
            <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 8, color: 'var(--amber)' }} />
            Something went wrong
          </h1>
          <p style={{ color: 'var(--text3)' }}>
            {error.message || 'An unexpected error occurred. Please try again.'}
          </p>
        </div>
      </div>

      <div className="db-body">
        <div className="db-card" style={{ maxWidth: 480 }}>
          <div className="db-card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              padding: '16px 18px', borderRadius: 'var(--r-lg)',
              background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
              fontSize: 14, color: 'var(--text2)', lineHeight: 1.6,
            }}>
              <i className="fa-solid fa-circle-info" style={{ marginRight: 8, color: 'var(--amber)' }} />
              {error.digest ? `Error ID: ${error.digest}` : 'The page failed to load. This is usually temporary.'}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={reset}>
                <i className="fa-solid fa-rotate-right" style={{ marginRight: 6 }} />
                Try again
              </button>
              <a href="/manager/dashboard" className="btn btn-outline" style={{ whiteSpace: 'nowrap' }}>
                <i className="fa-solid fa-house" style={{ marginRight: 6 }} />
                Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
