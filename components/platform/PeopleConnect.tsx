'use client'

import { useT } from '@/lib/i18n/context'

export interface PersonMatch {
  id: string
  name: string
  avatarUrl?: string | null
  department?: string | null
  email?: string | null
  sharedInterests: string[]
}

interface PeopleConnectProps {
  myInterests: string[]
  matches: PersonMatch[]
}

const INTEREST_ICONS: Record<string, string> = {
  Running:            'fa-person-running',
  Cycling:            'fa-bicycle',
  Gym:                'fa-dumbbell',
  Yoga:               'fa-spa',
  Hiking:             'fa-mountain',
  Swimming:           'fa-person-swimming',
  Tennis:             'fa-table-tennis-paddle-ball',
  Basketball:         'fa-basketball',
  Football:           'fa-football',
  Climbing:           'fa-mountain-sun',
  Reading:            'fa-book-open',
  Music:              'fa-music',
  Movies:             'fa-film',
  Art:                'fa-paintbrush',
  Photography:        'fa-camera',
  Writing:            'fa-pen-nib',
  Cooking:            'fa-utensils',
  Travel:             'fa-plane',
  Dance:              'fa-music',
  Theater:            'fa-masks-theater',
  Gaming:             'fa-gamepad',
  Coding:             'fa-code',
  AI:                 'fa-robot',
  'Open Source':      'fa-github',
  '3D Printing':      'fa-cube',
  Podcasts:           'fa-microphone',
  Streaming:          'fa-tv',
  Volunteering:       'fa-hand-holding-heart',
  Mentoring:          'fa-chalkboard-user',
  'Language Learning': 'fa-language',
  'Board Games':      'fa-chess',
  Meditation:         'fa-spa',
  Sustainability:     'fa-leaf',
}

const PILL_COLORS = [
  'var(--blue)',
  'var(--violet)',
  'var(--cyan)',
  'var(--green)',
  'var(--amber)',
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w: string) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function Avatar({ name, avatarUrl, size }: { name: string; avatarUrl?: string | null; size: number }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{
          width: size, height: size, borderRadius: '50%', objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    )
  }
  const initials = getInitials(name)
  return (
    <div
      aria-hidden="true"
      style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, var(--blue), var(--violet))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 700,
        fontSize: Math.floor(size * 0.36),
        fontFamily: 'var(--font-display)',
      }}
    >
      {initials}
    </div>
  )
}

