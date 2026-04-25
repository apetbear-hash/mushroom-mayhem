import type { SimulationReport } from '../simulation/stats';
import { getCard } from '../card/cards';

// ── Thresholds ────────────────────────────────────────────────────────────────

const CARD_NEVER_PLAYED_RATE   = 0.05;  // < 5% of games
const CARD_DOMINANT_RATE       = 0.70;  // > 70% of games
const POSITION_SWING_FACTOR    = 1.40;  // win rate > 140% of expected
const POSITION_LOW_FACTOR      = 0.60;  // win rate < 60% of expected
const EFFECT_SWING_FACTOR      = 1.35;  // P1 win rate > 135% of baseline

// ── Finding types ─────────────────────────────────────────────────────────────

export type Severity = 'critical' | 'warning' | 'info';

export interface BalanceFinding {
  category: 'card' | 'position' | 'season_effect' | 'spread_cost';
  severity: Severity;
  subject: string;
  observation: string;
  suggestion: string;
}

// ── Card analysis ─────────────────────────────────────────────────────────────

function analyseCards(report: SimulationReport): BalanceFinding[] {
  const findings: BalanceFinding[] = [];
  const allCards = [...report.topCards, ...report.bottomCards];
  const seen = new Set<number>();

  for (const c of allCards) {
    if (seen.has(c.cardId)) continue;
    seen.add(c.cardId);

    let card;
    try { card = getCard(c.cardId); } catch { continue; }

    // Never played
    if (c.playRate < CARD_NEVER_PLAYED_RATE) {
      const isExpensive = card.cost >= 4;
      findings.push({
        category: 'card',
        severity: c.playRate === 0 ? 'critical' : 'warning',
        subject: `#${card.id} ${card.name}`,
        observation: `Played in only ${(c.playRate * 100).toFixed(1)}% of games.`,
        suggestion: isExpensive
          ? `Reduce cost from ${card.cost} to ${card.cost - 1}, or add a small pts bonus.`
          : `Review power — it may be outclassed by alternatives in the same habitat.`,
      });
    }

    // Dominating
    if (c.playRate > CARD_DOMINANT_RATE) {
      findings.push({
        category: 'card',
        severity: c.playRate > 0.90 ? 'critical' : 'warning',
        subject: `#${card.id} ${card.name}`,
        observation: `Played in ${(c.playRate * 100).toFixed(1)}% of games — likely crowding out alternatives.`,
        suggestion: card.pts > 3
          ? `Reduce pts from ${card.pts} to ${card.pts - 1}, or raise cost to ${card.cost + 1}.`
          : `Reduce ongoing value or add a meaningful counter-play condition.`,
      });
    }

    // High cost, rarely played — undervalued
    if (card.cost >= 4 && c.playRate < 0.20 && c.playRate >= CARD_NEVER_PLAYED_RATE) {
      findings.push({
        category: 'card',
        severity: 'info',
        subject: `#${card.id} ${card.name}`,
        observation: `Costly (${card.cost}🍄) but only played in ${(c.playRate * 100).toFixed(1)}% of games.`,
        suggestion: `Consider reducing cost to ${card.cost - 1} or increasing pts by 1.`,
      });
    }

    // Zero pts, low play rate — possibly a trap card
    if (card.pts === 0 && c.playRate < 0.15) {
      findings.push({
        category: 'card',
        severity: 'info',
        subject: `#${card.id} ${card.name}`,
        observation: `0-pt card with ${(c.playRate * 100).toFixed(1)}% play rate — may feel unrewarding.`,
        suggestion: `Strengthen power effect or add a token 1-pt bonus to incentivise play.`,
      });
    }
  }

  return findings;
}

// ── Position analysis ─────────────────────────────────────────────────────────

