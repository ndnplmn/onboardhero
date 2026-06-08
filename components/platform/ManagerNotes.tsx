'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { saveManagerNote } from '@/app/(platform)/manager/actions'

interface ManagerNotesProps {
  journeyId?: string
  initialNote?: string
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function ManagerNotes({ journeyId, initialNote = '' }: ManagerNotesProps) {
  const [notes, setNotes]         = useState(initialNote)
  const [savedAt, setSavedAt]     = useState<string | null>(null)
  const [isDirty, setIsDirty]     = useState(false)
  const [isPending, startTransition] = useTransition()
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load from localStorage as fallback when no journeyId
  useEffect(() => {
    if (!journeyId && !initialNote) {
      try { setNotes(localStorage.getItem('manager_notes_draft') ?? '') } catch {}
    }
  }, [journeyId, initialNote])

  function handleChange(val: string) {
    setNotes(val)
    setIsDirty(true)
    // Auto-save to localStorage immediately (no-journeyId fallback)
    if (!journeyId) {
      try { localStorage.setItem('manager_notes_draft', val) } catch {}
    }
    // Debounce auto-save to DB
    if (journeyId) {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
      autoSaveRef.current = setTimeout(() => handleSave(val), 2500)
    }
  }

  function handleSave(content?: string) {
    const text = content ?? notes
    if (!journeyId) {
      try { localStorage.setItem('manager_notes_draft', text) } catch {}
      setSavedAt(new Date().toISOString())
      setIsDirty(false)
      return
    }
    startTransition(async () => {
      try {
        const { savedAt: ts } = await saveManagerNote(journeyId, text)
        setSavedAt(ts)
        setIsDirty(false)
      } catch {
        // graceful — table may not exist yet
        try { localStorage.setItem(`manager_notes_${journeyId}`, text) } catch {}
        setSavedAt(new Date().toISOString())
        setIsDirty(false)
      }
    })
  }

  return (
    <div className="db-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-note-sticky" style={{ color: 'var(--amber)', marginRight: 6 }} />
          Manager Notes
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isPending && <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 11, color: 'var(--text3)' }} />}
          {savedAt && !isDirty && !isPending && (
            <span style={{ fontSize: 10, color: 'var(--green)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="fa-solid fa-circle-check" style={{ fontSize: 9 }} />
              Saved {formatTime(savedAt)}
            </span>
          )}
          {isDirty && !isPending && (
            <span style={{ fontSize: 10, color: 'var(--amber)', fontWeight: 600 }}>Unsaved changes</span>
          )}
        </div>
      </div>
      <div className="db-card-bd" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <textarea
          className="mgr-notes-area"
          placeholder="Private observations — track integration progress, strengths, concerns, and context for future conversations..."
          value={notes}
          onChange={e => handleChange(e.target.value)}
          style={{ flex: 1, minHeight: 120, height: 'auto', resize: 'vertical' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>
            {journeyId ? 'Auto-saves · private to you' : 'Saved locally · assign a journey to persist'}
          </span>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleSave()}
            disabled={isPending || !isDirty}
            style={{ opacity: isDirty ? 1 : 0.5 }}
          >
            {isPending ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 5 }} />Saving…</> : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
