# OnboardHero Full Functionality — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make all three profiles (HR, Manager, New Hire) fully functional with complete data entry, task management, check-in workflows, forms, and feedback loops.

**Architecture:** Extends existing Next.js App Router + Supabase stack using Server Actions for mutations, admin client for queries, and client components for interactive UI. No new API routes — everything follows the established pattern of server actions in `actions.ts` files and queries in `lib/db/queries/`.

**Tech Stack:** Next.js 16, React 19, Supabase (PostgreSQL + RLS + Realtime), TypeScript, Server Actions

**Important:** Before writing any code, read `node_modules/next/dist/docs/` for Next.js 16 conventions. Use `params: Promise<{ id: string }>` pattern for dynamic routes. Use `await cookies()` for server client.

---

## Task 1: Database Schema Migration

**Files:**
- Create: `supabase/migrations/20260330_full_functionality.sql`
- Modify: `supabase/schema.sql` (append new tables/columns)
- Modify: `lib/db/types.ts` (add new TypeScript interfaces)

**Step 1: Create the migration SQL file**

```sql
-- ============================================
-- Migration: Full Functionality
-- ============================================

-- 1. Extend profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact JSONB DEFAULT '{}'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- 2. Extend journey_tasks table
ALTER TABLE journey_tasks ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE journey_tasks ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE journey_tasks ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 3. Extend resources table
ALTER TABLE resources ADD COLUMN IF NOT EXISTS read_by UUID[] NOT NULL DEFAULT '{}';

-- 4. Onboarding Forms
CREATE TABLE IF NOT EXISTS onboarding_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  department TEXT,
  fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Form Submissions
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES onboarding_forms(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  journey_id UUID REFERENCES journeys(id) ON DELETE SET NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Feedback Surveys
CREATE TABLE IF NOT EXISTS feedback_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  milestone milestone_type NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_form_submissions_employee ON form_submissions(employee_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_feedback_surveys_journey ON feedback_surveys(journey_id);
CREATE INDEX IF NOT EXISTS idx_feedback_surveys_employee ON feedback_surveys(employee_id);

-- RLS
ALTER TABLE onboarding_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_surveys ENABLE ROW LEVEL SECURITY;

-- Onboarding Forms policies
CREATE POLICY "HR manages forms" ON onboarding_forms FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'hr'));

CREATE POLICY "All authenticated read forms" ON onboarding_forms FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Form Submissions policies
CREATE POLICY "Employee manages own submissions" ON form_submissions FOR ALL
  USING (employee_id = auth.uid());

CREATE POLICY "HR views all submissions" ON form_submissions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'hr'));

CREATE POLICY "Manager views assigned submissions" ON form_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = form_submissions.journey_id
      AND journeys.manager_id = auth.uid()
    )
  );

-- Feedback Surveys policies
CREATE POLICY "Employee manages own feedback" ON feedback_surveys FOR ALL
  USING (employee_id = auth.uid());

CREATE POLICY "HR views all feedback" ON feedback_surveys FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'hr'));

CREATE POLICY "Manager views assigned feedback" ON feedback_surveys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = feedback_surveys.journey_id
      AND journeys.manager_id = auth.uid()
    )
  );

-- Manager update policy for journey_tasks (for approval and notes)
CREATE POLICY "Manager updates assigned tasks" ON journey_tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM journeys
      WHERE journeys.id = journey_tasks.journey_id
      AND journeys.manager_id = auth.uid()
    )
  );
```

**Step 2: Update TypeScript types in `lib/db/types.ts`**

Add after the existing interfaces:

```typescript
export interface OnboardingForm {
  id: string
  title: string
  description: string
  department: string | null
  fields: FormField[]
  created_by: string | null
  created_at: string
}

export interface FormField {
  id: string
  type: 'text' | 'textarea' | 'select' | 'date' | 'checkbox' | 'email' | 'phone'
  label: string
  required: boolean
  placeholder?: string
  options?: string[] // for select fields
}

export interface FormSubmission {
  id: string
  form_id: string
  employee_id: string
  journey_id: string | null
  answers: Record<string, string | boolean>
  submitted_at: string
}

export interface FeedbackSurvey {
  id: string
  journey_id: string
  employee_id: string
  milestone: Milestone
  rating: number
  comments: string | null
  created_at: string
}
```

Update the existing `Profile` interface to add new fields:

```typescript
export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  department: string | null
  avatar_url: string | null
  phone: string | null
  bio: string | null
  emergency_contact: { name?: string; phone?: string; relationship?: string } | null
  active: boolean
  created_at: string
}
```

Update `JourneyTask` interface:

```typescript
export interface JourneyTask {
  id: string
  journey_id: string
  template_task_id: string
  title: string
  description: string
  week: number
  assigned_to_role: UserRole
  status: TaskStatus
  completed_at: string | null
  notes: string | null
  requires_approval: boolean
  approved_by: string | null
  approved_at: string | null
}
```

**Step 3: Apply migration**

Run: `npx supabase db push` or apply the SQL directly via Supabase Dashboard SQL editor.

**Step 4: Commit**

```bash
git add supabase/migrations/20260330_full_functionality.sql supabase/schema.sql lib/db/types.ts
git commit -m "feat: add schema for forms, feedback, profile extensions, task approval"
```

---

## Task 2: Manager — Complete Own Tasks & Mark Check-ins Done

