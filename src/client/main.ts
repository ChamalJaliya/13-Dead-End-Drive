/**
 * main.ts
 * Full interactive client — local engine playground with premium UX.
 */

import { initializeGame, AUNT_AGATHA_DISPLAY_NAME } from '../engine/gameInitializer.js';
import { processTurn }     from '../engine/turnOrchestrator.js';
import { GameBoardView } from './components/GameBoard.js';
import { GameBoard3D } from './components/GameBoard3D.js';
import {
  findValidPath,
  getProhibitedChairCells,
  getReachableCells,
  type MovementPreviewContext,
} from './pathfinding.js';
import { GameAudio } from './audio/gameAudio.js';
import { getTrapCinematic } from './cinematics/trapCinematics.js';
import {
  LocalMultiplayerClient,
  persistRoomCodeForTab,
} from './multiplayer/localMultiplayerClient.js';
import type { GameState } from '../types/game-state.js';
import type { CharacterId, CellId, TrapId, PlayerId } from '../types/enums.js';
import type { SocketEvent } from '../types/socket-events.js';
import { EngineError } from '../engine/EngineError.js';

const PLAYER_A_ID = 'player-aaaa-0001';
const PLAYER_B_ID = 'player-bbbb-0002';
const GAME_ID     = 'game-test-0001';

let state: GameState = initializeGame(GAME_ID, [PLAYER_A_ID, PLAYER_B_ID], {
  [PLAYER_A_ID]: 'Player A',
  [PLAYER_B_ID]: 'Player B',
});
let selectedCharacterId: CharacterId | null = null;
let gameOverLogged = false;
let is3DMode = false;
let playMode: 'solo' | 'multiplayer' = 'solo';
let mpClient: LocalMultiplayerClient | null = null;
let lastTrapStates: Record<TrapId, import('../types/entities.js').TrapState['state']> = {} as Record<TrapId, 'READY' | 'SPENT'>;
const audio = new GameAudio();
let syncPollId: ReturnType<typeof setInterval> | null = null;

// ─── DOM ──────────────────────────────────────────────────────────────────────
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const canvas3d = document.getElementById('game-canvas-3d') as HTMLDivElement;
const hudTurn = document.getElementById('hud-turn')!;
const hudPlayer = document.getElementById('hud-player')!;
const hudDice = document.getElementById('hud-dice')!;
const hudPhase = document.getElementById('hud-phase')!;
const phaseChip = document.getElementById('phase-chip')!;
const detectiveStepLbl = document.getElementById('detective-step-lbl')!;
const detectiveBarFill = document.getElementById('detective-bar-fill')!;
const portraitName = document.getElementById('portrait-name')!;
const portraitHint = document.getElementById('portrait-hint')!;
const rootingCardsDeck = document.getElementById('rooting-cards-deck')!;
const btnRollDice = document.getElementById('btn-roll-dice')!;
const btnDeclineOrChange = document.getElementById('btn-fire-chandelier')!;
const btnDrawOrRearm = document.getElementById('btn-rearm-chandelier')!;
const btnResetGame = document.getElementById('btn-reset-game')!;
const btnToggleView = document.getElementById('btn-toggle-view')!;
const btnPlayAgain = document.getElementById('btn-play-again')!;
const welcomeScreen = document.getElementById('welcome-screen')!;
const winModal = document.getElementById('win-modal')!;
const winTitle = document.getElementById('win-title')!;
const winDesc = document.getElementById('win-desc')!;
const winSecretReveal = document.getElementById('win-secret-reveal')!;
const rootingHint = document.getElementById('rooting-hint')!;
const pawnAvatarBadge = document.getElementById('pawn-avatar-badge')!;
const pawnNameLbl = document.getElementById('pawn-name-lbl')!;
const pawnInfoLbl = document.getElementById('pawn-info-lbl')!;
const selectionCardBox = document.getElementById('selection-card-box')!;
const playerHandDeck = document.getElementById('player-hand-deck')!;
const deckCountLbl = document.getElementById('deck-count')!;
const discardCountLbl = document.getElementById('discard-count')!;
const btnFullscreen = document.getElementById('btn-fullscreen')!;
const btnToggleRail = document.getElementById('btn-toggle-rail')!;
const gameRailBackdrop = document.getElementById('game-rail-backdrop')!;
const gameEventLogs = document.getElementById('game-event-logs')!;
const toastDeck = document.getElementById('toast-deck')!;
const trapOverlay = document.getElementById('trap-overlay')!;
const trapCinematicBox = document.getElementById('trap-cinematic-box')!;
const cinematicTitleLbl = document.getElementById('cinematic-title-lbl')!;
const cinematicIconLbl = document.getElementById('cinematic-icon-lbl')!;
const cinematicDescLbl = document.getElementById('cinematic-desc-lbl')!;
const canvasGlowWrapper = document.getElementById('canvas-glow-wrapper')!;
const moveCoachEl = document.getElementById('move-coach')!;
const movePanelHint = document.getElementById('move-panel-hint')!;
const pawnPickerEl = document.getElementById('pawn-picker')!;
const destPickerEl = document.getElementById('dest-picker')!;
const btnToggleAudio = document.getElementById('btn-toggle-audio')!;
const lobbyHostPanel = document.getElementById('lobby-host-panel')!;
const lobbyJoinPanel = document.getElementById('lobby-join-panel')!;
const roomCodeDisplay = document.getElementById('room-code-display')!;
const roomCodeInput = document.getElementById('room-code-input') as HTMLInputElement;

function resizeGameCanvas(): void {
  const w = Math.max(320, Math.floor(canvasGlowWrapper.clientWidth) || 640);
  const h = Math.max(280, Math.floor(canvasGlowWrapper.clientHeight) || 480);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    view2D.fitBoardToCanvas();
    view2D.scheduleRedraw();
  }
}

