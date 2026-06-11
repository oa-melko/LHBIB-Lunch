import { useEffect, useState } from 'react'
import { api } from '../api.js'
import { useStore } from '../store.js'

export default function ExportBar() {
  const showToast = useStore((s) => s.showToast)
  const total = useStore((s) => s.dayState.total)
  const [number, setNumber] = useState('')

  useEffect(() => {
    api.getSettings().then((s) => setNumber(s.whatsappNumber)).catch(() => {})
  }, [])

  const openWhatsApp = async () => {
    try {
      const { text } = await api.getMessage()
      const base = number ? `https://wa.me/${number.replace(/\D/g, '')}` : 'https://wa.me/'
      window.open(`${base}?text=${encodeURIComponent(text)}`, '_blank')
    } catch (e) {
      showToast(`😬 ${e.message}`)
    }
  }

  const copy = async () => {
    try {
      const { text } = await api.getMessage()
      await navigator.clipboard.writeText(text)
      showToast('📋 Commande copiée !')
    } catch (e) {
      showToast(`😬 ${e.message}`)
    }
  }

  if (total === 0) return null

  return (
    <div className="export-bar">
      <button className="export-btn wa" onClick={openWhatsApp}>
        📲 WhatsApp
      </button>
      <button className="export-btn copy" onClick={copy}>
        📋 Copier
      </button>
    </div>
  )
}
