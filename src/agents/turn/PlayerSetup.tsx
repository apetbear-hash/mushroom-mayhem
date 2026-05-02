import { useState } from 'react';
import { PORTRAITS, COLOR_OPTIONS } from './playerSetupData';

export interface PlayerDraft {
  name: string;
  portrait: string;
  color: string;
}

interface PlayerSetupProps {
  onConfirm: (players: PlayerDraft[], devMode: boolean) => void;
}

const MAX_SLOTS = 4;

interface SlotState {
  active: boolean;
  portrait: string;
  color: string;
}

function buildInitialSlots(): SlotState[] {
  return Array.from({ length: MAX_SLOTS }, (_, i) => ({
    active: i < 2,
    portrait: PORTRAITS[i % PORTRAITS.length].id,
    color: COLOR_OPTIONS[i % COLOR_OPTIONS.length].hex,
  }));
}

interface SlotProps {
  index: number;
  slot: SlotState;
  takenPortraits: Set<string>;
  takenColors: Set<string>;
  onChange: (updated: SlotState) => void;
}

function PlayerSlot({ index, slot, takenPortraits, takenColors, onChange }: SlotProps) {
  const portrait = PORTRAITS.find(p => p.id === slot.portrait)!;
  const borderColor = slot.active ? slot.color : '#C8B88A';

  return (
    <div style={{
      background: slot.active ? '#F2ECD8' : '#EAE0C8',
      border: `2px solid ${borderColor}`,
      borderRadius: 12,
      padding: 20,
      width: 180,
      display: 'flex', flexDirection: 'column', gap: 12,
      boxShadow: slot.active ? `0 4px 20px rgba(26,20,8,0.12)` : 'none',
      transition: 'all 0.2s',
      opacity: slot.active ? 1 : 0.55,
    }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: slot.active ? slot.color : '#8A7848', fontWeight: 700, fontSize: 12, letterSpacing: 1, fontFamily: 'sans-serif' }}>
          PLAYER {index + 1}
        </span>
        <button
          onClick={() => onChange({ ...slot, active: !slot.active })}
          style={{
            background: slot.active ? slot.color : '#DDD0B0',
            border: `1px solid ${slot.active ? slot.color : '#C8B88A'}`,
            borderRadius: 20,
            color: slot.active ? '#F2ECD8' : '#8A7848',
            fontSize: 10, fontWeight: 700,
            padding: '3px 10px',
            cursor: 'pointer', letterSpacing: 0.5, fontFamily: 'sans-serif',
          }}
        >
          {slot.active ? 'ACTIVE' : 'OFF'}
        </button>
      </div>

      <div style={{
        fontSize: 48, textAlign: 'center',
        background: '#EAE0C8',
        borderRadius: 10, padding: '10px 0',
        border: `1px solid ${slot.active ? slot.color + '55' : '#C8B88A'}`,
      }}>
        {portrait.emoji}
      </div>

      <div>
        <div style={{ color: '#8A7848', fontSize: 10, marginBottom: 5, letterSpacing: 1, fontFamily: 'sans-serif' }}>PORTRAIT</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {PORTRAITS.map(p => {
            const taken = takenPortraits.has(p.id) && p.id !== slot.portrait;
            return (
              <button
                key={p.id}
                title={p.name}
                onClick={() => slot.active && !taken && onChange({ ...slot, portrait: p.id })}
                style={{
                  fontSize: 17,
                  background: slot.portrait === p.id ? slot.color + '22' : '#EAE0C8',
                  border: slot.portrait === p.id ? `2px solid ${slot.color}` : '2px solid #C8B88A',
                  borderRadius: 5,
                  cursor: !slot.active || taken ? 'not-allowed' : 'pointer',
                  opacity: taken ? 0.25 : 1,
                  padding: '2px 4px', lineHeight: 1,
                }}
              >
                {p.emoji}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div style={{ color: '#8A7848', fontSize: 10, marginBottom: 5, letterSpacing: 1, fontFamily: 'sans-serif' }}>COLOUR</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {COLOR_OPTIONS.map(c => {
            const taken = takenColors.has(c.hex) && c.hex !== slot.color;
            return (
              <button
                key={c.id}
                title={c.name}
                onClick={() => slot.active && !taken && onChange({ ...slot, color: c.hex })}
                style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: c.hex,
                  border: slot.color === c.hex ? `3px solid #1A1408` : '3px solid transparent',
                  cursor: !slot.active || taken ? 'not-allowed' : 'pointer',
                  opacity: taken ? 0.2 : 1,
                  outline: 'none', padding: 0,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function PlayerSetup({ onConfirm }: PlayerSetupProps) {
  const [slots, setSlots] = useState<SlotState[]>(buildInitialSlots());
  const [devMode, setDevMode] = useState(false);

  const activeSlots = slots.filter(s => s.active);
  const takenPortraits = new Set(slots.filter(s => s.active).map(s => s.portrait));
  const takenColors    = new Set(slots.filter(s => s.active).map(s => s.color));
  const canStart = activeSlots.length >= 2 && activeSlots.length <= 4;

  function updateSlot(index: number, updated: SlotState) {
    setSlots(prev => prev.map((s, i) => (i === index ? updated : s)));
  }

  function handleStart() {
    if (!canStart) return;
    onConfirm(activeSlots.map((s, i) => ({
      name: `Player ${i + 1}`,
      portrait: s.portrait,
      color: s.color,
    })), devMode);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#EAE0C8',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 32,
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      color: '#1A1408',
    }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: 3, marginBottom: 6, color: '#C84820' }}>
        MUSHROOM MAYHEM
      </h1>
      <p style={{ color: '#8A7848', fontSize: 14, marginBottom: 32, letterSpacing: 1, fontFamily: 'sans-serif' }}>
        Toggle players active, then pick a portrait and colour.
      </p>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        {slots.map((slot, i) => (
          <PlayerSlot
            key={i} index={i} slot={slot}
            takenPortraits={takenPortraits} takenColors={takenColors}
            onChange={updated => updateSlot(i, updated)}
          />
        ))}
      </div>

      <div style={{ marginTop: 16, color: '#8A7848', fontSize: 13, fontFamily: 'sans-serif' }}>
        {activeSlots.length < 2
          ? 'Activate at least 2 players to start.'
          : activeSlots.length > 4
          ? 'Maximum 4 players.'
          : `${activeSlots.length} players ready.`}
      </div>

      <button
        onClick={() => setDevMode(v => !v)}
        style={{
          marginTop: 24,
          background: devMode ? '#1A2A0A' : 'transparent',
          border: `1px solid ${devMode ? '#3A6A10' : '#C8B88A'}`,
          color: devMode ? '#7AC840' : '#8A7848',
          borderRadius: 6,
          padding: '6px 18px',
          fontSize: 10,
          letterSpacing: 2,
          cursor: 'pointer',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {devMode ? '⚙ DEV MODE ON' : '⚙ DEV MODE'}
      </button>

      <button
        onClick={handleStart}
        disabled={!canStart}
        style={{
          marginTop: 16,
          background: canStart ? '#C84820' : '#DDD0B0',
          color: canStart ? '#F2ECD8' : '#8A7848',
          border: 'none', borderRadius: 10,
          padding: '14px 48px', fontSize: 18, fontWeight: 700,
          cursor: canStart ? 'pointer' : 'not-allowed',
          letterSpacing: 1, transition: 'background 0.2s',
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          boxShadow: canStart ? '0 4px 20px rgba(200,72,32,0.35)' : 'none',
        }}
      >
        Start Game
      </button>
    </div>
  );
}
