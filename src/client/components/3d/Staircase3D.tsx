/**
 * Staircase3D.tsx
 * Reusable 3D React-Three-Fiber component for the Grand Staircase.
 * Renders an 8-tread mahogany staircase flanked by polished gold handrails.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Staircase3DProps {
  position?: [number, number, number];
  rotation?: number;
  width?: number;
  depth?: number;
  animCollapse?: boolean;
}

export function Staircase3D({
  position = [0, 0, 0],
  rotation = 0,
  width,
  depth,
  animCollapse = false,
}: Staircase3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const sinkRef = useRef(0);

  useFrame((_, delta) => {
    const target = animCollapse ? -0.35 : 0;
    sinkRef.current = THREE.MathUtils.lerp(sinkRef.current, target, delta * 4);
    if (groupRef.current) {
      groupRef.current.position.y = sinkRef.current;
    }
  });
  const stepCount = 8;
  const stepWidth = width ?? 5.25;  // spans 3 grid cells (5.4m)
  const totalDepth = depth ?? 3.4;  // spans 2 grid cells (3.6m)
  const totalHeight = 1.8; // ascends 1.8m
  
  const stepDepth = totalDepth / stepCount;
  const stepHeight = totalHeight / stepCount;

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {/* ── Side Mahogany Stringers (Support panels) ── */}
      {/* Left Stringer */}
      <mesh position={[-stepWidth / 2 - 0.05, totalHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.1, totalHeight, totalDepth]} />
        <meshStandardMaterial color="#2d1a0e" roughness={0.3} metalness={0.12} />
      </mesh>
      {/* Right Stringer */}
      <mesh position={[stepWidth / 2 + 0.05, totalHeight / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.1, totalHeight, totalDepth]} />
        <meshStandardMaterial color="#2d1a0e" roughness={0.3} metalness={0.12} />
      </mesh>

      {/* ── Solid Mahogany Steps ── */}
      {Array.from({ length: stepCount }).map((_, idx) => {
        // Stairs ascend going towards the back wall (Z-axis negative)
        const stepZ = totalDepth / 2 - (idx * stepDepth) - stepDepth / 2;
        const currentBlockHeight = (idx + 1) * stepHeight;

        return (
          <group key={`step-${idx}`}>
            {/* Main Step Block */}
            <mesh position={[0, currentBlockHeight / 2, stepZ]} castShadow receiveShadow>
              <boxGeometry args={[stepWidth, currentBlockHeight, stepDepth]} />
              <meshStandardMaterial color="#3a2212" roughness={0.25} metalness={0.1} />
            </mesh>
            {/* Step Nose (Golden highlight edge on tread) */}
            <mesh position={[0, currentBlockHeight, stepZ + stepDepth / 2 - 0.01]} castShadow>
              <boxGeometry args={[stepWidth + 0.02, 0.03, 0.03]} />
              <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        );
      })}

      {/* ── Ornate Gold Balustrade & Handrails ── */}
      {/* Left Handrail Bar */}
      <mesh position={[-stepWidth / 2 - 0.04, totalHeight / 2 + 0.82, 0]} rotation={[0.48, 0, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, totalDepth * 1.25, 8]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Right Handrail Bar */}
      <mesh position={[stepWidth / 2 + 0.04, totalHeight / 2 + 0.82, 0]} rotation={[0.48, 0, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, totalDepth * 1.25, 8]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Handrail Pillars (4 supporting columns on left/right corners) */}
      <mesh position={[-stepWidth / 2 - 0.04, totalHeight * 0.15 + 0.41, totalDepth / 2 - 0.2]} castShadow>
        <cylinderGeometry args={[0.025, 0.035, totalHeight * 0.3 + 0.82, 8]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[-stepWidth / 2 - 0.04, totalHeight * 0.85 + 0.41, -totalDepth / 2 + 0.2]} castShadow>
        <cylinderGeometry args={[0.025, 0.035, totalHeight * 0.3 + 0.82, 8]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
      </mesh>

      <mesh position={[stepWidth / 2 + 0.04, totalHeight * 0.15 + 0.41, totalDepth / 2 - 0.2]} castShadow>
        <cylinderGeometry args={[0.025, 0.035, totalHeight * 0.3 + 0.82, 8]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[stepWidth / 2 + 0.04, totalHeight * 0.85 + 0.41, -totalDepth / 2 + 0.2]} castShadow>
        <cylinderGeometry args={[0.025, 0.035, totalHeight * 0.3 + 0.82, 8]} />
        <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  );
}
