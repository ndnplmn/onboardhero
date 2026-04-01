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
      <div className="section-reveal"><LogosBar /></div>
      <div className="section-reveal"><HowItWorks /></div>
      <div className="section-reveal"><Benefits /></div>
      <div className="section-reveal"><Features /></div>
      <div className="section-reveal"><Pricing /></div>
      <div className="section-reveal"><FAQ /></div>
      <div className="section-reveal"><CTAStrip /></div>
      <Footer />
    </div>
  )
}
