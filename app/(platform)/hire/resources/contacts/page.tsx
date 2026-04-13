'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import TeamsModal from '@/components/platform/TeamsModal'

interface Contact {
  name:         string
  role:         string
  type:         string
  typeId:       string
  typeColor:    string
  bio:          string
  email:        string
  slackHandle:  string
  avatar:       string
  availability: 'available' | 'busy' | 'away'
  availabilityLabel: string
}

const CONTACTS: Contact[] = [
  {
    name:              'Sarah Kim',
    role:              'HR Operations Manager',
    type:              'HR Support',
    typeId:            'hr',
    typeColor:         'var(--green)',
    bio:               'Expert in benefits, payroll, and company policy. Your first stop for any HR-related questions during onboarding.',
    email:             'sarah.kim@onboardhero.com',
    slackHandle:       '@sarah.kim',
    avatar:            'https://i.pravatar.cc/150?u=sarah',
    availability:      'available',
    availabilityLabel: 'Available today',
  },
  {
    name:              'Liam Evans',
    role:              'Staff Product Manager',
    type:              'Direct Manager',
    typeId:            'manager',
    typeColor:         'var(--blue)',
    bio:               'Leading the Core Platform team. Reach out to align on priorities, unblock decisions, or talk through the product roadmap.',
    email:             'liam.evans@onboardhero.com',
    slackHandle:       '@liam.evans',
    avatar:            'https://i.pravatar.cc/150?u=liam',
    availability:      'busy',
    availabilityLabel: 'In a meeting until 3 PM',
  },
  {
    name:              'Marcus Reed',
    role:              'Senior Product Designer',
    type:              'Social Buddy',
    typeId:            'buddy',
    typeColor:         'var(--cyan)',
    bio:               'Your go-to for design systems, office snacks, and local coffee spots. Pair with Marcus for design reviews or just a chat.',
    email:             'marcus.reed@onboardhero.com',
    slackHandle:       '@marcus.reed',
    avatar:            'https://i.pravatar.cc/150?u=marcus',
    availability:      'available',
    availabilityLabel: 'Available today',
  },
  {
    name:              'Priya Mehta',
    role:              'Senior Frontend Engineer',
    type:              'Technical Mentor',
    typeId:            'mentor',
    typeColor:         'var(--violet)',
    bio:               'Helping you navigate our React 19 and Next.js stack. Ping Priya for PR reviews, architecture questions, or debugging sessions.',
    email:             'priya.mehta@onboardhero.com',
    slackHandle:       '@priya.mehta',
    avatar:            'https://i.pravatar.cc/150?u=priya',
    availability:      'available',
    availabilityLabel: 'Available today',
  },
]

const FILTER_TABS = [
  { id: 'all',     label: 'All',      icon: 'fa-solid fa-users' },
  { id: 'manager', label: 'Manager',  icon: 'fa-solid fa-user-tie' },
  { id: 'buddy',   label: 'Buddy',    icon: 'fa-solid fa-handshake' },
  { id: 'hr',      label: 'HR',       icon: 'fa-solid fa-shield-halved' },
  { id: 'mentor',  label: 'Mentor',   icon: 'fa-solid fa-chalkboard-user' },
]

const AVAIL_COLOR: Record<Contact['availability'], string> = {
  available: 'var(--green)',
  busy:      'var(--amber)',
  away:      'var(--text3)',
}

