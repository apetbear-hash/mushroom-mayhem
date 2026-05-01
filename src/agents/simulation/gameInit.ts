import type { GameState, Player, TurnState } from '../../shared/types';
import type { PlayerDraft } from '../turn/PlayerSetup';
import { generateBoard, assignStartingNetwork, getAdjacentTileIds } from '../board/boardGenerator';
import { CARDS } from '../card/cards';
import { buildInitialDeck, drawCards } from '../card';
import { selectSeasonalEffects } from '../seasonal/effects';
import { STARTING_SPORE, STARTING_MOISTURE, STARTING_SUNLIGHT, STARTING_HAND_SIZE } from '../../shared/constants';

const EMPTY_TURN_STATE: TurnState = { actionType: null, restUsed: false, cardsDrawnThisTurn: 0 };

const HABITAT_PRIORITY: Record<string, number> = {
  tree: 5, decay: 4, shade: 3, wet: 2, open: 1,
};

function pickStartingAdjacent(
  spawnId: string,
  tiles: GameState['tiles'],
  excludeIds: Set<string>,
): [string, string] {
  const adj = getAdjacentTileIds(spawnId, tiles)
    .filter(id => !excludeIds.has(id) && !tiles[id].ownerId && !tiles[id].isBlight)
    .sort((a, b) =>
      (HABITAT_PRIORITY[tiles[b].habitat] ?? 0) -
      (HABITAT_PRIORITY[tiles[a].habitat] ?? 0),
    );
  if (adj.length < 2) throw new Error('Not enough adjacent tiles for starting network.');
  return [adj[0], adj[1]];
}

export interface OrderEntry {
  playerId: string;
  name: string;
  color: string;
  cardId: number;
}

// Each player draws one card; highest pts goes first. Tiebreak: highest cost.
function determinePlayerOrder(
  players: Player[],
  deck: number[],
): { orderedPlayers: Player[]; remainingDeck: number[]; orderEntries: OrderEntry[] } {
  const cardMap = new Map(CARDS.map(c => [c.id, c]));
  const drawn: { player: Player; cardId: number }[] = [];
  let remaining = [...deck];

  for (const player of players) {
    if (remaining.length === 0) break;
    drawn.push({ player, cardId: remaining[0] });
    remaining = remaining.slice(1);
  }

  drawn.sort((a, b) => {
    const ca = cardMap.get(a.cardId)!;
    const cb = cardMap.get(b.cardId)!;
    if (cb.pts !== ca.pts) return cb.pts - ca.pts;
    return cb.cost - ca.cost;
  });

  // Shuffle drawn cards back into deck before dealing
  const drawnIds = drawn.map(d => d.cardId);
  for (let i = drawnIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [drawnIds[i], drawnIds[j]] = [drawnIds[j], drawnIds[i]];
  }

  return {
    orderedPlayers: drawn.map((d, i) => ({ ...d.player, turnOrder: i })),
    remainingDeck: [...drawnIds, ...remaining],
    orderEntries: drawn.map(d => ({ playerId: d.player.id, name: d.player.name, color: d.player.color, cardId: d.cardId })),
  };
}

// ── Main initialiser ──────────────────────────────────────────────────────────

export function createInitialGameState(drafts: PlayerDraft[]): { state: GameState; orderCards: OrderEntry[] } {
  const playerCount = drafts.length;
  const { tiles: rawTiles, spawnTileIds } = generateBoard(playerCount);

  const basePlayers: Player[] = drafts.map((d, i) => ({
    id: `player_${i}`,
    name: d.name,
    color: d.color,
    portrait: d.portrait,
    resources: { spore: STARTING_SPORE, moisture: STARTING_MOISTURE, sunlight: STARTING_SUNLIGHT },
    networkTileIds: [],
    hand: [],
    score: 0,
    turnOrder: i,
  }));

  // Assign starting networks
  let tiles = { ...rawTiles };
  const claimedTileIds = new Set<string>(spawnTileIds);

  for (let i = 0; i < basePlayers.length; i++) {
    const spawnId = spawnTileIds[i];
    const [adj1, adj2] = pickStartingAdjacent(spawnId, tiles, claimedTileIds);
    claimedTileIds.add(adj1);
    claimedTileIds.add(adj2);
    tiles = assignStartingNetwork(tiles, spawnId, [adj1, adj2], basePlayers[i].id);
    basePlayers[i] = { ...basePlayers[i], networkTileIds: [spawnId, adj1, adj2] };
  }

  let deck = buildInitialDeck();
  const { orderedPlayers, remainingDeck, orderEntries } = determinePlayerOrder(basePlayers, deck);
  deck = remainingDeck;

  // Deal starting hands
  let players = orderedPlayers;

  for (let i = 0; i < players.length; i++) {
    const minimalState = { deck, players, placedMushrooms: [], tiles } as unknown as GameState;
    const { updatedPlayer, updatedDeck } = drawCards(players[i], STARTING_HAND_SIZE, minimalState);
    players = players.map((p, j) => (j === i ? updatedPlayer : p));
    deck = updatedDeck;
  }

  // Draft phase handled by DraftPhaseScreen (human) and applyAIDraft (AI players).
  // gameInit returns the un-drafted state; App.tsx routes to the draft screen first.

  const forecast = selectSeasonalEffects();

  return {
    state: {
      players,
      currentPlayerIndex: 0,
      currentTurn: 1,
      phase: 'action',
      turnState: EMPTY_TURN_STATE,
      tiles,
      placedMushrooms: [],
      deck,
      discard: [],
      forecast,
      blightTileIds: [],
      spreadCostOverrides: {},
      pigskinBlocks: [],
      pendingFreeSpreads: [],
      isOver: false,
    },
    orderCards: orderEntries,
  };
}
