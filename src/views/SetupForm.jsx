import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { allSkills } from '../data/profiles'
import AvatarPicker from '../components/AvatarPicker'
import { profileApi } from '../api/profile'

const PREDEFINED_SKILLS = allSkills.slice(0, 9)

export default function SetupForm({ user, setUser, showToast }) {
  const navigate = useNavigate()
  
  const [name, setName] = useState('')
  const [branchAndYear, setBranchAndYear] = useState('')
  const [gender, setGender] = useState('Woman') // Just default to something, original didn't even have a gender dropdown, but backend needs it. Wait! Let's check original fields.
  // Original had: Your name, Branch & year, Current team size, Your strongest skills, I need teammates who know..., Your hackathon animal, At 2:47 AM when it breaks...
  const [teamSize, setTeamSize] = useState('Just me')
  const [selectedAvatar, setSelectedAvatar] = useState('raccoon')
  const [bio, setBio] = useState('') // Used for "At 2:47 AM..."
  
  const [selectedSkills, setSelectedSkills] = useState([])
  const [lookingFor, setLookingFor] = useState([])

  const [showOtherSkill, setShowOtherSkill] = useState(false)
  const [customSkillInput, setCustomSkillInput] = useState('')
  const [skillError, setSkillError] = useState('')

  const [showOtherLookingFor, setShowOtherLookingFor] = useState(false)
  const [customLookingForInput, setCustomLookingForInput] = useState('')
  const [lookingForError, setLookingForError] = useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    profileApi.getMe()
      .then(data => {
        if (data.exists) {
          setName(data.name || '')
          setBranchAndYear(`${data.branch || ''} ${data.year ? '· ' + data.year : ''}`.trim())
          setTeamSize(data.team_size === 1 ? 'Just me' : `${data.team_size} people`)
          setBio(data.bio || '')
          setSelectedAvatar(data.avatar || 'raccoon')
          setSelectedSkills(data.skills || [])
          setLookingFor(data.lookingFor || [])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const toggleSkill = (skill) => {
    setSkillError('')
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(prev => prev.filter(s => s !== skill))
    } else {
      if (selectedSkills.length >= 4) {
        setSkillError('You can select a maximum of 4 skills.')
        return
      }
      setSelectedSkills(prev => [...prev, skill])
    }
  }

  const handleAddCustomSkill = () => {
    setSkillError('')
    const trimmed = customSkillInput.trim()
    if (!trimmed) return
    if (selectedSkills.includes(trimmed)) {
      setCustomSkillInput('')
      setShowOtherSkill(false)
      return
    }
    if (selectedSkills.length >= 4) {
      setSkillError('You can select a maximum of 4 skills.')
      return
    }
    setSelectedSkills(prev => [...prev, trimmed])
    setCustomSkillInput('')
    setShowOtherSkill(false)
  }

  const toggleLookingFor = (skill) => {
    setLookingForError('')
    if (lookingFor.includes(skill)) {
      setLookingFor(prev => prev.filter(s => s !== skill))
    } else {
      if (lookingFor.length >= 4) {
        setLookingForError('You can select a maximum of 4 skills.')
        return
      }
      setLookingFor(prev => [...prev, skill])
    }
  }

  const handleAddCustomLookingFor = () => {
    setLookingForError('')
    const trimmed = customLookingForInput.trim()
    if (!trimmed) return
    if (lookingFor.includes(trimmed)) {
      setCustomLookingForInput('')
      setShowOtherLookingFor(false)
      return
    }
    if (lookingFor.length >= 4) {
      setLookingForError('You can select a maximum of 4 skills.')
      return
    }
    setLookingFor(prev => [...prev, trimmed])
    setCustomLookingForInput('')
    setShowOtherLookingFor(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (selectedSkills.length < 2) {
      setSkillError('Please select at least 2 skills.')
      return
    }
    if (lookingFor.length < 2) {
      setLookingForError('Please select at least 2 skills.')
      return
    }
    
    setSaving(true)
    
    // Parse original UI inputs back into backend fields
    const parsedTeamSize = teamSize === 'Just me' ? 1 : parseInt(teamSize[0], 10)
    let parsedBranch = branchAndYear
    let parsedYear = ''
    if (branchAndYear.includes('·')) {
      const parts = branchAndYear.split('·')
      parsedBranch = parts[0].trim()
      parsedYear = parts[1].trim()
    }

    try {
      await profileApi.updateMe({
        name,
        branch: parsedBranch || 'Unknown',
        year: parsedYear || 'Unknown',
        gender: 'Prefer not to say', // Backend required it, but original UI didn't have it.
        team_size: parsedTeamSize,
        bio,
        avatar: selectedAvatar,
        working_style: '',
        skills: selectedSkills,
        lookingFor
      })
      setUser({ ...user, profile_complete: true })
      showToast('Profile saved')
      navigate('/discover')
    } catch (err) {
      showToast(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <section className="setup-screen">
      <div className="setup-heading">
        <p className="eyebrow">01 / QUICK SETUP</p>
        <h1>What do you<br />bring to the table?</h1>
      </div>

      <form className="setup-form" onSubmit={handleSubmit}>
        <div className="field-row">
          <label>
            <span>Your name</span>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required />
          </label>
          <label>
            <span>Branch & year</span>
            <input type="text" value={branchAndYear} onChange={e => setBranchAndYear(e.target.value)} placeholder="CSE · 2nd year" required />
          </label>
        </div>

        <AvatarPicker selected={selectedAvatar} onSelect={setSelectedAvatar} />

        <label className="wide-field">
          <span>Current team size</span>
          <select value={teamSize} onChange={e => setTeamSize(e.target.value)}>
            <option>Just me</option>
            <option>2 people</option>
            <option>3 people</option>
            <option>4 people</option>
          </select>
        </label>

        <fieldset>
          <legend>
            Your strongest skills <small>Pick 2–4</small>
          </legend>
          {skillError && <p className="field-error-msg">{skillError}</p>}
          <div className="choice-grid">
            {PREDEFINED_SKILLS.map(skill => (
              <button 
                key={skill}
                type="button"
                className={selectedSkills.includes(skill) ? 'selected' : ''}
                onClick={() => toggleSkill(skill)}
              >
                {skill} <span>{selectedSkills.includes(skill) ? '×' : '+'}</span>
              </button>
            ))}
            {selectedSkills.filter(s => !PREDEFINED_SKILLS.includes(s)).map(skill => (
              <button 
                key={skill}
                type="button" 
                className="selected"
                onClick={() => toggleSkill(skill)}
              >
                {skill} <span>×</span>
              </button>
            ))}
            <button
              type="button"
              className={showOtherSkill ? 'selected' : ''}
              onClick={() => {
                setSkillError('')
                if (!showOtherSkill && selectedSkills.length >= 4) {
                  setSkillError('You can select a maximum of 4 skills.')
                  return
                }
                setShowOtherSkill(!showOtherSkill)
              }}
            >
              Other <span>{showOtherSkill ? '×' : '+'}</span>
            </button>
          </div>
          {showOtherSkill && (
            <div className="custom-skill-input-wrap">
              <input 
                type="text" 
                className="custom-skill-input"
                placeholder="Type custom skill (e.g., Python)..."
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCustomSkill()
                  }
                }}
                autoFocus
              />
              <button 
                type="button" 
                className="add-custom-btn"
                onClick={handleAddCustomSkill}
              >
                ADD
              </button>
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend>
            I need teammates who know… <small>Pick 2–4</small>
          </legend>
          {lookingForError && <p className="field-error-msg">{lookingForError}</p>}
          <div className="choice-grid">
            {PREDEFINED_SKILLS.map(skill => (
              <button 
                key={skill}
                type="button"
                className={lookingFor.includes(skill) ? 'selected' : ''}
                onClick={() => toggleLookingFor(skill)}
              >
                {skill} <span>{lookingFor.includes(skill) ? '×' : '+'}</span>
              </button>
            ))}
            {lookingFor.filter(s => !PREDEFINED_SKILLS.includes(s)).map(skill => (
              <button 
                key={skill}
                type="button" 
                className="selected"
                onClick={() => toggleLookingFor(skill)}
              >
                {skill} <span>×</span>
              </button>
            ))}
            <button
              type="button"
              className={showOtherLookingFor ? 'selected' : ''}
              onClick={() => {
                setLookingForError('')
                if (!showOtherLookingFor && lookingFor.length >= 4) {
                  setLookingForError('You can select a maximum of 4 skills.')
                  return
                }
                setShowOtherLookingFor(!showOtherLookingFor)
              }}
            >
              Other <span>{showOtherLookingFor ? '×' : '+'}</span>
            </button>
          </div>
          {showOtherLookingFor && (
            <div className="custom-skill-input-wrap">
              <input 
                type="text" 
                className="custom-skill-input"
                placeholder="Type custom skill (e.g., Blockchain)..."
                value={customLookingForInput}
                onChange={(e) => setCustomLookingForInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddCustomLookingFor()
                  }
                }}
                autoFocus
              />
              <button 
                type="button" 
                className="add-custom-btn"
                onClick={handleAddCustomLookingFor}
              >
                ADD
              </button>
            </div>
          )}
        </fieldset>

        <div className="field-row">
          <label>
            <span>Your hackathon animal</span>
            <select defaultValue="Raccoon">
              <option>Raccoon</option>
              <option>Owl</option>
              <option>Black cat</option>
              <option>Golden retriever</option>
            </select>
          </label>
          <label>
            <span>At 2:47 AM, when it breaks…</span>
            <input type="text" value={bio} onChange={e => setBio(e.target.value)} placeholder="I open the logs and pretend not to panic" />
          </label>
        </div>

        <div className="form-footer">
          <p>
            <b>Team eligibility:</b> Review all hackathon rules before final submission.
          </p>
          <button className="primary-action" type="submit" disabled={saving}>
            {saving ? 'SAVING...' : 'FIND MY PEOPLE →'}
          </button>
        </div>
      </form>
    </section>
  )
}


