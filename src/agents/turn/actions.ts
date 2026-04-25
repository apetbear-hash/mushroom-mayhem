import type { GameState, Player, PlacedMushroom, PigskinBlock } from '../../shared/types';
import { getSeason } from '../seasonal';
import { getCard, canPlantOnTile, removeFromHand, drawCards } from '../card';
import { applyOnPlant } from '../card/powers';
import { getDisruptionModifiers } from '../card/powers';
import { calculateSpreadCost, canSpreadTo } from './spreadCost';
import { getAdjacentTileIds } from '../board/boardGenerator';
import { SEASON_TURNS } from '../../shared/constants';

function updatePlayer(state: GameState, updated: Player): GameState {
  return {
    ...state,
    players: state.players.map(p => (p.id === updated.id ? updated : p)),
  };
}

// ── Deck recycling ────────────────────────────────────────────────────────────
// Reshuffles the discard pile back into the deck when it runs dry.

function refreshDeck(state: GameState): GameState {
  if (state.deck.length > 0 || state.discard.length === 0) return state;
  const newDeck = [...state.discard];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return { ...state, deck: newDeck, discard: [] };
}

// ── Draw ──────────────────────────────────────────────────────────────────────

export interface DrawOpts {
  count: number; // number of cards the player wants to draw
}

export function resolveDrawAction(
  state: GameState,
  playerId: string,
  opts: DrawOpts,
): GameState {
  const player = state.players.find(p => p.id === playerId)!;
  // Germination Gamble (Spring): player may discard and replace before actions — handled by UI
  // This action is for standard Draw.

  const hasBearHead = state.placedMushrooms.some(
    m => m.playerId === playerId && m.cardId === 44,
  );
  const hasLionsMane = state.placedMushrooms.some(
    m => m.playerId === playerId && m.cardId === 9,
  );

  // Escalating draw cost: the nth card drawn this turn costs n sunlight.
  // (1st=1☀️, 2nd=2☀️, 3rd=3☀️, ...)
  // Total cost for `count` cards starting at position `drawn`:
  //   sum_{i=0}^{count-1} (drawn+1+i) = count*(drawn+1) + count*(count-1)/2
  const drawn = state.turnState.cardsDrawnThisTurn;
  const count = opts.count;
  let sunlightCost = count * (drawn + 1) + (count * (count - 1)) / 2;

  // Bear's Head Tooth: first card of the turn is free.
  if (hasBearHead && drawn === 0) sunlightCost = Math.max(0, sunlightCost - 1);

  if (player.resources.sunlight < sunlightCost) {
    throw new Error('Not enough sunlight to draw.');
  }

  // Lion's Mane: draw 1 extra free card alongside each paid draw.
  const extraFree = hasLionsMane ? 1 : 0;
  const totalDraw = count + extraFree;

  const working = refreshDeck(state);
  const { updatedPlayer, updatedDeck } = drawCards(
    { ...player, resources: { ...player.resources, sunlight: player.resources.sunlight - sunlightCost } },
    Math.min(totalDraw, working.deck.length),
    working,
  );

  return {
    ...updatePlayer(working, updatedPlayer),
    deck: updatedDeck,
    turnState: {
      ...state.turnState,
      actionType: 'draw',
      cardsDrawnThisTurn: drawn + count,
    },
  };
}

// ── Spread ────────────────────────────────────────────────────────────────────

export function resolveSpreadAction(
  state: GameState,
  playerId: string,
  targetTileId: string,
): GameState {
  const check = canSpreadTo(targetTileId, playerId, state);
  if (!check.allowed) throw new Error(check.reason);

  const player = state.players.find(p => p.id === playerId)!;

  // Hen's Egg Stinkhorn (42): player has pending free spreads from last turn
  const pendingEntry = state.pendingFreeSpreads.find(ps => ps.playerId === playerId);
  const isFreeSpread = !!(pendingEntry && pendingEntry.spreadsRemaining > 0);

  const cost = isFreeSpread ? 0 : calculateSpreadCost(targetTileId, playerId, state);

  // Drought: moisture is 0 and can't be gained — spreading costs moisture, so it's impossible
  // (free spreads bypass moisture entirely)
  const season = getSeason(state.currentTurn);
  const effect = state.forecast[season];
  if (!isFreeSpread && effect === 'drought') throw new Error('Drought: you cannot gain or spend moisture this season.');

  if (!isFreeSpread && player.resources.moisture < cost) {
    throw new Error(`Not enough moisture. Need ${cost}, have ${player.resources.moisture}.`);
  }

  const updatedPlayer: Player = {
    ...player,
    resources: { ...player.resources, moisture: player.resources.moisture - cost },
    networkTileIds: [...player.networkTileIds, targetTileId],
  };

  const updatedTiles = {
    ...state.tiles,
    [targetTileId]: { ...state.tiles[targetTileId], ownerId: playerId },
  };

  const updatedPendingSpreads = isFreeSpread
    ? state.pendingFreeSpreads
        .map(ps => ps.playerId === playerId
          ? { ...ps, spreadsRemaining: ps.spreadsRemaining - 1 }
          : ps)
        .filter(ps => ps.spreadsRemaining > 0)
    : state.pendingFreeSpreads;

  return {
    ...updatePlayer(state, updatedPlayer),
    tiles: updatedTiles,
    pendingFreeSpreads: updatedPendingSpreads,
    turnState: { ...state.turnState, actionType: 'spread' },
  };
}

