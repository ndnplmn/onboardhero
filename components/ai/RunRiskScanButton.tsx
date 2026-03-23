'use client'

import { useState } from 'react'

export default function RunRiskScanButton({
  onComplete,
}: {
  onComplete?: (summary: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleScan() {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/risk-scan', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Scan failed')
        return
      }

      setResult(data.summary || 'Scan completed successfully.')
      onComplete?.(data.summary || '')
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        className="btn btn-primary btn-sm"
        onClick={handleScan}
        disabled={loading}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
      >
        {loading ? (
          <>
            <span
              style={{
                width: 14,
                height: 14,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
                display: 'inline-block',
              }}
            />
            Scanning...
          </>
        ) : (
          'Run Risk Analysis'
        )}
      </button>

      {error && (
        <div className="alert-box w" style={{ marginTop: '10px' }}>
          <strong>Scan Error</strong>
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="alert-box i" style={{ marginTop: '10px' }}>
          <strong>Scan Complete</strong>
          <span>{result}</span>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
