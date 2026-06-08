'use client'

import { useState } from 'react'
import InterventionBrief from './InterventionBrief'
import type { Employee } from './EmployeeTable'

export interface DeptNode {
  id: string
  name: string
  friction: number    // 0–1
  hires: number
  status: 'stable' | 'turbulence' | 'high-risk'
  day: number
  description: string
  intervention: string
  frictionType?: string
}

const STATUS_CONFIG = {
  stable:      { label: 'Stable',   color: 'var(--green)', bg: 'var(--green-bg)', border: 'rgba(34,197,94,0.2)',  icon: 'fa-solid fa-circle-check' },
  turbulence:  { label: 'At Risk',  color: 'var(--amber)', bg: 'var(--amber-bg)', border: 'rgba(245,158,11,0.2)', icon: 'fa-solid fa-triangle-exclamation' },
  'high-risk': { label: 'Critical', color: 'var(--red)',   bg: 'var(--red-bg)',   border: 'rgba(239,68,68,0.2)',  icon: 'fa-solid fa-circle-xmark' },
}

const FRICTION_TYPES = ['technical', 'culture', 'engagement', 'role_clarity', 'mentorship'] as const

function getOrgHealth(nodes: DeptNode[]) {
  if (!nodes.length) return { label: 'No Data', color: 'var(--text3)', score: 0 }
  const avg = nodes.reduce((s, n) => s + n.friction, 0) / nodes.length
  if (avg < 0.3) return { label: 'Healthy',      color: 'var(--green)', score: Math.round((1 - avg) * 100) }
  if (avg < 0.6) return { label: 'Watch',         color: 'var(--amber)', score: Math.round((1 - avg) * 100) }
  return         { label: 'Needs Attention',       color: 'var(--red)',   score: Math.round((1 - avg) * 100) }
}

// ── Hire list panel shown inline below each dept row ───────────────────────

