import React from 'react'

const animalMap = {
  raccoon: '/animals/raccoon.svg',
  owl: '/animals/owl.svg',
  cat: '/animals/cat.svg',
  dog: '/animals/dog.svg',
}

export default function AnimalAvatar({ animal, label, compact = false }) {
  const imgSrc = animalMap[animal] || animalMap['raccoon']
  return (
    <figure className={`animal-avatar animal-${animal} ${compact ? 'animal-compact' : ''}`}>
      <span className="animal-halo" aria-hidden="true" />
      <img src={imgSrc} alt={`${label} animal avatar`} draggable={false} />
      <figcaption>{label}</figcaption>
    </figure>
  )
}
