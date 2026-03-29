# OnboardHero — Full Functionality Design

**Date:** 2026-03-30
**Approach:** Hybrid (functional flows first, file upload later)

## Problem

The app has a solid foundation (auth, journeys, tasks, AI, risk scoring, notifications) but each profile (HR, Manager, New Hire) is missing key actions that prevent the app from being fully functional end-to-end.

## Database Changes

### New Tables

1. **onboarding_forms** — Dynamic forms HR creates for new hires
   - id, title, description, department, fields (JSONB), created_by, created_at

2. **form_submissions** — New hire responses to forms
   - id, form_id, employee_id, journey_id, answers (JSONB), submitted_at

3. **feedback_surveys** — New hire satisfaction surveys at milestones
   - id, journey_id, employee_id, milestone, rating (1-5), comments, created_at

### Column Additions

- **profiles**: phone, bio, emergency_contact (JSONB), active (boolean default true)
- **journey_tasks**: approved_by (UUID), approved_at (timestamptz), requires_approval (boolean default false)
- **resources**: read_by (UUID[])

### RLS Policies
- New hire: own form_submissions, own feedback_surveys
- HR: all form_submissions, all feedback_surveys, all onboarding_forms
- Manager: form_submissions and feedback_surveys for assigned employees

## Features by Profile

### HR
1. Edit employee (role, department, manager, deactivate)
2. Manage active journeys (add/remove tasks, reassign manager)
3. Create dynamic onboarding forms
4. View form submissions
5. View all check-ins in analytics
6. Clone journey templates
7. View feedback surveys

### Manager
1. Complete own tasks (assigned_to_role='manager')
2. Mark check-ins as completed
3. Add notes to tasks
4. Approve tasks with requires_approval flag
5. Reschedule check-ins

### New Hire
1. Editable profile page (name, bio, phone, emergency contact)
2. Fill onboarding forms
3. Submit feedback surveys at milestones
4. Mark resources as read
5. View manager's task progress
6. Functional escalation (requestHelp → real notification)

### Transversal
1. Mark all notifications as read
2. Journey completion flow (auto-complete + notification)
3. Search in sidebar (employees for HR, team for Manager)

## Architecture

- All new features use Server Actions + Supabase queries (no new API routes)
- New components: EditEmployeeModal, FormBuilder, FormRenderer, FeedbackModal, ProfileForm
- New query files: lib/db/queries/forms.ts
- New action files: manager/actions.ts, hr/forms/actions.ts

## Implementation Order

1. Schema migration
2. Manager: complete tasks + check-ins
3. HR: edit employees + clone templates
4. New Hire: editable profile
5. Dynamic forms (HR create → New Hire fill)
6. Manager: notes + task approval
7. New Hire: feedback + mark resources read
8. HR: check-ins + feedback in analytics
9. Journey completion flow + mark all read
10. Functional escalation in chatbot
