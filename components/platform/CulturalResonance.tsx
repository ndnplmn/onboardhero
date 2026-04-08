'use client'

import React from 'react'
import { motion } from 'framer-motion'

export default function CulturalResonance() {
  return (
    <div className="pro-max-card cultural-resonance-card" style={{ padding: '24px' }}>
      <div className="res-header">
        <div className="res-title">
          <i className="fa-solid fa-brain" style={{ color: 'var(--purple)' }}></i>
          <h3>Cultural Resonance</h3>
        </div>
        <div className="badge-ai">Predictive AI</div>
      </div>

      <div className="res-hero">
        <div className="res-value">94.8%</div>
        <div className="res-label">Global Engagement Index</div>
        <div className="res-trend up">+2.4% vs last month</div>
      </div>

      <div className="res-viz">
        <svg viewBox="0 0 400 100" className="res-svg">
          <defs>
            <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--cyan)" />
              <stop offset="50%" stopColor="var(--purple)" />
              <stop offset="100%" stopColor="var(--blue)" />
            </linearGradient>
          </defs>
          <motion.path
            d="M0,50 Q50,20 100,50 T200,50 T300,50 T400,50"
            fill="none"
            stroke="url(#waveGrad)"
            strokeWidth="3"
            strokeLinecap="round"
            animate={{
              d: [
                "M0,50 Q50,20 100,50 T200,50 T300,50 T400,50",
                "M0,50 Q50,80 100,50 T200,50 T300,50 T400,50",
                "M0,50 Q50,20 100,50 T200,50 T300,50 T400,50"
              ]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path
            d="M0,50 Q50,80 100,50 T200,50 T300,50 T400,50"
            fill="none"
            stroke="var(--cyan)"
            strokeWidth="1"
            opacity="0.2"
            animate={{
              d: [
                "M0,50 Q50,80 100,50 T200,50 T300,50 T400,50",
                "M0,50 Q50,20 100,50 T200,50 T300,50 T400,50",
                "M0,50 Q50,80 100,50 T200,50 T300,50 T400,50"
              ]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
        </svg>
      </div>

      <div className="res-grid">
        <div className="res-item">
          <span>Alignment</span>
          <strong>96%</strong>
        </div>
        <div className="res-item">
          <span>Sentiment</span>
          <strong>Positive</strong>
        </div>
        <div className="res-item">
          <span>Retention Risk</span>
          <strong className="low">2.1%</strong>
        </div>
      </div>

      <style jsx>{`
        .res-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .res-title { display: flex; align-items: center; gap: 10px; }
        .res-title h3 { font-size: 15px; font-weight: 800; color: var(--text); }

        .res-hero { text-align: center; margin-bottom: 15px; }
        .res-value { font-size: 42px; font-weight: 900; letter-spacing: -2px; color: var(--text); }
        .res-label { font-size: 11px; font-weight: 600; color: var(--text3); margin: 2px 0; }
        .res-trend { font-size: 10px; font-weight: 700; color: var(--green); background: var(--green-light); padding: 2px 8px; border-radius: 4px; display: inline-block; }
        .res-trend.up::before { content: '↑ '; }

        .res-viz { height: 60px; margin: 10px 0; }
        .res-svg { width: 100%; height: 100%; }

        .res-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border); }
        .res-item span { display: block; font-size: 9px; font-weight: 700; color: var(--text3); text-transform: uppercase; margin-bottom: 2px; }
        .res-item strong { display: block; font-size: 14px; font-weight: 800; color: var(--text); }
        .res-item strong.low { color: var(--green); }
      `}</style>
    </div>
  )
}
