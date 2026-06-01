/**
 * EliminatedPawn3D.tsx
 * Brief fallen-pawn presentation after elimination.
 */

import { useRef, type ReactElement } from 'react';
import * as THREE from 'three';
import type { CharacterId } from '../../../types/enums.js';

const PAWN_COLORS: Record<string, number> = {
  SMOTHERS: 0x3a3f47,
  DUSTY: 0xd68da5,
  CHARITY: 0x72bcae,
  LULU: 0xe8a76b,
  PARKER: 0x2c5e3d,
  CLAY: 0xadc43a,
  BEAUREGARD_III: 0x2b639e,
  SPRITZY: 0xdb3b88,
  MADAME_ASTRA: 0x7435a6,
  HICKORY: 0x347c38,
  PIERRE: 0xebebeb,
  POOPSIE: 0xe67925,
};

interface EliminatedPawn3DProps {
  readonly charId: CharacterId;
  readonly cx: number;
  readonly cz: number;
}

export function EliminatedPawn3D({ charId, cx, cz }: EliminatedPawn3DProps): ReactElement {
  const groupRef = useRef<THREE.Group>(null);
  const grey = 0x3e4045;

  return (
    <group ref={groupRef} position={[cx, 0.12, cz]} rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow>
        <capsuleGeometry args={[0.22, 0.35, 8, 16]} />
        <meshStandardMaterial color={grey} emissive={PAWN_COLORS[charId] ?? grey} emissiveIntensity={0.08} />
      </mesh>
      <mesh position={[0.2, 0, 0]} castShadow>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color={grey} />
      </mesh>
    </group>
  );
}
