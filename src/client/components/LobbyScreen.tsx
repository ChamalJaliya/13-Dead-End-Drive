/**
 * LobbyScreen.tsx
 * Gothic welcome screen — solo vs bots or multiplayer room creation/join.
 */

import { useState } from 'react';
import { useGameStore } from '../store/useGameStore.js';
import type { BotDifficulty } from '../../types/bot-api.js';
import type { OpponentCount } from '../bots/botRegistry.js';

const OPPONENT_OPTIONS: readonly OpponentCount[] = [1, 2, 3] as const;
const DIFFICULTY_OPTIONS: readonly BotDifficulty[] = ['EASY', 'NORMAL', 'HARD'] as const;

const ONLINE_ENABLED = import.meta.env.VITE_ONLINE_MULTIPLAYER === 'true';

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
    startMultiplayerGame,
    leaveRoom,
    showToast,
  } = useGameStore();

  const [playerName, setPlayerName] = useState('');
  const [opponentCount, setOpponentCount] = useState<OpponentCount>(1);
  const [difficulty, setDifficulty] = useState<BotDifficulty>('NORMAL');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');

  const canUseName = playerName.trim().length > 0;
  const canJoin = canUseName && roomCodeInput.trim().length >= 4;
  const canStartSolo = canUseName;
  const playerCount = Object.keys(gameState?.players ?? {}).length;
  const isHost = localPlayerId === gameState?.turnOrder[0];
  const totalPlayers = 1 + opponentCount;

  const handleSolo = () => {
    if (!canStartSolo) return;
    startSoloVsBots(playerName.trim(), opponentCount, difficulty);
  };

  const handleHost = () => {
    if (!canUseName) return;
    hostRoom(playerName.trim());
  };

  const handleHostOnline = () => {
    if (!canUseName) return;
    void hostOnlineRoom(playerName.trim());
  };

  const handleJoinOnline = () => {
    if (!canJoin) return;
    setJoinError('');
    void joinOnlineRoom(playerName.trim(), roomCodeInput.trim().toUpperCase()).catch(() => {
      setJoinError('Online room not found or server offline.');
    });
  };

  const handleJoin = () => {
    if (!canJoin) return;
    setJoinError('');
    try {
      joinRoom(playerName.trim(), roomCodeInput.trim().toUpperCase());
    } catch {
      setJoinError('Room not found or already started.');
    }
  };

  const copyRoomCode = () => {
    if (!roomCode) return;
    void navigator.clipboard.writeText(roomCode);
    showToast('Room code copied!', 'success');
  };

  const isInRoom = !!roomCode;

  return (
    <div className="lobby-page">
      <div className="lobby-shell">
        <header className="lobby-hero">
          <div className="lobby-hero-icon" aria-hidden>🏚️</div>
          <h1 className="lobby-hero-title">13 DEAD END DRIVE</h1>
          <p className="lobby-hero-tag">A Murder Mystery Board Game</p>
          <div className="lobby-hero-rule" aria-hidden />
        </header>

        {isInRoom ? (
          <div className="lobby-card animate-trap-in">
            <div className="lobby-card-body">
              <section className="lobby-panel lobby-room-block">
                <p className="lobby-section-title">Multiplayer Lobby</p>
                <button
                  type="button"
                  className="lobby-room-code"
                  onClick={copyRoomCode}
                  title="Click to copy room code"
                >
                  <span className="lobby-room-code-label">Click to copy</span>
                  <span className="lobby-room-code-value">{roomCode}</span>
                </button>
                <p className="lobby-room-hint">Share this code so others can join your room.</p>
              </section>

              <section className="lobby-panel lobby-panel--split">
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

              <div className="lobby-actions lobby-actions--split">
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
              <section className="lobby-panel">
                <p className="lobby-section-title">Play solo vs AI</p>
                <div className="lobby-field">
                  <label htmlFor="lobby-input-name-solo" className="lobby-label">
                    Your name
                  </label>
                  <input
                    type="text"
                    id="lobby-input-name-solo"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your name…"
                    maxLength={20}
                    autoComplete="off"
                    className="lobby-input"
                  />
                </div>

                <div className="lobby-field">
                  <span className="lobby-label">AI opponents</span>
                  <div className="lobby-opponent-row" role="group" aria-label="Number of AI opponents">
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
                  <p className="lobby-room-hint">{totalPlayers} players total (you + {opponentCount} bots)</p>
                </div>

                <div className="lobby-field">
                  <label htmlFor="lobby-select-difficulty" className="lobby-label">
                    Difficulty
                  </label>
                  <select
                    id="lobby-select-difficulty"
                    className="lobby-input"
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
              </section>

              <section className="lobby-panel lobby-panel--split">
                <p className="lobby-section-title">Local multiplayer</p>
                <button
                  type="button"
                  id="lobby-btn-host"
                  onClick={handleHost}
                  disabled={!canUseName}
                  className="lobby-btn lobby-btn--host"
                >
                  Host local room
                </button>

                <div className="lobby-join-panel">
                  <p className="lobby-section-title">Join existing room</p>
                  <div className="lobby-join-row">
                    <input
                      type="text"
                      id="lobby-input-room-code"
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                      placeholder="Room code"
                      maxLength={6}
                      autoComplete="off"
                      className="lobby-input lobby-input--code"
                    />
                    <button
                      type="button"
                      id="lobby-btn-join"
                      onClick={handleJoin}
                      disabled={!canJoin}
                      className="lobby-btn lobby-btn--join"
                    >
                      Join
                    </button>
                  </div>
                </div>

                {joinError && <p className="lobby-error">{joinError}</p>}
              </section>

              {ONLINE_ENABLED && (
                <section className="lobby-panel lobby-panel--split">
                  <p className="lobby-section-title">Play online</p>
                  <p className="lobby-room-hint">Server-authoritative — requires game-server on :2567</p>
                  <button
                    type="button"
                    onClick={handleHostOnline}
                    disabled={!canUseName}
                    className="lobby-btn lobby-btn--host"
                  >
                    Host online room
                  </button>
                  <div className="lobby-join-row">
                    <input
                      type="text"
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                      placeholder="Room code"
                      maxLength={6}
                      autoComplete="off"
                      className="lobby-input lobby-input--code"
                    />
                    <button
                      type="button"
                      onClick={handleJoinOnline}
                      disabled={!canJoin}
                      className="lobby-btn lobby-btn--join"
                    >
                      Join online
                    </button>
                  </div>
                </section>
              )}
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
