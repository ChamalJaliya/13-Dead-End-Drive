import React from 'react';

/**
 * Statue3D.tsx
 * Reusable 3D React-Three-Fiber component for the Suit of Armor Statue obstacle.
 */

interface Statue3DProps {
  readonly position?: [number, number, number];
  readonly rotation?: number;
}

export function Statue3D({ position = [0, 0, 0], rotation = 0 }: Statue3DProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* 1. Heavy Dark Obsidian Pedestal Base */}
      <mesh position={[0, 0.125, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.5, 0.25, 1.5]} />
        <meshStandardMaterial color="#1a1c23" roughness={0.25} metalness={0.8} />
      </mesh>

      {/* Gold Trim around the Pedestal */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[1.54, 0.04, 1.54]} />
        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.15} />
      </mesh>

      <group position={[0, 0.27, 0]}>
        {/* 2. Ornate Iron Greaves (Legs) */}
        <mesh position={[-0.25, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.12, 0.7, 16]} />
          <meshStandardMaterial color="#8a95a5" metalness={0.9} roughness={0.25} />
        </mesh>
        <mesh position={[0.25, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.09, 0.12, 0.7, 16]} />
          <meshStandardMaterial color="#8a95a5" metalness={0.9} roughness={0.25} />
        </mesh>

        {/* Kneepads (spheres) */}
        <mesh position={[-0.25, 0.7, 0.06]} castShadow>
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshStandardMaterial color="#707a8a" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0.25, 0.7, 0.06]} castShadow>
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshStandardMaterial color="#707a8a" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* 3. Heavy Iron Breastplate (Torso) */}
        <mesh position={[0, 1.2, 0]} castShadow>
          <cylinderGeometry args={[0.32, 0.24, 0.9, 16]} />
          <meshStandardMaterial color="#8a95a5" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Gold Chest Emblem Shield */}
        <mesh position={[0, 1.25, 0.26]} castShadow>
          <boxGeometry args={[0.2, 0.3, 0.06]} />
          <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* 4. Shoulder Pauldrons (Left & Right) */}
        <mesh position={[-0.42, 1.5, 0]} castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#707a8a" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0.42, 1.5, 0]} castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color="#707a8a" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Arm Vambraces */}
        <mesh position={[-0.44, 1.15, 0.08]} rotation={[0.4, 0, 0.1]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 0.6, 16]} />
          <meshStandardMaterial color="#8a95a5" metalness={0.9} roughness={0.25} />
        </mesh>
        <mesh position={[0.44, 1.15, 0.08]} rotation={[0.4, 0, -0.1]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 0.6, 16]} />
          <meshStandardMaterial color="#8a95a5" metalness={0.9} roughness={0.25} />
        </mesh>

        {/* 5. Knight's Closed-Visor Helmet */}
        <mesh position={[0, 1.8, 0]} castShadow>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color="#8a95a5" metalness={0.9} roughness={0.25} />
        </mesh>
        {/* Helmet Visor Plate */}
        <mesh position={[0, 1.83, 0.12]} rotation={[0.15, 0, 0]} castShadow>
          <boxGeometry args={[0.24, 0.12, 0.12]} />
          <meshStandardMaterial color="#333a42" metalness={0.95} roughness={0.1} />
        </mesh>
        {/* Golden plume crest */}
        <mesh position={[0, 2.05, -0.06]} castShadow>
          <boxGeometry args={[0.05, 0.3, 0.2]} />
          <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* 6. Heavy Battle Halberd Weapon */}
        <group position={[0.55, 1.0, 0.3]}>
          {/* Halberd Wooden Shaft */}
          <mesh castShadow>
            <cylinderGeometry args={[0.03, 0.03, 2.2, 8]} />
            <meshStandardMaterial color="#5c4033" roughness={0.7} />
          </mesh>
          {/* Halberd Golden Axe Blade */}
          <mesh position={[0, 1.0, 0.12]} castShadow>
            <boxGeometry args={[0.02, 0.35, 0.22]} />
            <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.15} />
          </mesh>
          {/* Halberd Gold Spear Tip */}
          <mesh position={[0, 1.25, 0]} castShadow>
            <coneGeometry args={[0.06, 0.3, 8]} />
            <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.15} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
