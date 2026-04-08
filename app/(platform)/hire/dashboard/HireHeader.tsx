'use client'

export default function HireHeader() {
  function openAura() {
    window.dispatchEvent(new CustomEvent('aura-open'))
  }

  return (
    <header className="db-header">
      <div className="db-header-left">
        <h1>My Journey</h1>
        <p>Track your progress, access resources, and meet your team.</p>
      </div>
      <div className="db-header-actions">
        <button className="btn btn-outline btn-sm" onClick={openAura}>
          <i className="fa-solid fa-circle-question" /> Get Help
        </button>
      </div>
    </header>
  )
}