**Files:**
- Create: `app/(platform)/manager/actions.ts`
- Modify: `app/(platform)/manager/team/[id]/page.tsx`
- Modify: `lib/db/queries/manager.ts` (add manager task queries)

**Step 1: Create manager server actions**

Create `app/(platform)/manager/actions.ts`:

```typescript
'use server'

import { createSupabaseAdmin } from '@/lib/db/supabase-server'
import { getUser } from '@/lib/auth/get-user'
import { revalidatePath } from 'next/cache'

export async function toggleManagerTask(taskId: string, completed: boolean) {
  const user = await getUser()
  const supabase = createSupabaseAdmin()

  await supabase
    .from('journey_tasks')
    .update({
      status: completed ? 'completed' : 'pending',
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', taskId)

  revalidatePath('/manager/team')
  revalidatePath('/manager/dashboard')
}

export async function completeCheckIn(checkInId: string) {
  const user = await getUser()
  const supabase = createSupabaseAdmin()

  await supabase
    .from('check_ins')
    .update({ completed_date: new Date().toISOString().split('T')[0] })
    .eq('id', checkInId)
    .eq('manager_id', user.id)

  revalidatePath('/manager/team')
  revalidatePath('/manager/dashboard')
}

export async function addTaskNote(taskId: string, notes: string) {
  const supabase = createSupabaseAdmin()

  await supabase
    .from('journey_tasks')
    .update({ notes })
    .eq('id', taskId)

  revalidatePath('/manager/team')
}

export async function approveTask(taskId: string) {
  const user = await getUser()
  const supabase = createSupabaseAdmin()

  await supabase
    .from('journey_tasks')
    .update({
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', taskId)

  revalidatePath('/manager/team')
}

export async function rescheduleCheckIn(checkInId: string, newDate: string) {
  const user = await getUser()
  const supabase = createSupabaseAdmin()

  await supabase
    .from('check_ins')
    .update({ scheduled_date: newDate })
    .eq('id', checkInId)
    .eq('manager_id', user.id)

  revalidatePath('/manager/team')
  revalidatePath('/manager/dashboard')
}
```

**Step 2: Create interactive task/check-in components for the team member page**

Create `app/(platform)/manager/team/[id]/TeamMemberTasks.tsx`:

```typescript
'use client'

import { useTransition, useState } from 'react'
import { toggleManagerTask, addTaskNote, approveTask } from '@/app/(platform)/manager/actions'

interface Task {
  id: string
  title: string
  description: string
  week: number
  status: string
  assigned_to_role: string
  notes: string | null
  requires_approval: boolean
  approved_by: string | null
  approved_at: string | null
}

export default function TeamMemberTasks({ tasks, currentWeek }: { tasks: Task[]; currentWeek: number }) {
  const [isPending, startTransition] = useTransition()
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')

  function handleToggle(taskId: string, currentStatus: string) {
    startTransition(() => toggleManagerTask(taskId, currentStatus !== 'completed'))
  }

  function handleSaveNote(taskId: string) {
    startTransition(() => {
      addTaskNote(taskId, noteText)
      setEditingNote(null)
      setNoteText('')
    })
  }

  function handleApprove(taskId: string) {
    startTransition(() => approveTask(taskId))
  }

  const weeks = Array.from(new Set(tasks.map(t => t.week))).sort((a, b) => a - b)

  return (
    <div>
      {weeks.map((week) => {
        const weekTasks = tasks.filter(t => t.week === week)
        return (
          <div key={week} style={{ marginBottom: '20px' }}>
            <h3 style={{
              fontSize: '0.95rem',
              color: week === currentWeek ? 'var(--cyan)' : 'var(--text2)',
              fontWeight: week === currentWeek ? 700 : 500,
              marginBottom: '10px',
            }}>
              Week {week} {week === currentWeek && '← Current'}
            </h3>
            {weekTasks.map((t) => {
              const isManagerTask = t.assigned_to_role === 'manager'
              const roleLabel = t.assigned_to_role === 'new_hire' ? 'New Hire' : t.assigned_to_role === 'manager' ? 'Manager' : 'HR'

              return (
                <div key={t.id} className="hc-emp" style={{
                  opacity: t.status === 'completed' ? 0.6 : 1,
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  padding: '12px 16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Manager can toggle their own tasks */}
                    {isManagerTask ? (
                      <button
                        onClick={() => handleToggle(t.id, t.status)}
                        disabled={isPending}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: '1.1rem', width: '26px', textAlign: 'center',
                          color: t.status === 'completed' ? 'var(--green)' : 'var(--text3)',
                        }}
                      >
                        <i className={`fa-solid ${t.status === 'completed' ? 'fa-circle-check' : 'fa-circle'}`}></i>
                      </button>
                    ) : (
                      <i
                        className={`fa-solid ${t.status === 'completed' ? 'fa-circle-check' : 'fa-circle'}`}
                        style={{ color: t.status === 'completed' ? 'var(--green)' : 'var(--text3)', width: '26px', textAlign: 'center' }}
                      ></i>
                    )}
                    <div className="hce-info" style={{ flex: 1 }}>
                      <strong style={{ textDecoration: t.status === 'completed' ? 'line-through' : 'none' }}>{t.title}</strong>
                      <span>{roleLabel}{t.description ? ` · ${t.description}` : ''}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {/* Approve button for tasks that need approval */}
                      {t.requires_approval && !t.approved_by && t.status === 'completed' && (
                        <button
                          className="btn btn-ghost"
                          style={{ fontSize: '0.75rem', color: 'var(--green)' }}
                          onClick={() => handleApprove(t.id)}
                          disabled={isPending}
                        >
                          <i className="fa-solid fa-check"></i> Approve
                        </button>
                      )}
                      {t.approved_by && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--green)', padding: '2px 8px', background: 'var(--green-bg, #e8f5e9)', borderRadius: '12px' }}>
                          Approved
                        </span>
                      )}
                      {/* Note button */}
                      <button
                        className="btn btn-ghost"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => {
                          setEditingNote(editingNote === t.id ? null : t.id)
                          setNoteText(t.notes || '')
                        }}
                      >
                        <i className="fa-solid fa-sticky-note"></i>
                      </button>
                    </div>
                  </div>

                  {/* Notes display */}
                  {t.notes && editingNote !== t.id && (
                    <div style={{ marginLeft: '36px', marginTop: '6px', fontSize: '0.8rem', color: 'var(--text3)', fontStyle: 'italic' }}>
                      <i className="fa-solid fa-sticky-note" style={{ marginRight: '6px' }}></i>{t.notes}
                    </div>
                  )}

                  {/* Note editor */}
                  {editingNote === t.id && (
                    <div style={{ marginLeft: '36px', marginTop: '8px', display: 'flex', gap: '6px' }}>
                      <input
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add a note..."
                        style={{ flex: 1, padding: '6px 10px', fontSize: '0.85rem', border: '1px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--surface)' }}
                      />
                      <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '6px 12px' }} onClick={() => handleSaveNote(t.id)} disabled={isPending}>
                        Save
                      </button>
                      <button className="btn btn-ghost" style={{ fontSize: '0.75rem' }} onClick={() => setEditingNote(null)}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
```