function setRailOpen(open: boolean): void {
  document.body.classList.toggle('rail-collapsed', !open);
  btnToggleRail.textContent = open ? '✕ Panel' : '☰ Panel';
  btnToggleRail.title = open ? 'Hide control panel' : 'Show control panel';
}

const CARD_ART: Record<string, string> = {
  CHANDELIER: '💡',
  SUIT_OF_ARMOR: '🛡️',
  BOOKCASE: '📚',
  STAIRS: '🪜',
  FIREPLACE: '🔥',
  WILD: '🃏',
  DETECTIVE: '🕵️',
};

function cardArtFor(card: import('../types/entities.js').ActionCard): string {
  if (card.cardType === 'WILD_CARD') return CARD_ART.WILD ?? '🃏';
  if (card.cardType === 'DETECTIVE_CARD') return CARD_ART.DETECTIVE ?? '🕵️';
  if (card.matchesTrapId) return CARD_ART[card.matchesTrapId] ?? '⚡';
  return '🃏';
}

function cardVariantClass(card: import('../types/entities.js').ActionCard): string {
  if (card.cardType === 'WILD_CARD') return 'trap-wild';
  if (card.cardType === 'DETECTIVE_CARD') return 'trap-detective';
  return 'trap-specific';
}

const view2D = new GameBoardView(canvas.getContext('2d')!);
view2D.setContext(canvas.getContext('2d')!);
resizeGameCanvas();
window.addEventListener('resize', resizeGameCanvas);

if (typeof ResizeObserver !== 'undefined') {
  const boardResizeObserver = new ResizeObserver(() => resizeGameCanvas());
  boardResizeObserver.observe(canvasGlowWrapper);
}

let view3D: GameBoard3D | null = null;

function detectTrapAudio(prev: GameState, next: GameState): void {
  for (const trapId of Object.keys(next.traps) as TrapId[]) {
    const was = prev.traps[trapId]?.state;
    const now = next.traps[trapId]?.state;
    if (was === 'READY' && now === 'SPENT') {
      audio.playTrap(trapId);
    }
  }
}

function detectDetectiveReveal(prev: GameState, next: GameState): void {
  if (next.discardPile.length <= prev.discardPile.length) return;
  const prevIds = new Set(prev.discardPile.map((c) => c.cardId));
  for (const card of next.discardPile) {
    if (!prevIds.has(card.cardId) && card.isDetective) {
      addLog(
        `🕵️ Detective card revealed! Detective advances to step ${next.detectivePosition.currentStep} / ${next.detectivePosition.maxSteps}.`,
        'danger',
      );
      audio.playDetectiveStep();
    }
  }
}

function syncViews(prevState?: GameState): void {
  if (prevState) {
    detectTrapAudio(prevState, state);
    detectDetectiveReveal(prevState, state);
  }
  view2D.onStateSync({ gameState: state, privateHand: [] });
  view3D?.updateState(state);
  lastTrapStates = Object.fromEntries(
    Object.entries(state.traps).map(([k, v]) => [k, v.state]),
  ) as Record<TrapId, 'READY' | 'SPENT'>;
}

function cellLabel(cellId: CellId): string {
  const cell = state.board[cellId];
  if (!cell) return cellId;
  if (cell.cellType === 'EXIT') return 'Front door (EXIT)';
  if (cell.cellType === 'RED_CHAIR' || cell.isRedChair) return 'Red chair';
  if (cell.cellType === 'TRAP_ZONE') return cell.trapRef ? `Trap: ${cell.trapRef}` : 'Trap';
  if (cell.cellType === 'TRAP_DRAW') return 'Draw trap card';
  if (cell.cellType === 'SECRET_PASSAGE') return 'Secret passage';
  if (cell.boardIndex !== undefined) return `Space ${cell.boardIndex}`;
  return cell.label;
}

function selectPawn(charId: CharacterId): void {
  if (state.phase === 'GAME_OVER' || !isMyTurn()) return;
  if (state.subPhase !== 'FIRST_MOVE' && state.subPhase !== 'SECOND_MOVE') return;
  const ch = state.characters[charId];
  if (!ch || ch.status !== 'ALIVE') return;

  selectedCharacterId = charId;
  view2D.setSelectedCharacter(charId);
  const previewCtx: MovementPreviewContext = {
    boardVersion: state.boardVersion,
    characters: state.characters,
    moverIsOnRedChair: ch.isOnRedChair,
  };
  const reachable = state.pipsRemaining !== null
    ? getReachableCells(state.board, ch.position, state.pipsRemaining, charId, previewCtx)
    : [];
  const prohibited =
    state.pipsRemaining !== null ? getProhibitedChairCells(state.boardVersion) : [];
  view2D.setProhibitedCells(prohibited);
  view2D.focusOnCells([ch.position, ...reachable]);
  updateUI();
  addLog(`Selected ${ch.displayName}.`, 'info');
}

function tryMoveToCell(cellId: CellId): void {
  if (state.phase === 'GAME_OVER') return;
  if (!isMyTurn()) {
    showToast('It is not your turn.');
    return;
  }
  if (!selectedCharacterId || state.pipsRemaining === null) return;
  if (state.subPhase !== 'FIRST_MOVE' && state.subPhase !== 'SECOND_MOVE') return;

  const char = state.characters[selectedCharacterId]!;
  const previewCtx: MovementPreviewContext = {
    boardVersion: state.boardVersion,
    characters: state.characters,
    moverIsOnRedChair: char.isOnRedChair,
  };
  const path = findValidPath(
    state.board,
    char.position,
    cellId,
    state.pipsRemaining,
    selectedCharacterId,
    previewCtx,
  );
  if (!path) {
    showToast(`No valid path of exactly ${state.pipsRemaining} pips to that tile.`);
    return;
  }

  try {
    const usingCombinedDice = !!(
      state.subPhase === 'FIRST_MOVE' &&
      state.movementPlan === 'COMBINED' &&
      state.movesUsedThisTurn === 0 &&
      state.lastDiceRoll &&
      state.pipsRemaining === state.lastDiceRoll.die1 + state.lastDiceRoll.die2
    );

    dispatch({
      type: 'MOVE_PAWN',
      eventId: crypto.randomUUID(),
      gameId: state.gameId,
      playerId: state.activePlayerId,
      timestamp: new Date().toISOString(),
      payload: {
        characterId: selectedCharacterId,
        fromCell: char.position,
        toCell: cellId,
        pipsUsed: state.pipsRemaining,
        path,
        usingCombinedDice,
      },
    });

    audio.playMove();
    addLog(`${char.displayName} → ${cellLabel(cellId)}.`, 'info');
    selectedCharacterId = null;
    view2D.setSelectedCharacter(null);

    if (state.pendingTrapCell) {
      addLog('☠️ Trap space! Resolve with a card, draw, or decline.', 'warn');
    }
  } catch (err: unknown) {
    handleEngineError(err);
  }
}

