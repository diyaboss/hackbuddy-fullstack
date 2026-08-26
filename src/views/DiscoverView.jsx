import React, { useState, useEffect } from 'react'
import { discoverApi } from '../api/discover'
import { requestsApi } from '../api/requests'
import { profileApi } from '../api/profile'
import AnimalAvatar from '../components/AnimalAvatar'

export default function DiscoverView({ user, setUser, showToast }) {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [genderFilter, setGenderFilter] = useState('Everyone')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [statusUpdating, setStatusUpdating] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await discoverApi.getEligibleUsers(genderFilter)
      setCandidates(data)
      setCurrentIndex(0)
    } catch (err) {
      showToast('Failed to load discover')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user.matching_status === 'active') {
      fetchUsers()
    }
  }, [genderFilter, user.matching_status])

  const handleNext = () => {
    setCurrentIndex(prev => prev + 1)
  }

  const handleTeamUp = async (receiverId) => {
    try {
      await requestsApi.sendRequest(receiverId)
      showToast('Request sent!')
      handleNext()
    } catch (err) {
      showToast(err.message || 'Failed to send request')
    }
  }

  const updateStatus = async (status) => {
    if (status === 'team_found' && !window.confirm("Are you sure you want to leave matching? You will not appear in discover and pending requests will be cancelled. Existing matches remain.")) {
      return
    }
    
    setStatusUpdating(true)
    try {
      await profileApi.updateStatus(status)
      setUser({ ...user, matching_status: status })
      showToast(status === 'active' ? 'Matching resumed' : `Status updated to ${status}`)
    } catch (err) {
      showToast(err.message || 'Failed to update status')
    } finally {
      setStatusUpdating(false)
    }
  }

  if (user.matching_status === 'team_found') {
    return (
      <div className="content-section" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2>You've found your team!</h2>
        <p>You are no longer visible in discover.</p>
        <button className="primary-action" onClick={() => updateStatus('active')} style={{ marginTop: '2rem' }}>
          START MATCHING AGAIN
        </button>
      </div>
    )
  }

  if (user.matching_status === 'paused') {
    return (
      <div className="content-section" style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2>Matching is paused.</h2>
        <button className="primary-action" onClick={() => updateStatus('active')} style={{ marginTop: '2rem' }}>
          RESUME MATCHING
        </button>
      </div>
    )
  }

  const currentCandidate = candidates[currentIndex]

  return (
    <div className="discover-view content-section">
      <div className="discover-controls" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)} className="form-input" style={{ width: 'auto' }}>
          <option value="Everyone">Everyone</option>
          <option value="Women">Women</option>
          <option value="Men">Men</option>
          <option value="Non-binary">Non-binary</option>
        </select>
        
        <div>
          <button className="secondary-action" onClick={() => updateStatus('paused')} disabled={statusUpdating} style={{ marginRight: '1rem' }}>
            PAUSE
          </button>
          <button className="secondary-action" onClick={() => updateStatus('team_found')} disabled={statusUpdating}>
            I'VE FOUND MY TEAM
          </button>
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : currentCandidate ? (
        <div className="profile-card">
          <div className="card-header">
            <AnimalAvatar animal={currentCandidate.avatar} />
            <div className="card-titles">
              <h2>{currentCandidate.name}</h2>
              <p>{currentCandidate.branch} • {currentCandidate.year}</p>
            </div>
            <div className="complement-badge">
              <strong>{currentCandidate.complementScore}%</strong> MATCH
            </div>
          </div>
          
          <div className="card-body">
            <p className="bio">{currentCandidate.bio}</p>
            <div className="skills-section">
              <strong>Skills:</strong> {currentCandidate.skills.join(', ')}
            </div>
            <div className="skills-section">
              <strong>Looking for:</strong> {currentCandidate.lookingFor.join(', ')}
            </div>
            <div className="complement-reasons" style={{ marginTop: '1rem', fontStyle: 'italic', color: 'var(--color-primary)' }}>
              {currentCandidate.complementReasons.map((r, i) => <div key={i}>{r}</div>)}
            </div>
          </div>

          <div className="card-actions" style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button className="secondary-action" style={{ flex: 1 }} onClick={handleNext}>NEXT</button>
            <button className="primary-action" style={{ flex: 2 }} onClick={() => handleTeamUp(currentCandidate.id)}>TEAM UP</button>
          </div>
        </div>
      ) : (
        <div className="empty-state" style={{ textAlign: 'center', marginTop: '4rem' }}>
          <h2>No more teammates found.</h2>
          <p>Check back later or try changing your filters.</p>
        </div>
      )}
    </div>
  )
}
