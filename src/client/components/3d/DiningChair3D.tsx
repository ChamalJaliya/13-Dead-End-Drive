/**
 * DiningChair3D.tsx
 * Reusable 3D React-Three-Fiber component for the Mahogany/Brass/Velvet dining chairs.
 */

interface DiningChair3DProps {
  position?: [number, number, number];
  rotation?: number;
}

export function DiningChair3D({ position = [0, 0, 0], rotation = 0 }: DiningChair3DProps) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* 4 ornate brass legs */}
      <mesh position={[-0.26, 0.20, -0.26]} castShadow>
        <cylinderGeometry args={[0.02, 0.03, 0.40, 6]} />
        <meshStandardMaterial color="#c5a059" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.26, 0.20, -0.26]} castShadow>
        <cylinderGeometry args={[0.02, 0.03, 0.40, 6]} />
        <meshStandardMaterial color="#c5a059" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-0.26, 0.20, 0.26]} castShadow>
        <cylinderGeometry args={[0.02, 0.03, 0.40, 6]} />
        <meshStandardMaterial color="#c5a059" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.26, 0.20, 0.26]} castShadow>
        <cylinderGeometry args={[0.02, 0.03, 0.40, 6]} />
        <meshStandardMaterial color="#c5a059" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Seat velvet cushion (crimson red) */}
      <mesh position={[0, 0.41, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.66, 0.06, 0.66]} />
        <meshStandardMaterial color="#7f1d1d" roughness={0.6} />
      </mesh>

      {/* Seat wood base */}
      <mesh position={[0, 0.39, 0]} castShadow>
        <boxGeometry args={[0.70, 0.03, 0.70]} />
        <meshStandardMaterial color="#3a2212" roughness={0.2} />
      </mesh>

      {/* Ornate backrest frame */}
      <group position={[0, 0.78, -0.30]}>
        {/* Left vertical post */}
        <mesh position={[-0.28, 0, 0]} castShadow>
          <boxGeometry args={[0.04, 0.76, 0.04]} />
          <meshStandardMaterial color="#3a2212" roughness={0.2} />
        </mesh>
        {/* Right vertical post */}
        <mesh position={[0.28, 0, 0]} castShadow>
          <boxGeometry args={[0.04, 0.76, 0.04]} />
          <meshStandardMaterial color="#3a2212" roughness={0.2} />
        </mesh>
        {/* Top cross rail */}
        <mesh position={[0, 0.36, 0]} castShadow>
          <boxGeometry args={[0.60, 0.06, 0.04]} />
          <meshStandardMaterial color="#3a2212" roughness={0.2} />
        </mesh>
        {/* Center splat with gold brass accent inset */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[0.14, 0.60, 0.03]} />
          <meshStandardMaterial color="#3a2212" roughness={0.2} />
        </mesh>
        <mesh position={[0, 0, 0.01]} castShadow>
          <boxGeometry args={[0.05, 0.40, 0.01]} />
          <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
}