**Step 3: Create check-in actions component**

Create `app/(platform)/manager/team/[id]/CheckInActions.tsx`:

```typescript
'use client'

import { useTransition, useState } from 'react'
import { completeCheckIn, rescheduleCheckIn } from '@/app/(platform)/manager/actions'

interface CheckInItem {
  id: string
  milestone: string
  scheduled_date: string
  completed_date: string | null
  notes: string | null
}

export default function CheckInActions({ checkIns }: { checkIns: CheckInItem[] }) {
  const [isPending, startTransition] = useTransition()
  const [rescheduling, setRescheduling] = useState<string | null>(null)
  const [newDate, setNewDate] = useState('')

  function handleComplete(id: string) {
    startTransition(() => completeCheckIn(id))
  }

  function handleReschedule(id: string) {
    if (!newDate) return
    startTransition(() => {
      rescheduleCheckIn(id, newDate)
      setRescheduling(null)
      setNewDate('')
    })
  }

  return (
    <div>
      {checkIns.map((ci) => {
        const milestoneLabel = ci.milestone.replace('_', ' ').replace('day', 'Day ')
        const isPast = new Date(ci.scheduled_date) < new Date()
        const isCompleted = !!ci.completed_date

        return (
          <div key={ci.id} className="hc-emp" style={{
            padding: '14px 16px',
            opacity: isCompleted ? 0.6 : 1,
            borderLeft: isCompleted ? '3px solid var(--green)' : isPast ? '3px solid var(--amber)' : '3px solid var(--border)',
          }}>
            <i className={`fa-solid ${isCompleted ? 'fa-circle-check' : 'fa-calendar-check'}`}
               style={{ color: isCompleted ? 'var(--green)' : 'var(--blue)', fontSize: '1.2rem', width: '26px', textAlign: 'center' }}></i>
            <div className="hce-info" style={{ flex: 1 }}>
              <strong>{milestoneLabel} Check-in</strong>
              <span>
                {isCompleted
                  ? `Completed ${new Date(ci.completed_date!).toLocaleDateString()}`
                  : `Scheduled: ${new Date(ci.scheduled_date).toLocaleDateString()}`}
                {isPast && !isCompleted && ' · Overdue'}
              </span>
            </div>
            {!isCompleted && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className="btn btn-primary"
                  style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                  onClick={() => handleComplete(ci.id)}
                  disabled={isPending}
                >
                  <i className="fa-solid fa-check"></i> Done
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => {
                    setRescheduling(rescheduling === ci.id ? null : ci.id)
                    setNewDate(ci.scheduled_date)
                  }}
                >
                  <i className="fa-solid fa-calendar-pen"></i>
                </button>
              </div>
            )}
            {rescheduling === ci.id && (
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px', width: '100%', paddingLeft: '36px' }}>
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
                  style={{ padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--surface)' }} />
                <button className="btn btn-primary" style={{ fontSize: '0.75rem', padding: '6px 12px' }} onClick={() => handleReschedule(ci.id)} disabled={isPending}>
                  Save
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

**Step 4: Update the team member detail page to use the new components**

Modify `app/(platform)/manager/team/[id]/page.tsx`:
- Replace the static task list with `<TeamMemberTasks tasks={tasks} currentWeek={journey.current_week} />`
- Replace the static check-in timeline with `<CheckInActions checkIns={checkIns} />` section after the JourneyTimeline
- Add proper imports

The page should keep the existing header (name, week, risk badge, coach button) and JourneyTimeline but use the new interactive components for tasks and check-ins.

**Step 5: Commit**

```bash
git add app/(platform)/manager/actions.ts app/(platform)/manager/team/[id]/TeamMemberTasks.tsx app/(platform)/manager/team/[id]/CheckInActions.tsx app/(platform)/manager/team/[id]/page.tsx
git commit -m "feat: manager can complete tasks, mark check-ins done, add notes, approve tasks"
```

---

## Task 3: HR — Edit Employees & Clone Templates

**Files:**
- Create: `components/platform/EditEmployeeModal.tsx`
- Modify: `app/(platform)/hr/employees/actions.ts` (add updateEmployee, deactivateEmployee)
- Modify: `app/(platform)/hr/employees/employees-client.tsx` (add edit button per employee)
- Modify: `app/(platform)/hr/journeys/actions.ts` (add cloneTemplate)
- Modify: `components/platform/TemplateCard.tsx` (add clone button)

**Step 1: Add HR employee actions**

Append to `app/(platform)/hr/employees/actions.ts`:

```typescript
export async function updateEmployee(formData: FormData) {
  const supabase = createSupabaseAdmin()

  const id = formData.get('id') as string
  const fullName = formData.get('full_name') as string
  const role = formData.get('role') as string
  const department = formData.get('department') as string
  const active = formData.get('active') === 'true'

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      role,
      department,
      active,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/hr/employees')
  return { success: true }
}

