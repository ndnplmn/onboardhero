-- ============================================
-- OnboardHero — Demo Seed Data
-- ============================================
-- This file inserts realistic demo data for local development and demos.
-- All UUIDs are deterministic so the seed is idempotent.
-- Run after schema.sql has been applied.
--
-- Date arithmetic uses CURRENT_DATE so the data stays realistic
-- regardless of when you seed. Marcus started ~4 weeks ago,
-- Sarah ~2 weeks ago, Priya ~7 weeks ago.
-- ============================================

BEGIN;

-- ============================================
-- 1. Profiles (6 demo users)
-- ============================================
-- We insert directly into profiles because there are no matching
-- auth.users rows in a local seed scenario. The FK to auth.users
-- is skipped by temporarily disabling the constraint or by ensuring
-- the dev environment does not enforce it (supabase local dev).

INSERT INTO profiles (id, email, full_name, role, department) VALUES
  ('a1a1a1a1-1111-4111-a111-111111111111', 'alex@onboardhero.demo',   'Alex Johnson',  'hr',       'Human Resources'),
  ('b2b2b2b2-2222-4222-b222-222222222222', 'sophie@onboardhero.demo', 'Sophie Turner', 'manager',  'Strategy & Operations'),
  ('c3c3c3c3-3333-4333-c333-333333333333', 'daniel@onboardhero.demo', 'Daniel Park',   'manager',  'Design'),
  ('d4d4d4d4-4444-4444-d444-444444444444', 'marcus@onboardhero.demo', 'Marcus Reed',   'new_hire', 'Strategy & Operations'),
  ('e5e5e5e5-5555-4555-e555-555555555555', 'sarah@onboardhero.demo',  'Sarah Kim',     'new_hire', 'Design'),
  ('f6f6f6f6-6666-4666-f666-666666666666', 'priya@onboardhero.demo',  'Priya Mehta',   'new_hire', 'Strategy & Operations')
ON CONFLICT (id) DO NOTHING;


-- ============================================
-- 2. Journey Templates
-- ============================================

INSERT INTO journey_templates (id, name, description, role_type, department, duration_days, created_by) VALUES
  ('aaa00001-0001-4001-a001-000000000001',
   'Strategy Analyst Onboarding',
   'Comprehensive 90-day onboarding programme for new analysts joining the Strategy & Operations team. Covers company orientation, product deep-dives, first contributions, and ramp to full ownership.',
   'Junior Business Analyst',
   'Strategy & Operations',
   90,
   'a1a1a1a1-1111-4111-a111-111111111111'),
  ('aaa00002-0002-4002-a002-000000000002',
   'Product Designer Onboarding',
   '90-day onboarding programme for designers joining the Product Design team. Covers design system familiarisation, tool setup, first design critiques, and independent project delivery.',
   'Product Designer',
   'Design',
   90,
   'a1a1a1a1-1111-4111-a111-111111111111')
ON CONFLICT (id) DO NOTHING;


-- ============================================
-- 3. Template Tasks — Strategy Analyst (20 tasks)
-- ============================================