function handleBoardInteraction(cellId: CellId, charOnCell: CharacterId | null): void {
  if (state.phase === 'GAME_OVER') return;
  if (!isMyTurn()) {
    showToast('It is not your turn.');
    return;
  }

  if (charOnCell && (state.subPhase === 'FIRST_MOVE' || state.subPhase === 'SECOND_MOVE')) {
    selectPawn(charOnCell);
    return;
  }

  if (!selectedCharacterId) return;
  tryMoveToCell(cellId);
}

function subPhaseLabel(): string {
  const labels: Record<string, string> = {
    AWAITING_ROLL:   'Roll both dice',
    FIRST_MOVE:      'First pawn move',
    AWAITING_TRAP_1: 'Resolve trap (move 1)',
    SECOND_MOVE:     'Second pawn move',
    AWAITING_TRAP_2: 'Resolve trap (move 2)',
    TURN_END:        'Ending turn…',
  };
  return labels[state.subPhase] ?? state.subPhase;
}

function addLog(message: string, type: 'info' | 'warn' | 'danger' | 'success' = 'info'): void {
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  entry.innerHTML = `<span style="color: var(--color-text-dim);">[${timestamp}]</span> ${message}`;
  gameEventLogs.appendChild(entry);
  gameEventLogs.scrollTop = gameEventLogs.scrollHeight;
}

