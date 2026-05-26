/**
 * DeckWidget.spec.tsx — deck UI indicator
 */

// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { DeckWidget } from '../../client/components/DeckWidget.js';
import { makeGameState } from '../fixtures/gameState.fixtures.js';

describe('DeckWidget', () => {
  let root: Root;
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('shows deck and discard counts', () => {
    const state = makeGameState({
      deck: [
        ...makeGameState().deck.slice(0, 3),
      ],
      discardPile: [
        ...makeGameState().discardPile,
        ...makeGameState().deck.slice(0, 2),
      ],
    });

    act(() => {
      root.render(<DeckWidget gameState={state} />);
    });

    expect(container.textContent).toContain('Deck');
    expect(container.textContent).toContain('3');
    expect(container.textContent).toContain('Discard');
    expect(container.textContent).toContain('2');
  });
});

