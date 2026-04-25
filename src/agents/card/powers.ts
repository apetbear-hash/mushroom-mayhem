import type { GameState, PlacedMushroom, Player, ResourceBundle } from '../../shared/types';
import { getCard } from './cards';
import { getSeason } from '../seasonal';
import { getAdjacentTileIds as _boardAdj } from '../board/boardGenerator';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getAdjacentTileIds(tileId: string, state: GameState): string[] {
  return _boardAdj(tileId, state.tiles);
}

// Returns true if the target mushroom is immune to adjacency disruption.
function isImmuneToAdjacencyDisruption(target: PlacedMushroom): boolean {
  return target.cardId === 36 || target.cardId === 45; // Black Trumpet, Hen Egg Bolete
}

// ── Disruption check (§9.4) ───────────────────────────────────────────────────

export function canDisrupt(
  disruptorTileId: string,
  targetMushroom: PlacedMushroom,
  disruptorPlayerId: string,
  state: GameState,
): boolean {
  const adjacentIds = getAdjacentTileIds(disruptorTileId, state);
  if (!adjacentIds.includes(targetMushroom.tileId)) return false;
  if (targetMushroom.playerId === disruptorPlayerId) return false;
  if (isImmuneToAdjacencyDisruption(targetMushroom)) return false;
  return true;
}

// ── On-plant effects ──────────────────────────────────────────────────────────

export interface PlantResult {
  scoreBonus: number;
  resourceDelta: Partial<ResourceBundle>;
  // Extra placed mushrooms added by the power (Oyster, Scarlet Waxy Cap)
  extraPlacements: Array<{ cardId: number; tileId: string }>;
  // Spread to additional tiles for free (Puffball, Pigskin)
  freeSpreadTileIds: string[];
  // Tiles whose spread cost is permanently reduced to 1 (Indigo Milky Cap)
  reducedCostTileIds: string[];
  // Whether Hen's Egg Stinkhorn free-spread is pending next turn
  pendingFreeSpread: boolean;
}

export function applyOnPlant(
  mushroom: PlacedMushroom,
  chosenTileId: string,
  state: GameState,
  player: Player,
  // Extra inputs required for specific powers
  opts: {
    oysterCopyTileId?: string;       // id 2 — first free copy
    oysterCopyTileId2?: string;      // id 2 — second free copy
    adjacentFriendlyTileId?: string; // id 12 King Bolete, id 37 Shaggy Mane
    indigoReduceTileId?: string;     // id 38
    openTilePlant?: boolean;         // id 11 Morel
  } = {}
): PlantResult {
  const result: PlantResult = {
    scoreBonus: 0,
    resourceDelta: {},
    extraPlacements: [],
    freeSpreadTileIds: [],
    reducedCostTileIds: [],
    pendingFreeSpread: false,
  };

  const card = getCard(mushroom.cardId);

  // Morel (11): +1 if planted on Open tile
  if (card.id === 11 && opts.openTilePlant) {
    result.scoreBonus += 1;
  }

  // Saffron Milky Cap (10): gain 2 spores on plant
  if (card.id === 10) {
    result.resourceDelta.spore = (result.resourceDelta.spore ?? 0) + 2;
  }

  // Gem-Studded Puffball (48): gain 2 spores on plant
  if (card.id === 48) {
    result.resourceDelta.spore = (result.resourceDelta.spore ?? 0) + 2;
  }

  // Chicken of the Woods (34): gain 2 moisture on plant
  if (card.id === 34) {
    result.resourceDelta.moisture = (result.resourceDelta.moisture ?? 0) + 2;
  }

  // Cauliflower Mushroom (18): +2 score on plant
  if (card.id === 18) {
    result.scoreBonus += 2;
  }

  // Matsutake (14): +3 if no other mushroom of the same type owned
  if (card.id === 14) {
    const ownSameType = state.placedMushrooms.filter(
      m => m.playerId === player.id && m.tileId !== chosenTileId && getCard(m.cardId).type === card.type
    );
    if (ownSameType.length === 0) result.scoreBonus += 3;
  }

  // Golden Chanterelle (15): +2 per other Chanterelle variant owned (no max)
  if (card.id === 15) {
    const chanterelleIds = new Set([1, 15, 46]); // Chanterelle, Golden, Cinnabar
    const others = state.placedMushrooms.filter(
      m => m.playerId === player.id && chanterelleIds.has(m.cardId) && m.cardId !== 15
    );
    result.scoreBonus += others.length * 2;
  }

  // Hedgehog (17): +3 if no opponent mushrooms on adjacent tiles
  if (card.id === 17) {
    const adjIds = getAdjacentTileIds(chosenTileId, state);
    const opponentAdjacent = state.placedMushrooms.some(
      m => m.playerId !== player.id && adjIds.includes(m.tileId)
    );
    if (!opponentAdjacent) result.scoreBonus += 3;
  }

  // Chanterelle (1): +1 per 3 tiles in network
  if (card.id === 1) {
    result.scoreBonus += Math.floor(player.networkTileIds.length / 3);
  }

  // Coral Mushroom (20): +1 per 5 tiles in network
  if (card.id === 20) {
    result.scoreBonus += Math.floor(player.networkTileIds.length / 5);
  }

  // King Bolete (12): +1 to all adjacent friendly mushrooms (applied externally, flagged here)
  // The caller must award +1 to each adjacent friendly mushroom's score.
  if (card.id === 12 && opts.adjacentFriendlyTileId !== undefined) {
    result.scoreBonus += 0; // handled by caller iterating adjacents
  }

  // Shaggy Mane (37): +3 to self and +3 to one adjacent friendly mushroom
  if (card.id === 37 && opts.adjacentFriendlyTileId) {
    result.scoreBonus += 3;
    // The +3 for the adjacent mushroom is applied by the caller
  }

  // Puffball (31): expand network to 1 random adjacent unoccupied tile
  if (card.id === 31) {
    const adjIds = getAdjacentTileIds(chosenTileId, state);
    const candidates = adjIds.filter(id => {
      const tile = state.tiles[id];
      return tile && !tile.ownerId && !tile.isBlight;
    });
    if (candidates.length > 0) {
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      result.freeSpreadTileIds.push(pick);
    }
  }

  // Oyster Mushroom (2): up to 2 free copies on adjacent network tiles
  if (card.id === 2) {
    if (opts.oysterCopyTileId) result.extraPlacements.push({ cardId: 2, tileId: opts.oysterCopyTileId });
    if (opts.oysterCopyTileId2) result.extraPlacements.push({ cardId: 2, tileId: opts.oysterCopyTileId2 });
  }

  // Indigo Milky Cap (38): reduce all adjacent tiles' spread cost to 1 permanently
  if (card.id === 38) {
    const adjIds = getAdjacentTileIds(chosenTileId, state);
    result.reducedCostTileIds.push(...adjIds);
  }

  // Hen's Egg Stinkhorn (42): free spread next turn (player picks 2 tiles)
  if (card.id === 42) {
    result.pendingFreeSpread = true;
  }

  return result;
}

