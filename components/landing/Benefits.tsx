export default function Benefits() {
  return (
    <section className="section benefits" id="benefits">
      <div className="container">
        <div className="sec-head">
          <span className="sec-tag">Benefits</span>
          <h2>Built for every stakeholder</h2>
          <p>OnboardHero speaks the language of HR leaders, team managers, and excited new hires alike.</p>
        </div>
        <div className="bene-grid">
          <div className="bene-card">
            <div className="bene-icon cyan-icon"><i className="fa-solid fa-chart-line"></i></div>
            <h3>For HR Teams</h3>
            <ul>
              <li><i className="fa-solid fa-check"></i> Design reusable onboarding journeys</li>
              <li><i className="fa-solid fa-check"></i> Track all new hires in one place</li>
              <li><i className="fa-solid fa-check"></i> Identify at-risk employees early</li>
              <li><i className="fa-solid fa-check"></i> Generate onboarding reports</li>
              <li><i className="fa-solid fa-check"></i> Reduce manual follow-up by 70%</li>
            </ul>
          </div>
          <div className="bene-card">
            <div className="bene-icon blue-icon"><i className="fa-solid fa-users"></i></div>
            <h3>For Managers</h3>
            <ul>
              <li><i className="fa-solid fa-check"></i> See new hire milestones at a glance</li>
              <li><i className="fa-solid fa-check"></i> Get notified on key check-in points</li>
              <li><i className="fa-solid fa-check"></i> Assign tasks and set first objectives</li>
              <li><i className="fa-solid fa-check"></i> Leave structured feedback</li>
              <li><i className="fa-solid fa-check"></i> Manage multiple new hires easily</li>
            </ul>
          </div>
          <div className="bene-card">
            <div className="bene-icon aqua-icon"><i className="fa-solid fa-star"></i></div>
            <h3>For New Hires</h3>
            <ul>
              <li><i className="fa-solid fa-check"></i> Understand what&#39;s expected each week</li>
              <li><i className="fa-solid fa-check"></i> Track personal progress in real-time</li>
              <li><i className="fa-solid fa-check"></i> Access key resources and contacts</li>
              <li><i className="fa-solid fa-check"></i> Feel guided, not overwhelmed</li>
              <li><i className="fa-solid fa-check"></i> Hit first milestones with confidence</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
