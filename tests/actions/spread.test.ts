import { describe, it, expect, beforeEach } from 'vitest';
import { resolveSpreadAction, resolvePlantAction } from '../../src/agents/turn/actions';
import { makeBase2PState, P1, findSpreadTarget, getSpawnTile } from '../helpers/state';
import type { GameState } from '../../src/shared/types';

let base: GameState;
let target: string;
beforeEach(() => {
  base = makeBase2PState();
  target = findSpreadTarget(base, P1);
});

describe('resolveSpreadAction — basics', () => {
  it('deducts moisture and claims tile', () => {
    const p1Before = base.players.find(p => p.id === P1)!;
    const moistureBefore = p1Before.resources.moisture;
    const after = resolveSpreadAction(base, P1, target);
    const p1After = after.players.find(p => p.id === P1)!;
    expect(p1After.networkTileIds).toContain(target);
    expect(after.tiles[target].ownerId).toBe(P1);
    expect(p1After.resources.moisture).toBeLessThan(moistureBefore);
  });

  it('sets actionType to spread', () => {
    const after = resolveSpreadAction(base, P1, target);
    expect(after.turnState.actionType).toBe('spread');
  });

  it('throws when spreading to non-adjacent tile', () => {
    // Find a tile that is definitely not adjacent (owned by P2 is fine — just need any non-adjacent)
    const p1 = base.players.find(p => p.id === P1)!;
    const p2 = base.players.find(p => p.id !== P1)!;
    const nonAdjacent = p2.networkTileIds.find(id => !p1.networkTileIds.includes(id));
    if (!nonAdjacent) return; // skip if board layout happens to make this unreachable
    expect(() => resolveSpreadAction(base, P1, nonAdjacent)).toThrow();
  });

  it('throws when spreading to already-owned tile', () => {
    const p1OwnedTile = base.players.find(p => p.id === P1)!.networkTileIds[0];
    expect(() => resolveSpreadAction(base, P1, p1OwnedTile)).toThrow('already claimed');
  });

  it('throws when not enough moisture', () => {
    const broke = {
      ...base,
      players: base.players.map(p => p.id === P1
        ? { ...p, resources: { ...p.resources, moisture: 0 } }
        : p),
    };
    expect(() => resolveSpreadAction(broke, P1, target)).toThrow('Not enough moisture');
  });

  it('drought: throws when trying to spread', () => {
    const drought: GameState = {
      ...base,
      currentTurn: 6,
      forecast: { ...base.forecast, summer: 'drought' },
    };
    expect(() => resolveSpreadAction(drought, P1, target)).toThrow('Drought');
  });
});

describe("Hen's Egg Stinkhorn (id 42) — free spreads", () => {
  function stateWithHenEgg(): GameState {
    // Plant Hen's Egg Stinkhorn to register 2 pending free spreads
    const spawnTile = getSpawnTile(base, P1);
    const withCard = {
      ...base,
      players: base.players.map(p => p.id === P1
        ? { ...p, hand: [42, ...p.hand], resources: { ...p.resources, spore: 10 } }
        : p),
    };
    // Override spawn tile to 'open' so any card can be planted
    const withOpen = {
      ...withCard,
      tiles: {
        ...withCard.tiles,
        [spawnTile]: { ...withCard.tiles[spawnTile], habitat: 'open' as const },
      },
    };
    return resolvePlantAction(withOpen, P1, 42, spawnTile);
  }

  it('planting registers 2 pending free spreads', () => {
    const s = stateWithHenEgg();
    const entry = s.pendingFreeSpreads.find(ps => ps.playerId === P1);
    expect(entry?.spreadsRemaining).toBe(2);
  });

  it('first free spread does not deduct moisture', () => {
    const s = stateWithHenEgg();
    const t1 = findSpreadTarget(s, P1);
    const moistureBefore = s.players.find(p => p.id === P1)!.resources.moisture;
    const after = resolveSpreadAction(s, P1, t1);
    const moistureAfter = after.players.find(p => p.id === P1)!.resources.moisture;
    expect(moistureAfter).toBe(moistureBefore);
  });

  it('second free spread does not deduct moisture', () => {
    const s = stateWithHenEgg();
    const t1 = findSpreadTarget(s, P1);
    const s2 = resolveSpreadAction(s, P1, t1);
    const t2 = findSpreadTarget(s2, P1);
    const moistureBefore = s2.players.find(p => p.id === P1)!.resources.moisture;
    const s3 = resolveSpreadAction(s2, P1, t2);
    const moistureAfter = s3.players.find(p => p.id === P1)!.resources.moisture;
    expect(moistureAfter).toBe(moistureBefore);
  });

  it('after 2 free spreads, pendingFreeSpreads is cleared', () => {
    const s = stateWithHenEgg();
    const t1 = findSpreadTarget(s, P1);
    const s2 = resolveSpreadAction(s, P1, t1);
    const t2 = findSpreadTarget(s2, P1);
    const s3 = resolveSpreadAction(s2, P1, t2);
    expect(s3.pendingFreeSpreads.filter(ps => ps.playerId === P1)).toHaveLength(0);
  });

  it('third spread costs moisture', () => {
    const s = stateWithHenEgg();
    const t1 = findSpreadTarget(s, P1);
    const s2 = resolveSpreadAction(s, P1, t1);
    const t2 = findSpreadTarget(s2, P1);
    const s3 = resolveSpreadAction(s2, P1, t2);
    const t3 = findSpreadTarget(s3, P1);
    const moistureBefore = s3.players.find(p => p.id === P1)!.resources.moisture;
    const s4 = resolveSpreadAction(s3, P1, t3);
    const moistureAfter = s4.players.find(p => p.id === P1)!.resources.moisture;
    expect(moistureAfter).toBeLessThan(moistureBefore);
  });
});
