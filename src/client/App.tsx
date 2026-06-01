/**
 * App.tsx
 * Root React application. Routes between lobby, game, and game-over overlays.
 */

import { useGameStore } from './store/useGameStore.js';
import { useUiStore } from './store/useUiStore.js';
import { Scene3D } from './components/Scene3D.js';
import { Scene2D } from './components/Scene2D.js';
import { HUD3D } from './components/HUD3D.js';
import { LobbyScreen } from './components/LobbyScreen.js';
import { GameOverScreen } from './components/GameOverScreen.js';
import { GameFxController } from './fx/GameFxController.js';

export function App() {
  const activeOverlay = useUiStore((s) => s.activeOverlay);
  const gameState     = useGameStore((s) => s.gameState);
  const is3DMode      = useUiStore((s) => s.is3DMode);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[hsl(220,20%,5%)] bg-gothic-radial">
      {/* ── 2D/3D Scene (always mounted when game is active, hidden in lobby) ── */}
      {gameState && activeOverlay !== 'lobby' && (
        <div className="absolute inset-0">
          {is3DMode ? (
            <Scene3D gameState={gameState} />
          ) : (
            <Scene2D gameState={gameState} />
          )}
        </div>
      )}

      {/* ── HUD overlay (shown during game) ── */}
      {gameState && activeOverlay === 'game' && (
        <HUD3D gameState={gameState} />
      )}

      {/* ── Lobby screen ── */}
      {activeOverlay === 'lobby' && <LobbyScreen />}

      {/* ── Global FX (audio, trap overlay, confetti) ── */}
      <GameFxController />

      {/* ── Game Over screen ── */}
      {activeOverlay === 'game-over' && gameState && (
        <GameOverScreen gameState={gameState} />
      )}
    </div>
  );
}
