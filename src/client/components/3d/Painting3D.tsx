/**
 * Painting3D.tsx
 * Large ornate framed painting on a wooden easel — L-shaped, spans F6 + G6 + G5.
 *
 * Group origin = G6 (col 6, row 9).
 * G6 = (0, 0), G5 = (0, +1.8), F6 = (-1.8, 0) in world space.
 *
 * Layout:
 *   G5 area (0, +1.8): large gilded canvas frame, raised painting
 *   G6 area (0,  0  ): easel forward legs and crossbar
 *   F6 area (-1.8, 0): paint table / supply stand
 */

interface Painting3DProps {
  position?: [number, number, number];
}

const EASEL_WOOD   = '#2a1508';  // dark oak easel
const EASEL_MID    = '#3d2210';  // mid-tone oak
const GOLD_FRAME   = '#c9a227';  // ornate gold picture frame
const FRAME_DARK   = '#8a6810';  // frame shadow
const CANVAS_BG    = '#e8dfc4';  // aged canvas cream
const PAINT_TABLE  = '#1e1208';  // small side paint table
const PALETTE_WOOD = '#3d2810';  // palette handle
// Oil paint colours on canvas
const OIL_BLUE     = '#1a4878';
const OIL_RED      = '#8c1a1a';
const OIL_GREEN    = '#1a4a22';
const OIL_OCHRE    = '#b8800c';
const OIL_CREAM    = '#dfd0b0';

