import { useEffect, useState } from 'react'
import { useStore, selectMe } from './store.js'
import { api } from './api.js'
import { connectSocket } from './socket.js'
import NamePicker from './components/NamePicker.jsx'
import Dashboard from './components/Dashboard.jsx'
import Tray from './components/Tray.jsx'
import ItemModal from './components/ItemModal.jsx'
import Settings from './components/Settings.jsx'
import Scene from './three/Scene.jsx'

export default function App() {
  const { menu, dayState, screen, panelOpen, modalItem, connected, toast } = useStore()
  const me = useStore(selectMe)
  const togglePanel = useStore((s) => s.togglePanel)
  const setScreen = useStore((s) => s.setScreen)
  const clearMe = useStore((s) => s.clearMe)
  const [error, setError] = useState(null)

  useEffect(() => {
    const socket = connectSocket()
    Promise.all([api.getMenu(), api.getState()])
      .then(([menu, state]) => {
        useStore.getState().setMenu(menu)
        useStore.getState().setDayState(state)
      })
      .catch((e) => setError(e.message))
    return () => socket.disconnect()
  }, [])

  if (error)
    return (
      <div className="loading">
        <div className="plate">😵</div>
        Oups : {error}
      </div>
    )

  if (!menu || !dayState)
    return (
      <div className="loading">
        <div className="plate">🍕</div>
        On met la table…
      </div>
    )

  return (
    <div className="app">
      {!connected && <div className="offline-banner">📡 Reconnexion au serveur…</div>}

      {screen === 'settings' ? (
        <Settings />
      ) : !me ? (
        <NamePicker />
      ) : (
        <>
          <div className="canvas-wrap">
            <Scene />
          </div>

          <div className="topbar">
            <span className="brand">
              <span className="pizza">🍕</span> LHBIB
            </span>
            <span className="spacer" />
            <button className="chip accent" onClick={togglePanel}>
              🍽️ {dayState.confirmedCount}/{dayState.activeCount}
            </button>
            <button className="chip" onClick={clearMe} title="Changer de personne">
              <span className="avatar" style={{ background: me.color }}>
                {me.name[0]?.toUpperCase()}
              </span>
            </button>
            <button className="chip" onClick={() => setScreen('settings')}>
              ⚙️
            </button>
          </div>

          <Tray />
          {panelOpen && <Dashboard />}
          {modalItem && <ItemModal />}
        </>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
