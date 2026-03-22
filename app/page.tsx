import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import LogosBar from '@/components/landing/LogosBar'
import HowItWorks from '@/components/landing/HowItWorks'
import Benefits from '@/components/landing/Benefits'
import Features from '@/components/landing/Features'
import Pricing from '@/components/landing/Pricing'
import FAQ from '@/components/landing/FAQ'
import CTAStrip from '@/components/landing/CTAStrip'
import Footer from '@/components/landing/Footer'

export default function LandingPage() {
  return (
    <div id="page-landing" className="page active">
      <Navbar />
      <Hero />
      <LogosBar />
      <HowItWorks />
      <Benefits />
      <Features />
      <Pricing />
      <FAQ />
      <CTAStrip />
      <Footer />
    </div>
  )
}
