'use client'

import { useState } from 'react'
import TemplateCard from '@/components/platform/TemplateCard'
import TemplateEditor from '@/components/platform/TemplateEditor'
import JourneyPreview from '@/components/ai/JourneyPreview'

export default function JourneysClient({ templates, taskCounts }: { templates: any[]; taskCounts: Record<string, number> }) {
  const [showEditor, setShowEditor] = useState(false)
  const [showAIGenerator, setShowAIGenerator] = useState(false)

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontFamily: "'Outfit', sans-serif" }}>Journey Templates</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={() => setShowEditor(true)}>
            <i className="fa-solid fa-plus"></i> Create Template
          </button>
          <button className="btn btn-primary" onClick={() => setShowAIGenerator(true)}>
            <i className="fa-solid fa-robot"></i> Generate with AI
          </button>
        </div>
      </div>

      <div className="hc-employees">
        {templates.length === 0 ? (
          <p style={{ padding: '20px', color: 'var(--text3)', textAlign: 'center' }}>No templates yet. Create one to get started.</p>
        ) : (
          templates.map((t: any) => (
            <TemplateCard key={t.id} template={t} taskCount={taskCounts[t.id] || 0} />
          ))
        )}
      </div>

      {showEditor && <TemplateEditor onClose={() => setShowEditor(false)} />}
      {showAIGenerator && <JourneyPreview onClose={() => setShowAIGenerator(false)} />}
    </div>
  )
}
