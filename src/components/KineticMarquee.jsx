import React from 'react'

const REPEATED_TEXT = "DESIGN MEETS DATA · FRONTEND MEETS ML · IDEAS MEET EXECUTION · HARDWARE MEETS SOFTWARE · "

export default function KineticMarquee() {
  return (
    <div className="kinetic-strip" aria-hidden="true">
      <div className="kinetic-track">
        <span>{REPEATED_TEXT.repeat(4)}</span>
        <span>{REPEATED_TEXT.repeat(4)}</span>
      </div>
    </div>
  )
}
