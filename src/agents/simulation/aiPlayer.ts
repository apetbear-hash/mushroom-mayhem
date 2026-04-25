import type { GameState, Player } from '../../shared/types';
import { getAdjacentTileIds } from '../board/boardGenerator';
import { getCard, canPlantOnTile } from '../card';
import { getDisruptionModifiers } from '../card/powers';
import { canSpreadTo, calculateSpreadCost } from '../turn/spreadCost';
import {
  resolveDrawAction,
  resolveSpreadAction,
  resolvePlantAction,
  resolveRestAction,
  resolveInkyCapDiscard,
  resolveShiitakeSwap,
} from '../turn/actions';
import { resolveCollectPhase } from '../turn/collectPhase';
import { getSeason } from '../seasonal';

// ── Helpers ───────────────────────────────────────────────────────────────────

function player(state: GameState): Player {
  return state.players[state.currentPlayerIndex];
}

function safeApply(
  _state: GameState,
  fn: () => GameState,
): GameState | null {
  try { return fn(); } catch { return null; }
}

// Score a card for planting priority.
// Higher = more desirable to play now.
function cardPriority(cardId: number, state: GameState, _playerId: string): number {
  const card = getCard(cardId);
  const turnsLeft = 21 - state.currentTurn;
  // Base value: on-plant pts + estimated ongoing pts
  const ongoingMultiplier = card.isOngoing ? Math.min(turnsLeft, 8) : 0;
  return card.pts + ongoingMultiplier * 0.5 + card.cost * 0.1;
}

// Find all tiles the current player can plant a given card on.
function plantableTiles(cardId: number, state: GameState, playerId: string): string[] {
  const p = state.players.find(pl => pl.id === playerId)!;
  return p.networkTileIds.filter(id => {
    if (!canPlantOnTile(cardId, id, state)) return false;
    const disruption = getDisruptionModifiers(id, playerId, state);
    if (disruption.cannotPlantOnTile) return false;
    return true;
  });
}

// ── Action: Plant ─────────────────────────────────────────────────────────────

function tryPlant(state: GameState): GameState | null {
  const p = player(state);

  // Sort hand by priority descending
  const sorted = [...p.hand].sort(
    (a, b) => cardPriority(b, state, p.id) - cardPriority(a, state, p.id),
  );

  for (const cardId of sorted) {
    const card = getCard(cardId);
    const tiles = plantableTiles(cardId, state, p.id);
    if (tiles.length === 0) continue;

    const totalCost = card.cost; // disruption cost handled per-tile inside resolvePlantAction
    if (p.resources.spore < totalCost) continue;

    // Prefer tiles not occupied by opponents nearby
    const tile = tiles[0];
    const result = safeApply(state, () =>
      resolvePlantAction(state, p.id, cardId, tile),
    );
    if (result) return result;
  }
  return null;
}

// ── Action: Draw ──────────────────────────────────────────────────────────────

function tryDraw(state: GameState): GameState | null {
  const p = player(state);
  if (state.deck.length === 0 && state.discard.length === 0) return null;

  // Cost of next card: (cardsDrawnThisTurn + 1), Bear's Head makes first card free.
  const drawn = state.turnState.cardsDrawnThisTurn;
  const hasBearHead = state.placedMushrooms.some(m => m.playerId === p.id && m.cardId === 44);
  const nextCost = (drawn === 0 && hasBearHead) ? 0 : drawn + 1;

  if (p.resources.sunlight < nextCost) return null;
  return safeApply(state, () => resolveDrawAction(state, p.id, { count: 1 }));
}

// ── Action: Spread ────────────────────────────────────────────────────────────

function trySpread(state: GameState): GameState | null {
  const p = player(state);
  if (p.resources.moisture < 1) return null;

  const season = getSeason(state.currentTurn);
  if (season === 'winter' && state.forecast.winter === 'deep_freeze') return null;

  // Collect all valid spread targets
  const candidates: string[] = [];
  for (const tileId of p.networkTileIds) {
    for (const adjId of getAdjacentTileIds(tileId, state.tiles)) {
      const tile = state.tiles[adjId];
      if (!tile || tile.ownerId || tile.isBlight) continue;
      const { allowed } = canSpreadTo(adjId, p.id, state);
      if (!allowed) continue;
      const cost = calculateSpreadCost(adjId, p.id, state);
      if (p.resources.moisture >= cost) candidates.push(adjId);
    }
  }

  if (candidates.length === 0) return null;

  // Prefer tiles whose habitat matches cards in hand
  const handHabitats = new Set(
    p.hand.flatMap(id => getCard(id).habitats),
  );
  const preferred = candidates.filter(id => handHabitats.has(state.tiles[id].habitat));
  const target = preferred.length > 0
    ? preferred[Math.floor(Math.random() * preferred.length)]
    : candidates[Math.floor(Math.random() * candidates.length)];

  return safeApply(state, () => resolveSpreadAction(state, p.id, target));
}

