/**
 * EstateConsole.tsx — right-side gameplay control panel (turn, dice, rooting, logs).
 */

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { gameAudio } from '../audio/gameAudioInstance.js';
import { useGameStore } from '../store/useGameStore.js';
import { useUiStore } from '../store/useUiStore.js';
import { resolveActingPlayerId } from '../soloActingPlayer.js';
import { isBotPlayerId } from '../bots/botRegistry.js';
import type { PlayerId } from '../../types/enums.js';
import type { GameState } from '../../types/game-state.js';
import { CHARACTER_DATA } from '../../engine/gameInitializer.js';
import { CHARACTER_PORTRAITS } from '../characterAssets.js';
import type { CharacterId } from '../../types/enums.js';
import { DicePanel } from './DicePanel.js';

interface EstateConsoleProps {
  readonly gameState: GameState;
  readonly onCollapsedChange?: (collapsed: boolean) => void;
}

const LOG_VARIANT_CLASS = {
  info: 'estate-console__log--info',
  warn: 'estate-console__log--warn',
  danger: 'estate-console__log--danger',
  success: 'estate-console__log--success',
} as const;

export function EstateConsole({ gameState, onCollapsedChange }: EstateConsoleProps) {
  const { resetGame, drawTrapCard, declineTrap, localPlayerId, playMode } = useGameStore();
  const { toggle3D, is3DMode, eventLog, isBotThinking } = useUiStore();

  const [collapsed, setCollapsed] = useState(false);
  const [audioMuted, setAudioMuted] = useState(() =>
    typeof localStorage !== 'undefined' && localStorage.getItem('ded-audio-muted') === '1',
  );
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onCollapsedChange?.(collapsed);
  }, [collapsed, onCollapsedChange]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [eventLog]);

  const activePlayer = gameState.players[gameState.activePlayerId];
  const activePlayerName = activePlayer?.displayName ?? 'Unknown';
  const activeTurnIndex = gameState.turnOrder.indexOf(gameState.activePlayerId);
  const playerAccent =
    activeTurnIndex % 2 === 0
      ? 'estate-console__player--a'
      : 'estate-console__player--b';

  const actingPlayerId = resolveActingPlayerId(
    gameState,
    localPlayerId as PlayerId,
    playMode,
  );
  const rootingPlayer = gameState.players[actingPlayerId];
  const localHand = rootingPlayer?.hand ?? [];
  const localRooting: readonly CharacterId[] = [
    ...(rootingPlayer?.characterIds ?? []),
    ...(rootingPlayer?.secretCharacterIds ?? []),
  ];
  const isTrapPhase =
    gameState.subPhase === 'AWAITING_TRAP_1' || gameState.subPhase === 'AWAITING_TRAP_2';

  const lastRoll = gameState.lastDiceRoll;
  const diceSummary = lastRoll ? `${lastRoll.die1}+${lastRoll.die2}` : '—';
  const pipsSummary =
    typeof gameState.pipsRemaining === 'number' ? String(gameState.pipsRemaining) : '—';

  if (collapsed) {
    return (
      <aside
        className="estate-console estate-console--rail"
        aria-label="Game console (collapsed)"
      >
        <button
          type="button"
          className="estate-console__rail-btn"
          aria-label="Expand console"
          onClick={() => setCollapsed(false)}
          title="Expand panel"
        >
          <span className="estate-console__rail-icon" aria-hidden>
            ◀
          </span>
        </button>

        <div className="estate-console__rail-stats">
          <div className="estate-console__rail-stat">
            <span className="estate-console__rail-label">Turn</span>
            <span className="estate-console__rail-value">#{gameState.turnNumber}</span>
          </div>
          <div className="estate-console__rail-stat">
            <span className="estate-console__rail-label">Dice</span>
            <span className="estate-console__rail-value">{diceSummary}</span>
          </div>
          <div className="estate-console__rail-stat">
            <span className="estate-console__rail-label">Pips</span>
            <span className="estate-console__rail-value estate-console__rail-value--gold">
              {pipsSummary}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="estate-console__rail-action"
          onClick={toggle3D}
          title="Toggle 2D/3D view"
        >
          {is3DMode ? '2D' : '3D'}
        </button>
      </aside>
    );
  }

  const pendingIds = gameState.pendingTrapHandCardIds ?? [];
  const playableTrapCards = localHand.filter(
    (c) =>
      pendingIds.includes(c.cardId) || c.cardId === gameState.pendingTrapDrawnCardId,
  );

  return (
    <aside className="estate-console" aria-label="Game console">
      {/* Header */}
      <header className="estate-console__header">
        <div className="estate-console__title-block">
          <p className="estate-console__eyebrow">Estate</p>
          <h2 className="estate-console__title">Mansion Control</h2>
        </div>
        <button
          type="button"
          className="estate-console__collapse"
          aria-label="Collapse console"
          onClick={() => setCollapsed(true)}
          title="Collapse panel"
        >
          ▶
        </button>
      </header>

      {/* Turn strip */}
      <div className="estate-console__turn-strip">
        <div className="estate-console__turn-player">
          <span className="estate-console__turn-label">Active</span>
          <span className={`estate-console__player-name ${playerAccent}`}>{activePlayerName}</span>
          {isBotThinking && (
            <span className="estate-console__solo-hint">Bot thinking…</span>
          )}
          {playMode === 'solo' && isBotPlayerId(gameState.activePlayerId) && !isBotThinking && (
            <span className="estate-console__solo-hint">AI turn</span>
          )}
        </div>
        <div className="estate-console__turn-meta">
          <span className="estate-console__turn-label">Cycle</span>
          <span className="estate-console__turn-number">#{gameState.turnNumber}</span>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="estate-console__body custom-scrollbar">
        <DicePanel gameState={gameState} />

        {/* Rooting */}
        <section className="estate-console__section" aria-label="Your rooting">
          <div className="estate-console__section-head">
            <h3 className="estate-console__section-title">
              Your rooting
            </h3>
            <span className="estate-console__section-count">{localRooting.length}</span>
          </div>

          {localRooting.length === 0 ? (
            <p className="estate-console__empty">No heirs assigned yet.</p>
          ) : (
            <ul className="estate-console__rooting-grid">
              {localRooting.map((charId) => {
                const char = gameState.characters[charId];
                const data = CHARACTER_DATA[charId];
                const alive = char?.status === 'ALIVE';
                return (
                  <li
                    key={charId}
                    className="estate-console__heir"
                    style={{ '--heir-accent': data.pawnColor } as CSSProperties}
                    title={`${data.displayName} — ${alive ? 'Alive' : 'Eliminated'}`}
                  >
                    <span className="estate-console__heir-portrait">
                      <img src={CHARACTER_PORTRAITS[charId]} alt="" />
                      <span
                        className={`estate-console__heir-dot ${alive ? 'estate-console__heir-dot--alive' : 'estate-console__heir-dot--out'}`}
                        aria-hidden
                      />
                    </span>
                    <span className="estate-console__heir-name">{data.displayName}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Trap resolution */}
        {isTrapPhase && (
          <section className="estate-console__trap" aria-label="Trap resolution">
            <p className="estate-console__trap-head">
              Trap at <strong>{gameState.pendingTrapCell}</strong>
            </p>
            <p className="estate-console__trap-copy">
              Play a card from your hand, draw one, or decline.
            </p>
            {playableTrapCards.length > 0 && (
              <p className="estate-console__trap-hint">
                Playable cards are highlighted in your hand below.
              </p>
            )}
            <div className="estate-console__trap-actions">
              <button type="button" className="estate-console__trap-btn estate-console__trap-btn--draw" onClick={drawTrapCard}>
                Draw
              </button>
              <button type="button" className="estate-console__trap-btn" onClick={declineTrap}>
                Decline
              </button>
            </div>
          </section>
        )}

        {/* Event log */}
        <section className="estate-console__section estate-console__section--grow" aria-label="Event log">
          <div className="estate-console__section-head">
            <h3 className="estate-console__section-title">Event log</h3>
          </div>
          <div className="estate-console__log custom-scrollbar">
            {eventLog.length === 0 ? (
              <p className="estate-console__empty">No events yet.</p>
            ) : (
              eventLog.map((log) => {
                const variant = log.variant ?? 'info';
                const variantClass = LOG_VARIANT_CLASS[variant] ?? LOG_VARIANT_CLASS.info;
                return (
                  <p key={log.id} className={`estate-console__log-line ${variantClass}`}>
                    <time className="estate-console__log-time">{log.timestamp}</time>
                    <span className="estate-console__log-msg">{log.message}</span>
                  </p>
                );
              })
            )}
            <div ref={logEndRef} />
          </div>
        </section>
      </div>

      {/* Footer actions */}
      <footer className="estate-console__footer">
        <button
          type="button"
          className="estate-console__action"
          onClick={() => {
            gameAudio.ensureContext();
            const muted = gameAudio.toggleMute();
            setAudioMuted(muted);
          }}
          title={audioMuted ? 'Unmute sound' : 'Mute sound'}
        >
          {audioMuted ? 'Unmute' : 'Mute'}
        </button>
        <button type="button" className="estate-console__action" onClick={toggle3D} title="Toggle 2D/3D view">
          {is3DMode ? '2D map' : '3D board'}
        </button>
        <button
          type="button"
          className="estate-console__action estate-console__action--muted"
          onClick={resetGame}
          title="Reset game"
        >
          Reset
        </button>
      </footer>
    </aside>
  );
}