// ── Ongoing / Collect-phase effects ───────────────────────────────────────────

export interface CollectResult {
  scoreBonus: number;
  resourceDelta: Partial<ResourceBundle>;
  // Sunlight bonus granted to adjacent friendly mushrooms by Candy Cap (id 39)
  candyCapSunlightBonus: number;
}

export function applyOngoingCollect(
  mushroom: PlacedMushroom,
  state: GameState,
  player: Player,
  opts: {
    lobsterTargetTileId?: string; // id 16 — player's chosen adjacent friendly mushroom
    falseMorelType?: string;      // id 25 — declared type for Mycelium Harmony
  } = {}
): CollectResult {
  const result: CollectResult = { scoreBonus: 0, resourceDelta: {}, candyCapSunlightBonus: 0 };
  const card = getCard(mushroom.cardId);
  if (!card.isOngoing) return result;

  const season = getSeason(state.currentTurn);

  // Angel Wings (47): 3pts/turn in Summer; nothing in Winter
  if (card.id === 47) {
    if (season === 'winter') {
      result.resourceDelta.sunlight = 0; // suppress base generation
    } else if (season === 'summer') {
      result.scoreBonus += 3;
    }
  }

  // Old Man of the Woods (43): +1 point per turn on board
  if (card.id === 43) {
    result.scoreBonus += 1;
  }

  // Chaga (8): +1 point every 3 turns on board
  if (card.id === 8 && mushroom.turnsOnBoard > 0 && mushroom.turnsOnBoard % 3 === 0) {
    result.scoreBonus += 1;
  }

  // Lobster Mushroom (16): active player chooses one adjacent friendly mushroom → +1 pt
  if (card.id === 16 && opts.lobsterTargetTileId) {
    const target = state.placedMushrooms.find(
      m => m.tileId === opts.lobsterTargetTileId && m.playerId === player.id
    );
    const adjIds = getAdjacentTileIds(mushroom.tileId, state);
    if (target && adjIds.includes(opts.lobsterTargetTileId)) {
      result.scoreBonus += 1; // applied to lobster's owner; caller awards to the target mushroom
    }
  }

  // Cinnabar Chanterelle (46): +2pts/turn in Summer and Long Summer
  if (card.id === 46 && (season === 'summer' || isLongSummer(state))) {
    result.scoreBonus += 2;
  }

  // Blewit (50): +1 spore and +1 pt in Autumn
  if (card.id === 50 && season === 'autumn') {
    result.scoreBonus += 1;
    result.resourceDelta.spore = (result.resourceDelta.spore ?? 0) + 1;
  }

  // Enoki (35): +2 pts per adjacent friendly mushroom during Winter
  if (card.id === 35 && season === 'winter') {
    const adjIds = getAdjacentTileIds(mushroom.tileId, state);
    const friendlyAdjacent = state.placedMushrooms.filter(
      m => m.playerId === player.id && adjIds.includes(m.tileId)
    );
    result.scoreBonus += friendlyAdjacent.length * 2;
  }

  // Reishi (6): shade-only, generates 2 moisture via card.generates — no extra bonus needed here

  // Candy Cap (39): shade-only; each adjacent sunlight generator gets +2 sunlight
  if (card.id === 39) {
    result.candyCapSunlightBonus = 2;
  }

  // Velvet Foot (40): +1 moisture in Winter
  if (card.id === 40 && season === 'winter') {
    result.resourceDelta.moisture = (result.resourceDelta.moisture ?? 0) + 1;
  }

  // Maitake (4): free card draw at end of turn if on Tree tile — flagged here, resolved by turn agent

  // Dryad's Saddle (33): +1 spore in Spring
  if (card.id === 33 && season === 'spring') {
    result.resourceDelta.spore = (result.resourceDelta.spore ?? 0) + 1;
  }

  return result;
}