INSERT INTO template_tasks (id, template_id, title, description, week, assigned_to_role, "order") VALUES
  -- Week 1: Welcome & Team Integration
  ('tt010001-0001-4001-b001-000000000001', 'aaa00001-0001-4001-a001-000000000001',
   'Watch company welcome presentation',
   'Watch the 45-minute company welcome video covering history, mission and culture.',
   1, 'new_hire', 1),
  ('tt010001-0001-4001-b001-000000000002', 'aaa00001-0001-4001-a001-000000000001',
   'Review mission, vision and values document',
   'Read the company values guide and be prepared to discuss in your first 1:1.',
   1, 'new_hire', 2),
  ('tt010001-0001-4001-b001-000000000003', 'aaa00001-0001-4001-a001-000000000001',
   'Meet your manager for intro meeting',
   'Attend the scheduled 1-hour introduction meeting with your direct manager.',
   1, 'new_hire', 3),
  ('tt010001-0001-4001-b001-000000000004', 'aaa00001-0001-4001-a001-000000000001',
   'Attend team introduction session',
   'Meet your immediate team members in a casual 45-minute session.',
   1, 'new_hire', 4),
  ('tt010001-0001-4001-b001-000000000005', 'aaa00001-0001-4001-a001-000000000001',
   'Confirm receipt of laptop and work equipment',
   'Verify all hardware is working and report any issues to IT.',
   1, 'new_hire', 5),
  ('tt010001-0001-4001-b001-000000000006', 'aaa00001-0001-4001-a001-000000000001',
   'Activate all corporate accounts and email',
   'Set up email, Teams, Jira, Confluence, and VPN credentials.',
   1, 'new_hire', 6),

  -- Week 2: Product & Process Deep-Dive
  ('tt010001-0001-4001-b001-000000000007', 'aaa00001-0001-4001-a001-000000000001',
   'Complete product overview training module',
   'Finish the self-paced product overview course on the learning platform.',
   2, 'new_hire', 1),
  ('tt010001-0001-4001-b001-000000000008', 'aaa00001-0001-4001-a001-000000000001',
   'Shadow a full client engagement session',
   'Observe a live client meeting with a senior analyst and take notes.',
   2, 'new_hire', 2),
  ('tt010001-0001-4001-b001-000000000009', 'aaa00001-0001-4001-a001-000000000001',
   'Review Q1 strategy presentation',
   'Study the most recent quarterly strategy deck to understand current priorities.',
   2, 'new_hire', 3),
  ('tt010001-0001-4001-b001-000000000010', 'aaa00001-0001-4001-a001-000000000001',
   'Complete data tools onboarding (Excel, Tableau)',
   'Finish the data tools training module and submit the practice exercise.',
   2, 'new_hire', 4),

  -- Week 3: First Contributions
  ('tt010001-0001-4001-b001-000000000011', 'aaa00001-0001-4001-a001-000000000001',
   'Pick up your first assigned project task',
   'Accept your first Jira ticket and begin working on the assigned analysis.',
   3, 'new_hire', 1),
  ('tt010001-0001-4001-b001-000000000012', 'aaa00001-0001-4001-a001-000000000001',
   'Contribute to the weekly team standup',
   'Share your progress and blockers in the Monday standup meeting.',
   3, 'new_hire', 2),
  ('tt010001-0001-4001-b001-000000000013', 'aaa00001-0001-4001-a001-000000000001',
   'Submit first work output for feedback',
   'Send your first analysis deliverable to your manager for review.',
   3, 'new_hire', 3),

  -- Week 4: 30-Day Check-In
  ('tt010001-0001-4001-b001-000000000014', 'aaa00001-0001-4001-a001-000000000001',
   'Prepare 30-day self-reflection notes',
   'Write a 1-page reflection on your first month covering wins, challenges, and questions.',
   4, 'new_hire', 1),
  ('tt010001-0001-4001-b001-000000000015', 'aaa00001-0001-4001-a001-000000000001',
   'Complete 30-day review meeting with manager',
   'Attend the formal 30-day review and discuss your progress and goals.',
   4, 'new_hire', 2),
  ('tt010001-0001-4001-b001-000000000016', 'aaa00001-0001-4001-a001-000000000001',
   'Submit onboarding experience survey',
   'Complete the anonymous onboarding feedback survey sent by HR.',
   4, 'new_hire', 3),

  -- Week 5-6: Ownership & Deepening (Month 2 start)
  ('tt010001-0001-4001-b001-000000000017', 'aaa00001-0001-4001-a001-000000000001',
   'Take ownership of an ongoing project stream',
   'Assume primary responsibility for at least one active workstream.',
   5, 'new_hire', 1),
  ('tt010001-0001-4001-b001-000000000018', 'aaa00001-0001-4001-a001-000000000001',
   'Deliver a presentation to the team',
   'Present your project findings or a topic of interest in a team meeting.',
   6, 'new_hire', 1),

  -- Week 7-9: Mid-point — deeper responsibilities
  ('tt010001-0001-4001-b001-000000000019', 'aaa00001-0001-4001-a001-000000000001',
   'Complete advanced data training module',
   'Finish the advanced analytics course covering regression and forecasting.',
   7, 'new_hire', 1),
  ('tt010001-0001-4001-b001-000000000020', 'aaa00001-0001-4001-a001-000000000001',
   'Build relationships with 2 cross-functional contacts',
   'Schedule informal coffee chats with stakeholders outside your team.',
   8, 'new_hire', 1),

  -- Week 10-12: Final review & independence
  ('tt010001-0001-4001-b001-000000000021', 'aaa00001-0001-4001-a001-000000000001',
   'Prepare 90-day review presentation',
   'Create a presentation summarising your achievements, learnings, and next steps.',
   10, 'new_hire', 1),
  ('tt010001-0001-4001-b001-000000000022', 'aaa00001-0001-4001-a001-000000000001',
   'Complete 90-day review with manager and HR',
   'Attend the formal 90-day review with your manager and HR partner.',
   11, 'new_hire', 1),
  ('tt010001-0001-4001-b001-000000000023', 'aaa00001-0001-4001-a001-000000000001',
   'Set full-year performance objectives',
   'Collaborate with your manager to define annual goals and key results.',
   11, 'new_hire', 2),
  ('tt010001-0001-4001-b001-000000000024', 'aaa00001-0001-4001-a001-000000000001',
   'Submit final onboarding completion survey',
   'Complete the end-of-onboarding feedback form to help improve the programme.',
   12, 'new_hire', 1)
ON CONFLICT (id) DO NOTHING;


-- ============================================
-- 3b. Template Tasks — Product Designer (18 tasks)
-- ============================================

INSERT INTO template_tasks (id, template_id, title, description, week, assigned_to_role, "order") VALUES
  -- Week 1
  ('tt020001-0001-4001-b001-000000000001', 'aaa00002-0002-4002-a002-000000000002',
   'Watch company welcome presentation',
   'Watch the 45-minute company welcome video covering history, mission and culture.',
   1, 'new_hire', 1),
  ('tt020001-0001-4001-b001-000000000002', 'aaa00002-0002-4002-a002-000000000002',
   'Set up Figma and design tool accounts',
   'Install Figma, request access to the team workspace, and configure plugins.',
   1, 'new_hire', 2),
  ('tt020001-0001-4001-b001-000000000003', 'aaa00002-0002-4002-a002-000000000002',
   'Meet your manager for intro meeting',
   'Attend the scheduled 1-hour introduction meeting with your design lead.',
   1, 'new_hire', 3),
  ('tt020001-0001-4001-b001-000000000004', 'aaa00002-0002-4002-a002-000000000002',
   'Review the design system documentation',
   'Familiarise yourself with the component library, tokens, and guidelines.',
   1, 'new_hire', 4),
  ('tt020001-0001-4001-b001-000000000005', 'aaa00002-0002-4002-a002-000000000002',
   'Attend team introduction session',
   'Meet the design team members in a casual 45-minute session.',
   1, 'new_hire', 5),

  -- Week 2
  ('tt020001-0001-4001-b001-000000000006', 'aaa00002-0002-4002-a002-000000000002',
   'Complete UX research methods overview',
   'Finish the internal course on research methods used by the team.',
   2, 'new_hire', 1),
  ('tt020001-0001-4001-b001-000000000007', 'aaa00002-0002-4002-a002-000000000002',
   'Shadow a design critique session',
   'Observe a team design critique and take notes on the feedback process.',
   2, 'new_hire', 2),
  ('tt020001-0001-4001-b001-000000000008', 'aaa00002-0002-4002-a002-000000000002',
   'Review current product design patterns',
   'Study the existing product screens and document patterns you observe.',
   2, 'new_hire', 3),

  -- Week 3
  ('tt020001-0001-4001-b001-000000000009', 'aaa00002-0002-4002-a002-000000000002',
   'Pick up your first design ticket',
   'Accept a small UI task from the backlog and begin your first design work.',
   3, 'new_hire', 1),
  ('tt020001-0001-4001-b001-000000000010', 'aaa00002-0002-4002-a002-000000000002',
   'Present first design work in critique',
   'Share your initial design work with the team for feedback.',
   3, 'new_hire', 2),

  -- Week 4
  ('tt020001-0001-4001-b001-000000000011', 'aaa00002-0002-4002-a002-000000000002',
   'Prepare 30-day self-reflection notes',
   'Write a reflection on your first month covering wins and areas to grow.',
   4, 'new_hire', 1),
  ('tt020001-0001-4001-b001-000000000012', 'aaa00002-0002-4002-a002-000000000002',
   'Complete 30-day review meeting with manager',
   'Attend the formal 30-day review and discuss your design progress.',
   4, 'new_hire', 2),

  -- Week 5-6
  ('tt020001-0001-4001-b001-000000000013', 'aaa00002-0002-4002-a002-000000000002',
   'Own a feature design end-to-end',
   'Take full ownership of a feature from research through to handoff.',
   5, 'new_hire', 1),
  ('tt020001-0001-4001-b001-000000000014', 'aaa00002-0002-4002-a002-000000000002',
   'Contribute a component to the design system',
   'Design and document a new reusable component for the shared library.',
   6, 'new_hire', 1),

  -- Week 7-9
  ('tt020001-0001-4001-b001-000000000015', 'aaa00002-0002-4002-a002-000000000002',
   'Conduct a usability test session',
   'Plan and run a moderated usability test with 3-5 participants.',
   7, 'new_hire', 1),
  ('tt020001-0001-4001-b001-000000000016', 'aaa00002-0002-4002-a002-000000000002',
   'Present usability findings to stakeholders',
   'Synthesise test results and present insights to the product team.',
   8, 'new_hire', 1),

  -- Week 10-12
  ('tt020001-0001-4001-b001-000000000017', 'aaa00002-0002-4002-a002-000000000002',
   'Prepare 90-day portfolio review',
   'Compile your onboarding work into a portfolio presentation.',
   10, 'new_hire', 1),
  ('tt020001-0001-4001-b001-000000000018', 'aaa00002-0002-4002-a002-000000000002',
   'Complete 90-day review with manager and HR',
   'Attend the formal 90-day review and set long-term design goals.',
   11, 'new_hire', 1)
