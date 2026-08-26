import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AnimalAvatar from '../components/AnimalAvatar'
import ScrollProgress from '../components/ScrollProgress'
import KineticMarquee from '../components/KineticMarquee'

export default function HomePage() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
          }
        })
      },
      { threshold: 0.15 }
    )

    const revealElements = document.querySelectorAll('.reveal')
    revealElements.forEach((el) => observer.observe(el))
    
    // Initial reveal for hero elements
    setTimeout(() => {
      document.querySelectorAll('.hero .reveal').forEach(el => el.classList.add('is-visible'))
    }, 100)

    return () => observer.disconnect()
  }, [])

  const handlePointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setMousePos({ x, y })
  }

  return (
    <div className="home-page">
      <ScrollProgress />
      
      <section 
        className="hero content-section"
        onPointerMove={handlePointerMove}
        style={{ '--mx': mousePos.x, '--my': mousePos.y }}
      >
        <div className="hero-copy">
          <p className="eyebrow reveal">TEAM FORMATION</p>
          <h1 className="hero-title reveal">
            HACKBUDDY
          </h1>
          <p className="hero-subtitle reveal" style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
            Find the people your stack is missing.
          </p>
          <Link to="/auth" className="primary-action reveal">
            FIND MY TEAM <span>→</span>
          </Link>
        </div>

        <div className="hero-animals" aria-label="A stack of possible teammate avatars">
          <div className="hero-card hero-card-one">
            <AnimalAvatar animal="owl" label="Owl" />
          </div>
          <div className="hero-card hero-card-two">
            <AnimalAvatar animal="cat" label="Black cat" />
          </div>
          <div className="hero-card hero-card-three">
            <AnimalAvatar animal="raccoon" label="Raccoon" />
          </div>
          <span className="hero-sticker">
            TEAM CHEMISTRY
            <b>94%</b>
          </span>
        </div>
      </section>
    </div>
  )
}
