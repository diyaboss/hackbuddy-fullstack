import React, { useEffect, useState } from 'react'

export default function ScrollProgress() {
  const [scaleX, setScaleX] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      if (scrollHeight > 0) {
        setScaleX(window.scrollY / scrollHeight)
      } else {
        setScaleX(0)
      }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="scroll-progress" aria-hidden="true">
      <span style={{ transform: `scaleX(${scaleX})` }} />
    </div>
  )
}
