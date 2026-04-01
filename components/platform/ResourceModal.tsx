'use client'

interface ResourceModalProps {
  isOpen: boolean
  onClose: () => void
  resource: {
    id: string
    title: string
    type: string
  } | null
}

export default function ResourceModal({ isOpen, onClose, resource }: ResourceModalProps) {
  if (!isOpen || !resource) return null

  const getResourceContent = (resId: string) => {
    if (resId === 'res-welcome') {
      return (
        <>
          <div style={{ background: 'var(--grad)', borderRadius: 'var(--r-lg)', padding: '32px', color: '#fff', textAlign: 'center', marginBottom: '20px' }}>
            <i className="fa-solid fa-building" style={{ fontSize: '40px', marginBottom: '14px', display: 'block', opacity: 0.9 }}></i>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>Welcome to TechCorp International</h2>
            <p style={{ fontSize: '13px', opacity: 0.8 }}>Company Overview · 48 slides</p>
          </div>
          <div className="res-slide-content">
            {['Company Overview', 'Our Business Structure', 'Mission, Vision & Values', 'Key Departments', 'Leadership Team', 'Internal Culture & Behaviours', 'What Success Looks Like', 'Your First 90 Days'].map((s, i) => (
              <div key={i} style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--r)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface2)' }}>
                <span style={{ width: '24px', height: '24px', background: 'var(--grad)', borderRadius: '6px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{s}</span>
              </div>
            ))}
          </div>
        </>
      )
    }

    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <i className="fa-solid fa-file-lines" style={{ fontSize: '48px', background: 'var(--grad)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '16px', display: 'block' }}></i>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{resource.title}</h3>
        <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '24px' }}>{resource.type}</p>
        <p style={{ fontSize: '13px', color: 'var(--text2)' }}>This resource is available in your company's shared document library.</p>
      </div>
    )
  }

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: '480px' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div id="resource-body">
          {getResourceContent(resource.id)}
        </div>
      </div>
    </div>
  )
}