function showToast(message: string, variant: 'warn' | 'success' = 'warn'): void {
  const toast = document.createElement('div');
  toast.className = 'toast';
  if (variant === 'success') {
    toast.style.borderColor = 'var(--accent-neon-green)';
    toast.style.color = 'hsl(140, 100%, 90%)';
  }
  toast.innerHTML = `${variant === 'success' ? '✓' : '⚠️'} <span>${message}</span>`;
  toastDeck.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function triggerCinematic(trapId: TrapId, charName: string, cellName: string): void {
  const cfg = getTrapCinematic(trapId);
  cinematicTitleLbl.textContent = cfg.title;
  cinematicIconLbl.textContent = cfg.icon;
  cinematicIconLbl.className = `cinematic-icon ${cfg.animClass}`;
  trapCinematicBox.style.borderColor = cfg.accentColor;
  trapCinematicBox.style.boxShadow = cfg.glowShadow;
  cinematicDescLbl.innerHTML =
    `${cfg.description}<br><br><strong>${charName}</strong> at <strong>${cellName}</strong>.`;
  trapOverlay.classList.add('show');
  setTimeout(() => trapOverlay.classList.remove('show'), 3200);
}

function isMyTurn(): boolean {
  if (!mpClient) return true;
  return state.activePlayerId === mpClient.getPlayerId();
}

function viewerPlayerId(): PlayerId {
  if (mpClient) return mpClient.getPlayerId();
  return state.activePlayerId;
}

function updateRootingCardsPanel(): void {
  rootingCardsDeck.innerHTML = '';
  const viewer = state.players[viewerPlayerId()];
  const is2p = state.turnOrder.length === 2;
  const revealSecrets = state.secretCardsRevealed;

  if (!viewer || viewer.characterIds.length === 0) {
    rootingCardsDeck.innerHTML =
      '<span style="color:var(--color-text-dim)">Deal character cards at setup</span>';
    return;
  }

  for (const charId of viewer.characterIds) {
    const ch = state.characters[charId];
    const chip = document.createElement('span');
    const alive = ch?.status === 'ALIVE';
    chip.style.cssText =
      `padding:0.25rem 0.5rem;border-radius:6px;border:1px solid ${ch?.pawnColor ?? '#666'};` +
      `opacity:${alive ? '1' : '0.45'};text-decoration:${alive ? 'none' : 'line-through'}`;
    chip.textContent = ch?.displayName ?? charId;
    if (ch?.isPortraitHeir) chip.textContent += ' 🖼️';
    rootingCardsDeck.appendChild(chip);
  }

  if (is2p && viewer.hasHiddenSecretCard && !revealSecrets) {
    const hidden = document.createElement('span');
    hidden.style.cssText =
      'padding:0.25rem 0.5rem;border-radius:6px;border:1px dashed hsla(45,90%,55%,0.5);color:hsl(45,90%,65%)';
    hidden.textContent = '🔒 Secret card (hidden)';
    rootingCardsDeck.appendChild(hidden);
    rootingHint.textContent =
      '2-player rules: you also hold two hidden cards you cannot look at until the game ends.';
  } else if (is2p && revealSecrets && viewer.secretCharacterIds.length > 0) {
    for (const secretId of viewer.secretCharacterIds) {
      const ch = state.characters[secretId];
      const secret = document.createElement('span');
      const alive = ch?.status === 'ALIVE';
      secret.style.cssText =
        `padding:0.25rem 0.5rem;border-radius:6px;border:2px solid hsl(45,90%,55%);` +
        `opacity:${alive ? '1' : '0.45'}`;
      secret.textContent = `🔓 Secret: ${ch?.displayName ?? secretId}`;
      rootingCardsDeck.appendChild(secret);
    }
    rootingHint.textContent = 'Secret cards revealed — check who held the winning guest.';
  } else {
    rootingHint.textContent =
      'You’re rooting for these guests — move anyone, but only your cards win.';
  }
}

function alivePawnCells(): CellId[] {
  return Object.values(state.characters)
    .filter((c) => c.status === 'ALIVE')
    .map((c) => c.position);
}

function ensure2DBoardView(): void {
  btnToggleView.classList.remove('hidden');
}

function updateMoveCoach(): void {
  if (state.phase === 'GAME_OVER') {
    moveCoachEl.className = 'move-coach waiting';
    moveCoachEl.innerHTML = '<strong>Game over.</strong> Reset or play again to start a new match.';
    return;
  }
  if (mpClient && !isMyTurn()) {
    moveCoachEl.className = 'move-coach waiting';
    moveCoachEl.innerHTML =
      `<strong>Waiting…</strong> ${state.players[state.activePlayerId]?.displayName ?? 'Opponent'} is playing.`;
    return;
  }
  if (state.subPhase === 'AWAITING_ROLL') {
    moveCoachEl.className = 'move-coach waiting';
    moveCoachEl.innerHTML =
      '<strong>Your turn:</strong> Tap <strong>🎲 Roll Dice</strong> (bottom-right of board).';
    return;
  }
  if (state.subPhase === 'AWAITING_TRAP_1' || state.subPhase === 'AWAITING_TRAP_2') {
    moveCoachEl.className = 'move-coach waiting';
    moveCoachEl.innerHTML =
      '<strong>Trap!</strong> Play a matching card, <strong>Draw From Deck</strong>, or <strong>Decline</strong>.';
    return;
  }
  if (
    state.subPhase === 'FIRST_MOVE' &&
    state.lastDiceRoll &&
    state.movesUsedThisTurn === 0 &&
    state.movementPlan === 'SPLIT'
  ) {
    const { die1, die2 } = state.lastDiceRoll;
    moveCoachEl.className = 'move-coach';
    moveCoachEl.innerHTML =
      `<strong>Choose dice use:</strong> one pawn <strong>${die1 + die2}</strong> spaces, ` +
      `or two pawns <strong>${die1}</strong> + <strong>${die2}</strong> (different guests). ` +
      `Tap <strong>🎯 One pawn</strong> or pick a guest for split.`;
    return;
  }

  if (state.subPhase === 'FIRST_MOVE' || state.subPhase === 'SECOND_MOVE') {
    const pips = state.pipsRemaining ?? 0;
    const moveLabel = state.subPhase === 'FIRST_MOVE' ? 'first' : 'second';
    if (!selectedCharacterId) {
      moveCoachEl.className = 'move-coach';
      moveCoachEl.innerHTML =
        `<strong>Step 2 (${moveLabel} move · ${pips} pip${pips === 1 ? '' : 's'}):</strong> ` +
        'Open <strong>☰ Panel</strong> → pick a guest in Move Helper';
      return;
    }
    const name = state.characters[selectedCharacterId]!.displayName;
    moveCoachEl.className = 'move-coach';
    moveCoachEl.innerHTML =
      `<strong>Step 3:</strong> Tap where <em>${name}</em> should land (${pips} pip${pips === 1 ? '' : 's'}).`;
    return;
  }
  moveCoachEl.className = 'move-coach waiting';
  moveCoachEl.textContent = subPhaseLabel();
}

function updateMoveHighlights(): void {
  const inMove =
    state.subPhase === 'FIRST_MOVE' || state.subPhase === 'SECOND_MOVE';
  if (!inMove || state.pipsRemaining === null) {
    view2D.setHighlightCells([]);
    view2D.setPawnPickCells([]);
    return;
  }
  if (!selectedCharacterId) {
    view2D.setHighlightCells([]);
    view2D.setPawnPickCells(alivePawnCells());
    return;
  }
  view2D.setPawnPickCells([]);
  const char = state.characters[selectedCharacterId]!;
  const previewCtx: MovementPreviewContext = {
    boardVersion: state.boardVersion,
    characters: state.characters,
    moverIsOnRedChair: char.isOnRedChair,
  };
  const reachable = getReachableCells(
    state.board,
    char.position,
    state.pipsRemaining,
    selectedCharacterId,
    previewCtx,
  );
  view2D.setHighlightCells(reachable);
  view2D.setProhibitedCells(getProhibitedChairCells(state.boardVersion));
  view2D.focusOnCells([char.position, ...reachable]);
}

function updateMovePanel(): void {
  pawnPickerEl.innerHTML = '';
  destPickerEl.innerHTML = '';

  if (state.phase === 'GAME_OVER' || (mpClient && !isMyTurn())) {
    movePanelHint.textContent = 'Waiting for your turn…';
    return;
  }

  if (state.subPhase === 'AWAITING_ROLL') {
    movePanelHint.textContent = 'Roll both dice first.';
    return;
  }

  if (state.subPhase === 'AWAITING_TRAP_1' || state.subPhase === 'AWAITING_TRAP_2') {
    movePanelHint.textContent = 'Resolve the trap with cards or buttons above.';
    return;
  }

  if (state.subPhase !== 'FIRST_MOVE' && state.subPhase !== 'SECOND_MOVE') {
    movePanelHint.textContent = subPhaseLabel();
    return;
  }

  const pips = state.pipsRemaining ?? 0;
  const moveLabel = state.subPhase === 'FIRST_MOVE' ? '1st' : '2nd';

  if (!selectedCharacterId) {
    movePanelHint.textContent = `${moveLabel} move: pick a guest (${pips} space${pips === 1 ? '' : 's'}).`;
    const alive = Object.entries(state.characters)
      .filter(([, c]) => c.status === 'ALIVE')
      .sort((a, b) => a[1].displayName.localeCompare(b[1].displayName));

    for (const [charId, ch] of alive) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'move-btn';
      btn.style.borderColor = ch.pawnColor;
      btn.textContent = `${ch.displayName}${ch.isPortraitHeir ? ' 🖼️' : ''}`;
      if (selectedCharacterId === charId) btn.classList.add('selected');
      btn.addEventListener('click', () => selectPawn(charId as CharacterId));
      pawnPickerEl.appendChild(btn);
    }
    return;
  }

  const char = state.characters[selectedCharacterId]!;
  const previewCtx: MovementPreviewContext = {
    boardVersion: state.boardVersion,
    characters: state.characters,
    moverIsOnRedChair: char.isOnRedChair,
  };
  const reachable = getReachableCells(
    state.board,
    char.position,
    pips,
    selectedCharacterId,
    previewCtx,
  );

  movePanelHint.textContent =
    `${moveLabel} move: where should ${char.displayName} go? (${reachable.length} option${reachable.length === 1 ? '' : 's'})`;

  const changeBtn = document.createElement('button');
  changeBtn.type = 'button';
  changeBtn.className = 'move-btn';
  changeBtn.textContent = '← Pick different guest';
  changeBtn.addEventListener('click', () => {
    selectedCharacterId = null;
    view2D.setSelectedCharacter(null);
    updateUI();
  });
  pawnPickerEl.appendChild(changeBtn);

  if (reachable.length === 0) {
    const none = document.createElement('p');
    none.className = 'move-panel-hint';
    none.textContent = 'No legal moves — try another guest or decline trap if stuck.';
    destPickerEl.appendChild(none);
    return;
  }

  const sorted = [...reachable].sort((a, b) => cellLabel(a).localeCompare(cellLabel(b)));
  for (const cellId of sorted) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'move-btn move-btn-dest';
    const typeHint = state.board[cellId]?.cellType ?? 'ROOM';
    btn.textContent = `→ ${cellLabel(cellId)} (${typeHint.replace('_', ' ')})`;
    btn.addEventListener('click', () => tryMoveToCell(cellId));
    destPickerEl.appendChild(btn);
  }
}

