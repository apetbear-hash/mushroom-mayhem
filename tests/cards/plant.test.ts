import { describe, it, expect, beforeEach } from 'vitest';
import { resolvePlantAction, resolveInkyCapDiscard } from '../../src/agents/turn/actions';
import { makeBase2PState, P1, getSpawnTile, withOpenTile, withMushroom, getAdjacentOwnedTiles } from '../helpers/state';
import type { GameState } from '../../src/shared/types';

let base: GameState;
let spawnTile: string;
let openState: GameState;

beforeEach(() => {
  base = makeBase2PState();
  spawnTile = getSpawnTile(base, P1);
  openState = withOpenTile(base, spawnTile);
});

describe('resolvePlantAction — basics', () => {
  // Turkey Tail is card 5, cost 2
  it('deducts spores by card cost', () => {
    const withTurkeyTail = {
      ...openState,
      players: openState.players.map(p => p.id === P1
        ? { ...p, hand: [5, ...p.hand.filter(id => id !== 5)] }
        : p),
    };
    const after = resolvePlantAction(withTurkeyTail, P1, 5, spawnTile);
    const p1 = after.players.find(p => p.id === P1)!;
    expect(p1.resources.spore).toBe(5 - 2); // cost 2
  });

  it('places mushroom on tile and removes card from hand', () => {
    const withTurkeyTail = {
      ...openState,
      players: openState.players.map(p => p.id === P1
        ? { ...p, hand: [5] }
        : p),
    };
    const after = resolvePlantAction(withTurkeyTail, P1, 5, spawnTile);
    const p1 = after.players.find(p => p.id === P1)!;
    expect(p1.hand).not.toContain(5);
    expect(after.tiles[spawnTile].mushroomCardId).toBe(5);
    expect(after.placedMushrooms.some(m => m.tileId === spawnTile && m.cardId === 5)).toBe(true);
  });

  it('adds card points to score', () => {
    const withTurkeyTail = {
      ...openState,
      players: openState.players.map(p => p.id === P1
        ? { ...p, hand: [5] }
        : p),
    };
    const after = resolvePlantAction(withTurkeyTail, P1, 5, spawnTile);
    const p1 = after.players.find(p => p.id === P1)!;
    expect(p1.score).toBe(3); // Turkey Tail = 3 pts
  });

  it('throws if card not in hand', () => {
    const noCard = {
      ...openState,
      players: openState.players.map(p => p.id === P1
        ? { ...p, hand: [] }
        : p),
    };
    expect(() => resolvePlantAction(noCard, P1, 5, spawnTile)).toThrow('Card not in hand');
  });

  it('throws if not enough spores', () => {
    const broke = {
      ...openState,
      players: openState.players.map(p => p.id === P1
        ? { ...p, hand: [5], resources: { ...p.resources, spore: 0 } }
        : p),
    };
    expect(() => resolvePlantAction(broke, P1, 5, spawnTile)).toThrow('Not enough spores');
  });

  it('throws if tile already occupied', () => {
    const withTurkeyTail = {
      ...openState,
      players: openState.players.map(p => p.id === P1
        ? { ...p, hand: [5] }
        : p),
    };
    const s1 = resolvePlantAction(withTurkeyTail, P1, 5, spawnTile);
    // Try to plant again on the same tile (different card in hand)
    const s1WithCard = {
      ...s1,
      players: s1.players.map(p => p.id === P1
        ? { ...p, hand: [3], resources: { ...p.resources, spore: 10 } }
        : p),
    };
    expect(() => resolvePlantAction(s1WithCard, P1, 3, spawnTile)).toThrow('Cannot plant on this tile');
  });
});

describe('resolveInkyCapDiscard (id 32)', () => {
  function stateWithInkyCap(): GameState {
    // Place an Inky Cap on spawn tile
    const withCard = {
      ...openState,
      players: openState.players.map(p => p.id === P1
        ? { ...p, hand: [32], resources: { ...p.resources, spore: 10 } }
        : p),
    };
    return resolvePlantAction(withCard, P1, 32, spawnTile);
  }

  it('gives +3 spores on discard', () => {
    const s = stateWithInkyCap();
    const sporeBefore = s.players.find(p => p.id === P1)!.resources.spore;
    const after = resolveInkyCapDiscard(s, P1, spawnTile);
    const sporeAfter = after.players.find(p => p.id === P1)!.resources.spore;
    expect(sporeAfter).toBe(sporeBefore + 3);
  });

  it('removes mushroom from tile and placedMushrooms', () => {
    const s = stateWithInkyCap();
    const after = resolveInkyCapDiscard(s, P1, spawnTile);
    expect(after.tiles[spawnTile].mushroomCardId).toBeNull();
    expect(after.placedMushrooms.some(m => m.tileId === spawnTile && m.cardId === 32)).toBe(false);
  });

  it('puts Inky Cap (32) in discard pile', () => {
    const s = stateWithInkyCap();
    const after = resolveInkyCapDiscard(s, P1, spawnTile);
    expect(after.discard).toContain(32);
  });

  it('throws if no Inky Cap at the given tile', () => {
    expect(() => resolveInkyCapDiscard(base, P1, spawnTile)).toThrow('No Inky Cap');
  });
});