ON CONFLICT (id) DO NOTHING;


-- ============================================
-- 4. Active Journeys
-- ============================================
-- Marcus: started ~4 weeks ago, week 4, in_progress, risk_score 25
-- Sarah:  started ~2 weeks ago, week 2, in_progress, risk_score 45
-- Priya:  started ~7 weeks ago, week 7, at_risk, risk_score 72

INSERT INTO journeys (id, employee_id, template_id, manager_id, status, start_date, current_week, risk_score, risk_reasons, sentiment_score) VALUES
  ('jjj00001-0001-4001-c001-000000000001',
   'd4d4d4d4-4444-4444-d444-444444444444',
   'aaa00001-0001-4001-a001-000000000001',
   'b2b2b2b2-2222-4222-b222-222222222222',
   'in_progress',
   CURRENT_DATE - INTERVAL '27 days',
   4, 25,
   '["1 task overdue from week 3"]'::jsonb,
   0.7),

  ('jjj00002-0002-4002-c002-000000000002',
   'e5e5e5e5-5555-4555-e555-555555555555',
   'aaa00002-0002-4002-a002-000000000002',
   'c3c3c3c3-3333-4333-c333-333333333333',
   'in_progress',
   CURRENT_DATE - INTERVAL '13 days',
   2, 45,
   '["Slow task completion in week 1", "Missed team intro session"]'::jsonb,
   0.5),

  ('jjj00003-0003-4003-c003-000000000003',
   'f6f6f6f6-6666-4666-f666-666666666666',
   'aaa00001-0001-4001-a001-000000000001',
   'b2b2b2b2-2222-4222-b222-222222222222',
   'at_risk',
   CURRENT_DATE - INTERVAL '48 days',
   7, 72,
   '["3 overdue tasks in weeks 6-7", "Missed 60-day check-in", "Low engagement score"]'::jsonb,
   0.3)
ON CONFLICT (id) DO NOTHING;


-- ============================================
-- 5. Journey Tasks
-- ============================================

