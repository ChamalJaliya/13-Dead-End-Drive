/**
 * WritingTable3D.tsx
 * Victorian mahogany writing desk spanning Q1:S1 (3 cells = ~5.1m wide).
 * Features: turned legs, leather inlay surface, inkwell, stacked books, quill.
 */

interface WritingTable3DProps {
  position?: [number, number, number];
}

const MAHOG      = '#1c0e05';  // dark mahogany
const MAHOG_MID  = '#2e1a09';  // mid mahogany
const MAHOG_EDGE = '#3d2410';  // table edge highlight
const LEATHER    = '#1a3828';  // dark green leather writing surface
const LEATHER_LT = '#224d38';  // lighter green leather
const BRASS      = '#b08820';  // brass hardware
const GOLD       = '#c9a227';  // gold trim
const PAPER      = '#d8c8a4';  // paper/document
const INK        = '#0a0a18';  // ink bottle
const BOOK_1     = '#5a1515';  // red book
const BOOK_2     = '#152040';  // navy book
const BOOK_3     = '#1a3820';  // green book

export function WritingTable3D({ position = [0, 0, 0] }: WritingTable3DProps) {
  // Table spans 3 cells: W=5.1, D=1.5
  const W  = 5.10;  // X span (3 cells)
  const D  = 1.45;  // Z depth
  const TH = 0.07;  // table top thickness
  const LH = 0.62;  // leg height
  const LR = 0.048; // leg radius

  const tableTopY = LH + TH / 2;

  return (
    <group position={position}>

      {/* ── 4 Turned Mahogany Legs ───────────────────────────────────────── */}
      {([
        [-(W / 2 - 0.14),  D / 2 - 0.12],
        [ (W / 2 - 0.14),  D / 2 - 0.12],
        [-(W / 2 - 0.14), -D / 2 + 0.12],
        [ (W / 2 - 0.14), -D / 2 + 0.12],
      ] as [number, number][]).map(([lx, lz], i) => (
        <group key={`leg-${i}`}>
          {/* Main leg shaft */}
          <mesh position={[lx, LH / 2, lz]} castShadow>
            <cylinderGeometry args={[LR, LR * 1.2, LH, 10]} />
            <meshStandardMaterial color={MAHOG} roughness={0.30} metalness={0.08} />
          </mesh>
          {/* Decorative turning ring */}
          <mesh position={[lx, LH * 0.38, lz]}>
            <torusGeometry args={[LR * 1.3, 0.012, 6, 16]} />
            <meshStandardMaterial color={MAHOG_EDGE} roughness={0.28} metalness={0.10} />
          </mesh>
          {/* Foot */}
          <mesh position={[lx, 0.025, lz]} castShadow>
            <cylinderGeometry args={[LR * 1.5, LR * 1.8, 0.05, 8]} />
            <meshStandardMaterial color={MAHOG_MID} roughness={0.35} metalness={0.06} />
          </mesh>
        </group>
      ))}

      {/* ── Side Stretchers (horizontal cross bars) ──────────────────────── */}
      <mesh position={[0, LH * 0.35, D / 2 - 0.12]} castShadow>
        <boxGeometry args={[W - 0.40, 0.04, 0.045]} />
        <meshStandardMaterial color={MAHOG} roughness={0.32} metalness={0.06} />
      </mesh>
      <mesh position={[0, LH * 0.35, -(D / 2 - 0.12)]} castShadow>
        <boxGeometry args={[W - 0.40, 0.04, 0.045]} />
        <meshStandardMaterial color={MAHOG} roughness={0.32} metalness={0.06} />
      </mesh>

      {/* ── Table Top (Mahogany) ─────────────────────────────────────────── */}
      <mesh position={[0, tableTopY, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, TH, D]} />
        <meshStandardMaterial color={MAHOG_MID} roughness={0.28} metalness={0.08} />
      </mesh>
      {/* Edge moulding (slightly wider, darker) */}
      <mesh position={[0, tableTopY - 0.02, 0]} castShadow>
        <boxGeometry args={[W + 0.06, TH + 0.015, D + 0.06]} />
        <meshStandardMaterial color={MAHOG} roughness={0.25} metalness={0.10} />
      </mesh>

      {/* ── Green Leather Writing Surface Inlay ─────────────────────────── */}
      <mesh position={[0, tableTopY + TH / 2 + 0.004, 0]}>
        <boxGeometry args={[W - 0.28, 0.008, D - 0.22]} />
        <meshStandardMaterial color={LEATHER} roughness={0.70} metalness={0.0} />
      </mesh>
      {/* Leather tooled border lines */}
      <mesh position={[0, tableTopY + TH / 2 + 0.005, 0]}>
        <boxGeometry args={[W - 0.20, 0.003, D - 0.14]} />
        <meshStandardMaterial color={LEATHER_LT} roughness={0.72} metalness={0.0} />
      </mesh>

      {/* ── Brass Drawer Pulls (3, along front face) ────────────────────── */}
      {[-1.5, 0, 1.5].map((bx, i) => (
        <group key={`pull-${i}`}>
          <mesh position={[bx, tableTopY - 0.04, D / 2 + 0.02]}>
            <boxGeometry args={[0.18, 0.05, 0.03]} />
            <meshStandardMaterial color={BRASS} metalness={0.80} roughness={0.20} />
          </mesh>
          <mesh position={[bx, tableTopY - 0.04, D / 2 + 0.04]}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshStandardMaterial color={GOLD} metalness={0.88} roughness={0.12} />
          </mesh>
        </group>
      ))}

      {/* ── Surface Items ────────────────────────────────────────────────── */}

      {/* Inkwell (left area) */}
      <mesh position={[-W / 2 + 0.55, tableTopY + TH / 2 + 0.07, -D / 4]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.14, 8]} />
        <meshStandardMaterial color={INK} roughness={0.30} metalness={0.35} />
      </mesh>
      {/* Inkwell lid */}
      <mesh position={[-W / 2 + 0.55, tableTopY + TH / 2 + 0.145, -D / 4]}>
        <cylinderGeometry args={[0.065, 0.06, 0.03, 8]} />
        <meshStandardMaterial color="#22180a" roughness={0.28} metalness={0.40} />
      </mesh>

      {/* Stack of books (right area) */}
      {[
        { color: BOOK_1, w: 0.55, d: 0.38, h: 0.07, dy: 0 },
        { color: BOOK_2, w: 0.50, d: 0.36, h: 0.065, dy: 0.07 },
        { color: BOOK_3, w: 0.52, d: 0.37, h: 0.060, dy: 0.135 },
      ].map((b, i) => (
        <mesh key={`book-${i}`} position={[W / 2 - 0.55, tableTopY + TH / 2 + b.h / 2 + b.dy, 0.05]} castShadow>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial color={b.color} roughness={0.75} metalness={0.02} />
        </mesh>
      ))}

      {/* Loose paper / document sheet (centre) */}
      <mesh position={[0.3, tableTopY + TH / 2 + 0.004, 0.05]}>
        <boxGeometry args={[0.65, 0.006, 0.48]} />
        <meshStandardMaterial color={PAPER} roughness={0.90} metalness={0.0} />
      </mesh>

      {/* Quill pen (diagonal on paper) */}
      <mesh position={[0.28, tableTopY + TH / 2 + 0.01, -0.04]} rotation={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.006, 0.012, 0.55, 6]} />
        <meshStandardMaterial color="#e8d0a0" roughness={0.85} />
      </mesh>
    </group>
  );
}