export async function deactivateEmployee(employeeId: string) {
  const supabase = createSupabaseAdmin()

  await supabase
    .from('profiles')
    .update({ active: false })
    .eq('id', employeeId)

  revalidatePath('/hr/employees')
}

export async function reassignManager(journeyId: string, newManagerId: string) {
  const supabase = createSupabaseAdmin()

  await supabase
    .from('journeys')
    .update({ manager_id: newManagerId })
    .eq('id', journeyId)

  // Also update check-ins
  await supabase
    .from('check_ins')
    .update({ manager_id: newManagerId })
    .eq('journey_id', journeyId)
    .is('completed_date', null)

  revalidatePath('/hr/employees')
  revalidatePath('/manager/dashboard')
}
```

**Step 2: Create EditEmployeeModal**

Create `components/platform/EditEmployeeModal.tsx`:

```typescript
'use client'

import { useState, useTransition } from 'react'
import { updateEmployee } from '@/app/(platform)/hr/employees/actions'

interface Props {
  employee: {
    id: string
    full_name: string
    email: string
    role: string
    department: string | null
    active: boolean
  }
  managers: { id: string; full_name: string }[]
  onClose: () => void
}

export default function EditEmployeeModal({ employee, managers, onClose }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('id', employee.id)
    startTransition(async () => {
      const result = await updateEmployee(formData)
      if (result.error) setError(result.error)
      else onClose()
    })
  }

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", marginBottom: '20px' }}>Edit Employee</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="fg">
            <label>Full Name</label>
            <input name="full_name" type="text" defaultValue={employee.full_name} required />
          </div>
          <div className="fg">
            <label>Email (read-only)</label>
            <input type="email" value={employee.email} disabled style={{ opacity: 0.6 }} />
          </div>
          <div className="fg">
            <label>Role</label>
            <select name="role" defaultValue={employee.role}>
              <option value="new_hire">New Hire</option>
              <option value="manager">Manager</option>
              <option value="hr">HR</option>
            </select>
          </div>
          <div className="fg">
            <label>Department</label>
            <input name="department" type="text" defaultValue={employee.department || ''} />
          </div>
          <div className="fg">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input name="active" type="checkbox" defaultChecked={employee.active} value="true" />
              Active
            </label>
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={isPending} style={{ marginTop: '16px' }}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

**Step 3: Update EmployeesClient to include edit button**

Modify `app/(platform)/hr/employees/employees-client.tsx`:
- Add `useState` for `editingEmployee`
- Add a pencil icon button next to each employee row that opens `EditEmployeeModal`
- Import and render `EditEmployeeModal` when `editingEmployee` is set

**Step 4: Add cloneTemplate action**

Append to `app/(platform)/hr/journeys/actions.ts`:

```typescript
export async function cloneTemplate(templateId: string) {
  const supabase = await createSupabaseServer()
  const user = await getUser()

  // Get original template
  const { data: original } = await supabase
    .from('journey_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (!original) return { error: 'Template not found' }

  // Get original tasks
  const { data: originalTasks } = await supabase
    .from('template_tasks')
    .select('*')
    .eq('template_id', templateId)
    .order('week')
    .order('order')

  // Create new template
  const { data: newTemplate, error } = await supabase
    .from('journey_templates')
    .insert({
      name: `${original.name} (Copy)`,
      description: original.description,
      role_type: original.role_type,
      department: original.department,
      duration_days: original.duration_days,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Clone tasks
  if (originalTasks && originalTasks.length > 0) {
    const taskRows = originalTasks.map((t: any) => ({
      template_id: newTemplate.id,
      title: t.title,
      description: t.description,
      week: t.week,
      assigned_to_role: t.assigned_to_role,
      order: t.order,
    }))
    await supabase.from('template_tasks').insert(taskRows)
  }

  revalidatePath('/hr/journeys')
  return { success: true }
}
```

**Step 5: Update TemplateCard to include clone button**

Modify `components/platform/TemplateCard.tsx`:
- Add import for `cloneTemplate`
- Add a clone button (copy icon) next to the existing delete button
- Wire it up with `useTransition`

**Step 6: Commit**

