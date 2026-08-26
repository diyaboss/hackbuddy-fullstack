import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom'
import TopBar from './components/TopBar'
import Toast from './components/Toast'
import HomePage from './views/HomePage'
import SetupForm from './views/SetupForm'
import DiscoverView from './views/DiscoverView'
import PhoneView from './views/PhoneView'
import RequestsView from './views/RequestsView'
import MatchesView from './views/MatchesView'
import MatchRoomView from './views/MatchRoomView'
import AdminView from './views/AdminView'
import AuthView from './views/AuthView'
import { authApi } from './api/auth'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toastMessage, setToastMessage] = useState('')
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    authApi.me()
      .then(data => {
        if (data.user) {
          setUser(data.user)
        }
      })
      .catch(() => {
        // Not authenticated
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const showToast = (message) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleLogout = async () => {
    try {
      await authApi.logout()
      setUser(null)
      navigate('/')
    } catch (err) {
      showToast('Logout failed')
    }
  }

  if (loading) {
    return <div className="loading-screen">Loading HackBuddy...</div>
  }

  // Routing Guards
  const requireAuth = (element) => {
    if (!user) return <Navigate to="/auth" replace />
    if (user.role === 'admin' || user.role === 'superadmin') {
      if (location.pathname !== '/admin') return <Navigate to="/admin" replace />
    }
    return element
  }

  const requirePhone = (element) => {
    if (!user) return <Navigate to="/auth" replace />
    if (user.role === 'admin' || user.role === 'superadmin') return <Navigate to="/admin" replace />
    if (!user.hasPhoneNumber) return <Navigate to="/phone" replace />
    return element
  }

  const requireProfile = (element) => {
    if (!user) return <Navigate to="/auth" replace />
    if (user.role === 'admin' || user.role === 'superadmin') return <Navigate to="/admin" replace />
    if (!user.hasPhoneNumber) return <Navigate to="/phone" replace />
    if (!user.profile_complete) return <Navigate to="/setup" replace />
    return element
  }

  const requireAdmin = (element) => {
    if (!user) return <Navigate to="/auth" replace />
    if (user.role !== 'admin' && user.role !== 'superadmin') return <Navigate to="/discover" replace />
    return element
  }

  return (
    <main className="app-shell">
      {location.pathname !== '/' && location.pathname !== '/auth' && (
        <TopBar user={user} onLogout={handleLogout} />
      )}

      <Routes>
        <Route path="/" element={
          user 
            ? (user.role === 'admin' || user.role === 'superadmin' ? <Navigate to="/admin" replace /> : <Navigate to="/discover" replace />)
            : <HomePage />
        } />
        
        <Route path="/auth" element={
          user 
            ? (user.role === 'admin' || user.role === 'superadmin' ? <Navigate to="/admin" replace /> : <Navigate to="/discover" replace />)
            : <AuthView setUser={setUser} showToast={showToast} />
        } />
        
        <Route path="/phone" element={
          !user ? <Navigate to="/auth" replace /> :
          (user.role === 'admin' || user.role === 'superadmin') ? <Navigate to="/admin" replace /> :
          user.hasPhoneNumber ? <Navigate to="/setup" replace /> : 
          <PhoneView user={user} setUser={setUser} showToast={showToast} />
        } />
        
        <Route path="/setup" element={
          !user ? <Navigate to="/auth" replace /> :
          (user.role === 'admin' || user.role === 'superadmin') ? <Navigate to="/admin" replace /> :
          user.profile_complete ? <Navigate to="/discover" replace /> :
          requirePhone(<SetupForm user={user} setUser={setUser} showToast={showToast} />)
        } />
        
        <Route path="/discover" element={requireProfile(<DiscoverView user={user} setUser={setUser} showToast={showToast} />)} />
        <Route path="/requests" element={requireProfile(<RequestsView user={user} showToast={showToast} />)} />
        <Route path="/matches" element={requireProfile(<MatchesView user={user} showToast={showToast} />)} />
        <Route path="/matches/:id" element={requireProfile(<MatchRoomView user={user} showToast={showToast} />)} />
        
        <Route path="/admin" element={requireAdmin(<AdminView user={user} showToast={showToast} />)} />
      </Routes>

      {toastMessage && <Toast message={toastMessage} />}
    </main>
  )
}

export default App
