import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { matchesApi } from '../api/matches'
import AnimalAvatar from '../components/AnimalAvatar'

export default function MatchRoomView({ user, showToast }) {
  const { id } = useParams()
  const [room, setRoom] = useState(null)
  const [problemStatements, setProblemStatements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      matchesApi.getRoom(id),
      matchesApi.getProblemStatements()
    ]).then(([roomData, statementsData]) => {
      setRoom(roomData)
      setProblemStatements(statementsData)
    }).catch(err => {
      showToast('Failed to load room')
    }).finally(() => setLoading(false))
  }, [id])

  const toggleStatement = async (statementId) => {
    const current = [...room.selections.yours]
    let updated
    if (current.includes(statementId)) {
      updated = current.filter(id => id !== statementId)
    } else {
      updated = [...current, statementId]
    }

    try {
      await matchesApi.updateProblemStatements(id, updated)
      setRoom({
        ...room,
        selections: {
          ...room.selections,
          yours: updated
        }
      })
    } catch (err) {
      showToast('Failed to save selection')
    }
  }

  const handleShareContact = async () => {
    if (!window.confirm(`Share your phone number with ${room.teammate.name}?`)) return
    
    try {
      await matchesApi.shareContact(id)
      setRoom({
        ...room,
        contact: {
          ...room.contact,
          youShared: true
        }
      })
      showToast('Contact shared')
    } catch (err) {
      showToast('Failed to share contact')
    }
  }

  if (loading) return <div>Loading room...</div>
  if (!room) return <div>Room not found.</div>

  const { teammate, selections, contact } = room

  return (
    <div className="content-section" style={{ maxWidth: '800px', margin: '2rem auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '2rem', background: 'var(--color-surface-dim)', borderRadius: '1rem', marginBottom: '2rem' }}>
        <div style={{ width: '100px', height: '100px' }}>
          <AnimalAvatar animal={teammate.avatar} />
        </div>
        <div>
          <h2>{teammate.name}</h2>
          <p>{teammate.branch} • {teammate.year}</p>
          <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
            <strong>Skills:</strong> {teammate.skills.join(', ')}<br/>
            <strong>Looking for:</strong> {teammate.lookingFor.join(', ')}
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--color-surface)', padding: '2rem', borderRadius: '1rem', border: '2px solid var(--color-primary)', marginBottom: '2rem' }}>
        <p style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          This is an interesting pair. You might actually have the pieces for something good here.
        </p>
        <p>Working on the same problem? Compare what caught your eye.</p>
      </div>

      <h3 style={{ marginBottom: '1rem' }}>PROBLEM STATEMENTS</h3>
      {problemStatements.length === 0 ? (
        <p style={{ color: 'var(--color-text-dim)', fontStyle: 'italic', marginBottom: '2rem' }}>Problem statements haven't been published yet.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
          {problemStatements.map(ps => {
            const youPicked = selections.yours.includes(ps.id)
            const theyPicked = selections.theirs.includes(ps.id)
            const bothPicked = youPicked && theyPicked

            return (
              <div 
                key={ps.id} 
                onClick={() => toggleStatement(ps.id)}
                style={{ 
                  padding: '1rem', 
                  border: `2px solid ${youPicked ? 'var(--color-primary)' : 'var(--color-surface-dim)'}`, 
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  background: bothPicked ? 'rgba(186, 255, 41, 0.1)' : 'transparent'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{ps.code}: {ps.title}</strong>
                  {bothPicked && <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>YOU BOTH PICKED THIS</span>}
                  {!bothPicked && youPicked && <span style={{ color: 'var(--color-primary)' }}>YOUR PICK</span>}
                  {!bothPicked && theyPicked && <span>THEIR PICK</span>}
                </div>
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>{ps.description}</p>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--color-surface-dim)', paddingTop: '2rem', textAlign: 'center' }}>
        <p style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>This is an interesting pair. Wanna take this to the next level? Get in touch.</p>
        
        {contact.youShared && contact.theyShared ? (
          <div style={{ padding: '2rem', background: 'var(--color-surface-dim)', borderRadius: '1rem' }}>
            <h3 style={{ color: 'var(--color-primary)' }}>CONTACTS UNLOCKED</h3>
            <p style={{ fontSize: '1.5rem', margin: '1rem 0' }}>{contact.theirContact}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {!contact.youShared ? (
              <button className="primary-action" onClick={handleShareContact} title="Click to share your contact details with this teammate.">
                GET IN TOUCH
              </button>
            ) : (
              <p>You've shared your contact. Waiting for them to share back.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