```bash
git add components/platform/EditEmployeeModal.tsx app/(platform)/hr/employees/ app/(platform)/hr/journeys/actions.ts components/platform/TemplateCard.tsx
git commit -m "feat: HR can edit/deactivate employees and clone journey templates"
```

---

## Task 4: New Hire — Editable Profile Page

**Files:**
- Create: `app/(platform)/hire/profile/page.tsx`
- Create: `components/platform/ProfileForm.tsx`
- Modify: `app/(platform)/hire/actions.ts` (add updateProfile)
- Modify: `components/platform/Sidebar.tsx` (add Profile nav item for new_hire)

**Step 1: Add updateProfile server action**

Append to `app/(platform)/hire/actions.ts`:

```typescript
export async function updateProfile(formData: FormData) {
  const supabase = createSupabaseAdmin()

  const id = formData.get('id') as string
  const fullName = formData.get('full_name') as string
  const phone = formData.get('phone') as string
  const bio = formData.get('bio') as string
  const ecName = formData.get('ec_name') as string
  const ecPhone = formData.get('ec_phone') as string
  const ecRelationship = formData.get('ec_relationship') as string

  const emergencyContact = ecName ? { name: ecName, phone: ecPhone, relationship: ecRelationship } : {}

  await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      phone: phone || null,
      bio: bio || null,
      emergency_contact: emergencyContact,
    })
    .eq('id', id)

  revalidatePath('/hire/profile')
  revalidatePath('/hire/dashboard')
}
```

**Step 2: Create ProfileForm component**

Create `components/platform/ProfileForm.tsx`:

```typescript
'use client'

import { useTransition, useState } from 'react'
import { updateProfile } from '@/app/(platform)/hire/actions'

interface Props {
  profile: {
    id: string
    full_name: string
    email: string
    phone: string | null
    bio: string | null
    emergency_contact: { name?: string; phone?: string; relationship?: string } | null
    avatar_url: string | null
  }
}

export default function ProfileForm({ profile }: Props) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('id', profile.id)
    startTransition(async () => {
      await updateProfile(formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  const ec = profile.emergency_contact || {}

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px' }}>
        <img
          src={profile.avatar_url || `https://i.pravatar.cc/80?u=${profile.id}`}
          alt="avatar"
          style={{ width: '80px', height: '80px', borderRadius: '50%' }}
        />
        <div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", marginBottom: '4px' }}>{profile.full_name}</h2>
          <span style={{ color: 'var(--text3)' }}>{profile.email}</span>
        </div>
      </div>

      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1rem', marginBottom: '12px' }}>Personal Info</h3>
      <div className="fg">
        <label>Full Name</label>
        <input name="full_name" type="text" defaultValue={profile.full_name} required />
      </div>
      <div className="fg">
        <label>Phone</label>
        <input name="phone" type="tel" defaultValue={profile.phone || ''} placeholder="+1 555 123 4567" />
      </div>
      <div className="fg">
        <label>Bio</label>
        <textarea name="bio" defaultValue={profile.bio || ''} placeholder="Tell your team about yourself..."
          style={{ minHeight: '80px', padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--surface)', width: '100%', resize: 'vertical' }} />
      </div>

      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1rem', margin: '24px 0 12px' }}>Emergency Contact</h3>
      <div className="fg">
        <label>Name</label>
        <input name="ec_name" type="text" defaultValue={ec.name || ''} placeholder="Contact name" />
      </div>
      <div className="fg">
        <label>Phone</label>
        <input name="ec_phone" type="tel" defaultValue={ec.phone || ''} placeholder="+1 555 987 6543" />
      </div>
      <div className="fg">
        <label>Relationship</label>
        <input name="ec_relationship" type="text" defaultValue={ec.relationship || ''} placeholder="Spouse, Parent, etc." />
      </div>

      <button type="submit" className="btn btn-primary" disabled={isPending} style={{ marginTop: '16px' }}>
        {isPending ? 'Saving...' : saved ? 'Saved!' : 'Save Profile'}
      </button>
    </form>
  )
}
```

**Step 3: Create the profile page**

Create `app/(platform)/hire/profile/page.tsx`:

```typescript
import { getUser } from '@/lib/auth/get-user'
import ProfileForm from '@/components/platform/ProfileForm'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const user = await getUser()

  return (
    <div style={{ padding: '32px', maxWidth: '600px' }}>
      <h1 style={{ fontFamily: "'Outfit', sans-serif", marginBottom: '24px' }}>My Profile</h1>
      <ProfileForm profile={user} />
    </div>
  )
}
```

**Step 4: Add Profile to new_hire sidebar navigation**

Modify `components/platform/Sidebar.tsx` — add to `new_hire` nav items array:

```typescript
{ icon: 'fa-solid fa-user', label: 'Profile', href: '/hire/profile' },
```

**Step 5: Commit**

```bash
git add app/(platform)/hire/profile/ components/platform/ProfileForm.tsx app/(platform)/hire/actions.ts components/platform/Sidebar.tsx
git commit -m "feat: new hire editable profile page with personal info and emergency contact"
```

---

## Task 5: Dynamic Onboarding Forms (HR creates, New Hire fills)

**Files:**
- Create: `app/(platform)/hr/forms/page.tsx`
- Create: `app/(platform)/hr/forms/actions.ts`
- Create: `components/platform/FormBuilder.tsx`
- Create: `components/platform/FormRenderer.tsx`
- Create: `app/(platform)/hire/forms/page.tsx`
- Create: `lib/db/queries/forms.ts`
- Modify: `components/platform/Sidebar.tsx` (add Forms nav item for HR and New Hire)
- Modify: `app/(platform)/hire/actions.ts` (add submitForm)

**Step 1: Create forms query file**

Create `lib/db/queries/forms.ts`:

```typescript
import { createSupabaseAdmin } from '@/lib/db/supabase-server'

