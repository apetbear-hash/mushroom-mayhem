import { useState } from 'react';
import { CARDS } from '../agents/card/cards';
import { getSeason } from '../agents/seasonal';
import type { GameState, SpringEffect, SummerEffect, AutumnEffect, WinterEffect } from '../shared/types';

const HUMAN_PLAYER_ID = 'player_0';

const SEASON_EFFECTS = {
  spring: ['thaw', 'spring_rain', 'germination_gamble', 'creeping_mist', 'sluggish_soil'] as SpringEffect[],
  summer: ['long_days', 'abundant_canopy', 'drought', 'scorching_heat', 'mild_summer'] as SummerEffect[],
  autumn: ['mushroom_festival', 'spore_wind', 'blight', 'long_summer', 'decay_bloom'] as AutumnEffect[],
  winter: ['deep_freeze', 'mycelium_harmony', 'mild_winter', 'winter_stores', 'final_harvest'] as WinterEffect[],
};

interface DevPanelProps {
  state: GameState;
  onStateChange: (s: GameState) => void;
}

export function DevPanel({ state, onStateChange }: DevPanelProps) {
  const [open, setOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<number>(CARDS[0].id);
  const [jumpTurn, setJumpTurn] = useState<number>(state.currentTurn);

  const p1 = state.players.find(p => p.id === HUMAN_PLAYER_ID);
  const currentSeason = getSeason(state.currentTurn);
  const currentEffect = state.forecast[currentSeason];

  if (!p1) return null;

  function setResource(res: 'spore' | 'moisture' | 'sunlight', val: number) {
    onStateChange({
      ...state,
      players: state.players.map(p =>
        p.id === HUMAN_PLAYER_ID
          ? { ...p, resources: { ...p.resources, [res]: Math.max(0, val) } }
          : p,
      ),
    });
  }

  function addCardToHand() {
    if (p1!.hand.includes(selectedCardId)) return;
    onStateChange({
      ...state,
      players: state.players.map(p =>
        p.id === HUMAN_PLAYER_ID ? { ...p, hand: [...p.hand, selectedCardId] } : p,
      ),
    });
  }

  function applyJumpTurn() {
    const t = Math.min(20, Math.max(1, jumpTurn));
    onStateChange({
      ...state,
      currentTurn: t,
      turnState: { actionType: null, restUsed: false, cardsDrawnThisTurn: 0 },
    });
  }

  function setSeasonEffect(effect: string) {
    onStateChange({
      ...state,
      forecast: { ...state.forecast, [currentSeason]: effect },
    });
  }

  function fillResources() {
    onStateChange({
      ...state,
      players: state.players.map(p =>
        p.id === HUMAN_PLAYER_ID
          ? { ...p, resources: { spore: 10, moisture: 10, sunlight: 10 } }
          : p,
      ),
    });
  }

  function emptyDeck() {
    onStateChange({ ...state, deck: [], discard: [] });
  }

  function clearHand() {
    onStateChange({
      ...state,
      players: state.players.map(p =>
        p.id === HUMAN_PLAYER_ID ? { ...p, hand: [] } : p,
      ),
    });
  }

  const panelStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 120,
    right: 16,
    zIndex: 200,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
  };

  const toggleStyle: React.CSSProperties = {
    background: '#1A1408',
    color: '#C8FF00',
    border: 'none',
    padding: '4px 10px',
    cursor: 'pointer',
    letterSpacing: 2,
    fontSize: 10,
    fontFamily: "'JetBrains Mono', monospace",
    display: 'block',
    marginLeft: 'auto',
  };

  const labelStyle: React.CSSProperties = {
    color: '#8A9A60',
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
    display: 'block',
  };

  const inputStyle: React.CSSProperties = {
    background: '#111',
    border: '1px solid #3A4A20',
    color: '#C8FF00',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    padding: '2px 6px',
    width: 54,
  };

  const selectStyle: React.CSSProperties = {
    background: '#111',
    border: '1px solid #3A4A20',
    color: '#C8FF00',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    padding: '2px 4px',
    width: '100%',
  };

  const btnStyle: React.CSSProperties = {
    background: '#1A2A0A',
    border: '1px solid #3A4A20',
    color: '#C8FF00',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    padding: '3px 8px',
    cursor: 'pointer',
    letterSpacing: 1,
  };

  const sectionStyle: React.CSSProperties = {
    borderBottom: '1px solid #3A4A20',
    paddingBottom: 8,
    marginBottom: 8,
  };

  return (
    <div style={panelStyle}>
      <button style={toggleStyle} onClick={() => setOpen(v => !v)}>
        {open ? '✕ DEV' : '⚙ DEV'}
      </button>

      {open && (
        <div style={{
          background: '#0D1206',
          border: '1px solid #3A4A20',
          padding: 12,
          width: 220,
          color: '#C8FF00',
          marginTop: 4,
          maxHeight: '60vh',
          overflowY: 'auto',
        }}>

          {/* Resources */}
          <div style={sectionStyle}>
            <span style={labelStyle}>Resources (P1)</span>
            {(['spore', 'moisture', 'sunlight'] as const).map(res => (
              <div key={res} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ width: 60, color: '#8A9A60' }}>{res}</span>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={p1.resources[res]}
                  onChange={e => setResource(res, Number(e.target.value))}
                  style={inputStyle}
                />
              </div>
            ))}
          </div>

          {/* Add card to hand */}
          <div style={sectionStyle}>
            <span style={labelStyle}>Add card to hand</span>
            <select
              value={selectedCardId}
              onChange={e => setSelectedCardId(Number(e.target.value))}
              style={{ ...selectStyle, marginBottom: 6 }}
            >
              {CARDS.map(c => (
                <option key={c.id} value={c.id}>
                  #{c.id} {c.name}
                </option>
              ))}
            </select>
            <button style={btnStyle} onClick={addCardToHand}>
              + Add to hand
            </button>
          </div>

          {/* Turn */}
          <div style={sectionStyle}>
            <span style={labelStyle}>Jump to turn</span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="number"
                min={1}
                max={20}
                value={jumpTurn}
                onChange={e => setJumpTurn(Number(e.target.value))}
                style={inputStyle}
              />
              <button style={btnStyle} onClick={applyJumpTurn}>Go</button>
            </div>
            <div style={{ color: '#8A9A60', fontSize: 9, marginTop: 4 }}>
              Current: T{state.currentTurn} ({currentSeason})
            </div>
          </div>

          {/* Season effect */}
          <div style={sectionStyle}>
            <span style={labelStyle}>Season effect ({currentSeason})</span>
            <select
              value={currentEffect}
              onChange={e => setSeasonEffect(e.target.value)}
              style={selectStyle}
            >
              {(SEASON_EFFECTS[currentSeason] as string[]).map(eff => (
                <option key={eff} value={eff}>{eff}</option>
              ))}
            </select>
          </div>

          {/* Quick actions */}
          <div>
            <span style={labelStyle}>Quick actions</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <button style={btnStyle} onClick={fillResources}>
                Fill resources (×10)
              </button>
              <button style={btnStyle} onClick={clearHand}>
                Clear hand
              </button>
              <button style={{ ...btnStyle, color: '#FF8888', borderColor: '#5A2020' }} onClick={emptyDeck}>
                Empty deck &amp; discard
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