// ── Action: Rest ──────────────────────────────────────────────────────────────

function tryRest(state: GameState): GameState | null {
  const p = player(state);
  if (state.turnState.actionType !== null) return null;
  return safeApply(state, () => resolveRestAction(state, p.id));
}

// ── Full AI turn ──────────────────────────────────────────────────────────────

export function aiTakeTurn(initialState: GameState): GameState {
  const p = player(initialState);
  let state = initialState;

  // Germination Gamble: discard low-value cards and redraw
  if (getSeason(state.currentTurn) === 'spring' &&
      state.forecast.spring === 'germination_gamble') {
    const lowValue = p.hand.filter(id => {
      const c = getCard(id);
      return c.pts === 0 && Object.keys(c.generates).length === 0;
    });
    if (lowValue.length > 0 && state.deck.length >= lowValue.length) {
      const newHand = p.hand.filter(id => !lowValue.includes(id));
      const drawn = state.deck.slice(0, lowValue.length);
      state = {
        ...state,
        players: state.players.map(pl =>
          pl.id === p.id ? { ...pl, hand: [...newHand, ...drawn] } : pl,
        ),
        deck: state.deck.slice(lowValue.length),
      };
    }
  }

  // Decide action priority based on game state
  const resources = state.players[state.currentPlayerIndex].resources;
  const hand = state.players[state.currentPlayerIndex].hand;
  const turnsLeft = 21 - state.currentTurn;

  // Determine if planting is worthwhile
  const canPlantSomething = hand.some(id => {
    const card = getCard(id);
    return resources.spore >= card.cost && plantableTiles(id, state, p.id).length > 0;
  });

  // Action selection heuristic
  let result: GameState | null = null;

  if (canPlantSomething) {
    // Plant repeatedly while affordable
    let s: GameState | null = state;
    while (s) {
      result = s;
      s = tryPlant(s);
    }
    state = result!;
  } else if (resources.sunlight >= 1 && hand.length <= 3 && state.deck.length > 0) {
    result = tryDraw(state);
    if (result) state = result;
  } else if (resources.moisture >= 1 && turnsLeft > 5) {
    // Spread repeatedly while affordable. If the first spread fails (cost > moisture),
    // fall through to draw or rest rather than wasting the turn.
    const firstSpread = trySpread(state);
    if (firstSpread !== null) {
      let s: GameState | null = firstSpread;
      while (s) {
        state = s;
        s = trySpread(state);
      }
    } else if (resources.sunlight >= 1 && state.deck.length > 0) {
      result = tryDraw(state);
      if (result) state = result;
    } else {
      result = tryRest(state);
      if (result) state = result;
    }
  } else if (resources.sunlight >= 1 && state.deck.length > 0) {
    result = tryDraw(state);
    if (result) state = result;
  } else {
    result = tryRest(state);
    if (result) state = result;
  }

  // Inky Cap (id 32): discard if we need spores to play cards in hand
  const inkyCaps = state.placedMushrooms.filter(m => m.playerId === p.id && m.cardId === 32);
  if (inkyCaps.length > 0) {
    const curP = state.players.find(pl => pl.id === p.id)!;
    const maxHandCost = curP.hand.reduce((mx, id) => Math.max(mx, getCard(id).cost), 0);
    const needSpores = curP.resources.spore < maxHandCost || turnsLeft <= 3;
    if (needSpores) {
      for (const m of inkyCaps) {
        const r = safeApply(state, () => resolveInkyCapDiscard(state, p.id, m.tileId));
        if (r) state = r;
      }
    }
  }

  // Shiitake (id 3): swap excess moisture into sunlight when sunlight is low
  const hasShiitake = state.placedMushrooms.some(m => m.playerId === p.id && m.cardId === 3);
  if (hasShiitake) {
    let swapped = true;
    while (swapped) {
      swapped = false;
      const curP = state.players.find(pl => pl.id === p.id)!;
      if (curP.resources.moisture >= 2 && curP.resources.sunlight < 2) {
        const r = safeApply(state, () => resolveShiitakeSwap(state, p.id));
        if (r) { state = r; swapped = true; }
      }
    }
  }

  // Always resolve collect phase
  state = resolveCollectPhase(state, p.id);

  return state;
}
