import { useEffect, useState } from 'react'
import { useStore } from '../store.js'
import { api } from '../api.js'

export default function Settings() {
  const members = useStore((s) => s.dayState?.members ?? [])
  const setScreen = useStore((s) => s.setScreen)
  const showToast = useStore((s) => s.showToast)
  const [newName, setNewName] = useState('')
  const [number, setNumber] = useState('')
  const [numberLoaded, setNumberLoaded] = useState(false)

  useEffect(() => {
    api
      .getSettings()
      .then((s) => {
        setNumber(s.whatsappNumber)
        setNumberLoaded(true)
      })
      .catch(() => setNumberLoaded(true))
  }, [])

  const run = (fn) => fn().catch((e) => showToast(`😬 ${e.message}`))

  const addMember = () => {
    const name = newName.trim()
    if (!name) return
    run(async () => {
      await api.addMember(name)
      setNewName('')
    })
  }

  const saveNumber = () =>
    run(async () => {
      await api.patchSettings({ whatsappNumber: number })
      showToast('✅ Numéro enregistré')
    })

  return (
    <div className="screen">
      <h1>⚙️ Réglages</h1>
      <p className="subtitle">L'équipe et le numéro du resto</p>

      <div className="settings-list">
        <div className="field-label">👥 L'équipe</div>
        {members.map((m) => (
          <div key={m.id} className="settings-row" style={{ opacity: m.active ? 1 : 0.45 }}>
            <span className="avatar" style={{ background: m.color }}>
              {m.name[0]?.toUpperCase()}
            </span>
            <input
              type="text"
              defaultValue={m.name}
              onBlur={(e) => {
                const name = e.target.value.trim()
                if (name && name !== m.name) run(() => api.patchMember(m.id, { name }))
              }}
            />
            <button
              className="icon-btn"
              title={m.active ? 'Mettre en pause (absent)' : 'Réactiver'}
              onClick={() => run(() => api.patchMember(m.id, { active: !m.active }))}
            >
              {m.active ? '🌴' : '💤'}
            </button>
            <button
              className="icon-btn"
              title="Supprimer"
              onClick={() => {
                if (confirm(`Supprimer ${m.name} ?`)) run(() => api.deleteMember(m.id))
              }}
            >
              🗑️
            </button>
          </div>
        ))}

        <div className="settings-row">
          <span className="avatar" style={{ background: '#cbd5d1' }}>
            +
          </span>
          <input
            type="text"
            placeholder="Prénom du nouveau membre"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addMember()}
          />
          <button className="icon-btn" onClick={addMember}>
            ➕
          </button>
        </div>

        <div className="field-label" style={{ marginTop: 22 }}>
          📲 WhatsApp du resto LHBIB
        </div>
        <div className="settings-row">
          <input
            type="text"
            placeholder="ex : 2126XXXXXXXX (vide = choix du contact)"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            disabled={!numberLoaded}
          />
          <button className="icon-btn" onClick={saveNumber}>
            💾
          </button>
        </div>
      </div>

      <button className="primary-btn" onClick={() => setScreen('menu')}>
        ← Retour au menu
      </button>
    </div>
  )
}
