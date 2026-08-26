import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { matchesApi } from '../api/matches'
import AnimalAvatar from '../components/AnimalAvatar'

export default function MatchesView({ showToast }) {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    matchesApi.getMatches()
      .then(data => setMatches(data))
      .catch(() => showToast('Failed to load matches'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="content-section">
      <h2 style={{ marginBottom: '2rem' }}>Your Team Connections</h2>
      {matches.length === 0 ? (
        <p>You don't have any accepted teammates yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {matches.map(match => (
            <div key={match.matchId} className="match-card" style={{ border: '1px solid var(--color-surface-dim)', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '60px', height: '60px' }}>
                <AnimalAvatar animal={match.teammate.avatar} />
              </div>
              <div style={{ flex: 1 }}>
                <h3>{match.teammate.name}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>{match.teammate.skills.join(', ')}</p>
                <Link to={`/matches/${match.matchId}`} className="primary-action" style={{ display: 'inline-block', marginTop: '0.5rem', padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>
                  OPEN ROOM
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
