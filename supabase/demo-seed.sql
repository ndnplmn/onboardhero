-- ============================================
-- OnboardHero — Demo Seed Data
-- ============================================
-- Run this in the Supabase SQL Editor AFTER creating your 3 Auth users.
-- It looks up UUIDs by email, so no manual UUID replacement needed.
-- ============================================

DO $$
DECLARE
  v_hr_id UUID;
  v_mgr_id UUID;
  v_hire_id UUID;
  v_tmpl1_id UUID;
  v_tmpl2_id UUID;
  v_journey_id UUID;
  v_tt_id UUID;
BEGIN

-- ============================================
-- 1. Look up user IDs by email
-- ============================================
SELECT id INTO v_hr_id FROM profiles WHERE email = 'admin@onboardhero.dev';
SELECT id INTO v_mgr_id FROM profiles WHERE email = 'manager@onboardhero.dev';
SELECT id INTO v_hire_id FROM profiles WHERE email = 'newhire@onboardhero.dev';

IF v_hr_id IS NULL OR v_mgr_id IS NULL OR v_hire_id IS NULL THEN
  RAISE EXCEPTION 'Missing users. Make sure all 3 users exist in profiles: admin@, manager@, newhire@onboardhero.dev';
END IF;

-- Update profile names and departments to look realistic
UPDATE profiles SET full_name = 'Andrea López', department = 'Human Resources' WHERE id = v_hr_id;
UPDATE profiles SET full_name = 'Carlos Méndez', department = 'Engineering' WHERE id = v_mgr_id;
UPDATE profiles SET full_name = 'Sofía Ramírez', department = 'Engineering' WHERE id = v_hire_id;

-- ============================================
-- 2. Journey Templates
-- ============================================
INSERT INTO journey_templates (id, name, description, role_type, department, duration_days, ai_generated, created_by)
VALUES
  (gen_random_uuid(), 'Software Engineer Onboarding',
   'Comprehensive 90-day onboarding for new software engineers. Covers environment setup, codebase orientation, first PRs, architecture deep-dives, and ramp to full ownership.',
   'Software Engineer', 'Engineering', 90, false, v_hr_id)
RETURNING id INTO v_tmpl1_id;

INSERT INTO journey_templates (id, name, description, role_type, department, duration_days, ai_generated, created_by)
VALUES
  (gen_random_uuid(), 'Product Designer Onboarding',
   '90-day onboarding for product designers. Covers design system familiarization, tool setup, first design critiques, and independent project delivery.',
   'Product Designer', 'Design', 90, false, v_hr_id)
RETURNING id INTO v_tmpl2_id;

-- Extra template (AI generated)
INSERT INTO journey_templates (name, description, role_type, department, duration_days, ai_generated, created_by)
VALUES
  ('Data Analyst Onboarding',
   'AI-generated 90-day onboarding for data analysts joining the Business Intelligence team. Includes SQL onboarding, dashboard training, and first analysis project.',
   'Data Analyst', 'Business Intelligence', 90, true, v_hr_id);

