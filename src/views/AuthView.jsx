import React from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { authApi } from '../api/auth'
import { useNavigate } from 'react-router-dom'

export default function AuthView({ setUser, showToast }) {
  const navigate = useNavigate()

  const handleSuccess = async (credentialResponse) => {
    try {
      const data = await authApi.googleLogin(credentialResponse.credential)
      setUser(data.user)
      if (data.user.role === 'admin' || data.user.role === 'superadmin') {
        navigate('/admin')
      } else if (!data.user.phone_verified) {
        navigate('/verify-phone')
      } else if (!data.user.profile_complete) {
        navigate('/setup')
      } else {
        navigate('/discover')
      }
    } catch (err) {
      showToast(err.message || 'Login failed')
    }
  }

  const handleError = () => {
    showToast('Google login failed')
  }

  return (
    <div className="auth-view" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
      <h1 className="hero-title">HACKBUDDY</h1>
      <p style={{ margin: '2rem 0' }}>Sign in to find your team.</p>
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        useOneTap
      />
    </div>
  )
}
