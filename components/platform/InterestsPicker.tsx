'use client'

import { useState, useRef } from 'react'

const INTEREST_GROUPS = [
  { group: 'Sports & Fitness', icon: 'fa-dumbbell',           tags: ['Running', 'Cycling', 'Gym', 'Yoga', 'Hiking', 'Swimming', 'Tennis', 'Basketball', 'Football', 'Climbing'] },
  { group: 'Arts & Culture',   icon: 'fa-palette',            tags: ['Reading', 'Music', 'Movies', 'Art', 'Photography', 'Writing', 'Cooking', 'Travel', 'Dance', 'Theater'] },
  { group: 'Tech & Gaming',    icon: 'fa-gamepad',            tags: ['Gaming', 'Coding', 'AI', 'Open Source', '3D Printing', 'Podcasts', 'Streaming'] },
  { group: 'Community',        icon: 'fa-hand-holding-heart', tags: ['Volunteering', 'Mentoring', 'Language Learning', 'Board Games', 'Meditation', 'Sustainability'] },
]

const MAX_INTERESTS = 12

interface InterestsPickerProps {
  selected: string[]
  onChange: (updated: string[]) => void
  name?: string
}

export default function InterestsPicker({ selected, onChange, name }: InterestsPickerProps) {
  const [customInput, setCustomInput] = useState('')
  const [showWarning, setShowWarning] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function toggle(tag: string) {
    if (selected.includes(tag)) {
      onChange(selected.filter((t: string) => t !== tag))
      setShowWarning(false)
    } else {
      if (selected.length >= MAX_INTERESTS) {
        setShowWarning(true)
        return
      }
      onChange([...selected, tag])
      setShowWarning(false)
    }
  }

  function addCustom() {
    const val = customInput.trim()
    if (!val) return
    if (selected.includes(val)) {
      setCustomInput('')
      return
    }
    if (selected.length >= MAX_INTERESTS) {
      setShowWarning(true)
      return
    }
    onChange([...selected, val])
    setCustomInput('')
    setShowWarning(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustom()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <input type="hidden" name={name ?? 'interests'} value={selected.join(',')} />

      {/* Selected count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>
          <i className="fa-solid fa-tags" style={{ marginRight: 6, color: 'var(--violet)' }} />
          {selected.length} / {MAX_INTERESTS} selected
        </span>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={() => { onChange([]); setShowWarning(false) }}
            style={{
              fontSize: 11, color: 'var(--text3)', background: 'none', border: 'none',
              cursor: 'pointer', padding: '2px 6px',
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Warning */}
      {showWarning && (
        <div style={{
          fontSize: 12, color: 'var(--amber)',
          background: 'color-mix(in srgb, var(--amber) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--amber) 30%, transparent)',
          borderRadius: 'var(--r)',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <i className="fa-solid fa-triangle-exclamation" />
          You can select up to {MAX_INTERESTS} interests. Remove one to add another.
        </div>
      )}

      {/* Groups */}
      {INTEREST_GROUPS.map(({ group, icon, tags }) => (
        <div key={group}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <i
              className={`fa-solid ${icon}`}
              style={{ fontSize: 11, color: 'var(--violet)', width: 14, textAlign: 'center' }}
            />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {group}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {tags.map((tag: string) => {
              const isSelected = selected.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggle(tag)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 100,
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                    ...(isSelected
                      ? {
                          background: 'color-mix(in srgb, var(--blue) 15%, transparent)',
                          border: '1.5px solid var(--blue)',
                          color: 'var(--blue)',
                          fontWeight: 700,
                        }
                      : {
                          background: 'var(--surface2)',
                          border: '1px solid var(--border)',
                          color: 'var(--text3)',
                          fontWeight: 400,
                        }),
                  }}
                >
                  {isSelected && (
                    <i className="fa-solid fa-check" style={{ marginRight: 5, fontSize: 10 }} />
                  )}
                  {tag}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {/* Custom interest input */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <i className="fa-solid fa-plus" style={{ fontSize: 11, color: 'var(--violet)', width: 14, textAlign: 'center' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Add Custom
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            ref={inputRef}
            type="text"
            value={customInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Rock climbing, Baking..."
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: 13,
              fontFamily: 'inherit',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={addCustom}
            style={{
              padding: '8px 16px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r)',
              color: 'var(--text)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              flexShrink: 0,
            }}
          >
            Add
          </button>
        </div>
      </div>

      {/* Custom pills (interests not in predefined groups) */}
      {(() => {
        const allPredefined = INTEREST_GROUPS.flatMap((g: { group: string; icon: string; tags: string[] }) => g.tags)
        const customOnes = selected.filter((s: string) => !allPredefined.includes(s))
        if (customOnes.length === 0) return null
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
              <i className="fa-solid fa-star" style={{ fontSize: 11, color: 'var(--violet)', width: 14, textAlign: 'center' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Your Custom Interests
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {customOnes.map((tag: string) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggle(tag)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 100,
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'inherit',
                    background: 'color-mix(in srgb, var(--blue) 15%, transparent)',
                    border: '1.5px solid var(--blue)',
                    color: 'var(--blue)',
                    fontWeight: 700,
                  }}
                >
                  <i className="fa-solid fa-check" style={{ marginRight: 5, fontSize: 10 }} />
                  {tag}
                  <i className="fa-solid fa-xmark" style={{ marginLeft: 6, fontSize: 9 }} />
                </button>
              ))}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
