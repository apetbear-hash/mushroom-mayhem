import type { BalanceAnalysis, BalanceFinding, Severity } from './analyzer';
import type { SimulationReport } from '../simulation/stats';

// ── Markdown report ───────────────────────────────────────────────────────────

const SEVERITY_ICON: Record<Severity, string> = {
  critical: '🔴',
  warning:  '🟡',
  info:     '🔵',
};

const CATEGORY_LABEL: Record<string, string> = {
  card:          '🍄 Card Balance',
  position:      '📍 Starting Position',
  season_effect: '🌿 Season Effect',
  spread_cost:   '💧 Spread Cost Curve',
};

function groupByCategory(findings: BalanceFinding[]): Map<string, BalanceFinding[]> {
  const map = new Map<string, BalanceFinding[]>();
  for (const f of findings) {
    const list = map.get(f.category) ?? [];
    list.push(f);
    map.set(f.category, list);
  }
  return map;
}

export function formatMarkdownReport(
  analysis: BalanceAnalysis,
  simReport: SimulationReport,
): string {
  const lines: string[] = [];
  const date = new Date(analysis.generatedAt).toLocaleString();

  lines.push(`# Mushroom Mayhem — Balance Report`);
  lines.push(`**Generated:** ${date}  `);
  lines.push(`**Player count:** ${analysis.playerCount}  `);
  lines.push(`**Games analysed:** ${analysis.gamesAnalysed}\n`);

  // Summary box
  lines.push(`## Summary`);
  lines.push(`| Severity | Count |`);
  lines.push(`|----------|-------|`);
  lines.push(`| ${SEVERITY_ICON.critical} Critical | ${analysis.criticalCount} |`);
  lines.push(`| ${SEVERITY_ICON.warning} Warning  | ${analysis.warningCount} |`);
  lines.push(`| ${SEVERITY_ICON.info} Info     | ${analysis.infoCount} |`);
  lines.push('');

  // Score and position stats
  lines.push(`## Score Statistics`);
  lines.push(`- Avg winning score: **${simReport.avgWinningScore.toFixed(1)}**`);
  lines.push(`- Avg losing score: **${simReport.avgLosingScore.toFixed(1)}**`);
  lines.push(`- Error rate: **${(simReport.errorRate * 100).toFixed(1)}%**\n`);

  lines.push(`### Win Rate by Starting Position`);
  lines.push(`| Position | Win Rate | Avg Score |`);
  lines.push(`|----------|----------|-----------|`);
  simReport.positionStats.forEach((s, i) => {
    const wr = s.gamesPlayed > 0 ? ((s.wins / s.gamesPlayed) * 100).toFixed(1) + '%' : 'N/A';
    const avg = s.gamesPlayed > 0 ? (s.totalScore / s.gamesPlayed).toFixed(1) : 'N/A';
    lines.push(`| ${i + 1} | ${wr} | ${avg} |`);
  });
  lines.push('');

  // Card play rates
  lines.push(`### Most Played Cards`);
  lines.push(`| Card | Play Rate |`);
  lines.push(`|------|-----------|`);
  simReport.topCards.forEach(c => {
    lines.push(`| #${c.cardId} ${c.name} | ${(c.playRate * 100).toFixed(1)}% |`);
  });
  lines.push('');

  lines.push(`### Least Played Cards`);
  lines.push(`| Card | Play Rate |`);
  lines.push(`|------|-----------|`);
  simReport.bottomCards.forEach(c => {
    lines.push(`| #${c.cardId} ${c.name} | ${(c.playRate * 100).toFixed(1)}% |`);
  });
  lines.push('');

  // Findings grouped by category
  lines.push(`## Findings`);

  if (analysis.findings.length === 0) {
    lines.push(`_No imbalances detected at current thresholds._`);
  } else {
    const grouped = groupByCategory(analysis.findings);
    for (const [category, catFindings] of grouped) {
      lines.push(`### ${CATEGORY_LABEL[category] ?? category}`);
      for (const f of catFindings) {
        lines.push(`#### ${SEVERITY_ICON[f.severity]} ${f.subject}`);
        lines.push(`**Observation:** ${f.observation}  `);
        lines.push(`**Suggestion:** ${f.suggestion}\n`);
      }
    }
  }

  // Errors
  if (simReport.errors.length > 0) {
    lines.push(`## Simulation Errors (sample)`);
    simReport.errors.forEach(e => lines.push(`- \`${e}\``));
  }

  lines.push(`\n---\n_This report is for human review only. Do not modify game-spec.md without reviewing these findings._`);

  return lines.join('\n');
}

// ── Browser download ──────────────────────────────────────────────────────────

export function downloadReport(markdown: string, playerCount: number): void {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `balance-report-${playerCount}p-${timestamp}.md`;
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── JSON export ───────────────────────────────────────────────────────────────

export function downloadJSON(analysis: BalanceAnalysis, simReport: SimulationReport): void {
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `balance-data-${analysis.playerCount}p-${timestamp}.json`;
  const payload = JSON.stringify({ analysis, simReport }, null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
