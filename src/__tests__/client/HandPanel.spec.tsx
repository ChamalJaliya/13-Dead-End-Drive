/**
 * HandPanel.spec.tsx — bottom horizontal hand overlay
 */

// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { HandPanel } from '../../client/components/HandPanel.js';
import { useGameStore } from '../../client/store/useGameStore.js';
import {
  makeGameState,
  makePlayer,
  PLAYER_A_ID,
  PLAYER_B_ID,
  CARD_CHANDELIER,
  CARD_WILD,
} from '../fixtures/gameState.fixtures.js';

describe('HandPanel', () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    useGameStore.setState({
      localPlayerId: PLAYER_A_ID,
      playMode: 'local',
      playTrapCard: () => {},
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('renders retained trap cards in a horizontal strip', () => {
    const state = makeGameState({
      turnOrder: [PLAYER_A_ID, PLAYER_B_ID],
      players: {
        [PLAYER_A_ID]: makePlayer(PLAYER_A_ID, ['SMOTHERS'], [CARD_CHANDELIER, CARD_WILD]),
        [PLAYER_B_ID]: makePlayer(PLAYER_B_ID, ['DUSTY'], []),
      },
    });

    act(() => {
      root.render(<HandPanel gameState={state} />);
    });

    expect(container.textContent).toContain('Your hand');
    expect(container.textContent).toContain('2');
    expect(container.textContent).toContain(CARD_CHANDELIER.label);
    expect(container.textContent).toContain(CARD_WILD.label);
  });

  it('collapses to a compact strip and expands again', () => {
    const state = makeGameState({
      players: {
        [PLAYER_A_ID]: makePlayer(PLAYER_A_ID, ['SMOTHERS'], [CARD_CHANDELIER]),
        [PLAYER_B_ID]: makePlayer(PLAYER_B_ID, ['DUSTY'], []),
      },
    });

    act(() => {
      root.render(<HandPanel gameState={state} />);
    });

    const collapse = container.querySelector('button[aria-label="Collapse hand panel"]') as HTMLButtonElement | null;
    expect(collapse).not.toBeNull();

    act(() => {
      collapse?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.querySelector('[data-testid="hand-panel-expanded"]')).toBeNull();

    const expand = container.querySelector('button[aria-label="Expand hand panel"]') as HTMLButtonElement | null;
    act(() => {
      expand?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.querySelector('[data-testid="hand-panel-expanded"]')).not.toBeNull();
  });
});
