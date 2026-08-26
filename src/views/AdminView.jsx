import React, { useState, useEffect } from 'react'
import { adminApi } from '../api/admin'

export default function AdminView({ user, showToast }) {
  const [overview, setOverview] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminApi.getOverview(),
      adminApi.getUsers()
    ]).then(([overviewData, usersData]) => {
      setOverview(overviewData)
      setUsers(usersData)
    }).catch(() => {
      showToast('Failed to load admin data')
    }).finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id, name) => {
    if (user.role !== 'superadmin') {
      alert('Only superadmin can delete users.')
      return
    }
    
    if (window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      try {
        await adminApi.deleteUser(id)
        setUsers(users.filter(u => u.id !== id))
        showToast('User deleted')
      } catch (err) {
        showToast(err.message || 'Failed to delete user')
      }
    }
  }

  if (loading) return <div>Loading admin...</div>

  return (
    <div className="content-section" style={{ padding: '2rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>Admin Dashboard</h1>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ padding: '1rem', background: 'var(--color-surface-dim)', borderRadius: '0.5rem' }}>
          <h3>Total Users</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{overview.totalUsers}</p>
        </div>
        <div style={{ padding: '1rem', background: 'var(--color-surface-dim)', borderRadius: '0.5rem' }}>
          <h3>Active Matching</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{overview.activeMatching}</p>
        </div>
        <div style={{ padding: '1rem', background: 'var(--color-surface-dim)', borderRadius: '0.5rem' }}>
          <h3>Team Found</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{overview.teamFound}</p>
        </div>
        <div style={{ padding: '1rem', background: 'var(--color-surface-dim)', borderRadius: '0.5rem' }}>
          <h3>Matches</h3>
          <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{overview.matchesCount}</p>
        </div>
      </div>

      <h2>Users</h2>
      <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-surface-dim)' }}>
              <th style={{ padding: '0.5rem' }}>ID</th>
              <th style={{ padding: '0.5rem' }}>Email</th>
              <th style={{ padding: '0.5rem' }}>Name</th>
              <th style={{ padding: '0.5rem' }}>Status</th>
              <th style={{ padding: '0.5rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--color-surface-dim)' }}>
                <td style={{ padding: '0.5rem' }}>{u.id}</td>
                <td style={{ padding: '0.5rem' }}>{u.email}</td>
                <td style={{ padding: '0.5rem' }}>{u.name || 'Incomplete'}</td>
                <td style={{ padding: '0.5rem' }}>{u.matching_status || 'N/A'}</td>
                <td style={{ padding: '0.5rem' }}>
                  {user.role === 'superadmin' && (
                    <button className="secondary-action" onClick={() => handleDelete(u.id, u.name || u.email)} style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>
                      DELETE
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