export async function getAllForms() {
  const supabase = createSupabaseAdmin()
  const { data } = await supabase
    .from('onboarding_forms')
    .select('*')
    .order('created_at', { ascending: false })
  return data || []
}

export async function getFormsForEmployee(employeeId: string, journeyId: string | null) {
  const supabase = createSupabaseAdmin()

  const { data: forms } = await supabase
    .from('onboarding_forms')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: submissions } = await supabase
    .from('form_submissions')
    .select('form_id')
    .eq('employee_id', employeeId)

  const submittedFormIds = new Set((submissions || []).map((s: any) => s.form_id))

  return (forms || []).map((f: any) => ({
    ...f,
    submitted: submittedFormIds.has(f.id),
  }))
}

export async function getFormSubmissions(formId?: string) {
  const supabase = createSupabaseAdmin()
  let query = supabase
    .from('form_submissions')
    .select('*, employee:profiles!employee_id(full_name, email, department), form:onboarding_forms!form_id(title)')
    .order('submitted_at', { ascending: false })

  if (formId) query = query.eq('form_id', formId)

  const { data } = await query
  return data || []
}
```

**Step 2: Create HR forms actions**

Create `app/(platform)/hr/forms/actions.ts`:

```typescript
'use server'

import { createSupabaseAdmin } from '@/lib/db/supabase-server'
import { getUser } from '@/lib/auth/get-user'
import { revalidatePath } from 'next/cache'

export async function createForm(formData: FormData) {
  const supabase = createSupabaseAdmin()
  const user = await getUser()

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const department = formData.get('department') as string
  const fields = formData.get('fields') as string

  const { error } = await supabase
    .from('onboarding_forms')
    .insert({
      title,
      description,
      department: department || null,
      fields: JSON.parse(fields),
      created_by: user.id,
    })

  if (error) return { error: error.message }

  revalidatePath('/hr/forms')
  return { success: true }
}

export async function deleteForm(formId: string) {
  const supabase = createSupabaseAdmin()
  await supabase.from('onboarding_forms').delete().eq('id', formId)
  revalidatePath('/hr/forms')
}
```

**Step 3: Create FormBuilder component**

Create `components/platform/FormBuilder.tsx` — a modal with:
- Title, Description, Department inputs
- Dynamic field list where each field has: label, type (select from text/textarea/select/date/checkbox/email/phone), required (checkbox), placeholder, options (only for select type)
- "Add Field" button to append fields
- "Remove" button per field
- "Save Form" button that serializes fields to JSON and calls `createForm`

The component should manage an array of field objects in state and serialize them to the `fields` hidden input on submit.

**Step 4: Create FormRenderer component**

Create `components/platform/FormRenderer.tsx` — renders a form from its `fields` JSONB:
- Iterates over `fields` array and renders appropriate input per type
- Collects answers in state as `Record<string, string | boolean>`
- On submit, calls `submitForm` action

**Step 5: Create the HR forms page**

Create `app/(platform)/hr/forms/page.tsx`:
- Lists all forms with title, department, field count, created date
- "Create Form" button opens FormBuilder modal
- "View Submissions" link per form (shows submissions inline or in section below)
- Delete button per form

**Step 6: Create the New Hire forms page**

Create `app/(platform)/hire/forms/page.tsx`:
- Lists available forms with submitted/pending badge
- Click to expand and fill with FormRenderer
- Submitted forms show "Completed" badge and are non-editable

**Step 7: Add submitForm action**

Append to `app/(platform)/hire/actions.ts`:

```typescript
export async function submitForm(formId: string, journeyId: string | null, answers: Record<string, string | boolean>) {
  const supabase = createSupabaseAdmin()

  // Get user from the action context — we need getUser here
  const { getUser: getUserFn } = await import('@/lib/auth/get-user')
  const user = await getUserFn()

  await supabase
    .from('form_submissions')
    .insert({
      form_id: formId,
      employee_id: user.id,
      journey_id: journeyId,
      answers,
    })

  revalidatePath('/hire/forms')
}
```

**Step 8: Update Sidebar with Forms links**

Modify `components/platform/Sidebar.tsx`:
- Add to `hr` array: `{ icon: 'fa-solid fa-file-circle-check', label: 'Forms', href: '/hr/forms' }`
- Add to `new_hire` array: `{ icon: 'fa-solid fa-file-pen', label: 'Forms', href: '/hire/forms' }`

**Step 9: Commit**

```bash
git add lib/db/queries/forms.ts app/(platform)/hr/forms/ components/platform/FormBuilder.tsx components/platform/FormRenderer.tsx app/(platform)/hire/forms/ app/(platform)/hire/actions.ts components/platform/Sidebar.tsx
git commit -m "feat: dynamic onboarding forms — HR creates, new hire fills"
```

---

## Task 6: New Hire — Feedback Surveys & Mark Resources Read

**Files:**
- Create: `components/platform/FeedbackModal.tsx`
- Modify: `app/(platform)/hire/actions.ts` (add submitFeedback, markResourceRead)
- Modify: `app/(platform)/hire/resources/page.tsx` (add read button per resource)
- Modify: `app/(platform)/hire/dashboard/page.tsx` (add feedback prompt at milestones)

**Step 1: Add feedback and resource actions**

Append to `app/(platform)/hire/actions.ts`:

```typescript
export async function submitFeedback(journeyId: string, milestone: string, rating: number, comments: string) {
  const supabase = createSupabaseAdmin()
  const { getUser: getUserFn } = await import('@/lib/auth/get-user')
  const user = await getUserFn()

  await supabase
    .from('feedback_surveys')
    .insert({
      journey_id: journeyId,
      employee_id: user.id,
      milestone,
      rating,
      comments: comments || null,
    })

  revalidatePath('/hire/dashboard')
}

