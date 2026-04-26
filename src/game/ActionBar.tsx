import type { ActionType, GameState } from '../shared/types';
import { getSeason } from '../agents/seasonal';

const RESOURCE_ICONS: Record<string, string> = {
  spore: '🍄', moisture: '💧', sunlight: '☀️',
};

interface ActionBarProps {
  state: GameState;
  playerId: string;
  selectedAction: ActionType | null;
  message: string;
  onSelectAction: (action: ActionType) => void;
  onEndTurn: () => void;
  undoState: GameState | null;
  onUndo: () => void;
}

export function ActionBar({
  state, playerId, selectedAction, message,
  onSelectAction, onEndTurn, undoState, onUndo,
}: ActionBarProps) {
  const player = state.players.find(p => p.id === playerId)!;
  const season = getSeason(state.currentTurn);
  const effect = state.forecast[season];
  const isDeepFreeze = season === 'winter' && effect === 'deep_freeze';
  const isDrought = effect === 'drought';

  const drawn = state.turnState.cardsDrawnThisTurn;
  const nextDrawCost = drawn + 1;
  const deckOrDiscard = state.deck.length > 0 || state.discard.length > 0;
  const confirmedAction = state.turnState.actionType;

  const canDraw = !state.turnState.restUsed &&
    (confirmedAction === null || confirmedAction === 'draw') &&
    player.resources.sunlight >= nextDrawCost && deckOrDiscard;

  const pendingFreeSpread = state.pendingFreeSpreads.find(ps => ps.playerId === playerId);
  const freeSpreadCount = pendingFreeSpread?.spreadsRemaining ?? 0;
  const hasFreeSpread = freeSpreadCount > 0;

  const canSpread = !state.turnState.restUsed && !isDeepFreeze &&
    (confirmedAction === null || confirmedAction === 'spread') &&
    (hasFreeSpread || (player.resources.moisture >= 1 && !isDrought));

  const canPlant = !state.turnState.restUsed &&
    (confirmedAction === null || confirmedAction === 'plant') &&
    player.hand.length > 0;

  const canRest = !state.turnState.restUsed && confirmedAction === null;

  const drawHint = drawn === 0 ? `${nextDrawCost}☀️` : `${nextDrawCost}☀️ ↑`;

  const actions: { type: ActionType; label: string; icon: string; enabled: boolean; hint: string }[] = [
    { type: 'draw',   label: 'Draw',   icon: '🃏', enabled: canDraw,   hint: drawHint },
    { type: 'spread', label: 'Spread', icon: '🌐', enabled: canSpread, hint: hasFreeSpread ? `FREE ×${freeSpreadCount}` : isDrought ? '✕' : isDeepFreeze ? '✕' : '💧' },
    { type: 'plant',  label: 'Spawn',  icon: '🍄', enabled: canPlant,  hint: 'spores' },
    { type: 'rest',   label: 'Rest',   icon: '💤', enabled: canRest,   hint: '+1 each' },
  ];

  const actionTaken = state.turnState.actionType !== null || state.turnState.restUsed;

  return (
    <div style={{
      background: '#1A100A',
      display: 'flex', flexDirection: 'column', gap: 8,
      padding: '10px 12px',
      fontFamily: 'sans-serif',
      height: '100%', boxSizing: 'border-box',
    }}>
      {/* Resources */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        {(['spore', 'moisture', 'sunlight'] as const).map(res => (
          <div key={res} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 13 }}>{RESOURCE_ICONS[res]}</span>
            <span style={{ color: '#F2EAD8', fontWeight: 700, fontSize: 15 }}>
              {player.resources[res]}
            </span>
          </div>
        ))}
      </div>

      {/* Action buttons — 2×2 grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
        {actions.map(a => {
          const isSelected = selectedAction === a.type;
          return (
            <button
              key={a.type}
              onClick={() => a.enabled && onSelectAction(a.type)}
              disabled={!a.enabled}
              title={a.hint}
              style={{
                background: isSelected ? player.color + '33' : '#0E0907',
                border: `1.5px solid ${isSelected ? player.color : !a.enabled ? '#1A100A' : '#3A2818'}`,
                borderRadius: 8, padding: '6px 4px',
                color: isSelected ? player.color : !a.enabled ? '#3A2818' : '#8A7848',
                fontWeight: isSelected ? 700 : 400,
                fontSize: 11, cursor: a.enabled ? 'pointer' : 'not-allowed',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 16 }}>{a.icon}</span>
              <span style={{ fontSize: 11 }}>{a.label}</span>
              <span style={{ fontSize: 9, opacity: 0.65 }}>{a.hint}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback message */}
      {message && (
        <div style={{ color: '#D4A04A', fontSize: 10, textAlign: 'center', lineHeight: 1.3 }}>
          {message}
        </div>
      )}

      {/* Undo + End Turn */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 'auto' }}>
        {undoState && (
          <button onClick={onUndo} style={{
            background: 'transparent', border: '1px solid #3A2818',
            color: '#8A7848', borderRadius: 6,
            padding: '5px 8px', fontWeight: 600, fontSize: 11,
            cursor: 'pointer', width: '100%',
          }}>
            ↩ Undo
          </button>
        )}
        <button
          onClick={onEndTurn}
          disabled={!actionTaken}
          style={{
            background: actionTaken ? '#C84820' : '#1A100A',
            color: actionTaken ? '#F2EAD8' : '#3A2818',
            border: actionTaken ? 'none' : '1px solid #3A2818',
            borderRadius: 6, padding: '8px', fontWeight: 700, fontSize: 13,
            cursor: actionTaken ? 'pointer' : 'not-allowed', width: '100%',
            boxShadow: actionTaken ? '0 2px 10px rgba(200,72,32,0.4)' : 'none',
          }}
        >
          End Turn →
        </button>
      </div>
    </div>
  );
}
