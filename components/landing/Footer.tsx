export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <img src="/ONBOARD_HERO_LOGO.png" alt="OnboardHero" className="footer-logo" />
            <p>The onboarding platform built for HR teams, managers, and new hires — all in one place.</p>
            <div className="footer-social">
              <a href="#"><i className="fa-brands fa-linkedin"></i></a>
              <a href="#"><i className="fa-brands fa-twitter"></i></a>
              <a href="#"><i className="fa-brands fa-github"></i></a>
            </div>
          </div>
          <div className="footer-col"><h5>Product</h5><a href="#">Features</a><a href="#">Pricing</a><a href="#">Integrations</a><a href="#">Changelog</a></div>
          <div className="footer-col"><h5>Company</h5><a href="#">About us</a><a href="#">Careers</a><a href="#">Blog</a><a href="#">Contact</a></div>
          <div className="footer-col"><h5>Resources</h5><a href="#">Documentation</a><a href="#">Help Center</a><a href="#">Templates</a><a href="#">Webinars</a></div>
        </div>
        <div className="footer-bottom">
          <span>&copy; 2025 OnboardHero, Inc. All rights reserved.</span>
          <div className="footer-legal"><a href="#">Privacy</a><a href="#">Terms</a><a href="#">Cookies</a></div>
        </div>
      </div>
    </footer>
  )
}
