/**
 * GameOverScreen.tsx
 * Victory / elimination screen overlay.
 * Renders victory outcomes, turns played, and showcases the high-fidelity gothic portrait
 * of the final heir.
 */

import { useGameStore } from '../store/useGameStore.js';
import type { GameState } from '../../types/game-state.js';
import { AUNT_AGATHA_DISPLAY_NAME, CHARACTER_DATA } from '../../engine/gameInitializer.js';
import { AUNT_AGATHA_PORTRAIT, CHARACTER_PORTRAITS } from '../characterAssets.js';

interface GameOverScreenProps {
  gameState: GameState;
}

const WIN_CONDITION_LABEL: Record<string, string> = {
  HEIR_ESCAPED:       'The heir escaped through the front door!',
  LAST_ALIVE:         'All other guests were eliminated.',
  DETECTIVE_ARRIVED:  'The detective arrived — the heir wins!',
};

const WIN_CONDITION_ICON: Record<string, string> = {
  HEIR_ESCAPED:      '🚪',
  LAST_ALIVE:        '💀',
  DETECTIVE_ARRIVED: '🕵️',
};

export function GameOverScreen({ gameState }: GameOverScreenProps) {
  const { resetGame, localPlayerId } = useGameStore();

  const winner    = gameState.winner ? gameState.players[gameState.winner] : null;
  const isWinner  = gameState.winner === localPlayerId;
  const condition = gameState.winCondition ?? 'LAST_ALIVE';
  const icon      = WIN_CONDITION_ICON[condition] ?? '🏆';

  // Query final heir portrait details
  const currentHeirId = gameState.activePortrait?.currentHeirId;
  const isAgatha = currentHeirId === 'AUNT_AGATHA';
  const heirData = !isAgatha && currentHeirId ? CHARACTER_DATA[currentHeirId] : null;
  const heirName = isAgatha ? AUNT_AGATHA_DISPLAY_NAME : (heirData?.displayName ?? 'No Heir');
  const heirColor = isAgatha ? '#b45309' : (heirData?.pawnColor ?? '#b45309');
  const heirPortraitUrl = isAgatha ? AUNT_AGATHA_PORTRAIT : (currentHeirId ? CHARACTER_PORTRAITS[currentHeirId] : '');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(5,6,8,0.88)', backdropFilter: 'blur(8px)' }}
    >
      <div className="glass rounded-3xl p-8 max-w-sm w-full mx-4 text-center animate-trap-in flex flex-col gap-5"
        style={{
          border: `1px solid ${isWinner ? 'hsla(45,95%,55%,0.5)' : 'hsla(0,85%,60%,0.4)'}`,
          boxShadow: isWinner
            ? '0 0 45px hsla(45,95%,50%,0.25), 0 0 125px hsla(45,95%,50%,0.08)'
            : '0 0 45px hsla(0,85%,60%,0.2)',
        }}
      >
        {/* Icon & Title */}
        <div>
          <div className="text-5xl mb-2 animate-float">{icon}</div>
          <h2 className={`font-display text-2xl font-black tracking-widest mb-1 ${isWinner ? 'text-gradient-amber' : 'text-trap-red'}`}>
            {isWinner ? 'VICTORY!' : 'GAME OVER'}
          </h2>
          <p className="text-ghost-500 text-xs">
            {isWinner ? "You've triumphed over the dead end." : "The mansion claims another victim."}
          </p>
        </div>

        {/* Featured final heir portrait illustration */}
        {heirPortraitUrl && (
          <div className="flex justify-center my-0.5 animate-trap-in">
            <div className="relative w-32 h-44 rounded-xl border-2 bg-slate-950/80 shadow-2xl overflow-hidden"
                 style={{ borderColor: heirColor, boxShadow: `0 0 25px ${heirColor}55` }}
            >
              <img 
                src={heirPortraitUrl} 
                alt={heirName} 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 inset-x-0 bg-slate-950/90 py-1 px-2 text-center text-[9px] font-bold tracking-wider uppercase border-t border-amber-500/10 font-sans"
                   style={{ color: heirColor }}
              >
                {heirName}
              </div>
            </div>
          </div>
        )}

        {/* Winner panel */}
        {winner && (
          <div className="bg-mansion-800/60 rounded-2xl px-5 py-3">
            <div className="text-ghost-500 text-[10px] mb-0.5 font-display tracking-wider">WINNER</div>
            <div className="text-ghost-100 text-lg font-bold">{winner.displayName}</div>
            <div className="text-amber-400 text-[10px] mt-0.5">{WIN_CONDITION_LABEL[condition]}</div>
          </div>
        )}

        {/* Secret reveal (2-player) */}
        {gameState.secretCardsRevealed && (
          <div className="border border-amber-400/20 rounded-xl px-4 py-2.5 text-left">
            <div className="text-amber-400 text-[10px] font-display tracking-wider mb-1.5">🔓 SECRET CARDS REVEALED</div>
            {Object.values(gameState.players).map((p) =>
              p.secretCharacterIds.length > 0 ? (
                <div key={p.playerId} className="text-[11px] text-ghost-300 mb-0.5">
                  <strong className="text-ghost-100">{p.displayName}</strong>: {' '}
                  {p.secretCharacterIds.map((cid) => {
                    const data = CHARACTER_DATA[cid];
                    return data ? data.displayName : cid;
                  }).join(', ')}
                </div>
              ) : null
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-mansion-800/60 rounded-xl px-4 py-2.5 text-center">
            <div className="text-ghost-500 text-[10px]">Turns played</div>
            <div className="text-ghost-100 font-bold text-base">{gameState.turnNumber}</div>
          </div>
          <div className="bg-mansion-800/60 rounded-xl px-4 py-2.5 text-center">
            <div className="text-ghost-500 text-[10px]">Survivors</div>
            <div className="text-ghost-100 font-bold text-base">
              {Object.values(gameState.characters).filter((c) => c.status === 'ALIVE').length}
              <span className="text-[10px] text-ghost-500"> / 12</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            id="game-over-btn-play-again"
            onClick={resetGame}
            className="
              flex-1 py-2.5 rounded-xl font-display tracking-widest text-xs font-bold
              border border-amber-400/70 bg-amber-400/10 text-amber-400
              hover:bg-amber-400/20 glow-amber active:scale-95 transition-all cursor-pointer
            "
          >
            🎲 PLAY AGAIN
          </button>
        </div>
      </div>
    </div>
  );
}
