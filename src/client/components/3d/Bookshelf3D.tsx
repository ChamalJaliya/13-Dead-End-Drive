/**
 * Bookshelf3D.tsx
 * Reusable 3D React-Three-Fiber component for the Mahogany Bookshelf.
 * Features programmatically arranged stacks of books with randomized height, depth, color, and tilting.
 */

import { useMemo } from 'react';

interface Bookshelf3DProps {
  position?: [number, number, number];
  rotation?: number;
  scale?: [number, number, number];
}

interface Book {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
  color: string;
  tilt: number;
}

export function Bookshelf3D({ 
  position = [0, 0, 0], 
  rotation = 0,
  scale = [1, 1, 1]
}: Bookshelf3DProps) {
  // Generate a random collection of high-fidelity book meshes for the shelf
  const books = useMemo(() => {
    const list: Book[] = [];
    const colors = [
      '#991b1b', // Burgundy Red
      '#1e3a8a', // Deep Blue
      '#065f46', // Forest Green
      '#b45309', // Vintage Gold
      '#5b21b6', // Regal Purple
      '#374151', // Charcoal Black
      '#d97706', // Amber Orange
      '#acb0b9', // Ghostly Grey
    ];

    // Build 3 shelves of books
    for (let shelf = 0; shelf < 3; shelf++) {
      let zStart = -2.25;
      const shelfHeight = 0.12 + shelf * 1.05;

      while (zStart < 2.25) {
        const bookThickness = 0.08 + Math.random() * 0.07;
        const bookHeight = 0.52 + Math.random() * 0.28;
        const bookDepth = 0.44 + Math.random() * 0.1;
        const color = colors[Math.floor(Math.random() * colors.length)]!;
        
        // Randomly tilt ~15% of the books for a realistic, lived-in aesthetic
        const shouldTilt = Math.random() < 0.15 && zStart < 2.0;
        const tiltAngle = shouldTilt ? (0.12 + Math.random() * 0.14) : 0;

        list.push({
          x: 0.02 + (Math.random() - 0.5) * 0.04,
          y: shelfHeight + bookHeight / 2,
          z: zStart + bookThickness / 2,
          w: bookDepth,
          h: bookHeight,
          d: bookThickness,
          color,
          tilt: tiltAngle,
        });

        // Advance cursor, adding a little gap between book spines
        zStart += bookThickness + 0.02 + (shouldTilt ? 0.15 : 0);
      }
    }
    return list;
  }, []);

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {/* ── Outer Mahogany Cabinet Frame ── */}
      {/* Back Panel */}
      <mesh position={[-0.24, 1.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.08, 3.4, 4.88]} />
        <meshStandardMaterial color="#1f120a" roughness={0.7} metalness={0.05} />
      </mesh>
      
      {/* Left Cabinet Wall */}
      <mesh position={[0, 1.7, -2.48]} castShadow receiveShadow>
        <boxGeometry args={[0.62, 3.4, 0.1]} />
        <meshStandardMaterial color="#2d1a0e" roughness={0.3} metalness={0.12} />
      </mesh>

      {/* Right Cabinet Wall */}
      <mesh position={[0, 1.7, 2.48]} castShadow receiveShadow>
        <boxGeometry args={[0.62, 3.4, 0.1]} />
        <meshStandardMaterial color="#2d1a0e" roughness={0.3} metalness={0.12} />
      </mesh>

      {/* Top Heavy Crown Plate */}
      <mesh position={[0, 3.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.66, 0.12, 5.08]} />
        <meshStandardMaterial color="#2d1a0e" roughness={0.2} metalness={0.15} />
      </mesh>

      {/* Bottom Plinth */}
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.64, 0.12, 5.06]} />
        <meshStandardMaterial color="#20130a" roughness={0.6} />
      </mesh>

      {/* ── Internal Horizontal Shelves ── */}
      {/* Lower Shelf */}
      <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.56, 0.08, 4.86]} />
        <meshStandardMaterial color="#28170d" roughness={0.4} />
      </mesh>
      {/* Middle Shelf */}
      <mesh position={[0, 2.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.56, 0.08, 4.86]} />
        <meshStandardMaterial color="#28170d" roughness={0.4} />
      </mesh>

      {/* ── Programmatic 3D Books ── */}
      {books.map((b, idx) => (
        <mesh
          key={`book-${idx}`}
          position={[b.x, b.y, b.z]}
          rotation={[b.tilt, 0, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial color={b.color} roughness={0.8} />
        </mesh>
      ))}

      {/* ── Brass Support Rail along the front of the bookshelf at the top ── */}
      <mesh position={[0.32, 3.2, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 4.92, 12]} />
        <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Gold rail supports connecting back to the cabinet frame */}
      {[-2.1, -0.7, 0.7, 2.1].map((bz, i) => (
        <mesh key={`rail-sup-${i}`} position={[0.16, 3.2, bz]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.32, 8]} />
          <meshStandardMaterial color="#d4af37" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}

      {/* ── 3D Rolling Library Ladder (Leaning out to S4/T4 at Rank 4, local z ≈ -0.638) ── */}
      <group position={[0.32, 3.2, -0.638]} rotation={[0, 0, 0.63]}>
        
        {/* Left Mahogany Side Rail */}
        <mesh position={[0, -2.025, -0.18]} castShadow receiveShadow>
          <boxGeometry args={[0.04, 4.05, 0.04]} />
          <meshStandardMaterial color="#2d1a0e" roughness={0.3} metalness={0.1} />
        </mesh>

        {/* Right Mahogany Side Rail */}
        <mesh position={[0, -2.025, 0.18]} castShadow receiveShadow>
          <boxGeometry args={[0.04, 4.05, 0.04]} />
          <meshStandardMaterial color="#2d1a0e" roughness={0.3} metalness={0.1} />
        </mesh>

        {/* Horizontal Ladder Steps / Rungs */}
        {Array.from({ length: 9 }).map((_, i) => {
          const stepY = -0.4 - i * 0.38;
          return (
            <mesh key={`rung-${i}`} position={[0.015, stepY, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.08, 0.02, 0.32]} />
              <meshStandardMaterial color="#1f120a" roughness={0.4} />
            </mesh>
          );
        })}

        {/* Top Roller Hooks (attached to the brass rail) */}
        <group position={[0, 0, 0]}>
          {/* Gold carriage bar */}
          <mesh position={[-0.02, 0.04, 0]} castShadow>
            <boxGeometry args={[0.08, 0.08, 0.42]} />
            <meshStandardMaterial color="#d4af37" metalness={0.88} roughness={0.15} />
          </mesh>
          {/* Roller wheels */}
          <mesh position={[-0.02, 0.06, -0.18]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.03, 8]} />
            <meshStandardMaterial color="#111112" roughness={0.6} />
          </mesh>
          <mesh position={[-0.02, 0.06, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.03, 8]} />
            <meshStandardMaterial color="#111112" roughness={0.6} />
          </mesh>
        </group>

        {/* Bottom Wheels on the Floor */}
        <group position={[0, -4.05, 0]}>
          {/* Wheel mounts */}
          <mesh position={[0, -0.02, -0.18]} castShadow>
            <boxGeometry args={[0.03, 0.06, 0.03]} />
            <meshStandardMaterial color="#d4af37" metalness={0.8} />
          </mesh>
          <mesh position={[0, -0.02, 0.18]} castShadow>
            <boxGeometry args={[0.03, 0.06, 0.03]} />
            <meshStandardMaterial color="#d4af37" metalness={0.8} />
          </mesh>
          
          {/* Wheels */}
          <mesh position={[0, -0.05, -0.18]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.025, 8]} />
            <meshStandardMaterial color="#111112" roughness={0.85} />
          </mesh>
          <mesh position={[0, -0.05, 0.18]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.025, 8]} />
            <meshStandardMaterial color="#111112" roughness={0.85} />
          </mesh>
        </group>

      </group>
    </group>
  );
}
