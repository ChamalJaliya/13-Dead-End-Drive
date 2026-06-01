/**
 * LobbyScreen.tsx
 * Gothic welcome screen — mode-first solo / local / online flow.
 */

import { useState } from 'react';
import { useGameStore } from '../store/useGameStore.js';
import type { BotDifficulty } from '../../types/bot-api.js';
import type { OpponentCount } from '../bots/botRegistry.js';
import type { PlayMode } from '../store/applyPlayerAction.js';
import { LobbyRulesPanel } from './LobbyRulesPanel.js';

const OPPONENT_OPTIONS: readonly OpponentCount[] = [1, 2, 3] as const;
const DIFFICULTY_OPTIONS: readonly BotDifficulty[] = ['EASY', 'NORMAL', 'HARD'] as const;

const ONLINE_ENABLED = import.meta.env.VITE_ONLINE_MULTIPLAYER === 'true';

type LobbyMode = PlayMode;
type MultiplayerIntent = 'host' | 'join';

const MODE_OPTIONS: readonly {
  id: LobbyMode;
  icon: string;
  title: string;
  description: string;
  hidden?: boolean;
}[] = [
  {
    id: 'solo',
    icon: '🤖',
    title: 'Solo',
    description: 'You vs AI on this device',
  },
  {
    id: 'local',
    icon: '👥',
    title: 'Local',
    description: 'Host or join on this device',
  },
  {
    id: 'online',
    icon: '🌐',
    title: 'Online',
    description: 'Play over the network',
    hidden: !ONLINE_ENABLED,
  },
] as const;

const MODE_LABELS: Record<PlayMode, string> = {
  solo: 'Solo vs AI',
  local: 'Local multiplayer',
  online: 'Online multiplayer',
};

