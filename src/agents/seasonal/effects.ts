import type {
  GameState, Player, SeasonForecast,
  SpringEffect, SummerEffect, AutumnEffect, WinterEffect,
} from '../../shared/types';
import { SEASON_TURNS } from '../../shared/constants';
import { applyBlightTiles } from '../board/boardGenerator';
import { getAdjacentTileIds } from '../board/boardGenerator';

// ── Effect pools ──────────────────────────────────────────────────────────────

const SPRING_EFFECTS: SpringEffect[] = [
  'thaw', 'spring_rain', 'germination_gamble', 'creeping_mist', 'sluggish_soil',
];
const SUMMER_EFFECTS: SummerEffect[] = [
  'long_days', 'abundant_canopy', 'drought', 'scorching_heat', 'mild_summer',
];
const AUTUMN_EFFECTS: AutumnEffect[] = [
  'mushroom_festival', 'spore_wind', 'blight', 'long_summer', 'decay_bloom',
];
const WINTER_EFFECTS: WinterEffect[] = [
  'deep_freeze', 'mycelium_harmony', 'mild_winter', 'winter_stores', 'final_harvest',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function selectSeasonalEffects(): SeasonForecast {
  return {
    spring: pick(SPRING_EFFECTS),
    summer: pick(SUMMER_EFFECTS),
    autumn: pick(AUTUMN_EFFECTS),
    winter: pick(WINTER_EFFECTS),
  };
}

// ── Season boundary detection ─────────────────────────────────────────────────

export function isSeasonStart(turn: number): boolean {
  return Object.values(SEASON_TURNS).some(([start]) => start === turn);
}

export function isSeasonEnd(turn: number): boolean {
  return Object.values(SEASON_TURNS).some(([, end]) => end === turn);
}

// ── Season-start triggers ─────────────────────────────────────────────────────

function updateAllPlayers(state: GameState, fn: (p: Player) => Player): GameState {
  return { ...state, players: state.players.map(fn) };
}

// Called once when turn === season start turn, before the first player acts.
export function applySeasonStart(state: GameState): GameState {
  const turn = state.currentTurn;
  let s = state;

  // ── Spring ────────────────────────────────────────────────────────────────
  if (turn === SEASON_TURNS.spring[0]) {
    if (state.forecast.spring === 'spring_rain') {
      s = updateAllPlayers(s, p => ({
        ...p, resources: { ...p.resources, moisture: p.resources.moisture + 3 },
      }));
    }
    if (state.forecast.spring === 'thaw') {
      s = applyNetworkExpansionAll(s);
    }
  }

  // ── Summer ────────────────────────────────────────────────────────────────
  if (turn === SEASON_TURNS.summer[0]) {
    if (state.forecast.summer === 'drought') {
      s = updateAllPlayers(s, p => ({
        ...p, resources: { ...p.resources, moisture: 0 },
      }));
    }
  }

  // ── Autumn ────────────────────────────────────────────────────────────────
  if (turn === SEASON_TURNS.autumn[0]) {
    if (state.forecast.autumn === 'spore_wind') {
      // +4 spores to all players + each player's network auto-expands by 1 random adjacent tile
      s = updateAllPlayers(s, p => ({
        ...p, resources: { ...p.resources, spore: p.resources.spore + 4 },
      }));
      s = applySporeWindExpansion(s);
    }

    if (state.forecast.autumn === 'blight') {
      const blightCount = 3 + Math.floor(Math.random() * 3); // 3–5
      s = { ...s, tiles: applyBlightTiles(s.tiles, blightCount) };
    }

    // Scarlet Waxy Cap (id 49): if on board at Autumn start, place 2 free copies on adjacent network tiles
    s = applyScarletWaxyCap(s);
  }

  // ── Winter ────────────────────────────────────────────────────────────────
  if (turn === SEASON_TURNS.winter[0]) {
    if (state.forecast.winter === 'winter_stores') {
      s = updateAllPlayers(s, p => ({
        ...p,
        resources: {
          spore:    p.resources.spore    + 2,
          moisture: p.resources.moisture + 2,
          sunlight: p.resources.sunlight + 2,
        },
      }));
    }
  }

  return s;
}

// ── Season-end triggers ───────────────────────────────────────────────────────

// Called once after the last player's collect phase in the final turn of a season.
// Pass endedTurn explicitly when calling after advanceTurn() has already incremented currentTurn.
export function applySeasonEnd(state: GameState, endedTurn?: number): GameState {
  const turn = endedTurn ?? state.currentTurn;
  let s = state;

  if (turn === SEASON_TURNS.spring[1]) {
    if (state.forecast.spring === 'thaw') {
      s = applyNetworkExpansionAll(s);
    }
  }

  if (turn === SEASON_TURNS.autumn[1]) {
    if (state.forecast.autumn === 'mushroom_festival') {
      s = updateAllPlayers(s, p => {
        const count = s.placedMushrooms.filter(m => m.playerId === p.id).length;
        return { ...p, score: p.score + count };
      });
    }
  }

  return s;
}

// ── Network expansion helper (used by Thaw, Spore Wind) ──────────────────────

// Expands each player's network by 1 random adjacent unoccupied tile.
function applyNetworkExpansionAll(state: GameState): GameState {
  let s = state;

  for (const player of state.players) {
    const candidates = new Set<string>();
    for (const tileId of player.networkTileIds) {
      for (const adjId of getAdjacentTileIds(tileId, s.tiles)) {
        const t = s.tiles[adjId];
        if (t && !t.ownerId && !t.isBlight) candidates.add(adjId);
      }
    }

    if (candidates.size === 0) continue;

    const pool = Array.from(candidates);
    const chosen = pool[Math.floor(Math.random() * pool.length)];

    s = {
      ...s,
      tiles: { ...s.tiles, [chosen]: { ...s.tiles[chosen], ownerId: player.id } },
      players: s.players.map(p =>
        p.id === player.id
          ? { ...p, networkTileIds: [...p.networkTileIds, chosen] }
          : p,
      ),
    };
  }

  return s;
}

function applySporeWindExpansion(state: GameState): GameState {
  return applyNetworkExpansionAll(state);
}

// ── Scarlet Waxy Cap trigger (id 49) ─────────────────────────────────────────

function applyScarletWaxyCap(state: GameState): GameState {
  let s = state;

  for (const mushroom of state.placedMushrooms) {
    if (mushroom.cardId !== 49) continue;

    const player = s.players.find(p => p.id === mushroom.playerId)!;
    const adjIds = getAdjacentTileIds(mushroom.tileId, s.tiles);

    // Find up to 2 empty tiles in the player's network
    const targets = adjIds
      .filter(id => {
        const t = s.tiles[id];
        return t && player.networkTileIds.includes(id) && !t.mushroomCardId && !t.isBlight;
      })
      .slice(0, 2);

    for (const tileId of targets) {
      const copy = { cardId: 49, playerId: mushroom.playerId, tileId, turnsOnBoard: 0 };
      s = {
        ...s,
        placedMushrooms: [...s.placedMushrooms, copy],
        tiles: { ...s.tiles, [tileId]: { ...s.tiles[tileId], mushroomCardId: 49 } },
      };
    }
  }

  return s;
}
