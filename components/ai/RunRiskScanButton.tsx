'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function RunRiskScanButton({
  onComplete,
}: {
  onComplete?: (summary: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)

  async function handleScan() {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res  = await fetch('/api/risk-scan', { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Scan failed. Please try again.')
        return
      }

      const summary = data.summary || 'Risk scan completed. Scores have been updated.'
      setResult(summary)
      onComplete?.(summary)
    } catch (err: any) {
      setError(err.message || 'Network error. Check your connection and retry.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
      <button
        className="btn btn-primary btn-sm btn-glow"
        onClick={handleScan}
        disabled={loading}
      >
        {loading ? (
          <>
            <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 12 }} />
            Scanning...
          </>
        ) : (
          <>
            <i className="fa-solid fa-brain" style={{ fontSize: 12 }} />
            Run Risk Analysis
          </>
        )}
      </button>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            style={{
              maxWidth: 320,
              padding: '10px 14px',
              borderRadius: 'var(--r)',
              background: 'var(--red-bg)',
              border: '1px solid rgba(239,68,68,0.25)',
              fontSize: 12,
              color: 'var(--red)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
            }}
          >
            <i className="fa-solid fa-circle-exclamation" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>Scan Error</div>
              {error}
            </div>
            <button
              onClick={() => setError(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 0, marginLeft: 'auto', flexShrink: 0 }}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.16 }}
            style={{
              maxWidth: 360,
              padding: '10px 14px',
              borderRadius: 'var(--r)',
              background: 'var(--green-bg)',
              border: '1px solid rgba(34,197,94,0.25)',
              fontSize: 12,
              color: 'var(--green)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
            }}
          >
            <i className="fa-solid fa-circle-check" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>Scan Complete</div>
              <span style={{ color: 'var(--text2)' }}>{result}</span>
            </div>
            <button
              onClick={() => setResult(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 0, marginLeft: 'auto', flexShrink: 0 }}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
