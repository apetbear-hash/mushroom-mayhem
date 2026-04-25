import { useEffect, useState } from 'react';
import type { Player } from '../../shared/types';
import { portraitEmoji } from './playerSetupData';
import { getSeason } from '../seasonal';

const SEASON_META: Record<string, { icon: string; color: string; label: string }> = {
  spring: { icon: '🌿', color: '#5cb85c', label: 'Spring' },
  summer: { icon: '☀️',  color: '#e0a030', label: 'Summer' },
  autumn: { icon: '🍂', color: '#b8623c', label: 'Autumn' },
  winter: { icon: '❄️',  color: '#90caf9', label: 'Winter' },
};

const EFFECT_LABELS: Record<string, string> = {
  thaw:                 'Thaw',
  spring_rain:          'Spring Rain',
  germination_gamble:   'Germination Gamble',
  creeping_mist:        'Creeping Mist',
  sluggish_soil:        'Sluggish Soil',
  long_days:            'Long Days',
  abundant_canopy:      'Abundant Canopy',
  drought:              'Drought',
  scorching_heat:       'Scorching Heat',
  mild_summer:          'Mild Summer',
  mushroom_festival:    'Mushroom Festival',
  spore_wind:           'Spore Wind',
  blight:               'Blight',
  long_summer:          'Long Summer',
  decay_bloom:          'Decay Bloom',
  deep_freeze:          'Deep Freeze',
  mycelium_harmony:     'Mycelium Harmony',
  mild_winter:          'Mild Winter',
  winter_stores:        'Winter Stores',
  final_harvest:        'Final Harvest',
};

interface TurnAnnouncementProps {
  player: Player;
  currentTurn: number;
  forecast: Record<string, string>;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export function TurnAnnouncement({
  player,
  currentTurn,
  forecast,
  onDismiss,
  autoDismissMs = 2800,
}: TurnAnnouncementProps) {
  const [visible, setVisible] = useState(true);

  const season = getSeason(currentTurn);
  const seasonMeta = SEASON_META[season];
  const activeEffect = forecast[season];
  const effectLabel = EFFECT_LABELS[activeEffect] ?? activeEffect;

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300); // wait for fade-out
    }, autoDismissMs);
    return () => clearTimeout(timer);
  }, [autoDismissMs, onDismiss]);

  return (
    <>
      <style>{`
        @keyframes mm-fade-in {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes mm-fade-out {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(0.92); }
        }
        .mm-announcement-card {
          animation: mm-fade-in 0.25s ease forwards;
        }
        .mm-announcement-card.hiding {
          animation: mm-fade-out 0.25s ease forwards;
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100,
        }}
      >
        {/* Card */}
        <div
          className={`mm-announcement-card${!visible ? ' hiding' : ''}`}
          onClick={e => e.stopPropagation()}
          style={{
            background: '#12121f',
            border: `3px solid ${player.color}`,
            borderRadius: 20,
            padding: '32px 40px',
            minWidth: 300,
            textAlign: 'center',
            fontFamily: 'sans-serif',
            boxShadow: `0 0 40px ${player.color}66`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* Portrait */}
          <div style={{
            fontSize: 72,
            background: player.color + '22',
            borderRadius: '50%',
            width: 100,
            height: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${player.color}66`,
          }}>
            {portraitEmoji(player.portrait)}
          </div>

          {/* Player name */}
          <div style={{ color: player.color, fontSize: 22, fontWeight: 800, letterSpacing: 1 }}>
            {player.name}
          </div>
          <div style={{ color: '#aaa', fontSize: 12, letterSpacing: 2, marginTop: -8 }}>
            YOUR TURN
          </div>

          {/* Divider */}
          <div style={{ width: '100%', height: 1, background: player.color + '44', margin: '4px 0' }} />

          {/* Season + turn info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>{seasonMeta.icon}</span>
            <span style={{ color: seasonMeta.color, fontWeight: 700, fontSize: 16 }}>
              {seasonMeta.label}
            </span>
            <span style={{ color: '#666', fontSize: 14 }}>·</span>
            <span style={{ color: '#ccc', fontSize: 14 }}>
              Turn {currentTurn} <span style={{ color: '#555' }}>/ 20</span>
            </span>
          </div>

          {/* Active season effect */}
          <div style={{
            background: '#1e1e30',
            border: `1px solid ${seasonMeta.color}44`,
            borderRadius: 8,
            padding: '6px 14px',
            color: seasonMeta.color,
            fontSize: 12,
            fontWeight: 600,
          }}>
            {seasonMeta.icon} {effectLabel}
          </div>

          <div style={{ color: '#444', fontSize: 11, marginTop: 4 }}>
            Tap anywhere to continue
          </div>
        </div>
      </div>
    </>
  );
}
