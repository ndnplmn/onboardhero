'use client'

import { useState } from 'react'
import InterventionBrief from './InterventionBrief'

export interface DeptNode {
  id: string
  name: string
  friction: number    // 0–1
  hires: number
  status: 'stable' | 'turbulence' | 'high-risk'
  day: number
  description: string
  intervention: string
}

const MOCK_DEPT_NODES: DeptNode[] = [
  {
    id: 'd1', name: 'Engineering', friction: 0.65, hires: 12,
    status: 'turbulence', day: 42,
    description: 'Widespread stall in Technical Ramp-up phase. Integration velocity has dropped 14% this week.',
    intervention: 'Schedule a cross-functional technical sync and pair struggling hires with a senior buddy.',
  },
  {
    id: 'd2', name: 'Product', friction: 0.15, hires: 8,
    status: 'stable', day: 15,
    description: 'High resonance. Hires are achieving speed-to-value 20% faster than benchmark.',
    intervention: 'Capture best practices and document them in the company playbook.',
  },
  {
    id: 'd3', name: 'Sales', friction: 0.85, hires: 5,
    status: 'high-risk', day: 60,
    description: 'Critical disconnect in culture alignment. Multiple early-exit signals detected across 3 hires.',
    intervention: 'Schedule an executive check-in within 48 hours. Review culture-fit assessment gaps.',
  },
  {
    id: 'd4', name: 'Operations', friction: 0.30, hires: 4,
    status: 'stable', day: 22,
    description: 'Stable integration. On-track across all ramp-up phases.',
    intervention: 'Continue monitoring. No action required this week.',
  },
]

const STATUS_CONFIG = {
  stable:     { label: 'Stable',     color: 'var(--green)',  bg: 'var(--green-bg)',  border: 'rgba(34,197,94,0.2)',  icon: 'fa-solid fa-circle-check' },
  turbulence: { label: 'At Risk',    color: 'var(--amber)',  bg: 'var(--amber-bg)',  border: 'rgba(245,158,11,0.2)', icon: 'fa-solid fa-triangle-exclamation' },
  'high-risk':{ label: 'Critical',   color: 'var(--red)',    bg: 'var(--red-bg)',    border: 'rgba(239,68,68,0.2)',  icon: 'fa-solid fa-circle-xmark' },
}

const TYPE_MAP: Record<string, 'technical' | 'culture' | 'engagement' | 'role_clarity' | 'mentorship'> = {
  'd1': 'technical',
  'd2': 'engagement',
  'd3': 'culture',
  'd4': 'mentorship',
}

function getOrgHealth(nodes: DeptNode[]) {
  const avg = nodes.reduce((s, n) => s + n.friction, 0) / nodes.length
  if (avg < 0.3) return { label: 'Healthy', color: 'var(--green)', score: Math.round((1 - avg) * 100) }
  if (avg < 0.6) return { label: 'Watch', color: 'var(--amber)', score: Math.round((1 - avg) * 100) }
  return { label: 'Needs Attention', color: 'var(--red)', score: Math.round((1 - avg) * 100) }
}

export default function GlobalFrictionMap() {
  const [selected, setSelected] = useState<DeptNode | null>(null)
  const orgHealth = getOrgHealth(MOCK_DEPT_NODES)
  const totalHires = MOCK_DEPT_NODES.reduce((s, n) => s + n.hires, 0)
  const atRisk = MOCK_DEPT_NODES.filter(n => n.status !== 'stable').reduce((s, n) => s + n.hires, 0)

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
              <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 600 }}>{orgHealth.score}/100</span>
            </div>
          </div>
        </div>

        {/* Summary strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          borderBottom: '1px solid var(--border)',
        }}>
          {[
            { label: 'Active hires monitored', value: totalHires, color: 'var(--text)' },
            { label: 'Hires with friction signals', value: atRisk, color: atRisk > 0 ? 'var(--amber)' : 'var(--green)' },
            { label: 'Departments reviewed', value: MOCK_DEPT_NODES.length, color: 'var(--text)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ padding: '14px 20px', borderRight: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Department rows */}
        <div>
          {MOCK_DEPT_NODES.map((dept, i) => {
            const s = STATUS_CONFIG[dept.status]
            const frictionPct = Math.round(dept.friction * 100)
            return (
              <div
                key={dept.id}
                onClick={() => setSelected(dept)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 160px auto',
                  alignItems: 'center',
                  gap: 20,
                  padding: '16px 20px',
                  borderBottom: i < MOCK_DEPT_NODES.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Name + hires */}
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{dept.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {dept.hires} active {dept.hires === 1 ? 'hire' : 'hires'} · Avg. Day {dept.day}
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

                {/* Action chevron */}
                <i className="fa-solid fa-chevron-right" style={{ fontSize: 12, color: 'var(--text3)' }} />
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--surface2)',
        }}>
          <i className="fa-solid fa-sparkles" style={{ fontSize: 11, background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }} />
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>
            AI scores are updated daily from task completion velocity, engagement signals, and check-in sentiment.
          </span>
        </div>
      </div>

      {selected && (
        <InterventionBrief
          point={{
            id: selected.id,
            type: TYPE_MAP[selected.id] ?? 'technical',
            label: `${selected.name} — ${STATUS_CONFIG[selected.status].label}`,
            day: selected.day,
            severity: selected.status === 'high-risk' ? 'high' : selected.status === 'turbulence' ? 'medium' : 'low',
            description: selected.description,
            intervention: selected.intervention,
          }}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