export default function KeyContactsPage() {
  const [filter, setFilter]         = useState('all')
  const [teamsModal, setTeamsModal] = useState<{ open: boolean; contact: string }>({ open: false, contact: '' })

  const visible = useMemo(
    () => filter === 'all' ? CONTACTS : CONTACTS.filter(c => c.typeId === filter),
    [filter]
  )

  const availableCount = CONTACTS.filter(c => c.availability === 'available').length

  return (
    <>
      {/* Header */}
      <div className="db-header">
        <div className="db-header-left">
          <h1>
            <i
              className="fa-solid fa-address-book"
              style={{
                marginRight: 8,
                background: 'var(--grad)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              aria-hidden="true"
            />
            Key Contacts
          </h1>
          <p>The people here to support your integration and growth.</p>
        </div>
      </div>

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        {/* KPI strip */}
        <div className="kpi-row" style={{ marginBottom: 0 }}>
          <div className="kpi-card">
            <div className="kpi-icon blue"><i className="fa-solid fa-users" /></div>
            <div className="kpi-value">{CONTACTS.length}</div>
            <div className="kpi-label">Total Contacts</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon green"><i className="fa-solid fa-circle-dot" /></div>
            <div className="kpi-value">{availableCount}</div>
            <div className="kpi-label">Available Now</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon cyan"><i className="fa-solid fa-comments" /></div>
            <div className="kpi-value">Teams</div>
            <div className="kpi-label">Primary Channel</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon amber"><i className="fa-solid fa-clock" /></div>
            <div className="kpi-value">&lt; 4h</div>
            <div className="kpi-label">Avg. Response</div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="db-tabs" style={{ marginBottom: 0 }}>
          {FILTER_TABS.map(tab => (
            <button
              key={tab.id}
              className={`db-tab${filter === tab.id ? ' active' : ''}`}
              onClick={() => setFilter(tab.id)}
              aria-pressed={filter === tab.id}
            >
              <i className={tab.icon} style={{ marginRight: 6 }} aria-hidden="true" />
              {tab.label}
              {tab.id !== 'all' && (
                <span style={{
                  marginLeft: 6,
                  fontSize: 10, fontWeight: 700,
                  padding: '1px 5px', borderRadius: 100,
                  background: filter === tab.id ? 'rgba(255,255,255,0.2)' : 'var(--border)',
                  color: filter === tab.id ? '#fff' : 'var(--text3)',
                }}>
                  {CONTACTS.filter(c => c.typeId === tab.id).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Contact cards grid */}
        <AnimatePresence mode="popLayout">
          <div className="db-row col2" style={{ margin: 0 }}>
            {visible.map((contact) => (
              <motion.div
                key={contact.email}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="db-card"
              >
                {/* Card header — type badge + email shortcut */}
                <div className="db-card-hd">
                  <span style={{
                    fontSize: 10, textTransform: 'uppercase',
                    letterSpacing: '0.08em', fontWeight: 800,
                    color: contact.typeColor,
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <i className="fa-solid fa-tag" style={{ fontSize: 9 }} aria-hidden="true" />
                    {contact.type}
                  </span>
                  <a
                    href={`mailto:${contact.email}`}
                    className="btn btn-ghost btn-sm"
                    aria-label={`Send email to ${contact.name}`}
                    title={contact.email}
                  >
                    <i className="fa-solid fa-envelope" aria-hidden="true" />
                  </a>
                </div>

                <div className="db-card-bd">
                  {/* Avatar + identity */}
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img
                        src={contact.avatar}
                        alt={`${contact.name}'s photo`}
                        style={{
                          width: 60, height: 60,
                          borderRadius: 'var(--r)',
                          border: '1px solid var(--border)',
                          display: 'block',
                        }}
                      />
                      {/* Availability dot */}
                      <span
                        aria-label={contact.availabilityLabel}
                        style={{
                          position: 'absolute', bottom: -3, right: -3,
                          width: 12, height: 12, borderRadius: '50%',
                          background: AVAIL_COLOR[contact.availability],
                          border: '2px solid var(--surface)',
                          boxShadow: contact.availability === 'available' ? '0 0 6px var(--green)' : 'none',
                          display: 'block',
                        }}
                      />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 2, color: 'var(--text)' }}>
                        {contact.name}
                      </h3>
                      <p style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, marginBottom: 5 }}>
                        {contact.role}
                      </p>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 11,
                        color: AVAIL_COLOR[contact.availability],
                        fontWeight: 600,
                      }}>
                        {contact.availabilityLabel}
                      </span>
                    </div>
                  </div>

                  {/* Bio */}
                  <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.65, marginBottom: 16 }}>
                    {contact.bio}
                  </p>

                  {/* CTAs */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => setTeamsModal({ open: true, contact: contact.name })}
                      aria-label={`Schedule a Teams meeting with ${contact.name}`}
                    >
                      <i className="fa-solid fa-calendar-plus" style={{ marginRight: 5 }} aria-hidden="true" />
                      Schedule
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                      onClick={() => setTeamsModal({ open: true, contact: contact.name })}
                      aria-label={`Open Teams chat with ${contact.name}`}
                    >
                      <i className="fa-brands fa-microsoft" style={{ marginRight: 5 }} aria-hidden="true" />
                      Teams
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {/* Empty state when filter returns nothing */}
        {visible.length === 0 && (
          <div className="db-card">
            <div className="db-card-bd" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <i className="fa-solid fa-users" style={{ fontSize: 28, color: 'var(--border2)', display: 'block', marginBottom: 12 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)' }}>No contacts in this category.</p>
            </div>
          </div>
        )}

        {/* Helpdesk CTA */}
        <div className="db-card">
          <div className="db-card-bd" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'var(--blue-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, color: 'var(--blue)', fontSize: 20,
            }}>
              <i className="fa-solid fa-headset" aria-hidden="true" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>Need more help?</h3>
              <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.5 }}>
                Our 24/7 Global IT &amp; HR Helpdesk is always available for urgent requests.
              </p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              style={{ flexShrink: 0 }}
              aria-label="Open a support ticket with the helpdesk"
            >
              <i className="fa-solid fa-ticket" style={{ marginRight: 6 }} aria-hidden="true" />
              Open Support Ticket
            </button>
          </div>
        </div>

      </div>

      {/* Teams modal — shared across all cards */}
      <TeamsModal
        isOpen={teamsModal.open}
        onClose={() => setTeamsModal({ open: false, contact: '' })}
        contactName={teamsModal.contact}
      />
    </>
  )
}
