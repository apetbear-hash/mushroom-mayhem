import type { GameState, Player, PlacedMushroom, ResourceBundle } from '../../shared/types';
import { getSeason } from '../seasonal';
import { getCard } from '../card/cards';
import { applyOngoingCollect, getResourceSuppression } from '../card/powers';
import { getAdjacentTileIds } from '../board/boardGenerator';

// ── Helpers ───────────────────────────────────────────────────────────────────

function clamp(v: number, min = 0): number {
  return Math.max(min, v);
}

// Compute total sunlight bonus from Candy Cap (id 39) for a given mushroom.
function candyCapBonus(mushroom: PlacedMushroom, playerId: string, state: GameState): number {
  const card = getCard(mushroom.cardId);
  const baseGen = card.generates.sunlight ?? 0;
  if (baseGen === 0) return 0;

  const adjIds = getAdjacentTileIds(mushroom.tileId, state.tiles);
  return state.placedMushrooms.filter(
    m => m.playerId === playerId && m.cardId === 39 && adjIds.includes(m.tileId),
  ).length;
}

// ── Per-mushroom resource generation ─────────────────────────────────────────

function resolveMushroomGeneration(
  mushroom: PlacedMushroom,
  player: Player,
  state: GameState,
  opts: { lobsterTargetTileId?: string; falseMorelType?: string },
): { resourceDelta: Partial<ResourceBundle>; scoreBonus: number } {
  const card = getCard(mushroom.cardId);
  const season = getSeason(state.currentTurn);
  const effect = state.forecast[season];
  const tile = state.tiles[mushroom.tileId];

  // Cards immune to ALL negative seasonal effects:
  //   Turkey Tail (5), Reishi (6), Wood Ear (19), Hen Egg Bolete (45)
  // Cards immune to Winter seasonal effects only:
  //   Velvet Foot (40)
  const isFullySeasonImmune = [5, 6, 19, 45].includes(mushroom.cardId);
  const isSeasonImmune = isFullySeasonImmune || (mushroom.cardId === 40 && season === 'winter');
  const isHenEggBolete = mushroom.cardId === 45;

  // Angel Wings (47): generates nothing in Winter
  if (mushroom.cardId === 47 && season === 'winter') {
    return { resourceDelta: {}, scoreBonus: 0 };
  }

  // Final Harvest: each mushroom generates at most 1 of each resource type (immune cards unaffected)
  const isWinter = season === 'winter';
  const isFinalHarvestCapped = isWinter && effect === 'final_harvest' && !isFullySeasonImmune;

  // Base resource generation from card definition
  const base: Partial<ResourceBundle> = { ...card.generates };

  // Resource suppression from opponent disruption (Death Cap, Fly Agaric, Deadly Galerina)
  const suppression = isHenEggBolete ? 0 : getResourceSuppression(mushroom, state);

  // Season-based resource suppression
  let seasonSuppressAll = false;
  if (!isSeasonImmune && effect === 'creeping_mist' && (tile?.habitat === 'shade' || tile?.habitat === 'wet')) {
    seasonSuppressAll = true;
  }

  // Compute raw resources after suppression
  let resourceDelta: Partial<ResourceBundle> = {};

  if (!seasonSuppressAll) {
    for (const [res, amt] of Object.entries(base) as [keyof ResourceBundle, number][]) {
      if ((amt ?? 0) === 0) continue;
      let val = amt;

      // Death Cap suppression (total) already returns Infinity from getResourceSuppression
      if (suppression === Infinity) { val = 0; break; }
      val -= suppression;

      // Sluggish Soil: wet/shade tiles −1 per resource type (min 0)
      if (effect === 'sluggish_soil' && !isSeasonImmune && (tile?.habitat === 'wet' || tile?.habitat === 'shade')) val = clamp(val - 1, 0);

      // Drought: no moisture from any source (immune cards unaffected)
      if (effect === 'drought' && res === 'moisture' && !isSeasonImmune) val = 0;

      // Decay Bloom: Decay-habitat mushrooms +2 resources
      if (effect === 'decay_bloom' && tile?.habitat === 'decay') val += 2;

      resourceDelta[res] = clamp(val);
    }

    // Long Days (Summer) or Long Summer copies: +1 spore from all mushrooms
    const activeSummerEffect =
      season === 'summer'
        ? effect
        : season === 'autumn' && state.forecast.autumn === 'long_summer'
        ? state.forecast.summer
        : null;
    if (activeSummerEffect === 'long_days') {
      resourceDelta.spore = (resourceDelta.spore ?? 0) + 1;
    }

    // Candy Cap sunlight bonus for sunlight-generating mushrooms
    const ccBonus = candyCapBonus(mushroom, player.id, state);
    if (ccBonus > 0 && (card.generates.sunlight ?? 0) > 0) {
      resourceDelta.sunlight = (resourceDelta.sunlight ?? 0) + ccBonus;
    }
  }

  // Ongoing power effects (score and additional resource bonuses)
  const ongoing = applyOngoingCollect(mushroom, state, player, opts);
  for (const [res, amt] of Object.entries(ongoing.resourceDelta) as [keyof ResourceBundle, number][]) {
    if ((amt ?? 0) !== 0) {
      resourceDelta[res] = clamp((resourceDelta[res] ?? 0) + (amt ?? 0));
    }
  }

  // Decay Bloom: Decay mushrooms score 0 symbiosis this season
  let scoreBonus = ongoing.scoreBonus;
  if (effect === 'decay_bloom' && tile?.habitat === 'decay') scoreBonus = 0;

  // Abundant Canopy: Shade mushrooms +1 pt
  const activeSummerForPoints =
    season === 'summer'
      ? effect
      : season === 'autumn' && state.forecast.autumn === 'long_summer'
      ? state.forecast.summer
      : null;
  if (activeSummerForPoints === 'abundant_canopy' && tile?.habitat === 'shade') {
    scoreBonus += 1;
  }

  // Final Harvest: cap each resource type at 1
  if (isFinalHarvestCapped) {
    for (const res of Object.keys(resourceDelta) as (keyof ResourceBundle)[]) {
      if ((resourceDelta[res] ?? 0) > 1) resourceDelta[res] = 1;
    }
  }

  return { resourceDelta, scoreBonus };
}

