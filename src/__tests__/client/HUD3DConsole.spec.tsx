/**
 * HUD3DConsole.spec.tsx — HUD3D right console collapse behavior
 */

// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { HUD3D } from '../../client/components/HUD3D.js';
import { useGameStore } from '../../client/store/useGameStore.js';
import { useUiStore } from '../../client/store/useUiStore.js';
import { makeGameState, makePlayer, PLAYER_A_ID, PLAYER_B_ID } from '../fixtures/gameState.fixtures.js';

describe('HUD3D console collapse', () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    // Keep HUD actions stable in tests.
    useUiStore.setState({ eventLog: [], is3DMode: true });
    useGameStore.setState({
      resetGame: () => {},
      drawTrapCard: () => {},
      declineTrap: () => {},
      playTrapCard: () => {},
      localPlayerId: PLAYER_A_ID,
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('collapses and expands the right-side console', () => {
    const state = makeGameState({
      turnOrder: [PLAYER_A_ID, PLAYER_B_ID],
      players: {
        [PLAYER_A_ID]: makePlayer(PLAYER_A_ID, ['SMOTHERS'], [], []),
        [PLAYER_B_ID]: makePlayer(PLAYER_B_ID, ['DUSTY'], [], []),
      },
    });

    act(() => {
      root.render(<HUD3D gameState={state} />);
    });

    expect(container.textContent).toContain('Mansion Control');

    const collapse = container.querySelector('button[aria-label="Collapse console"]') as HTMLButtonElement | null;
    expect(collapse).not.toBeNull();

    act(() => {
      collapse?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).not.toContain('Mansion Control');
    expect(container.querySelector('button[aria-label="Expand console"]')).not.toBeNull();

    const expand = container.querySelector('button[aria-label="Expand console"]') as HTMLButtonElement | null;
    expect(expand).not.toBeNull();

    act(() => {
      expand?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Mansion Control');
  });
});