-- ----- Marcus (week 4): weeks 1-3 mostly completed, week 4 in progress -----
INSERT INTO journey_tasks (id, journey_id, template_task_id, title, description, week, assigned_to_role, status, completed_at, notes) VALUES
  -- Week 1 — all completed
  ('jt-m-0001-0001-4001-d001-000000000001', 'jjj00001-0001-4001-c001-000000000001', 'tt010001-0001-4001-b001-000000000001',
   'Watch company welcome presentation', 'Watch the 45-minute company welcome video covering history, mission and culture.',
   1, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '26 days', NULL),
  ('jt-m-0001-0001-4001-d001-000000000002', 'jjj00001-0001-4001-c001-000000000001', 'tt010001-0001-4001-b001-000000000002',
   'Review mission, vision and values document', 'Read the company values guide and be prepared to discuss in your first 1:1.',
   1, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '26 days', NULL),
  ('jt-m-0001-0001-4001-d001-000000000003', 'jjj00001-0001-4001-c001-000000000001', 'tt010001-0001-4001-b001-000000000003',
   'Meet your manager for intro meeting', 'Attend the scheduled 1-hour introduction meeting with your direct manager.',
   1, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '25 days', NULL),
  ('jt-m-0001-0001-4001-d001-000000000004', 'jjj00001-0001-4001-c001-000000000001', 'tt010001-0001-4001-b001-000000000004',
   'Attend team introduction session', 'Meet your immediate team members in a casual 45-minute session.',
   1, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '24 days', NULL),
  ('jt-m-0001-0001-4001-d001-000000000005', 'jjj00001-0001-4001-c001-000000000001', 'tt010001-0001-4001-b001-000000000005',
   'Confirm receipt of laptop and work equipment', 'Verify all hardware is working and report any issues to IT.',
   1, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '26 days', NULL),
  ('jt-m-0001-0001-4001-d001-000000000006', 'jjj00001-0001-4001-c001-000000000001', 'tt010001-0001-4001-b001-000000000006',
   'Activate all corporate accounts and email', 'Set up email, Teams, Jira, Confluence, and VPN credentials.',
   1, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '25 days', NULL),

  -- Week 2 — all completed
  ('jt-m-0001-0001-4001-d001-000000000007', 'jjj00001-0001-4001-c001-000000000001', 'tt010001-0001-4001-b001-000000000007',
   'Complete product overview training module', 'Finish the self-paced product overview course on the learning platform.',
   2, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '18 days', NULL),
  ('jt-m-0001-0001-4001-d001-000000000008', 'jjj00001-0001-4001-c001-000000000001', 'tt010001-0001-4001-b001-000000000008',
   'Shadow a full client engagement session', 'Observe a live client meeting with a senior analyst and take notes.',
   2, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '17 days', NULL),
  ('jt-m-0001-0001-4001-d001-000000000009', 'jjj00001-0001-4001-c001-000000000001', 'tt010001-0001-4001-b001-000000000009',
   'Review Q1 strategy presentation', 'Study the most recent quarterly strategy deck to understand current priorities.',
   2, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '16 days', NULL),
  ('jt-m-0001-0001-4001-d001-000000000010', 'jjj00001-0001-4001-c001-000000000001', 'tt010001-0001-4001-b001-000000000010',
   'Complete data tools onboarding (Excel, Tableau)', 'Finish the data tools training module and submit the practice exercise.',
   2, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '15 days', NULL),

  -- Week 3 — mostly completed, 1 still in_progress
  ('jt-m-0001-0001-4001-d001-000000000011', 'jjj00001-0001-4001-c001-000000000001', 'tt010001-0001-4001-b001-000000000011',
   'Pick up your first assigned project task', 'Accept your first Jira ticket and begin working on the assigned analysis.',
   3, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '10 days', NULL),
  ('jt-m-0001-0001-4001-d001-000000000012', 'jjj00001-0001-4001-c001-000000000001', 'tt010001-0001-4001-b001-000000000012',
   'Contribute to the weekly team standup', 'Share your progress and blockers in the Monday standup meeting.',
   3, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '9 days', NULL),
  ('jt-m-0001-0001-4001-d001-000000000013', 'jjj00001-0001-4001-c001-000000000001', 'tt010001-0001-4001-b001-000000000013',
   'Submit first work output for feedback', 'Send your first analysis deliverable to your manager for review.',
   3, 'new_hire', 'in_progress', NULL, 'Draft completed, awaiting final review before submission.'),

  -- Week 4 — in progress
  ('jt-m-0001-0001-4001-d001-000000000014', 'jjj00001-0001-4001-c001-000000000001', 'tt010001-0001-4001-b001-000000000014',
   'Prepare 30-day self-reflection notes', 'Write a 1-page reflection on your first month covering wins, challenges, and questions.',
   4, 'new_hire', 'in_progress', NULL, NULL),
  ('jt-m-0001-0001-4001-d001-000000000015', 'jjj00001-0001-4001-c001-000000000001', 'tt010001-0001-4001-b001-000000000015',
   'Complete 30-day review meeting with manager', 'Attend the formal 30-day review and discuss your progress and goals.',
   4, 'new_hire', 'pending', NULL, NULL),
  ('jt-m-0001-0001-4001-d001-000000000016', 'jjj00001-0001-4001-c001-000000000001', 'tt010001-0001-4001-b001-000000000016',
   'Submit onboarding experience survey', 'Complete the anonymous onboarding feedback survey sent by HR.',
   4, 'new_hire', 'pending', NULL, NULL),

  -- Remaining weeks — pending
  ('jt-m-0001-0001-4001-d001-000000000017', 'jjj00001-0001-4001-c001-000000000001', 'tt010001-0001-4001-b001-000000000017',
   'Take ownership of an ongoing project stream', 'Assume primary responsibility for at least one active workstream.',
   5, 'new_hire', 'pending', NULL, NULL),
  ('jt-m-0001-0001-4001-d001-000000000018', 'jjj00001-0001-4001-c001-000000000001', 'tt010001-0001-4001-b001-000000000018',
   'Deliver a presentation to the team', 'Present your project findings or a topic of interest in a team meeting.',
   6, 'new_hire', 'pending', NULL, NULL),
  ('jt-m-0001-0001-4001-d001-000000000019', 'jjj00001-0001-4001-c001-000000000001', 'tt010001-0001-4001-b001-000000000019',
   'Complete advanced data training module', 'Finish the advanced analytics course covering regression and forecasting.',
   7, 'new_hire', 'pending', NULL, NULL),
  ('jt-m-0001-0001-4001-d001-000000000020', 'jjj00001-0001-4001-c001-000000000001', 'tt010001-0001-4001-b001-000000000020',
   'Build relationships with 2 cross-functional contacts', 'Schedule informal coffee chats with stakeholders outside your team.',
   8, 'new_hire', 'pending', NULL, NULL),
  ('jt-m-0001-0001-4001-d001-000000000021', 'jjj00001-0001-4001-c001-000000000001', 'tt010001-0001-4001-b001-000000000021',
   'Prepare 90-day review presentation', 'Create a presentation summarising your achievements, learnings, and next steps.',
   10, 'new_hire', 'pending', NULL, NULL),
  ('jt-m-0001-0001-4001-d001-000000000022', 'jjj00001-0001-4001-c001-000000000001', 'tt010001-0001-4001-b001-000000000022',
   'Complete 90-day review with manager and HR', 'Attend the formal 90-day review with your manager and HR partner.',
   11, 'new_hire', 'pending', NULL, NULL),
  ('jt-m-0001-0001-4001-d001-000000000023', 'jjj00001-0001-4001-c001-000000000001', 'tt010001-0001-4001-b001-000000000023',
   'Set full-year performance objectives', 'Collaborate with your manager to define annual goals and key results.',
   11, 'new_hire', 'pending', NULL, NULL),
  ('jt-m-0001-0001-4001-d001-000000000024', 'jjj00001-0001-4001-c001-000000000001', 'tt010001-0001-4001-b001-000000000024',
   'Submit final onboarding completion survey', 'Complete the end-of-onboarding feedback form to help improve the programme.',
   12, 'new_hire', 'pending', NULL, NULL)