// ── Plant ─────────────────────────────────────────────────────────────────────

export interface PlantOpts {
  // Required for specific card powers
  oysterCopyTileId?: string;       // id 2 — first free copy tile
  oysterCopyTileId2?: string;      // id 2 — second free copy tile
  scarletCopyTileIds?: [string, string]; // id 49 — 2 tiles for free copies (at Autumn start)
  adjacentFriendlyTileId?: string; // id 12 King Bolete / id 37 Shaggy Mane
  indigoReduceTileId?: string;     // id 38
}

export function resolvePlantAction(
  state: GameState,
  playerId: string,
  cardId: number,
  tileId: string,
  opts: PlantOpts = {},
): GameState {
  const player = state.players.find(p => p.id === playerId)!;
  const card = getCard(cardId);

  if (!player.hand.includes(cardId)) throw new Error('Card not in hand.');
  if (!canPlantOnTile(cardId, tileId, state)) throw new Error('Cannot plant on this tile.');

  const tile = state.tiles[tileId];

  // Disruption checks
  const disruption = getDisruptionModifiers(tileId, playerId, state);
  if (disruption.cannotPlantOnTile) throw new Error('Blocked by Stinkhorn.');

  const season = getSeason(state.currentTurn);
  const effect = state.forecast[season];

  const totalCost = card.cost + disruption.extraSporeToPlant;
  if (player.resources.spore < totalCost) {
    throw new Error(`Not enough spores. Need ${totalCost}, have ${player.resources.spore}.`);
  }

  const newMushroom: PlacedMushroom = {
    cardId,
    playerId,
    tileId,
    turnsOnBoard: 0,
  };

  const plantResult = applyOnPlant(newMushroom, tileId, state, player, {
    oysterCopyTileId: opts.oysterCopyTileId,
    oysterCopyTileId2: opts.oysterCopyTileId2,
    adjacentFriendlyTileId: opts.adjacentFriendlyTileId,
    indigoReduceTileId: opts.indigoReduceTileId,
    openTilePlant: tile.habitat === 'open',
  });

  // Scorching Heat: open tile mushrooms don't score symbiosis points
  let scoreGain = card.pts + plantResult.scoreBonus;
  if (effect === 'scorching_heat' && tile.habitat === 'open') scoreGain = 0;

  // King Bolete: +1 to each adjacent friendly mushroom
  let updatedMushrooms = [
    ...state.placedMushrooms,
    newMushroom,
    ...plantResult.extraPlacements.map(ep => ({
      cardId: ep.cardId,
      playerId,
      tileId: ep.tileId,
      turnsOnBoard: 0,
    })),
  ];

  let updatedPlayers = state.players.map(p => {
    if (p.id !== playerId) return p;
    const newResources = { ...p.resources };
    newResources.spore -= totalCost;
    for (const [res, amt] of Object.entries(plantResult.resourceDelta)) {
      newResources[res as keyof typeof newResources] = Math.max(
        0,
        (newResources[res as keyof typeof newResources] ?? 0) + (amt ?? 0),
      );
    }
    return {
      ...p,
      hand: removeFromHand(p, cardId).hand,
      resources: newResources,
      score: p.score + scoreGain,
    };
  });

  // King Bolete (12): +1 to each adjacent friendly mushroom
  if (card.id === 12) {
    const adjIds = getAdjacentTileIds(tileId, state.tiles);
    const friendlyAdj = state.placedMushrooms.filter(
      m => m.playerId === playerId && adjIds.includes(m.tileId),
    );
    if (friendlyAdj.length > 0) {
      updatedPlayers = updatedPlayers.map(p => {
        if (p.id !== playerId) return p;
        return { ...p, score: p.score + friendlyAdj.length };
      });
    }
  }

  // Shaggy Mane (37): +3 to adjacent friendly mushroom
  if (card.id === 37 && opts.adjacentFriendlyTileId) {
    updatedPlayers = updatedPlayers.map(p => {
      if (p.id !== playerId) return p;
      return { ...p, score: p.score + 3 };
    });
  }

  // Update tiles
  let updatedTiles = {
    ...state.tiles,
    [tileId]: { ...state.tiles[tileId], mushroomCardId: cardId },
    ...Object.fromEntries(
      plantResult.extraPlacements.map(ep => [
        ep.tileId,
        { ...state.tiles[ep.tileId], mushroomCardId: ep.cardId },
      ]),
    ),
  };

  // Free network expansion tiles (Puffball id 31)
  for (const freeTileId of plantResult.freeSpreadTileIds) {
    updatedTiles = {
      ...updatedTiles,
      [freeTileId]: { ...updatedTiles[freeTileId], ownerId: playerId },
    };
    updatedPlayers = updatedPlayers.map(p =>
      p.id === playerId
        ? { ...p, networkTileIds: [...p.networkTileIds, freeTileId] }
        : p,
    );
  }

  // Spread cost overrides (Indigo Milky Cap id 38)
  const updatedOverrides = { ...state.spreadCostOverrides };
  for (const id of plantResult.reducedCostTileIds) {
    updatedOverrides[id] = 1;
  }

  // Hen's Egg Stinkhorn (42): register pending free spread for next turn
  const updatedPendingSpreads = plantResult.pendingFreeSpread
    ? [...state.pendingFreeSpreads, { playerId, spreadsRemaining: 2 }]
    : state.pendingFreeSpreads;

  // Pigskin Puffball (30): block adjacent tiles for remainder of current season
  let updatedPigskinBlocks = [...state.pigskinBlocks];
  if (card.id === 30) {
    const [, seasonEnd] = SEASON_TURNS[getSeason(state.currentTurn)];
    const block: PigskinBlock = {
      tileId,
      blockingPlayerId: playerId,
      untilTurn: seasonEnd,
    };
    updatedPigskinBlocks = [...updatedPigskinBlocks, block];
  }

  return {
    ...state,
    players: updatedPlayers,
    placedMushrooms: updatedMushrooms,
    tiles: updatedTiles,
    spreadCostOverrides: updatedOverrides,
    pendingFreeSpreads: updatedPendingSpreads,
    pigskinBlocks: updatedPigskinBlocks,
    turnState: { ...state.turnState, actionType: 'plant' },
  };
}

