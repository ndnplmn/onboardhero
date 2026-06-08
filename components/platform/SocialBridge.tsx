'use client'

import Link from 'next/link'
import { useState } from 'react'

export interface SocialContact {
  name: string
  role: string
  email?: string
  slackId?: string
  slackTeamId?: string
  avatarUrl?: string
  nextMeetingDate?: string | null
  lastNote?: string | null
  isBuddy?: boolean
}

interface SocialBridgeProps {
  contacts?: SocialContact[]
}

const INITIAL_SHOW = 3

function ContactRow({ c }: { c: SocialContact }) {
  const isBuddy = c.isBuddy === true

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: isBuddy ? '10px 12px' : undefined,
        borderRadius: isBuddy ? 'var(--r)' : undefined,
        background: isBuddy ? 'color-mix(in srgb, var(--violet) 6%, transparent)' : undefined,
        border: isBuddy ? '1px solid color-mix(in srgb, var(--violet) 20%, transparent)' : undefined,
      }}
    >
      {/* Avatar */}
      <div style={{ flexShrink: 0, position: 'relative' }}>
        {c.avatarUrl ? (
          <img
            src={c.avatarUrl}
            alt={c.name}
            style={{ width: 42, height: 42, borderRadius: 12, border: '1px solid var(--border)', display: 'block', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: 42, height: 42, borderRadius: 12, border: '1px solid var(--border)', background: isBuddy ? 'color-mix(in srgb, var(--violet) 15%, transparent)' : 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fa-solid fa-user" style={{ fontSize: 16, color: isBuddy ? 'var(--violet)' : 'var(--text3)' }} />
          </div>
        )}
        {isBuddy && (
          <div style={{
            position: 'absolute', bottom: -3, right: -3,
            width: 16, height: 16, borderRadius: '50%',
            background: 'var(--violet)', border: '2px solid var(--bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="fa-solid fa-star" style={{ fontSize: 7, color: '#fff' }} />
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {c.name}
          </div>
          {isBuddy && (
            <span style={{
              fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 100,
              background: 'color-mix(in srgb, var(--violet) 15%, transparent)',
              color: 'var(--violet)', textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0,
            }}>Buddy</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.role}</div>
        {c.nextMeetingDate && (
          <div style={{ fontSize: 10, color: 'var(--cyan)', fontWeight: 600, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className="fa-solid fa-calendar-clock" style={{ fontSize: 9 }} aria-hidden="true" />
            1:1 {new Date(c.nextMeetingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        )}
        {c.lastNote && (
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160, fontStyle: 'italic' }}>
            &ldquo;{c.lastNote}&rdquo;
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        {c.slackId ? (
          <a
            href={`slack://user?team=${c.slackTeamId ?? ''}&id=${c.slackId}`}
            className="btn btn-ghost btn-sm"
            title={`Message ${c.name} on Slack`}
            aria-label={`Message ${c.name} on Slack`}
            style={{ textDecoration: 'none' }}
          >
            <i className="fa-brands fa-slack" aria-hidden="true" />
          </a>
        ) : (
          <button className="btn btn-ghost btn-sm" title="Slack not configured" aria-label="Slack not configured" disabled style={{ opacity: 0.4 }}>
            <i className="fa-brands fa-slack" aria-hidden="true" />
          </button>
        )}

        {c.email ? (
          <a
            href={`mailto:${c.email}?subject=Quick question from your new teammate`}
            className="btn btn-ghost btn-sm"
            title={`Email ${c.name}`}
            aria-label={`Email ${c.name}`}
            style={{ textDecoration: 'none' }}
          >
            <i className="fa-solid fa-envelope" aria-hidden="true" />
          </a>
        ) : (
          <button className="btn btn-ghost btn-sm" title="No email available" aria-label="No email available" disabled style={{ opacity: 0.4 }}>
            <i className="fa-solid fa-envelope" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}

export default function SocialBridge({ contacts = [] }: SocialBridgeProps) {
  const [showAll, setShowAll] = useState(false)

  // Buddies always shown first, regardless of INITIAL_SHOW
  const buddies    = contacts.filter(c => c.isBuddy)
  const nonBuddies = contacts.filter(c => !c.isBuddy)
  const ordered    = [...buddies, ...nonBuddies]
  const displayed  = showAll ? ordered : ordered.slice(0, INITIAL_SHOW)

  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-comments" style={{ color: 'var(--aqua)' }} />
          Team Support
        </h3>
        {buddies.length > 0 && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
            background: 'color-mix(in srgb, var(--violet) 12%, transparent)',
            color: 'var(--violet)', border: '1px solid color-mix(in srgb, var(--violet) 25%, transparent)',
          }}>
            <i className="fa-solid fa-star" style={{ fontSize: 8, marginRight: 4 }} />
            Buddy assigned
          </span>
        )}
      </div>

      <div className="db-card-bd">
        {displayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text3)' }}>
            <i className="fa-solid fa-users" style={{ fontSize: 22, display: 'block', marginBottom: 8, opacity: 0.35 }} />
            <p style={{ fontSize: 12, fontWeight: 500 }}>No contacts assigned yet.</p>
            <p style={{ fontSize: 11, marginTop: 4 }}>Your manager and buddy will appear here.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {displayed.map((c, i) => <ContactRow key={i} c={c} />)}
            </div>

            {contacts.length > INITIAL_SHOW && (
              <button
                onClick={() => setShowAll(v => !v)}
                style={{ marginTop: 12, width: '100%', fontSize: 11, fontWeight: 700, padding: '6px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', color: 'var(--text3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <i className={`fa-solid fa-chevron-${showAll ? 'up' : 'down'}`} style={{ fontSize: 9 }} />
                {showAll ? 'Show less' : `Show ${contacts.length - INITIAL_SHOW} more`}
              </button>
            )}

            <Link href="/hire/resources/contacts" className="btn btn-outline btn-sm w-full mt-4" style={{ fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10 }}>
              <i className="fa-solid fa-users-viewfinder" />
              View Full Team
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
