/**
 * Piano3D.tsx
 * Premium Victorian Grand Piano & Bench for 13 Dead End Drive mansion.
 * Occupies C9:E11 3x3 grid squares. Center of component is cell D10.
 *
 * Orientation:
 *   Keyboard faces South (+z)
 *   Curved tail goes North (-z)
 *   Bench sits South of keyboard (z ≈ 1.3)
 */

import * as THREE from 'three';

interface Piano3DProps {
  position?: [number, number, number];
  rotation?: number; // around Y axis
}

// Premium gothic color palette
const LACQUER_BLACK   = '#0a0a0b';  // High-gloss grand piano black
const MAHOGANY_WOOD   = '#3d1607';  // Warm luxury polished mahogany wood
const IVORY_WHITE     = '#faf9f5';  // Premium off-white ivory keys
const EBONY_BLACK     = '#111112';  // Deep ebony black keys
const BRASS_GOLD      = '#d4af37';  // Polished gold/brass castor wheels, pedals, hinge
const MUSIC_PAPER     = '#ebdcb9';  // Aged Victorian sheet music paper
const BENCH_VELVET    = '#5c0f16';  // Deep crimson velvet/leather seat padding

export function Piano3D({ position = [0, 0, 0], rotation = 0 }: Piano3DProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>

      {/* ── PIANO ASSEMBLY ── */}
      <group position={[0, 0, 0]}>

        {/* ── Piano Front Keybed Base ───────────────────────────────────── */}
        {/* The main rectangular box above the keys and holding the action */}
        <mesh position={[0, 0.76, 0.45]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.32, 0.8]} />
          <meshStandardMaterial color={LACQUER_BLACK} roughness={0.06} metalness={0.15} />
        </mesh>

        {/* Mahogany fallboard strip under keyboard */}
        <mesh position={[0, 0.62, 0.86]} castShadow receiveShadow>
          <boxGeometry args={[3.04, 0.04, 0.06]} />
          <meshStandardMaterial color={MAHOGANY_WOOD} roughness={0.12} metalness={0.08} />
        </mesh>

        {/* ── Piano Keyboard (White and Black Keys) ────────────────────── */}
        <group position={[-1.44, 0.65, 0.86]}>
          {/* Base plate under keys */}
          <mesh position={[1.44, -0.02, -0.06]} receiveShadow>
            <boxGeometry args={[2.92, 0.03, 0.28]} />
            <meshStandardMaterial color="#1c1c1e" roughness={0.8} />
          </mesh>

          {/* White keys (28 keys represented programmatically to look highly detailed) */}
          {Array.from({ length: 28 }).map((_, i) => {
            const kw = 2.88 / 28;
            return (
              <mesh key={`wk-${i}`} position={[i * kw + kw / 2, 0.005, -0.06]} castShadow receiveShadow>
                <boxGeometry args={[kw * 0.9, 0.02, 0.24]} />
                <meshStandardMaterial color={IVORY_WHITE} roughness={0.15} metalness={0.02} />
              </mesh>
            );
          })}

          {/* Black keys (ebony keys positioned between white keys) */}
          {[0, 1, 3, 4, 5, 7, 8, 10, 11, 12, 14, 15, 17, 18, 19, 21, 22, 24, 25, 26].map((idx) => {
            const kw = 2.88 / 28;
            const bx = (idx + 1) * kw;
            return (
              <mesh key={`bk-${idx}`} position={[bx, 0.02, -0.11]} castShadow>
                <boxGeometry args={[kw * 0.55, 0.028, 0.14]} />
                <meshStandardMaterial color={EBONY_BLACK} roughness={0.18} metalness={0.05} />
              </mesh>
            );
          })}
        </group>

        {/* ── Main Piano Curved Body (S-curve structure) ────────────────── */}
        {/* Left side straight rim */}
        <mesh position={[-1.52, 0.88, -0.4]} castShadow receiveShadow>
          <boxGeometry args={[0.16, 0.56, 1.2]} />
          <meshStandardMaterial color={LACQUER_BLACK} roughness={0.06} metalness={0.15} />
        </mesh>

        {/* Right side straight rim */}
        <mesh position={[1.52, 0.88, 0.45]} castShadow receiveShadow>
          <boxGeometry args={[0.16, 0.56, 0.8]} />
          <meshStandardMaterial color={LACQUER_BLACK} roughness={0.06} metalness={0.15} />
        </mesh>

        {/* Central main soundboard box */}
        <mesh position={[0, 0.84, -0.55]} castShadow receiveShadow>
          <boxGeometry args={[2.88, 0.48, 1.4]} />
          <meshStandardMaterial color={LACQUER_BLACK} roughness={0.06} metalness={0.15} />
        </mesh>

        {/* Curved tail segments using extruded/angled boxes for authentic shape */}
        <group position={[0.2, 0.84, -1.25]}>
          {/* Main diagonal long rim */}
          <mesh position={[0.7, 0, -0.1]} rotation={[0, -Math.PI / 10, 0]} castShadow>
            <boxGeometry args={[0.12, 0.48, 1.3]} />
            <meshStandardMaterial color={LACQUER_BLACK} roughness={0.06} metalness={0.15} />
          </mesh>

          {/* Swept tail curve */}
          <mesh position={[-0.2, 0, -0.8]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <boxGeometry args={[0.12, 0.48, 0.9]} />
            <meshStandardMaterial color={LACQUER_BLACK} roughness={0.06} metalness={0.15} />
          </mesh>

          {/* Left rear side segment connecting to straight left wall */}
          <mesh position={[-1.1, 0, -0.4]} rotation={[0, 0, 0]} castShadow>
            <boxGeometry args={[0.12, 0.48, 0.8]} />
            <meshStandardMaterial color={LACQUER_BLACK} roughness={0.06} metalness={0.15} />
          </mesh>

          {/* Soundboard floor inside the rim */}
          <mesh position={[-0.2, -0.16, -0.2]} receiveShadow>
            <boxGeometry args={[1.8, 0.04, 1.5]} />
            <meshStandardMaterial color={MAHOGANY_WOOD} roughness={0.25} metalness={0.05} />
          </mesh>

          {/* Gold iron plate (piano frame) inside soundboard */}
          <mesh position={[-0.1, -0.12, -0.1]} rotation={[0, 0.05, 0]} castShadow>
            <boxGeometry args={[1.4, 0.03, 1.1]} />
            <meshStandardMaterial color="hsl(45, 45%, 42%)" metalness={0.75} roughness={0.22} />
          </mesh>

          {/* Programmatic strings inside soundboard */}
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh key={`str-${i}`} position={[-0.6 + i * 0.16, -0.09, -0.1]} rotation={[0, -0.08, 0]}>
              <cylinderGeometry args={[0.005, 0.005, 1.0, 4]} />
              <meshStandardMaterial color="#888899" metalness={0.9} roughness={0.1} />
            </mesh>
          ))}
        </group>

        {/* ── Piano Music Stand and Aged Music Sheets ────────────────────── */}
        <group position={[0, 1.0, 0.35]} rotation={[-Math.PI / 7, 0, 0]}>
          {/* Mahogany shelf */}
          <mesh castShadow>
            <boxGeometry args={[1.0, 0.04, 0.2]} />
            <meshStandardMaterial color={MAHOGANY_WOOD} roughness={0.1} metalness={0.05} />
          </mesh>
          {/* Gold scrollwork backing frame */}
          <mesh position={[0, 0.22, -0.08]} castShadow>
            <boxGeometry args={[0.9, 0.4, 0.02]} />
            <meshStandardMaterial color={BRASS_GOLD} metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Left page */}
          <mesh position={[-0.2, 0.22, -0.06]} rotation={[0, 0.06, 0]} castShadow>
            <boxGeometry args={[0.34, 0.36, 0.015]} />
            <meshStandardMaterial color={MUSIC_PAPER} roughness={0.8} />
          </mesh>
          {/* Right page */}
          <mesh position={[0.2, 0.22, -0.06]} rotation={[0, -0.06, 0]} castShadow>
            <boxGeometry args={[0.34, 0.36, 0.015]} />
            <meshStandardMaterial color={MUSIC_PAPER} roughness={0.8} />
          </mesh>
        </group>

        {/* ── Open Grand Piano Lid and Lid Prop Stick ─────────────────── */}
        {/* Main large lid board hinged on the left and tilted up to the right */}
        <group position={[-1.4, 1.08, -0.5]} rotation={[0, 0, -Math.PI / 6]}>
          {/* Massive main lid board */}
          <mesh position={[1.4, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.8, 0.05, 1.7]} />
            <meshStandardMaterial color={LACQUER_BLACK} roughness={0.05} metalness={0.15} />
          </mesh>
          
          {/* Golden hinge strip at left pivot */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 1.6, 6]} />
            <meshStandardMaterial color={BRASS_GOLD} metalness={0.95} roughness={0.08} />
          </mesh>
        </group>

        {/* Polished brass lid prop stick supporting the lid */}
        <mesh position={[0.6, 1.15, -0.3]} rotation={[0, 0, 0.28]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.84, 8]} />
          <meshStandardMaterial color={BRASS_GOLD} metalness={0.9} roughness={0.12} />
        </mesh>

        {/* ── Three Massive Carved Piano Legs ────────────────────────────── */}
        {/* Front Left Leg */}
        <group position={[-1.36, 0, 0.65]}>
          {/* Leg column */}
          <mesh position={[0, 0.32, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.08, 0.64, 12]} />
            <meshStandardMaterial color={LACQUER_BLACK} roughness={0.08} metalness={0.12} />
          </mesh>
          {/* Turned ring detail */}
          <mesh position={[0, 0.52, 0]}>
            <torusGeometry args={[0.16, 0.03, 8, 16]} />
            <meshStandardMaterial color={MAHOGANY_WOOD} roughness={0.15} />
          </mesh>
          {/* Brass castor cup */}
          <mesh position={[0, 0.04, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.08, 10]} />
            <meshStandardMaterial color={BRASS_GOLD} metalness={0.88} roughness={0.18} />
          </mesh>
          {/* Castor wheel */}
          <mesh position={[0, 0.015, 0]} castShadow>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color="#2d2d30" roughness={0.6} />
          </mesh>
        </group>

        {/* Front Right Leg */}
        <group position={[1.36, 0, 0.65]}>
          {/* Leg column */}
          <mesh position={[0, 0.32, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.08, 0.64, 12]} />
            <meshStandardMaterial color={LACQUER_BLACK} roughness={0.08} metalness={0.12} />
          </mesh>
          {/* Turned ring detail */}
          <mesh position={[0, 0.52, 0]}>
            <torusGeometry args={[0.16, 0.03, 8, 16]} />
            <meshStandardMaterial color={MAHOGANY_WOOD} roughness={0.15} />
          </mesh>
          {/* Brass castor cup */}
          <mesh position={[0, 0.04, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.08, 10]} />
            <meshStandardMaterial color={BRASS_GOLD} metalness={0.88} roughness={0.18} />
          </mesh>
          {/* Castor wheel */}
          <mesh position={[0, 0.015, 0]} castShadow>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color="#2d2d30" roughness={0.6} />
          </mesh>
        </group>

        {/* Back Tail Leg */}
        <group position={[-0.45, 0, -1.8]}>
          {/* Leg column */}
          <mesh position={[0, 0.32, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.08, 0.64, 12]} />
            <meshStandardMaterial color={LACQUER_BLACK} roughness={0.08} metalness={0.12} />
          </mesh>
          {/* Turned ring detail */}
          <mesh position={[0, 0.52, 0]}>
            <torusGeometry args={[0.14, 0.025, 8, 16]} />
            <meshStandardMaterial color={MAHOGANY_WOOD} roughness={0.15} />
          </mesh>
          {/* Brass castor cup */}
          <mesh position={[0, 0.04, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.08, 10]} />
            <meshStandardMaterial color={BRASS_GOLD} metalness={0.88} roughness={0.18} />
          </mesh>
          {/* Castor wheel */}
          <mesh position={[0, 0.015, 0]} castShadow>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshStandardMaterial color="#2d2d30" roughness={0.6} />
          </mesh>
        </group>

        {/* ── Pedals and Pedal Lyre Assembly ────────────────────────────── */}
        <group position={[0, 0, 0.4]}>
          {/* Mahogany lyre column frame */}
          <mesh position={[0, 0.32, -0.06]} castShadow>
            <boxGeometry args={[0.24, 0.48, 0.06]} />
            <meshStandardMaterial color={MAHOGANY_WOOD} roughness={0.15} />
          </mesh>
          {/* Gold lyre bars decoration */}
          <mesh position={[-0.06, 0.32, -0.02]}>
            <cylinderGeometry args={[0.01, 0.01, 0.44, 6]} />
            <meshStandardMaterial color={BRASS_GOLD} metalness={0.9} roughness={0.1} />
          </mesh>
          <mesh position={[0.06, 0.32, -0.02]}>
            <cylinderGeometry args={[0.01, 0.01, 0.44, 6]} />
            <meshStandardMaterial color={BRASS_GOLD} metalness={0.9} roughness={0.1} />
          </mesh>
          
          {/* Brass pedal box base */}
          <mesh position={[0, 0.08, 0.02]} castShadow>
            <boxGeometry args={[0.3, 0.06, 0.16]} />
            <meshStandardMaterial color={BRASS_GOLD} metalness={0.7} roughness={0.3} />
          </mesh>

          {/* Left soft pedal */}
          <mesh position={[-0.08, 0.07, 0.12]} rotation={[0.05, 0, 0]} castShadow>
            <boxGeometry args={[0.04, 0.015, 0.12]} />
            <meshStandardMaterial color={BRASS_GOLD} metalness={0.95} roughness={0.06} />
          </mesh>
          {/* Middle sostenuto pedal */}
          <mesh position={[0, 0.07, 0.12]} rotation={[0.05, 0, 0]} castShadow>
            <boxGeometry args={[0.04, 0.015, 0.12]} />
            <meshStandardMaterial color={BRASS_GOLD} metalness={0.95} roughness={0.06} />
          </mesh>
          {/* Right damper pedal */}
          <mesh position={[0.08, 0.07, 0.12]} rotation={[0.05, 0, 0]} castShadow>
            <boxGeometry args={[0.04, 0.015, 0.12]} />
            <meshStandardMaterial color={BRASS_GOLD} metalness={0.95} roughness={0.06} />
          </mesh>
        </group>

      </group>

      {/* ── PIANO BENCH (Positioned South of keyboard) ─────────────────── */}
      <group position={[0, 0, 1.55]}>

        {/* Bench Main Wooden Seat Board */}
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.05, 0.54]} />
          <meshStandardMaterial color={MAHOGANY_WOOD} roughness={0.1} metalness={0.05} />
        </mesh>

        {/* Padded Crimson Velvet Cushion */}
        <mesh position={[0, 0.51, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.44, 0.08, 0.48]} />
          <meshStandardMaterial color={BENCH_VELVET} roughness={0.75} metalness={0.05} />
        </mesh>

        {/* Dynamic Tufting Buttons (Programmatic details on the velvet pad) */}
        {[-0.5, -0.25, 0, 0.25, 0.5].map((bx, i) => (
          <group key={`btn-${i}`} position={[bx, 0.55, 0]}>
            <mesh position={[0, 0, -0.1]} castShadow>
              <sphereGeometry args={[0.012, 6, 6]} />
              <meshStandardMaterial color="#2a0004" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0, 0.1]} castShadow>
              <sphereGeometry args={[0.012, 6, 6]} />
              <meshStandardMaterial color="#2a0004" roughness={0.9} />
            </mesh>
          </group>
        ))}

        {/* Four Turned Wooden Legs */}
        {/* Front Left */}
        <mesh position={[-0.68, 0.22, 0.2]} castShadow>
          <cylinderGeometry args={[0.05, 0.03, 0.44, 8]} />
          <meshStandardMaterial color={MAHOGANY_WOOD} roughness={0.12} />
        </mesh>
        {/* Front Right */}
        <mesh position={[0.68, 0.22, 0.2]} castShadow>
          <cylinderGeometry args={[0.05, 0.03, 0.44, 8]} />
          <meshStandardMaterial color={MAHOGANY_WOOD} roughness={0.12} />
        </mesh>
        {/* Back Left */}
        <mesh position={[-0.68, 0.22, -0.2]} castShadow>
          <cylinderGeometry args={[0.05, 0.03, 0.44, 8]} />
          <meshStandardMaterial color={MAHOGANY_WOOD} roughness={0.12} />
        </mesh>
        {/* Back Right */}
        <mesh position={[0.68, 0.22, -0.2]} castShadow>
          <cylinderGeometry args={[0.05, 0.03, 0.44, 8]} />
          <meshStandardMaterial color={MAHOGANY_WOOD} roughness={0.12} />
        </mesh>

      </group>

    </group>
  );
}
