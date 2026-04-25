import type { GameState } from '../../shared/types';
import { getSeason } from '../seasonal';
import { portraitEmoji } from './playerSetupData';
import { SEASON_TURNS } from '../../shared/constants';

const SEASON_META: Record<string, { icon: string; color: string; label: string }> = {
  spring: { icon: '🌿', color: '#4A8030', label: 'Spring' },
  summer: { icon: '☀️',  color: '#A07010', label: 'Summer' },
  autumn: { icon: '🍂', color: '#C84820', label: 'Autumn' },
  winter: { icon: '❄️',  color: '#3A78A8', label: 'Winter' },
};

const EFFECT_LABELS: Record<string, string> = {
  thaw: 'Thaw', spring_rain: 'Spring Rain', germination_gamble: 'Germination Gamble',
  creeping_mist: 'Creeping Mist', sluggish_soil: 'Sluggish Soil',
  long_days: 'Long Days', abundant_canopy: 'Abundant Canopy', drought: 'Drought',
  scorching_heat: 'Scorching Heat', mild_summer: 'Mild Summer',
  mushroom_festival: 'Mushroom Festival', spore_wind: 'Spore Wind',
  blight: 'Blight', long_summer: 'Long Summer', decay_bloom: 'Decay Bloom',
  deep_freeze: 'Deep Freeze', mycelium_harmony: 'Mycelium Harmony',
  mild_winter: 'Mild Winter', winter_stores: 'Winter Stores', final_harvest: 'Final Harvest',
};

interface GameHUDProps {
  state: GameState;
}

export function GameHUD({ state }: GameHUDProps) {
  const season = getSeason(state.currentTurn);
  const meta = SEASON_META[season];
  const effect = state.forecast[season];
  const effectLabel = EFFECT_LABELS[effect] ?? effect;
  const currentPlayer = state.players[state.currentPlayerIndex];
  const [seasonStart, seasonEnd] = SEASON_TURNS[season];
  const turnInSeason = state.currentTurn - seasonStart + 1;

  return (
    <div style={{
      background: '#DDD0B0',
      borderBottom: `2px solid ${meta.color}88`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 16px',
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      gap: 12,
      flexWrap: 'wrap',
    }}>

      {/* Season block */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>{meta.icon}</span>
        <div>
          <div style={{ color: meta.color, fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>
            {meta.label}
          </div>
          <div style={{ color: '#6A5030', fontSize: 10, fontStyle: 'italic' }}>
            {effectLabel}
          </div>
        </div>
      </div>

      {/* Turn counter */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#1A1408', fontWeight: 800, fontSize: 18, lineHeight: 1 }}>
          {state.currentTurn}
          <span style={{ color: '#8A7848', fontWeight: 400, fontSize: 13 }}> / 20</span>
        </div>
        <div style={{ color: '#6A5030', fontSize: 10 }}>
          Turn {turnInSeason} of {seasonEnd - seasonStart + 1} in {meta.label}
        </div>
      </div>

      {/* Current player */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          fontSize: 22,
          background: currentPlayer.color + '22',
          border: `1px solid ${currentPlayer.color}99`,
          borderRadius: '50%',
          width: 36, height: 36,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {portraitEmoji(currentPlayer.portrait)}
        </div>
        <div>
          <div style={{ color: currentPlayer.color, fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>
            {currentPlayer.name}
          </div>
          <div style={{ color: '#6A5030', fontSize: 10 }}>Active player</div>
        </div>
      </div>

      {/* Forecast strip */}
      <div style={{ display: 'flex', gap: 6 }}>
        {(['spring', 'summer', 'autumn', 'winter'] as const).map(s => {
          const sm = SEASON_META[s];
          const isActive = s === season;
          return (
            <div
              key={s}
              title={`${sm.label}: ${EFFECT_LABELS[state.forecast[s]] ?? state.forecast[s]}`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                opacity: isActive ? 1 : 0.4,
                borderBottom: isActive ? `2px solid ${sm.color}` : '2px solid transparent',
                paddingBottom: 2,
              }}
            >
              <span style={{ fontSize: 14 }}>{sm.icon}</span>
              <span style={{ color: sm.color, fontSize: 10, fontWeight: 600 }}>
                {sm.label.slice(0, 2).toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Score strip */}
      <div style={{ display: 'flex', gap: 10 }}>
        {state.players.map(p => (
          <div key={p.id} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14 }}>{portraitEmoji(p.portrait)}</div>
            <div style={{ color: p.color, fontWeight: 800, fontSize: 16 }}>{p.score}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
