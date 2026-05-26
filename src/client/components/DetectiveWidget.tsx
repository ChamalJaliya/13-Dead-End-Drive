/**
 * DetectiveWidget.tsx — 10-slot detective track indicator (slot 10 = door).
 */

import type { GameState } from '../../types/game-state.js';

interface DetectiveWidgetProps {
  readonly gameState: GameState;
}

export function DetectiveWidget({ gameState }: DetectiveWidgetProps) {
  const det = gameState.detectivePosition;
  const max = det.maxSteps;
  const step = det.currentStep;
  const atDoor = det.isAtExit || step >= max;

  return (
    <div className="hud-widget detective-widget" aria-label="Detective track">
      <div className="detective-widget__head">
        <span className="hud-widget__eyebrow">Detective</span>
        <span
          className={`detective-widget__status ${atDoor ? 'detective-widget__status--door' : ''}`}
        >
          {atDoor ? 'At door' : `${step} / ${max}`}
        </span>
      </div>

      <div className="detective-widget__track" role="list" aria-label="Detective progress">
        {Array.from({ length: max }, (_, i) => {
          const slot = i + 1;
          const filled = step >= slot;
          const isCurrent = !atDoor && step === slot;
          const isDoor = slot === max;

          const pipClass = [
            'detective-widget__pip',
            filled ? 'detective-widget__pip--filled' : '',
            isCurrent ? 'detective-widget__pip--current' : '',
            isDoor ? 'detective-widget__pip--door' : '',
          ]
            .filter(Boolean)
            .join(' ');

          const labelClass = [
            'detective-widget__slot-label',
            isDoor ? 'detective-widget__slot-label--door' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div key={slot} className="detective-widget__slot" role="listitem" title={isDoor ? 'Door' : `Step ${slot}`}>
              <div className={pipClass} aria-hidden />
              <span className={labelClass}>{isDoor ? 'D' : slot}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
