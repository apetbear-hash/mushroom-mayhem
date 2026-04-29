import type { GameState, Season } from '../../shared/types';
import { SEASON_TURNS } from '../../shared/constants';
import { getSeason } from './index';

const SEASON_META: Record<Season, { icon: string; color: string; label: string }> = {
  spring: { icon: '🌿', color: '#4A8030', label: 'Spring' },
  summer: { icon: '☀️',  color: '#A07010', label: 'Summer' },
  autumn: { icon: '🍂', color: '#C84820', label: 'Autumn' },
  winter: { icon: '❄️',  color: '#3A78A8', label: 'Winter' },
};

interface EffectMeta {
  name: string;
  type: 'positive' | 'negative' | 'risk' | 'neutral';
  lines: string[];
}

const EFFECT_META: Record<string, EffectMeta> = {
  thaw:               { name: 'Thaw',               type: 'positive', lines: ['Spread −1 💧 (min 1)'] },
  spring_rain:        { name: 'Spring Rain',         type: 'positive', lines: ['Start: all gain +3 💧'] },
  germination_gamble: { name: 'Germination Gamble',  type: 'risk',     lines: ['Your turn start: discard', '& redraw freely'] },
  creeping_mist:      { name: 'Creeping Mist',       type: 'risk',     lines: ['Shade/Wet spread −1 💧', 'but no resources there'] },
  sluggish_soil:      { name: 'Sluggish Soil',       type: 'negative', lines: ['All −1 resource/turn (min 1)'] },
  long_days:          { name: 'Long Days',           type: 'positive', lines: ['All mushrooms +1 🍄/harvest'] },
  abundant_canopy:    { name: 'Abundant Canopy',     type: 'positive', lines: ['Shade mushrooms +1 ⭐/turn'] },
  drought:            { name: 'Drought',             type: 'negative', lines: ['Start: 💧→0. No 💧 gain'] },
  scorching_heat:     { name: 'Scorching Heat',      type: 'negative', lines: ['Spread +1 💧. Open: no ⭐'] },
  mild_summer:        { name: 'Mild Summer',         type: 'neutral',  lines: ['No effect'] },
  mushroom_festival:  { name: 'Mushroom Festival',   type: 'positive', lines: ['Season end: +1 ⭐ per 🍄'] },
  spore_wind:         { name: 'Spore Wind',          type: 'positive', lines: ['+4 🍄 + 1 free tile each'] },
  blight:             { name: 'Blight',              type: 'negative', lines: ['Start: 3–5 tiles ✕ forever'] },
  long_summer:        { name: 'Long Summer',         type: 'positive', lines: ['Copies ☀️ Summer effect'] },
  decay_bloom:        { name: 'Decay Bloom',         type: 'risk',     lines: ['Decay: +2 res/turn, 0 ⭐'] },
  deep_freeze:        { name: 'Deep Freeze',         type: 'negative', lines: ['Spreading ✕. Spread cards disabled'] },
  mycelium_harmony:   { name: 'Mycelium Harmony',    type: 'positive', lines: ['Score = longest same-type chain'] },
  mild_winter:        { name: 'Mild Winter',         type: 'neutral',  lines: ['No effect'] },
  winter_stores:      { name: 'Winter Stores',       type: 'positive', lines: ['Start: +2 🍄💧☀️ each'] },
  final_harvest:      { name: 'Final Harvest',       type: 'risk',     lines: ['No resources from 🍄s.', 'End: +1 ⭐ per 3 unspent'] },
};

const TYPE_DOT: Record<string, { symbol: string; color: string }> = {
  positive: { symbol: '▲', color: '#4A8030' },
  negative: { symbol: '▼', color: '#C84820' },
  risk:     { symbol: '◆', color: '#A07010' },
  neutral:  { symbol: '●', color: '#8A7848' },
};

interface SeasonalEffectPanelProps {
  state: GameState;
}

export function SeasonalEffectPanel({ state }: SeasonalEffectPanelProps) {
  const activeSeason = getSeason(state.currentTurn);
  const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter'];

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 6,
      fontFamily: "'Cormorant Garamond', Georgia, serif",
    }}>
      <div style={{ color: '#6A5030', fontSize: 15, fontWeight: 700, letterSpacing: 2, paddingLeft: 2, marginBottom: 2 }}>
        FORECAST
      </div>

      {seasons.map(season => {
        const meta = SEASON_META[season];
        const effectKey = state.forecast[season] as string;
        const effect = EFFECT_META[effectKey];
        const isActive = season === activeSeason;
        const [start, end] = SEASON_TURNS[season];
        const dot = effect ? TYPE_DOT[effect.type] : null;

        const isLongSummer = season === 'autumn' && effectKey === 'long_summer';
        const copiedSummerEffect = isLongSummer ? EFFECT_META[state.forecast.summer] : null;

        return (
          <div key={season} style={{
            background: isActive ? '#F2ECD8' : '#EAE0C8',
            border: `1.5px solid ${isActive ? meta.color + '99' : '#C8B88A'}`,
            borderRadius: 8, padding: '8px 10px',
            boxShadow: isActive ? `0 2px 8px rgba(26,20,8,0.1)` : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <span style={{ fontSize: 18 }}>{meta.icon}</span>
              <span style={{ color: isActive ? meta.color : '#8A7848', fontWeight: 700, fontSize: 17 }}>
                {meta.label}
              </span>
              {isActive && (
                <span style={{
                  background: meta.color, color: '#F2ECD8',
                  fontSize: 12, fontWeight: 800, borderRadius: 3,
                  padding: '1px 5px', letterSpacing: 0.5,
                }}>
                  NOW
                </span>
              )}
              <span style={{ marginLeft: 'auto', color: '#B0A070', fontSize: 14 }}>{start}–{end}</span>
            </div>

            {effect && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                {dot && <span style={{ color: dot.color, fontSize: 15 }}>{dot.symbol}</span>}
                <span style={{ color: isActive ? '#1A1408' : '#6A5030', fontWeight: 700, fontSize: 16 }}>
                  {effect.name}
                </span>
              </div>
            )}

            {effect && effect.lines.map((line, i) => (
              <div key={i} style={{ color: isActive ? '#4A3820' : '#8A7848', fontSize: 15, lineHeight: 1.4 }}>
                {line}
              </div>
            ))}

            {isLongSummer && copiedSummerEffect && (
              <div style={{ marginTop: 5, paddingTop: 5, borderTop: '1px solid #C8B88A' }}>
                <div style={{ color: '#8A7848', fontSize: 15, marginBottom: 2 }}>copies ☀️:</div>
                <div style={{ color: isActive ? '#1A1408' : '#6A5030', fontWeight: 700, fontSize: 16 }}>
                  {copiedSummerEffect.name}
                </div>
                {copiedSummerEffect.lines.map((line, i) => (
                  <div key={i} style={{ color: isActive ? '#4A3820' : '#8A7848', fontSize: 15, lineHeight: 1.4 }}>
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
