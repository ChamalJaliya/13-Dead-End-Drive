/**
 * DeckWidget.tsx — deck + discard indicator (no hidden info).
 */

import type { GameState } from '../../types/game-state.js';

interface DeckWidgetProps {
  readonly gameState: GameState;
}

export function DeckWidget({ gameState }: DeckWidgetProps) {
  const deckCount = gameState.deck.length;
  const discardCount = gameState.discardPile.length;

  return (
    <div className="hud-widget deck-widget" aria-label="Deck and discard">
      <div className="deck-widget__stack" aria-hidden>
        <div className="deck-widget__card-back deck-widget__card-back--shadow-1" />
        <div className="deck-widget__card-back deck-widget__card-back--shadow-2" />
        <div className="deck-widget__card-back">
          <span className="deck-widget__card-mark">13</span>
        </div>
      </div>

      <div className="deck-widget__counts">
        <span className="deck-widget__count-label deck-widget__count-label--deck">Deck</span>
        <span className="deck-widget__count-num hud-widget__value">{deckCount}</span>
        <span className="deck-widget__count-label">Discard</span>
        <span className="deck-widget__count-num hud-widget__value hud-widget__value--muted">
          {discardCount}
        </span>
      </div>
    </div>
  );
}
