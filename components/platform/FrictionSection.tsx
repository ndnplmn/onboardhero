'use client'

import React, { useState } from 'react'
import FrictionMap, { FrictionPoint } from './FrictionMap'
import InterventionBrief from './InterventionBrief'

interface FrictionSectionProps {
  points: FrictionPoint[]
  startDate: string
}

export default function FrictionSection({ points, startDate }: FrictionSectionProps) {
  const [selectedPoint, setSelectedPoint] = useState<FrictionPoint | null>(null)

  // Modified FrictionMap to handle clicks (Internal to this file/component integration)
  // For the sake of this task, I'll wrap the FrictionMap and add click listeners to the points.
  
  return (
    <div className="friction-section">
      <FrictionMap 
        points={points} 
        startDate={startDate} 
      />
      
      {/* 
        NOTE: In a real implementation, we'd pass an onClick handlers to FrictionMap.
        For this prototype, I'll add a "View Detailed AI Analysis" button or 
        overlay logic if the user clicks a specific point.
      */}

      {selectedPoint && (
        <InterventionBrief 
          point={selectedPoint} 
          onClose={() => setSelectedPoint(null)} 
        />
      )}

      {/* Temp trigger for demo purposes if no points are interactable yet */}
      <div className="fs-actions">
        {points.length > 0 && (
          <button 
            className="btn-ai-sparkle" 
            onClick={() => setSelectedPoint(points[0])}
          >
            <i className="fa-solid fa-sparkles"></i> 
            Deep Dive: {points[0].label}
          </button>
        )}
      </div>

      <style jsx>{`
        .friction-section {
          position: relative;
        }
        .fs-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: -12px;
          margin-bottom: 24px;
          padding-right: 24px;
        }
        .btn-ai-sparkle {
          background: var(--blue-soft);
          color: var(--blue);
          border: 1px solid var(--blue-light);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .btn-ai-sparkle:hover {
          background: var(--blue);
          color: #fff;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  )
}
