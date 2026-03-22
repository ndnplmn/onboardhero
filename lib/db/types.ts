export type UserRole = 'hr' | 'manager' | 'new_hire'
export type JourneyStatus = 'not_started' | 'in_progress' | 'completed' | 'at_risk'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'
export type Milestone = 'day_7' | 'day_14' | 'day_30' | 'day_60' | 'day_90'
export type NotificationType = 'nudge' | 'risk_alert' | 'milestone' | 'task_due' | 'checkin_reminder'
export type ResourceType = 'document' | 'video' | 'link' | 'contact'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  department: string | null
  avatar_url: string | null
  created_at: string
}

export interface JourneyTemplate {
  id: string
  name: string
  description: string
  role_type: string
  department: string
  duration_days: number
  ai_generated: boolean
  created_by: string
  created_at: string
}

export interface TemplateTask {
  id: string
  template_id: string
  title: string
  description: string
  week: number
  assigned_to_role: UserRole
  order: number
}

export interface Journey {
  id: string
  employee_id: string
  template_id: string
  manager_id: string
  status: JourneyStatus
  start_date: string
  current_week: number
  risk_score: number
  risk_reasons: string[]
  sentiment_score: number
  created_at: string
}

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
}

export interface CheckIn {
  id: string
  journey_id: string
  manager_id: string
  milestone: Milestone
  scheduled_date: string
  completed_date: string | null
  ai_agenda: string | null
  ai_summary: string | null
  notes: string | null
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  action_url: string | null
  created_at: string
}

export interface Resource {
  id: string
  title: string
  type: ResourceType
  content: string | null
  url: string | null
  department: string | null
  ai_generated: boolean
  created_at: string
}

export interface AIConversation {
  id: string
  user_id: string
  journey_id: string | null
  preset: string
  messages: { role: string; content: string; timestamp: string }[]
  created_at: string
}
