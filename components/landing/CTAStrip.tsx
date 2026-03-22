export default function CTAStrip() {
  return (
    <section className="cta-strip">
      <div className="container">
        <div className="cta-inner">
          <div className="cta-bg-ring r1"></div>
          <div className="cta-bg-ring r2"></div>
          <img src="/ONBOARD_HERO_LOGO.png" alt="OnboardHero" className="cta-logo" />
          <h2>Ready to transform your onboarding?</h2>
          <p>Join 500+ companies giving every new hire the best possible start.</p>
          <a href="#pricing" className="btn btn-white btn-lg">Get started free <i className="fa-solid fa-arrow-right"></i></a>
        </div>
      </div>
    </section>
  )
}