-- ============================================
-- 3. Template Tasks — Software Engineer (20 tasks across 12 weeks)
-- ============================================
INSERT INTO template_tasks (template_id, title, description, week, assigned_to_role, "order") VALUES
  -- Week 1: Welcome & Setup
  (v_tmpl1_id, 'Watch company welcome presentation', 'Watch the 45-minute company welcome video covering history, mission and culture.', 1, 'new_hire', 1),
  (v_tmpl1_id, 'Set up development environment', 'Install required tools: VS Code, Docker, Node.js, Git. Follow the dev setup guide.', 1, 'new_hire', 2),
  (v_tmpl1_id, 'Meet your manager for intro meeting', 'Attend the scheduled 1-hour introduction meeting with your direct manager.', 1, 'new_hire', 3),
  (v_tmpl1_id, 'Schedule intro meeting with new hire', 'Block 1 hour for a welcome meeting to discuss role, expectations, and 90-day goals.', 1, 'manager', 4),
  (v_tmpl1_id, 'Complete HR onboarding checklist', 'Submit tax forms, emergency contacts, and benefit selections via the HR portal.', 1, 'new_hire', 5),
  -- Week 2: Codebase & Team
  (v_tmpl1_id, 'Clone and run the main repository', 'Clone the monorepo, install dependencies, and verify the app runs locally.', 2, 'new_hire', 1),
  (v_tmpl1_id, 'Read architecture documentation', 'Review the system architecture doc and component diagram in Notion.', 2, 'new_hire', 2),
  (v_tmpl1_id, 'Attend team standup for the first time', 'Join the daily standup and introduce yourself to the team.', 2, 'new_hire', 3),
  (v_tmpl1_id, 'Assign first starter ticket', 'Pick a "good-first-issue" ticket from the backlog and assign it to the new hire.', 2, 'manager', 4),
  -- Week 3-4: First Contributions
  (v_tmpl1_id, 'Submit first pull request', 'Complete the starter ticket and submit a PR following the contribution guide.', 3, 'new_hire', 1),
  (v_tmpl1_id, 'Review first PR and provide feedback', 'Review the new hire''s first PR with constructive, educational feedback.', 3, 'manager', 2),
  (v_tmpl1_id, 'Complete code review training', 'Watch the 30-min code review best practices video and review 2 team PRs.', 4, 'new_hire', 1),
  (v_tmpl1_id, 'Attend architecture deep-dive session', 'Join the 2-hour session on backend architecture and database design.', 4, 'new_hire', 2),
  -- Week 5-8: Growing Independence
  (v_tmpl1_id, 'Complete 3 medium-complexity tickets', 'Work through 3 tickets independently with minimal guidance.', 6, 'new_hire', 1),
  (v_tmpl1_id, 'Lead a technical discussion', 'Present a technical topic or solution approach to the team in a 30-min session.', 7, 'new_hire', 1),
  (v_tmpl1_id, 'Write documentation for a component', 'Document a component or module you worked on, including usage examples.', 8, 'new_hire', 1),
  -- Week 9-12: Full Ownership
  (v_tmpl1_id, 'Own a feature end-to-end', 'Take ownership of a feature from design review to production deployment.', 9, 'new_hire', 1),
  (v_tmpl1_id, 'Participate in on-call rotation', 'Shadow a teammate during on-call, then take your first solo on-call shift.', 10, 'new_hire', 1),
  (v_tmpl1_id, 'Complete 90-day self-assessment', 'Write a self-assessment covering wins, challenges, and growth areas.', 12, 'new_hire', 1),
  (v_tmpl1_id, 'Conduct 90-day performance review', 'Schedule and conduct the formal 90-day review with the new hire.', 12, 'manager', 2);

-- ============================================
-- 4. Create Journey for the New Hire (Sofía Ramírez)
-- ============================================
INSERT INTO journeys (id, employee_id, template_id, manager_id, status, start_date, current_week, risk_score, risk_reasons, sentiment_score)
VALUES (
  gen_random_uuid(),
  v_hire_id,
  v_tmpl1_id,
  v_mgr_id,
  'in_progress',
  CURRENT_DATE - INTERVAL '21 days',  -- Started 3 weeks ago
  4,
  25,
  '["Slightly behind on week 3 tasks", "Has not attended architecture deep-dive yet"]'::jsonb,
  0.72
)
RETURNING id INTO v_journey_id;

-- ============================================
-- 5. Journey Tasks (with realistic progress)
-- ============================================
-- Week 1: All completed
INSERT INTO journey_tasks (journey_id, title, description, week, assigned_to_role, status, completed_at) VALUES
  (v_journey_id, 'Watch company welcome presentation', 'Watch the 45-minute company welcome video covering history, mission and culture.', 1, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '20 days'),
  (v_journey_id, 'Set up development environment', 'Install required tools: VS Code, Docker, Node.js, Git. Follow the dev setup guide.', 1, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '20 days'),
  (v_journey_id, 'Meet your manager for intro meeting', 'Attend the scheduled 1-hour introduction meeting with your direct manager.', 1, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '19 days'),
  (v_journey_id, 'Schedule intro meeting with new hire', 'Block 1 hour for a welcome meeting to discuss role, expectations, and 90-day goals.', 1, 'manager', 'completed', CURRENT_DATE - INTERVAL '19 days'),
  (v_journey_id, 'Complete HR onboarding checklist', 'Submit tax forms, emergency contacts, and benefit selections via the HR portal.', 1, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '18 days');

