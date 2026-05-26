/**
 * DiningTable3D.tsx
 * Reusable 3D React-Three-Fiber component for the Mahogany Dining Table.
 */

interface DiningTable3DProps {
  position?: [number, number, number];
  rotation?: number;
}

export function DiningTable3D({ position = [0, 0, 0], rotation = 0 }: DiningTable3DProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Table top slab - gorgeous dark polished mahogany wood */}
      <mesh position={[0, 1.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 0.16, 5.0]} />
        <meshStandardMaterial 
          color="#3a2212" 
          roughness={0.15} 
          metalness={0.1} 
        />
      </mesh>
      
      {/* Elegant Golden Bezel Trim around the table edge */}
      <mesh position={[0, 1.17, 0]} castShadow>
        <boxGeometry args={[1.34, 0.06, 5.04]} />
        <meshStandardMaterial 
          color="#d4af37" 
          metalness={0.9} 
          roughness={0.1} 
        />
      </mesh>

      {/* Table Legs (6 ornate brass columns) */}
      {/* Top-Left Leg */}
      <mesh position={[-0.5, 0.55, -2.2]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 1.1, 8]} />
        <meshStandardMaterial color="#c5a059" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Top-Right Leg */}
      <mesh position={[0.5, 0.55, -2.2]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 1.1, 8]} />
        <meshStandardMaterial color="#c5a059" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Center-Left Leg */}
      <mesh position={[-0.5, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 1.1, 8]} />
        <meshStandardMaterial color="#c5a059" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Center-Right Leg */}
      <mesh position={[0.5, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 1.1, 8]} />
        <meshStandardMaterial color="#c5a059" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Bottom-Left Leg */}
      <mesh position={[-0.5, 0.55, 2.2]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 1.1, 8]} />
        <meshStandardMaterial color="#c5a059" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Bottom-Right Leg */}
      <mesh position={[0.5, 0.55, 2.2]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 1.1, 8]} />
        <meshStandardMaterial color="#c5a059" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Dark crimson velvet table runner */}
      <mesh position={[0, 1.265, 0]}>
        <boxGeometry args={[0.5, 0.005, 4.4]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.8} />
      </mesh>
    </group>
  );
}