function showWinModal(): void {
  if (!state.winner || !state.winCondition) return;
  const winnerName = state.players[state.winner]?.displayName ?? 'Unknown';
  const conditionLabels: Record<string, string> = {
    HEIR_ESCAPED:      'The featured portrait character escaped the mansion!',
    DETECTIVE_ARRIVED: 'The detective reached the door — holder of the portrait card wins!',
    LAST_ALIVE:        'Last player with a living guest in the mansion claims the fortune!',
  };
  winTitle.textContent = `${winnerName} Wins!`;
  winDesc.textContent = conditionLabels[state.winCondition] ?? state.winCondition;

  if (state.secretCardsRevealed && state.turnOrder.length === 2) {
    const lines = state.turnOrder.map((pid) => {
      const p = state.players[pid]!;
      const names = p.secretCharacterIds.map(
        (id) => state.characters[id]?.displayName ?? id,
      );
      const label = names.length > 0 ? names.join(', ') : '—';
      return `<strong>${p.displayName}</strong>: secret cards were <em>${label}</em>`;
    });
    winSecretReveal.innerHTML = `<div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;color:hsl(45,90%,65%);margin-bottom:0.5rem;">2-Player Secret Cards Revealed</div>${lines.join('<br>')}`;
    winSecretReveal.classList.remove('hidden');
  } else {
    winSecretReveal.classList.add('hidden');
    winSecretReveal.innerHTML = '';
  }

  winModal.classList.remove('hidden');
}

