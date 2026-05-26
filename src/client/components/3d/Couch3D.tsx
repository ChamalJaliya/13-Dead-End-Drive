/**
 * Couch3D.tsx
 * Premium velvet sofas for 13 Dead End Drive mansion.
 *
 * variant='small' → L-shaped corner sofa (O5/O6/P6 — 3 squares exactly)
 *   Group origin = cell O6. Geometry:
 *     Main arm covers O6(z∈[-0.9,+0.9]) + O5(z∈[+0.9,+2.7]) at x∈[-0.88,+0.88]
 *     Wing arm covers P6 at x∈[+0.92,+2.68], z∈[-0.85,+0.85]
 *
 * variant='big'   → Long sectional sofa (T9:U13 — 10 squares)
 *   Group origin = centre of T9:U13 at toWorld(19.5, 4)
 */

interface Couch3DProps {
  position?: [number, number, number];
  rotation?: number;
  variant?: 'small' | 'big';
}

// ── Palette ───────────────────────────────────────────────────────────────────
const V_BASE   = '#2e1245';   // deep velvet frame
const V_MID    = '#4a2070';   // velvet backrest face
const V_SEAT   = '#6b3a94';   // lighter seat cushion top
const MAHOG    = '#180c04';   // dark mahogany wood
const LEG_C    = '#2b1708';   // leg/foot wood
const GOLD     = '#c9a227';   // gold piping

