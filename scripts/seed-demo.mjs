/**
 * OnboardHero — Demo Seed Script
 *
 * BEFORE RUNNING:
 *   1. Open the Supabase SQL Editor (Dashboard > SQL Editor)
 *   2. Paste the contents of scripts/apply-migrations.sql and run it
 *   3. Then run this script: node scripts/seed-demo.mjs
 *
 * This script is idempotent — safe to run multiple times.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xtmxlwvxikhbhsuewbaw.supabase.co'
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0bXhsd3Z4aWtoYmhzdWV3YmF3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDMwMjY5MCwiZXhwIjoyMDg5ODc4NjkwfQ.iBqW68CqVvy5YsCUaBpgzQPGkINAq63jHeV2N5khmyo'

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── helpers ────────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function daysFromNow(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function weeksAgo(n) {
  return daysAgo(n * 7)
}

async function getOrCreateUser({ email, password, fullName, role, department, title }) {
  // Check if user already exists in profiles
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (existing) {
    console.log(`  ✓ User already exists: ${email} (${existing.id})`)
    // Update profile fields that may have been set incorrectly
    await admin
      .from('profiles')
      .update({ department, title })
      .eq('id', existing.id)
    return existing.id
  }

  // Create new auth user (trigger auto-creates profile)
  const { data: authData, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  })

  if (error) {
    console.error(`  ✗ Failed to create ${email}: ${error.message}`)
    return null
  }

  const uid = authData.user.id
  console.log(`  ✓ Created user: ${email} (${uid})`)

  // Update profile with department and title
  await admin
    .from('profiles')
    .update({ department, title })
    .eq('id', uid)

  return uid
}

async function getJourneyByEmployee(employeeId) {
  const { data } = await admin
    .from('journeys')
    .select('id, current_week, start_date, manager_id')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  return data
}

async function ensureJourney({ employeeId, managerId, templateId, startDate, currentWeek, riskScore, status }) {
  const existing = await getJourneyByEmployee(employeeId)
  if (existing) {
    // Update risk and week
    await admin
      .from('journeys')
      .update({ current_week: currentWeek, risk_score: riskScore, status, start_date: startDate })
      .eq('id', existing.id)
    console.log(`  ✓ Journey already exists for employee, updated: ${existing.id}`)
    return existing.id
  }

  const { data, error } = await admin
    .from('journeys')
    .insert({
      employee_id:  employeeId,
      manager_id:   managerId,
      template_id:  templateId,
      start_date:   startDate,
      current_week: currentWeek,
      risk_score:   riskScore,
      status,
    })
    .select('id')
    .single()

  if (error) {
    console.error(`  ✗ Failed to create journey: ${error.message}`)
    return null
  }

  console.log(`  ✓ Created journey: ${data.id}`)
  return data.id
}

async function seedTasks(journeyId, tasks) {
  // Delete and re-insert so seeding is idempotent
  await admin.from('journey_tasks').delete().eq('journey_id', journeyId)

  const rows = tasks.map(t => ({ journey_id: journeyId, ...t }))
  const { error } = await admin.from('journey_tasks').insert(rows)
  if (error) console.error(`  ✗ Tasks insert error: ${error.message}`)
  else console.log(`  ✓ Seeded ${rows.length} tasks`)
}

async function seedCheckIns(journeyId, managerId, checkIns) {
  await admin.from('check_ins').delete().eq('journey_id', journeyId)

  const rows = checkIns.map(c => ({ journey_id: journeyId, manager_id: managerId, ...c }))
  const { error } = await admin.from('check_ins').insert(rows)
  if (error) console.error(`  ✗ Check-ins insert error: ${error.message}`)
  else console.log(`  ✓ Seeded ${rows.length} check-ins`)
}

async function seedPulseChecks(journeyId, employeeId, pulses) {
  // Upsert on (employee_id, journey_id, week)
  for (const p of pulses) {
    await admin.from('pulse_checks').upsert(
      { journey_id: journeyId, employee_id: employeeId, ...p },
      { onConflict: 'employee_id,journey_id,week', ignoreDuplicates: false }
    )
  }
  console.log(`  ✓ Seeded ${pulses.length} pulse checks`)
}

async function seedGoals(journeyId, createdBy, goals) {
  await admin.from('journey_goals').delete().eq('journey_id', journeyId)

  const rows = goals.map(g => ({ journey_id: journeyId, created_by: createdBy, ...g }))
  const { error } = await admin.from('journey_goals').insert(rows)
  if (error) console.error(`  ✗ Goals insert error: ${error.message}`)
  else console.log(`  ✓ Seeded ${rows.length} goals`)
}

async function seedActionLog(journeyId, entries) {
  await admin.from('action_log').delete().eq('journey_id', journeyId)

  const rows = entries.map(e => ({ journey_id: journeyId, ...e }))
  const { error } = await admin.from('action_log').insert(rows)
  if (error) console.error(`  ✗ Action log insert error: ${error.message}`)
  else console.log(`  ✓ Seeded ${rows.length} action log entries`)
}

async function seedManagerNotes(journeyId, managerId, notes) {
  await admin.from('manager_notes').delete().eq('journey_id', journeyId)

  const rows = notes.map(n => ({ journey_id: journeyId, manager_id: managerId, ...n }))
  const { error } = await admin.from('manager_notes').insert(rows)
  if (error) {
    if (error.code === '42P01') console.log(`  ℹ  manager_notes table not found — skipping (run apply-migrations.sql first)`)
    else console.error(`  ✗ Manager notes error: ${error.message}`)
  } else {
    console.log(`  ✓ Seeded ${rows.length} manager notes`)
  }
}

// ─── task templates per role ────────────────────────────────

function engineeringTasks(weeks = 4) {
  const base = [
    { week: 1, title: 'Set up local development environment', description: 'Install all required tools, clone the repo, and get the app running locally.', assigned_to_role: 'new_hire', status: 'completed' },
    { week: 1, title: 'Complete security & compliance training', description: 'Finish mandatory security modules and sign the data handling agreement.', assigned_to_role: 'new_hire', status: 'completed' },
    { week: 1, title: 'Schedule 1:1 with direct manager', description: 'Book a recurring 30-min weekly slot with your manager.', assigned_to_role: 'new_hire', status: 'completed' },
    { week: 2, title: 'Read architecture documentation', description: 'Review the system design docs and understand the core data flows.', assigned_to_role: 'new_hire', status: 'completed' },
    { week: 2, title: 'Fix your first bug from the backlog', description: 'Pick a "good first issue" ticket and submit a pull request.', assigned_to_role: 'new_hire', status: 'completed' },
    { week: 2, title: 'Meet with QA team', description: 'Understand the testing strategy and tools used by the team.', assigned_to_role: 'new_hire', status: 'completed' },
    { week: 3, title: 'Review deployment pipeline', description: 'Shadow a deploy and understand CI/CD workflow from PR to production.', assigned_to_role: 'new_hire', status: weeks >= 3 ? 'completed' : 'pending' },
    { week: 3, title: 'Pair with senior engineer on feature', description: 'Co-develop a new feature end-to-end with your onboarding buddy.', assigned_to_role: 'new_hire', status: weeks >= 3 ? 'completed' : 'pending' },
    { week: 4, title: 'Lead a ticket from spec to merge', description: 'Independently scope, implement, and ship a small feature.', assigned_to_role: 'new_hire', status: weeks >= 5 ? 'completed' : 'in_progress' },
    { week: 4, title: 'Present work at team standup', description: 'Walk through your recent contributions in the next team meeting.', assigned_to_role: 'new_hire', status: weeks >= 5 ? 'completed' : 'pending' },
    { week: 5, title: 'Propose a code quality improvement', description: 'Identify one area of technical debt and draft a brief proposal.', assigned_to_role: 'new_hire', status: weeks >= 6 ? 'completed' : 'pending' },
    { week: 5, title: 'Complete 30-day self-assessment', description: 'Fill in the 30-day reflection form shared by your manager.', assigned_to_role: 'new_hire', status: weeks >= 6 ? 'completed' : 'pending' },
  ]
  return base
}

function marketingTasks() {
  return [
    { week: 1, title: 'Attend brand & messaging workshop', description: 'Understand the company voice and key positioning statements.', assigned_to_role: 'new_hire', status: 'completed' },
    { week: 1, title: 'Set up marketing tools (HubSpot, GA4)', description: 'Get access and initial training on the core marketing stack.', assigned_to_role: 'new_hire', status: 'completed' },
    { week: 2, title: 'Shadow three customer calls', description: 'Listen in on sales demos and discovery calls to understand the buyer.', assigned_to_role: 'new_hire', status: 'completed' },
    { week: 2, title: 'Draft first social media post', description: 'Write a LinkedIn post for the brand page and get it reviewed by your lead.', assigned_to_role: 'new_hire', status: 'in_progress' },
    { week: 3, title: 'Audit one existing campaign', description: 'Review performance data for a recent campaign and summarise findings.', assigned_to_role: 'new_hire', status: 'pending' },
    { week: 3, title: 'Meet with product marketing team', description: 'Align on the upcoming launch roadmap and your role in it.', assigned_to_role: 'new_hire', status: 'pending' },
    { week: 4, title: 'Pitch a content idea for next quarter', description: 'Bring three content concepts to your manager for the Q3 calendar.', assigned_to_role: 'new_hire', status: 'pending' },
  ]
}

function designTasks(completedUpToWeek = 11) {
  const w = completedUpToWeek
  return [
    { week: 1, title: 'Access Figma, Storybook, and design system', description: 'Get set up with all design tools and review the component library.', assigned_to_role: 'new_hire', status: 'completed' },
    { week: 1, title: 'Review brand guidelines', description: 'Deep-dive into typography, colour tokens, spacing system, and icon sets.', assigned_to_role: 'new_hire', status: 'completed' },
    { week: 2, title: 'Shadow designer on live project', description: 'Observe a design critique session and the feedback loop with engineering.', assigned_to_role: 'new_hire', status: 'completed' },
    { week: 2, title: 'Redesign a single existing screen', description: 'Pick an existing UI screen and propose improvements in Figma.', assigned_to_role: 'new_hire', status: 'completed' },
    { week: 3, title: 'Run a 3-person usability test', description: 'Conduct and document a quick usability session on your redesigned screen.', assigned_to_role: 'new_hire', status: 'completed' },
    { week: 4, title: 'Contribute to component library', description: 'Add or refine one component with proper variants and documentation.', assigned_to_role: 'new_hire', status: 'completed' },
    { week: 5, title: 'Design end-to-end user flow', description: 'Map out a complete flow for a new feature from empty state to success.', assigned_to_role: 'new_hire', status: 'completed' },
    { week: 6, title: 'Present flow in design review', description: 'Walk the team through your work and incorporate feedback.', assigned_to_role: 'new_hire', status: 'completed' },
    { week: 7, title: 'Lead a design sprint day', description: 'Facilitate a one-day sprint session for an upcoming product challenge.', assigned_to_role: 'new_hire', status: 'completed' },
    { week: 8, title: 'Accessibility audit on core screens', description: 'Run an WCAG 2.1 AA audit on the three most-used screens.', assigned_to_role: 'new_hire', status: 'completed' },
    { week: 9, title: 'Ship design for feature milestone', description: 'Deliver final designs for the Q2 feature to engineering handoff.', assigned_to_role: 'new_hire', status: w >= 10 ? 'completed' : 'in_progress' },
    { week: 10, title: 'Write design decision doc', description: 'Document the key decisions made in your first 10 weeks.', assigned_to_role: 'new_hire', status: w >= 11 ? 'completed' : 'in_progress' },
    { week: 11, title: 'Review with senior designer', description: 'Schedule a portfolio review to get feedback on your overall contribution.', assigned_to_role: 'new_hire', status: w >= 12 ? 'completed' : 'in_progress' },
    { week: 12, title: 'Propose process improvement', description: 'Present one idea to improve how design and eng collaborate.', assigned_to_role: 'new_hire', status: 'pending' },
  ]
}

// ─── main ────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 OnboardHero Demo Seed\n')

  // ── verify tables exist ──────────────────────────────────
  console.log('▶ Checking required tables...')
  const tableChecks = await Promise.all([
    admin.from('pulse_checks').select('id').limit(1),
    admin.from('action_log').select('id').limit(1),
    admin.from('journey_goals').select('id').limit(1),
  ])
  const missing = ['pulse_checks', 'action_log', 'journey_goals'].filter(
    (_, i) => tableChecks[i].error?.code === 'PGRST205'
  )
  if (missing.length > 0) {
    console.error(`\n❌ Missing tables: ${missing.join(', ')}`)
    console.error('\n   Apply migrations first using ONE of these methods:\n')
    console.error('   A) Supabase SQL Editor (quickest — paste & click Run):')
    console.error('      https://supabase.com/dashboard/project/xtmxlwvxikhbhsuewbaw/sql')
    console.error('      → Paste the contents of scripts/apply-migrations.sql\n')
    console.error('   B) CLI (if you have a Supabase access token):')
    console.error('      node scripts/migrate.mjs --token=YOUR_TOKEN')
    console.error('      (get token at https://supabase.com/dashboard/account/tokens)\n')
    process.exit(1)
  }
  console.log('  ✓ All required tables found\n')

  // ── look up existing demo users ──────────────────────────
  console.log('▶ Looking up existing demo users...')
  const { data: existingProfiles } = await admin
    .from('profiles')
    .select('id, email, role, full_name')
    .in('role', ['hr', 'manager'])
    .order('created_at')

  const hrUser     = existingProfiles?.find(p => p.role === 'hr')
  const managerUser = existingProfiles?.find(p => p.role === 'manager')

  if (!hrUser || !managerUser) {
    console.error('❌ Could not find existing HR and Manager profiles in the database.')
    console.error('   Make sure you have at least one HR and one Manager profile before seeding.\n')
    process.exit(1)
  }

  console.log(`  ✓ HR:      ${hrUser.full_name} (${hrUser.id})`)
  console.log(`  ✓ Manager: ${managerUser.full_name} (${managerUser.id})`)

  // ── look up Sofia (existing new hire) ────────────────────
  const { data: sofiaProfile } = await admin
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'new_hire')
    .order('created_at')
    .limit(1)
    .single()

  if (!sofiaProfile) {
    console.error('❌ No new_hire profile found. Please create the main demo user first.\n')
    process.exit(1)
  }

  console.log(`  ✓ New hire: ${sofiaProfile.full_name} (${sofiaProfile.id})\n`)

  // ── get a template ID ────────────────────────────────────
  const { data: templates } = await admin
    .from('journey_templates')
    .select('id, name')
    .limit(1)
    .single()

  if (!templates) {
    console.error('❌ No journey templates found in the database.\n')
    process.exit(1)
  }
  const templateId = templates.id
  console.log(`▶ Using template: "${templates.name}" (${templateId})\n`)

  // ── create new demo users ────────────────────────────────
  console.log('▶ Creating demo users...')
  const luciaId = await getOrCreateUser({
    email:      'lucia.fernandez@onboardhero.dev',
    password:   'Demo1234!',
    fullName:   'Lucía Fernández',
    role:       'new_hire',
    department: 'Marketing',
    title:      'Marketing Coordinator',
  })

  const andresId = await getOrCreateUser({
    email:      'andres.ruiz@onboardhero.dev',
    password:   'Demo1234!',
    fullName:   'Andrés Ruiz',
    role:       'new_hire',
    department: 'Engineering',
    title:      'Software Engineer',
  })

  const isabelId = await getOrCreateUser({
    email:      'isabel.chen@onboardhero.dev',
    password:   'Demo1234!',
    fullName:   'Isabel Chen',
    role:       'new_hire',
    department: 'Design',
    title:      'Product Designer',
  })

  const lauraId = await getOrCreateUser({
    email:      'laura.martinez@onboardhero.dev',
    password:   'Demo1234!',
    fullName:   'Laura Martínez',
    role:       'manager',
    department: 'Marketing',
    title:      'Marketing Manager',
  })

  console.log()

  // ── ensure journeys ──────────────────────────────────────
  console.log('▶ Creating journeys...')

  // Sofía: existing journey — update risk/week
  const sofiaJourneyId = await ensureJourney({
    employeeId:  sofiaProfile.id,
    managerId:   managerUser.id,
    templateId,
    startDate:   daysAgo(28),
    currentWeek: 4,
    riskScore:   25,
    status:      'in_progress',
  })

  const luciaJourneyId = luciaId && await ensureJourney({
    employeeId:  luciaId,
    managerId:   lauraId ?? managerUser.id,
    templateId,
    startDate:   daysAgo(14),
    currentWeek: 2,
    riskScore:   8,
    status:      'in_progress',
  })

  const andresJourneyId = andresId && await ensureJourney({
    employeeId:  andresId,
    managerId:   managerUser.id,
    templateId,
    startDate:   daysAgo(42),
    currentWeek: 6,
    riskScore:   74,
    status:      'at_risk',
  })

  const isabelJourneyId = isabelId && await ensureJourney({
    employeeId:  isabelId,
    managerId:   lauraId ?? managerUser.id,
    templateId,
    startDate:   daysAgo(77),
    currentWeek: 11,
    riskScore:   12,
    status:      'in_progress',
  })

  console.log()

  // ── seed tasks ────────────────────────────────────────────
  console.log('▶ Seeding journey tasks...')

  if (sofiaJourneyId) {
    await seedTasks(sofiaJourneyId, engineeringTasks(4))
  }
  if (luciaJourneyId) {
    await seedTasks(luciaJourneyId, marketingTasks())
  }
  if (andresJourneyId) {
    await seedTasks(andresJourneyId, engineeringTasks(6))
  }
  if (isabelJourneyId) {
    await seedTasks(isabelJourneyId, designTasks(11))
  }

  console.log()

  // ── seed check-ins ────────────────────────────────────────
  console.log('▶ Seeding check-ins...')

  if (sofiaJourneyId) {
    await seedCheckIns(sofiaJourneyId, managerUser.id, [
      { milestone: 'day_7',  scheduled_date: daysAgo(21), completed_date: daysAgo(21), notes: 'Great energy in week 1. Dev environment set up without issues. Eager to jump into codebase.', manager_notes: 'Sofía arrived extremely well-prepared. She had already reviewed the codebase and came with thoughtful questions. Strong start — I\'m excited to see how she grows.', ai_summary: 'Strong start. High motivation, no blockers.' },
      { milestone: 'day_14', scheduled_date: daysAgo(14), completed_date: daysAgo(14), notes: 'First PR merged. Good instinct for code quality. Some questions about deployment process — covered in session.', manager_notes: 'Merged her first PR independently, without any hand-holding. The code quality was above what I\'d typically expect at this stage. Deployment pipeline was the only knowledge gap — clarified in this session.', ai_summary: 'Good technical progress. Deployment workflow clarified.' },
      { milestone: 'day_30', scheduled_date: daysFromNow(2),  completed_date: null },
      { milestone: 'day_60', scheduled_date: daysFromNow(32), completed_date: null },
      { milestone: 'day_90', scheduled_date: daysFromNow(62), completed_date: null },
    ])
  }

  if (luciaJourneyId) {
    await seedCheckIns(luciaJourneyId, lauraId ?? managerUser.id, [
      { milestone: 'day_7',  scheduled_date: daysAgo(7), completed_date: daysAgo(7), notes: 'Lucía joined with great enthusiasm. Brand workshop went really well — she had great questions.', ai_summary: 'Excellent cultural fit. High potential in content strategy.' },
      { milestone: 'day_14', scheduled_date: daysFromNow(0), completed_date: null },
      { milestone: 'day_30', scheduled_date: daysFromNow(16), completed_date: null },
      { milestone: 'day_60', scheduled_date: daysFromNow(46), completed_date: null },
      { milestone: 'day_90', scheduled_date: daysFromNow(76), completed_date: null },
    ])
  }

  if (andresJourneyId) {
    await seedCheckIns(andresJourneyId, managerUser.id, [
      { milestone: 'day_7',  scheduled_date: daysAgo(35), completed_date: daysAgo(35), notes: 'Week 1 went fine. Dev env took longer than expected — IT delay with Okta provisioning.', ai_summary: 'Minor access delays. Resolved by end of week.' },
      { milestone: 'day_14', scheduled_date: daysAgo(28), completed_date: daysAgo(28), notes: 'Andrés seems overwhelmed by the codebase complexity. Hasn\'t started his first PR yet. Need to check in more frequently.', ai_summary: 'Risk signal: behind on tasks. Additional support recommended.' },
      { milestone: 'day_30', scheduled_date: daysAgo(12), completed_date: daysAgo(12), notes: 'Difficult session. Andrés expressed confusion about his role scope and expectations. Action item: re-clarify job responsibilities document.', ai_summary: 'High churn risk. Role clarity intervention needed urgently.' },
      { milestone: 'day_60', scheduled_date: daysFromNow(18), completed_date: null },
      { milestone: 'day_90', scheduled_date: daysFromNow(48), completed_date: null },
    ])
  }

  if (isabelJourneyId) {
    await seedCheckIns(isabelJourneyId, lauraId ?? managerUser.id, [
      { milestone: 'day_7',  scheduled_date: daysAgo(70), completed_date: daysAgo(70), notes: 'Exceptional week 1. Isabel already contributing ideas to the design system.', ai_summary: 'Outstanding start. Fast learner.' },
      { milestone: 'day_14', scheduled_date: daysAgo(63), completed_date: daysAgo(63), notes: 'Redesigned the checkout flow — proposal approved by product. Will go to engineering next sprint.', ai_summary: 'Already shipping value. High confidence and autonomy.' },
      { milestone: 'day_30', scheduled_date: daysAgo(47), completed_date: daysAgo(47), notes: 'Usability test results were impressive. Isabel is already improving how we work with users.', ai_summary: 'Well above pace. Consider stretch goals for day 60.' },
      { milestone: 'day_60', scheduled_date: daysAgo(17), completed_date: daysAgo(17), notes: 'Led the design sprint successfully. Strong facilitator. Team gave very positive feedback.', ai_summary: 'Exceeding all expectations. High retention priority.' },
      { milestone: 'day_90', scheduled_date: daysFromNow(13), completed_date: null },
    ])
  }

  console.log()

  // ── seed pulse checks ────────────────────────────────────
  console.log('▶ Seeding pulse checks...')

  if (sofiaJourneyId) {
    await seedPulseChecks(sofiaJourneyId, sofiaProfile.id, [
      { week: 1, score: 3, question: 'How are you feeling about your onboarding this week?' },
      { week: 2, score: 4, question: 'How would you rate your sense of belonging and integration?' },
      { week: 3, score: 4, question: 'How clear are you on your role and expectations?' },
    ])
  }

  if (luciaId && luciaJourneyId) {
    await seedPulseChecks(luciaJourneyId, luciaId, [
      { week: 1, score: 5, question: 'How are you feeling about your onboarding this week?' },
    ])
  }

  if (andresId && andresJourneyId) {
    await seedPulseChecks(andresJourneyId, andresId, [
      { week: 1, score: 4, question: 'How are you feeling about your onboarding this week?' },
      { week: 2, score: 3, question: 'How would you rate your sense of belonging and integration?' },
      { week: 3, score: 2, question: 'How clear are you on your role and expectations?' },
      { week: 4, score: 2, question: 'How connected do you feel to your team this week?' },
      { week: 5, score: 1, question: 'How are you feeling about your overall progress?' },
    ])
  }

  if (isabelId && isabelJourneyId) {
    await seedPulseChecks(isabelJourneyId, isabelId, [
      { week: 1,  score: 4, question: 'How are you feeling about your onboarding this week?' },
      { week: 2,  score: 5, question: 'How would you rate your sense of belonging and integration?' },
      { week: 3,  score: 5, question: 'How clear are you on your role and expectations?' },
      { week: 4,  score: 4, question: 'How connected do you feel to your team this week?' },
      { week: 5,  score: 4, question: 'How are you feeling about your overall progress?' },
      { week: 6,  score: 5, question: 'How supported do you feel by your manager?' },
      { week: 7,  score: 5, question: 'How are you feeling about your growth opportunities?' },
      { week: 8,  score: 4, question: 'How would you rate the quality of your onboarding overall?' },
    ])
  }

  console.log()

  // ── seed goals ────────────────────────────────────────────
  console.log('▶ Seeding journey goals...')

  if (sofiaJourneyId) {
    await seedGoals(sofiaJourneyId, sofiaProfile.id, [
      // day_30
      { milestone: 'day_30', title: 'Set up full development environment', description: 'Dev tools, access, local build working end-to-end.', status: 'completed' },
      { milestone: 'day_30', title: 'Merge first pull request', description: 'Independently write, review, and ship code to the main branch.', status: 'completed' },
      { milestone: 'day_30', title: 'Shadow 2 sprint planning sessions', description: 'Understand how the team plans, estimates, and prioritises work.', status: 'completed' },
      // day_60
      { milestone: 'day_60', title: 'Own a feature from spec to production', description: 'Lead a full feature development cycle including design review, implementation, and deployment.', status: 'in_progress' },
      { milestone: 'day_60', title: 'Document one core system component', description: 'Write comprehensive docs for a part of the system you\'ve learned deeply.', status: 'not_started' },
      // day_90
      { milestone: 'day_90', title: 'Drive technical proposal for Q3 initiative', description: 'Research, propose, and align team on a technical approach for a meaningful Q3 project.', status: 'not_started' },
      { milestone: 'day_90', title: 'Complete 90-day review with manager', description: 'Formal review session covering strengths, growth areas, and 6-month goals.', status: 'not_started' },
    ])
  }

  if (luciaId && luciaJourneyId) {
    await seedGoals(luciaJourneyId, luciaId, [
      { milestone: 'day_30', title: 'Publish first brand social post', description: 'Draft, review, and publish a post that meets brand voice guidelines.', status: 'in_progress' },
      { milestone: 'day_30', title: 'Complete buyer persona deep-dive', description: 'Interview 3 customers and synthesise findings into a persona document.', status: 'not_started' },
    ])
  }

  if (andresId && andresJourneyId) {
    await seedGoals(andresJourneyId, andresId, [
      { milestone: 'day_30', title: 'Merge 3 PRs to the main codebase', description: 'Demonstrate ability to ship independently.', status: 'not_started' },
      { milestone: 'day_30', title: 'Clarify role scope with manager', description: 'Write and agree on a 90-day role clarity document.', status: 'not_started' },
      { milestone: 'day_60', title: 'Lead a sprint item end-to-end', description: 'Own a ticket from requirements through to production.', status: 'not_started' },
    ])
  }

  if (isabelId && isabelJourneyId) {
    await seedGoals(isabelJourneyId, isabelId, [
      // day_30 — all completed
      { milestone: 'day_30', title: 'Ship redesigned checkout flow', description: 'Final designs approved and delivered to engineering.', status: 'completed' },
      { milestone: 'day_30', title: 'Contribute a component to the design system', description: 'Add a new component with full variant coverage and documentation.', status: 'completed' },
      { milestone: 'day_30', title: 'Run first user testing session', description: 'Conduct 3-person usability test and present findings.', status: 'completed' },
      // day_60 — 2 completed, 1 in_progress
      { milestone: 'day_60', title: 'Lead a full design sprint', description: 'Facilitate a cross-functional design sprint for a product challenge.', status: 'completed' },
      { milestone: 'day_60', title: 'Deliver accessibility audit report', description: 'WCAG 2.1 AA audit with actionable fixes for the 3 core screens.', status: 'completed' },
      { milestone: 'day_60', title: 'Establish design–engineering handoff workflow', description: 'Document and socialise a new process for design handoffs.', status: 'in_progress' },
      // day_90 — in progress
      { milestone: 'day_90', title: 'Mentor junior designer in Q3', description: 'Take on an informal mentorship role for the newest design hire.', status: 'in_progress' },
      { milestone: 'day_90', title: 'Propose redesign for core product area', description: 'Propose a strategic redesign of the core product area with business case.', status: 'in_progress' },
    ])
  }

  console.log()

  // ── seed action log ───────────────────────────────────────
  console.log('▶ Seeding activity log...')

  if (sofiaJourneyId) {
    await seedActionLog(sofiaJourneyId, [
      { actor_id: sofiaProfile.id,  actor_role: 'hire',    action_type: 'task_completed',   label: 'Completed: Set up development environment',         created_at: new Date(Date.now() - 27 * 864e5).toISOString() },
      { actor_id: sofiaProfile.id,  actor_role: 'hire',    action_type: 'task_completed',   label: 'Completed: Security & compliance training',          created_at: new Date(Date.now() - 26 * 864e5).toISOString() },
      { actor_id: managerUser.id,   actor_role: 'manager', action_type: 'check_in_completed', label: 'Manager completed the Day 7 check-in',              created_at: new Date(Date.now() - 21 * 864e5).toISOString() },
      { actor_id: sofiaProfile.id,  actor_role: 'hire',    action_type: 'task_completed',   label: 'Completed: Read architecture documentation',         created_at: new Date(Date.now() - 18 * 864e5).toISOString() },
      { actor_id: sofiaProfile.id,  actor_role: 'hire',    action_type: 'task_completed',   label: 'Completed: Fix first bug from backlog',              created_at: new Date(Date.now() - 16 * 864e5).toISOString() },
      { actor_id: managerUser.id,   actor_role: 'manager', action_type: 'progress_reviewed', label: 'Manager reviewed your progress',                    created_at: new Date(Date.now() - 14 * 864e5).toISOString() },
      { actor_id: managerUser.id,   actor_role: 'manager', action_type: 'check_in_completed', label: 'Manager completed the Day 14 check-in',             created_at: new Date(Date.now() - 14 * 864e5).toISOString() },
      { actor_id: sofiaProfile.id,  actor_role: 'hire',    action_type: 'task_completed',   label: 'Completed: Review deployment pipeline',              created_at: new Date(Date.now() - 10 * 864e5).toISOString() },
      { actor_id: sofiaProfile.id,  actor_role: 'hire',    action_type: 'goal_added',       label: 'Added goal: Own a feature from spec to production', created_at: new Date(Date.now() -  7 * 864e5).toISOString() },
      { actor_id: managerUser.id,   actor_role: 'manager', action_type: 'nudge_sent',       label: 'Manager sent you a motivational nudge',             created_at: new Date(Date.now() -  3 * 864e5).toISOString() },
      { actor_id: managerUser.id,   actor_role: 'manager', action_type: 'check_in_scheduled', label: 'Manager scheduled the Day 30 check-in',           created_at: new Date(Date.now() -  1 * 864e5).toISOString() },
      { actor_id: sofiaProfile.id,  actor_role: 'hire',    action_type: 'task_completed',   label: 'Completed: Pair with senior engineer on feature',    created_at: new Date(Date.now() -  0.5 * 864e5).toISOString() },
    ])
  }

  if (luciaId && luciaJourneyId) {
    await seedActionLog(luciaJourneyId, [
      { actor_id: luciaId,                    actor_role: 'hire',    action_type: 'task_completed',    label: 'Completed: Attend brand & messaging workshop',   created_at: new Date(Date.now() - 13 * 864e5).toISOString() },
      { actor_id: luciaId,                    actor_role: 'hire',    action_type: 'task_completed',    label: 'Completed: Set up marketing tools (HubSpot, GA4)', created_at: new Date(Date.now() - 12 * 864e5).toISOString() },
      { actor_id: lauraId ?? managerUser.id,  actor_role: 'manager', action_type: 'check_in_completed', label: 'Manager completed the Day 7 check-in',           created_at: new Date(Date.now() -  7 * 864e5).toISOString() },
      { actor_id: luciaId,                    actor_role: 'hire',    action_type: 'task_completed',    label: 'Completed: Shadow three customer calls',          created_at: new Date(Date.now() -  5 * 864e5).toISOString() },
      { actor_id: lauraId ?? managerUser.id,  actor_role: 'manager', action_type: 'progress_reviewed', label: 'Manager reviewed your progress',                  created_at: new Date(Date.now() -  2 * 864e5).toISOString() },
    ])
  }

  if (andresId && andresJourneyId) {
    await seedActionLog(andresJourneyId, [
      { actor_id: andresId,        actor_role: 'hire',    action_type: 'task_completed',    label: 'Completed: Set up development environment (delayed)', created_at: new Date(Date.now() - 40 * 864e5).toISOString() },
      { actor_id: managerUser.id,  actor_role: 'manager', action_type: 'check_in_completed', label: 'Manager completed the Day 7 check-in',               created_at: new Date(Date.now() - 35 * 864e5).toISOString() },
      { actor_id: managerUser.id,  actor_role: 'manager', action_type: 'check_in_completed', label: 'Manager completed the Day 14 check-in',              created_at: new Date(Date.now() - 28 * 864e5).toISOString() },
      { actor_id: andresId,        actor_role: 'hire',    action_type: 'friction_reported',  label: 'Reported friction: Unclear role expectations',        created_at: new Date(Date.now() - 25 * 864e5).toISOString() },
      { actor_id: managerUser.id,  actor_role: 'manager', action_type: 'nudge_sent',         label: 'Manager sent you a support message',                  created_at: new Date(Date.now() - 20 * 864e5).toISOString() },
      { actor_id: andresId,        actor_role: 'hire',    action_type: 'friction_reported',  label: 'Reported friction: Missing access to key systems',    created_at: new Date(Date.now() - 18 * 864e5).toISOString() },
      { actor_id: managerUser.id,  actor_role: 'manager', action_type: 'progress_reviewed',  label: 'Manager reviewed your progress',                      created_at: new Date(Date.now() - 15 * 864e5).toISOString() },
      { actor_id: managerUser.id,  actor_role: 'manager', action_type: 'check_in_completed', label: 'Manager completed the Day 30 check-in',              created_at: new Date(Date.now() - 12 * 864e5).toISOString() },
      { actor_id: andresId,        actor_role: 'hire',    action_type: 'task_completed',     label: 'Completed: Read architecture documentation',          created_at: new Date(Date.now() -  8 * 864e5).toISOString() },
      { actor_id: managerUser.id,  actor_role: 'manager', action_type: 'check_in_scheduled', label: 'Manager scheduled a support session',                 created_at: new Date(Date.now() -  3 * 864e5).toISOString() },
    ])
  }

  if (isabelId && isabelJourneyId) {
    await seedActionLog(isabelJourneyId, [
      { actor_id: isabelId,                   actor_role: 'hire',    action_type: 'task_completed',      label: 'Completed: Access Figma and design system',              created_at: new Date(Date.now() - 76 * 864e5).toISOString() },
      { actor_id: isabelId,                   actor_role: 'hire',    action_type: 'task_completed',      label: 'Completed: Review brand guidelines',                     created_at: new Date(Date.now() - 75 * 864e5).toISOString() },
      { actor_id: lauraId ?? managerUser.id,  actor_role: 'manager', action_type: 'check_in_completed',  label: 'Manager completed the Day 7 check-in',                   created_at: new Date(Date.now() - 70 * 864e5).toISOString() },
      { actor_id: isabelId,                   actor_role: 'hire',    action_type: 'task_completed',      label: 'Completed: Redesign a single existing screen',           created_at: new Date(Date.now() - 66 * 864e5).toISOString() },
      { actor_id: isabelId,                   actor_role: 'hire',    action_type: 'goal_added',          label: 'Added goal: Ship redesigned checkout flow',              created_at: new Date(Date.now() - 64 * 864e5).toISOString() },
      { actor_id: lauraId ?? managerUser.id,  actor_role: 'manager', action_type: 'check_in_completed',  label: 'Manager completed the Day 14 check-in',                  created_at: new Date(Date.now() - 63 * 864e5).toISOString() },
      { actor_id: isabelId,                   actor_role: 'hire',    action_type: 'task_completed',      label: 'Completed: Run usability test',                          created_at: new Date(Date.now() - 56 * 864e5).toISOString() },
      { actor_id: lauraId ?? managerUser.id,  actor_role: 'manager', action_type: 'ai_suggestion_accepted', label: 'Manager accepted AI suggestion for your sprint plan', created_at: new Date(Date.now() - 50 * 864e5).toISOString() },
      { actor_id: lauraId ?? managerUser.id,  actor_role: 'manager', action_type: 'check_in_completed',  label: 'Manager completed the Day 30 check-in',                  created_at: new Date(Date.now() - 47 * 864e5).toISOString() },
      { actor_id: isabelId,                   actor_role: 'hire',    action_type: 'goal_status_changed', label: 'Updated goal status: Ship checkout flow → Completed',    created_at: new Date(Date.now() - 44 * 864e5).toISOString() },
      { actor_id: isabelId,                   actor_role: 'hire',    action_type: 'task_completed',      label: 'Completed: Lead a design sprint day',                    created_at: new Date(Date.now() - 28 * 864e5).toISOString() },
      { actor_id: lauraId ?? managerUser.id,  actor_role: 'manager', action_type: 'check_in_completed',  label: 'Manager completed the Day 60 check-in',                  created_at: new Date(Date.now() - 17 * 864e5).toISOString() },
      { actor_id: isabelId,                   actor_role: 'hire',    action_type: 'task_completed',      label: 'Completed: Accessibility audit on core screens',         created_at: new Date(Date.now() - 12 * 864e5).toISOString() },
      { actor_id: lauraId ?? managerUser.id,  actor_role: 'manager', action_type: 'progress_reviewed',   label: 'Manager reviewed your progress',                         created_at: new Date(Date.now() -  4 * 864e5).toISOString() },
    ])
  }

  console.log()

  // ── seed manager notes ───────────────────────────────────
  console.log('▶ Seeding manager notes...')

  if (sofiaJourneyId) {
    await seedManagerNotes(sofiaJourneyId, managerUser.id, [
      {
        source:    'positive',
        content:   'Sofía\'s technical ramp-up has been genuinely impressive. She merged her first PR in week 2 and has been asking all the right questions about system design. Keep this momentum going!',
        created_at: new Date(Date.now() - 14 * 864e5).toISOString(),
      },
      {
        source:    'constructive',
        content:   'I\'d love to see more proactive communication in standup. Don\'t wait to be asked — share what you\'re working on and flag blockers early. Your instincts are good; trust them more.',
        created_at: new Date(Date.now() -  7 * 864e5).toISOString(),
      },
    ])
  }

  console.log()
  console.log('✅ Demo seed complete!\n')
  console.log('Demo accounts:')
  console.log('  Sofía Ramírez (New Hire, week 4) — existing account')
  if (luciaId)  console.log('  Lucía Fernández (New Hire, week 2, Marketing) — lucia.fernandez@onboardhero.dev / Demo1234!')
  if (andresId) console.log('  Andrés Ruiz (New Hire, week 6, at-risk) — andres.ruiz@onboardhero.dev / Demo1234!')
  if (isabelId) console.log('  Isabel Chen (New Hire, week 11, Design) — isabel.chen@onboardhero.dev / Demo1234!')
  if (lauraId)  console.log('  Laura Martínez (Manager, Marketing) — laura.martinez@onboardhero.dev / Demo1234!')
  console.log()
}

main().catch(err => {
  console.error('\n❌ Seed failed:', err.message)
  process.exit(1)
})