function updateUI(): void {
  hudTurn.textContent = `#${state.turnNumber}`;
  const activePlayer = state.players[state.activePlayerId]!;
  hudPlayer.textContent = activePlayer.displayName;
  const isPlayerA = state.activePlayerId === PLAYER_A_ID;
  const accent = isPlayerA ? 'var(--accent-neon-purple)' : 'var(--accent-neon-blue)';
  const glow = isPlayerA ? 'var(--glow-purple)' : 'var(--glow-blue)';
  hudPlayer.style.color = accent;
  hudPlayer.style.textShadow = glow;
  canvasGlowWrapper.style.borderColor = accent;
  canvasGlowWrapper.style.boxShadow = `${glow}, inset 0 0 20px rgba(0,0,0,0.8)`;

  hudPhase.textContent = subPhaseLabel();
  phaseChip.textContent = state.phase === 'GAME_OVER' ? 'Game Over' : subPhaseLabel();

  if (state.lastDiceRoll) {
    const { die1, die2, isDoubles } = state.lastDiceRoll;
    hudDice.textContent = `${die1} · ${die2}${isDoubles ? ' ⭐ doubles' : ''}`;
  } else {
    hudDice.textContent = '—';
  }

  const det = state.detectivePosition;
  const pct = Math.min(100, (det.currentStep / det.maxSteps) * 100);
  detectiveBarFill.style.width = `${pct}%`;
  detectiveStepLbl.textContent = det.isAtExit ? 'At the door!' : `Step ${det.currentStep} / ${det.maxSteps}`;

  const heirId = state.activePortrait.currentHeirId;
  if (heirId === 'AUNT_AGATHA') {
    portraitName.textContent = AUNT_AGATHA_DISPLAY_NAME;
    portraitHint.textContent = `Opening portrait — only doubles may rotate the will.`;
  } else {
    const heir = state.characters[heirId];
    if (heir) {
      portraitName.textContent = heir.displayName;
      portraitHint.textContent =
        heir.status === 'ALIVE'
          ? `${AUNT_AGATHA_DISPLAY_NAME}'s featured heir · at ${state.board[heir.position]?.label ?? heir.position}`
          : 'Featured heir eliminated — portrait will rotate';
    }
  }

  updateRootingCardsPanel();

  if (selectedCharacterId) {
    const char = state.characters[selectedCharacterId]!;
    selectionCardBox.classList.add('has-selection');
    pawnAvatarBadge.textContent = selectedCharacterId.substring(0, 2);
    pawnAvatarBadge.style.backgroundColor = char.pawnColor;
    pawnAvatarBadge.style.borderColor = char.pawnColor;
    const owner = char.controlledBy
      ? state.players[char.controlledBy]?.displayName ?? 'Unknown'
      : 'Neutral';
    pawnNameLbl.textContent = `${char.displayName}${char.isPortraitHeir ? ' 🖼️' : ''}`;
    pawnInfoLbl.innerHTML =
      `<strong>${state.board[char.position]?.label ?? char.position}</strong> · ${owner} · ` +
      `<span style="color:${char.status === 'ALIVE' ? 'var(--accent-neon-green)' : 'var(--accent-neon-red)'}">${char.status}</span>`;
  } else {
    selectionCardBox.classList.remove('has-selection');
    pawnAvatarBadge.textContent = '?';
    pawnNameLbl.textContent = 'No Selection';
    if (state.subPhase === 'AWAITING_ROLL') {
      pawnInfoLbl.textContent = 'Roll both dice first (Turn Actions in panel).';
    } else if (state.subPhase === 'FIRST_MOVE' || state.subPhase === 'SECOND_MOVE') {
      pawnInfoLbl.textContent = `Click a gold-ring pawn (${state.pipsRemaining ?? 0} pips to spend).`;
    } else {
      pawnInfoLbl.textContent = 'Follow the move coach above the board.';
    }
  }

  deckCountLbl.textContent = String(state.deck.length);
  discardCountLbl.textContent = String(state.discardPile.length);

  playerHandDeck.innerHTML = '';
  const hand = activePlayer.hand;
  if (hand.length === 0) {
    playerHandDeck.innerHTML =
      '<div class="hand-zone-empty">Trap &amp; wild cards you draw appear here (detective cards are revealed and discarded)</div>';
  } else {
    const mid = (hand.length - 1) / 2;
    hand.forEach((card, index) => {
      const cardEl = document.createElement('div');
      cardEl.className = `action-card ${cardVariantClass(card)}`;
      cardEl.setAttribute('role', 'listitem');

      let isPlayable = false;
      if (state.pendingTrapCell) {
        const trapId = state.board[state.pendingTrapCell]?.trapRef;
        if (trapId && (card.isWild || card.matchesTrapId === trapId)) {
          isPlayable = true;
          cardEl.classList.add('playable');
        }
      }

      const spread = Math.min(14, 42 / Math.max(hand.length, 1));
      const rotate = (index - mid) * spread;
      cardEl.style.transform = `rotate(${rotate}deg)`;

      cardEl.innerHTML = `
        <div class="card-top">
          <div class="card-art">${cardArtFor(card)}</div>
          <span class="card-tag">${card.cardType.replace(/_/g, ' ')}</span>
          <span class="card-title">${card.label}</span>
        </div>
        <p class="card-desc">${card.description}</p>`;
      cardEl.addEventListener('click', () => {
        if (state.pendingTrapCell && isPlayable) {
          handlePlayTrapCard(card.cardId, card.cardType);
        } else if (state.pendingTrapCell) {
          showToast('This card does not match the pending trap.');
        } else {
          showToast('Play trap cards only when a pawn lands on a trap.');
        }
      });
      playerHandDeck.appendChild(cardEl);
    });
  }

  btnRollDice.style.display = 'none';
  btnDeclineOrChange.style.display = 'none';
  btnDrawOrRearm.style.display = 'none';

  if (state.phase === 'GAME_OVER') {
    hudDice.textContent = 'FIN';
    if (!gameOverLogged) {
      gameOverLogged = true;
      addLog(`🎉 ${state.players[state.winner!]?.displayName} wins via ${state.winCondition}!`, 'success');
      audio.playWin();
      showWinModal();
    }
    return;
  }

  if (mpClient && !isMyTurn()) {
    btnRollDice.style.display = 'none';
    phaseChip.textContent = `Waiting for ${state.players[state.activePlayerId]?.displayName ?? 'opponent'}…`;
  }

  if (state.subPhase === 'AWAITING_ROLL') {
    btnRollDice.style.display = 'flex';
    btnRollDice.textContent = '🎲 Roll Both Dice';
  } else if (
    state.subPhase === 'FIRST_MOVE' &&
    state.lastDiceRoll &&
    state.movesUsedThisTurn === 0 &&
    state.movementPlan === 'SPLIT'
  ) {
    btnDrawOrRearm.style.display = 'flex';
    btnDrawOrRearm.textContent =
      `🎯 One pawn (${state.lastDiceRoll.die1 + state.lastDiceRoll.die2})`;
    btnDrawOrRearm.className = 'btn btn-primary';
  } else if (state.subPhase === 'FIRST_MOVE' && state.lastDiceRoll?.isDoubles && state.movesUsedThisTurn === 0) {
    btnDeclineOrChange.style.display = 'flex';
    btnDeclineOrChange.textContent = '🖼️ Rotate Featured Portrait';
    btnDeclineOrChange.className = 'btn btn-primary';
  } else if (state.subPhase === 'AWAITING_TRAP_1' || state.subPhase === 'AWAITING_TRAP_2') {
    btnDeclineOrChange.style.display = 'flex';
    btnDeclineOrChange.textContent = '❌ Decline Trap';
    btnDeclineOrChange.className = 'btn btn-danger';
    btnDrawOrRearm.style.display = 'flex';
    btnDrawOrRearm.textContent = '🎴 Draw From Deck';
    btnDrawOrRearm.className = 'btn btn-primary';
  }

  updateMoveCoach();
  updateMoveHighlights();
  updateMovePanel();
  ensure2DBoardView();
}

function handleEngineError(err: unknown): void {
  const msg = err instanceof EngineError ? err.message : err instanceof Error ? err.message : 'Action failed';
  showToast(msg);
}

function dispatch(event: SocketEvent): void {
  if (mpClient && !isMyTurn()) {
    showToast('Wait for your turn.');
    return;
  }
  const prev = state;
  if (mpClient) {
    state = mpClient.submitAction(event);
  } else {
    state = processTurn(state, event);
  }
  syncViews(prev);
  updateUI();
}