// ── Rest ──────────────────────────────────────────────────────────────────────

export function resolveRestAction(state: GameState, playerId: string): GameState {
  if (state.turnState.restUsed) throw new Error('Rest can only be used once per turn.');
  if (state.turnState.actionType !== null) throw new Error('Cannot mix action types in one turn.');

  const player = state.players.find(p => p.id === playerId)!;
  const season = getSeason(state.currentTurn);
  const effect = state.forecast[season];

  const gain = { spore: 1, moisture: 1, sunlight: 1 };

  // Drought: no moisture gain
  if (effect === 'drought') gain.moisture = 0;

  const updatedPlayer: Player = {
    ...player,
    resources: {
      spore:    player.resources.spore    + gain.spore,
      moisture: player.resources.moisture + gain.moisture,
      sunlight: player.resources.sunlight + gain.sunlight,
    },
  };

  return {
    ...updatePlayer(state, updatedPlayer),
    turnState: { actionType: 'rest', restUsed: true, cardsDrawnThisTurn: 0 },
  };
}

// ── Advance turn ──────────────────────────────────────────────────────────────

export function advanceTurn(state: GameState): GameState {
  const nextPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
  const nextTurn = nextPlayerIndex === 0 ? state.currentTurn + 1 : state.currentTurn;
  const isOver = nextTurn > 20 && nextPlayerIndex === 0;

  // Age all placed mushrooms by 1 turn when the full round completes
  const updatedMushrooms =
    nextPlayerIndex === 0
      ? state.placedMushrooms.map(m => ({ ...m, turnsOnBoard: m.turnsOnBoard + 1 }))
      : state.placedMushrooms;

  // Expire Pigskin blocks that are no longer active
  const updatedPigskinBlocks = state.pigskinBlocks.filter(
    b => b.untilTurn >= nextTurn,
  );

  return {
    ...state,
    currentPlayerIndex: nextPlayerIndex,
    currentTurn: nextTurn,
    phase: 'action',
    turnState: { actionType: null, restUsed: false, cardsDrawnThisTurn: 0 },
    placedMushrooms: updatedMushrooms,
    pigskinBlocks: updatedPigskinBlocks,
    isOver,
  };
}

// ── Inky Cap discard (during Collect, player-triggered) ───────────────────────

export function resolveInkyCapDiscard(
  state: GameState,
  playerId: string,
  tileId: string,
): GameState {
  const mushroom = state.placedMushrooms.find(
    m => m.tileId === tileId && m.playerId === playerId && m.cardId === 32,
  );
  if (!mushroom) throw new Error('No Inky Cap to discard at this tile.');

  return {
    ...state,
    placedMushrooms: state.placedMushrooms.filter(m => m !== mushroom),
    tiles: { ...state.tiles, [tileId]: { ...state.tiles[tileId], mushroomCardId: null } },
    players: state.players.map(p =>
      p.id === playerId
        ? { ...p, resources: { ...p.resources, spore: p.resources.spore + 3 } }
        : p,
    ),
    discard: [...state.discard, 32],
  };
}

// ── Shiitake moisture → sunlight swap (player-triggered during Collect) ───────

export function resolveShiitakeSwap(
  state: GameState,
  playerId: string,
): GameState {
  const player = state.players.find(p => p.id === playerId)!;
  if (player.resources.moisture < 1) throw new Error('Not enough moisture.');
  return updatePlayer(state, {
    ...player,
    resources: {
      ...player.resources,
      moisture: player.resources.moisture - 1,
      sunlight: player.resources.sunlight + 1,
    },
  });
}
