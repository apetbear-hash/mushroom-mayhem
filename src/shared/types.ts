import type { HABITATS, TYPES, RESOURCES, SEASONS } from './constants';

// ── Primitives ────────────────────────────────────────────────────────────────

export type Habitat      = typeof HABITATS[number];
export type MushroomType = typeof TYPES[number];
export type Resource     = typeof RESOURCES[number];
export type Season       = typeof SEASONS[number];

export type ResourceBundle = Record<Resource, number>;

// ── Hex grid ──────────────────────────────────────────────────────────────────

export interface HexCoord {
  q: number;
  r: number;
}

// ── Board ─────────────────────────────────────────────────────────────────────

export interface Tile {
  id: string;
  habitat: Habitat;
  coord: HexCoord;
  ownerId: string | null;
  mushroomCardId: number | null;
  isSpawn: boolean;
  isBlight: boolean;
}

// ── Cards ─────────────────────────────────────────────────────────────────────

export interface CardDefinition {
  id: number;
  name: string;
  scientificName: string;
  cost: number;
  pts: number;
  generates: Partial<ResourceBundle>;
  habitats: Habitat[];
  type: MushroomType;
  isOngoing: boolean;
  power: string;
}

export interface PlacedMushroom {
  cardId: number;
  playerId: string;
  tileId: string;
  turnsOnBoard: number;
}

// ── Players ───────────────────────────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  color: string;        // hex color chosen at setup
  portrait: string;     // portrait id chosen at setup (e.g. 'fox')
  resources: ResourceBundle;
  networkTileIds: string[];
  hand: number[];       // card ids in hand
  score: number;
  turnOrder: number;    // 0-indexed position in turn order
}

// ── Seasons ───────────────────────────────────────────────────────────────────

export type SpringEffect  = 'thaw' | 'spring_rain' | 'germination_gamble' | 'creeping_mist' | 'sluggish_soil';
export type SummerEffect  = 'long_days' | 'abundant_canopy' | 'drought' | 'scorching_heat' | 'mild_summer';
export type AutumnEffect  = 'mushroom_festival' | 'spore_wind' | 'blight' | 'long_summer' | 'decay_bloom';
export type WinterEffect  = 'deep_freeze' | 'mycelium_harmony' | 'mild_winter' | 'winter_stores' | 'final_harvest';

export type SeasonEffect  = SpringEffect | SummerEffect | AutumnEffect | WinterEffect;

export type SeasonForecast = {
  spring: SpringEffect;
  summer: SummerEffect;
  autumn: AutumnEffect;
  winter: WinterEffect;
};

// ── Turn & actions ────────────────────────────────────────────────────────────

export type ActionType = 'draw' | 'spread' | 'plant' | 'rest';
export type TurnPhase  = 'action' | 'collect';

export interface TurnState {
  actionType: ActionType | null;  // action type chosen this turn
  restUsed: boolean;
  cardsDrawnThisTurn: number;     // escalating draw cost: nth card costs n sunlight
}

// ── Pigskin Puffball spread blocks ────────────────────────────────────────────

export interface PigskinBlock {
  tileId: string;           // tile the Pigskin was planted on
  blockingPlayerId: string; // player who owns the Pigskin
  untilTurn: number;        // inclusive last turn the block is active
}

// ── Hen's Egg Stinkhorn free spread (triggers the turn AFTER planting) ────────

export interface PendingFreeSpread {
  playerId: string;
  spreadsRemaining: number; // always 2 when created
}

// ── Game state ────────────────────────────────────────────────────────────────

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  currentTurn: number;       // 1–20
  phase: TurnPhase;
  turnState: TurnState;
  tiles: Record<string, Tile>;
  placedMushrooms: PlacedMushroom[];
  deck: number[];            // remaining card ids
  discard: number[];         // discarded card ids
  forecast: SeasonForecast;
  blightTileIds: string[];
  spreadCostOverrides: Record<string, number>; // tileId → fixed cost (Indigo Milky Cap)
  pigskinBlocks: PigskinBlock[];
  pendingFreeSpreads: PendingFreeSpread[];
  isOver: boolean;
}
