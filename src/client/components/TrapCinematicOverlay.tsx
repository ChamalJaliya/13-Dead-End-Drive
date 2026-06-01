/**
 * TrapCinematicOverlay.tsx
 * Full-screen trap kill cinematic (shared by 2D and 3D modes).
 */

import { useEffect, useState } from 'react';
import { getTrapCinematic } from '../cinematics/trapCinematics.js';
import type { TrapId } from '../../types/enums.js';
import type { CellId } from '../../types/enums.js';

export interface TrapOverlayPayload {
  readonly trapId: TrapId;
  readonly cellId: CellId;
  readonly victimNames: readonly string[];
}

interface TrapCinematicOverlayProps {
  readonly payload: TrapOverlayPayload | null;
  readonly onDismiss: () => void;
}

function overlayDurationMs(): number {
  if (typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 1200;
  }
  return 3200;
}

export function TrapCinematicOverlay({ payload, onDismiss }: TrapCinematicOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!payload) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const t = window.setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, overlayDurationMs());
    return () => window.clearTimeout(t);
  }, [payload, onDismiss]);

  if (!payload || !visible) return null;

  const cfg = getTrapCinematic(payload.trapId);
  const victims =
    payload.victimNames.length > 0
      ? payload.victimNames.join(', ')
      : 'A guest';

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
      style={{ background: 'rgba(5,6,8,0.55)', backdropFilter: 'blur(4px)' }}
      aria-live="polite"
    >
      <div
        className="glass rounded-2xl p-6 max-w-sm mx-4 text-center animate-trap-in"
        style={{
          border: `1px solid ${cfg.accentColor}`,
          boxShadow: cfg.glowShadow,
        }}
      >
        <div className={`text-5xl mb-3 cinematic-icon ${cfg.animClass}`}>{cfg.icon}</div>
        <h3 className="font-display text-lg font-black tracking-widest mb-2 text-ghost-100">
          {cfg.title}
        </h3>
        <p className="text-ghost-400 text-xs mb-3">{cfg.description}</p>
        <p className="text-ghost-200 text-sm">
          <strong className="text-trap-red">{victims}</strong>
          {' '}
          <span className="text-ghost-500">at {payload.cellId}</span>
        </p>
      </div>
    </div>
  );
}
