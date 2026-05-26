/**
 * DetectiveWidget.spec.tsx — detective navigation indicator
 */

// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { DetectiveWidget } from '../../client/components/DetectiveWidget.js';
import { makeGameState, makeDetective } from '../fixtures/gameState.fixtures.js';

describe('DetectiveWidget', () => {
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

  it('shows step/max and marks door at max', () => {
    const state = makeGameState({
      detectivePosition: makeDetective({ currentStep: 4, maxSteps: 10, isAtExit: false }),
    });

    act(() => {
      root.render(<DetectiveWidget gameState={state} />);
    });

    expect(container.textContent).toContain('Detective');
    expect(container.textContent).toContain('4 / 10');
  });

  it('shows DOOR when at exit', () => {
    const state = makeGameState({
      detectivePosition: makeDetective({ currentStep: 10, maxSteps: 10, isAtExit: true }),
    });

    act(() => {
      root.render(<DetectiveWidget gameState={state} />);
    });

    expect(container.textContent).toContain('At door');
  });
});