function HireDeptPanel({
  hires,
  dept,
  onGetBrief,
  onClose,
}: {
  hires: Employee[]
  dept: DeptNode
  onGetBrief: () => void
  onClose: () => void
}) {
  const STATUS_HIRE: Record<string, { color: string; bg: string; label: string }> = {
    'on-track':  { color: 'var(--green)', bg: 'color-mix(in srgb, var(--green) 12%, transparent)',  label: 'On Track' },
    'at-risk':   { color: 'var(--red)',   bg: 'color-mix(in srgb, var(--red) 12%, transparent)',    label: 'At Risk'  },
    completed:   { color: 'var(--cyan)',  bg: 'color-mix(in srgb, var(--cyan) 12%, transparent)',   label: 'Done'     },
  }

  return (
    <div style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--surface2)',
      padding: '12px 20px 16px',
    }}>
      {/* Panel header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>
          <i className="fa-solid fa-users" style={{ marginRight: 6, color: 'var(--blue)', fontSize: 11 }} />
          {hires.length} {hires.length === 1 ? 'hire' : 'hires'} in {dept.name}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {dept.status !== 'stable' && (
            <button
              onClick={onGetBrief}
              className="btn btn-sm"
              style={{
                fontSize: 10, fontWeight: 700, border: 'none',
                background: 'var(--grad)', color: '#fff',
                borderRadius: 'var(--r)', display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <i className="fa-solid fa-wand-magic-sparkles" style={{ fontSize: 9 }} />
              AI Recommendation
            </button>
          )}
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 11, color: 'var(--text3)' }}
            aria-label="Close hire list"
          >
            <i className="fa-solid fa-xmark" style={{ fontSize: 10 }} />
          </button>
        </div>
      </div>

      {/* Hire rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {hires.map(hire => {
          const sc = STATUS_HIRE[hire.status] ?? STATUS_HIRE['on-track']
          const initials = hire.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
          return (
            <div
              key={hire.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '28px 1fr 90px 72px',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 'var(--r)',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--grad)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 800, flexShrink: 0,
              }}>
                {initials}
              </div>

              {/* Name + role */}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {hire.name}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {hire.role} · Day {hire.days}
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600 }}>Progress</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text2)' }}>{hire.progress}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 100,
                    width: `${hire.progress}%`,
                    background: hire.status === 'at-risk' ? 'var(--red)' : hire.progress >= 80 ? 'var(--green)' : 'var(--blue)',
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>

              {/* Status badge */}
              <span style={{
                fontSize: 9, fontWeight: 800, padding: '2px 8px',
                borderRadius: 100, background: sc.bg, color: sc.color,
                textAlign: 'center', letterSpacing: '0.04em', textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}>
                {sc.label}
              </span>
            </div>
          )
        })}
      </div>

      {hires.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', padding: '8px 0' }}>
          No active hires in this department.
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

interface GlobalFrictionMapProps {
  nodes?: DeptNode[]
  activeDept?: string
  onDeptFilter?: (deptName: string) => void
  hiresByDept?: Record<string, Employee[]>
}

export default function GlobalFrictionMap({ nodes, activeDept, onDeptFilter, hiresByDept }: GlobalFrictionMapProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [briefDept, setBriefDept]   = useState<DeptNode | null>(null)

  const displayNodes = nodes && nodes.length > 0 ? nodes : []
  const isEmpty      = displayNodes.length === 0
  const orgHealth    = getOrgHealth(displayNodes)
  const totalHires   = displayNodes.reduce((s, n) => s + n.hires, 0)
  const atRisk       = displayNodes.filter(n => n.status !== 'stable').reduce((s, n) => s + n.hires, 0)

  return (
    <>
      <div className="db-card">
        {/* Header */}
        <div className="db-card-hd">
          <h3>
            <i className="fa-solid fa-building-shield" style={{ color: 'var(--blue)' }} />
            Department Onboarding Health
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="badge-ai">AI Scored</span>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 100, padding: '4px 12px',
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: orgHealth.color, display: 'inline-block' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: orgHealth.color }}>{orgHealth.label}</span>
              {orgHealth.score > 0 && (
                <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{orgHealth.score}/100</span>
              )}
            </div>
          </div>
        </div>

        {/* Summary strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          borderBottom: '1px solid var(--border)',
        }}>
          {[
            { label: 'Active hires monitored',      value: totalHires,          color: 'var(--text)' },
            { label: 'Hires with friction signals',  value: atRisk,              color: atRisk > 0 ? 'var(--amber)' : 'var(--green)' },
            { label: 'Departments reviewed',         value: displayNodes.length, color: 'var(--text)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ padding: '14px 20px', borderRight: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {isEmpty ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            <i className="fa-solid fa-building-slash" style={{ fontSize: 28, color: 'var(--text3)', display: 'block', marginBottom: 12 }} />
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: 'var(--text)' }}>No department data yet</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>
              Department health will appear here once new hires have active journeys with risk scores.
            </div>
          </div>
        ) : (
          <div>
            {displayNodes.map((dept, i) => {
              const s           = STATUS_CONFIG[dept.status]
              const frictionPct = Math.round(dept.friction * 100)
              const isFiltered  = activeDept === dept.name
              const isExpanded  = expandedId === dept.id
              const deptHires   = hiresByDept?.[dept.name] ?? []

              return (
                <div key={dept.id} style={{ borderBottom: i < displayNodes.length - 1 || isExpanded ? '1px solid var(--border)' : 'none' }}>
                  {/* Dept row */}
                  <div
                    onClick={() => {
                      const opening = expandedId !== dept.id
                      setExpandedId(opening ? dept.id : null)
                      onDeptFilter?.(isFiltered && !opening ? '' : dept.name)
                    }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto 160px auto',
                      alignItems: 'center',
                      gap: 20,
                      padding: '16px 20px',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      background: isExpanded ? 'var(--blue-light, rgba(26,108,246,0.06))' : isFiltered ? 'var(--blue-light, rgba(26,108,246,0.04))' : 'transparent',
                      borderLeft: isExpanded ? '3px solid var(--blue)' : isFiltered ? '3px solid var(--blue)' : '3px solid transparent',
                    }}
                    onMouseEnter={e => { if (!isExpanded && !isFiltered) e.currentTarget.style.background = 'var(--surface2)' }}
                    onMouseLeave={e => { if (!isExpanded && !isFiltered) e.currentTarget.style.background = 'transparent' }}
                  >
                    {/* Name + hires */}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{dept.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                        {dept.hires} active {dept.hires === 1 ? 'hire' : 'hires'} · Avg. Day {dept.day}
                        {deptHires.length > 0 && (
                          <span style={{ marginLeft: 6, color: 'var(--blue)', fontWeight: 600 }}>
                            · Click to {isExpanded ? 'collapse' : 'see hires'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: s.bg, color: s.color,
                      border: `1px solid ${s.border}`,
                      fontSize: 11, fontWeight: 700,
                      padding: '3px 10px', borderRadius: 100, whiteSpace: 'nowrap',
                    }}>
                      <i className={s.icon} style={{ fontSize: 10 }} />
                      {s.label}
                    </span>

                    {/* Friction bar */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>Friction</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{frictionPct}%</span>
                      </div>
                      <div style={{ height: 5, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 100,
                          width: `${frictionPct}%`,
                          background: dept.status === 'stable'
                            ? 'var(--green)'
                            : dept.status === 'turbulence'
                              ? 'linear-gradient(90deg,var(--amber),#f87171)'
                              : 'var(--red)',
                          transition: 'width 0.6s var(--ease)',
                        }} />
                      </div>
                    </div>

                    {/* Expand chevron */}
                    <i
                      className="fa-solid fa-chevron-down"
                      style={{
                        fontSize: 12, color: 'var(--text3)',
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                  </div>

                  {/* Inline hire list panel */}
                  {isExpanded && (
                    <HireDeptPanel
                      hires={deptHires}
                      dept={dept}
                      onGetBrief={() => setBriefDept(dept)}
                      onClose={() => setExpandedId(null)}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--surface2)',
        }}>
          <i className="fa-solid fa-sparkles" style={{ fontSize: 11, background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }} />
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>
            {onDeptFilter
              ? 'Click a department row to see its hires and filter the employee table.'
              : 'AI scores updated daily from task velocity, engagement signals, and check-in sentiment.'}
          </span>
        </div>
      </div>

      {briefDept && (
        <InterventionBrief
          point={{
            id: briefDept.id,
            type: (briefDept.frictionType as typeof FRICTION_TYPES[number]) ?? FRICTION_TYPES[0],
            label: `${briefDept.name} — ${STATUS_CONFIG[briefDept.status].label}`,
            day: briefDept.day,
            severity: briefDept.status === 'high-risk' ? 'high' : briefDept.status === 'turbulence' ? 'medium' : 'low',
            description: briefDept.description,
            intervention: briefDept.intervention,
          }}
          onClose={() => setBriefDept(null)}
        />
      )}
    </>
  )
}