function handleRollDice(): void {
  try {
    dispatch({
      type: 'ROLL_DICE',
      eventId: crypto.randomUUID(),
      gameId: state.gameId,
      playerId: state.activePlayerId,
      timestamp: new Date().toISOString(),
    });
    const { die1, die2, isDoubles } = state.lastDiceRoll!;
    audio.playDiceRoll();
    addLog(`${state.players[state.activePlayerId]!.displayName} rolled ${die1} and ${die2}.`, 'info');
    if (isDoubles) {
      addLog('Doubles! Optionally rotate the fireplace portrait before moving.', 'warn');
    }
    addLog(`Move any pawn exactly ${state.pipsRemaining} space(s).`, 'info');
    showToast(
      `Rolled ${die1} + ${die2}. Use Move Helper — pick a guest, then a destination.`,
      'success',
    );
  } catch (err: unknown) {
    handleEngineError(err);
  }
}

function handleChangePortraitOrDecline(): void {
  try {
    if (state.subPhase === 'FIRST_MOVE') {
      dispatch({
        type: 'CHANGE_PORTRAIT',
        eventId: crypto.randomUUID(),
        gameId: state.gameId,
        playerId: state.activePlayerId,
        timestamp: new Date().toISOString(),
      });
      const heirId = state.activePortrait.currentHeirId;
      const name = heirId === 'AUNT_AGATHA' ? AUNT_AGATHA_DISPLAY_NAME : state.characters[heirId]!.displayName;
      addLog(`Featured portrait is now ${name}.`, 'warn');
    } else {
      dispatch({
        type: 'DECLINE_TRAP',
        eventId: crypto.randomUUID(),
        gameId: state.gameId,
        playerId: state.activePlayerId,
        timestamp: new Date().toISOString(),
      });
      addLog('Trap declined — turn continues.', 'info');
    }
  } catch (err: unknown) {
    handleEngineError(err);
  }
}

function handleChooseCombinedMovement(): void {
  try {
    dispatch({
      type: 'CHOOSE_MOVEMENT_PLAN',
      eventId: crypto.randomUUID(),
      gameId: state.gameId,
      playerId: state.activePlayerId,
      timestamp: new Date().toISOString(),
      payload: { plan: 'COMBINED' },
    });
    const total = state.pipsRemaining ?? 0;
    addLog(`Using both dice on one pawn (${total} spaces).`, 'info');
    showToast(`One pawn may move ${total} spaces. Pick a guest, then destination.`, 'success');
  } catch (err: unknown) {
    handleEngineError(err);
  }
}

function handleDrawCard(): void {
  try {
    const prevStep = state.detectivePosition.currentStep;
    dispatch({
      type: 'DRAW_TRAP_CARD',
      eventId: crypto.randomUUID(),
      gameId: state.gameId,
      playerId: state.activePlayerId,
      timestamp: new Date().toISOString(),
    });
    if (state.detectivePosition.currentStep > prevStep) {
      audio.playDetectiveStep();
      addLog(`🕵️ Detective card! Detective advances to step ${state.detectivePosition.currentStep}. Draw again!`, 'danger');
    } else {
      audio.playCardDraw();
      const hand = state.players[state.activePlayerId]!.hand;
      const drawn = hand[hand.length - 1];
      if (drawn) addLog(`Drew "${drawn.label}" — play it if it matches the trap.`, 'success');
    }
  } catch (err: unknown) {
    handleEngineError(err);
  }
}

function handlePlayTrapCard(cardId: string, cardType: import('../types/enums.js').CardType): void {
  try {
    const targetCell = state.pendingTrapCell!;
    const cell = state.board[targetCell]!;
    const trapId = cell.trapRef!;
    const trap = state.traps[trapId]!;
    const victims = Object.values(state.characters).filter(
      (c) => c.status === 'ALIVE' && trap.eliminatesOnCells.includes(c.position),
    );

    dispatch({
      type: 'PLAY_TRAP_CARD',
      eventId: crypto.randomUUID(),
      gameId: state.gameId,
      playerId: state.activePlayerId,
      timestamp: new Date().toISOString(),
      payload: { cardId, cardType, targetCell },
    });

    for (const v of victims) {
      triggerCinematic(trapId, v.displayName, cell.label);
      addLog(`💀 ${v.displayName} eliminated by ${trap.label}!`, 'danger');
    }
    addLog(`${trap.label} trap spent.`, 'success');
  } catch (err: unknown) {
    handleEngineError(err);
  }
}

function resetSoloGame(): void {
  playMode = 'solo';
  mpClient = null;
  if (syncPollId) clearInterval(syncPollId);
  state = initializeGame(GAME_ID, [PLAYER_A_ID, PLAYER_B_ID], {
    [PLAYER_A_ID]: 'Player A',
    [PLAYER_B_ID]: 'Player B',
  });
  selectedCharacterId = null;
  gameOverLogged = false;
  view2D.setSelectedCharacter(null);
  view2D.setHighlightCells([]);
  view2D.setPawnPickCells([]);
  winModal.classList.add('hidden');
  ensure2DBoardView();
  syncViews();
  updateUI();
  addLog('Solo session — twelve guests take their red chairs.', 'success');
}

function beginMultiplayerHost(): void {
  playMode = 'multiplayer';
  mpClient = new LocalMultiplayerClient(PLAYER_A_ID, 'Host');
  mpClient.onStateSync((payload) => {
    const prev = state;
    state = payload.gameState;
    syncViews(prev);
    updateUI();
  });
  const { roomCode } = mpClient.createRoom();
  roomCodeDisplay.textContent = roomCode;
  persistRoomCodeForTab(roomCode);
  lobbyHostPanel.classList.add('visible');
  addLog(`Room created. Code: ${roomCode}`, 'success');
}