function PersonCard({ person }: { person: PersonMatch }) {
  const { t } = useT()
  const primaryInterest = person.sharedInterests[0] ?? ''
  const mailtoLink = person.email
    ? `mailto:${person.email}?subject=Hey! Saw we share a love for ${encodeURIComponent(primaryInterest)}`
    : undefined

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r)',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minWidth: 200,
        maxWidth: 220,
        flexShrink: 0,
      }}
    >
      {/* Top row: avatar + name/dept */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar name={person.name} avatarUrl={person.avatarUrl} size={42} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: 'var(--text)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {person.name}
          </div>
          {person.department && (
            <div style={{
              fontSize: 11, color: 'var(--text3)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              marginTop: 1,
            }}>
              {person.department}
            </div>
          )}
        </div>
      </div>

      {/* Shared interest pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {person.sharedInterests.slice(0, 4).map((interest: string, idx: number) => {
          const color = PILL_COLORS[idx % PILL_COLORS.length]
          return (
            <span
              key={interest}
              style={{
                fontSize: 9,
                padding: '2px 7px',
                borderRadius: 100,
                background: `color-mix(in srgb, ${color} 12%, transparent)`,
                border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
                color,
                fontWeight: 600,
              }}
            >
              {interest}
            </span>
          )
        })}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        {person.email && (
          <a
            href={`mailto:${person.email}`}
            title={`Email ${person.name}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: 'var(--r)',
              background: 'var(--surface2)', border: '1px solid var(--border)',
              color: 'var(--text3)', textDecoration: 'none', fontSize: 12,
              flexShrink: 0,
            }}
          >
            <i className="fa-solid fa-envelope" />
          </a>
        )}
        {mailtoLink && (
          <a
            href={mailtoLink}
            title={t('components.peopleConnect.sayHi')}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, flex: 1,
              justifyContent: 'center',
              height: 30, borderRadius: 'var(--r)',
              background: 'color-mix(in srgb, var(--blue) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--blue) 30%, transparent)',
              color: 'var(--blue)', textDecoration: 'none', fontSize: 11, fontWeight: 600,
            }}
          >
            <i className="fa-solid fa-hand-wave" style={{ fontSize: 10 }} />
            {t('components.peopleConnect.sayHi')}
          </a>
        )}
      </div>
    </div>
  )
}

export default function PeopleConnect({ myInterests, matches }: PeopleConnectProps) {
  const { t } = useT()

  // Empty state — no interests set
  if (myInterests.length === 0) {
    return (
      <div className="db-card">
        <div className="db-card-hd">
          <h3>
            <i className="fa-solid fa-sparkles" style={{ color: 'var(--violet)', marginRight: 7 }} aria-hidden="true" />
            {t('components.peopleConnect.title')}
          </h3>
        </div>
        <div className="db-card-bd">
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
            padding: '24px 16px', textAlign: 'center',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'color-mix(in srgb, var(--violet) 10%, transparent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>
              <i className="fa-solid fa-users" style={{ color: 'var(--violet)' }} aria-hidden="true" />
            </div>
            <p style={{ fontSize: 13, color: 'var(--text3)', maxWidth: 380, lineHeight: 1.65, margin: 0 }}>
              {t('components.peopleConnect.noInterestsDesc')}
            </p>
            <a
              href="/hire/profile"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '9px 20px', borderRadius: 'var(--r)',
                background: 'color-mix(in srgb, var(--violet) 15%, transparent)',
                border: '1px solid color-mix(in srgb, var(--violet) 40%, transparent)',
                color: 'var(--violet)', textDecoration: 'none',
                fontSize: 13, fontWeight: 600,
              }}
            >
              <i className="fa-solid fa-user-pen" style={{ fontSize: 12 }} />
              {t('components.peopleConnect.updateProfile')}
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Has interests but no matches yet
  if (matches.length === 0) {
    return (
      <div className="db-card">
        <div className="db-card-hd">
          <h3>
            <i className="fa-solid fa-sparkles" style={{ color: 'var(--violet)', marginRight: 7 }} aria-hidden="true" />
            {t('components.peopleConnect.title')}
          </h3>
        </div>
        <div className="db-card-bd">
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
            padding: '24px 16px', textAlign: 'center',
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'color-mix(in srgb, var(--amber) 10%, transparent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>
              <i className="fa-solid fa-person-running" style={{ color: 'var(--amber)' }} aria-hidden="true" />
            </div>
            <p style={{ fontSize: 13, color: 'var(--text3)', maxWidth: 380, lineHeight: 1.65, margin: 0 }}>
              {t('components.peopleConnect.noMatchesDesc')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Group matches by primary shared interest
  const groupMap = new Map<string, PersonMatch[]>()
  for (const person of matches) {
    const key = person.sharedInterests[0] ?? 'Other'
    if (!groupMap.has(key)) groupMap.set(key, [])
    groupMap.get(key)!.push(person)
  }

  // Show max 3 groups
  const groups = Array.from(groupMap.entries()).slice(0, 3)

  return (
    <div className="db-card">
      <div className="db-card-hd">
        <h3>
          <i className="fa-solid fa-sparkles" style={{ color: 'var(--violet)', marginRight: 7 }} aria-hidden="true" />
          {t('components.peopleConnect.title')}
        </h3>
        <span style={{
          fontSize: 11, fontWeight: 700,
          padding: '2px 9px', borderRadius: 100,
          background: 'color-mix(in srgb, var(--violet) 12%, transparent)',
          border: '1px solid color-mix(in srgb, var(--violet) 30%, transparent)',
          color: 'var(--violet)',
        }}>
          {matches.length} {matches.length === 1 ? t('components.peopleConnect.match') : t('components.peopleConnect.matches')}
        </span>
      </div>
      <div className="db-card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {groups.map(([interest, people]: [string, PersonMatch[]]) => {
          const icon = INTEREST_ICONS[interest] ?? 'fa-star'
          return (
            <div key={interest}>
              {/* Group header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 14,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 'var(--r)',
                  background: 'color-mix(in srgb, var(--violet) 12%, transparent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <i
                    className={`fa-solid ${icon}`}
                    style={{ fontSize: 12, color: 'var(--violet)' }}
                    aria-hidden="true"
                  />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                  {people.length} {people.length === 1 ? t('components.peopleConnect.personSingular') : t('components.peopleConnect.peoplePlural')} {people.length === 1 ? t('components.peopleConnect.whoLoves') : t('components.peopleConnect.whoLove')} {interest}
                </span>
              </div>

              {/* Person cards — horizontal scroll on small screens */}
              <div style={{
                display: 'flex', gap: 12, flexWrap: 'wrap',
                overflowX: 'auto', paddingBottom: 4,
              }}>
                {people.map((person: PersonMatch) => (
                  <PersonCard key={person.id} person={person} />
                ))}
              </div>
            </div>
          )
        })}

        {/* See all link */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <a
            href="/hire/resources/contacts"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              fontSize: 13, color: 'var(--blue)', textDecoration: 'none', fontWeight: 600,
            }}
          >
            <i className="fa-solid fa-users" style={{ fontSize: 11 }} />
            {t('components.peopleConnect.seeAllPeople')}
            <i className="fa-solid fa-arrow-right" style={{ fontSize: 10 }} />
          </a>
        </div>
      </div>
    </div>
  )
}
