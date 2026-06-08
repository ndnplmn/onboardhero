'use client'

import React from 'react'
import TaskList from './TaskList'

interface Task {
  id: string
  title: string
  description: string
  week: number
  status: string
  assigned_to_role: string
}

interface ManagerPendingTasksProps {
  tasks?: Task[]
}

export default function ManagerPendingTasks({ tasks = [] }: ManagerPendingTasksProps) {
  const pending = tasks.filter(t => t.status !== 'completed').slice(0, 5)
  const highPriority = pending.filter(t => t.week <= 2).length

  return (
    <div className="db-card">
      <div className="db-card-hd">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <h3>
            <i className="fa-solid fa-list-check" style={{ color: 'var(--blue)', marginRight: '6px' }} />
            Manager&apos;s Pending Tasks
          </h3>
          {highPriority > 0 && (
            <span className="badge-ai" style={{ fontSize: '10px' }}>
              <i className="fa-solid fa-bolt" /> {highPriority} High Priority
            </span>
          )}
        </div>
      </div>
      <div className="db-card-bd">
        {pending.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--text3)' }}>
            <i className="fa-solid fa-circle-check" style={{ fontSize: 22, color: 'var(--green)', display: 'block', marginBottom: 8 }} />
            <p style={{ fontSize: 13, fontWeight: 500 }}>All caught up — no pending tasks.</p>
          </div>
        ) : (
          <TaskList tasks={pending} />
        )}
        <a href="/manager/tasks" className="btn btn-outline btn-sm w-full mt-4" style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
          Go to Task Center
        </a>
      </div>
    </div>
  )
}