export async function markResourceRead(resourceId: string, userId: string) {
  const supabase = createSupabaseAdmin()

  // Get current read_by array
  const { data: resource } = await supabase
    .from('resources')
    .select('read_by')
    .eq('id', resourceId)
    .single()

  const currentReadBy: string[] = resource?.read_by || []
  if (!currentReadBy.includes(userId)) {
    await supabase
      .from('resources')
      .update({ read_by: [...currentReadBy, userId] })
      .eq('id', resourceId)
  }

  revalidatePath('/hire/resources')
}
```

**Step 2: Create FeedbackModal**

Create `components/platform/FeedbackModal.tsx`:

```typescript
'use client'

import { useState, useTransition } from 'react'
import { submitFeedback } from '@/app/(platform)/hire/actions'

interface Props {
  journeyId: string
  milestone: string
  onClose: () => void
}

export default function FeedbackModal({ journeyId, milestone, onClose }: Props) {
  const [rating, setRating] = useState(0)
  const [comments, setComments] = useState('')
  const [isPending, startTransition] = useTransition()

  const milestoneLabel = milestone.replace('_', ' ').replace('day', 'Day ')

  function handleSubmit() {
    if (rating === 0) return
    startTransition(async () => {
      await submitFeedback(journeyId, milestone, rating, comments)
      onClose()
    })
  }

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: '480px' }}>
        <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", marginBottom: '8px' }}>
          How is your onboarding going?
        </h2>
        <p style={{ color: 'var(--text3)', marginBottom: '20px' }}>
          {milestoneLabel} milestone — share your experience so far.
        </p>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '2rem', color: star <= rating ? 'var(--amber, #ffa726)' : 'var(--text4)',
                transition: 'transform 0.15s',
                transform: star <= rating ? 'scale(1.15)' : 'scale(1)',
              }}
            >
              <i className="fa-solid fa-star"></i>
            </button>
          ))}
        </div>

        <div className="fg">
          <label>Comments (optional)</label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="What's going well? What could be better?"
            style={{ minHeight: '80px', padding: '10px', border: '1px solid var(--border)', borderRadius: 'var(--r)', background: 'var(--surface)', width: '100%', resize: 'vertical' }}
          />
        </div>

        <button
          className="btn btn-primary btn-block"
          onClick={handleSubmit}
          disabled={isPending || rating === 0}
          style={{ marginTop: '16px' }}
        >
          {isPending ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>
    </div>
  )
}
```

**Step 3: Update resources page to show read status and mark-read button**

Modify `app/(platform)/hire/resources/page.tsx`:
- Make it a client component wrapper or create a `ResourceItem` client component
- Each resource shows a green checkmark if `read_by` includes current user ID
- Add a "Mark as Read" button that calls `markResourceRead`

**Step 4: Add feedback prompt to hire dashboard**

Modify `app/(platform)/hire/dashboard/page.tsx`:
- Query `feedback_surveys` for this journey
- For each completed check-in where no feedback survey exists yet, show a prompt banner
- Clicking opens FeedbackModal

**Step 5: Commit**

```bash
git add components/platform/FeedbackModal.tsx app/(platform)/hire/actions.ts app/(platform)/hire/resources/page.tsx app/(platform)/hire/dashboard/page.tsx
git commit -m "feat: new hire feedback surveys at milestones and mark resources as read"
```

---

## Task 7: New Hire — View Manager Tasks in Dashboard

**Files:**
- Modify: `app/(platform)/hire/dashboard/page.tsx`

**Step 1: Add manager tasks section to dashboard**

In `app/(platform)/hire/dashboard/page.tsx`, after the "This Week's Tasks" section, add a new section "Your Manager's Tasks" that shows tasks where `assigned_to_role === 'manager'` for the current week:

```typescript
const managerTasks = tasks.filter((t: any) => t.week === journey.current_week && t.assigned_to_role === 'manager')
```

Render them as read-only items (no checkbox) showing status icon:
- `completed` → green check
- `pending` → gray circle
- Shows task title and status text

**Step 2: Commit**

```bash
git add app/(platform)/hire/dashboard/page.tsx
git commit -m "feat: new hire can see manager's task progress in dashboard"
```

---

## Task 8: HR — Check-ins & Feedback in Analytics

**Files:**
- Modify: `app/(platform)/hr/analytics/page.tsx`

**Step 1: Add check-ins overview section**

Query all check-ins with their journey/employee data:

```typescript
const { data: allCheckIns } = await supabase
  .from('check_ins')
  .select('*, journey:journeys!journey_id(employee:profiles!employee_id(full_name, department)), manager:profiles!manager_id(full_name)')
  .order('scheduled_date', { ascending: true })
