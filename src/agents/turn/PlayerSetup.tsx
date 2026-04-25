import { useState } from 'react';
import { PORTRAITS, COLOR_OPTIONS } from './playerSetupData';

export interface PlayerDraft {
  name: string;   // auto-set, not user-editable
  portrait: string;
  color: string;
}

// onConfirm receives only the active players, in slot order.
interface PlayerSetupProps {
  onConfirm: (players: PlayerDraft[]) => void;
}

const MAX_SLOTS = 4;

interface SlotState {
  active: boolean;
  portrait: string;
  color: string;
}

function buildInitialSlots(): SlotState[] {
  return Array.from({ length: MAX_SLOTS }, (_, i) => ({
    active: i < 2, // first two active by default
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
  const borderColor = slot.active ? slot.color : '#333';

  return (
    <div style={{
      background: slot.active ? '#1e1e2e' : '#111',
      border: `2px solid ${borderColor}`,
      borderRadius: 12,
      padding: 20,
      width: 180,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      boxShadow: slot.active ? `0 0 16px ${slot.color}33` : 'none',
      transition: 'all 0.2s',
      opacity: slot.active ? 1 : 0.45,
    }}>

      {/* Header: slot label + toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: slot.active ? slot.color : '#555', fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>
          PLAYER {index + 1}
        </span>
        <button
          onClick={() => onChange({ ...slot, active: !slot.active })}
          style={{
            background: slot.active ? slot.color : '#222',
            border: `1px solid ${slot.active ? slot.color : '#444'}`,
            borderRadius: 20,
            color: slot.active ? '#111' : '#555',
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 10px',
            cursor: 'pointer',
            letterSpacing: 0.5,
          }}
        >
          {slot.active ? 'ACTIVE' : 'OFF'}
        </button>
      </div>

      {/* Portrait display */}
      <div style={{
        fontSize: 48,
        textAlign: 'center',
        background: '#111',
        borderRadius: 10,
        padding: '10px 0',
        border: `1px solid ${slot.active ? slot.color + '55' : '#222'}`,
      }}>
        {portrait.emoji}
      </div>

      {/* Portrait picker — only interactive when active */}
      <div>
        <div style={{ color: '#666', fontSize: 9, marginBottom: 5, letterSpacing: 1 }}>PORTRAIT</div>
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
                  background: slot.portrait === p.id ? slot.color + '44' : '#111',
                  border: slot.portrait === p.id ? `2px solid ${slot.color}` : '2px solid #2a2a2a',
                  borderRadius: 5,
                  cursor: !slot.active || taken ? 'not-allowed' : 'pointer',
                  opacity: taken ? 0.2 : 1,
                  padding: '2px 4px',
                  lineHeight: 1,
                }}
              >
                {p.emoji}
              </button>
            );
          })}
        </div>
      </div>

      {/* Colour picker */}
      <div>
        <div style={{ color: '#666', fontSize: 9, marginBottom: 5, letterSpacing: 1 }}>COLOUR</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {COLOR_OPTIONS.map(c => {
            const taken = takenColors.has(c.hex) && c.hex !== slot.color;
            return (
              <button
                key={c.id}
                title={c.name}
                onClick={() => slot.active && !taken && onChange({ ...slot, color: c.hex })}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: c.hex,
                  border: slot.color === c.hex ? '3px solid #fff' : '3px solid transparent',
                  cursor: !slot.active || taken ? 'not-allowed' : 'pointer',
                  opacity: taken ? 0.2 : 1,
                  outline: 'none',
                  padding: 0,
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

  const activeSlots = slots.filter(s => s.active);
  const takenPortraits = new Set(slots.filter(s => s.active).map(s => s.portrait));
  const takenColors    = new Set(slots.filter(s => s.active).map(s => s.color));
  const canStart = activeSlots.length >= 2 && activeSlots.length <= 4;

  function updateSlot(index: number, updated: SlotState) {
    setSlots(prev => prev.map((s, i) => (i === index ? updated : s)));
  }

  function handleStart() {
    if (!canStart) return;
    const players: PlayerDraft[] = activeSlots.map((s, i) => ({
      name: `Player ${i + 1}`,
      portrait: s.portrait,
      color: s.color,
    }));
    onConfirm(players);
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0d1a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      fontFamily: 'sans-serif',
      color: '#eee',
    }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: 2, marginBottom: 6, color: '#c9a84c' }}>
        MUSHROOM MAYHEM
      </h1>
      <p style={{ color: '#666', fontSize: 12, marginBottom: 32, letterSpacing: 1 }}>
        Toggle players active, then pick a portrait and colour.
      </p>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        {slots.map((slot, i) => (
          <PlayerSlot
            key={i}
            index={i}
            slot={slot}
            takenPortraits={takenPortraits}
            takenColors={takenColors}
            onChange={updated => updateSlot(i, updated)}
          />
        ))}
      </div>

      <div style={{ marginTop: 16, color: '#555', fontSize: 12 }}>
        {activeSlots.length < 2
          ? 'Activate at least 2 players to start.'
          : activeSlots.length > 4
          ? 'Maximum 4 players.'
          : `${activeSlots.length} players ready.`}
      </div>

      <button
        onClick={handleStart}
        disabled={!canStart}
        style={{
          marginTop: 16,
          background: canStart ? '#c9a84c' : '#2a2a2a',
          color: canStart ? '#1a1a1a' : '#555',
          border: 'none',
          borderRadius: 10,
          padding: '14px 48px',
          fontSize: 16,
          fontWeight: 700,
          cursor: canStart ? 'pointer' : 'not-allowed',
          letterSpacing: 1,
          transition: 'background 0.2s',
        }}
      >
        Start Game
      </button>
    </div>
  );
}
