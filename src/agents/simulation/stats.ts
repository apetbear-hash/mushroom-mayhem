import type { GameResult } from './gameRunner';
import { getCard } from '../card/cards';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PositionStats {
  wins: number;
  gamesPlayed: number;
  totalScore: number;
}

export interface CardStats {
  cardId: number;
  name: string;
  timesPlayed: number;
  playRate: number; // fraction of games it was played in
}

export interface SeasonEffectStats {
  effectKey: string;
  gamesActive: number;
  winnerWasP0: number; // proxy for "did first player win more with this effect"
}

export interface SimulationReport {
  playerCount: number;
  gamesRun: number;
  positionStats: PositionStats[];   // index = start position (turnOrder)
  topCards: CardStats[];            // sorted by play rate desc
  bottomCards: CardStats[];         // sorted by play rate asc
  seasonEffectStats: Record<string, SeasonEffectStats>;
  avgWinningScore: number;
  avgLosingScore: number;
  errorRate: number;                // fraction of games with at least 1 error
  errors: string[];                 // first 20 distinct errors seen
}

// ── Accumulator ───────────────────────────────────────────────────────────────

export class StatsAccumulator {
  private readonly playerCount: number;
  private gamesRun = 0;
  private positionStats: PositionStats[];
  private cardPlayCounts: Record<number, number> = {};
  private cardGamesPlayed: Record<number, number> = {};
  private seasonEffectStats: Record<string, SeasonEffectStats> = {};
  private totalWinningScore = 0;
  private totalLosingScore = 0;
  private losingScoreCount = 0;
  private errorCount = 0;
  private seenErrors = new Set<string>();
  private errorSample: string[] = [];

  constructor(playerCount: number) {
    this.playerCount = playerCount;
    this.positionStats = Array.from({ length: playerCount }, () => ({
      wins: 0, gamesPlayed: 0, totalScore: 0,
    }));
  }

  record(result: GameResult): void {
    this.gamesRun++;

    // Position stats
    for (let i = 0; i < result.scores.length; i++) {
      const pos = result.finalState.players[i].turnOrder;
      if (pos < this.positionStats.length) {
        this.positionStats[pos].gamesPlayed++;
        this.positionStats[pos].totalScore += result.scores[i];
      }
    }
    if (result.winnerIndex >= 0) {
      const winPos = result.winnerStartPosition;
      if (winPos >= 0 && winPos < this.positionStats.length) {
        this.positionStats[winPos].wins++;
      }
      this.totalWinningScore += result.scores[result.winnerIndex];
      result.scores.forEach((s, i) => {
        if (i !== result.winnerIndex) {
          this.totalLosingScore += s;
          this.losingScoreCount++;
        }
      });
    }

    // Card stats
    for (const [idStr, count] of Object.entries(result.cardPlayCounts)) {
      const id = Number(idStr);
      this.cardPlayCounts[id] = (this.cardPlayCounts[id] ?? 0) + count;
      this.cardGamesPlayed[id] = (this.cardGamesPlayed[id] ?? 0) + (count > 0 ? 1 : 0);
    }

    // Season effect stats
    const forecast = result.finalState.forecast;
    for (const [, effectKey] of Object.entries(forecast)) {
      const key = effectKey as string;
      if (!this.seasonEffectStats[key]) {
        this.seasonEffectStats[key] = { effectKey: key, gamesActive: 0, winnerWasP0: 0 };
      }
      this.seasonEffectStats[key].gamesActive++;
      if (result.winnerIndex === 0) this.seasonEffectStats[key].winnerWasP0++;
    }

    // Errors
    if (result.errors.length > 0) {
      this.errorCount++;
      for (const e of result.errors) {
        if (!this.seenErrors.has(e) && this.errorSample.length < 20) {
          this.seenErrors.add(e);
          this.errorSample.push(e);
        }
      }
    }
  }

  build(): SimulationReport {
    const allCardIds = Array.from(
      new Set([...Object.keys(this.cardPlayCounts).map(Number)]),
    );

    const cardStats: CardStats[] = allCardIds.map(id => {
      let name = `Card ${id}`;
      try { name = getCard(id).name; } catch { /* ignore */ }
      return {
        cardId: id,
        name,
        timesPlayed: this.cardPlayCounts[id] ?? 0,
        playRate: (this.cardGamesPlayed[id] ?? 0) / this.gamesRun,
      };
    });
    cardStats.sort((a, b) => b.playRate - a.playRate);

    return {
      playerCount: this.playerCount,
      gamesRun: this.gamesRun,
      positionStats: this.positionStats,
      topCards: cardStats.slice(0, 10),
      bottomCards: [...cardStats].reverse().slice(0, 10),
      seasonEffectStats: this.seasonEffectStats,
      avgWinningScore: this.gamesRun > 0 ? this.totalWinningScore / this.gamesRun : 0,
      avgLosingScore: this.losingScoreCount > 0 ? this.totalLosingScore / this.losingScoreCount : 0,
      errorRate: this.gamesRun > 0 ? this.errorCount / this.gamesRun : 0,
      errors: this.errorSample,
    };
  }
}

// ── Formatting ────────────────────────────────────────────────────────────────

export function formatReport(report: SimulationReport): string {
  const lines: string[] = [];
  const pct = (n: number, d: number) => d > 0 ? `${((n / d) * 100).toFixed(1)}%` : 'N/A';
  const avg = (total: number, count: number) => count > 0 ? (total / count).toFixed(1) : 'N/A';

  lines.push(`=== Mushroom Mayhem Simulation Report ===`);
  lines.push(`Player count: ${report.playerCount}   Games run: ${report.gamesRun}`);
  lines.push(`Avg winning score: ${report.avgWinningScore.toFixed(1)}   Avg losing score: ${report.avgLosingScore.toFixed(1)}`);
  lines.push(`Error rate: ${pct(report.errorRate * report.gamesRun, report.gamesRun)}\n`);

  lines.push(`--- Win Rate by Starting Position ---`);
  report.positionStats.forEach((s, i) => {
    lines.push(`  Position ${i + 1}: ${pct(s.wins, s.gamesPlayed)} wins  (avg score ${avg(s.totalScore, s.gamesPlayed)})`);
  });

  lines.push(`\n--- Most Played Cards ---`);
  report.topCards.forEach(c => {
    lines.push(`  #${c.cardId} ${c.name}: ${(c.playRate * 100).toFixed(1)}% of games`);
  });

  lines.push(`\n--- Least Played Cards ---`);
  report.bottomCards.forEach(c => {
    lines.push(`  #${c.cardId} ${c.name}: ${(c.playRate * 100).toFixed(1)}% of games`);
  });

  lines.push(`\n--- Season Effect Stats (P1 win rate when active) ---`);
  const sortedEffects = Object.values(report.seasonEffectStats)
    .sort((a, b) => b.gamesActive - a.gamesActive);
  sortedEffects.forEach(e => {
    lines.push(`  ${e.effectKey}: P1 won ${pct(e.winnerWasP0, e.gamesActive)} (n=${e.gamesActive})`);
  });

  if (report.errors.length > 0) {
    lines.push(`\n--- Errors (sample) ---`);
    report.errors.forEach(e => lines.push(`  ${e}`));
  }

  return lines.join('\n');
}
