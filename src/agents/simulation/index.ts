import { runGame, buildAIDrafts } from './gameRunner';
import { StatsAccumulator, formatReport } from './stats';
import type { SimulationReport } from './stats';

export { runGame, buildAIDrafts } from './gameRunner';
export { StatsAccumulator, formatReport } from './stats';
export type { SimulationReport } from './stats';
export type { GameResult } from './gameRunner';
export { createInitialGameState } from './gameInit';

// ── Batch simulation runner ───────────────────────────────────────────────────

export interface SimConfig {
  playerCount: 2 | 3 | 4;
  gamesPerCount: number;
  onProgress?: (done: number, total: number) => void;
}

export function runSimulation(config: SimConfig): SimulationReport {
  const { playerCount, gamesPerCount, onProgress } = config;
  const acc = new StatsAccumulator(playerCount);

  for (let i = 0; i < gamesPerCount; i++) {
    const drafts = buildAIDrafts(playerCount);
    const result = runGame(playerCount, drafts);
    acc.record(result);
    if (onProgress) onProgress(i + 1, gamesPerCount);
  }

  return acc.build();
}

// ── Multi-player-count batch ──────────────────────────────────────────────────

export interface FullSimConfig {
  gamesPerCount: number;
  onProgress?: (playerCount: number, done: number, total: number) => void;
}

export function runFullSimulation(config: FullSimConfig): Record<number, SimulationReport> {
  const results: Record<number, SimulationReport> = {};

  for (const pc of [2, 3, 4] as const) {
    results[pc] = runSimulation({
      playerCount: pc,
      gamesPerCount: config.gamesPerCount,
      onProgress: config.onProgress
        ? (done, total) => config.onProgress!(pc, done, total)
        : undefined,
    });
  }

  return results;
}

// ── Console report helper (Node / dev use) ────────────────────────────────────

export function printSimulationReport(report: SimulationReport): void {
  console.log(formatReport(report));
}
