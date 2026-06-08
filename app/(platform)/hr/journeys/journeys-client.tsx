'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import TemplateCard from '@/components/platform/TemplateCard'
import TemplateEditor from '@/components/platform/TemplateEditor'
import JourneyPreview from '@/components/ai/JourneyPreview'
import { seedStarterTemplate } from './actions'

const STARTER_TEMPLATES = [
  {
    key: 'standard',
    name: '90-Day Standard',
    icon: 'fa-solid fa-star',
    color: 'var(--blue)',
    bg: 'var(--blue-light)',
    roleType: 'General',
    dept: 'All Departments',
    desc: 'Universal onboarding covering culture, tools, and first deliverables. Best starting point for any new hire.',
    taskCount: 9,
  },
  {
    key: 'engineering',
    name: 'Engineering Fast-Track',
    icon: 'fa-solid fa-laptop-code',
    color: 'var(--cyan)',
    bg: 'var(--cyan-light)',
    roleType: 'Engineer',
    dept: 'Engineering',
    desc: 'Accelerated technical ramp-up: dev environment, first PR, code review standards, and sprint leadership.',
    taskCount: 9,
  },
  {
    key: 'sales',
    name: 'Sales Enablement',
    icon: 'fa-solid fa-chart-line',
    color: 'var(--green)',
    bg: 'var(--green-bg)',
    roleType: 'Sales',
    dept: 'Sales',
    desc: 'CRM setup, demo certification, pitch review, and a clear path to the first closed deal.',
    taskCount: 9,
  },
]

interface Props {
  templates: any[]
  tasksByTemplate: Record<string, any[]>
  perfByTemplate?: Record<string, any>
}