function analysePositions(report: SimulationReport): BalanceFinding[] {
  const findings: BalanceFinding[] = [];
  const expected = 1 / report.playerCount;

  for (let i = 0; i < report.positionStats.length; i++) {
    const pos = report.positionStats[i];
    if (pos.gamesPlayed === 0) continue;

    const winRate = pos.wins / pos.gamesPlayed;
    const label = `Position ${i + 1} (${i === 0 ? 'first' : i === report.playerCount - 1 ? 'last' : `${i + 1}th`})`;

    if (winRate > expected * POSITION_SWING_FACTOR) {
      findings.push({
        category: 'position',
        severity: winRate > expected * 1.6 ? 'critical' : 'warning',
        subject: label,
        observation: `Win rate ${(winRate * 100).toFixed(1)}% vs expected ${(expected * 100).toFixed(1)}%.`,
        suggestion: i === 0
          ? `First-player advantage is too high. Consider a catch-up mechanic or reducing starting moisture.`
          : `Spawn position ${i + 1} may have superior tile access. Review board generation placement angles.`,
      });
    }

    if (winRate < expected * POSITION_LOW_FACTOR) {
      findings.push({
        category: 'position',
        severity: winRate < expected * 0.4 ? 'critical' : 'warning',
        subject: label,
        observation: `Win rate ${(winRate * 100).toFixed(1)}% — significantly below expected ${(expected * 100).toFixed(1)}%.`,
        suggestion: `Late positions may be crowded out. Consider granting +1 extra spore or moisture to players in positions 3+.`,
      });
    }

    // Score gap check
    const avgScore = pos.totalScore / pos.gamesPlayed;
    if (avgScore < report.avgLosingScore * 0.80) {
      findings.push({
        category: 'position',
        severity: 'info',
        subject: label,
        observation: `Average score ${avgScore.toFixed(1)} is well below overall losing average ${report.avgLosingScore.toFixed(1)}.`,
        suggestion: `Spread cost curve may be penalising late starters. Review BOARD_SIZES and spawn adjacency.`,
      });
    }
  }

  return findings;
}

// ── Season effect analysis ────────────────────────────────────────────────────

function analyseSeasonEffects(report: SimulationReport): BalanceFinding[] {
  const findings: BalanceFinding[] = [];
  const baselineP1WinRate = 1 / report.playerCount;

  for (const e of Object.values(report.seasonEffectStats)) {
    if (e.gamesActive < 10) continue; // too few samples

    const p1WinRate = e.winnerWasP0 / e.gamesActive;

    if (p1WinRate > baselineP1WinRate * EFFECT_SWING_FACTOR) {
      findings.push({
        category: 'season_effect',
        severity: 'warning',
        subject: e.effectKey,
        observation: `First player wins ${(p1WinRate * 100).toFixed(1)}% of games when ${e.effectKey} is active (baseline ${(baselineP1WinRate * 100).toFixed(1)}%).`,
        suggestion: `Effect may disproportionately benefit the first player. Consider delaying trigger to turn 2 or adding a reactive benefit for other players.`,
      });
    }

    if (p1WinRate < baselineP1WinRate * (1 / EFFECT_SWING_FACTOR)) {
      findings.push({
        category: 'season_effect',
        severity: 'info',
        subject: e.effectKey,
        observation: `First player wins only ${(p1WinRate * 100).toFixed(1)}% when ${e.effectKey} is active — may favour late positions.`,
        suggestion: `Review whether the effect inherently rewards larger networks (typical of later players).`,
      });
    }
  }

  return findings;
}

// ── Spread cost analysis ──────────────────────────────────────────────────────

function analyseSpreadCosts(report: SimulationReport): BalanceFinding[] {
  const findings: BalanceFinding[] = [];

  // Compare first vs last position average scores as a spread-cost proxy
  if (report.positionStats.length >= 2) {
    const first = report.positionStats[0];
    const last = report.positionStats[report.positionStats.length - 1];
    const firstAvg = first.gamesPlayed > 0 ? first.totalScore / first.gamesPlayed : 0;
    const lastAvg  = last.gamesPlayed  > 0 ? last.totalScore  / last.gamesPlayed  : 0;

    if (firstAvg > 0 && lastAvg / firstAvg < 0.75) {
      findings.push({
        category: 'spread_cost',
        severity: 'warning',
        subject: 'Spread cost curve',
        observation: `Last-position avg score (${lastAvg.toFixed(1)}) is ${((1 - lastAvg / firstAvg) * 100).toFixed(0)}% below first-position avg (${firstAvg.toFixed(1)}).`,
        suggestion: `Late starters may be priced out of competitive network sizes. Consider applying Thaw-like −1 spread discount to players whose network is ≤ the smallest network on the board.`,
      });
    }
  }

  return findings;
}

// ── Full analysis ─────────────────────────────────────────────────────────────

export interface BalanceAnalysis {
  playerCount: number;
  gamesAnalysed: number;
  findings: BalanceFinding[];
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  generatedAt: string;
}

export function analyseSimulation(report: SimulationReport): BalanceAnalysis {
  const findings: BalanceFinding[] = [
    ...analyseCards(report),
    ...analysePositions(report),
    ...analyseSeasonEffects(report),
    ...analyseSpreadCosts(report),
  ];

  // Sort: critical first, then warning, then info
  const order: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };
  findings.sort((a, b) => order[a.severity] - order[b.severity]);

  return {
    playerCount: report.playerCount,
    gamesAnalysed: report.gamesRun,
    findings,
    criticalCount: findings.filter(f => f.severity === 'critical').length,
    warningCount:  findings.filter(f => f.severity === 'warning').length,
    infoCount:     findings.filter(f => f.severity === 'info').length,
    generatedAt: new Date().toISOString(),
  };
}
