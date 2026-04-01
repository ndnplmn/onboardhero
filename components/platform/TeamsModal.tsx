'use client'

import { useState } from 'react'

const SLOTS = [
  'Tuesday, 9:00 AM', 'Tuesday, 10:00 AM', 'Tuesday, 2:00 PM',
  'Wednesday, 11:00 AM', 'Wednesday, 3:00 PM',
  'Thursday, 9:30 AM', 'Thursday, 1:00 PM', 'Friday, 10:00 AM',
]

interface TeamsModalProps {
  isOpen: boolean
  onClose: () => void
  contactName: string
}

export default function TeamsModal({ isOpen, onClose, contactName }: TeamsModalProps) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [isConfirmed, setIsConfirmed] = useState(false)

  if (!isOpen) return null

  const handleConfirm = () => {
    if (selectedSlot) {
      setIsConfirmed(true)
    }
  }

  const handleClose = () => {
    setIsConfirmed(false)
    setSelectedSlot(null)
    onClose()
  }

  return (
    <div className="modal-overlay open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: '480px' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        <div id="modal-body">
          {isConfirmed ? (
            <div className="teams-success">
              <i className="fa-solid fa-circle-check"></i>
              <h4>Meeting confirmed! ✅</h4>
              <p>Your meeting with <strong>{contactName}</strong> has been scheduled for<br /><strong>{selectedSlot}</strong>.</p>
              <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text3)' }}>
                A Microsoft Teams invite has been sent to your corporate email.
              </p>
              <button className="btn btn-primary btn-block" onClick={handleClose} style={{ marginTop: '20px' }}>
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="teams-header">
                <div className="teams-logo"><i className="fa-brands fa-microsoft"></i></div>
                <div>
                  <h3>Schedule via Microsoft Teams</h3>
                  <p>Book a meeting with <strong>{contactName}</strong></p>
                </div>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '4px' }}>
                Select an available time slot:
              </p>
              <div className="time-slots">
                {SLOTS.map((slot, i) => (
                  <div
                    key={i}
                    className={`time-slot ${selectedSlot === slot ? 'selected' : ''}`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {slot}
                  </div>
                ))}
              </div>
              <button
                className="btn btn-primary btn-block"
                onClick={handleConfirm}
                disabled={!selectedSlot}
                style={{ marginTop: '12px' }}
              >
                <i className="fa-brands fa-microsoft"></i> Confirm meeting on Teams
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