function beginMultiplayerJoin(code: string): void {
  playMode = 'multiplayer';
  mpClient = new LocalMultiplayerClient(PLAYER_B_ID, 'Guest');
  mpClient.onStateSync((payload) => {
    const prev = state;
    state = payload.gameState;
    syncViews(prev);
    updateUI();
  });
  mpClient.joinRoom(code);
  startSyncPoll();
  welcomeScreen.classList.add('hidden');
  addLog(`Joined room ${code}. Waiting for host to start…`, 'info');
}

function startMultiplayerGame(): void {
  if (!mpClient) return;
  const ids = [PLAYER_A_ID, PLAYER_B_ID] as PlayerId[];
  mpClient.startGame(ids, {
    [PLAYER_A_ID]: 'Host',
    [PLAYER_B_ID]: 'Guest',
  });
  welcomeScreen.classList.add('hidden');
  startSyncPoll();
  addLog('Multiplayer match started!', 'success');
}

function startSyncPoll(): void {
  if (syncPollId) clearInterval(syncPollId);
  syncPollId = setInterval(() => mpClient?.syncFromStorage(), 800);
}

function enterGame(): void {
  welcomeScreen.classList.add('hidden');
  audio.ensureContext();
}

view2D.onClick(handleBoardInteraction);

document.getElementById('btn-board-zoom-in')?.addEventListener('click', () => {
  view2D.zoomBoard(1.2);
  audio.playUiClick();
});
document.getElementById('btn-board-zoom-out')?.addEventListener('click', () => {
  view2D.zoomBoard(1 / 1.2);
  audio.playUiClick();
});
document.getElementById('btn-board-fit')?.addEventListener('click', () => {
  resizeGameCanvas();
  audio.playUiClick();
});

btnRollDice.addEventListener('click', handleRollDice);
btnDeclineOrChange.addEventListener('click', handleChangePortraitOrDecline);
btnDrawOrRearm.addEventListener('click', () => {
  if (
    state.subPhase === 'FIRST_MOVE' &&
    state.movementPlan === 'SPLIT' &&
    state.movesUsedThisTurn === 0 &&
    state.lastDiceRoll
  ) {
    handleChooseCombinedMovement();
    return;
  }
  handleDrawCard();
});
btnResetGame.addEventListener('click', resetSoloGame);
btnPlayAgain.addEventListener('click', () => {
  winModal.classList.add('hidden');
  resetSoloGame();
});

document.getElementById('btn-mode-solo')!.addEventListener('click', () => {
  enterGame();
  resetSoloGame();
});
document.getElementById('btn-mode-solo-quick')!.addEventListener('click', () => {
  enterGame();
  resetSoloGame();
});
document.getElementById('btn-mode-host')!.addEventListener('click', () => {
  lobbyJoinPanel.classList.remove('visible');
  beginMultiplayerHost();
});
document.getElementById('btn-add-player2')!.addEventListener('click', () => {
  if (!mpClient) return;
  const guest = new LocalMultiplayerClient(PLAYER_B_ID, 'Guest');
  const code = mpClient.getRoomCode();
  if (code) guest.joinRoom(code);
  addLog('Player 2 joined the lobby (simulated).', 'info');
});
document.getElementById('btn-start-multiplayer')!.addEventListener('click', () => {
  enterGame();
  startMultiplayerGame();
});
document.getElementById('btn-mode-join')!.addEventListener('click', () => {
  lobbyHostPanel.classList.remove('visible');
  lobbyJoinPanel.classList.add('visible');
});
document.getElementById('btn-confirm-join')!.addEventListener('click', () => {
  const code = roomCodeInput.value.trim().toUpperCase();
  if (code.length < 4) {
    showToast('Enter a valid room code.');
    return;
  }
  enterGame();
  beginMultiplayerJoin(code);
});

btnToggleAudio.addEventListener('click', () => {
  const muted = audio.toggleMute();
  btnToggleAudio.textContent = muted ? '🔇' : '🔊';
  audio.playUiClick();
});

function updateFullscreenButton(): void {
  const on = Boolean(document.fullscreenElement);
  btnFullscreen.textContent = on ? '⛶' : '⛶';
  btnFullscreen.title = on ? 'Exit fullscreen (Esc)' : 'Enter fullscreen';
}

btnFullscreen.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
    audio.playUiClick();
  } catch {
    showToast('Fullscreen not available in this browser.');
  }
});

document.addEventListener('fullscreenchange', () => {
  updateFullscreenButton();
  setTimeout(resizeGameCanvas, 100);
});

btnToggleRail.addEventListener('click', () => {
  const willOpen = document.body.classList.contains('rail-collapsed');
  setRailOpen(willOpen);
  audio.playUiClick();
  setTimeout(resizeGameCanvas, 220);
});

gameRailBackdrop.addEventListener('click', () => {
  setRailOpen(false);
  setTimeout(resizeGameCanvas, 220);
});

setRailOpen(false);

window.addEventListener('storage', () => mpClient?.syncFromStorage());

btnToggleView.addEventListener('click', () => {
  is3DMode = !is3DMode;
  canvas.style.display = is3DMode ? 'none' : 'block';
  canvas3d.style.display = is3DMode ? 'block' : 'none';
  btnToggleView.textContent = is3DMode ? '🗺️ 2D Board' : '🕶️ 3D Mansion';

  if (is3DMode && !view3D) {
    view3D = new GameBoard3D(canvas3d, handleBoardInteraction);
    view3D.updateState(state);
    window.addEventListener('resize', () => view3D?.handleResize());
  } else if (view3D) {
    view3D.updateState(state);
    view3D.handleResize();
  }
});

// Boot — 2D only for full mansion
canvas.style.display = 'block';
canvas3d.style.display = 'none';
is3DMode = false;
ensure2DBoardView();

gameEventLogs.innerHTML = '';
addLog('Welcome to 13 Dead End Drive. Choose a play mode to begin.', 'info');
syncViews();
updateUI();
lastTrapStates = Object.fromEntries(
  Object.entries(state.traps).map(([k, v]) => [k, v.state]),
) as Record<TrapId, 'READY' | 'SPENT'>;