ON CONFLICT (id) DO NOTHING;


-- ----- Sarah (week 2): week 1 mostly completed, week 2 just started -----
INSERT INTO journey_tasks (id, journey_id, template_task_id, title, description, week, assigned_to_role, status, completed_at, notes) VALUES
  -- Week 1 — mostly completed (1 skipped)
  ('jt-s-0001-0001-4001-d001-000000000001', 'jjj00002-0002-4002-c002-000000000002', 'tt020001-0001-4001-b001-000000000001',
   'Watch company welcome presentation', 'Watch the 45-minute company welcome video covering history, mission and culture.',
   1, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '12 days', NULL),
  ('jt-s-0001-0001-4001-d001-000000000002', 'jjj00002-0002-4002-c002-000000000002', 'tt020001-0001-4001-b001-000000000002',
   'Set up Figma and design tool accounts', 'Install Figma, request access to the team workspace, and configure plugins.',
   1, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '12 days', NULL),
  ('jt-s-0001-0001-4001-d001-000000000003', 'jjj00002-0002-4002-c002-000000000002', 'tt020001-0001-4001-b001-000000000003',
   'Meet your manager for intro meeting', 'Attend the scheduled 1-hour introduction meeting with your design lead.',
   1, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '11 days', NULL),
  ('jt-s-0001-0001-4001-d001-000000000004', 'jjj00002-0002-4002-c002-000000000002', 'tt020001-0001-4001-b001-000000000004',
   'Review the design system documentation', 'Familiarise yourself with the component library, tokens, and guidelines.',
   1, 'new_hire', 'in_progress', NULL, 'Started reading but has not finished the tokens section.'),
  ('jt-s-0001-0001-4001-d001-000000000005', 'jjj00002-0002-4002-c002-000000000002', 'tt020001-0001-4001-b001-000000000005',
   'Attend team introduction session', 'Meet the design team members in a casual 45-minute session.',
   1, 'new_hire', 'skipped', NULL, 'Was sick on the scheduled day; rescheduled to week 2.'),

  -- Week 2 — just started
  ('jt-s-0001-0001-4001-d001-000000000006', 'jjj00002-0002-4002-c002-000000000002', 'tt020001-0001-4001-b001-000000000006',
   'Complete UX research methods overview', 'Finish the internal course on research methods used by the team.',
   2, 'new_hire', 'in_progress', NULL, NULL),
  ('jt-s-0001-0001-4001-d001-000000000007', 'jjj00002-0002-4002-c002-000000000002', 'tt020001-0001-4001-b001-000000000007',
   'Shadow a design critique session', 'Observe a team design critique and take notes on the feedback process.',
   2, 'new_hire', 'pending', NULL, NULL),
  ('jt-s-0001-0001-4001-d001-000000000008', 'jjj00002-0002-4002-c002-000000000002', 'tt020001-0001-4001-b001-000000000008',
   'Review current product design patterns', 'Study the existing product screens and document patterns you observe.',
   2, 'new_hire', 'pending', NULL, NULL),

  -- Remaining weeks — pending
  ('jt-s-0001-0001-4001-d001-000000000009', 'jjj00002-0002-4002-c002-000000000002', 'tt020001-0001-4001-b001-000000000009',
   'Pick up your first design ticket', 'Accept a small UI task from the backlog and begin your first design work.',
   3, 'new_hire', 'pending', NULL, NULL),
  ('jt-s-0001-0001-4001-d001-000000000010', 'jjj00002-0002-4002-c002-000000000002', 'tt020001-0001-4001-b001-000000000010',
   'Present first design work in critique', 'Share your initial design work with the team for feedback.',
   3, 'new_hire', 'pending', NULL, NULL),
  ('jt-s-0001-0001-4001-d001-000000000011', 'jjj00002-0002-4002-c002-000000000002', 'tt020001-0001-4001-b001-000000000011',
   'Prepare 30-day self-reflection notes', 'Write a reflection on your first month covering wins and areas to grow.',
   4, 'new_hire', 'pending', NULL, NULL),
  ('jt-s-0001-0001-4001-d001-000000000012', 'jjj00002-0002-4002-c002-000000000002', 'tt020001-0001-4001-b001-000000000012',
   'Complete 30-day review meeting with manager', 'Attend the formal 30-day review and discuss your design progress.',
   4, 'new_hire', 'pending', NULL, NULL),
  ('jt-s-0001-0001-4001-d001-000000000013', 'jjj00002-0002-4002-c002-000000000002', 'tt020001-0001-4001-b001-000000000013',
   'Own a feature design end-to-end', 'Take full ownership of a feature from research through to handoff.',
   5, 'new_hire', 'pending', NULL, NULL),
  ('jt-s-0001-0001-4001-d001-000000000014', 'jjj00002-0002-4002-c002-000000000002', 'tt020001-0001-4001-b001-000000000014',
   'Contribute a component to the design system', 'Design and document a new reusable component for the shared library.',
   6, 'new_hire', 'pending', NULL, NULL),
  ('jt-s-0001-0001-4001-d001-000000000015', 'jjj00002-0002-4002-c002-000000000002', 'tt020001-0001-4001-b001-000000000015',
   'Conduct a usability test session', 'Plan and run a moderated usability test with 3-5 participants.',
   7, 'new_hire', 'pending', NULL, NULL),
  ('jt-s-0001-0001-4001-d001-000000000016', 'jjj00002-0002-4002-c002-000000000002', 'tt020001-0001-4001-b001-000000000016',
   'Present usability findings to stakeholders', 'Synthesise test results and present insights to the product team.',
   8, 'new_hire', 'pending', NULL, NULL),
  ('jt-s-0001-0001-4001-d001-000000000017', 'jjj00002-0002-4002-c002-000000000002', 'tt020001-0001-4001-b001-000000000017',
   'Prepare 90-day portfolio review', 'Compile your onboarding work into a portfolio presentation.',
   10, 'new_hire', 'pending', NULL, NULL),
  ('jt-s-0001-0001-4001-d001-000000000018', 'jjj00002-0002-4002-c002-000000000002', 'tt020001-0001-4001-b001-000000000018',
   'Complete 90-day review with manager and HR', 'Attend the formal 90-day review and set long-term design goals.',
   11, 'new_hire', 'pending', NULL, NULL)
