import type { Tile, Habitat, HexCoord } from '../../shared/types';
import { BOARD_SIZES } from '../../shared/constants';
import { hexNeighbors, hexToId, idToHex, hexToPixel } from './hexMath';

// ── Habitat distribution weights ──────────────────────────────────────────────

const HABITAT_WEIGHTS: [Habitat, number][] = [
  ['tree',  35],
  ['decay', 25],
  ['open',  20],
  ['shade', 12],
  ['wet',    8],
];

function weightedRandomHabitat(): Habitat {
  const total = HABITAT_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * total;
  for (const [habitat, weight] of HABITAT_WEIGHTS) {
    roll -= weight;
    if (roll <= 0) return habitat;
  }
  return 'tree';
}

// ── Hex cluster generation ────────────────────────────────────────────────────

// BFS outward from origin to produce a compact cluster of exactly `count` tiles.
function generateCluster(count: number): HexCoord[] {
  const visited = new Set<string>();
  const queue: HexCoord[] = [{ q: 0, r: 0 }];
  const tiles: HexCoord[] = [];

  visited.add('0,0');

  while (tiles.length < count && queue.length > 0) {
    const current = queue.shift()!;
    tiles.push(current);

    for (const n of hexNeighbors(current)) {
      const id = hexToId(n);
      if (!visited.has(id)) {
        visited.add(id);
        queue.push(n);
      }
    }
  }

  return tiles;
}

// ── Spawn tile selection ──────────────────────────────────────────────────────

// Find the tile whose pixel position is closest to the given angle from origin.
function tileAtAngle(coords: HexCoord[], angleDeg: number): HexCoord {
  const rad = (angleDeg * Math.PI) / 180;
  const dir = { x: Math.cos(rad), y: Math.sin(rad) };
  let best = coords[0];
  let bestDot = -Infinity;

  for (const coord of coords) {
    const px = hexToPixel(coord, 1);
    const dot = px.x * dir.x + px.y * dir.y;
    if (dot > bestDot) {
      bestDot = dot;
      best = coord;
    }
  }
  return best;
}

// Angles from origin for each player count.
const SPAWN_ANGLES: Record<number, number[]> = {
  2: [30, 210],
  3: [90, 210, 330],
  4: [30, 150, 210, 330],
};

function selectSpawnCoords(coords: HexCoord[], playerCount: number): HexCoord[] {
  const angles = SPAWN_ANGLES[playerCount];
  const chosen: HexCoord[] = [];
  const usedIds = new Set<string>();

  for (const angle of angles) {
    // Exclude already-chosen spawns to avoid overlap
    const candidates = coords.filter(c => !usedIds.has(hexToId(c)));
    const spawn = tileAtAngle(candidates, angle);
    chosen.push(spawn);
    usedIds.add(hexToId(spawn));
  }

  return chosen;
}

// ── Main generator ────────────────────────────────────────────────────────────

export interface GeneratedBoard {
  tiles: Record<string, Tile>;
  spawnTileIds: string[];    // one per player, in player order
}

export function generateBoard(playerCount: number): GeneratedBoard {
  const tileCount = BOARD_SIZES[playerCount];
  if (!tileCount) throw new Error(`Unsupported player count: ${playerCount}`);

  const coords = generateCluster(tileCount);
  const spawnCoords = selectSpawnCoords(coords, playerCount);
  const spawnIds = new Set(spawnCoords.map(hexToId));

  const tiles: Record<string, Tile> = {};

  for (const coord of coords) {
    const id = hexToId(coord);
    const isSpawn = spawnIds.has(id);
    tiles[id] = {
      id,
      habitat: isSpawn ? 'open' : weightedRandomHabitat(),
      coord,
      ownerId: null,
      mushroomCardId: null,
      isSpawn,
      isBlight: false,
    };
  }

  return {
    tiles,
    spawnTileIds: spawnCoords.map(hexToId),
  };
}

// ── Starting network assignment ───────────────────────────────────────────────

// Assign spawn + 2 player-chosen adjacent tiles as the starting network.
// `chosenAdjacentIds` must be exactly 2 tiles adjacent to `spawnTileId` that are unowned.
export function assignStartingNetwork(
  tiles: Record<string, Tile>,
  spawnTileId: string,
  chosenAdjacentIds: [string, string],
  playerId: string,
): Record<string, Tile> {
  const updated = { ...tiles };
  const networkIds = [spawnTileId, ...chosenAdjacentIds];

  for (const id of networkIds) {
    if (!updated[id]) throw new Error(`Tile not found: ${id}`);
    updated[id] = { ...updated[id], ownerId: playerId };
  }

  return updated;
}

// ── Adjacency lookup ──────────────────────────────────────────────────────────

export function getAdjacentTileIds(tileId: string, tiles: Record<string, Tile>): string[] {
  const coord = idToHex(tileId);
  return hexNeighbors(coord)
    .map(hexToId)
    .filter(id => id in tiles);
}

// ── Blight tile selection (Autumn — Blight effect) ────────────────────────────

// Selects 3–5 random unoccupied tiles to become blight.
export function applyBlightTiles(
  tiles: Record<string, Tile>,
  count: number,
): Record<string, Tile> {
  const candidates = Object.values(tiles).filter(
    t => !t.ownerId && !t.isBlight && !t.isSpawn
  );

  // Fisher-Yates partial shuffle to pick `count` tiles
  const pool = [...candidates];
  const selected: Tile[] = [];
  const pickCount = Math.min(count, pool.length);

  for (let i = 0; i < pickCount; i++) {
    const j = i + Math.floor(Math.random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
    selected.push(pool[i]);
  }

  const updated = { ...tiles };
  for (const tile of selected) {
    updated[tile.id] = { ...tile, isBlight: true };
  }
  return updated;
}

// ── Spread cost override map ───────────────────────────────────────────────────

// Stores per-tile cost overrides (e.g. from Indigo Milky Cap).
// Tile ids mapped to their override cost.
export type SpreadCostOverrides = Record<string, number>;
