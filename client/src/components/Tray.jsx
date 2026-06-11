import { useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useStore, selectMe, selectMyItems } from '../store.js'
import { api } from '../api.js'

export default function Tray() {
  const me = useStore(selectMe)
  const myItems = useStore(useShallow(selectMyItems))
  const trayBump = useStore((s) => s.trayBump)
  const showToast = useStore((s) => s.showToast)
  const [open, setOpen] = useState(false)
  const [bounce, setBounce] = useState(false)
  const prevBump = useRef(trayBump)

  useEffect(() => {
    if (trayBump !== prevBump.current) {
      prevBump.current = trayBump
      setBounce(true)
      setOpen(true)
      const t = setTimeout(() => setBounce(false), 600)
      return () => clearTimeout(t)
    }
  }, [trayBump])

  const myTotal = myItems.reduce((s, i) => s + i.lineTotal, 0)
  const count = myItems.reduce((s, i) => s + i.quantity, 0)

  const setQty = async (item, q) => {
    try {
      if (q < 1) await api.deleteItem(item.id)
      else await api.patchItem(item.id, { quantity: q })
      if (me.confirmed) await api.confirm(me.id, false)
    } catch (e) {
      showToast(`😬 ${e.message}`)
    }
  }

  const remove = async (item) => {
    try {
      await api.deleteItem(item.id)
      if (me.confirmed) await api.confirm(me.id, false)
    } catch (e) {
      showToast(`😬 ${e.message}`)
    }
  }

  const toggleConfirm = async () => {
    try {
      await api.confirm(me.id, !me.confirmed)
      showToast(me.confirmed ? '✏️ Tu peux modifier' : '🎉 Commande confirmée !')
    } catch (e) {
      showToast(`😬 ${e.message}`)
    }
  }

  return (
    <div className="tray">
      <button
        className="tray-head"
        style={{ width: '100%', background: 'none', textAlign: 'left' }}
        onClick={() => setOpen(!open)}
      >
        <span className={`tray-badge${bounce ? ' bounce' : ''}`}>{count}</span>
        Mon plateau
        <span className="spacer" style={{ flex: 1 }} />
        <b>{myTotal} dh</b>
        <span style={{ opacity: 0.5 }}>{open ? '▾' : '▴'}</span>
      </button>

      {open && (
        <div className="tray-items">
          {myItems.length === 0 && (
            <div className="tray-line" style={{ opacity: 0.6 }}>
              Ton plateau est vide… feuillette le menu ! 📖
            </div>
          )}
          {myItems.map((i) => (
            <div key={i.id} className="tray-line">
              <span className="grow">
                {i.name}
                {i.pastaType ? ` (${i.pastaType})` : ''}
                <span className="muted">
                  {i.variantLabel ? `${i.variantLabel} · ` : ''}
                  {i.unitPrice} dh{i.note ? ` · ${i.note}` : ''}
                </span>
              </span>
              <button className="qty-btn" onClick={() => setQty(i, i.quantity - 1)}>
                −
              </button>
              <b>{i.quantity}</b>
              <button className="qty-btn" onClick={() => setQty(i, i.quantity + 1)}>
                +
              </button>
              <button className="del-btn" onClick={() => remove(i)}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        className={`confirm-btn${me.confirmed ? ' confirmed' : ''}`}
        onClick={toggleConfirm}
        disabled={myItems.length === 0 && !me.confirmed}
      >
        {me.confirmed ? '✅ Confirmé ! (toucher pour modifier)' : 'Je confirme ! ✅'}
      </button>
    </div>
  )
}
