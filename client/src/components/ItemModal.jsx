import { useState } from 'react'
import { useStore } from '../store.js'
import { api } from '../api.js'

export default function ItemModal() {
  const { item, category } = useStore((s) => s.modalItem)
  const meId = useStore((s) => s.meId)
  const closeModal = useStore((s) => s.closeModal)
  const bumpTray = useStore((s) => s.bumpTray)
  const showToast = useStore((s) => s.showToast)
  const currency = useStore((s) => s.menu.currency)

  const variants = item.variants ?? null
  const pastaChoice = category.choice ?? null
  const [variantKey, setVariantKey] = useState(variants?.default ?? null)
  const [pastaType, setPastaType] = useState(pastaChoice?.options[0] ?? null)
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const unitPrice =
    item.price ?? variants.options.find((o) => o.key === variantKey)?.price ?? 0

  const add = async () => {
    if (busy) return
    setBusy(true)
    try {
      await api.addItem({
        memberId: meId,
        menuItemId: item.id,
        variantKey,
        pastaType,
        quantity,
        note: note.trim() || null,
      })
      bumpTray()
      showToast(`${item.emoji ?? '😋'} ${item.name} ajouté !`)
      closeModal()
    } catch (e) {
      showToast(`😬 ${e.message}`)
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={closeModal}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>
          {category.emoji} {item.name}
        </h3>
        {item.desc && <p className="desc">{item.desc}</p>}

        {variants && (
          <>
            <div className="field-label">{variants.label}</div>
            <div className="pills">
              {variants.options.map((o) => (
                <button
                  key={o.key}
                  className={`pill${o.key === variantKey ? ' active' : ''}`}
                  onClick={() => setVariantKey(o.key)}
                >
                  {o.label} · {o.price} {currency}
                </button>
              ))}
            </div>
          </>
        )}

        {pastaChoice && (
          <>
            <div className="field-label">{pastaChoice.label}</div>
            <div className="pills">
              {pastaChoice.options.map((p) => (
                <button
                  key={p}
                  className={`pill${p === pastaType ? ' active' : ''}`}
                  onClick={() => setPastaType(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="field-label">Quantité</div>
        <div className="qty-row">
          <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
            −
          </button>
          <span className="qty-val">{quantity}</span>
          <button className="qty-btn" onClick={() => setQuantity(quantity + 1)}>
            +
          </button>
        </div>

        <div className="field-label">Remarque (optionnel)</div>
        <input
          className="note-input"
          placeholder="ex : sans olives, bien cuit…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={80}
        />

        <button className="add-btn" onClick={add} disabled={busy}>
          Ajouter · {unitPrice * quantity} {currency} 🛒
        </button>
      </div>
    </div>
  )
}
