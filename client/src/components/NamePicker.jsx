import { useStore } from '../store.js'

export default function NamePicker() {
  const members = useStore((s) => s.dayState?.members ?? [])
  const meId = useStore((s) => s.meId)
  const setMe = useStore((s) => s.setMe)
  const closePicker = useStore((s) => s.closePicker)
  const setScreen = useStore((s) => s.setScreen)
  const showToast = useStore((s) => s.showToast)
  const active = members.filter((m) => m.active)

  const pick = (m) => {
    setMe(m.id)
    showToast(`Salam ${m.name} ! 👋`)
    closePicker()
  }

  return (
    <div className="modal-backdrop" onClick={closePicker}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>👋 Qui es-tu ?</h3>
        {active.length === 0 && (
          <p className="desc">Aucun membre pour l'instant — ajoute l'équipe dans les réglages.</p>
        )}
        <div className="name-grid" style={{ margin: '16px 0 0' }}>
          {active.map((m) => (
            <button
              key={m.id}
              className={`name-card${m.id === meId ? ' selected' : ''}`}
              onClick={() => pick(m)}
            >
              <span className="avatar" style={{ background: m.color }}>
                {m.name[0]?.toUpperCase()}
              </span>
              {m.name}
            </button>
          ))}
        </div>
        <button
          className="link-btn"
          onClick={() => {
            closePicker()
            setScreen('settings')
          }}
        >
          ⚙️ Gérer l'équipe
        </button>
      </div>
    </div>
  )
}
