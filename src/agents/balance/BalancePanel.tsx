import { useState } from 'react';
import type { BalanceAnalysis, Severity } from './analyzer';
import type { SimulationReport } from '../simulation/stats';
import { analyseSimulation } from './analyzer';
import { formatMarkdownReport, downloadReport, downloadJSON } from './reportWriter';

const SEVERITY_ICON: Record<Severity, string> = { critical: '🔴', warning: '🟡', info: '🔵' };
const SEVERITY_COLOR: Record<Severity, string> = {
  critical: '#e05c5c', warning: '#e0a030', info: '#5c9ee0',
};
const CATEGORY_LABEL: Record<string, string> = {
  card: '🍄 Cards', position: '📍 Positions',
  season_effect: '🌿 Season Effects', spread_cost: '💧 Spread Costs',
};

interface BalancePanelProps {
  defaultPlayerCount?: 2 | 3 | 4;
}

export function BalancePanel({ defaultPlayerCount = 2 }: BalancePanelProps) {
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(defaultPlayerCount);
  const [gamesPerCount, setGamesPerCount] = useState(100);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analysis, setAnalysis] = useState<BalanceAnalysis | null>(null);
  const [simReport, setSimReport] = useState<SimulationReport | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  async function handleRun() {
    setRunning(true);
    setProgress(0);
    setAnalysis(null);
    setSimReport(null);

    // Yield to browser between batches
    await new Promise(r => setTimeout(r, 0));

    const batchSize = 10;
    let done = 0;
    const { StatsAccumulator, formatReport: _ } = await import('../simulation/stats');
    const { runGame, buildAIDrafts } = await import('../simulation/gameRunner');
    const acc = new StatsAccumulator(playerCount);

    while (done < gamesPerCount) {
      const batch = Math.min(batchSize, gamesPerCount - done);
      for (let i = 0; i < batch; i++) {
        const result = runGame(playerCount, buildAIDrafts(playerCount));
        acc.record(result);
      }
      done += batch;
      setProgress(Math.round((done / gamesPerCount) * 100));
      await new Promise(r => setTimeout(r, 0));
    }

    const report = acc.build();
    const balanceAnalysis = analyseSimulation(report);
    setSimReport(report);
    setAnalysis(balanceAnalysis);
    setRunning(false);
  }

  const filteredFindings = analysis?.findings.filter(
    f => !activeCategory || f.category === activeCategory,
  ) ?? [];

  const categories = analysis
    ? Array.from(new Set(analysis.findings.map(f => f.category)))
    : [];

  return (
    <div style={{
      background: '#0d0d1a', minHeight: '100vh', color: '#eee',
      fontFamily: 'sans-serif', padding: 24,
    }}>
      <h2 style={{ color: '#c9a84c', fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>
        Balance Agent
      </h2>
      <p style={{ color: '#555', fontSize: 12, marginBottom: 24 }}>
        Runs AI vs AI simulations and flags imbalances for human review. Does not modify the game spec.
      </p>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <div style={{ color: '#555', fontSize: 10, marginBottom: 4 }}>PLAYER COUNT</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {([2, 3, 4] as const).map(n => (
              <button key={n} onClick={() => setPlayerCount(n)} style={{
                background: playerCount === n ? '#c9a84c' : '#1a1a2e',
                color: playerCount === n ? '#111' : '#888',
                border: '1px solid #333', borderRadius: 6,
                padding: '6px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 13,
              }}>{n}P</button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ color: '#555', fontSize: 10, marginBottom: 4 }}>GAMES TO RUN</div>
          <select
            value={gamesPerCount}
            onChange={e => setGamesPerCount(Number(e.target.value))}
            style={{
              background: '#1a1a2e', border: '1px solid #333', borderRadius: 6,
              color: '#eee', padding: '6px 10px', fontSize: 13,
            }}
          >
            {[50, 100, 250, 500].map(n => (
              <option key={n} value={n}>{n} games</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleRun}
          disabled={running}
          style={{
            background: running ? '#333' : '#5cb85c', color: running ? '#666' : '#111',
            border: 'none', borderRadius: 8, padding: '10px 24px',
            fontWeight: 700, fontSize: 14, cursor: running ? 'not-allowed' : 'pointer',
            marginTop: 14,
          }}
        >
          {running ? `Running… ${progress}%` : 'Run Simulation'}
        </button>

        {analysis && simReport && (
          <>
            <button onClick={() => downloadReport(formatMarkdownReport(analysis, simReport), playerCount)}
              style={{ background: '#1a1a2e', color: '#c9a84c', border: '1px solid #c9a84c44', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontSize: 13, marginTop: 14 }}>
              ↓ Markdown
            </button>
            <button onClick={() => downloadJSON(analysis, simReport)}
              style={{ background: '#1a1a2e', color: '#5c9ee0', border: '1px solid #5c9ee044', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontSize: 13, marginTop: 14 }}>
              ↓ JSON
            </button>
          </>
        )}
      </div>

      {/* Progress bar */}
      {running && (
        <div style={{ background: '#1a1a2e', borderRadius: 4, height: 6, marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ background: '#5cb85c', height: '100%', width: `${progress}%`, transition: 'width 0.2s' }} />
        </div>
      )}

      {/* Results */}
      {analysis && simReport && (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>

          {/* Stats sidebar */}
          <div style={{ width: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ background: '#1a1a2e', borderRadius: 10, padding: 14 }}>
              <div style={{ color: '#555', fontSize: 10, marginBottom: 8 }}>SUMMARY</div>
              {(['critical', 'warning', 'info'] as Severity[]).map(s => (
                <div key={s} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: SEVERITY_COLOR[s], fontSize: 12 }}>{SEVERITY_ICON[s]} {s}</span>
                  <span style={{ color: '#eee', fontWeight: 700, fontSize: 12 }}>
                    {analysis.findings.filter(f => f.severity === s).length}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ background: '#1a1a2e', borderRadius: 10, padding: 14 }}>
              <div style={{ color: '#555', fontSize: 10, marginBottom: 8 }}>SCORES</div>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 3 }}>
                Avg win: <strong style={{ color: '#eee' }}>{simReport.avgWinningScore.toFixed(1)}</strong>
              </div>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 3 }}>
                Avg loss: <strong style={{ color: '#eee' }}>{simReport.avgLosingScore.toFixed(1)}</strong>
              </div>
              <div style={{ fontSize: 11, color: '#aaa' }}>
                Errors: <strong style={{ color: simReport.errorRate > 0.05 ? '#e05c5c' : '#5cb85c' }}>
                  {(simReport.errorRate * 100).toFixed(1)}%
                </strong>
              </div>
            </div>

            {/* Category filter */}
            <div style={{ background: '#1a1a2e', borderRadius: 10, padding: 14 }}>
              <div style={{ color: '#555', fontSize: 10, marginBottom: 8 }}>FILTER</div>
              <button onClick={() => setActiveCategory(null)} style={{
                display: 'block', width: '100%', textAlign: 'left', background: !activeCategory ? '#2a2a3e' : 'transparent',
                border: 'none', color: !activeCategory ? '#eee' : '#666', padding: '4px 6px', borderRadius: 4, cursor: 'pointer', fontSize: 11, marginBottom: 2,
              }}>All categories</button>
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat === activeCategory ? null : cat)} style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  background: activeCategory === cat ? '#2a2a3e' : 'transparent',
                  border: 'none', color: activeCategory === cat ? '#eee' : '#666',
                  padding: '4px 6px', borderRadius: 4, cursor: 'pointer', fontSize: 11, marginBottom: 2,
                }}>{CATEGORY_LABEL[cat] ?? cat}</button>
              ))}
            </div>
          </div>

          {/* Findings list */}
          <div style={{ flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredFindings.length === 0 && (
              <div style={{ color: '#555', fontSize: 13, padding: 16 }}>
                No findings for this category.
              </div>
            )}
            {filteredFindings.map((f, i) => (
              <div key={i} style={{
                background: '#1a1a2e',
                border: `1px solid ${SEVERITY_COLOR[f.severity]}44`,
                borderLeft: `3px solid ${SEVERITY_COLOR[f.severity]}`,
                borderRadius: 8, padding: '10px 14px',
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 12 }}>{SEVERITY_ICON[f.severity]}</span>
                  <span style={{ color: '#eee', fontWeight: 700, fontSize: 13 }}>{f.subject}</span>
                  <span style={{ marginLeft: 'auto', color: '#444', fontSize: 10 }}>
                    {CATEGORY_LABEL[f.category] ?? f.category}
                  </span>
                </div>
                <div style={{ color: '#aaa', fontSize: 11, marginBottom: 4 }}>{f.observation}</div>
                <div style={{ color: '#c9a84c', fontSize: 11 }}>→ {f.suggestion}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
