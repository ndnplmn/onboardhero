'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SLOTS = [
  'Tuesday, 9:00 AM',   'Tuesday, 10:00 AM',  'Tuesday, 2:00 PM',
  'Wednesday, 11:00 AM','Wednesday, 3:00 PM',
  'Thursday, 9:30 AM',  'Thursday, 1:00 PM',  'Friday, 10:00 AM',
]

interface TeamsModalProps {
  isOpen:      boolean
  onClose:     () => void
  contactName: string
}

export default function TeamsModal({ isOpen, onClose, contactName }: TeamsModalProps) {
  const [selectedSlot, setSelectedSlot]   = useState<string | null>(null)
  const [isConfirmed, setIsConfirmed]     = useState(false)

  const handleConfirm = () => {
    if (selectedSlot) setIsConfirmed(true)
  }

  const handleClose = () => {
    setIsConfirmed(false)
    setSelectedSlot(null)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="modal-overlay open"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
          role="dialog"
          aria-modal="true"
          aria-label={`Schedule a meeting with ${contactName}`}
        >
          <motion.div
            className="modal-box"
            style={{ maxWidth: 480 }}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              className="modal-close"
              onClick={handleClose}
              aria-label="Close meeting scheduler"
            >
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>

            <AnimatePresence mode="wait">
              {isConfirmed ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="teams-success"
                >
                  <i className="fa-solid fa-circle-check" aria-hidden="true" />
                  <h4>Meeting confirmed!</h4>
                  <p>
                    Your meeting with <strong>{contactName}</strong> has been scheduled for{' '}
                    <strong>{selectedSlot}</strong>.
                  </p>
                  <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text3)' }}>
                    A Microsoft Teams invite has been sent to your corporate email.
                  </p>
                  <button
                    className="btn btn-primary btn-block"
                    onClick={handleClose}
                    style={{ marginTop: 20 }}
                  >
                    Done
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="picker"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="teams-header">
                    <div className="teams-logo" aria-hidden="true">
                      <i className="fa-brands fa-microsoft" />
                    </div>
                    <div>
                      <h3>Schedule via Microsoft Teams</h3>
                      <p>Book a meeting with <strong>{contactName}</strong></p>
                    </div>
                  </div>

                  <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>
                    Select an available time slot:
                  </p>

                  <div className="time-slots" role="group" aria-label="Available time slots">
                    {SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        className={`time-slot${selectedSlot === slot ? ' selected' : ''}`}
                        onClick={() => setSelectedSlot(slot)}
                        aria-pressed={selectedSlot === slot}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>

                  <button
                    className="btn btn-primary btn-block"
                    onClick={handleConfirm}
                    disabled={!selectedSlot}
                    style={{ marginTop: 12 }}
                  >
                    <i className="fa-brands fa-microsoft" style={{ marginRight: 6 }} aria-hidden="true" />
                    Confirm meeting on Teams
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