```

Add a "Check-ins Overview" section below the existing two-column layout showing:
- Total check-ins / Completed / Overdue counts as mini KPIs
- List of upcoming/overdue check-ins with employee name, manager name, milestone, date, status

**Step 2: Add feedback surveys section**

Query all feedback surveys:

```typescript
const { data: allFeedback } = await supabase
  .from('feedback_surveys')
  .select('*, employee:profiles!employee_id(full_name)')
  .order('created_at', { ascending: false })
  .limit(20)
```

Add a "Feedback & NPS" section showing:
- Average rating across all surveys (displayed as stars)
- Recent feedback entries (employee name, milestone, rating, comments snippet)

**Step 3: Commit**

```bash
git add app/(platform)/hr/analytics/page.tsx
git commit -m "feat: HR analytics shows check-in overview and feedback surveys"
```

---

## Task 9: Transversal — Journey Completion Flow & Mark All Read

**Files:**
- Modify: `components/platform/NotificationBell.tsx` (add mark-all-read button)
- Modify: `app/(platform)/hire/actions.ts` (add checkJourneyCompletion)
- Modify: `app/(platform)/hire/dashboard/page.tsx` (show completion state)

**Step 1: Add mark-all-read to NotificationBell**

Modify `components/platform/NotificationBell.tsx`:
- Add a "Mark all read" button in the `notif-header` div
- On click, update all unread notifications for this user:

```typescript
async function markAllRead() {
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)

  setNotifications(prev => prev.map(n => ({ ...n, read: true })))
}
```

**Step 2: Add journey completion check**

After `toggleTaskComplete` in `app/(platform)/hire/actions.ts`, check if all tasks are completed:

```typescript
// After updating the task, check if all tasks in the journey are completed
const { data: journeyTasks } = await supabase
  .from('journey_tasks')
  .select('status')
  .eq('journey_id', journeyId)

// journeyId needs to be resolved — query from the task
const { data: task } = await supabase
  .from('journey_tasks')
  .select('journey_id')
  .eq('id', taskId)
  .single()

if (task && completed) {
  const { data: allTasks } = await supabase
    .from('journey_tasks')
    .select('status')
    .eq('journey_id', task.journey_id)

  const allCompleted = allTasks?.every((t: any) => t.status === 'completed')
  if (allCompleted) {
    await supabase
      .from('journeys')
      .update({ status: 'completed' })
      .eq('id', task.journey_id)

    // Notify HR and manager
    const { data: journey } = await supabase
      .from('journeys')
      .select('manager_id, employee_id, employee:profiles!employee_id(full_name)')
      .eq('id', task.journey_id)
      .single()

    if (journey) {
      const { data: hrUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'hr')

      const notifs = [
        { user_id: journey.manager_id, type: 'milestone', title: 'Journey Completed', message: `${(journey as any).employee?.full_name} has completed their onboarding journey!` },
        ...(hrUsers || []).map((hr: any) => ({
          user_id: hr.id, type: 'milestone', title: 'Journey Completed', message: `${(journey as any).employee?.full_name} has completed their onboarding journey!`,
        })),
      ]

      await supabase.from('notifications').insert(notifs)
    }
  }
}
```

**Step 3: Show completion state in dashboard**

Modify `app/(platform)/hire/dashboard/page.tsx`:
- If `journey.status === 'completed'`, show a congratulations banner instead of the regular dashboard content

**Step 4: Commit**

```bash
git add components/platform/NotificationBell.tsx app/(platform)/hire/actions.ts app/(platform)/hire/dashboard/page.tsx
git commit -m "feat: journey auto-completes when all tasks done, mark all notifications read"
```

---

## Task 10: Functional Escalation in AI Chatbot

**Files:**
- Modify: `lib/ai/tools/request-help.ts`

**Step 1: Extend requestHelp to also notify HR users**

Modify `lib/ai/tools/request-help.ts` to also create notifications for all HR users:

```typescript
// After inserting manager notification...

// Also notify all HR users
const { data: hrUsers } = await supabase
  .from('profiles')
  .select('id')
  .eq('role', 'hr')
  .eq('active', true)

if (hrUsers && hrUsers.length > 0) {
  const hrNotifs = hrUsers.map((hr: any) => ({
    user_id: hr.id,
    type: 'nudge' as const,
    title: 'Help Request Escalated',
    message: `A new hire has requested help: ${message}`,
    action_url: `/hr/employees`,
  }))

  await supabase.from('notifications').insert(hrNotifs)
}
```

**Step 2: Commit**

```bash
git add lib/ai/tools/request-help.ts
git commit -m "feat: escalation notifications sent to both manager and all HR users"
```

---

## Summary

| Task | What it delivers | Files touched |
|------|-----------------|---------------|
| 1 | Database schema for all new features | migration, types |
| 2 | Manager: complete tasks, check-ins, notes, approval | 4 new + 1 modified |
| 3 | HR: edit employees, clone templates | 1 new + 3 modified |
| 4 | New Hire: editable profile | 2 new + 2 modified |
| 5 | Dynamic forms (HR → New Hire) | 5 new + 2 modified |
| 6 | Feedback surveys + mark resources read | 1 new + 3 modified |
| 7 | New Hire sees manager task progress | 1 modified |
| 8 | HR analytics: check-ins + feedback | 1 modified |
| 9 | Journey completion + mark all read | 3 modified |
| 10 | Escalation to HR via chatbot | 1 modified |

**Total: ~15 new files, ~15 modified files, 10 commits**
