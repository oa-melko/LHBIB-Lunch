import { useStore } from '../store.js'

export default function NamePicker() {
  const members = useStore((s) => s.dayState?.members ?? [])
  const setMe = useStore((s) => s.setMe)
  const setScreen = useStore((s) => s.setScreen)
  const active = members.filter((m) => m.active)

  return (
    <div className="screen">
      <h1>🍕 LHBIB Lunch</h1>
      <p className="subtitle">Qui es-tu ?</p>

      <div className="name-grid">
        {active.map((m) => (
          <button key={m.id} className="name-card" onClick={() => setMe(m.id)}>
            <span className="avatar" style={{ background: m.color }}>
              {m.name[0]?.toUpperCase()}
            </span>
            {m.name}
          </button>
        ))}
      </div>

      {active.length === 0 && (
        <p className="subtitle">Aucun membre pour l'instant — ajoute l'équipe dans les réglages 👇</p>
      )}

      <button className="link-btn" onClick={() => setScreen('settings')}>
        ⚙️ Gérer l'équipe
      </button>
    </div>
  )
}
