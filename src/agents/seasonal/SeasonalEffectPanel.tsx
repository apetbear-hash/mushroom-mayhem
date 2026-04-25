import type { GameState, Season } from '../../shared/types';
import { SEASON_TURNS } from '../../shared/constants';
import { getSeason } from './index';

const SEASON_META: Record<Season, { icon: string; color: string; label: string }> = {
  spring: { icon: '🌿', color: '#6AA84A', label: 'Spring' },
  summer: { icon: '☀️',  color: '#D4A820', label: 'Summer' },
  autumn: { icon: '🍂', color: '#C84820', label: 'Autumn' },
  winter: { icon: '❄️',  color: '#7AAAC8', label: 'Winter' },
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
  sluggish_soil:      { name: 'Sluggish Soil',       type: 'negative', lines: ['All mushrooms −1 each', 'resource/turn (min 1)'] },

  long_days:          { name: 'Long Days',           type: 'positive', lines: ['All mushrooms +1 🍄/harvest'] },
  abundant_canopy:    { name: 'Abundant Canopy',     type: 'positive', lines: ['Shade mushrooms +1 ⭐/turn'] },
  drought:            { name: 'Drought',             type: 'negative', lines: ['Start: 💧→0. No 💧 gain'] },
  scorching_heat:     { name: 'Scorching Heat',      type: 'negative', lines: ['Spread +1 💧. Open tiles: no ⭐'] },
  mild_summer:        { name: 'Mild Summer',         type: 'neutral',  lines: ['No effect'] },

  mushroom_festival:  { name: 'Mushroom Festival',   type: 'positive', lines: ['Season end: +1 ⭐ per', 'mushroom on board'] },
  spore_wind:         { name: 'Spore Wind',          type: 'positive', lines: ['Start: +4 🍄 each +', '1 free network tile'] },
  blight:             { name: 'Blight',              type: 'negative', lines: ['Start: 3–5 tiles ✕ forever'] },
  long_summer:        { name: 'Long Summer',         type: 'positive', lines: ['Copies ☀️ Summer effect'] },
  decay_bloom:        { name: 'Decay Bloom',         type: 'risk',     lines: ['Decay: +2 res/turn', 'but 0 ⭐ this season'] },

  deep_freeze:        { name: 'Deep Freeze',         type: 'negative', lines: ['Spreading ✕. Spread', 'card effects disabled'] },
  mycelium_harmony:   { name: 'Mycelium Harmony',    type: 'positive', lines: ['Score = longest same-', 'type chain/turn'] },
  mild_winter:        { name: 'Mild Winter',         type: 'neutral',  lines: ['No effect'] },
  winter_stores:      { name: 'Winter Stores',       type: 'positive', lines: ['Start: +2 🍄💧☀️ each'] },
  final_harvest:      { name: 'Final Harvest',       type: 'risk',     lines: ['No resources from 🍄s.', 'End: +1 ⭐ per 3 unspent'] },
};

const TYPE_DOT: Record<string, { symbol: string; color: string }> = {
  positive: { symbol: '▲', color: '#6AA84A' },
  negative: { symbol: '▼', color: '#C84820' },
  risk:     { symbol: '◆', color: '#D4A820' },
  neutral:  { symbol: '●', color: '#6A5830' },
};

interface SeasonalEffectPanelProps {
  state: GameState;
}

export function SeasonalEffectPanel({ state }: SeasonalEffectPanelProps) {
  const activeSeason = getSeason(state.currentTurn);
  const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: 190, fontFamily: 'sans-serif' }}>
      <div style={{ color: '#6A5830', fontSize: 10, fontWeight: 700, letterSpacing: 2, paddingLeft: 2, marginBottom: 1 }}>
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
          <div
            key={season}
            style={{
              background: isActive ? '#2E2414' : '#1A1408',
              border: `1.5px solid ${isActive ? meta.color + '88' : '#3C3018'}`,
              borderRadius: 8,
              padding: '7px 10px',
              transition: 'border-color 0.2s',
              boxShadow: isActive ? `0 0 10px ${meta.color}22` : 'none',
            }}
          >
            {/* Row 1: icon + season name + NOW badge + turn range */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <span style={{ fontSize: 13 }}>{meta.icon}</span>
              <span style={{ color: isActive ? meta.color : '#6A5830', fontWeight: 700, fontSize: 11 }}>
                {meta.label}
              </span>
              {isActive && (
                <span style={{
                  background: meta.color, color: '#1A1408',
                  fontSize: 7, fontWeight: 800, borderRadius: 3,
                  padding: '1px 4px', letterSpacing: 0.5,
                }}>
                  NOW
                </span>
              )}
              <span style={{ marginLeft: 'auto', color: '#4E4020', fontSize: 9 }}>
                {start}–{end}
              </span>
            </div>

            {/* Row 2: effect name + type dot */}
            {effect && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                {dot && (
                  <span style={{ color: dot.color, fontSize: 10, lineHeight: 1 }}>{dot.symbol}</span>
                )}
                <span style={{ color: isActive ? '#EAE0C8' : '#6A5830', fontWeight: 700, fontSize: 11 }}>
                  {effect.name}
                </span>
              </div>
            )}

            {/* Row 3: description lines */}
            {effect && effect.lines.map((line, i) => (
              <div key={i} style={{ color: isActive ? '#B09848' : '#4E4020', fontSize: 10, lineHeight: 1.4 }}>
                {line}
              </div>
            ))}

            {/* Long Summer: show copied effect */}
            {isLongSummer && copiedSummerEffect && (
              <div style={{ marginTop: 5, paddingTop: 5, borderTop: '1px solid #3C3018' }}>
                <div style={{ color: '#6A5830', fontSize: 10, marginBottom: 2 }}>copies ☀️:</div>
                <div style={{ color: isActive ? '#EAE0C8' : '#6A5830', fontWeight: 700, fontSize: 10, marginBottom: 1 }}>
                  {copiedSummerEffect.name}
                </div>
                {copiedSummerEffect.lines.map((line, i) => (
                  <div key={i} style={{ color: isActive ? '#B09848' : '#4E4020', fontSize: 10, lineHeight: 1.4 }}>
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