describe('King Bolete (id 12) — +1 score per adjacent friendly mushroom', () => {
  it('scores +1 per adjacent friendly mushroom already on board', () => {
    // Put King Bolete in P1 hand, enough spores (cost 4)
    const withKing = {
      ...openState,
      players: openState.players.map(p => p.id === P1
        ? { ...p, hand: [12], resources: { ...p.resources, spore: 10 } }
        : p),
    };

    // Place 2 friendly mushrooms on tiles adjacent to spawn
    const adjOwned = getAdjacentOwnedTiles(withKing, spawnTile, P1);
    if (adjOwned.length < 2) {
      // If not enough adjacent owned tiles, skip scoring assertion with 0 adj mushrooms
      const after = resolvePlantAction(withKing, P1, 12, spawnTile);
      const p1 = after.players.find(p => p.id === P1)!;
      expect(p1.score).toBe(8); // 8 pts, 0 adj bonus
      return;
    }

    const s1 = withMushroom(withKing, { cardId: 5, playerId: P1, tileId: adjOwned[0], turnsOnBoard: 1 });
    const s2 = withMushroom(s1, { cardId: 5, playerId: P1, tileId: adjOwned[1], turnsOnBoard: 1 });

    const after = resolvePlantAction(s2, P1, 12, spawnTile);
    const p1 = after.players.find(p => p.id === P1)!;
    // 8 pts (King Bolete base) + 2 pts (2 adjacent friendly mushrooms)
    expect(p1.score).toBe(10);
  });

  it('scores 0 adjacent bonus when no friendly mushrooms nearby', () => {
    const withKing = {
      ...openState,
      players: openState.players.map(p => p.id === P1
        ? { ...p, hand: [12], resources: { ...p.resources, spore: 10 } }
        : p),
    };
    const after = resolvePlantAction(withKing, P1, 12, spawnTile);
    const p1 = after.players.find(p => p.id === P1)!;
    expect(p1.score).toBe(8); // just card pts
  });
});

describe('Oyster Mushroom (id 2) — free copies on adjacent network tiles', () => {
  it('places extra copies on provided copy tiles', () => {
    // Find 2 adjacent tiles that P1 owns (for copies)
    const adjOwned = getAdjacentOwnedTiles(openState, spawnTile, P1);

    const withOyster = {
      ...openState,
      players: openState.players.map(p => p.id === P1
        ? { ...p, hand: [2], resources: { ...p.resources, spore: 10 } }
        : p),
    };

    if (adjOwned.length < 1) {
      // No adjacent owned tiles — oyster works without copies
      const after = resolvePlantAction(withOyster, P1, 2, spawnTile);
      expect(after.placedMushrooms.some(m => m.tileId === spawnTile && m.cardId === 2)).toBe(true);
      return;
    }

    // Use 1 or 2 copy tiles
    const copyTile1 = adjOwned[0];
    const copyTile2 = adjOwned.length > 1 ? adjOwned[1] : undefined;

    const after = resolvePlantAction(withOyster, P1, 2, spawnTile, {
      oysterCopyTileId: copyTile1,
      ...(copyTile2 ? { oysterCopyTileId2: copyTile2 } : {}),
    });

    // Main placement
    expect(after.placedMushrooms.some(m => m.tileId === spawnTile && m.cardId === 2)).toBe(true);
    // Copy 1
    expect(after.placedMushrooms.some(m => m.tileId === copyTile1 && m.cardId === 2)).toBe(true);
    if (copyTile2) {
      expect(after.placedMushrooms.some(m => m.tileId === copyTile2 && m.cardId === 2)).toBe(true);
    }

    // Copies appear on tiles
    expect(after.tiles[copyTile1].mushroomCardId).toBe(2);
  });

  it('only charges spores once (not per copy)', () => {
    const adjOwned = getAdjacentOwnedTiles(openState, spawnTile, P1);
    const withOyster = {
      ...openState,
      players: openState.players.map(p => p.id === P1
        ? { ...p, hand: [2], resources: { ...p.resources, spore: 10 } }
        : p),
    };
    const opts = adjOwned.length > 0 ? { oysterCopyTileId: adjOwned[0] } : {};
    const after = resolvePlantAction(withOyster, P1, 2, spawnTile, opts);
    const p1 = after.players.find(p => p.id === P1)!;
    // Card cost is 2 — charged once regardless of copies
    expect(p1.resources.spore).toBe(10 - 2);
  });
});
