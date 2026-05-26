/**
 * Vase3D.tsx
 * Decorative Victorian urn/vase on a marble pedestal — occupies cell E1 (single square).
 * Built with stacked cylinders to approximate a classic vase silhouette.
 */

interface Vase3DProps {
  position?: [number, number, number];
}

const MARBLE_BASE  = '#d4cfc4';  // pale marble pedestal
const MARBLE_VEIN  = '#b0a898';  // veined marble mid-tone
const CERAMIC_BODY = '#c8a96e';  // warm terracotta/gold ceramic
const CERAMIC_DARK = '#a07c44';  // shadow side
const GOLD_RIM     = '#c9a227';  // gold lip and handles
const FLOWER_GREEN = '#3a6b35';  // foliage in vase

export function Vase3D({ position = [0, 0, 0] }: Vase3DProps) {
  return (
    <group position={position}>

      {/* ── Marble Pedestal ─────────────────────────────────────────────── */}
      {/* Base slab */}
      <mesh position={[0, 0.04, 0]} receiveShadow castShadow>
        <boxGeometry args={[0.70, 0.08, 0.70]} />
        <meshStandardMaterial color={MARBLE_BASE} roughness={0.20} metalness={0.04} />
      </mesh>
      {/* Pedestal column */}
      <mesh position={[0, 0.20, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.18, 0.24, 12]} />
        <meshStandardMaterial color={MARBLE_VEIN} roughness={0.22} metalness={0.05} />
      </mesh>
      {/* Capital (top of column) */}
      <mesh position={[0, 0.34, 0]} castShadow>
        <cylinderGeometry args={[0.20, 0.14, 0.08, 12]} />
        <meshStandardMaterial color={MARBLE_BASE} roughness={0.18} metalness={0.05} />
      </mesh>

      {/* ── Vase Body (stacked cylinders for silhouette) ────────────────── */}
      {/* Wide belly */}
      <mesh position={[0, 0.66, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.16, 0.50, 16]} />
        <meshStandardMaterial color={CERAMIC_BODY} roughness={0.45} metalness={0.06} />
      </mesh>
      {/* Narrowing upper shoulder */}
      <mesh position={[0, 0.96, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.22, 0.20, 16]} />
        <meshStandardMaterial color={CERAMIC_BODY} roughness={0.45} metalness={0.06} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 1.14, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 0.16, 12]} />
        <meshStandardMaterial color={CERAMIC_DARK} roughness={0.50} metalness={0.05} />
      </mesh>
      {/* Flared rim/lip */}
      <mesh position={[0, 1.26, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.08, 0.08, 12]} />
        <meshStandardMaterial color={GOLD_RIM} metalness={0.85} roughness={0.15} />
      </mesh>
      {/* Inside opening (dark circle) */}
      <mesh position={[0, 1.31, 0]}>
        <cylinderGeometry args={[0.10, 0.10, 0.02, 12]} />
        <meshStandardMaterial color="#1a1008" roughness={1.0} />
      </mesh>

      {/* ── Gold accent ring on belly ────────────────────────────────────── */}
      <mesh position={[0, 0.62, 0]}>
        <torusGeometry args={[0.21, 0.015, 8, 24]} />
        <meshStandardMaterial color={GOLD_RIM} metalness={0.90} roughness={0.10} />
      </mesh>
      <mesh position={[0, 0.88, 0]}>
        <torusGeometry args={[0.20, 0.012, 8, 24]} />
        <meshStandardMaterial color={GOLD_RIM} metalness={0.90} roughness={0.10} />
      </mesh>

      {/* ── Foliage / flowers peeking out ───────────────────────────────── */}
      <mesh position={[0, 1.42, 0]} castShadow>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color={FLOWER_GREEN} roughness={0.90} metalness={0.0} />
      </mesh>
      <mesh position={[0.08, 1.50, 0.04]} castShadow>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial color="#c84855" roughness={0.85} />
      </mesh>
      <mesh position={[-0.07, 1.52, -0.03]} castShadow>
        <sphereGeometry args={[0.05, 6, 6]} />
        <meshStandardMaterial color="#e8b422" roughness={0.85} />
      </mesh>
    </group>
  );
}
