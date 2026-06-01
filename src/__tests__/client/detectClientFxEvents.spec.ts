// detectClientFxEvents.spec.ts — pure FX diff from GameState transitions

import { describe, it, expect } from 'vitest';
import { detectClientFxEvents } from '../../client/fx/detectClientFxEvents.js';
import {
  makeGameState,
  makeTrap,
  makeCharacter,
  PLAYER_A_ID,
  PLAYER_B_ID,
} from '../fixtures/gameState.fixtures.js';
import { INITIAL_TRAPS } from '../../engine/trapDefinition.js';

describe('detectClientFxEvents', () => {
  it('returns no events when prev is null', () => {
    const next = makeGameState();
    expect(detectClientFxEvents(null, next, PLAYER_A_ID)).toEqual([]);
  });

  it('emits TRAP_FIRED when a trap transitions READY to SPENT', () => {
    const prev = makeGameState({
      traps: { ...INITIAL_TRAPS, CHANDELIER: makeTrap({ trapId: 'CHANDELIER', state: 'READY' }) },
    });
    const next = makeGameState({
      traps: { ...INITIAL_TRAPS, CHANDELIER: makeTrap({ trapId: 'CHANDELIER', state: 'SPENT' }) },
      characters: {
        ...prev.characters,
        SMOTHERS: makeCharacter({
          id: 'SMOTHERS',
          status: 'ELIMINATED',
          eliminationCause: 'TRAP',
          position: 'CHAND_TRAP',
        }),
      },
    });

    const events = detectClientFxEvents(prev, next, PLAYER_A_ID);
    const trapEvent = events.find((e) => e.type === 'TRAP_FIRED');
    expect(trapEvent).toMatchObject({
      type: 'TRAP_FIRED',
      trapId: 'CHANDELIER',
      victimNames: ['Test Character'],
    });
  });

  it('does not emit TRAP_FIRED when trap state is unchanged', () => {
    const prev = makeGameState();
    const next = makeGameState({ turnNumber: 2 });
    const events = detectClientFxEvents(prev, next, PLAYER_A_ID);
    expect(events.some((e) => e.type === 'TRAP_FIRED')).toBe(false);
  });

  it('emits multiple TRAP_FIRED events when multiple traps spend in one sync', () => {
    const prev = makeGameState({
      traps: {
        ...INITIAL_TRAPS,
        CHANDELIER: makeTrap({ trapId: 'CHANDELIER', state: 'READY' }),
        FIREPLACE: makeTrap({ trapId: 'FIREPLACE', state: 'READY' }),
      },
    });
    const next = makeGameState({
      traps: {
        ...INITIAL_TRAPS,
        CHANDELIER: makeTrap({ trapId: 'CHANDELIER', state: 'SPENT' }),
        FIREPLACE: makeTrap({ trapId: 'FIREPLACE', state: 'SPENT' }),
      },
    });

    const trapEvents = detectClientFxEvents(prev, next, PLAYER_A_ID).filter(
      (e) => e.type === 'TRAP_FIRED',
    );
    expect(trapEvents).toHaveLength(2);
  });

  it('emits CHARACTER_ELIMINATED when a character goes ALIVE to ELIMINATED', () => {
    const prev = makeGameState({
      characters: {
        ...makeGameState().characters,
        DUSTY: makeCharacter({ id: 'DUSTY', status: 'ALIVE', eliminationCause: null }),
      },
    });
    const next = makeGameState({
      characters: {
        ...prev.characters,
        DUSTY: makeCharacter({
          id: 'DUSTY',
          status: 'ELIMINATED',
          eliminationCause: 'TRAP',
        }),
      },
    });

    const elim = detectClientFxEvents(prev, next, PLAYER_A_ID).find(
      (e) => e.type === 'CHARACTER_ELIMINATED',
    );
    expect(elim).toMatchObject({
      type: 'CHARACTER_ELIMINATED',
      characterId: 'DUSTY',
      cause: 'TRAP',
    });
  });

  it('emits one CHARACTER_ELIMINATED per victim on detective mass elimination', () => {
    const base = makeGameState();
    const prev = makeGameState({
      characters: {
        ...base.characters,
        SMOTHERS: makeCharacter({ id: 'SMOTHERS', status: 'ALIVE' }),
        DUSTY: makeCharacter({ id: 'DUSTY', status: 'ALIVE', controlledBy: PLAYER_B_ID }),
        CHARITY: makeCharacter({ id: 'CHARITY', status: 'ALIVE', isPortraitHeir: true }),
      },
    });
    const next = makeGameState({
      characters: {
        ...prev.characters,
        SMOTHERS: makeCharacter({ id: 'SMOTHERS', status: 'ELIMINATED', eliminationCause: 'DETECTIVE' }),
        DUSTY: makeCharacter({ id: 'DUSTY', status: 'ELIMINATED', eliminationCause: 'DETECTIVE' }),
        CHARITY: makeCharacter({
          id: 'CHARITY',
          status: 'ELIMINATED',
          eliminationCause: 'DETECTIVE',
          isPortraitHeir: true,
        }),
      },
    });

    const elimEvents = detectClientFxEvents(prev, next, PLAYER_A_ID).filter(
      (e) => e.type === 'CHARACTER_ELIMINATED',
    );
    expect(elimEvents).toHaveLength(3);
    expect(elimEvents.every((e) => e.cause === 'DETECTIVE')).toBe(true);
  });

  it('emits GAME_WON when phase becomes GAME_OVER with a winner', () => {
    const prev = makeGameState({ phase: 'IN_PROGRESS', winner: null });
    const next = makeGameState({
      phase: 'GAME_OVER',
      winner: PLAYER_A_ID,
      winCondition: 'HEIR_ESCAPED',
    });

    const won = detectClientFxEvents(prev, next, PLAYER_A_ID).find((e) => e.type === 'GAME_WON');
    expect(won).toMatchObject({
      type: 'GAME_WON',
      winnerId: PLAYER_A_ID,
      winCondition: 'HEIR_ESCAPED',
      isLocalWinner: true,
    });
  });

  it('sets isLocalWinner false when winner is not local player', () => {
    const prev = makeGameState({ phase: 'IN_PROGRESS', winner: null });
    const next = makeGameState({
      phase: 'GAME_OVER',
      winner: PLAYER_B_ID,
      winCondition: 'LAST_ALIVE',
    });

    const won = detectClientFxEvents(prev, next, PLAYER_A_ID).find((e) => e.type === 'GAME_WON');
    expect(won?.isLocalWinner).toBe(false);
  });

  it('does not emit GAME_WON when already GAME_OVER in prev', () => {
    const prev = makeGameState({
      phase: 'GAME_OVER',
      winner: PLAYER_A_ID,
      winCondition: 'LAST_ALIVE',
    });
    const next = makeGameState({
      phase: 'GAME_OVER',
      winner: PLAYER_A_ID,
      turnNumber: 99,
    });

    expect(detectClientFxEvents(prev, next, PLAYER_A_ID).some((e) => e.type === 'GAME_WON')).toBe(
      false,
    );
  });
});
