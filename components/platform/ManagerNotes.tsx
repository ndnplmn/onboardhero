'use client'

import { useState } from 'react'

export default function ManagerNotes() {
  const [notes, setNotes] = useState('')

  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3><i className="fa-solid fa-note-sticky" style={{ color: 'var(--amber)', marginRight: '6px' }}></i> Manager Notes & Observations</h3>
      </div>
      <div className="db-card-bd">
        <p style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '10px' }}>
          Private notes to track integration progress, strengths, and areas for support.
        </p>
        <textarea
          className="mgr-notes-area"
          placeholder="Type your observations here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          style={{
            width: '100%',
            height: '100px',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r)',
            padding: '12px',
            fontSize: '13px',
            color: 'var(--text)',
            fontFamily: 'var(--font-body)',
            resize: 'none',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.currentTarget.style.borderColor = 'var(--cyan)'}
          onBlur={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button className="btn btn-primary btn-sm" style={{ padding: '6px 14px', fontSize: '12px' }}>
            Save Notes
          </button>
        </div>
      </div>
    </div>
  )
}
