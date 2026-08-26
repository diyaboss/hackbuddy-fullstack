import React, { useState, useEffect } from 'react'
import { requestsApi } from '../api/requests'

export default function RequestsView({ showToast }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    requestsApi.getIncoming()
      .then(data => setRequests(data))
      .catch(() => showToast('Failed to load requests'))
      .finally(() => setLoading(false))
  }, [])

  const handleAction = async (id, action) => {
    try {
      if (action === 'accept') {
        await requestsApi.acceptRequest(id)
        showToast('Request accepted!')
      } else {
        await requestsApi.declineRequest(id)
        showToast('Request declined')
      }
      setRequests(prev => prev.filter(r => r.requestId !== id))
    } catch (err) {
      showToast(err.message || `Failed to ${action} request`)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="content-section">
      <h2 style={{ marginBottom: '2rem' }}>Team Requests</h2>
      {requests.length === 0 ? (
        <p>No pending requests.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {requests.map(req => (
            <div key={req.requestId} className="request-card" style={{ border: '1px solid var(--color-surface-dim)', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3>{req.sender.name}</h3>
                  <p>{req.sender.branch} • {req.sender.year}</p>
                  <p><strong>Skills:</strong> {req.sender.skills.join(', ')}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="primary-action" onClick={() => handleAction(req.requestId, 'accept')}>ACCEPT</button>
                  <button className="secondary-action" onClick={() => handleAction(req.requestId, 'decline')}>DECLINE</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
