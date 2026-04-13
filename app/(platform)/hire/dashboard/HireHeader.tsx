'use client'

export default function HireHeader() {
  function openAura() {
    window.dispatchEvent(new CustomEvent('aura-open'))
  }

  return (
    <div className="db-header">
      <div className="db-header-left">
        <h1>My Journey</h1>
        <p>Track your progress, access resources, and meet your team.</p>
      </div>
      <div className="db-header-actions">
        <button className="btn btn-outline btn-sm" onClick={openAura} aria-label="Open AI assistant for help">
          <i className="fa-solid fa-circle-question" aria-hidden="true" /> Get Help
        </button>
      </div>
    </div>
  )
}
