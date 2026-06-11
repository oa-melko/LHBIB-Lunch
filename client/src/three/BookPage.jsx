import { Html } from '@react-three/drei'
import { useStore } from '../store.js'

export const PAGE_W = 2.4
export const PAGE_H = 3.4

function priceLabel(item, currency) {
  if (item.price != null) return `${item.price} ${currency}`
  const def = item.variants.options.find((o) => o.key === item.variants.default) ?? item.variants.options[0]
  return `${def.price} ${currency}`
}

function PageContent({ mode, category, currency }) {
  const openModal = useStore((s) => s.openModal)
  const setCatIndex = useStore((s) => s.setCatIndex)
  const members = useStore((s) => s.dayState?.members ?? [])
  const meId = useStore((s) => s.meId)
  const setMe = useStore((s) => s.setMe)
  const openPicker = useStore((s) => s.openPicker)
  const showToast = useStore((s) => s.showToast)

  const pickDish = (item, category) => {
    if (!meId) {
      showToast('Dis-nous qui tu es d’abord 👋')
      openPicker()
      return
    }
    openModal(item, category)
  }

  if (mode === 'cover')
    return (
      <div className="page-art" onClick={() => setCatIndex(0)} style={{ cursor: 'pointer' }}>
        <div className="big-emoji">🍕</div>
        <h2>LHBIB</h2>
        <div style={{ fontWeight: 900, fontSize: 20, color: 'var(--terracotta-dark)' }}>Le Menu</div>
        <div className="count" style={{ marginTop: 18 }}>
          👆 Touche pour ouvrir
        </div>
      </div>
    )

  if (mode === 'blank')
    return (
      <div className="page-art">
        <div className="big-emoji" style={{ fontSize: 64 }}>👋</div>
        <h2 style={{ fontSize: 24 }}>Salam l'équipe !</h2>
        <div className="count">Choisis ton déj du jour</div>
        <div className="who">Qui es-tu ?</div>
        <div className="mini-avatars">
          {members
            .filter((m) => m.active)
            .map((m) => (
              <button
                key={m.id}
                className={`mini-avatar${m.id === meId ? ' selected' : ''}`}
                onClick={() => {
                  setMe(m.id)
                  showToast(`Salam ${m.name} ! 👋`)
                }}
              >
                <span className="avatar" style={{ background: m.color }}>
                  {m.name[0]?.toUpperCase()}
                </span>
                <span className="mini-name">{m.name}</span>
              </button>
            ))}
        </div>
      </div>
    )

  if (mode === 'art')
    return (
      <div className="page-art">
        <div className="big-emoji">{category.emoji}</div>
        <h2>{category.name}</h2>
        {category.note && <div className="count">{category.note}</div>}
        <div className="count">
          {category.items.length} plat{category.items.length > 1 ? 's' : ''}
        </div>
      </div>
    )

  // mode === 'list'
  return (
    <div className="page-content">
      <div className="page-cat-head">
        <span className="emoji">{category.emoji}</span>
        <h2>{category.name}</h2>
      </div>
      {category.note && <div className="page-cat-note">{category.note}</div>}
      <div className="dish-list">
        {category.items.map((item) => (
          <button key={item.id} className="dish-row" onClick={() => pickDish(item, category)}>
            <span className="grow">
              <span className="dish-name">{item.name}</span>
              {item.desc && <span className="dish-desc">{item.desc}</span>}
            </span>
            <span className="price-chip">{priceLabel(item, currency)}</span>
          </button>
        ))}
      </div>
      <div className="page-number">— {category.name} —</div>
    </div>
  )
}

export default function BookPage({ side, mode, category, currency, dimmed }) {
  const x = side === 'left' ? -PAGE_W / 2 - 0.015 : PAGE_W / 2 + 0.015
  const isCover = mode === 'cover'

  return (
    <group position={[x, 0, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[PAGE_W, PAGE_H, 0.02]} />
        <meshStandardMaterial color={isCover ? '#e2725b' : '#fffdf8'} roughness={0.75} />
      </mesh>
      <Html
        transform
        distanceFactor={2.9}
        zIndexRange={[10, 0]}
        position={[0, 0, 0.015]}
        style={{
          opacity: dimmed ? 0.08 : 1,
          transition: 'opacity 0.18s',
          pointerEvents: dimmed ? 'none' : 'auto',
          borderRadius: 12,
          background: isCover
            ? 'linear-gradient(160deg, #f4a261 0%, #e2725b 55%, #c75b46 100%)'
            : 'transparent',
        }}
      >
        <PageContent mode={mode} category={category} currency={currency} />
      </Html>
    </group>
  )
}
