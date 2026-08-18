import { useEffect, useState } from 'react'
import { useStore, selectMe } from './store.js'
import { api } from './api.js'
import { startSync } from './sync.js'
import NamePicker from './components/NamePicker.jsx'
import Tabs from './components/Tabs.jsx'
import Dashboard from './components/Dashboard.jsx'
import Tray from './components/Tray.jsx'
import ItemModal from './components/ItemModal.jsx'
import Settings from './components/Settings.jsx'
import Scene from './three/Scene.jsx'

export default function App() {
  const { menu, dayState, screen, panelOpen, modalItem, connected, toast, catIndex, pickerOpen } = useStore()
  const setCatIndex = useStore((s) => s.setCatIndex)
  const me = useStore(selectMe)
  const togglePanel = useStore((s) => s.togglePanel)
  const setScreen = useStore((s) => s.setScreen)
  const openPicker = useStore((s) => s.openPicker)
  const [error, setError] = useState(null)

  useEffect(() => {
    const stopSync = startSync()
    Promise.all([api.getMenu(), api.getState()])
      .then(([menu, state]) => {
        useStore.getState().setMenu(menu)
        useStore.getState().setDayState(state)
      })
      .catch((e) => setError(e.message))
    return stopSync
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
      ) : (
        <>
          <div className="canvas-wrap">
            <Scene />
          </div>

          <div className="topbar">
            <button
              className="brand"
              style={{ background: 'none', padding: 0 }}
              onClick={() => setCatIndex(-1)}
              title="Retour à la couverture"
            >
              <span className="pizza">🍕</span> LHBIB
            </button>
            <span className="spacer" />
            <button className="chip accent" onClick={togglePanel}>
              🍽️ {dayState.confirmedCount}/{dayState.activeCount}
            </button>
            <button className="chip" onClick={openPicker} title="Changer de personne">
              <span className="avatar" style={{ background: me?.color ?? '#cbd5d1' }}>
                {me ? me.name[0]?.toUpperCase() : '?'}
              </span>
            </button>
            <button className="chip" onClick={() => setScreen('settings')}>
              ⚙️
            </button>
          </div>

          <Tabs />

          <div className="nav-arrows">
            <button
              className="nav-arrow"
              disabled={catIndex <= -1}
              onClick={() => setCatIndex(Math.max(-1, catIndex - 1))}
            >
              ‹
            </button>
            <button
              className="nav-arrow"
              disabled={catIndex >= menu.categories.length - 1}
              onClick={() => setCatIndex(Math.min(menu.categories.length - 1, catIndex + 1))}
            >
              ›
            </button>
          </div>

          <Tray />
          {panelOpen && <Dashboard />}
          {modalItem && <ItemModal />}
          {pickerOpen && <NamePicker />}
        </>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}
