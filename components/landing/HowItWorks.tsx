export default function HowItWorks() {
  return (
    <section className="section how" id="how-it-works">
      <div className="container">
        <div className="sec-head">
          <span className="sec-tag">Process</span>
          <h2>Onboarding that actually works</h2>
          <p>Three stakeholders. One platform. A clear journey from offer to full productivity.</p>
        </div>
        <div className="how-grid">
          <div className="how-card">
            <div className="how-num">01</div>
            <div className="how-icon cyan-icon"><i className="fa-solid fa-map-location-dot"></i></div>
            <h3>HR designs the journey</h3>
            <p>Build 90-day onboarding templates with milestones and automated triggers — once, for every future hire.</p>
          </div>
          <div className="how-arrow"><i className="fa-solid fa-arrow-right"></i></div>
          <div className="how-card">
            <div className="how-num">02</div>
            <div className="how-icon blue-icon"><i className="fa-solid fa-person-chalkboard"></i></div>
            <h3>Managers guide &amp; support</h3>
            <p>Managers get clear visibility into progress, key milestones, and action items — without admin overhead.</p>
          </div>
          <div className="how-arrow"><i className="fa-solid fa-arrow-right"></i></div>
          <div className="how-card">
            <div className="how-num">03</div>
            <div className="how-icon aqua-icon"><i className="fa-solid fa-seedling"></i></div>
            <h3>New hires thrive from day one</h3>
            <p>A clear roadmap, warm welcome, and structured path forward helps every new hire feel confident and ready.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