-- Week 2: All completed
INSERT INTO journey_tasks (journey_id, title, description, week, assigned_to_role, status, completed_at) VALUES
  (v_journey_id, 'Clone and run the main repository', 'Clone the monorepo, install dependencies, and verify the app runs locally.', 2, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '13 days'),
  (v_journey_id, 'Read architecture documentation', 'Review the system architecture doc and component diagram in Notion.', 2, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '12 days'),
  (v_journey_id, 'Attend team standup for the first time', 'Join the daily standup and introduce yourself to the team.', 2, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '14 days'),
  (v_journey_id, 'Assign first starter ticket', 'Pick a "good-first-issue" ticket from the backlog and assign it to the new hire.', 2, 'manager', 'completed', CURRENT_DATE - INTERVAL '13 days');

-- Week 3: Partially done (in progress)
INSERT INTO journey_tasks (journey_id, title, description, week, assigned_to_role, status, completed_at) VALUES
  (v_journey_id, 'Submit first pull request', 'Complete the starter ticket and submit a PR following the contribution guide.', 3, 'new_hire', 'completed', CURRENT_DATE - INTERVAL '5 days'),
  (v_journey_id, 'Review first PR and provide feedback', 'Review the new hire''s first PR with constructive, educational feedback.', 3, 'manager', 'in_progress', NULL);

-- Week 4: Pending
INSERT INTO journey_tasks (journey_id, title, description, week, assigned_to_role, status) VALUES
  (v_journey_id, 'Complete code review training', 'Watch the 30-min code review best practices video and review 2 team PRs.', 4, 'new_hire', 'pending'),
  (v_journey_id, 'Attend architecture deep-dive session', 'Join the 2-hour session on backend architecture and database design.', 4, 'new_hire', 'pending');

-- Week 6-12: Future tasks (pending)
INSERT INTO journey_tasks (journey_id, title, description, week, assigned_to_role, status) VALUES
  (v_journey_id, 'Complete 3 medium-complexity tickets', 'Work through 3 tickets independently with minimal guidance.', 6, 'new_hire', 'pending'),
  (v_journey_id, 'Lead a technical discussion', 'Present a technical topic or solution approach to the team in a 30-min session.', 7, 'new_hire', 'pending'),
  (v_journey_id, 'Write documentation for a component', 'Document a component or module you worked on, including usage examples.', 8, 'new_hire', 'pending'),
  (v_journey_id, 'Own a feature end-to-end', 'Take ownership of a feature from design review to production deployment.', 9, 'new_hire', 'pending'),
  (v_journey_id, 'Participate in on-call rotation', 'Shadow a teammate during on-call, then take your first solo on-call shift.', 10, 'new_hire', 'pending'),
  (v_journey_id, 'Complete 90-day self-assessment', 'Write a self-assessment covering wins, challenges, and growth areas.', 12, 'new_hire', 'pending'),
  (v_journey_id, 'Conduct 90-day performance review', 'Schedule and conduct the formal 90-day review with the new hire.', 12, 'manager', 'pending');

