/**
 * TrapFx3D.tsx
 * Cell-anchored trap motion FX (drop + burst). Other fallStyles drive scene props.
 */

import { useRef, type ReactElement } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { TrapCinematicConfig } from '../../cinematics/trapCinematics.js';

interface TrapFx3DProps {
  readonly worldX: number;
  readonly worldZ: number;
  readonly fallStyle: TrapCinematicConfig['fallStyle'];
  readonly isActive: boolean;
  readonly onImpact: () => void;
}

function ChandelierDrop({
  worldX,
  worldZ,
  isActive,
  onImpact,
}: {
  worldX: number;
  worldZ: number;
  isActive: boolean;
  onImpact: () => void;
}): ReactElement {
  const groupRef = useRef<THREE.Group>(null);
  const velocityRef = useRef(0);
  const impactFired = useRef(false);
  const START_Y = 7;
  const TARGET_Y = 0.5;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (!isActive) {
      groupRef.current.position.y = START_Y;
      velocityRef.current = 0;
      impactFired.current = false;
      return;
    }
    if (groupRef.current.position.y <= TARGET_Y) {
      groupRef.current.position.y = TARGET_Y;
      if (!impactFired.current) {
        impactFired.current = true;
        onImpact();
      }
      return;
    }
    velocityRef.current += 20 * delta;
    groupRef.current.position.y -= velocityRef.current * delta;
    if (groupRef.current.position.y < TARGET_Y) {
      groupRef.current.position.y = TARGET_Y;
    }
  });

  return (
    <group ref={groupRef} position={[worldX, START_Y, worldZ]}>
      <mesh position={[0, 2.8, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 5.6, 8]} />
        <meshStandardMaterial color="#d4af37" metalness={0.95} roughness={0.05} />
      </mesh>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.75, 0.55, 0.18, 10]} />
        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial
          color="#ffcc00"
          emissive="#ffcc00"
          emissiveIntensity={isActive ? 1.2 : 0.6}
        />
      </mesh>
      <pointLight color="#ffcc00" intensity={isActive ? 10 : 4} distance={8} decay={2} />
    </group>
  );
}

function BurstFx({
  worldX,
  worldZ,
  isActive,
  onImpact,
}: {
  worldX: number;
  worldZ: number;
  isActive: boolean;
  onImpact: () => void;
}): ReactElement {
  const lightRef = useRef<THREE.PointLight>(null);
  const firedRef = useRef(false);
  const tRef = useRef(0);

  useFrame((_, delta) => {
    if (!isActive) {
      tRef.current = 0;
      firedRef.current = false;
      if (lightRef.current) lightRef.current.intensity = 4;
      return;
    }
    tRef.current += delta;
    if (lightRef.current) {
      lightRef.current.intensity = 20 + Math.sin(tRef.current * 40) * 8;
    }
    if (!firedRef.current && tRef.current >= 0.12) {
      firedRef.current = true;
      onImpact();
    }
  });

  return (
    <group position={[worldX, 0.8, worldZ]}>
      <pointLight ref={lightRef} color="#ff5500" intensity={4} distance={10} decay={2} />
      {isActive && (
        <mesh>
          <sphereGeometry args={[0.5, 12, 12]} />
          <meshStandardMaterial
            color="#ff6600"
            emissive="#ff3300"
            emissiveIntensity={2}
            transparent
            opacity={0.7}
          />
        </mesh>
      )}
    </group>
  );
}

export function TrapFx3D({
  worldX,
  worldZ,
  fallStyle,
  isActive,
  onImpact,
}: TrapFx3DProps): ReactElement | null {
  if (fallStyle === 'drop') {
    return (
      <ChandelierDrop
        worldX={worldX}
        worldZ={worldZ}
        isActive={isActive}
        onImpact={onImpact}
      />
    );
  }
  if (fallStyle === 'burst') {
    return (
      <BurstFx
        worldX={worldX}
        worldZ={worldZ}
        isActive={isActive}
        onImpact={onImpact}
      />
    );
  }
  return null;
}