export function Couch3D({
  position = [0, 0, 0],
  rotation = 0,
  variant = 'big',
}: Couch3DProps) {
  return variant === 'small'
    ? <SmallCornerSofa position={position} rotation={rotation} />
    : <BigSofa         position={position} rotation={rotation} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// BIG SOFA  (T9:U13 — 2 cols × 5 ranks = 3.6m wide × 9.0m long)
// Backrest along HIGH-X side (U column / right wall).  Seat faces −X.
// ─────────────────────────────────────────────────────────────────────────────

function BigSofa({ position, rotation }: { position: [number,number,number]; rotation: number }) {
  const W   = 3.30;  // full X span (2 cells ≈ 3.6m minus margins)
  const D   = 8.80;  // full Z span (5 cells ≈ 9.0m minus margins)

  const LEG_H  = 0.20;  // visible leg height
  const BASE_H = 0.24;  // frame/base height
  const CUSH_H = 0.26;  // seat cushion thickness
  const BACK_H = 0.82;  // backrest height above frame top
  const BACK_T = 0.28;  // backrest thickness
  const ARM_T  = 0.26;  // end armrest thickness (Z-axis)

  const SEAT_D = W - BACK_T - 0.10; // seat depth in X (from front to just before backrest)
  const SEAT_X = -(BACK_T / 2);     // seat cushion centre X (shifted away from backrest)

  const frameTop = LEG_H + BASE_H;
  const cushTop  = frameTop + CUSH_H;

  const N_CUSHIONS = 5;
  const cushZ      = (D - ARM_T * 2 - 0.10) / N_CUSHIONS;

  return (
    <group position={position} rotation={[0, rotation, 0]}>

      {/* ── 8 Turned Wooden Legs ──────────────────────────────────────────── */}
      {([-D/2+0.22, -D/6, D/6, D/2-0.22] as number[]).flatMap((lz, i) =>
        ([-(W/2 - 0.16), W/2 - 0.16] as number[]).map((lx, j) => (
          <mesh key={`bl-${i}-${j}`} position={[lx, LEG_H/2, lz]} castShadow>
            <cylinderGeometry args={[0.045, 0.060, LEG_H, 8]} />
            <meshStandardMaterial color={LEG_C} roughness={0.25} metalness={0.08} />
          </mesh>
        ))
      )}

      {/* ── Low Mahogany Frame ───────────────────────────────────────────── */}
      <mesh position={[0, LEG_H + BASE_H/2, 0]} castShadow receiveShadow>
        <boxGeometry args={[W, BASE_H, D]} />
        <meshStandardMaterial color={MAHOG} roughness={0.40} metalness={0.10} />
      </mesh>

      {/* ── 5 Seat Cushions (puffy, clearly separate) ────────────────────── */}
      {Array.from({ length: N_CUSHIONS }).map((_, i) => {
        const cz = -D/2 + ARM_T + 0.05 + cushZ * i + cushZ / 2;
        return (
          <mesh key={`sc-${i}`} position={[SEAT_X, frameTop + CUSH_H/2, cz]} castShadow receiveShadow>
            <boxGeometry args={[SEAT_D, CUSH_H, cushZ - 0.08]} />
            <meshStandardMaterial color={V_SEAT} roughness={0.88} metalness={0.0} />
          </mesh>
        );
      })}

      {/* ── Tall Backrest — clearly at +X side (U column wall) ───────────── */}
      <mesh position={[W/2 - BACK_T/2, LEG_H + (BASE_H + BACK_H)/2, 0]} castShadow receiveShadow>
        <boxGeometry args={[BACK_T, BASE_H + BACK_H, D]} />
        <meshStandardMaterial color={V_BASE} roughness={0.82} metalness={0.02} />
      </mesh>
      {/* Backrest cushion face panels (5 panels facing −X) */}
      {Array.from({ length: N_CUSHIONS }).map((_, i) => {
        const cz = -D/2 + ARM_T + 0.05 + cushZ * i + cushZ / 2;
        return (
          <mesh key={`bc-${i}`} position={[W/2 - BACK_T - 0.05, frameTop + BACK_H*0.55, cz]} castShadow>
            <boxGeometry args={[0.10, BACK_H * 0.80, cushZ - 0.10]} />
            <meshStandardMaterial color={V_MID} roughness={0.85} />
          </mesh>
        );
      })}
      {/* Gold piping rail along top of backrest */}
      <mesh position={[W/2 - BACK_T/2, LEG_H + BASE_H + BACK_H + 0.022, 0]}>
        <boxGeometry args={[BACK_T + 0.02, 0.04, D + 0.04]} />
        <meshStandardMaterial color={GOLD} metalness={0.88} roughness={0.12} />
      </mesh>

      {/* ── End Armrests (at Z extremes) ─────────────────────────────────── */}
      {([-D/2 + ARM_T/2, D/2 - ARM_T/2] as number[]).map((az, idx) => (
        <group key={`arm-${idx}`}>
          <mesh position={[0, LEG_H + (BASE_H + BACK_H)/2, az]} castShadow receiveShadow>
            <boxGeometry args={[W, BASE_H + BACK_H, ARM_T]} />
            <meshStandardMaterial color={V_BASE} roughness={0.82} />
          </mesh>
          {/* Mahogany cap on top of each armrest */}
          <mesh position={[0, LEG_H + BASE_H + BACK_H + 0.025, az]}>
            <boxGeometry args={[W + 0.06, 0.05, ARM_T + 0.06]} />
            <meshStandardMaterial color={MAHOG} roughness={0.28} metalness={0.12} />
          </mesh>
          {/* Gold trim on cap edge */}
          <mesh position={[0, LEG_H + BASE_H + BACK_H + 0.046, az]}>
            <boxGeometry args={[W + 0.08, 0.018, ARM_T + 0.08]} />
            <meshStandardMaterial color={GOLD} metalness={0.85} roughness={0.15} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL CORNER SOFA  (O5 / O6 / P6 — exactly 3 cells, L-shaped)
//
// Group origin = cell O6 (col 14, row 9).
// O6 = (0, 0), O5 = (0, +1.8), P6 = (+1.8, 0) in world space.
//
// Main arm (O6 + O5): x ∈ [−0.88, +0.88], z ∈ [−0.85, +2.65]
// Wing arm (P6):      x ∈ [+0.92, +2.68], z ∈ [−0.85, +0.85]
//
// Backrests wrap the two outer walls of the L:
//   ① High-Z wall (back of O5): z ≈ +2.62, across main arm x-span
//   ② Low-X wall (left of O column): x ≈ −0.75, along full main arm z-span
// Open seating faces toward +X and −Z (room interior).
// ─────────────────────────────────────────────────────────────────────────────

function SmallCornerSofa({ position, rotation }: { position: [number,number,number]; rotation: number }) {
  const LEG_H  = 0.18;
  const BASE_H = 0.22;
  const CUSH_H = 0.24;
  const BACK_H = 0.76;
  const BACK_T = 0.25;
  const ARM_T  = 0.22;

  const frameTop = LEG_H + BASE_H;

  // ── Main arm dimensions (covers O6 at z∈[-0.9,+0.9] and O5 at z∈[+0.9,+2.7]) ──
  const mW = 1.76;  // X width  (1 cell)
  const mD = 3.50;  // Z depth  (2 cells)
  const mCX = 0;    const mCZ = 0.90;  // centre of 2-cell Z span

  // ── Wing arm dimensions (covers P6 at x∈[+0.9,+2.7], z∈[-0.9,+0.9]) ──
  const wW = 1.72;  // X width  (1 cell, inset so it doesn't touch P5)
  const wD = 1.72;  // Z depth  (1 cell)
  const wCX = 1.80; const wCZ = 0;     // centre of P6 cell

  // Seat cushion X positions (seat is to the right of the left-side backrest)
  const seatXOffset = BACK_T / 2;  // shift seat centre away from backrest

  return (
    <group position={position} rotation={[0, rotation, 0]}>

      {/* ── MAIN ARM LEGS (4) ─────────────────────────────────────────────── */}
      {([
        [mCX - mW/2 + 0.14, mCZ - mD/2 + 0.14],
        [mCX + mW/2 - 0.14, mCZ - mD/2 + 0.14],
        [mCX - mW/2 + 0.14, mCZ + mD/2 - 0.14],
        [mCX + mW/2 - 0.14, mCZ + mD/2 - 0.14],
      ] as [number,number][]).map(([lx, lz], i) => (
        <mesh key={`ml-${i}`} position={[lx, LEG_H/2, lz]} castShadow>
          <cylinderGeometry args={[0.038, 0.050, LEG_H, 8]} />
          <meshStandardMaterial color={LEG_C} roughness={0.25} metalness={0.08} />
        </mesh>
      ))}

      {/* ── MAIN ARM FRAME ───────────────────────────────────────────────── */}
      <mesh position={[mCX, LEG_H + BASE_H/2, mCZ]} castShadow receiveShadow>
        <boxGeometry args={[mW, BASE_H, mD]} />
        <meshStandardMaterial color={MAHOG} roughness={0.40} metalness={0.10} />
      </mesh>

      {/* Main arm seat cushions — 2 cushions (one per cell rank) */}
      {[mCZ - 0.88, mCZ + 0.88].map((cz, i) => (
        <mesh key={`msc-${i}`} position={[mCX + seatXOffset, frameTop + CUSH_H/2, cz]} castShadow receiveShadow>
          <boxGeometry args={[mW - BACK_T - 0.08, CUSH_H, 1.58]} />
          <meshStandardMaterial color={V_SEAT} roughness={0.88} metalness={0.0} />
        </mesh>
      ))}

      {/* ── MAIN ARM BACKREST ① — along LOW-X edge (left outer wall) ──────── */}
      <mesh position={[mCX - mW/2 + BACK_T/2, LEG_H + (BASE_H + BACK_H)/2, mCZ]} castShadow receiveShadow>
        <boxGeometry args={[BACK_T, BASE_H + BACK_H, mD]} />
        <meshStandardMaterial color={V_BASE} roughness={0.82} metalness={0.02} />
      </mesh>
      {/* Back cushion panels on low-X backrest, facing +X */}
      {[mCZ - 0.88, mCZ + 0.88].map((cz, i) => (
        <mesh key={`mbcp-${i}`} position={[mCX - mW/2 + BACK_T + 0.04, frameTop + BACK_H*0.52, cz]} castShadow>
          <boxGeometry args={[0.08, BACK_H * 0.78, 1.50]} />
          <meshStandardMaterial color={V_MID} roughness={0.85} />
        </mesh>
      ))}
      {/* Gold piping — top of low-X backrest */}
      <mesh position={[mCX - mW/2 + BACK_T/2, LEG_H + BASE_H + BACK_H + 0.02, mCZ]}>
        <boxGeometry args={[BACK_T + 0.02, 0.035, mD + 0.02]} />
        <meshStandardMaterial color={GOLD} metalness={0.88} roughness={0.12} />
      </mesh>

      {/* ── MAIN ARM BACKREST ② — along HIGH-Z edge (back of O5) ──────────── */}
      <mesh position={[mCX, LEG_H + (BASE_H + BACK_H)/2, mCZ + mD/2 - BACK_T/2]} castShadow receiveShadow>
        <boxGeometry args={[mW, BASE_H + BACK_H, BACK_T]} />
        <meshStandardMaterial color={V_BASE} roughness={0.82} metalness={0.02} />
      </mesh>
      {/* Gold piping — top of high-Z backrest */}
      <mesh position={[mCX, LEG_H + BASE_H + BACK_H + 0.02, mCZ + mD/2 - BACK_T/2]}>
        <boxGeometry args={[mW + 0.02, 0.035, BACK_T + 0.02]} />
        <meshStandardMaterial color={GOLD} metalness={0.88} roughness={0.12} />
      </mesh>

      {/* ── MAIN ARM FRONT ARMREST — low-Z open end ──────────────────────── */}
      <mesh position={[mCX, LEG_H + (BASE_H + BACK_H*0.75)/2, mCZ - mD/2 + ARM_T/2]} castShadow receiveShadow>
        <boxGeometry args={[mW, BASE_H + BACK_H*0.75, ARM_T]} />
        <meshStandardMaterial color={V_BASE} roughness={0.82} />
      </mesh>
      {/* Mahogany cap */}
      <mesh position={[mCX, LEG_H + BASE_H + BACK_H*0.75 + 0.025, mCZ - mD/2 + ARM_T/2]}>
        <boxGeometry args={[mW + 0.05, 0.048, ARM_T + 0.05]} />
        <meshStandardMaterial color={MAHOG} roughness={0.28} metalness={0.12} />
      </mesh>

      {/* ══════════════════════════════════════════════════════════════════════
          WING ARM (P6)
      ══════════════════════════════════════════════════════════════════════ */}

      {/* Wing arm legs (4) */}
      {([
        [wCX - wW/2 + 0.14, wCZ - wD/2 + 0.14],
        [wCX + wW/2 - 0.14, wCZ - wD/2 + 0.14],
        [wCX - wW/2 + 0.14, wCZ + wD/2 - 0.14],
        [wCX + wW/2 - 0.14, wCZ + wD/2 - 0.14],
      ] as [number,number][]).map(([lx, lz], i) => (
        <mesh key={`wl-${i}`} position={[lx, LEG_H/2, lz]} castShadow>
          <cylinderGeometry args={[0.038, 0.050, LEG_H, 8]} />
          <meshStandardMaterial color={LEG_C} roughness={0.25} metalness={0.08} />
        </mesh>
      ))}

      {/* Wing arm frame */}
      <mesh position={[wCX, LEG_H + BASE_H/2, wCZ]} castShadow receiveShadow>
        <boxGeometry args={[wW, BASE_H, wD]} />
        <meshStandardMaterial color={MAHOG} roughness={0.40} metalness={0.10} />
      </mesh>

      {/* Wing arm seat cushion */}
      <mesh position={[wCX, frameTop + CUSH_H/2, wCZ]} castShadow receiveShadow>
        <boxGeometry args={[wW - 0.08, CUSH_H, wD - 0.08]} />
        <meshStandardMaterial color={V_SEAT} roughness={0.88} metalness={0.0} />
      </mesh>

      {/* Wing backrest — high-X end wall (outer right edge of P6) */}
      <mesh position={[wCX + wW/2 - BACK_T/2, LEG_H + (BASE_H + BACK_H)/2, wCZ]} castShadow receiveShadow>
        <boxGeometry args={[BACK_T, BASE_H + BACK_H, wD]} />
        <meshStandardMaterial color={V_BASE} roughness={0.82} metalness={0.02} />
      </mesh>
      {/* Gold piping — top of wing backrest */}
      <mesh position={[wCX + wW/2 - BACK_T/2, LEG_H + BASE_H + BACK_H + 0.02, wCZ]}>
        <boxGeometry args={[BACK_T + 0.02, 0.035, wD + 0.02]} />
        <meshStandardMaterial color={GOLD} metalness={0.88} roughness={0.12} />
      </mesh>

      {/* Wing front armrest — low-Z open end of P6 */}
      <mesh position={[wCX, LEG_H + (BASE_H + BACK_H*0.75)/2, wCZ - wD/2 + ARM_T/2]} castShadow receiveShadow>
        <boxGeometry args={[wW, BASE_H + BACK_H*0.75, ARM_T]} />
        <meshStandardMaterial color={V_BASE} roughness={0.82} />
      </mesh>
      {/* Mahogany cap */}
      <mesh position={[wCX, LEG_H + BASE_H + BACK_H*0.75 + 0.025, wCZ - wD/2 + ARM_T/2]}>
        <boxGeometry args={[wW + 0.05, 0.048, ARM_T + 0.05]} />
        <meshStandardMaterial color={MAHOG} roughness={0.28} metalness={0.12} />
      </mesh>
    </group>
  );
}
