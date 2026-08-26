import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AVATAR_OPTIONS } from '../data/avatars'

export default function TopBar({ user, onLogout }) {
  const location = useLocation()
  const isHome = location.pathname === '/' || location.pathname === '/auth'

  return (
    <header className="topbar">
      <Link to="/" className="brand" aria-label="HackBuddy home">
        <span className="brand-text">
          <strong>HACKBUDDY</strong>
          <small>TEAMMATE MATCH</small>
        </span>
      </Link>

      {!isHome && user && user.role === 'user' && (
        <nav className="home-nav" aria-label="App sections">
          <Link to="/discover">Discover</Link>
          <Link to="/requests">Requests</Link>
          <Link to="/matches">Matches</Link>
        </nav>
      )}

      {!isHome && user && user.role !== 'user' && (
        <div className="status-line">ADMIN</div>
      )}

      {user && (
        <div className="topbar-actions">
          {user.role === 'user' && (
            <Link to="/setup" className="profile-chip">
              <span className="profile-avatar-circle">M</span>
              <b>PROFILE</b>
            </Link>
          )}
          <button className="logout-button" onClick={onLogout}>LOGOUT</button>
        </div>
      )}
    </header>
  )
}