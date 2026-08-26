import React from 'react'
import { AVATAR_OPTIONS } from '../data/avatars'

export default function AvatarPicker({ selected, onSelect }) {
    return (
        <fieldset className="avatar-fieldset">
            <legend>
                Pick your avatar <small>Choose one</small>
            </legend>
            <div className="avatar-grid">
                {AVATAR_OPTIONS.map(avatar => (
                    <button
                        key={avatar.id}
                        type="button"
                        className={`avatar-option ${selected === avatar.id ? 'selected' : ''}`}
                        onClick={() => onSelect(avatar.id)}
                        aria-label={`Select ${avatar.label}`}
                    >
                        <img src={avatar.src} alt="" />
                    </button>
                ))}
            </div>
        </fieldset>
    )
}