import { describe, it, expect, beforeEach } from 'vitest';
import { resolveRestAction } from '../../src/agents/turn/actions';
import { makeBase2PState, P1 } from '../helpers/state';
import type { GameState } from '../../src/shared/types';

let base: GameState;
beforeEach(() => { base = makeBase2PState(); });

describe('resolveRestAction', () => {
  it('gives +1 spore, +1 moisture, +1 sunlight', () => {
    const after = resolveRestAction(base, P1);
    const p1 = after.players.find(p => p.id === P1)!;
    expect(p1.resources.spore).toBe(6);
    expect(p1.resources.moisture).toBe(6);
    expect(p1.resources.sunlight).toBe(6);
  });

  it('sets restUsed to true', () => {
    const after = resolveRestAction(base, P1);
    expect(after.turnState.restUsed).toBe(true);
  });

  it('sets actionType to rest', () => {
    const after = resolveRestAction(base, P1);
    expect(after.turnState.actionType).toBe('rest');
  });

  it('throws if rest already used this turn', () => {
    const s1 = resolveRestAction(base, P1);
    expect(() => resolveRestAction(s1, P1)).toThrow('Rest can only be used once');
  });

  it('throws if an action was already taken this turn', () => {
    const withAction = {
      ...base,
      turnState: { ...base.turnState, actionType: 'draw' as const },
    };
    expect(() => resolveRestAction(withAction, P1)).toThrow('Cannot mix action types');
  });

  it('drought: moisture gain is 0, other resources still gain', () => {
    const droughtState: GameState = {
      ...base,
      currentTurn: 6, // summer
      forecast: { ...base.forecast, summer: 'drought' },
    };
    const after = resolveRestAction(droughtState, P1);
    const p1 = after.players.find(p => p.id === P1)!;
    expect(p1.resources.spore).toBe(6);    // +1
    expect(p1.resources.moisture).toBe(5); // no gain
    expect(p1.resources.sunlight).toBe(6); // +1
  });
});
