/**
 * HeirPortrait3D.tsx
 * Master dynamic R3F portrait component for 13 Dead End Drive.
 * Suspended on the back stone wall directly above the Gothic Fireplace mantelpiece.
 * Spans a massive visual scale, glowing and changing reactively to show the current active heir.
 */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore.js';
import { CHARACTER_DATA } from '../../../engine/gameInitializer.js';
import { AUNT_AGATHA_PORTRAIT, CHARACTER_PORTRAITS } from '../../characterAssets.js';

interface HeirPortrait3DProps {
  position?: [number, number, number];
}

const BRASS_GOLD = '#d4af37';
const WIRE_COLOR = '#1e1e1f';

export function HeirPortrait3D({ position = [0, 0, 0] }: HeirPortrait3DProps) {
  const spotlightRef = useRef<THREE.PointLight>(null);

  // Query active portrait and heir details dynamically from central Zustand store
  const currentHeirId = useGameStore((state) => state.gameState?.activePortrait?.currentHeirId);
  const isAgatha = currentHeirId === 'AUNT_AGATHA';
  const heirData = !isAgatha && currentHeirId ? CHARACTER_DATA[currentHeirId] : null;
  const heirName = isAgatha ? 'Aunt Agatha' : (heirData?.displayName ?? 'No Heir Selected');
  const heirColor = isAgatha ? '#b45309' : (heirData?.pawnColor ?? '#b45309');
  const heirPortraitUrl = isAgatha ? AUNT_AGATHA_PORTRAIT : (currentHeirId ? CHARACTER_PORTRAITS[currentHeirId] : '');

  // Slow pulsing spotlight glow for a rich, breathing atmospheric highlight effect
  useFrame(({ clock }) => {
    const elapsed = clock.getElapsedTime();
    if (spotlightRef.current) {
      spotlightRef.current.intensity = 15 + Math.sin(elapsed * 4) * 3;
    }
  });

  return (
    <group position={position}>

      {/* ── 3D PHYSICAL WALL HANGING ASSEMBLY ── */}
      {/* Centered at local z = -2.08 to sit flush against the brick wall backing */}
      <group position={[0, 0, -2.08]}>

        {/* Ornate Gold Hook / Peg on the wall raised to y = 8.6 */}
        <mesh position={[0, 8.6, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 0.16, 8]} />
          <meshStandardMaterial color={BRASS_GOLD} metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 8.62, 0.08]} rotation={[Math.PI / 4, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.12, 6]} />
          <meshStandardMaterial color={BRASS_GOLD} metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Left Hanging Wire (angled down to top-left of gold frame) */}
        <mesh position={[-1.35, 8.4, 0.02]} rotation={[0, 0, -0.147]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 2.73, 6]} />
          <meshStandardMaterial color={WIRE_COLOR} metalness={0.2} roughness={0.8} />
        </mesh>

        {/* Right Hanging Wire (angled down to top-right of gold frame) */}
        <mesh position={[1.35, 8.4, 0.02]} rotation={[0, 0, 0.147]} castShadow>
          <cylinderGeometry args={[0.012, 0.012, 2.73, 6]} />
          <meshStandardMaterial color={WIRE_COLOR} metalness={0.2} roughness={0.8} />
        </mesh>

      </group>

      {/* ── MASSIVE MASTER GOLD FRAMED PORTRAIT (Center y = 6.4, bottom edge y = 4.6) ── */}
      {/* Spans exactly 3x3 tiles (5.4m × 3.6m) leaving a beautiful 0.65m gap above fireplace mantel at y = 3.95 */}
      <group position={[0, 6.4, -1.98]}>

        {/* Heavy Gold Ornate Outer Frame (Width 5.4m, Height 3.6m, Depth 0.16m) */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[5.4, 3.6, 0.16]} />
          <meshStandardMaterial color="#c59e2b" metalness={0.95} roughness={0.08} />
        </mesh>

        {/* Gold Frame Outer Bevel Details */}
        <mesh position={[0, 0, 0.02]}>
          <boxGeometry args={[5.44, 3.64, 0.04]} />
          <meshStandardMaterial color={BRASS_GOLD} metalness={0.9} roughness={0.15} />
        </mesh>

        {/* Deep Velvet Frame Recess (Creates heavy gothic contrast shadow) */}
        <mesh position={[0, 0, 0.04]}>
          <boxGeometry args={[5.08, 3.28, 0.12]} />
          <meshStandardMaterial color="#0b0806" roughness={0.9} />
        </mesh>

        {/* Inner Gilded Bevel Ring */}
        <mesh position={[0, 0, 0.06]}>
          <boxGeometry args={[4.96, 3.16, 0.03]} />
          <meshStandardMaterial color="#b58d20" metalness={0.88} roughness={0.18} />
        </mesh>

        {/* Aged Canvas Board Plate */}
        <mesh position={[0, 0, 0.07]}>
          <boxGeometry args={[4.88, 3.08, 0.015]} />
          <meshStandardMaterial color="#faf6e5" roughness={0.85} />
        </mesh>

        {/* ── DYNAMIC HIGHLIGHT SPOTLIGHT SHINING ON PORTRAIT ── */}
        <pointLight
          ref={spotlightRef}
          color={heirColor}
          intensity={18}
          distance={12}
          decay={1.5}
          position={[0, 0, 1.2]}
          castShadow
          shadow-bias={-0.001}
        />

        {/* ── HIGH-DEFINITION DYNAMIC HEIR PORTRAIT CARD ── */}
        <Html
          position={[0, 0, 0.082]}
          transform
          distanceFactor={3.2}
          pointerEvents="none"
        >
          <div 
            className="flex flex-col items-center justify-between w-[460px] h-[290px] bg-slate-950/98 border-[3px] p-4 rounded-xl shadow-2xl font-serif text-amber-100 select-none overflow-hidden"
            style={{
              borderColor: heirColor,
              boxShadow: `0 0 35px ${heirColor}55, inset 0 0 20px ${heirColor}20`,
            }}
          >
            {/* Header Ribbon */}
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] uppercase tracking-[0.28em] text-amber-500 font-sans font-bold">
                Mansion Featured Portrait
              </span>
              <span className="text-[7.5px] tracking-widest text-ghost-400 font-sans italic opacity-75">
                Current Active Heir in Aunt Agatha's Will
              </span>
            </div>

            {/* Dynamic Portrait Image */}
            <div 
              className="relative flex items-center justify-center w-[120px] h-[145px] rounded-lg border-2 bg-slate-900 shadow-2xl overflow-hidden mt-1"
              style={{
                borderColor: `${heirColor}85`,
                boxShadow: `0 0 15px ${heirColor}33`,
              }}
            >
              {/* Breath pulsing radial background glow */}
              <div 
                className="absolute inset-0 opacity-20 filter blur-md animate-pulse" 
                style={{
                  background: `radial-gradient(circle, ${heirColor} 0%, transparent 90%)`
                }} 
              />
              {heirPortraitUrl ? (
                <img 
                  src={heirPortraitUrl} 
                  alt={heirName} 
                  className="w-full h-full object-cover relative z-10 animate-trap-in"
                  style={{ filter: 'sepia(0.18) contrast(1.08) brightness(0.96)' }}
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-slate-700 animate-pulse" />
              )}
            </div>

            {/* Character Info Block */}
            <div className="text-center mt-2.5 flex flex-col gap-0.5">
              <h2 className="text-base font-bold tracking-wider leading-tight text-ghost-100 font-serif"
                  style={{ textShadow: `0 0 12px ${heirColor}50` }}
              >
                {heirName}
              </h2>
              <span className="text-[9px] text-amber-400 font-sans font-bold tracking-[0.15em] uppercase">
                Featured Heir
              </span>
            </div>

            {/* Aesthetic Victorian Details Footer */}
            <div className="w-full flex justify-between items-center border-t border-amber-500/20 pt-2.5 mt-2.5 text-[9px] text-ghost-400 font-sans">
              <span className="tracking-wide">Milton Bradley / Winning Moves</span>
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[8px]" style={{ color: heirColor }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: heirColor }} />
                Active in Will
              </span>
            </div>
          </div>
        </Html>

      </group>

    </group>
  );
}
