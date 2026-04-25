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

  const canDraw    = !state.turnState.restUsed &&
    (confirmedAction === null || confirmedAction === 'draw') &&
    player.resources.sunlight >= nextDrawCost && deckOrDiscard;

  const pendingFreeSpread = state.pendingFreeSpreads.find(ps => ps.playerId === playerId);
  const freeSpreadCount = pendingFreeSpread?.spreadsRemaining ?? 0;
  const hasFreeSpread = freeSpreadCount > 0;

  const canSpread  = !state.turnState.restUsed && !isDeepFreeze &&
    (confirmedAction === null || confirmedAction === 'spread') &&
    (hasFreeSpread || (player.resources.moisture >= 1 && !isDrought));

  const canPlant   = !state.turnState.restUsed &&
    (confirmedAction === null || confirmedAction === 'plant') &&
    player.hand.length > 0;

  const canRest    = !state.turnState.restUsed && confirmedAction === null;

  const drawHint = drawn === 0 ? `${nextDrawCost}☀️` : `${nextDrawCost}☀️ (↑ each draw)`;

  const actions: { type: ActionType; label: string; icon: string; enabled: boolean; hint: string }[] = [
    { type: 'draw',   label: 'Draw',   icon: '🃏', enabled: canDraw,   hint: drawHint },
    { type: 'spread', label: 'Spread', icon: '🌐', enabled: canSpread, hint: hasFreeSpread ? `FREE ×${freeSpreadCount}` : `${isDrought ? '✕ Drought' : isDeepFreeze ? '✕ Frozen' : '💧 scaled'}` },
    { type: 'plant',  label: 'Spawn',  icon: '🍄', enabled: canPlant,  hint: 'costs spores' },
    { type: 'rest',   label: 'Rest',   icon: '💤', enabled: canRest,   hint: '+1🍄💧☀️' },
  ];

  const actionTaken = state.turnState.actionType !== null || state.turnState.restUsed;

  return (
    <div style={{
      background: '#231C10',
      borderTop: '1px solid #3C3018',
      padding: '10px 16px',
      display: 'flex', flexDirection: 'column', gap: 8,
      fontFamily: 'sans-serif',
    }}>
      {/* Resource display */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        {(['spore', 'moisture', 'sunlight'] as const).map(res => (
          <div key={res} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 14 }}>{RESOURCE_ICONS[res]}</span>
            <span style={{ color: '#EAE0C8', fontWeight: 700, fontSize: 15 }}>
              {player.resources[res]}
            </span>
          </div>
        ))}

        {message && (
          <span style={{ color: '#D4A820', fontSize: 11, marginLeft: 8 }}>{message}</span>
        )}

        {undoState && (
          <button
            onClick={onUndo}
            style={{
              marginLeft: 'auto',
              background: 'transparent', border: '1px solid #4E4020',
              color: '#B09848', borderRadius: 8,
              padding: '8px 14px', fontWeight: 600, fontSize: 12,
              cursor: 'pointer',
            }}
          >
            ↩ Undo
          </button>
        )}

        <button
          onClick={onEndTurn}
          disabled={!actionTaken}
          style={{
            marginLeft: undoState ? 8 : 'auto',
            background: actionTaken ? '#C84820' : '#231C10',
            color: actionTaken ? '#EAE0C8' : '#6A5830',
            border: actionTaken ? 'none' : '1px solid #3C3018',
            borderRadius: 8,
            padding: '8px 20px', fontWeight: 700, fontSize: 13,
            cursor: actionTaken ? 'pointer' : 'not-allowed',
          }}
        >
          End Turn →
        </button>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        {actions.map(a => {
          const isSelected = selectedAction === a.type;
          return (
            <button
              key={a.type}
              onClick={() => a.enabled && onSelectAction(a.type)}
              disabled={!a.enabled}
              title={a.hint}
              style={{
                flex: 1,
                background: isSelected ? player.color + '33' : '#1A1408',
                border: `1.5px solid ${isSelected ? player.color : !a.enabled ? '#231C10' : '#3C3018'}`,
                borderRadius: 8, padding: '8px 4px',
                color: isSelected ? player.color : !a.enabled ? '#3C3018' : '#B09848',
                fontWeight: isSelected ? 700 : 500,
                fontSize: 12, cursor: a.enabled ? 'pointer' : 'not-allowed',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 18 }}>{a.icon}</span>
              <span>{a.label}</span>
              <span style={{ fontSize: 10, color: 'inherit', opacity: 0.7 }}>{a.hint}</span>
            </button>
          );
        })}
      </div>

      {/* Context hint */}
      {selectedAction === 'spread' && (
        <div style={{ color: '#6AAAC8', fontSize: 11 }}>
          Tap a highlighted tile to spread your network.
        </div>
      )}
      {selectedAction === 'plant' && (
        <div style={{ color: '#C87820', fontSize: 11 }}>
          Select a card below, then tap a highlighted tile to spawn it.
        </div>
      )}
      {selectedAction === 'draw' && (
        <div style={{ color: '#D4A820', fontSize: 11 }}>
          Click Draw again to draw another card (costs 1☀️ each).
        </div>
      )}
    </div>
  );
}