// ── Disruption cost modifiers (called by turn agent when checking spread/plant costs) ───

export interface CostModifiers {
  extraSporeToPlant: number;
  extraMoistureToSpread: number;
  cannotPlantOnTile: boolean;
}

export function getDisruptionModifiers(
  targetTileId: string,
  actingPlayerId: string,
  state: GameState,
): CostModifiers {
  const modifiers: CostModifiers = {
    extraSporeToPlant: 0,
    extraMoistureToSpread: 0,
    cannotPlantOnTile: false,
  };

  const adjIds = getAdjacentTileIds(targetTileId, state);
  const adjacentOpponentMushrooms = state.placedMushrooms.filter(
    m => m.playerId !== actingPlayerId && adjIds.includes(m.tileId)
  );

  for (const disruptor of adjacentOpponentMushrooms) {
    const adjToDisruptor = getAdjacentTileIds(disruptor.tileId, state);
    if (!adjToDisruptor.includes(targetTileId)) continue;

    // Destroying Angel (22): +2 spores to plant
    if (disruptor.cardId === 22) modifiers.extraSporeToPlant += 2;

    // Panther Cap (26): +1 moisture to spread
    if (disruptor.cardId === 26) modifiers.extraMoistureToSpread += 1;

    // Stinkhorn (27): cannot plant
    if (disruptor.cardId === 27) modifiers.cannotPlantOnTile = true;

    // Witch's Butter (29): +1 moisture to spread
    if (disruptor.cardId === 29) modifiers.extraMoistureToSpread += 1;

    // Jack O'Lantern (24): +1 spore to plant
    if (disruptor.cardId === 24) modifiers.extraSporeToPlant += 1;
  }

  return modifiers;
}

// ── Resource suppression (called during Collect for each opponent mushroom) ───

export function getResourceSuppression(
  targetMushroom: PlacedMushroom,
  state: GameState,
): number {
  if (isImmuneToAdjacencyDisruption(targetMushroom)) return 0;

  const adjIds = getAdjacentTileIds(targetMushroom.tileId, state);
  let suppression = 0;
  let totalSuppressed = false;

  for (const disruptor of state.placedMushrooms) {
    if (disruptor.playerId === targetMushroom.playerId) continue;
    if (!adjIds.includes(disruptor.tileId)) continue;

    // Death Cap (23): total suppression — no resources generated
    if (disruptor.cardId === 23) totalSuppressed = true;

    // Fly Agaric (21) and Deadly Galerina (28): -1 each
    if (disruptor.cardId === 21 || disruptor.cardId === 28) suppression += 1;
  }

  return totalSuppressed ? Infinity : suppression;
}

// ── Pigskin Puffball (30) block ───────────────────────────────────────────────

export function getBlockedSpreadTiles(
  actingPlayerId: string,
  state: GameState,
): Set<string> {
  const blocked = new Set<string>();
  // The seasonal agent tracks active Pigskin blocks; this queries the game state.
  // Pigskin blocks are stored on state.pigskinBlocks (added by seasonal agent).
  const blocks = (state as GameState & { pigskinBlocks?: Array<{ tileId: string; untilTurn: number; blockingPlayerId: string }> }).pigskinBlocks ?? [];
  for (const block of blocks) {
    if (block.blockingPlayerId !== actingPlayerId && state.currentTurn <= block.untilTurn) {
      const adjIds = getAdjacentTileIds(block.tileId, state);
      adjIds.forEach(id => blocked.add(id));
    }
  }
  return blocked;
}

// ── Long Summer helper ────────────────────────────────────────────────────────

function isLongSummer(state: GameState): boolean {
  return getSeason(state.currentTurn) === 'autumn' &&
    state.forecast.autumn === 'long_summer';
}
