import type { GameState, PlacedMushroom } from '../../src/shared/types';
import { createInitialGameState } from '../../src/agents/simulation/gameInit';
import { getAdjacentTileIds } from '../../src/agents/board/boardGenerator';
import { canSpreadTo } from '../../src/agents/turn/spreadCost';

export const P1 = 'player_0';
export const P2 = 'player_1';

// Deck cards with no special board-presence effects
const PLAIN_DECK = [1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

export function makeBase2PState(): GameState {
  const { state } = createInitialGameState([
    { name: 'P1', color: '#5c9ee0', portrait: 'fox' },
    { name: 'P2', color: '#e05c5c', portrait: 'badger' },
  ]);
  return {
    ...state,
    currentTurn: 1,
    currentPlayerIndex: 0,
    deck: [...PLAIN_DECK],
    discard: [],
    forecast: {
      spring: 'thaw',
      summer: 'mild_summer',
      autumn: 'decay_bloom',
      winter: 'mild_winter',
    },
    players: state.players.map((p, i) => ({
      ...p,
      // P1: Turkey Tail(5, cost2), Shiitake(3, cost3), Inky Cap(32, cost1)
      hand: i === 0 ? [5, 3, 32] : [6, 7, 8],
      resources: { spore: 5, moisture: 5, sunlight: 5 },
      score: 0,
    })),
    turnState: { actionType: null, restUsed: false, cardsDrawnThisTurn: 0 },
    placedMushrooms: [],
    pendingFreeSpreads: [],
    pigskinBlocks: [],
    blightTileIds: [],
    spreadCostOverrides: {},
  };
}

// Returns a copy of state where the given tile has habitat 'open' (any card can plant there)
export function withOpenTile(state: GameState, tileId: string): GameState {
  return {
    ...state,
    tiles: {
      ...state.tiles,
      [tileId]: { ...state.tiles[tileId], habitat: 'open' },
    },
  };
}

// Returns player's spawn tile ID
export function getSpawnTile(state: GameState, playerId: string): string {
  const player = state.players.find(p => p.id === playerId)!;
  return state.tiles[player.networkTileIds[0]].id;
}

// Returns the first adjacent tile that can be spread to by playerId
export function findSpreadTarget(state: GameState, playerId: string): string {
  for (const tile of Object.values(state.tiles)) {
    if (tile.ownerId) continue;
    if (tile.isBlight) continue;
    if (canSpreadTo(tile.id, playerId, state).allowed) return tile.id;
  }
  throw new Error('No valid spread target found — board may be fully claimed');
}

// Returns tile IDs adjacent to tileId that are owned by playerId (for placing test mushrooms)
export function getAdjacentOwnedTiles(state: GameState, tileId: string, playerId: string): string[] {
  const player = state.players.find(p => p.id === playerId)!;
  return getAdjacentTileIds(tileId, state.tiles).filter(id => player.networkTileIds.includes(id));
}

// Places a mushroom on the given tile (adds to placedMushrooms + updates tile)
export function withMushroom(
  state: GameState,
  mushroom: PlacedMushroom,
): GameState {
  return {
    ...state,
    placedMushrooms: [...state.placedMushrooms, mushroom],
    tiles: {
      ...state.tiles,
      [mushroom.tileId]: { ...state.tiles[mushroom.tileId], mushroomCardId: mushroom.cardId },
    },
  };
}