export default function JourneysClient({ templates, tasksByTemplate, perfByTemplate = {} }: Props) {
  const router = useRouter()
  const [showEditor, setShowEditor] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [showAIBuilder, setShowAIBuilder] = useState(false)
  const [seedingKey, setSeedingKey] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Filter out starters already imported
  const existingNames = new Set(templates.map(t => t.name))
  const availableStarters = STARTER_TEMPLATES.filter(s => !existingNames.has(s.name))

  function handleSeedStarter(key: string) {
    setSeedingKey(key)
    startTransition(async () => {
      await seedStarterTemplate(key)
      setSeedingKey(null)
      router.refresh()
    })
  }

  return (
    <>
      {/* Page Header */}
      <div className="db-header">
        <div className="db-header-left">
          <h1>Journey Builder</h1>
          <p>
            Create, manage, and assign 90-day onboarding journeys to new hires.
            {templates.length > 0 && (
              <> · <strong style={{ color: 'var(--text2)' }}>{templates.length} template{templates.length !== 1 ? 's' : ''}</strong> in your library</>
            )}
          </p>
        </div>
        <div className="db-header-actions">
          <button
            className="btn btn-primary btn-sm btn-glow"
            onClick={() => setShowAIBuilder(true)}
            aria-label="Generate a journey template with AI builder"
          >
            <i className="fa-solid fa-sparkles" aria-hidden="true" /> Generate with AI
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => setShowEditor(true)} aria-label="Create a new journey template">
            <i className="fa-solid fa-plus" aria-hidden="true" /> Create Template
          </button>
          <button className="btn btn-primary btn-sm btn-glow" onClick={() => setShowAI(true)} aria-label="Generate a journey template with AI">
            <i className="fa-solid fa-sparkles" aria-hidden="true" /> Generate with AI
          </button>
        </div>
      </div>

      <div className="db-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-standard)' }}>

        {/* ── Quickstart Starters ─── shown when starters not yet imported */}
        {availableStarters.length > 0 && (
          <div className="db-card" style={{ overflow: 'hidden' }}>
            <div className="db-card-hd">
              <div>
                <h3>
                  <i className="fa-solid fa-bolt" style={{ color: 'var(--amber)' }} />
                  {' '}Quickstart Templates
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                  Pre-built templates to import into your library with one click.
                </p>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 0,
              borderTop: '1px solid var(--border)',
            }}>
              {availableStarters.map((s, i) => (
                <div
                  key={s.key}
                  style={{
                    padding: '20px 24px',
                    borderRight: i < availableStarters.length - 1 ? '1px solid var(--border)' : 'none',
                    display: 'flex', flexDirection: 'column', gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--r)',
                      background: s.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <i className={s.icon} style={{ fontSize: 16, color: s.color }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {s.roleType} · {s.dept} · {s.taskCount} tasks
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.55, margin: 0, flex: 1 }}>
                    {s.desc}
                  </p>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleSeedStarter(s.key)}
                    disabled={isPending && seedingKey === s.key}
                  >
                    {isPending && seedingKey === s.key
                      ? <><i className="fa-solid fa-spinner fa-spin" /> Importing...</>
                      : <><i className="fa-solid fa-download" /> Import to Library</>
                    }
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Template Library ───────────────────────────────────────── */}
        {templates.length === 0 && availableStarters.length === 0 ? (
          /* Edge case: all starters imported but none yet in DB — shouldn't happen */
          null
        ) : templates.length === 0 ? (
          /* Library empty state */
          <div className="db-card">
            <div style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 'var(--r-xl)',
                background: 'var(--grad-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <i className="fa-solid fa-route" style={{ fontSize: 24, color: 'var(--blue)' }} />
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
                Your template library is empty
              </div>
              <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6, marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
                Import a quickstart template above, create one manually, or let AI generate a custom journey based on the role.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn btn-outline btn-sm" onClick={() => setShowEditor(true)}>
                  <i className="fa-solid fa-plus" /> Create Template
                </button>
                <button className="btn btn-primary btn-sm btn-glow" onClick={() => setShowAIBuilder(true)}>
                  <i className="fa-solid fa-sparkles" /> Generate with AI
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Section label */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Your Library — {templates.length} template{templates.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Template grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 'var(--gap-standard)',
            }}>
              {templates.map(t => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  tasks={tasksByTemplate[t.id] || []}
                  performance={perfByTemplate[t.id]}
                  onRefresh={() => router.refresh()}
                />
              ))}
            </div>
          </>
        )}

        {/* ── How it works ────────────────────────────────────────────── */}
        <div className="db-card">
          <div className="db-card-hd">
            <h3>
              <i className="fa-solid fa-circle-info" style={{ color: 'var(--blue)' }} />
              {' '}How Journey Builder works
            </h3>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 0,
            borderTop: '1px solid var(--border)',
          }}>
            {[
              {
                step: '1',
                icon: 'fa-solid fa-sparkles',
                color: 'var(--blue)',
                title: 'Create a Template',
                desc: 'Build manually or generate a full journey with AI in seconds.',
              },
              {
                step: '2',
                icon: 'fa-solid fa-paper-plane',
                color: 'var(--cyan)',
                title: 'Assign to a Hire',
                desc: 'Click "Assign to Hire" on any template and pick the employee + manager.',
              },
              {
                step: '3',
                icon: 'fa-solid fa-gauge-high',
                color: 'var(--green)',
                title: 'Track Progress',
                desc: 'Monitor completion, friction signals, and engagement from the dashboard.',
              },
              {
                step: '4',
                icon: 'fa-solid fa-robot',
                color: 'var(--amber)',
                title: 'AI Adapts the Journey',
                desc: 'Aura detects friction and suggests task mutations to accelerate ramp-up.',
              },
            ].map((item, i, arr) => (
              <div
                key={item.step}
                style={{
                  padding: '20px 24px',
                  borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex', flexDirection: 'column', gap: 10,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--r)',
                  background: 'var(--bg)',
                  border: '1.5px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <i className={item.icon} style={{ fontSize: 14, color: item.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                    {item.step}. {item.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.55 }}>
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modals */}
      <AnimatePresence>
        {showEditor && <TemplateEditor onClose={() => { setShowEditor(false); router.refresh() }} />}
      </AnimatePresence>
      <AnimatePresence>
        {showAI && <JourneyPreview onClose={() => { setShowAI(false); router.refresh() }} />}
      </AnimatePresence>

      {showAIBuilder && (
        <AIJourneyBuilderModal
          onClose={() => setShowAIBuilder(false)}
          onSaved={() => { setShowAIBuilder(false); router.refresh() }}
        />
      )}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Department = 'Engineering' | 'Design' | 'Product' | 'Sales' | 'Marketing' | 'Operations' | 'HR' | 'Finance'
type CompanySize = 'Startup (1-50)' | 'Growth (51-200)' | 'Scale-up (201-1000)' | 'Enterprise (1000+)'
type OnboardingStyle = 'Technical-focused' | 'Culture-focused' | 'Balanced'
type AssignedRole = 'HR' | 'Manager' | 'New Hire'
type Phase = 'Foundation' | 'Integration' | 'Contribution'

interface GeneratedTask {
  id: string
  week: number
  phase: Phase
  title: string
  assignedRole: AssignedRole
  description: string
}

interface GeneratedJourney {
  title: string
  description: string
  tasks: GeneratedTask[]
}

interface AIBuilderForm {
  role: string
  department: Department
  companySize: CompanySize
  style: OnboardingStyle
  specialNeeds: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock journey generator
// ─────────────────────────────────────────────────────────────────────────────

function generateMockJourney(form: AIBuilderForm): GeneratedJourney {
  const { role, department, style } = form

  const roleLabel = role.trim() || department

  const byDept: Record<Department, GeneratedTask[]> = {
    Engineering: [
      // Foundation
      { id: 't1', week: 1, phase: 'Foundation', title: 'Dev Environment Setup', assignedRole: 'Manager', description: 'Provision laptop, install required toolchain, configure VPN and Git access, and verify local build succeeds.' },
      { id: 't2', week: 1, phase: 'Foundation', title: 'Codebase Orientation', assignedRole: 'Manager', description: 'Guided tour of the monorepo structure, branching strategy, CI/CD pipeline, and coding standards doc.' },
      { id: 't3', week: 2, phase: 'Foundation', title: 'First Bug Fix PR', assignedRole: 'New Hire', description: 'Pick a "good first issue" from the backlog, implement the fix, write tests, and pass code review.' },
      { id: 't4', week: 3, phase: 'Foundation', title: 'Pair Programming Sessions', assignedRole: 'Manager', description: 'Schedule three 90-minute pairing sessions with senior engineers across different parts of the stack.' },
      // Integration
      { id: 't5', week: 5, phase: 'Integration', title: 'Own a Feature End-to-End', assignedRole: 'New Hire', description: 'Design, implement, and ship a small feature from requirements through production deployment with zero blockers.' },
      { id: 't6', week: 6, phase: 'Integration', title: 'Lead a Sprint Ceremony', assignedRole: 'New Hire', description: 'Facilitate one sprint planning or retrospective to build comfort with team rhythm and stakeholder communication.' },
      { id: 't7', week: 7, phase: 'Integration', title: 'Architecture Review Participation', assignedRole: 'Manager', description: 'Invite new hire to the next architecture review and assign them a section to present or critique.' },
      // Contribution
      { id: 't8', week: 9, phase: 'Contribution', title: 'Performance Deep Dive', assignedRole: 'New Hire', description: 'Profile a slow endpoint or UI path, identify root causes, and submit an optimization PR with measurable improvement.' },
      { id: 't9', week: 11, phase: 'Contribution', title: 'Mentor a Junior Engineer', assignedRole: 'New Hire', description: 'Take ownership of onboarding a junior team member or intern for one week to build leadership muscle.' },
      { id: 't10', week: 12, phase: 'Contribution', title: '90-Day Engineering Retrospective', assignedRole: 'HR', description: 'Structured review covering technical growth, team integration, and 6-month goal-setting with manager and HR.' },
    ],
    Design: [
      { id: 't1', week: 1, phase: 'Foundation', title: 'Design System Immersion', assignedRole: 'Manager', description: 'Deep dive into the component library, Figma workspace structure, design tokens, and brand guidelines.' },
      { id: 't2', week: 2, phase: 'Foundation', title: 'Shadow Current Project Critiques', assignedRole: 'New Hire', description: 'Attend all design reviews this week as an observer to understand feedback culture and quality bar.' },
      { id: 't3', week: 3, phase: 'Foundation', title: 'First Redesign Task', assignedRole: 'New Hire', description: 'Take an existing low-traffic screen and propose a UX improvement with rationale, mocks, and user story.' },
      { id: 't4', week: 4, phase: 'Foundation', title: 'Design-Engineering Sync', assignedRole: 'Manager', description: 'Set up recurring pairing with an engineering counterpart to learn handoff norms and dev constraints.' },
      { id: 't5', week: 5, phase: 'Integration', title: 'Own a Feature Design End-to-End', assignedRole: 'New Hire', description: 'Lead discovery, wireframing, prototyping, and spec writing for an upcoming product feature.' },
      { id: 't6', week: 7, phase: 'Integration', title: 'User Research Collaboration', assignedRole: 'New Hire', description: 'Join a user interview or usability test session and synthesize findings into actionable design insights.' },
      { id: 't7', week: 8, phase: 'Integration', title: 'Design System Contribution', assignedRole: 'New Hire', description: 'Propose and ship one new component or token to the shared design system with documentation.' },
      { id: 't8', week: 10, phase: 'Contribution', title: 'Cross-Functional Design Sprint', assignedRole: 'New Hire', description: 'Lead a 3-day design sprint for a strategic initiative, coordinating with product, engineering, and marketing.' },
      { id: 't9', week: 12, phase: 'Contribution', title: '90-Day Design Review', assignedRole: 'HR', description: 'Portfolio review of work shipped, feedback from stakeholders, and roadmap for next quarter growth.' },
    ],
    Product: [
      { id: 't1', week: 1, phase: 'Foundation', title: 'Product Vision & Strategy Read-Out', assignedRole: 'Manager', description: 'Walk through the product roadmap, current OKRs, competitive landscape, and key customer segments.' },
      { id: 't2', week: 2, phase: 'Foundation', title: 'Stakeholder Mapping', assignedRole: 'New Hire', description: 'Identify and schedule intros with key cross-functional partners: engineering leads, design, sales, and support.' },
      { id: 't3', week: 3, phase: 'Foundation', title: 'Customer Interview Deep Dive', assignedRole: 'New Hire', description: 'Conduct three customer discovery calls focused on current pain points and unmet needs in your product area.' },
      { id: 't4', week: 4, phase: 'Foundation', title: 'Shadow a Sprint Planning', assignedRole: 'New Hire', description: 'Observe how the team currently writes user stories, sizes work, and negotiates scope before taking ownership.' },
      { id: 't5', week: 5, phase: 'Integration', title: 'Own First Feature Spec', assignedRole: 'New Hire', description: 'Draft a full product requirements document including user stories, acceptance criteria, and success metrics.' },
      { id: 't6', week: 7, phase: 'Integration', title: 'Data-Driven Prioritization Session', assignedRole: 'Manager', description: 'Work with PM and analytics to run a scoring model on the backlog and present prioritization rationale.' },
      { id: 't7', week: 8, phase: 'Integration', title: 'Launch Readiness Checklist', assignedRole: 'New Hire', description: 'Coordinate go-to-market checklist for an upcoming feature: release notes, support docs, comms plan.' },
      { id: 't8', week: 10, phase: 'Contribution', title: 'Present Quarterly Roadmap', assignedRole: 'New Hire', description: 'Present your area\'s Q+1 roadmap to leadership with supporting data, risk analysis, and resource asks.' },
      { id: 't9', week: 12, phase: 'Contribution', title: '90-Day PM Retrospective', assignedRole: 'HR', description: 'Review shipped work, stakeholder feedback, and define 6-month growth targets with manager.' },
    ],
    Sales: [
      { id: 't1', week: 1, phase: 'Foundation', title: 'CRM & Sales Stack Setup', assignedRole: 'HR', description: 'Provision Salesforce access, configure email sequences, install sales enablement tools, and complete data hygiene training.' },
      { id: 't2', week: 1, phase: 'Foundation', title: 'Product Certification', assignedRole: 'Manager', description: 'Complete the self-paced product training modules and pass the internal certification exam with a score of 90%+.' },
      { id: 't3', week: 2, phase: 'Foundation', title: 'Shadow Top-Performer Calls', assignedRole: 'New Hire', description: 'Sit in on 5 live discovery and demo calls with the top two performers to internalize the winning pitch patterns.' },
      { id: 't4', week: 3, phase: 'Foundation', title: 'First Pitch Rehearsal', assignedRole: 'Manager', description: 'Deliver a full demo to the sales manager and two peers. Receive structured feedback on messaging and objection handling.' },
      { id: 't5', week: 5, phase: 'Integration', title: 'Own First Pipeline Stage', assignedRole: 'New Hire', description: 'Take sole ownership of 10 prospects through the discovery phase, logging all activities and outcomes in CRM.' },
      { id: 't6', week: 6, phase: 'Integration', title: 'Competitive Battlecard Mastery', assignedRole: 'New Hire', description: 'Study all competitive battlecards, complete roleplay scenarios for each competitor, and score 100% on the quiz.' },
      { id: 't7', week: 7, phase: 'Integration', title: 'First Solo Customer Demo', assignedRole: 'New Hire', description: 'Run a full discovery and demo call solo with a real prospect. Manager observes silently and debrief follows.' },
      { id: 't8', week: 9, phase: 'Contribution', title: 'Build First Pipeline to Quota', assignedRole: 'New Hire', description: 'Construct a pipeline at 3x quota coverage using outbound prospecting, inbound routing, and partner referrals.' },
      { id: 't9', week: 11, phase: 'Contribution', title: 'First Closed-Won Deal', assignedRole: 'New Hire', description: 'Close the first deal end-to-end, document the winning playbook patterns, and present learnings to the team.' },
      { id: 't10', week: 12, phase: 'Contribution', title: '90-Day Sales Review', assignedRole: 'HR', description: 'Review pipeline health, close rate, ramp trajectory, and set quota targets for the next two quarters.' },
    ],
    Marketing: [
      { id: 't1', week: 1, phase: 'Foundation', title: 'Brand & Messaging Bootcamp', assignedRole: 'Manager', description: 'Study brand guidelines, tone of voice doc, key personas, and current campaign portfolio to align on positioning.' },
      { id: 't2', week: 2, phase: 'Foundation', title: 'Marketing Stack Access & Training', assignedRole: 'HR', description: 'Provision HubSpot, Canva, Google Analytics, and any ad platforms. Complete platform certifications relevant to role.' },
      { id: 't3', week: 3, phase: 'Foundation', title: 'Audit One Active Campaign', assignedRole: 'New Hire', description: 'Pick a live campaign and perform a full audit: copy, targeting, creative, performance metrics, and improvement recs.' },
      { id: 't4', week: 4, phase: 'Foundation', title: 'First Content Piece', assignedRole: 'New Hire', description: 'Draft, design, and publish one piece of content aligned with the content calendar. Includes SEO and distribution.' },
      { id: 't5', week: 6, phase: 'Integration', title: 'Own a Campaign End-to-End', assignedRole: 'New Hire', description: 'Plan, execute, and report on a complete marketing campaign from brief to post-launch performance analysis.' },
      { id: 't6', week: 7, phase: 'Integration', title: 'Cross-Functional Campaign Brief', assignedRole: 'New Hire', description: 'Lead a campaign brief session with sales and product to align on messaging, assets, and launch timeline.' },
      { id: 't7', week: 9, phase: 'Contribution', title: 'Channel Experiment & Report', assignedRole: 'New Hire', description: 'Identify an underutilized channel, run a 2-week experiment, and present findings with recommendations to leadership.' },
      { id: 't8', week: 12, phase: 'Contribution', title: '90-Day Marketing Review', assignedRole: 'HR', description: 'Review contributions to pipeline, brand KPIs, and set goals for the next quarter with manager.' },
    ],
    Operations: [
      { id: 't1', week: 1, phase: 'Foundation', title: 'Process Map Orientation', assignedRole: 'Manager', description: 'Review all current SOPs, process maps, and operational dashboards for your area of ownership.' },
      { id: 't2', week: 2, phase: 'Foundation', title: 'Systems Access & Workflow Training', assignedRole: 'HR', description: 'Provision ERP, project management, and analytics tools. Complete system-specific training modules.' },
      { id: 't3', week: 3, phase: 'Foundation', title: 'Shadow Cross-Functional Standups', assignedRole: 'New Hire', description: 'Attend key operational standups across teams to map dependencies, bottlenecks, and communication patterns.' },
      { id: 't4', week: 4, phase: 'Foundation', title: 'First Process Improvement Proposal', assignedRole: 'New Hire', description: 'Identify one inefficiency in a current workflow and present a data-backed improvement proposal to your manager.' },
      { id: 't5', week: 6, phase: 'Integration', title: 'Own an Operational Initiative', assignedRole: 'New Hire', description: 'Take full ownership of a cross-functional initiative from scoping through delivery and post-launch measurement.' },
      { id: 't6', week: 8, phase: 'Integration', title: 'Vendor or Partner Review', assignedRole: 'Manager', description: 'Lead a QBR or performance review with a key vendor or internal partner to assess SLAs and improvement areas.' },
      { id: 't7', week: 10, phase: 'Contribution', title: 'Operational KPI Dashboard', assignedRole: 'New Hire', description: 'Build or redesign a KPI dashboard tracking your key metrics; present to leadership with narrative context.' },
      { id: 't8', week: 12, phase: 'Contribution', title: '90-Day Ops Retrospective', assignedRole: 'HR', description: 'Review impact delivered, process improvements shipped, and set operational goals for the next two quarters.' },
    ],
    HR: [
      { id: 't1', week: 1, phase: 'Foundation', title: 'HRIS & People Stack Orientation', assignedRole: 'Manager', description: 'Gain full access and training on the HRIS, ATS, performance management, and onboarding platforms.' },
      { id: 't2', week: 2, phase: 'Foundation', title: 'Policy & Compliance Review', assignedRole: 'New Hire', description: 'Study the employee handbook, compliance requirements, and current HR policies relevant to your specialty.' },
      { id: 't3', week: 3, phase: 'Foundation', title: 'Shadow Employee Lifecycle Events', assignedRole: 'Manager', description: 'Observe an offer negotiation, an onboarding session, and an offboarding process to understand end-to-end flow.' },
      { id: 't4', week: 4, phase: 'Foundation', title: 'First HR Project Ownership', assignedRole: 'New Hire', description: 'Take ownership of one ongoing HR initiative — whether recruiting, L&D, or engagement — with clear deliverables.' },
      { id: 't5', week: 6, phase: 'Integration', title: 'Lead an Onboarding Session', assignedRole: 'New Hire', description: 'Facilitate a full new hire orientation session solo, gather feedback, and implement at least one improvement.' },
      { id: 't6', week: 8, phase: 'Integration', title: 'People Analytics Report', assignedRole: 'New Hire', description: 'Pull, analyze, and present key people metrics (retention, time-to-hire, engagement scores) to the HR leadership team.' },
      { id: 't7', week: 10, phase: 'Contribution', title: 'HR Program Proposal', assignedRole: 'New Hire', description: 'Design and pitch a new or improved HR program based on data gathered during the first two months.' },
      { id: 't8', week: 12, phase: 'Contribution', title: '90-Day HR Retrospective', assignedRole: 'HR', description: 'Review program contributions, stakeholder feedback scores, and set growth targets with your manager.' },
    ],
    Finance: [
      { id: 't1', week: 1, phase: 'Foundation', title: 'Finance Systems Access & Training', assignedRole: 'Manager', description: 'Provision ERP, FP&A tools, and reporting platforms. Complete SOX compliance and data governance training.' },
      { id: 't2', week: 2, phase: 'Foundation', title: 'Chart of Accounts & Budget Structure', assignedRole: 'New Hire', description: 'Deep dive into the company\'s chart of accounts, cost center hierarchy, and current fiscal year budget structure.' },
      { id: 't3', week: 3, phase: 'Foundation', title: 'Close Cycle Shadow', assignedRole: 'Manager', description: 'Participate in the month-end close process as an observer to learn the cadence, responsibilities, and pain points.' },
      { id: 't4', week: 4, phase: 'Foundation', title: 'First Variance Analysis', assignedRole: 'New Hire', description: 'Prepare a budget vs. actuals variance analysis for one cost center and present findings to your manager.' },
      { id: 't5', week: 6, phase: 'Integration', title: 'Own a Budget Area', assignedRole: 'New Hire', description: 'Take full ownership of forecasting and reporting for an assigned department or business unit.' },
      { id: 't6', week: 8, phase: 'Integration', title: 'Business Partner Relationship', assignedRole: 'New Hire', description: 'Establish recurring finance business partner cadence with your assigned department head to provide financial guidance.' },
      { id: 't7', week: 10, phase: 'Contribution', title: 'Strategic Financial Model', assignedRole: 'New Hire', description: 'Build or enhance a financial model to support a strategic decision (new hire plan, investment case, or pricing analysis).' },
      { id: 't8', week: 12, phase: 'Contribution', title: '90-Day Finance Review', assignedRole: 'HR', description: 'Review analytical contributions, accuracy record, and set goals for annual planning cycle ownership.' },
    ],
  }

  // Style modifier: Technical-focused adds more technical tasks, Culture-focused adds culture tasks
  const tasks = byDept[department] ?? byDept['Engineering']

  const cultureTask: GeneratedTask = {
    id: 'tc1',
    week: 2,
    phase: 'Foundation',
    title: 'Culture Immersion Sprint',
    assignedRole: 'HR',
    description: 'Complete the culture onboarding deck, attend one all-hands or town hall, and schedule coffee chats with 5 cross-functional team members.',
  }

  const techTask: GeneratedTask = {
    id: 'tt1',
    week: 3,
    phase: 'Foundation',
    title: 'Tools & Technology Deep Dive',
    assignedRole: 'Manager',
    description: 'Complete advanced training on the primary tools used in this role, including integrations, keyboard shortcuts, and power-user workflows.',
  }

  let finalTasks = [...tasks]
  if (style === 'Culture-focused') {
    finalTasks = [cultureTask, ...tasks]
  } else if (style === 'Technical-focused') {
    finalTasks = [techTask, ...tasks]
  } else {
    // Balanced — insert both but keep list clean
    finalTasks = [cultureTask, ...tasks]
  }

  return {
    title: `${roleLabel} · 90-Day Onboarding Journey`,
    description: `A ${style.toLowerCase()} onboarding plan for ${roleLabel} in ${department}. Structured across three phases — Foundation (weeks 1–4), Integration (weeks 5–8), and Contribution (weeks 9–12) — to accelerate ramp-up and maximize long-term retention.`,
    tasks: finalTasks,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AIJourneyBuilderModal
// ─────────────────────────────────────────────────────────────────────────────

const LOADING_MESSAGES = [
  'Analyzing role requirements...',
  'Designing week-by-week structure...',
  'Adding culture integration touchpoints...',
  'Finalizing 90-day roadmap...',
]

const PHASE_COLORS: Record<Phase, { bg: string; color: string; border: string }> = {
  Foundation: { bg: 'var(--cyan-light)', color: 'var(--cyan)', border: 'var(--cyan-mid, #67e8f9)' },
  Integration: { bg: 'var(--blue-light)', color: 'var(--blue)', border: 'var(--blue-mid, #93c5fd)' },
  Contribution: { bg: '#f3e8ff', color: '#7c3aed', border: '#c4b5fd' },
}

const WEEK_PHASE: (week: number) => Phase = (week) => {
  if (week <= 4) return 'Foundation'
  if (week <= 8) return 'Integration'
  return 'Contribution'
}

const ROLE_ICON: Record<AssignedRole, string> = {
  HR: 'fa-solid fa-id-badge',
  Manager: 'fa-solid fa-user-tie',
  'New Hire': 'fa-solid fa-seedling',
}

interface AIJourneyBuilderModalProps {
  onClose: () => void
  onSaved: () => void
}

function AIJourneyBuilderModal({ onClose, onSaved }: AIJourneyBuilderModalProps) {
  const [step, setStep] = useState<'form' | 'loading' | 'result'>('form')
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0)
  const [journey, setJourney] = useState<GeneratedJourney | null>(null)
  const [toast, setToast] = useState(false)
  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [form, setForm] = useState<AIBuilderForm>({
    role: '',
    department: 'Engineering',
    companySize: 'Growth (51-200)',
    style: 'Balanced',
    specialNeeds: '',
  })

  // Cycle loading messages
  useEffect(() => {
    if (step === 'loading') {
      setLoadingMsgIndex(0)
      loadingTimerRef.current = setInterval(() => {
        setLoadingMsgIndex(prev => {
          if (prev >= LOADING_MESSAGES.length - 1) {
            if (loadingTimerRef.current) clearInterval(loadingTimerRef.current)
            return prev
          }
          return prev + 1
        })
      }, 750)
      return () => {
        if (loadingTimerRef.current) clearInterval(loadingTimerRef.current)
      }
    }
  }, [step])

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  function handleGenerate() {
    if (!form.role.trim() && form.department) {
      // Allow generation with just department if role is empty
    }
    setStep('loading')
    setTimeout(() => {
      const result = generateMockJourney(form)
      setJourney(result)
      setStep('result')
    }, 3000)
  }

  function handleSave() {
    setToast(true)
    setTimeout(() => {
      setToast(false)
      onSaved()
    }, 1800)
  }

  function handleRegenerate() {
    setStep('loading')
    setLoadingMsgIndex(0)
    setTimeout(() => {
      const result = generateMockJourney(form)
      setJourney(result)
      setStep('result')
    }, 3000)
  }

  const tasksByPhase: Record<Phase, GeneratedTask[]> = {
    Foundation: journey?.tasks.filter(t => WEEK_PHASE(t.week) === 'Foundation') ?? [],
    Integration: journey?.tasks.filter(t => WEEK_PHASE(t.week) === 'Integration') ?? [],
    Contribution: journey?.tasks.filter(t => WEEK_PHASE(t.week) === 'Contribution') ?? [],
  }

  return (
    <div
      className="modal-overlay open"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="AI Journey Builder"
    >
      <div
        className="modal-box modal-resource"
        style={{
          maxWidth: 600,
          width: '90%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          className="modal-close"
          onClick={onClose}
          aria-label="Close AI Journey Builder"
          style={{ zIndex: 10 }}
        >
          <i className="fa-solid fa-xmark" />
        </button>

        {/* Gradient header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--blue) 0%, #7c3aed 100%)',
          padding: '28px 32px 24px',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--r)',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(4px)',
            }}>
              <i className="fa-solid fa-sparkles" style={{ fontSize: 18, color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: '#fff' }}>
                AI Journey Builder
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
                Describe the role and Aura will design the perfect 90-day journey
              </div>
            </div>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            {(['form', 'loading', 'result'] as const).map((s, i) => {
              const labels = ['Step 1 — Describe Role', 'Step 2 — Generating', 'Step 3 — Review']
              const isActive = step === s || (step === 'loading' && s === 'loading') || (step === 'result' && i <= 2)
              const isDone = (step === 'loading' && i === 0) || (step === 'result' && i <= 1)
              return (
                <div key={s} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 11, fontWeight: 600,
                  color: isDone ? 'rgba(255,255,255,0.9)' : isActive && step === s ? '#fff' : 'rgba(255,255,255,0.45)',
                  background: step === s ? 'rgba(255,255,255,0.2)' : isDone ? 'rgba(255,255,255,0.12)' : 'transparent',
                  padding: '4px 10px', borderRadius: 100,
                  transition: 'all 0.3s',
                }}>
                  {isDone
                    ? <i className="fa-solid fa-check" style={{ fontSize: 9 }} />
                    : <span style={{ fontSize: 10 }}>{i + 1}</span>
                  }
                  {labels[i]}
                </div>
              )
            })}
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>

          {/* ── STEP 1: Form ──────────────────────────────────────── */}
          {step === 'form' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="fg">
                <label htmlFor="ai-role">Role / Position</label>
                <input
                  id="ai-role"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Senior Software Engineer"
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="fg">
                  <label htmlFor="ai-dept">Department</label>
                  <select
                    id="ai-dept"
                    className="form-input"
                    value={form.department}
                    onChange={e => setForm(f => ({ ...f, department: e.target.value as Department }))}
                  >
                    {(['Engineering', 'Design', 'Product', 'Sales', 'Marketing', 'Operations', 'HR', 'Finance'] as Department[]).map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="fg">
                  <label htmlFor="ai-size">Company Size</label>
                  <select
                    id="ai-size"
                    className="form-input"
                    value={form.companySize}
                    onChange={e => setForm(f => ({ ...f, companySize: e.target.value as CompanySize }))}
                  >
                    {(['Startup (1-50)', 'Growth (51-200)', 'Scale-up (201-1000)', 'Enterprise (1000+)'] as CompanySize[]).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="fg">
                <label htmlFor="ai-style">Onboarding Style</label>
                <select
                  id="ai-style"
                  className="form-input"
                  value={form.style}
                  onChange={e => setForm(f => ({ ...f, style: e.target.value as OnboardingStyle }))}
                >
                  {(['Technical-focused', 'Culture-focused', 'Balanced'] as OnboardingStyle[]).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="fg">
                <label htmlFor="ai-needs">
                  Special Requirements
                  <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text3)', marginLeft: 6 }}>(optional)</span>
                </label>
                <textarea
                  id="ai-needs"
                  className="form-input"
                  rows={3}
                  placeholder="Any specific requirements, tools, or focus areas?"
                  value={form.specialNeeds}
                  onChange={e => setForm(f => ({ ...f, specialNeeds: e.target.value }))}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 4, justifyContent: 'center' }}
                onClick={handleGenerate}
              >
                <i className="fa-solid fa-sparkles" /> Generate Journey
                <i className="fa-solid fa-arrow-right" style={{ marginLeft: 4, fontSize: 11 }} />
              </button>
            </div>
          )}

          {/* ── STEP 2: Loading ───────────────────────────────────── */}
          {step === 'loading' && (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '48px 16px', gap: 24, textAlign: 'center',
            }}>
              {/* Animated sparkles ring */}
              <div style={{ position: 'relative', width: 80, height: 80 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--blue-light), #ede9fe)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: 'spin 3s linear infinite',
                }}>
                  <i className="fa-solid fa-sparkles" style={{ fontSize: 28, color: 'var(--blue)' }} />
                </div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
                  Aura is building your journey
                </div>
                <div
                  style={{
                    fontSize: 13, color: 'var(--text3)',
                    minHeight: 20, transition: 'opacity 0.3s',
                  }}
                >
                  {LOADING_MESSAGES[loadingMsgIndex]}
                </div>
              </div>
              {/* Progress dots */}
              <div style={{ display: 'flex', gap: 8 }}>
                {LOADING_MESSAGES.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: i <= loadingMsgIndex ? 'var(--blue)' : 'var(--border)',
                      transition: 'background 0.3s',
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 3: Results ───────────────────────────────────── */}
          {step === 'result' && journey && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Journey header */}
              <div style={{
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r)',
                padding: '16px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 'var(--r)',
                    background: 'var(--blue-light)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 2,
                  }}>
                    <i className="fa-solid fa-route" style={{ fontSize: 14, color: 'var(--blue)' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                      {journey.title}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.55 }}>
                      {journey.description}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100, background: 'var(--blue-light)', color: 'var(--blue)' }}>
                    {journey.tasks.length} tasks
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text2)' }}>
                    3 phases
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100, background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text2)' }}>
                    12 weeks
                  </span>
                </div>
              </div>

              {/* Phases */}
              {(['Foundation', 'Integration', 'Contribution'] as Phase[]).map(phase => {
                const phaseTasks = tasksByPhase[phase]
                if (phaseTasks.length === 0) return null
                const colors = PHASE_COLORS[phase]
                const weekRange = phase === 'Foundation' ? 'Weeks 1–4' : phase === 'Integration' ? 'Weeks 5–8' : 'Weeks 9–12'
                return (
                  <div key={phase}>
                    {/* Phase header */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      marginBottom: 10,
                    }}>
                      <div style={{
                        height: 1, flex: 1, background: 'var(--border)',
                      }} />
                      <div style={{
                        fontSize: 11, fontWeight: 700,
                        color: colors.color,
                        background: colors.bg,
                        border: `1px solid ${colors.border}`,
                        padding: '3px 12px', borderRadius: 100,
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                        whiteSpace: 'nowrap',
                      }}>
                        {phase} · {weekRange}
                      </div>
                      <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                    </div>

                    {/* Task cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {phaseTasks.map(task => (
                        <div key={task.id} style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--r)',
                          padding: '12px 14px',
                          display: 'flex', gap: 12,
                        }}>
                          {/* Week badge */}
                          <div style={{
                            width: 44, height: 44, borderRadius: 'var(--r)',
                            background: colors.bg,
                            border: `1.5px solid ${colors.border}`,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                            fontSize: 9, fontWeight: 700,
                            color: colors.color, textTransform: 'uppercase',
                            lineHeight: 1.2,
                          }}>
                            <span>Wk</span>
                            <span style={{ fontSize: 14 }}>{task.week}</span>
                          </div>

                          {/* Task content */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                                {task.title}
                              </span>
                              <span style={{
                                fontSize: 10, fontWeight: 600,
                                padding: '2px 8px', borderRadius: 100,
                                background: 'var(--bg)', border: '1px solid var(--border)',
                                color: 'var(--text2)',
                                display: 'flex', alignItems: 'center', gap: 4,
                                whiteSpace: 'nowrap',
                              }}>
                                <i className={ROLE_ICON[task.assignedRole]} style={{ fontSize: 9 }} />
                                {task.assignedRole}
                              </span>
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--text3)', margin: 0, lineHeight: 1.5 }}>
                              {task.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer actions — only shown in result step */}
        {step === 'result' && (
          <div style={{
            borderTop: '1px solid var(--border)',
            padding: '16px 32px',
            display: 'flex', gap: 10, justifyContent: 'flex-end',
            flexShrink: 0, background: 'var(--surface)',
          }}>
            <button className="btn btn-outline btn-sm" onClick={handleRegenerate}>
              <i className="fa-solid fa-rotate" /> Regenerate
            </button>
            <button className="btn btn-primary btn-sm btn-glow" onClick={handleSave}>
              <i className="fa-solid fa-floppy-disk" /> Save as Template
            </button>
          </div>
        )}

        {/* Success toast */}
        {toast && (
          <div style={{
            position: 'absolute', bottom: 80, left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--green, #16a34a)', color: '#fff',
            padding: '10px 20px', borderRadius: 100,
            fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            whiteSpace: 'nowrap',
            animation: 'modalIn 0.3s var(--ease)',
          }}>
            <i className="fa-solid fa-check-circle" />
            Journey template saved!
          </div>
        )}
      </div>
    </div>
  )
}
