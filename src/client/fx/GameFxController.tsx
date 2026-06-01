/**
 * GameFxController.tsx
 * Central drain for fxQueue: trap/elimination audio, overlay, winner confetti.
 */

import { useCallback, useEffect, useRef, useState, type ReactElement } from 'react';
import { useGameStore } from '../store/useGameStore.js';
import { useUiStore } from '../store/useUiStore.js';
import { gameAudio } from '../audio/gameAudioInstance.js';
import { executeFxBatchPlan } from './executeFxBatchPlan.js';
import {
  TrapCinematicOverlay,
  type TrapOverlayPayload,
} from '../components/TrapCinematicOverlay.js';
import type { ClientFxEvent } from './clientFxTypes.js';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function GameFxController(): ReactElement {
  const fxQueueLen = useUiStore((s) => s.fxQueue.length);
  const activeOverlay = useUiStore((s) => s.activeOverlay);
  const [trapOverlay, setTrapOverlay] = useState<TrapOverlayPayload | null>(null);
  const winConfettiFiredRef = useRef(false);

  useEffect(() => {
    gameAudio.loadMutePreference();
  }, []);

  useEffect(() => {
    if (activeOverlay === 'lobby') {
      winConfettiFiredRef.current = false;
    }
  }, [activeOverlay]);

  const processBatch = useCallback((batch: ClientFxEvent[]) => {
    executeFxBatchPlan(batch, {
      winConfettiAlreadyFired: winConfettiFiredRef.current,
      isMuted: gameAudio.isMuted(),
      prefersReducedMotion: prefersReducedMotion(),
      onTrapOverlay: setTrapOverlay,
      onWinConfettiFired: () => {
        winConfettiFiredRef.current = true;
      },
    });
  }, []);

  useEffect(() => {
    if (fxQueueLen === 0) return;
    const batch = useGameStore.getState().shiftFxQueue();
    if (batch.length > 0) {
      processBatch(batch);
    }
  }, [fxQueueLen, processBatch]);

  const dismissOverlay = useCallback(() => {
    setTrapOverlay(null);
  }, []);

  return <TrapCinematicOverlay payload={trapOverlay} onDismiss={dismissOverlay} />;
}
