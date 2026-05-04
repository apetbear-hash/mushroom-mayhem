import type { GameState } from '../shared/types';
import { portraitEmoji } from '../agents/turn/playerSetupData';

interface GameOverScreenProps {
  state: GameState;
  onNewGame: () => void;
}

export function GameOverScreen({ state, onNewGame }: GameOverScreenProps) {
  const sorted = [...state.players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.networkTileIds.length !== a.networkTileIds.length)
      return b.networkTileIds.length - a.networkTileIds.length;
    const bMush = state.placedMushrooms.filter(m => m.playerId === b.id).length;
    const aMush = state.placedMushrooms.filter(m => m.playerId === a.id).length;
    return bMush - aMush;
  });

  const winner = sorted[0];
  const isTie  = sorted.length > 1
    && sorted[1].score === winner.score
    && sorted[1].networkTileIds.length === winner.networkTileIds.length;

  const maxScore = Math.max(...state.players.map(p => p.score), 1);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(26,20,8,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 200, fontFamily: "'Cormorant Garamond', Georgia, serif",
      overflowY: 'auto',
    }}>
      <div style={{
        background: '#F2ECD8',
        border: `2px solid ${winner.color}88`,
        borderRadius: 20,
        padding: '36px 44px',
        minWidth: 380, maxWidth: 520, width: '100%',
        boxShadow: `0 12px 60px rgba(26,20,8,0.3), 0 0 40px ${winner.color}22`,
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 10, color: '#4A2E08', letterSpacing: 3, marginBottom: 14, fontFamily: 'sans-serif' }}>
            GAME OVER — TURN 20
          </div>

          <div style={{
            fontSize: 58,
            background: winner.color + '18',
            border: `2px solid ${winner.color}66`,
            borderRadius: '50%',
            width: 90, height: 90,
            margin: '0 auto 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 28px ${winner.color}33`,
          }}>
            {portraitEmoji(winner.portrait)}
          </div>

          <div style={{ color: winner.color, fontSize: 24, fontWeight: 800, marginBottom: 4 }}>
            {isTie ? "It's a Tie!" : `${winner.name} Wins!`}
          </div>
          <div style={{ color: '#C84820', fontSize: 30, fontWeight: 800 }}>
            {winner.score} <span style={{ fontSize: 14, color: '#4A2E08', fontWeight: 400 }}>symbiosis pts</span>
          </div>
        </div>

        {/* Bar graph */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 10, color: '#4A2E08', letterSpacing: 2, marginBottom: 12, textTransform: 'uppercase', fontFamily: 'sans-serif' }}>
            Final Scores
          </div>

          {sorted.map((p, rank) => {
            const pct = maxScore > 0 ? (p.score / maxScore) * 100 : 0;
            const mushroomCount = state.placedMushrooms.filter(m => m.playerId === p.id).length;
            const isWinner = rank === 0 && !isTie;

            return (
              <div key={p.id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{portraitEmoji(p.portrait)}</span>
                  <span style={{
                    color: p.color, fontWeight: 700, fontSize: 12,
                    flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    fontFamily: 'sans-serif',
                  }}>
                    {p.name}
                  </span>
                  <span style={{ color: '#4A2E08', fontSize: 10, flexShrink: 0, fontFamily: 'sans-serif' }}>
                    {p.networkTileIds.length}🌐 · {mushroomCount}🍄
                  </span>
                  <span style={{
                    color: isWinner ? '#C84820' : '#1A1408',
                    fontWeight: 800, fontSize: 18,
                    minWidth: 32, textAlign: 'right', flexShrink: 0,
                  }}>
                    {p.score}
                  </span>
                </div>

                <div style={{
                  height: 12, background: '#DDD0B0',
                  borderRadius: 6, overflow: 'hidden',
                  border: `1px solid ${p.color}33`,
                }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    minWidth: p.score > 0 ? 6 : 0,
                    background: `linear-gradient(90deg, ${p.color}aa, ${p.color})`,
                    borderRadius: 6, transition: 'width 0.6s ease',
                    position: 'relative',
                  }}>
                    {p.score > 0 && (
                      <div style={{
                        position: 'absolute', top: 1, left: 4,
                        height: 3, width: '30%',
                        background: 'rgba(255,255,255,0.35)',
                        borderRadius: 2,
                      }} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            {[0, 25, 50, 75, 100].map(pct => (
              <div key={pct} style={{ fontSize: 10, color: '#4A2E08', textAlign: 'center', fontFamily: 'sans-serif' }}>
                {Math.round((pct / 100) * maxScore)}
              </div>
            ))}
          </div>
        </div>

        {/* Stat breakdown */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(sorted.length, 4)}, 1fr)`,
          gap: 8, marginBottom: 28,
        }}>
          {sorted.map((p, rank) => {
            const mushroomCount = state.placedMushrooms.filter(m => m.playerId === p.id).length;
            return (
              <div key={p.id} style={{
                background: rank === 0 ? p.color + '15' : '#EAE0C8',
                border: `1px solid ${p.color}44`,
                borderRadius: 10, padding: '10px 8px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 11, marginBottom: 2 }}>{portraitEmoji(p.portrait)}</div>
                <div style={{ color: p.color, fontWeight: 700, fontSize: 10, marginBottom: 6,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'sans-serif',
                }}>
                  {p.name}
                </div>
                <div style={{ color: '#1A1408', fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{p.score}</div>
                <div style={{ color: '#4A2E08', fontSize: 10, fontWeight: 700, marginBottom: 6, fontFamily: 'sans-serif' }}>pts</div>
                <div style={{ color: '#4A3820', fontSize: 10, fontFamily: 'sans-serif' }}>{p.networkTileIds.length} tiles</div>
                <div style={{ color: '#4A3820', fontSize: 10, fontFamily: 'sans-serif' }}>{mushroomCount} mushrooms</div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={onNewGame}
            style={{
              background: '#C84820', color: '#F2ECD8',
              border: 'none', borderRadius: 10,
              padding: '14px 48px', fontSize: 16, fontWeight: 700,
              cursor: 'pointer', letterSpacing: 0.5,
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              boxShadow: '0 4px 20px rgba(200,72,32,0.35)',
            }}
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  );
}