// ── Full Collect phase for the active player ──────────────────────────────────

export interface CollectPhaseOpts {
  // Per-mushroom optional inputs for powers that require player choices
  lobsterTargetTileId?: string;   // id 16 Lobster Mushroom
  falseMorelType?: string;        // id 25 False Morel declared type
}

export function resolveCollectPhase(
  state: GameState,
  playerId: string,
  opts: CollectPhaseOpts = {},
): GameState {
  const player = state.players.find(p => p.id === playerId)!;
  const season = getSeason(state.currentTurn);
  const effect = state.forecast[season];

  let resourceDelta: ResourceBundle = { spore: 0, moisture: 0, sunlight: 0 };
  let scoreBonus = 0;

  const myMushrooms = state.placedMushrooms.filter(m => m.playerId === playerId);

  for (const mushroom of myMushrooms) {
    const result = resolveMushroomGeneration(mushroom, player, state, {
      lobsterTargetTileId: opts.lobsterTargetTileId,
      falseMorelType: opts.falseMorelType,
    });

    for (const [res, amt] of Object.entries(result.resourceDelta) as [keyof ResourceBundle, number][]) {
      resourceDelta[res] = (resourceDelta[res] ?? 0) + (amt ?? 0);
    }
    scoreBonus += result.scoreBonus;
  }

  // Mycelium Harmony (Winter): score length of longest same-type chain
  if (season === 'winter' && effect === 'mycelium_harmony') {
    scoreBonus += computeMyceliumHarmony(player.id, state, opts.falseMorelType);
  }

  // Maitake (id 4): free card draw at end of turn if on Tree tile
  let updatedDeck = state.deck;
  let updatedHand = player.hand;
  const maitakeOnTree = state.placedMushrooms.some(
    m => m.playerId === playerId && m.cardId === 4 && state.tiles[m.tileId]?.habitat === 'tree',
  );
  if (maitakeOnTree && updatedDeck.length > 0) {
    updatedHand = [...updatedHand, updatedDeck[0]];
    updatedDeck = updatedDeck.slice(1);
  }

  const updatedPlayer: Player = {
    ...player,
    hand: updatedHand,
    resources: {
      spore:    clamp(player.resources.spore    + resourceDelta.spore),
      moisture: clamp(player.resources.moisture + resourceDelta.moisture),
      sunlight: clamp(player.resources.sunlight + resourceDelta.sunlight),
    },
    score: player.score + scoreBonus,
  };

  return {
    ...state,
    players: state.players.map(p => (p.id === playerId ? updatedPlayer : p)),
    deck: updatedDeck,
    phase: 'collect',
  };
}

// ── Mycelium Harmony chain scoring ────────────────────────────────────────────

function computeMyceliumHarmony(
  playerId: string,
  state: GameState,
  falseMorelDeclaredType?: string,
): number {
  const myMushrooms = state.placedMushrooms.filter(m => m.playerId === playerId);
  if (myMushrooms.length === 0) return 0;

  // Build adjacency graph among the player's mushrooms
  const tileToMushroom = new Map(myMushrooms.map(m => [m.tileId, m]));

  // Assign type for each mushroom (False Morel uses declared type)
  function mushroomType(m: PlacedMushroom): string {
    if (m.cardId === 25 && falseMorelDeclaredType) return falseMorelDeclaredType;
    return getCard(m.cardId).type;
  }

  // BFS to find the longest connected chain of the same type
  let maxChain = 0;
  const visited = new Set<string>();

  for (const mushroom of myMushrooms) {
    if (visited.has(mushroom.tileId)) continue;

    const type = mushroomType(mushroom);
    const queue: PlacedMushroom[] = [mushroom];
    let chainLen = 0;

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current.tileId)) continue;
      if (mushroomType(current) !== type) continue;

      visited.add(current.tileId);
      chainLen++;

      const adjIds = getAdjacentTileIds(current.tileId, state.tiles);
      for (const adjId of adjIds) {
        const adj = tileToMushroom.get(adjId);
        if (adj && !visited.has(adj.tileId) && mushroomType(adj) === type) {
          queue.push(adj);
        }
      }
    }

    maxChain = Math.max(maxChain, chainLen);
  }

  return maxChain;
}

// ── Final Harvest end-of-game bonus ──────────────────────────────────────────

export function resolveFinalHarvestBonus(state: GameState): GameState {
  if (state.forecast.winter !== 'final_harvest') return state;

  const updatedPlayers = state.players.map(player => {
    const total =
      player.resources.spore + player.resources.moisture + player.resources.sunlight;
    const bonus = Math.floor(total / 3);
    return { ...player, score: player.score + bonus };
  });

  return { ...state, players: updatedPlayers };
}

// ── Mushroom Festival end-of-season bonus ─────────────────────────────────────

export function resolveMushroomFestival(state: GameState): GameState {
  if (state.forecast.autumn !== 'mushroom_festival') return state;

  const updatedPlayers = state.players.map(player => {
    const count = state.placedMushrooms.filter(m => m.playerId === player.id).length;
    return { ...player, score: player.score + count };
  });

  return { ...state, players: updatedPlayers };
}