export function LobbyScreen() {
  const {
    startSoloVsBots,
    hostRoom,
    hostOnlineRoom,
    joinRoom,
    joinOnlineRoom,
    roomCode,
    gameState,
    localPlayerId,
    playMode,
    startMultiplayerGame,
    leaveRoom,
    showToast,
    lobbyRuleProfile,
    lobbyEnabledModules,
    setLobbyRuleSettings,
  } = useGameStore();

  const [lobbyMode, setLobbyMode] = useState<LobbyMode>('solo');
  const [mpIntent, setMpIntent] = useState<MultiplayerIntent>('host');
  const [playerName, setPlayerName] = useState('');
  const [opponentCount, setOpponentCount] = useState<OpponentCount>(1);
  const [difficulty, setDifficulty] = useState<BotDifficulty>('NORMAL');
  const [localRoomCodeInput, setLocalRoomCodeInput] = useState('');
  const [onlineRoomCodeInput, setOnlineRoomCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');

  const visibleModes = MODE_OPTIONS.filter((m) => !m.hidden);

  const canUseName = playerName.trim().length > 0;
  const canJoinLocal = canUseName && localRoomCodeInput.trim().length >= 4;
  const canJoinOnline = canUseName && onlineRoomCodeInput.trim().length >= 4;
  const canStartSolo = canUseName;
  const playerCount = Object.keys(gameState?.players ?? {}).length;
  const isHost = localPlayerId === gameState?.turnOrder[0];
  const totalPlayers = 1 + opponentCount;
  const isInRoom = !!roomCode;

  const selectMode = (mode: LobbyMode) => {
    setLobbyMode(mode);
    setJoinError('');
    if (mode === 'solo') {
      setMpIntent('host');
    }
  };

  const handleSolo = () => {
    if (!canStartSolo) return;
    startSoloVsBots(playerName.trim(), opponentCount, difficulty);
  };

  const handleHostLocal = () => {
    if (!canUseName) return;
    hostRoom(playerName.trim());
  };

  const handleHostOnline = () => {
    if (!canUseName) return;
    void hostOnlineRoom(playerName.trim());
  };

  const handleJoinLocal = () => {
    if (!canJoinLocal) return;
    setJoinError('');
    try {
      joinRoom(playerName.trim(), localRoomCodeInput.trim().toUpperCase());
    } catch {
      setJoinError('Room not found or already started.');
    }
  };

  const handleJoinOnline = () => {
    if (!canJoinOnline) return;
    setJoinError('');
    void joinOnlineRoom(playerName.trim(), onlineRoomCodeInput.trim().toUpperCase()).catch(() => {
      setJoinError('Online room not found or server offline.');
    });
  };

  const copyRoomCode = () => {
    if (!roomCode) return;
    void navigator.clipboard.writeText(roomCode);
    showToast('Room code copied!', 'success');
  };

  return (
    <div className="lobby-page">
      <div className="lobby-shell">
        <header className="lobby-hero">
          <div className="lobby-hero-icon" aria-hidden>
            🏚️
          </div>
          <h1 className="lobby-hero-title">13 DEAD END DRIVE</h1>
          <p className="lobby-hero-tag">A Murder Mystery Board Game</p>
          <div className="lobby-hero-rule" aria-hidden />
        </header>

        {isInRoom ? (
          <div className="lobby-card animate-trap-in">
            <div className="lobby-card-body">
              <section className="lobby-card-section lobby-room-block">
                <div className="lobby-waiting-header">
                  <div className="lobby-mode-badge" data-mode={playMode}>
                    {MODE_LABELS[playMode]}
                  </div>
                  <p className="lobby-section-title">Waiting room</p>
                </div>
                <button
                  type="button"
                  className="lobby-room-code"
                  onClick={copyRoomCode}
                  title="Click to copy room code"
                >
                  <span className="lobby-room-code-label">Tap to copy</span>
                  <span className="lobby-room-code-value">{roomCode}</span>
                </button>
                <p className="lobby-room-hint">Share this code so others can join your room.</p>
              </section>

              <div className="lobby-divider" aria-hidden />

              <section className="lobby-card-section">
                <div className="lobby-players-header">
                  <span className="lobby-label">Players in room</span>
                  <span className="lobby-player-count">{playerCount} / 4</span>
                </div>
                <ul className="lobby-player-list">
                  {Object.values(gameState?.players ?? {}).map((p) => {
                    const isRoomHost = gameState?.turnOrder[0] === p.playerId;
                    const isMe = p.playerId === localPlayerId;
                    return (
                      <li key={p.playerId} className="lobby-player-row">
                        <span className="lobby-player-name">
                          <span className="lobby-player-dot" aria-hidden />
                          <span>{p.displayName}</span>
                          {isMe && <span className="lobby-player-badge">YOU</span>}
                        </span>
                        <span
                          className={
                            isRoomHost ? 'lobby-player-role lobby-player-role--host' : 'lobby-player-role'
                          }
                        >
                          {isRoomHost ? 'HOST' : 'PLAYER'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <div className="lobby-divider" aria-hidden />

              <section className="lobby-card-section">
                <LobbyRulesPanel
                  ruleProfile={lobbyRuleProfile}
                  enabledModules={lobbyEnabledModules}
                  disabled={!isHost}
                  onChange={setLobbyRuleSettings}
                />
              </section>

              <div className="lobby-divider" aria-hidden />

              <div className="lobby-card-section lobby-actions">
                {isHost ? (
                  <button
                    type="button"
                    onClick={startMultiplayerGame}
                    className="lobby-btn lobby-btn--start"
                  >
                    Start match · {playerCount} {playerCount === 1 ? 'player' : 'players'}
                  </button>
                ) : (
                  <div className="lobby-waiting">
                    <span className="lobby-waiting-dot" aria-hidden />
                    <span>Waiting for host to start the game…</span>
                  </div>
                )}
                <button type="button" onClick={leaveRoom} className="lobby-btn lobby-btn--leave">
                  Leave lobby
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="lobby-card animate-trap-in">
            <div className="lobby-card-body">
              <section className="lobby-card-section">
                <p className="lobby-section-title">How do you want to play?</p>
                <div
                  className="lobby-mode-picker"
                  role="tablist"
                  aria-label="Play mode"
                >
                  {visibleModes.map((mode) => {
                    const isActive = lobbyMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        id={`lobby-mode-${mode.id}`}
                        aria-controls="lobby-mode-panel"
                        className={
                          isActive
                            ? 'lobby-mode-card lobby-mode-card--active'
                            : 'lobby-mode-card'
                        }
                        data-mode={mode.id}
                        onClick={() => selectMode(mode.id)}
                      >
                        <span className="lobby-mode-card-icon" aria-hidden>
                          {mode.icon}
                        </span>
                        <span className="lobby-mode-card-title">{mode.title}</span>
                        <span className="lobby-mode-card-desc">{mode.description}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <div className="lobby-divider" aria-hidden />

              <section className="lobby-card-section">
                <div className="lobby-field">
                  <label htmlFor="lobby-input-name" className="lobby-label">
                    Your name
                  </label>
                  <input
                    type="text"
                    id="lobby-input-name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your name…"
                    maxLength={20}
                    autoComplete="name"
                    className="lobby-input"
                  />
                </div>
              </section>

              <div className="lobby-divider" aria-hidden />

              <section
                id="lobby-mode-panel"
                role="tabpanel"
                aria-labelledby={`lobby-mode-${lobbyMode}`}
                className="lobby-card-section lobby-mode-panel"
                data-mode={lobbyMode}
              >
                {lobbyMode === 'solo' && (
                  <>
                    <div className="lobby-solo-grid">
                      <div className="lobby-field">
                        <span className="lobby-label" id="lobby-label-opponents">
                          AI opponents
                        </span>
                        <div
                          className="lobby-opponent-row"
                          role="group"
                          aria-labelledby="lobby-label-opponents"
                        >
                          {OPPONENT_OPTIONS.map((n) => (
                            <button
                              key={n}
                              type="button"
                              className={
                                opponentCount === n
                                  ? 'lobby-btn lobby-btn--opponent lobby-btn--opponent-active'
                                  : 'lobby-btn lobby-btn--opponent'
                              }
                              onClick={() => setOpponentCount(n)}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                        <p className="lobby-room-hint lobby-room-hint--inline">
                          {totalPlayers} players · you + {opponentCount}{' '}
                          {opponentCount === 1 ? 'bot' : 'bots'}
                        </p>
                      </div>

                      <div className="lobby-field">
                        <label htmlFor="lobby-select-difficulty" className="lobby-label">
                          Difficulty
                        </label>
                        <select
                          id="lobby-select-difficulty"
                          className="lobby-input lobby-input--select"
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value as BotDifficulty)}
                        >
                          {DIFFICULTY_OPTIONS.map((d) => (
                            <option key={d} value={d}>
                              {d.charAt(0) + d.slice(1).toLowerCase()}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <LobbyRulesPanel
                      ruleProfile={lobbyRuleProfile}
                      enabledModules={lobbyEnabledModules}
                      onChange={setLobbyRuleSettings}
                    />

                    <div className="lobby-cta-block">
                      <button
                        type="button"
                        id="lobby-btn-solo"
                        onClick={handleSolo}
                        disabled={!canStartSolo}
                        className="lobby-btn lobby-btn--solo"
                      >
                        <span>Start solo game</span>
                        <span className="lobby-btn--solo-sub">Play against AI opponents</span>
                      </button>
                    </div>
                  </>
                )}

                {(lobbyMode === 'local' || lobbyMode === 'online') && (
                  <div className="lobby-mode-panel-body">
                    <div
                      className="lobby-intent-toggle"
                      data-mode={lobbyMode}
                      role="group"
                      aria-label={lobbyMode === 'local' ? 'Local room action' : 'Online room action'}
                    >
                      <button
                        type="button"
                        className={
                          mpIntent === 'host'
                            ? 'lobby-intent-btn lobby-intent-btn--active'
                            : 'lobby-intent-btn'
                        }
                        aria-pressed={mpIntent === 'host'}
                        onClick={() => {
                          setMpIntent('host');
                          setJoinError('');
                        }}
                      >
                        Create room
                      </button>
                      <button
                        type="button"
                        className={
                          mpIntent === 'join'
                            ? 'lobby-intent-btn lobby-intent-btn--active'
                            : 'lobby-intent-btn'
                        }
                        aria-pressed={mpIntent === 'join'}
                        onClick={() => {
                          setMpIntent('join');
                          setJoinError('');
                        }}
                      >
                        Join with code
                      </button>
                    </div>

                    <div className="lobby-mp-content">
                      {mpIntent === 'host' && lobbyMode === 'local' && (
                        <>
                          <p className="lobby-room-hint">
                            Host on this device — share the room code so friends can join in their browser.
                          </p>
                          <div className="lobby-cta-block lobby-cta-block--flush">
                            <button
                              type="button"
                              id="lobby-btn-host"
                              onClick={handleHostLocal}
                              disabled={!canUseName}
                              className="lobby-btn lobby-btn--host"
                            >
                              Host local room
                            </button>
                          </div>
                        </>
                      )}

                      {mpIntent === 'host' && lobbyMode === 'online' && (
                        <>
                          <p className="lobby-room-hint">
                            Server-authoritative match. Requires the game-server on port 2567.
                          </p>
                          <div className="lobby-cta-block lobby-cta-block--flush">
                            <button
                              type="button"
                              onClick={handleHostOnline}
                              disabled={!canUseName}
                              className="lobby-btn lobby-btn--host"
                            >
                              Host online room
                            </button>
                          </div>
                        </>
                      )}

                      {mpIntent === 'join' && lobbyMode === 'local' && (
                        <div className="lobby-join-panel">
                          <label htmlFor="lobby-input-room-code" className="lobby-label">
                            Room code
                          </label>
                          <div className="lobby-join-row">
                            <input
                              type="text"
                              id="lobby-input-room-code"
                              value={localRoomCodeInput}
                              onChange={(e) => setLocalRoomCodeInput(e.target.value.toUpperCase())}
                              placeholder="ABCD12"
                              maxLength={6}
                              autoComplete="off"
                              className="lobby-input lobby-input--code"
                            />
                            <button
                              type="button"
                              id="lobby-btn-join"
                              onClick={handleJoinLocal}
                              disabled={!canJoinLocal}
                              className="lobby-btn lobby-btn--join"
                            >
                              Join
                            </button>
                          </div>
                        </div>
                      )}

                      {mpIntent === 'join' && lobbyMode === 'online' && (
                        <div className="lobby-join-panel">
                          <label htmlFor="lobby-input-room-code-online" className="lobby-label">
                            Room code
                          </label>
                          <div className="lobby-join-row">
                            <input
                              type="text"
                              id="lobby-input-room-code-online"
                              value={onlineRoomCodeInput}
                              onChange={(e) => setOnlineRoomCodeInput(e.target.value.toUpperCase())}
                              placeholder="ABCD12"
                              maxLength={6}
                              autoComplete="off"
                              className="lobby-input lobby-input--code"
                            />
                            <button
                              type="button"
                              onClick={handleJoinOnline}
                              disabled={!canJoinOnline}
                              className="lobby-btn lobby-btn--join"
                            >
                              Join
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {joinError && <p className="lobby-error" role="alert">{joinError}</p>}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        <p className="lobby-footer">
          Based on the Milton Bradley board game · 2–4 players · Ages 7+
        </p>
      </div>
    </div>
  );
}