-- ============================================
-- 6. Check-ins (milestones)
-- ============================================
INSERT INTO check_ins (journey_id, manager_id, milestone, scheduled_date, completed_date, ai_agenda, ai_summary, notes) VALUES
  -- Day 7: Completed
  (v_journey_id, v_mgr_id, 'day_7',
   (CURRENT_DATE - INTERVAL '21 days' + INTERVAL '7 days'),
   (CURRENT_DATE - INTERVAL '21 days' + INTERVAL '7 days'),
   E'## Day 7 Check-in Agenda\n\n1. **How are you settling in?** — First impressions, workspace comfort\n2. **Dev environment** — Any blockers with setup?\n3. **Team dynamics** — How was the first standup?\n4. **Questions** — Anything unclear about role or expectations?\n5. **Next week goals** — Align on week 2 priorities',
   E'Sofía is settling in well. Dev environment is fully set up. She appreciated the detailed setup guide. Enjoyed meeting the team at standup. Main question was about the PR review process — we walked through it together. Goals for next week: clone repo, read architecture docs, start first ticket.',
   'Great first week. Sofía is proactive and asks good questions. No concerns at this point.'),

  -- Day 14: Completed
  (v_journey_id, v_mgr_id, 'day_14',
   (CURRENT_DATE - INTERVAL '21 days' + INTERVAL '14 days'),
   (CURRENT_DATE - INTERVAL '21 days' + INTERVAL '14 days'),
   E'## Day 14 Check-in Agenda\n\n1. **Codebase familiarity** — How comfortable do you feel navigating the code?\n2. **First ticket progress** — Status on the good-first-issue\n3. **Architecture understanding** — Questions from the docs review?\n4. **Collaboration** — How''s working with the team going?\n5. **Feedback** — Anything we can improve about the onboarding?',
   E'Sofía has a good grasp of the codebase structure. She''s working on her first ticket (JIRA-142) and expects to submit a PR by end of week 3. Had some questions about the auth module — we scheduled a pairing session. Team collaboration is going well; she paired with Diego on a bug fix. Feedback: wished the architecture doc had more diagrams.',
   'Solid progress. She''s a bit behind on the first PR but nothing concerning. The pairing session should help.'),

  -- Day 30: Upcoming
  (v_journey_id, v_mgr_id, 'day_30',
   (CURRENT_DATE - INTERVAL '21 days' + INTERVAL '30 days'),
   NULL,
   E'## Day 30 Check-in Agenda\n\n1. **Month 1 reflection** — Biggest wins and challenges\n2. **Technical growth** — Areas of confidence vs. areas needing support\n3. **Code review quality** — Review recent PR feedback\n4. **Independence level** — Ready for medium-complexity tickets?\n5. **30-60-90 goals** — Adjust goals for the next phase',
   NULL,
   NULL),

  -- Day 60: Future
  (v_journey_id, v_mgr_id, 'day_60',
   (CURRENT_DATE - INTERVAL '21 days' + INTERVAL '60 days'),
   NULL, NULL, NULL, NULL),

  -- Day 90: Future
  (v_journey_id, v_mgr_id, 'day_90',
   (CURRENT_DATE - INTERVAL '21 days' + INTERVAL '90 days'),
   NULL, NULL, NULL, NULL);

-- ============================================
-- 7. Notifications
-- ============================================
-- HR notifications
INSERT INTO notifications (user_id, type, title, message, read, action_url, created_at) VALUES
  (v_hr_id, 'milestone', 'Day 14 check-in completed', 'Carlos completed the Day 14 check-in with Sofía Ramírez.', true, '/hr/analytics', CURRENT_DATE - INTERVAL '7 days'),
  (v_hr_id, 'task_due', 'Week 4 tasks starting', 'Sofía Ramírez has 2 tasks due this week: code review training and architecture deep-dive.', false, '/hr/dashboard', CURRENT_DATE - INTERVAL '1 day'),
  (v_hr_id, 'nudge', 'New journey template available', 'The AI-generated "Data Analyst Onboarding" template is ready for review.', false, '/hr/journeys', CURRENT_DATE - INTERVAL '3 days'),
  (v_hr_id, 'risk_alert', 'Attention: Sofía slightly behind', 'Sofía Ramírez has a risk score of 25. She is slightly behind on week 3 tasks.', false, '/hr/analytics', CURRENT_DATE - INTERVAL '2 days');

-- Manager notifications
INSERT INTO notifications (user_id, type, title, message, read, action_url, created_at) VALUES
  (v_mgr_id, 'checkin_reminder', 'Day 30 check-in coming up', 'Sofía Ramírez''s Day 30 check-in is scheduled in 9 days. Use AI Coach to prepare.', false, '/manager/coaching', CURRENT_DATE - INTERVAL '1 day'),
  (v_mgr_id, 'task_due', 'PR review pending', 'You have a pending PR review for Sofía''s first pull request.', false, '/manager/dashboard', CURRENT_DATE - INTERVAL '3 days'),
  (v_mgr_id, 'milestone', 'Day 14 check-in completed', 'You completed the Day 14 check-in with Sofía. Summary has been saved.', true, '/manager/dashboard', CURRENT_DATE - INTERVAL '7 days'),
  (v_mgr_id, 'nudge', 'AI coaching tip', 'Sofía is entering week 4. Consider discussing her code review skills and pairing opportunities.', false, '/manager/coaching', CURRENT_DATE - INTERVAL '1 day');

