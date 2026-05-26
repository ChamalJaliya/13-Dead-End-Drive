/**
 * Fireplace3D.tsx
 * Premium 3D React-Three-Fiber component for the Gothic Fireplace obstacle.
 * Features an ornate stone/walnut structure and a programmatically flickering orange fire light.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Fireplace3DProps {
  position?: [number, number, number];
  rotation?: number;
}

export function Fireplace3D({ position = [0, 0, 0], rotation = 0 }: Fireplace3DProps) {
  const fireLightRef = useRef<THREE.PointLight>(null);
  const flameGroupRef = useRef<THREE.Group>(null);

  // Programmatic flame flicker and micro-animation
  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    
    // Flickering firelight intensity
    if (fireLightRef.current) {
      fireLightRef.current.intensity = 14 + Math.sin(elapsed * 15) * 2.5 + Math.cos(elapsed * 32) * 1.2;
    }

    // Micro-scale pulsing for the visual flames to look alive
    if (flameGroupRef.current) {
      const scalePulse = 1.0 + Math.sin(elapsed * 10) * 0.08;
      flameGroupRef.current.scale.set(scalePulse, scalePulse + Math.cos(elapsed * 8) * 0.05, scalePulse);
    }
  });

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* ── HEARTH BASE (Granite stone slab on floor) ── */}
      <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[12.2, 0.16, 5.0]} />
        <meshStandardMaterial color="#1e2025" roughness={0.88} metalness={0.12} />
      </mesh>

      {/* ── BACK STONE WALL (Large dark gothic brick backing) ── */}
      <mesh position={[0, 4.4, -2.1]} castShadow receiveShadow>
        <boxGeometry args={[11.8, 8.5, 0.6]} />
        <meshStandardMaterial color="#17191e" roughness={0.9} metalness={0.08} />
      </mesh>

      {/* ── FIREBOX CHAMBER (Black ash soot interior walls) ── */}
      {/* Left Interior Wall */}
      <mesh position={[-2.4, 1.25, -1.0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 2.3, 1.6]} />
        <meshStandardMaterial color="#0b0c0e" roughness={0.95} metalness={0.05} />
      </mesh>
      {/* Right Interior Wall */}
      <mesh position={[2.4, 1.25, -1.0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 2.3, 1.6]} />
        <meshStandardMaterial color="#0b0c0e" roughness={0.95} metalness={0.05} />
      </mesh>
      {/* Ash Backplate */}
      <mesh position={[0, 1.25, -1.75]} castShadow receiveShadow>
        <boxGeometry args={[4.4, 2.3, 0.1]} />
        <meshStandardMaterial color="#08080a" roughness={0.98} metalness={0.02} />
      </mesh>

      {/* ── GOTHIC ARCHWAY & ORNATE PILLARS (Columns flanking the hearth) ── */}
      {/* Left Column Base */}
      <mesh position={[-3.2, 0.28, 0.6]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.36, 1.2]} />
        <meshStandardMaterial color="#2d303b" roughness={0.8} metalness={0.2} />
      </mesh>
      {/* Left Main Shaft */}
      <mesh position={[-3.2, 1.75, 0.6]} castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.46, 2.6, 12]} />
        <meshStandardMaterial color="#252831" roughness={0.8} metalness={0.2} />
      </mesh>
      {/* Left Column Cap */}
      <mesh position={[-3.2, 3.2, 0.6]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.3, 1.1]} />
        <meshStandardMaterial color="#2d303b" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Right Column Base */}
      <mesh position={[3.2, 0.28, 0.6]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.36, 1.2]} />
        <meshStandardMaterial color="#2d303b" roughness={0.8} metalness={0.2} />
      </mesh>
      {/* Right Main Shaft */}
      <mesh position={[3.2, 1.75, 0.6]} castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.46, 2.6, 12]} />
        <meshStandardMaterial color="#252831" roughness={0.8} metalness={0.2} />
      </mesh>
      {/* Right Column Cap */}
      <mesh position={[3.2, 3.2, 0.6]} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.3, 1.1]} />
        <meshStandardMaterial color="#2d303b" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* ── POLISHED WALNUT MANTELPIECE (Heavy ornate wood slab across the top) ── */}
      <mesh position={[0, 3.65, 0.2]} castShadow receiveShadow>
        <boxGeometry args={[12.2, 0.6, 3.6]} />
        <meshStandardMaterial color="#2c1a0e" roughness={0.22} metalness={0.15} />
      </mesh>
      {/* Gold Trim Ribbon around the mantelpiece */}
      <mesh position={[0, 3.65, 0.2]} castShadow>
        <boxGeometry args={[12.26, 0.12, 3.66]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* ── FIRE GRATE & BURNING LOGS ── */}
      {/* Iron Grate Base */}
      <mesh position={[0, 0.22, -0.6]} castShadow>
        <boxGeometry args={[2.8, 0.1, 1.6]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.6} />
      </mesh>
      {/* Charcoal Log 1 */}
      <mesh position={[-0.6, 0.34, -0.7]} rotation={[0.1, 0.2, 1.3]} castShadow>
        <cylinderGeometry args={[0.16, 0.18, 1.6, 6]} />
        <meshStandardMaterial color="#140a05" roughness={0.9} emissive="#ff4500" emissiveIntensity={0.25} />
      </mesh>
      {/* Charcoal Log 2 */}
      <mesh position={[0.6, 0.34, -0.7]} rotation={[-0.1, -0.2, -1.3]} castShadow>
        <cylinderGeometry args={[0.15, 0.17, 1.6, 6]} />
        <meshStandardMaterial color="#140a05" roughness={0.9} emissive="#ff4500" emissiveIntensity={0.25} />
      </mesh>
      {/* Cross Log 3 */}
      <mesh position={[0, 0.52, -0.6]} rotation={[0.4, 0, 0.2]} castShadow>
        <cylinderGeometry args={[0.13, 0.14, 1.8, 6]} />
        <meshStandardMaterial color="#24150b" roughness={0.85} emissive="#ff3300" emissiveIntensity={0.4} />
      </mesh>

      {/* ── DYNAMIC FLICKERING FIRE LIGHT ── */}
      <pointLight
        ref={fireLightRef}
        color="#ff6d00"
        intensity={15}
        distance={22}
        decay={1.8}
        position={[0, 0.8, -0.4]}
        castShadow
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.002}
      />

      {/* ── ANIMATED VISUAL FLAMES (Glowing layered meshes inside R3F) ── */}
      <group ref={flameGroupRef} position={[0, 0.58, -0.5]}>
        {/* Core hot flame */}
        <mesh position={[0, 0.1, 0]}>
          <coneGeometry args={[0.48, 1.1, 8]} />
          <meshBasicMaterial color="#ffe600" transparent opacity={0.85} />
        </mesh>
        {/* Outer roaring orange flame */}
        <mesh position={[0, 0, 0]} scale={[1.3, 1.1, 1.3]}>
          <coneGeometry args={[0.56, 1.4, 8]} />
          <meshBasicMaterial color="#ff4d00" transparent opacity={0.6} />
        </mesh>
        {/* Wide soft red fire halo */}
        <mesh position={[0, -0.1, 0]} scale={[1.7, 1.0, 1.7]}>
          <coneGeometry args={[0.62, 1.6, 8]} />
          <meshBasicMaterial color="#ef4444" transparent opacity={0.35} />
        </mesh>
      </group>
    </group>
  );
}