ON CONFLICT (id) DO NOTHING;


-- ----- Priya (week 7): weeks 1-5 done, week 6-7 mostly pending (falling behind) -----
INSERT INTO journey_tasks (id, journey_id, template_task_id, title, description, week, assigned_to_role, status, completed_at, notes) VALUES
  -- Week 1 — all completed
  ('jt-p-0001-0001-4001-d001-000000000001', 'jjj00003-0003-4003-c003-000000000003', 'tt010001-0001-4001-b001-000000000001',
   'Watch company welcome presentation', 'Watch the 45-minute company welcome video covering history, mission and culture.',
   1, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '47 days', NULL),
  ('jt-p-0001-0001-4001-d001-000000000002', 'jjj00003-0003-4003-c003-000000000003', 'tt010001-0001-4001-b001-000000000002',
   'Review mission, vision and values document', 'Read the company values guide and be prepared to discuss in your first 1:1.',
   1, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '47 days', NULL),
  ('jt-p-0001-0001-4001-d001-000000000003', 'jjj00003-0003-4003-c003-000000000003', 'tt010001-0001-4001-b001-000000000003',
   'Meet your manager for intro meeting', 'Attend the scheduled 1-hour introduction meeting with your direct manager.',
   1, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '46 days', NULL),
  ('jt-p-0001-0001-4001-d001-000000000004', 'jjj00003-0003-4003-c003-000000000003', 'tt010001-0001-4001-b001-000000000004',
   'Attend team introduction session', 'Meet your immediate team members in a casual 45-minute session.',
   1, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '45 days', NULL),
  ('jt-p-0001-0001-4001-d001-000000000005', 'jjj00003-0003-4003-c003-000000000003', 'tt010001-0001-4001-b001-000000000005',
   'Confirm receipt of laptop and work equipment', 'Verify all hardware is working and report any issues to IT.',
   1, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '47 days', NULL),
  ('jt-p-0001-0001-4001-d001-000000000006', 'jjj00003-0003-4003-c003-000000000003', 'tt010001-0001-4001-b001-000000000006',
   'Activate all corporate accounts and email', 'Set up email, Teams, Jira, Confluence, and VPN credentials.',
   1, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '46 days', NULL),

  -- Week 2 — all completed
  ('jt-p-0001-0001-4001-d001-000000000007', 'jjj00003-0003-4003-c003-000000000003', 'tt010001-0001-4001-b001-000000000007',
   'Complete product overview training module', 'Finish the self-paced product overview course on the learning platform.',
   2, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '40 days', NULL),
  ('jt-p-0001-0001-4001-d001-000000000008', 'jjj00003-0003-4003-c003-000000000003', 'tt010001-0001-4001-b001-000000000008',
   'Shadow a full client engagement session', 'Observe a live client meeting with a senior analyst and take notes.',
   2, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '39 days', NULL),
  ('jt-p-0001-0001-4001-d001-000000000009', 'jjj00003-0003-4003-c003-000000000003', 'tt010001-0001-4001-b001-000000000009',
   'Review Q1 strategy presentation', 'Study the most recent quarterly strategy deck to understand current priorities.',
   2, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '38 days', NULL),
  ('jt-p-0001-0001-4001-d001-000000000010', 'jjj00003-0003-4003-c003-000000000003', 'tt010001-0001-4001-b001-000000000010',
   'Complete data tools onboarding (Excel, Tableau)', 'Finish the data tools training module and submit the practice exercise.',
   2, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '37 days', NULL),

  -- Week 3 — all completed
  ('jt-p-0001-0001-4001-d001-000000000011', 'jjj00003-0003-4003-c003-000000000003', 'tt010001-0001-4001-b001-000000000011',
   'Pick up your first assigned project task', 'Accept your first Jira ticket and begin working on the assigned analysis.',
   3, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '32 days', NULL),
  ('jt-p-0001-0001-4001-d001-000000000012', 'jjj00003-0003-4003-c003-000000000003', 'tt010001-0001-4001-b001-000000000012',
   'Contribute to the weekly team standup', 'Share your progress and blockers in the Monday standup meeting.',
   3, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '31 days', NULL),
  ('jt-p-0001-0001-4001-d001-000000000013', 'jjj00003-0003-4003-c003-000000000003', 'tt010001-0001-4001-b001-000000000013',
   'Submit first work output for feedback', 'Send your first analysis deliverable to your manager for review.',
   3, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '30 days', NULL),

  -- Week 4 — all completed
  ('jt-p-0001-0001-4001-d001-000000000014', 'jjj00003-0003-4003-c003-000000000003', 'tt010001-0001-4001-b001-000000000014',
   'Prepare 30-day self-reflection notes', 'Write a 1-page reflection on your first month covering wins, challenges, and questions.',
   4, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '25 days', NULL),
  ('jt-p-0001-0001-4001-d001-000000000015', 'jjj00003-0003-4003-c003-000000000003', 'tt010001-0001-4001-b001-000000000015',
   'Complete 30-day review meeting with manager', 'Attend the formal 30-day review and discuss your progress and goals.',
   4, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '24 days', NULL),
  ('jt-p-0001-0001-4001-d001-000000000016', 'jjj00003-0003-4003-c003-000000000003', 'tt010001-0001-4001-b001-000000000016',
   'Submit onboarding experience survey', 'Complete the anonymous onboarding feedback survey sent by HR.',
   4, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '23 days', NULL),

  -- Week 5 — completed
  ('jt-p-0001-0001-4001-d001-000000000017', 'jjj00003-0003-4003-c003-000000000003', 'tt010001-0001-4001-b001-000000000017',
   'Take ownership of an ongoing project stream', 'Assume primary responsibility for at least one active workstream.',
   5, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '18 days', NULL),

  -- Week 6 — falling behind (pending)
  ('jt-p-0001-0001-4001-d001-000000000018', 'jjj00003-0003-4003-c003-000000000003', 'tt010001-0001-4001-b001-000000000018',
   'Deliver a presentation to the team', 'Present your project findings or a topic of interest in a team meeting.',
   6, 'new_hire', 'pending', NULL, 'Has not started preparing the presentation despite reminders.'),

  -- Week 7 — pending (current week, no progress)
  ('jt-p-0001-0001-4001-d001-000000000019', 'jjj00003-0003-4003-c003-000000000003', 'tt010001-0001-4001-b001-000000000019',
   'Complete advanced data training module', 'Finish the advanced analytics course covering regression and forecasting.',
   7, 'new_hire', 'pending', NULL, NULL),

  -- Remaining weeks — pending
  ('jt-p-0001-0001-4001-d001-000000000020', 'jjj00003-0003-4003-c003-000000000003', 'tt010001-0001-4001-b001-000000000020',
   'Build relationships with 2 cross-functional contacts', 'Schedule informal coffee chats with stakeholders outside your team.',
   8, 'new_hire', 'pending', NULL, NULL),
  ('jt-p-0001-0001-4001-d001-000000000021', 'jjj00003-0003-4003-c003-000000000003', 'tt010001-0001-4001-b001-000000000021',
   'Prepare 90-day review presentation', 'Create a presentation summarising your achievements, learnings, and next steps.',
   10, 'new_hire', 'pending', NULL, NULL),
  ('jt-p-0001-0001-4001-d001-000000000022', 'jjj00003-0003-4003-c003-000000000003', 'tt010001-0001-4001-b001-000000000022',
   'Complete 90-day review with manager and HR', 'Attend the formal 90-day review with your manager and HR partner.',
   11, 'new_hire', 'pending', NULL, NULL),
  ('jt-p-0001-0001-4001-d001-000000000023', 'jjj00003-0003-4003-c003-000000000003', 'tt010001-0001-4001-b001-000000000023',
   'Set full-year performance objectives', 'Collaborate with your manager to define annual goals and key results.',
   11, 'new_hire', 'pending', NULL, NULL),
  ('jt-p-0001-0001-4001-d001-000000000024', 'jjj00003-0003-4003-c003-000000000003', 'tt010001-0001-4001-b001-000000000024',
   'Submit final onboarding completion survey', 'Complete the end-of-onboarding feedback form to help improve the programme.',
   12, 'new_hire', 'pending', NULL, NULL)