-- New hire notifications
INSERT INTO notifications (user_id, type, title, message, read, action_url, created_at) VALUES
  (v_hire_id, 'task_due', 'Code review training due', 'Your "Complete code review training" task is due this week.', false, '/hire/tasks', CURRENT_DATE - INTERVAL '1 day'),
  (v_hire_id, 'task_due', 'Architecture deep-dive session', 'Don''t forget to attend the architecture deep-dive session this week.', false, '/hire/tasks', CURRENT_DATE - INTERVAL '1 day'),
  (v_hire_id, 'milestone', 'Day 14 check-in completed', 'Great job! Your Day 14 check-in with Carlos went well.', true, '/hire/dashboard', CURRENT_DATE - INTERVAL '7 days'),
  (v_hire_id, 'nudge', 'Week 3 progress', 'You completed your first PR! Keep up the momentum heading into week 4.', true, '/hire/dashboard', CURRENT_DATE - INTERVAL '4 days'),
  (v_hire_id, 'checkin_reminder', 'Day 30 check-in coming up', 'Your Day 30 check-in with Carlos is in 9 days. Prepare your talking points!', false, '/hire/dashboard', CURRENT_DATE - INTERVAL '1 day');

-- ============================================
-- 8. Resources (organizational knowledge base)
-- ============================================
INSERT INTO resources (title, type, content, url, department, ai_generated, created_at) VALUES
  ('Engineering Onboarding Guide', 'document',
   E'# Engineering Onboarding Guide\n\n## Welcome to the Engineering Team!\n\nThis guide will help you get set up and productive in your first weeks.\n\n## Development Environment Setup\n\n### Prerequisites\n- macOS 13+ or Ubuntu 22.04+\n- Homebrew (macOS) or apt (Linux)\n- 16GB+ RAM recommended\n\n### Step 1: Install Core Tools\n```bash\nbrew install node@20 docker git\n```\n\n### Step 2: Clone the Repository\n```bash\ngit clone git@github.com:company/main-app.git\ncd main-app\nnpm install\n```\n\n### Step 3: Configure Environment\n```bash\ncp .env.example .env.local\n# Edit .env.local with your credentials\n```\n\n### Step 4: Start Development Server\n```bash\nnpm run dev\n```\n\n## Architecture Overview\n\nOur application follows a monorepo structure:\n- `/apps/web` — Next.js frontend\n- `/apps/api` — Node.js API server\n- `/packages/shared` — Shared utilities and types\n- `/packages/ui` — Component library\n\n## Key Contacts\n- **Tech Lead**: Carlos Méndez\n- **DevOps**: María García\n- **Design**: Ana Torres\n\n## Useful Links\n- [Notion Wiki](https://notion.so/company-wiki)\n- [Figma Designs](https://figma.com/company)\n- [CI/CD Dashboard](https://github.com/company/actions)',
   NULL, 'Engineering', false, CURRENT_DATE - INTERVAL '60 days'),

  ('Company Culture & Values', 'document',
   E'# Company Culture & Values\n\n## Our Mission\nTo empower organizations to build exceptional teams through intelligent onboarding.\n\n## Core Values\n\n### 1. People First\nWe believe great products start with great teams. We invest in our people''s growth, wellbeing, and success.\n\n### 2. Build with Purpose\nEvery feature we ship should meaningfully improve someone''s onboarding experience.\n\n### 3. Radical Transparency\nWe share context openly. Better-informed teams make better decisions.\n\n### 4. Continuous Learning\nWe encourage experimentation, celebrate learning from failures, and support professional development.\n\n### 5. Inclusive by Design\nDiversity of thought and background makes our product and culture stronger.\n\n## How We Work\n- **Async-first**: Write things down, respect time zones\n- **Bi-weekly sprints**: Ship iteratively\n- **Friday demos**: Show what you built\n- **Monthly retrospectives**: Improve how we work',
   NULL, NULL, false, CURRENT_DATE - INTERVAL '90 days'),

  ('Code Review Best Practices', 'document',
   E'# Code Review Best Practices\n\n## Why We Review Code\n- Catch bugs early\n- Share knowledge across the team\n- Maintain code quality and consistency\n- Mentor junior developers\n\n## As a Reviewer\n\n### Do\n- Be kind and constructive\n- Explain the "why" behind suggestions\n- Approve when good enough (don''t block on style)\n- Respond within 24 hours\n\n### Don''t\n- Use review comments for architectural debates\n- Request changes on unrelated code\n- Leave vague comments like "this is wrong"\n\n## As an Author\n- Keep PRs small (< 400 lines)\n- Write a clear description\n- Self-review before requesting\n- Link the ticket/issue\n\n## Review Checklist\n- [ ] Tests included?\n- [ ] Types correct?\n- [ ] Edge cases handled?\n- [ ] No hardcoded values?\n- [ ] Error handling present?',
   NULL, 'Engineering', false, CURRENT_DATE - INTERVAL '45 days'),

  ('Benefits & Perks Overview', 'link',
   NULL, 'https://company.notion.so/benefits', NULL, false, CURRENT_DATE - INTERVAL '30 days'),

  ('Design System Documentation', 'link',
   NULL, 'https://figma.com/company/design-system', 'Design', false, CURRENT_DATE - INTERVAL '50 days'),

  ('First Week FAQ', 'document',
   E'# First Week FAQ\n\n## General\n\n**Q: What time should I start work?**\nA: Core hours are 10am–4pm in your local timezone. Outside of that, work when you''re most productive.\n\n**Q: How do I request time off?**\nA: Use the HR portal. Submit requests at least 2 weeks in advance for planned PTO.\n\n**Q: Where do I eat lunch?**\nA: The kitchen is on the 3rd floor. Free snacks and drinks are always stocked. Team lunches happen on Wednesdays.\n\n## Technical\n\n**Q: I can''t run the app locally. What do I do?**\nA: Check the #dev-help Slack channel. Most setup issues are already documented there.\n\n**Q: How do I get access to AWS/GitHub/Figma?**\nA: Request access through the IT portal. Your manager should have pre-approved most tools.\n\n**Q: What''s the git branching strategy?**\nA: We use trunk-based development. Create feature branches from `main`, keep them short-lived.',
   NULL, NULL, true, CURRENT_DATE - INTERVAL '10 days');

