/**
 * HandPanel.tsx — bottom horizontal overlay for retained trap/wild cards (2D + 3D).
 */

import { useState } from 'react';
import { useGameStore } from '../store/useGameStore.js';
import { resolveActingPlayerId } from '../soloActingPlayer.js';
import type { PlayerId } from '../../types/enums.js';
import type { GameState } from '../../types/game-state.js';
import type { ActionCard } from '../../types/entities.js';

interface HandPanelProps {
  readonly gameState: GameState;
  /** Distance from the right viewport edge (px); clears the estate console. */
  readonly rightInsetPx?: number;
}

function handCardClass(card: ActionCard, playable: boolean): string {
  const kind = card.isWild ? 'hand-card--wild' : 'hand-card--trap';
  const play = playable ? 'hand-card--playable' : '';
  return ['hand-card', kind, play].filter(Boolean).join(' ');
}

export function HandPanel({ gameState, rightInsetPx = 24 }: HandPanelProps) {
  const { playTrapCard, localPlayerId, playMode } = useGameStore();
  const [isExpanded, setIsExpanded] = useState(true);

  const actingPlayerId = resolveActingPlayerId(
    gameState,
    localPlayerId as PlayerId,
    playMode,
  );
  const localHand = gameState.players[actingPlayerId]?.hand ?? [];
  const isTrapPhase =
    gameState.subPhase === 'AWAITING_TRAP_1' || gameState.subPhase === 'AWAITING_TRAP_2';
  const pendingIds = gameState.pendingTrapHandCardIds ?? [];
  const drawnId = gameState.pendingTrapDrawnCardId;

  const isPlayable = (card: ActionCard): boolean =>
    isTrapPhase && (pendingIds.includes(card.cardId) || card.cardId === drawnId);

  const preview = localHand.slice(0, 2).map((c) => c.label).join(' · ');

  return (
    <div
      className="hand-panel"
      style={{ right: rightInsetPx + 16 }}
      aria-label="Trap card hand"
    >
      <div className="hand-panel__shell hud-widget">
        <header className="hand-panel__header">
          <div className="hand-panel__header-left">
            <h2 className="hand-panel__title">Your hand</h2>
            <span className="hand-panel__count">{localHand.length}</span>
            {!isExpanded && localHand.length > 0 && (
              <span className="hand-panel__preview">{preview}</span>
            )}
            {isTrapPhase && <span className="hand-panel__trap-badge">Trap phase</span>}
          </div>
          <button
            type="button"
            className="hand-panel__toggle"
            aria-label={isExpanded ? 'Collapse hand panel' : 'Expand hand panel'}
            onClick={() => setIsExpanded((v) => !v)}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '▾' : '▴'}
          </button>
        </header>

        {isExpanded && (
          <div data-testid="hand-panel-expanded" className="hand-panel__cards custom-scrollbar">
            {localHand.length === 0 ? (
              <p className="hand-panel__empty">
                No retained trap cards — draw when you land on a trap space.
              </p>
            ) : (
              localHand.map((card) => {
                const playable = isPlayable(card);
                const className = handCardClass(card, playable);
                const inner = (
                  <>
                    <span className="hand-card__type">{card.isWild ? 'Wild' : 'Trap'}</span>
                    <span className="hand-card__label">{card.label}</span>
                    {card.description ? (
                      <span className="hand-card__desc">{card.description}</span>
                    ) : null}
                    {playable ? <span className="hand-card__cta">Play</span> : null}
                  </>
                );

                if (playable) {
                  return (
                    <button
                      key={card.cardId}
                      type="button"
                      className={className}
                      onClick={() => playTrapCard(card.cardId)}
                      title={`Play ${card.label}`}
                    >
                      {inner}
                    </button>
                  );
                }

                return (
                  <div key={card.cardId} className={className} title={card.label}>
                    {inner}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
