import type { GameState } from '../../shared/types';
import { getAdjacentTileIds as _getAdjacentTileIds } from './boardGenerator';

export { generateBoard } from './boardGenerator';
export { assignStartingNetwork } from './boardGenerator';
export { applyBlightTiles } from './boardGenerator';
export type { GeneratedBoard, SpreadCostOverrides } from './boardGenerator';
export { BoardComponent } from './BoardComponent';
export * from './hexMath';

// ── Adjacency lookup for use by other agents ──────────────────────────────────
// This is the function imported by powers.ts via require('../board').

export function getAdjacentTiles(tileId: string, state: GameState): string[] {
  return _getAdjacentTileIds(tileId, state.tiles);
}
