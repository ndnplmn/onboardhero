'use client'

import { useEffect } from 'react'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[Global error]', error)
  }, [error])

  return (
    <html>
      <body style={{
        fontFamily: 'system-ui, sans-serif',
        background: '#F4F6FB',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        margin: 0,
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: '40px 48px',
          maxWidth: 460,
          textAlign: 'center',
          boxShadow: '0 16px 56px rgba(13,21,41,0.12)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 20 }}>⚠️</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, color: '#0D1529' }}>
            Application error
          </h1>
          <p style={{ fontSize: 15, color: '#4B5773', marginBottom: 28, lineHeight: 1.6 }}>
            {error.message || 'An unexpected error occurred. Please reload the page.'}
          </p>
          <button
            onClick={reset}
            style={{
              background: 'linear-gradient(135deg, #00C8E0 0%, #1A6CF6 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '12px 28px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  )
}