export function Painting3D({ position = [0, 0, 0] }: Painting3DProps) {
  const CANVAS_W  = 1.55;  // canvas width (X)
  const CANVAS_H  = 2.20;  // canvas height (Y)  — tall portrait painting
  const FRAME_T   = 0.07;  // frame border thickness
  const CANVAS_Z  = 0.06;  // canvas depth

  // Easel geometry
  const EASEL_H   = 2.60;  // total easel height
  const LEG_R     = 0.030; // leg radius
  const CROSS_Y   = 0.80;  // crossbar height

  // Canvas centre: in G5 area (z = +1.8) — 1 cell up from G6
  const canvasX   = 0;
  const canvasZ   = 1.8;
  const canvasY   = 1.25;  // base of canvas above ground

  // Easel legs spread to G6 area
  const legFrontZ =  0.20;   // two front legs spread forward (into G6)
  const legBackZ  =  1.80;   // back leg leans against G5 area

  return (
    <group position={position}>

      {/* ════════════════════════════════════════════════════════════════════
          EASEL STRUCTURE
      ════════════════════════════════════════════════════════════════════ */}

      {/* Front-left leg */}
      <mesh
        position={[-(CANVAS_W / 2 - 0.08), EASEL_H / 2, legFrontZ]}
        rotation={[0.22, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[LEG_R, LEG_R * 1.3, EASEL_H, 8]} />
        <meshStandardMaterial color={EASEL_WOOD} roughness={0.35} metalness={0.05} />
      </mesh>

      {/* Front-right leg */}
      <mesh
        position={[(CANVAS_W / 2 - 0.08), EASEL_H / 2, legFrontZ]}
        rotation={[0.22, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[LEG_R, LEG_R * 1.3, EASEL_H, 8]} />
        <meshStandardMaterial color={EASEL_WOOD} roughness={0.35} metalness={0.05} />
      </mesh>

      {/* Back leg (single, leans backward) */}
      <mesh
        position={[0, EASEL_H / 2, legBackZ + 0.15]}
        rotation={[-0.18, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[LEG_R, LEG_R * 1.3, EASEL_H, 8]} />
        <meshStandardMaterial color={EASEL_MID} roughness={0.38} metalness={0.04} />
      </mesh>

      {/* Lower crossbar (locks front legs) */}
      <mesh position={[0, CROSS_Y, legFrontZ + 0.10]} castShadow>
        <boxGeometry args={[CANVAS_W - 0.10, 0.040, 0.040]} />
        <meshStandardMaterial color={EASEL_WOOD} roughness={0.35} metalness={0.05} />
      </mesh>

      {/* Upper crossbar / canvas ledge */}
      <mesh position={[canvasX, canvasY - 0.05, canvasZ - 0.22]} castShadow>
        <boxGeometry args={[CANVAS_W + 0.10, 0.055, 0.060]} />
        <meshStandardMaterial color={EASEL_WOOD} roughness={0.32} metalness={0.06} />
      </mesh>

      {/* Knob / tension screw on right leg */}
      <mesh position={[CANVAS_W / 2 - 0.05, CROSS_Y + 0.42, legFrontZ + 0.08]}>
        <cylinderGeometry args={[0.035, 0.035, 0.055, 8]} />
        <meshStandardMaterial color="#8a7a60" metalness={0.75} roughness={0.25} />
      </mesh>

      {/* ════════════════════════════════════════════════════════════════════
          FRAMED CANVAS PAINTING (centred in G5 area)
      ════════════════════════════════════════════════════════════════════ */}

      {/* Outer gold ornate frame */}
      <mesh position={[canvasX, canvasY + CANVAS_H / 2, canvasZ - 0.18]} castShadow receiveShadow>
        <boxGeometry args={[CANVAS_W + FRAME_T * 2.2, CANVAS_H + FRAME_T * 2.2, CANVAS_Z * 0.5]} />
        <meshStandardMaterial color={GOLD_FRAME} metalness={0.82} roughness={0.18} />
      </mesh>

      {/* Inner frame shadow recess */}
      <mesh position={[canvasX, canvasY + CANVAS_H / 2, canvasZ - 0.14]}>
        <boxGeometry args={[CANVAS_W + FRAME_T * 0.8, CANVAS_H + FRAME_T * 0.8, CANVAS_Z * 0.5 + 0.01]} />
        <meshStandardMaterial color={FRAME_DARK} metalness={0.60} roughness={0.30} />
      </mesh>

      {/* Canvas background */}
      <mesh position={[canvasX, canvasY + CANVAS_H / 2, canvasZ - 0.10]}>
        <boxGeometry args={[CANVAS_W, CANVAS_H, CANVAS_Z]} />
        <meshStandardMaterial color={CANVAS_BG} roughness={0.82} metalness={0.0} />
      </mesh>

      {/* ── Painted scene (oil paint layers) ── */}
      {/* Sky area */}
      <mesh position={[canvasX, canvasY + CANVAS_H * 0.78, canvasZ - 0.068]}>
        <boxGeometry args={[CANVAS_W * 0.90, CANVAS_H * 0.38, 0.01]} />
        <meshStandardMaterial color={OIL_BLUE} roughness={0.88} metalness={0.0} />
      </mesh>
      {/* Midground land/hills */}
      <mesh position={[canvasX, canvasY + CANVAS_H * 0.50, canvasZ - 0.068]}>
        <boxGeometry args={[CANVAS_W * 0.90, CANVAS_H * 0.26, 0.01]} />
        <meshStandardMaterial color={OIL_GREEN} roughness={0.88} metalness={0.0} />
      </mesh>
      {/* Foreground warm ochre ground */}
      <mesh position={[canvasX, canvasY + CANVAS_H * 0.20, canvasZ - 0.068]}>
        <boxGeometry args={[CANVAS_W * 0.90, CANVAS_H * 0.35, 0.01]} />
        <meshStandardMaterial color={OIL_OCHRE} roughness={0.88} metalness={0.0} />
      </mesh>
      {/* Highlight spot (building/manor) */}
      <mesh position={[canvasX + 0.18, canvasY + CANVAS_H * 0.62, canvasZ - 0.062]}>
        <boxGeometry args={[0.24, 0.40, 0.01]} />
        <meshStandardMaterial color={OIL_CREAM} roughness={0.85} metalness={0.0} />
      </mesh>
      {/* Accent red (figure or object) */}
      <mesh position={[canvasX - 0.22, canvasY + CANVAS_H * 0.30, canvasZ - 0.062]}>
        <boxGeometry args={[0.10, 0.18, 0.01]} />
        <meshStandardMaterial color={OIL_RED} roughness={0.85} metalness={0.0} />
      </mesh>

      {/* ════════════════════════════════════════════════════════════════════
          F6 AREA: Paint Supply Table (small side table with palette)
          Offset: x = -1.8 (one cell left of G6)
      ════════════════════════════════════════════════════════════════════ */}

      {/* Small paint table legs */}
      {([[-0.22, -0.18], [0.22, -0.18], [-0.22, 0.18], [0.22, 0.18]] as [number,number][]).map(([px, pz], i) => (
        <mesh key={`ptleg-${i}`} position={[-1.80 + px, 0.28, pz]} castShadow>
          <cylinderGeometry args={[0.022, 0.028, 0.56, 7]} />
          <meshStandardMaterial color={EASEL_WOOD} roughness={0.35} metalness={0.04} />
        </mesh>
      ))}
      {/* Paint table surface */}
      <mesh position={[-1.80, 0.58, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.56, 0.040, 0.44]} />
        <meshStandardMaterial color={PAINT_TABLE} roughness={0.40} metalness={0.06} />
      </mesh>

      {/* Wooden palette on table */}
      <mesh position={[-1.80, 0.608, 0.04]} rotation={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.40, 0.018, 0.30]} />
        <meshStandardMaterial color={PALETTE_WOOD} roughness={0.50} metalness={0.02} />
      </mesh>
      {/* Paint blobs on palette */}
      {[
        { col: '#cc2222', dx:  0.10, dz: -0.06 },
        { col: '#2244cc', dx:  0.04, dz:  0.08 },
        { col: '#22aa33', dx: -0.08, dz:  0.04 },
        { col: '#ddcc22', dx: -0.10, dz: -0.08 },
        { col: '#ffffff', dx:  0.00, dz:  0.00 },
      ].map((b, i) => (
        <mesh key={`blob-${i}`} position={[-1.80 + b.dx, 0.622, b.dz + 0.04]}>
          <cylinderGeometry args={[0.028, 0.028, 0.010, 6]} />
          <meshStandardMaterial color={b.col} roughness={0.65} metalness={0.0} />
        </mesh>
      ))}

      {/* Jar of brushes on table */}
      <mesh position={[-1.80 - 0.14, 0.64, -0.14]} castShadow>
        <cylinderGeometry args={[0.040, 0.044, 0.10, 8]} />
        <meshStandardMaterial color="#5a4030" roughness={0.40} metalness={0.10} />
      </mesh>
      {/* Brush handles poking out */}
      {[-0.015, 0, 0.015].map((bx, i) => (
        <mesh key={`brush-${i}`} position={[-1.80 - 0.14 + bx, 0.76, -0.14 + (i - 1) * 0.012]} rotation={[i * 0.08 - 0.08, 0, 0]}>
          <cylinderGeometry args={[0.006, 0.006, 0.22, 5]} />
          <meshStandardMaterial color="#b8a060" roughness={0.50} />
        </mesh>
      ))}
    </group>
  );
}
