import { Canvas, useThree } from '@react-three/fiber'
import { Float, Sparkles, ContactShadows } from '@react-three/drei'
import MenuBook from './MenuBook.jsx'

const SPREAD_W = 5.0 // book spread width incl. margins
const SPREAD_H = 4.2

function FittedBook() {
  const { viewport } = useThree()
  // narrow screens: zoom on the right page, keep the left one peeking
  const narrow = viewport.width < SPREAD_W + 0.6
  const s = narrow
    ? Math.min(viewport.width / 3.1, viewport.height / 5.0)
    : Math.min(1.05, viewport.width / (SPREAD_W + 1), viewport.height / (SPREAD_H + 1.2))
  const x = narrow ? -1.2 * s : 0

  return (
    <group position={[x, 0, 0]} scale={s}>
      <Float speed={1.6} rotationIntensity={0.12} floatIntensity={0.4}>
        <MenuBook />
      </Float>
    </group>
  )
}

export default function Scene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.3, 5.6], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'radial-gradient(ellipse at 50% 30%, #fff3e2 0%, #fff8f0 55%, #f7e3cc 100%)' }}
    >
      <ambientLight intensity={0.95} color="#fff5ea" />
      <directionalLight
        position={[3, 5, 4]}
        intensity={1.5}
        color="#fff1e0"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-4, -2, 3]} intensity={0.5} color="#f4a261" />

      <Sparkles count={45} color="#f4a261" size={4} scale={[9, 6, 3]} position={[0, 0, -1.2]} speed={0.35} />

      <FittedBook />

      <ContactShadows position={[0, -2.35, 0]} opacity={0.35} scale={9} blur={2.8} far={4} color="#264653" />
    </Canvas>
  )
}
