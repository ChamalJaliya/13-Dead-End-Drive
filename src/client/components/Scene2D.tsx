/**
 * Scene2D.tsx
 * Canvas-based interactive 2D board game view.
 * Integrates the legacy GameBoardView canvas engine with the Zustand game store.
 */

import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore.js';
import { GameBoardView } from './GameBoard.js';
import type { GameState } from '../../types/game-state.js';

interface Scene2DProps {
  gameState: GameState;
}

export function Scene2D({ gameState }: Scene2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef   = useRef<GameBoardView | null>(null);

  const selectedCharId = useGameStore((s) => s.selectedCharId);
  const highlightCells = useGameStore((s) => s.highlightCells);
  const prohibitedCells = useGameStore((s) => s.prohibitedCells);
  const selectCharacter = useGameStore((s) => s.selectCharacter);
  const moveCharacter   = useGameStore((s) => s.moveCharacter);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Instantiate GameBoardView on the canvas context
    const view = new GameBoardView(ctx);
    viewRef.current = view;

    // Attach interaction and sync initial states
    view.onClick((cellId, charOnCell) => {
      if (charOnCell) {
        selectCharacter(charOnCell);
      } else if (selectedCharId) {
        moveCharacter(cellId);
      }
    });

    view.onStateSync({ gameState, privateHand: [] });
    view.setSelectedCharacter(selectedCharId);
    view.setHighlightCells(highlightCells);
    view.setProhibitedCells(prohibitedCells);

    // Initial resize sizing
    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      view.fitBoardToCanvas();
      view.scheduleRedraw();
    };
    handleResize();

    // Use ResizeObserver for responsive sizing
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    const parent = canvas.parentElement;
    if (parent) resizeObserver.observe(parent);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Update canvas state on changes
  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.onStateSync({ gameState, privateHand: [] });
    }
  }, [gameState]);

  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.setSelectedCharacter(selectedCharId);
    }
  }, [selectedCharId]);

  useEffect(() => {
    if (viewRef.current) {
      viewRef.current.setHighlightCells(highlightCells);
      viewRef.current.setProhibitedCells(prohibitedCells);
    }
  }, [highlightCells, prohibitedCells]);

  return (
    <div className="w-full h-full relative bg-mansion-950 flex flex-col items-center justify-center">
      {/* Visual Interaction Overlay Tips */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 glass px-5 py-2 rounded-full text-ghost-300 text-xs font-display flex items-center gap-2 pointer-events-none shadow-lg">
        <span>🖱️ Drag to pan</span>
        <span className="text-ghost-500">•</span>
        <span>⚙️ Scroll to zoom</span>
      </div>

      {/* 2D View Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing outline-none"
        title="2D Game Board — Click to select pawns, click highlighted tiles to move"
      />
    </div>
  );
}
