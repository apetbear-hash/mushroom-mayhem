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
    { type: 'spread', label: 'Spread', icon: '🌐', enabled: canSpread, hint: hasFreeSpread ? `FREE ×${freeSpreadCount}` : isDrought ? '✕ Drought' : isDeepFreeze ? '✕ Frozen' : '💧' },
    { type: 'plant',  label: 'Spawn',  icon: '🍄', enabled: canPlant,  hint: 'costs spores' },
    { type: 'rest',   label: 'Rest',   icon: '💤', enabled: canRest,   hint: '+1 each' },
  ];

  const actionTaken = state.turnState.actionType !== null || state.turnState.restUsed;

  return (
    <div style={{
      background: '#DDD0B0',
      display: 'flex', flexDirection: 'column', gap: 8,
      padding: '10px 12px',
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      height: '100%', boxSizing: 'border-box',
    }}>
      {/* Resources */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        {(['spore', 'moisture', 'sunlight'] as const).map(res => (
          <div key={res} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 19 }}>{RESOURCE_ICONS[res]}</span>
            <span style={{ color: '#1A1408', fontWeight: 700, fontSize: 22 }}>
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
                background: isSelected ? player.color + '22' : '#EAE0C8',
                border: `1.5px solid ${isSelected ? player.color : !a.enabled ? '#C8B88A' : '#B0A070'}`,
                borderRadius: 8, padding: '7px 4px',
                color: isSelected ? player.color : !a.enabled ? '#C8B88A' : '#4A3820',
                fontWeight: isSelected ? 700 : 500,
                fontSize: 17, cursor: a.enabled ? 'pointer' : 'not-allowed',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                transition: 'all 0.15s',
                fontFamily: "'Cormorant Garamond', Georgia, serif",
              }}
            >
              <span style={{ fontSize: 22 }}>{a.icon}</span>
              <span style={{ fontSize: 17 }}>{a.label}</span>
              <span style={{ fontSize: 14, opacity: 0.7 }}>{a.hint}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback message */}
      {message && (
        <div style={{ color: '#C84820', fontSize: 16, textAlign: 'center', lineHeight: 1.3 }}>
          {message}
        </div>
      )}

      {/* Undo + End Turn */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 'auto' }}>
        {undoState && (
          <button onClick={onUndo} style={{
            background: 'transparent', border: '1px solid #B0A070',
            color: '#4A3820', borderRadius: 6,
            padding: '6px 8px', fontWeight: 600, fontSize: 17,
            cursor: 'pointer', width: '100%',
            fontFamily: "'Cormorant Garamond', Georgia, serif",
          }}>
            ↩ Undo
          </button>
        )}
        <button
          onClick={onEndTurn}
          disabled={!actionTaken}
          style={{
            background: actionTaken ? '#C84820' : '#C8B88A',
            color: actionTaken ? '#F2EAD8' : '#8A7848',
            border: 'none',
            borderRadius: 6, padding: '9px', fontWeight: 700, fontSize: 19,
            cursor: actionTaken ? 'pointer' : 'not-allowed', width: '100%',
            boxShadow: actionTaken ? '0 2px 10px rgba(200,72,32,0.3)' : 'none',
            fontFamily: "'Cormorant Garamond', Georgia, serif",
          }}
        >
          End Turn →
        </button>
      </div>
    </div>
  );
}
