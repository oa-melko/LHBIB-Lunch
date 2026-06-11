import { useEffect, useRef } from 'react'
import { useStore } from '../store.js'

export default function Tabs() {
  const categories = useStore((s) => s.menu.categories)
  const catIndex = useStore((s) => s.catIndex)
  const setCatIndex = useStore((s) => s.setCatIndex)
  const ref = useRef(null)

  useEffect(() => {
    ref.current
      ?.querySelector('.tab.active')
      ?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [catIndex])

  return (
    <div className="tabs" ref={ref}>
      {categories.map((c, i) => (
        <button
          key={c.id}
          className={`tab${i === catIndex ? ' active' : ''}`}
          onClick={() => setCatIndex(i)}
        >
          {c.emoji} {c.name}
        </button>
      ))}
    </div>
  )
}
