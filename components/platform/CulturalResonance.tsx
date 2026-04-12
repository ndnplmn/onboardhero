'use client'

import { motion } from 'framer-motion'

export default function CulturalResonance() {
  return (
    <div className="db-card" style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <i className="fa-solid fa-brain" style={{ color: 'var(--purple)' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)' }}>Cultural Resonance</h3>
        </div>
        <div className="badge-ai">Predictive AI</div>
      </div>

      {/* Hero metric */}
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <div style={{ fontSize: '42px', fontWeight: 900, letterSpacing: '-2px', color: 'var(--text)' }}>94.8%</div>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text3)', margin: '2px 0' }}>Global Engagement Index</div>
        <span style={{
          fontSize: '10px', fontWeight: 700,
          color: 'var(--green)',
          background: 'var(--green-bg)',
          padding: '2px 8px',
          borderRadius: '4px',
          display: 'inline-block',
        }}>
          ↑ +2.4% vs last month
        </span>
      </div>

      {/* Wave SVG */}
      <div style={{ height: '60px', margin: '10px 0' }}>
        <svg viewBox="0 0 400 100" style={{ width: '100%', height: '100%' }}>
          <defs>
            <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="var(--cyan)" />
              <stop offset="50%"  stopColor="var(--purple)" />
              <stop offset="100%" stopColor="var(--blue)" />
            </linearGradient>
          </defs>
          <motion.path
            d="M0,50 Q50,20 100,50 T200,50 T300,50 T400,50"
            fill="none"
            stroke="url(#waveGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            animate={{ d: [
              "M0,50 Q50,20 100,50 T200,50 T300,50 T400,50",
              "M0,50 Q50,80 100,50 T200,50 T300,50 T400,50",
              "M0,50 Q50,20 100,50 T200,50 T300,50 T400,50",
            ]}}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.path
            d="M0,50 Q50,80 100,50 T200,50 T300,50 T400,50"
            fill="none"
            stroke="var(--cyan)"
            strokeWidth="1"
            opacity="0.2"
            animate={{ d: [
              "M0,50 Q50,80 100,50 T200,50 T300,50 T400,50",
              "M0,50 Q50,20 100,50 T200,50 T300,50 T400,50",
              "M0,50 Q50,80 100,50 T200,50 T300,50 T400,50",
            ]}}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
        marginTop: '15px', paddingTop: '15px', borderTop: '1px solid var(--border)',
      }}>
        {[
          { label: 'Alignment',      value: '96%',      highlight: false },
          { label: 'Sentiment',      value: 'Positive', highlight: false },
          { label: 'Retention Risk', value: '2.1%',     highlight: true  },
        ].map(item => (
          <div key={item.label}>
            <span style={{ display: 'block', fontSize: '9px', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '2px' }}>
              {item.label}
            </span>
            <strong style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: item.highlight ? 'var(--green)' : 'var(--text)' }}>
              {item.value}
            </strong>
          </div>
        ))}
      </div>
    </div>
  )
}
