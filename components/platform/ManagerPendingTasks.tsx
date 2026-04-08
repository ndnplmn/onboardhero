'use client'

import React from 'react'
import TaskList from './TaskList'

const MOCK_MANAGER_TASKS = [
  { id: 'mt1', title: 'Schedule Week 1 Check-in', description: 'Meet with Liam Evans for his initial integration review.', week: 1, status: 'pending', assigned_to_role: 'manager' },
  { id: 'mt3', title: 'Assigned Buddy for Priya', description: 'Ensure Priya has a clear social buddy for the technical onboarding phase.', week: 2, status: 'pending', assigned_to_role: 'manager' },
  { id: 'mt5', title: 'Conduct Performance Review', description: 'Final onboarding review for James Wilson (Day 90).', week: 12, status: 'pending', assigned_to_role: 'manager' },
]

export default function ManagerPendingTasks() {
  return (
    <div className="db-card">
      <div className="db-card-hd">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <h3>
            <i className="fa-solid fa-list-check" style={{ color: 'var(--blue)', marginRight: '6px' }}></i> 
            Manager&apos;s Pending Tasks
          </h3>
          <span className="badge-ai" style={{ fontSize: '10px' }}>
            <i className="fa-solid fa-bolt"></i> High Priority
          </span>
        </div>
      </div>
      <div className="db-card-bd">
        <TaskList tasks={MOCK_MANAGER_TASKS} />
        <button className="btn btn-outline btn-sm w-full mt-4">Go to Task Center</button>
      </div>
    </div>
  )
}
