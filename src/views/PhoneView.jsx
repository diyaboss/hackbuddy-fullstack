import React, { useState, useMemo } from 'react'
import { authApi } from '../api/auth'
import { useNavigate } from 'react-router-dom'
import { getCountries, getCountryCallingCode, AsYouType, parsePhoneNumberWithError } from 'libphonenumber-js'

export default function PhoneView({ user, setUser, showToast }) {
  const [country, setCountry] = useState('IN')
  const [nationalNumber, setNationalNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const countries = useMemo(() => {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' })
    return getCountries().map(iso => ({
      iso,
      name: regionNames.of(iso),
      callingCode: `+${getCountryCallingCode(iso)}`
    })).sort((a, b) => a.name.localeCompare(b.name))
  }, [])

  const currentCountryObj = countries.find(c => c.iso === country) || countries.find(c => c.iso === 'IN')

  const handlePhoneChange = (e) => {
    const input = e.target.value
    const formatter = new AsYouType(country)
    const formatted = formatter.input(input)
    setNationalNumber(formatted)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    let e164Number;
    try {
      const pn = parsePhoneNumberWithError(nationalNumber, country)
      if (!pn.isValid()) throw new Error('Invalid number')
      e164Number = pn.format('E.164')
    } catch (err) {
      showToast('Please enter a valid phone number for the selected country.')
      setLoading(false)
      return
    }

    try {
      await authApi.savePhone(e164Number, country)
      setUser({ ...user, hasPhoneNumber: true })
      showToast('Phone number saved')
      if (user.profile_complete) {
        navigate('/discover')
      } else {
        navigate('/setup')
      }
    } catch (err) {
      showToast(err.message || 'Failed to save phone number')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="content-section" style={{ maxWidth: '440px', margin: '4rem auto' }}>
      <form onSubmit={handleSubmit} className="form-group" style={{ padding: '40px', background: 'var(--maroon-dark)', borderRadius: '12px', border: '1px solid var(--line)' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '2rem' }}>YOUR NUMBER</h2>
        <p style={{ marginBottom: '2rem', fontSize: '1rem', color: 'var(--paper-dim)' }}>
          We'll keep this private until you choose to share it with a teammate.
        </p>
        
        <label className="form-label" style={{ color: 'var(--accent)' }}>Phone Number</label>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '100px' }}>
            <div 
              className="form-input" 
              style={{ width: '100%', paddingRight: '24px', fontFamily: 'var(--font-sans)', fontSize: '1rem', display: 'flex', alignItems: 'center', background: 'var(--paper)', color: 'var(--ink)' }}
            >
              {currentCountryObj.callingCode}
            </div>
            <select
              value={country}
              onChange={e => {
                setCountry(e.target.value)
                setNationalNumber('')
              }}
              style={{ 
                position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%',
                appearance: 'none', WebkitAppearance: 'none'
              }}
              disabled={loading}
            >
              {countries.map(c => (
                <option key={c.iso} value={c.iso}>
                  {c.name} {c.callingCode}
                </option>
              ))}
            </select>
            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--ink)' }}>
              ▼
            </div>
          </div>
          
          <input
            type="tel"
            className="form-input"
            value={nationalNumber}
            onChange={handlePhoneChange}
            placeholder="98765 43210"
            style={{ flex: 1, fontFamily: 'var(--font-serif)', fontSize: '1.2rem' }}
            required
            disabled={loading}
          />
        </div>
        
        <button type="submit" className="primary-action" disabled={loading} style={{ width: '100%', marginTop: '2rem' }}>
          {loading ? 'SAVING...' : 'CONTINUE →'}
        </button>
      </form>
    </div>
  )
}
