import type { GameState, Habitat } from '../../shared/types';
import { getSeason } from '../seasonal';
import { getAdjacentTileIds } from '../board/boardGenerator';
import { getDisruptionModifiers } from '../card/powers';

// ── Base formula (§4.1 / §9.3) ───────────────────────────────────────────────

export function baseSpreadCost(networkSize: number, _habitat: Habitat): number {
  const tier = Math.floor(networkSize / 2);
  return Math.max(1, Math.min(tier, 4));
}

// ── Full cost with all modifiers ──────────────────────────────────────────────

export function calculateSpreadCost(
  targetTileId: string,
  playerId: string,
  state: GameState,
): number {
  const player = state.players.find(p => p.id === playerId);
  if (!player) throw new Error(`Player not found: ${playerId}`);

  const tile = state.tiles[targetTileId];
  if (!tile) throw new Error(`Tile not found: ${targetTileId}`);

  // Indigo Milky Cap permanent override
  if (targetTileId in state.spreadCostOverrides) {
    return state.spreadCostOverrides[targetTileId];
  }

  let cost = baseSpreadCost(player.networkTileIds.length, tile.habitat);

  // Honey Mushroom (id 7): −1 for each Honey Mushroom on a tile adjacent to the target
  const adjToTarget = getAdjacentTileIds(targetTileId, state.tiles);
  for (const adjId of adjToTarget) {
    const m = state.placedMushrooms.find(
      m => m.tileId === adjId && m.playerId === playerId && m.cardId === 7,
    );
    if (m) cost -= 1;
  }

  // Season modifiers
  const season = getSeason(state.currentTurn);
  const effect = state.forecast[season];

  if (effect === 'thaw') cost -= 1;
  if (effect === 'scorching_heat') cost += 1;
  if (effect === 'creeping_mist' && (tile.habitat === 'shade' || tile.habitat === 'wet')) {
    cost -= 1;
  }
  // Long Summer copies Summer's effect
  if (season === 'autumn' && state.forecast.autumn === 'long_summer') {
    const summerEffect = state.forecast.summer;
    if (summerEffect === 'scorching_heat') cost += 1;
  }

  // Opponent disruption (Panther Cap, Witch's Butter)
  const disruption = getDisruptionModifiers(targetTileId, playerId, state);
  cost += disruption.extraMoistureToSpread;

  return Math.max(1, cost);
}

// ── Spread legality check ─────────────────────────────────────────────────────

export function canSpreadTo(
  targetTileId: string,
  playerId: string,
  state: GameState,
): { allowed: boolean; reason?: string } {
  const tile = state.tiles[targetTileId];
  if (!tile) return { allowed: false, reason: 'Tile does not exist.' };
  if (tile.ownerId) return { allowed: false, reason: 'Tile is already claimed.' };
  if (tile.isBlight) return { allowed: false, reason: 'Tile is blighted.' };

  // Deep Freeze: no spreading in Winter
  const season = getSeason(state.currentTurn);
  if (season === 'winter' && state.forecast.winter === 'deep_freeze') {
    return { allowed: false, reason: 'Deep Freeze: spreading is not allowed this season.' };
  }

  // Target must be adjacent to at least one tile in the player's network
  const player = state.players.find(p => p.id === playerId);
  if (!player) return { allowed: false, reason: 'Player not found.' };
  const adjToTarget = getAdjacentTileIds(targetTileId, state.tiles);
  const touchesNetwork = adjToTarget.some(id => player.networkTileIds.includes(id));
  if (!touchesNetwork) return { allowed: false, reason: 'Target is not adjacent to your network.' };

  // Pigskin Puffball block
  const blocked = state.pigskinBlocks.some(
    b =>
      b.blockingPlayerId !== playerId &&
      b.untilTurn >= state.currentTurn &&
      getAdjacentTileIds(b.tileId, state.tiles).includes(targetTileId),
  );
  if (blocked) return { allowed: false, reason: 'Blocked by Pigskin Puffball.' };

  return { allowed: true };
}
