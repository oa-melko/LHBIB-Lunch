import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store.js'
import BookPage, { PAGE_W, PAGE_H } from './BookPage.jsx'

const FLIP_DURATION = 0.55
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export default function MenuBook() {
  const menu = useStore((s) => s.menu)
  const catIndex = useStore((s) => s.catIndex)
  const setCatIndex = useStore((s) => s.setCatIndex)
  const categories = menu.categories

  // displayed: -1 = cover, otherwise category index currently visible on the spread
  const [displayed, setDisplayed] = useState(-1)
  const [flipping, setFlipping] = useState(false)
  const flip = useRef(null) // { dir, t, target, swapped }
  const groupRef = useRef()
  const flipperRef = useRef()
  const dragStart = useRef(null)

  // turning-page geometry, pivot on the spine (left edge)
  const flipperGeom = useMemo(() => {
    const g = new THREE.PlaneGeometry(PAGE_W, PAGE_H, 24, 1)
    g.translate(PAGE_W / 2, 0, 0)
    return g
  }, [])
  const basePositions = useMemo(() => Float32Array.from(flipperGeom.attributes.position.array), [flipperGeom])

  // start a flip whenever the requested category differs from the displayed one
  useEffect(() => {
    if (catIndex !== displayed && !flip.current) {
      flip.current = { dir: catIndex > displayed ? 1 : -1, t: 0, target: catIndex, swapped: false }
      setFlipping(true)
    }
    // safety net: if rAF is paused (hidden tab), settle the flip anyway
    const settle = setTimeout(() => {
      if (flip.current) {
        setDisplayed(flip.current.target)
        flip.current = null
        setFlipping(false)
      }
    }, FLIP_DURATION * 1000 + 400)
    return () => clearTimeout(settle)
  }, [catIndex, displayed])

  useFrame((state, dt) => {
    const f = flip.current
    const flipper = flipperRef.current
    if (!f || !flipper) return

    f.t = Math.min(1, f.t + dt / FLIP_DURATION)
    const p = ease(f.t)
    flipper.rotation.y = f.dir > 0 ? -Math.PI * p : -Math.PI * (1 - p)

    // paper curl: bow the page while it turns
    const pos = flipperGeom.attributes.position
    const curl = Math.sin(p * Math.PI) * 0.28
    for (let i = 0; i < pos.count; i++) {
      const bx = basePositions[i * 3]
      pos.setZ(i, Math.sin((bx / PAGE_W) * Math.PI) * curl)
    }
    pos.needsUpdate = true
    flipperGeom.computeVertexNormals()

    if (f.t >= 0.5 && !f.swapped) {
      f.swapped = true
      setDisplayed(f.target)
    }
    if (f.t >= 1) {
      flip.current = null
      setFlipping(false)
    }
  })

  // swipe on the 3D book (the DOM lists handle their own scrolling)
  const onPointerDown = (e) => {
    dragStart.current = e.clientX ?? e.nativeEvent?.clientX
  }
  const onPointerUp = (e) => {
    const start = dragStart.current
    dragStart.current = null
    const end = e.clientX ?? e.nativeEvent?.clientX
    if (start == null || end == null) return
    const delta = end - start
    if (Math.abs(delta) < 45) return
    if (delta < 0 && catIndex < categories.length - 1) setCatIndex(catIndex + 1)
    if (delta > 0 && catIndex > -1) setCatIndex(catIndex - 1)
  }

  const cat = displayed >= 0 ? categories[displayed] : null

  return (
    <group ref={groupRef} rotation={[-0.1, 0, 0]} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
      {/* spine */}
      <mesh position={[0, 0, -0.06]} castShadow>
        <boxGeometry args={[0.14, PAGE_H + 0.12, 0.1]} />
        <meshStandardMaterial color="#264653" roughness={0.6} />
      </mesh>

      {/* page stacks (the "thickness" of the book) */}
      <mesh position={[-PAGE_W / 2 - 0.015, 0, -0.05]} castShadow receiveShadow>
        <boxGeometry args={[PAGE_W + 0.06, PAGE_H + 0.08, 0.07]} />
        <meshStandardMaterial color="#f1e3cf" roughness={0.9} />
      </mesh>
      <mesh position={[PAGE_W / 2 + 0.015, 0, -0.05]} castShadow receiveShadow>
        <boxGeometry args={[PAGE_W + 0.06, PAGE_H + 0.08, 0.07]} />
        <meshStandardMaterial color="#f1e3cf" roughness={0.9} />
      </mesh>

      {/* visible spread */}
      <BookPage
        side="left"
        mode={displayed < 0 ? 'blank' : 'art'}
        category={cat}
        currency={menu.currency}
        dimmed={flipping}
      />
      <BookPage
        side="right"
        mode={displayed < 0 ? 'cover' : 'list'}
        category={cat}
        currency={menu.currency}
        dimmed={flipping}
      />

      {/* the sheet that turns during a flip */}
      <mesh ref={flipperRef} geometry={flipperGeom} visible={flipping} castShadow position={[0, 0, 0.03]}>
        <meshStandardMaterial color="#fdf3e3" roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