ON CONFLICT (id) DO NOTHING;


-- ============================================
-- 6. Check-ins
-- ============================================

-- Marcus: day_7 completed, day_14 completed, day_30 scheduled
INSERT INTO check_ins (id, journey_id, manager_id, milestone, scheduled_date, completed_date, ai_summary, notes) VALUES
  ('ci-m-0001-0001-4001-e001-000000000001', 'jjj00001-0001-4001-c001-000000000001',
   'b2b2b2b2-2222-4222-b222-222222222222', 'day_7',
   (CURRENT_DATE - INTERVAL '27 days' + INTERVAL '7 days')::date,
   (CURRENT_DATE - INTERVAL '27 days' + INTERVAL '7 days')::date,
   'Marcus had a strong first week. Completed all admin tasks on time, made a good impression in the team intro session, and is already asking insightful questions about the product.',
   'Great start — very engaged and proactive.'),
  ('ci-m-0001-0001-4001-e001-000000000002', 'jjj00001-0001-4001-c001-000000000001',
   'b2b2b2b2-2222-4222-b222-222222222222', 'day_14',
   (CURRENT_DATE - INTERVAL '27 days' + INTERVAL '14 days')::date,
   (CURRENT_DATE - INTERVAL '27 days' + INTERVAL '14 days')::date,
   'Marcus completed all Week 2 training modules. He showed strong analytical skills in the client shadowing session. Data tools training went well — he picked up Tableau quickly.',
   'On track. Consider giving him a slightly more complex first assignment.'),
  ('ci-m-0001-0001-4001-e001-000000000003', 'jjj00001-0001-4001-c001-000000000001',
   'b2b2b2b2-2222-4222-b222-222222222222', 'day_30',
   (CURRENT_DATE - INTERVAL '27 days' + INTERVAL '30 days')::date,
   NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Sarah: day_7 scheduled
INSERT INTO check_ins (id, journey_id, manager_id, milestone, scheduled_date, completed_date, ai_summary, notes) VALUES
  ('ci-s-0001-0001-4001-e001-000000000001', 'jjj00002-0002-4002-c002-000000000002',
   'c3c3c3c3-3333-4333-c333-333333333333', 'day_7',
   (CURRENT_DATE - INTERVAL '13 days' + INTERVAL '7 days')::date,
   NULL, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- Priya: day_7 completed, day_14 completed, day_30 completed, day_60 overdue
INSERT INTO check_ins (id, journey_id, manager_id, milestone, scheduled_date, completed_date, ai_summary, notes) VALUES
  ('ci-p-0001-0001-4001-e001-000000000001', 'jjj00003-0003-4003-c003-000000000003',
   'b2b2b2b2-2222-4222-b222-222222222222', 'day_7',
   (CURRENT_DATE - INTERVAL '48 days' + INTERVAL '7 days')::date,
   (CURRENT_DATE - INTERVAL '48 days' + INTERVAL '7 days')::date,
   'Priya completed her first week successfully. All tasks done, good energy in meetings.',
   'Solid start.'),
  ('ci-p-0001-0001-4001-e001-000000000002', 'jjj00003-0003-4003-c003-000000000003',
   'b2b2b2b2-2222-4222-b222-222222222222', 'day_14',
   (CURRENT_DATE - INTERVAL '48 days' + INTERVAL '14 days')::date,
   (CURRENT_DATE - INTERVAL '48 days' + INTERVAL '14 days')::date,
   'Priya finished training modules but seemed less engaged in the client shadow session. Worth monitoring.',
   'Completed on time but engagement dipped slightly.'),
  ('ci-p-0001-0001-4001-e001-000000000003', 'jjj00003-0003-4003-c003-000000000003',
   'b2b2b2b2-2222-4222-b222-222222222222', 'day_30',
   (CURRENT_DATE - INTERVAL '48 days' + INTERVAL '30 days')::date,
   (CURRENT_DATE - INTERVAL '48 days' + INTERVAL '30 days')::date,
   'Priya completed her 30-day review. She raised concerns about workload and feeling overwhelmed by the pace. Discussed strategies to prioritise tasks.',
   'Flagged some concerns — need to keep an eye on engagement.'),
  ('ci-p-0001-0001-4001-e001-000000000004', 'jjj00003-0003-4003-c003-000000000003',
   'b2b2b2b2-2222-4222-b222-222222222222', 'day_60',
   (CURRENT_DATE - INTERVAL '48 days' + INTERVAL '60 days')::date,
   NULL, NULL, 'OVERDUE — Priya has not responded to scheduling requests for 60-day check-in.')
ON CONFLICT (id) DO NOTHING;


-- ============================================
-- 7. Notifications
-- ============================================

INSERT INTO notifications (id, user_id, type, title, message, read, action_url, created_at) VALUES
  -- Risk alert for Priya — to Sophie (manager)
  ('nn000001-0001-4001-f001-000000000001',
   'b2b2b2b2-2222-4222-b222-222222222222',
   'risk_alert',
   'Priya Mehta flagged as at-risk',
   'Priya has 3 overdue tasks and missed her 60-day check-in. Risk score is now 72. Please review her journey and schedule a 1:1.',
   false,
   '/journeys/jjj00003-0003-4003-c003-000000000003',
   CURRENT_DATE - INTERVAL '2 days'),

  -- Risk alert for Priya — to Alex (HR)
  ('nn000001-0001-4001-f001-000000000002',
   'a1a1a1a1-1111-4111-a111-111111111111',
   'risk_alert',
   'Priya Mehta flagged as at-risk',
   'New hire Priya Mehta (Strategy & Operations) has been flagged as at-risk with a score of 72. Manager Sophie Turner has been notified.',
   false,
   '/journeys/jjj00003-0003-4003-c003-000000000003',
   CURRENT_DATE - INTERVAL '2 days'),

  -- Check-in reminder for Marcus day_30 — to Sophie
  ('nn000001-0001-4001-f001-000000000003',
   'b2b2b2b2-2222-4222-b222-222222222222',
   'checkin_reminder',
   'Marcus Reed — 30-day check-in approaching',
   'Marcus Reed''s 30-day milestone check-in is scheduled in 3 days. Please review his progress and prepare your agenda.',
   false,
   '/journeys/jjj00001-0001-4001-c001-000000000001',
   CURRENT_DATE - INTERVAL '1 day'),

  -- Milestone completed — Marcus week 2
  ('nn000001-0001-4001-f001-000000000004',
   'd4d4d4d4-4444-4444-d444-444444444444',
   'milestone',
   'Week 2 milestone completed!',
   'Congratulations! You have completed all Week 2 tasks. Keep up the great work as you move into your first contributions phase.',
   true,
   '/journeys/jjj00001-0001-4001-c001-000000000001',
   CURRENT_DATE - INTERVAL '14 days'),

  -- Task due — Marcus week 4
  ('nn000001-0001-4001-f001-000000000005',
   'd4d4d4d4-4444-4444-d444-444444444444',
   'task_due',
   'Task due: Prepare 30-day self-reflection notes',
   'Your 30-day self-reflection notes are due this week. Start by reviewing your completed tasks and noting key learnings.',
   false,
   '/journeys/jjj00001-0001-4001-c001-000000000001',
   CURRENT_DATE - INTERVAL '1 day'),

  -- Task due — Priya overdue presentation
  ('nn000001-0001-4001-f001-000000000006',
   'f6f6f6f6-6666-4666-f666-666666666666',
   'task_due',
   'Overdue: Deliver a presentation to the team',
   'This task from Week 6 is now overdue. Please reach out to your manager Sophie to reschedule.',
   false,
   '/journeys/jjj00003-0003-4003-c003-000000000003',
   CURRENT_DATE - INTERVAL '3 days'),

  -- Nudge — Sarah missed team intro
  ('nn000001-0001-4001-f001-000000000007',
   'e5e5e5e5-5555-4555-e555-555555555555',
   'nudge',
   'Don''t forget: team introduction session',
   'You missed the team intro session last week. Daniel has rescheduled it for this week — please confirm attendance.',
   false,
   '/journeys/jjj00002-0002-4002-c002-000000000002',
   CURRENT_DATE - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;


-- ============================================
-- 8. Resources
-- ============================================

INSERT INTO resources (id, title, type, content, url, department, ai_generated) VALUES
  ('rr000001-0001-4001-a001-000000000001',
   'Company Culture Guide',
   'document',
   'A comprehensive guide to our company values, working norms, and culture. Covers our mission statement, team rituals, communication expectations, and diversity & inclusion commitments.',
   NULL,
   NULL,
   false),
  ('rr000001-0001-4001-a001-000000000002',
   'Engineering Git Workflow',
   'document',
   'AI-generated guide covering branch naming conventions, pull request templates, code review expectations, and CI/CD pipeline overview. Tailored for new engineering and analyst hires.',
   NULL,
   'Engineering',
   true),
  ('rr000001-0001-4001-a001-000000000003',
   'Benefits Overview',
   'link',
   NULL,
   'https://intranet.example.com/benefits',
   NULL,
   false),
  ('rr000001-0001-4001-a001-000000000004',
   'IT Setup Checklist',
   'document',
   'Step-by-step checklist for new hire IT setup: laptop configuration, VPN installation, email activation, Teams setup, Jira/Confluence access requests, and security training enrolment.',
   NULL,
   'IT',
   false),
  ('rr000001-0001-4001-a001-000000000005',
   'Design System Documentation',
   'link',
   NULL,
   'https://figma.com/file/example/design-system',
   'Design',
   false)
ON CONFLICT (id) DO NOTHING;

COMMIT;