-- ============================================
-- 9. AI Conversations (sample chat history)
-- ============================================
INSERT INTO ai_conversations (user_id, journey_id, preset, messages, created_at) VALUES
  -- New hire had a chat with the AI assistant
  (v_hire_id, v_journey_id, 'chatbot',
   '[
     {"role": "user", "content": "Hi! I need help setting up Docker on my Mac."},
     {"role": "assistant", "content": "Hey Sofía! I can help with that. For Docker on Mac, you''ll want to install Docker Desktop. Here''s what to do:\n\n1. Download Docker Desktop from docker.com\n2. Open the .dmg file and drag Docker to Applications\n3. Open Docker Desktop and wait for it to start\n4. Verify in terminal: `docker --version`\n\nOnce it''s running, you can clone the repo and run `docker compose up` to start the dev environment. Need help with any of those steps?"},
     {"role": "user", "content": "Thanks! That worked. One more question - where can I find the API documentation?"},
     {"role": "assistant", "content": "Great to hear! The API documentation is available in a few places:\n\n1. **Swagger UI**: Run the API locally and visit `http://localhost:3001/docs`\n2. **Notion**: Check the Engineering wiki under \"API Reference\"\n3. **Code**: Each endpoint has JSDoc comments in `/apps/api/src/routes/`\n\nI''d recommend starting with Swagger since it lets you try out endpoints interactively. Let me know if you need anything else!"}
   ]'::jsonb,
   CURRENT_DATE - INTERVAL '15 days');

RAISE NOTICE 'Demo data inserted successfully!';
RAISE NOTICE 'HR: Andrea López (admin@onboardhero.dev)';
RAISE NOTICE 'Manager: Carlos Méndez (manager@onboardhero.dev)';
RAISE NOTICE 'New Hire: Sofía Ramírez (newhire@onboardhero.dev)';

END $$;
