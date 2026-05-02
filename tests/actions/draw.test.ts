import { describe, it, expect, beforeEach } from 'vitest';
import { resolveDrawAction } from '../../src/agents/turn/actions';
import { makeBase2PState, P1, withMushroom, getSpawnTile } from '../helpers/state';
import type { GameState } from '../../src/shared/types';

let base: GameState;
beforeEach(() => { base = makeBase2PState(); });

describe('resolveDrawAction — cost escalation', () => {
  it('first draw costs 1 sunlight', () => {
    const after = resolveDrawAction(base, P1, { count: 1 });
    const p1 = after.players.find(p => p.id === P1)!;
    expect(p1.resources.sunlight).toBe(4); // 5 - 1
  });

  it('second draw costs 2 sunlight (total 3 from start)', () => {
    const s1 = resolveDrawAction(base, P1, { count: 1 });
    const s2 = resolveDrawAction(s1, P1, { count: 1 });
    const p1 = s2.players.find(p => p.id === P1)!;
    expect(p1.resources.sunlight).toBe(2); // 5 - 1 - 2
  });

  it('third draw costs 3 sunlight', () => {
    // Need 1+2+3=6 sunlight total; start with 10
    const rich = {
      ...base,
      players: base.players.map(p => p.id === P1
        ? { ...p, resources: { ...p.resources, sunlight: 10 } }
        : p),
    };
    const s1 = resolveDrawAction(rich, P1, { count: 1 });
    const s2 = resolveDrawAction(s1, P1, { count: 1 });
    const s3 = resolveDrawAction(s2, P1, { count: 1 });
    const p1 = s3.players.find(p => p.id === P1)!;
    expect(p1.resources.sunlight).toBe(4); // 10 - 1 - 2 - 3
  });

  it('throws when not enough sunlight', () => {
    const broke = {
      ...base,
      players: base.players.map(p => p.id === P1
        ? { ...p, resources: { ...p.resources, sunlight: 0 } }
        : p),
    };
    expect(() => resolveDrawAction(broke, P1, { count: 1 })).toThrow('Not enough sunlight');
  });

  it('adds drawn card to hand', () => {
    const p1Before = base.players.find(p => p.id === P1)!;
    const after = resolveDrawAction(base, P1, { count: 1 });
    const p1After = after.players.find(p => p.id === P1)!;
    expect(p1After.hand.length).toBe(p1Before.hand.length + 1);
  });

  it('increments cardsDrawnThisTurn', () => {
    const after = resolveDrawAction(base, P1, { count: 1 });
    expect(after.turnState.cardsDrawnThisTurn).toBe(1);
  });

  it('throws when deck and discard are both empty', () => {
    const empty = { ...base, deck: [], discard: [] };
    expect(() => resolveDrawAction(empty, P1, { count: 1 })).toThrow('No cards left to draw');
  });

  it('reshuffles discard when deck is empty', () => {
    const discardOnly = { ...base, deck: [], discard: [1, 2, 3, 4, 5] };
    const after = resolveDrawAction(discardOnly, P1, { count: 1 });
    const p1 = after.players.find(p => p.id === P1)!;
    expect(p1.hand.length).toBe(base.players.find(p => p.id === P1)!.hand.length + 1);
  });
});

describe("Lion's Mane (id 9) — extra free card on first draw only", () => {
  it('draws +1 extra card on first draw of the turn', () => {
    const spawnTile = getSpawnTile(base, P1);
    const withLion = withMushroom(base, { cardId: 9, playerId: P1, tileId: spawnTile, turnsOnBoard: 0 });
    const p1Before = withLion.players.find(p => p.id === P1)!;
    const after = resolveDrawAction(withLion, P1, { count: 1 });
    const p1After = after.players.find(p => p.id === P1)!;
    // Lion's Mane: draw 1 extra for free on first draw → total 2 cards
    expect(p1After.hand.length).toBe(p1Before.hand.length + 2);
  });

  it('does NOT draw extra on second draw of the turn', () => {
    const spawnTile = getSpawnTile(base, P1);
    const withLion = withMushroom(base, { cardId: 9, playerId: P1, tileId: spawnTile, turnsOnBoard: 0 });
    const s1 = resolveDrawAction(withLion, P1, { count: 1 }); // first draw: +2
    const p1AfterFirst = s1.players.find(p => p.id === P1)!;
    const s2 = resolveDrawAction(s1, P1, { count: 1 }); // second draw: +1 only
    const p1AfterSecond = s2.players.find(p => p.id === P1)!;
    expect(p1AfterSecond.hand.length).toBe(p1AfterFirst.hand.length + 1);
  });

  it('still charges sunlight normally (1st draw = 1☀️)', () => {
    const spawnTile = getSpawnTile(base, P1);
    const withLion = withMushroom(base, { cardId: 9, playerId: P1, tileId: spawnTile, turnsOnBoard: 0 });
    const after = resolveDrawAction(withLion, P1, { count: 1 });
    const p1 = after.players.find(p => p.id === P1)!;
    expect(p1.resources.sunlight).toBe(4); // 5 - 1
  });
});

describe("Bear's Head Tooth (id 44) — first card of turn is free", () => {
  it('first draw costs 0 sunlight', () => {
    const spawnTile = getSpawnTile(base, P1);
    const withBear = withMushroom(base, { cardId: 44, playerId: P1, tileId: spawnTile, turnsOnBoard: 0 });
    const after = resolveDrawAction(withBear, P1, { count: 1 });
    const p1 = after.players.find(p => p.id === P1)!;
    expect(p1.resources.sunlight).toBe(5); // no cost
  });

  it('second draw costs normal 2 sunlight', () => {
    const spawnTile = getSpawnTile(base, P1);
    const withBear = withMushroom(base, { cardId: 44, playerId: P1, tileId: spawnTile, turnsOnBoard: 0 });
    const s1 = resolveDrawAction(withBear, P1, { count: 1 }); // free
    const s2 = resolveDrawAction(s1, P1, { count: 1 });       // costs 2
    const p1 = s2.players.find(p => p.id === P1)!;
    expect(p1.resources.sunlight).toBe(3); // 5 - 0 - 2
  });
});
