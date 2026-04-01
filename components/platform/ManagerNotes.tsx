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
        <div className="mgr-notes-wrap">
          <textarea
            className="mgr-notes-area"
            placeholder="Private notes to track integration progress, strengths, and areas for support..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="mgr-notes-ft">
            <span>Last saved: Just now</span>
            <button className="btn btn-primary btn-sm">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  )
}
