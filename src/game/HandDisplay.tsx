import { CardComponent } from '../agents/card/CardComponent';
import { getCard } from '../agents/card/cards';
import type { GameState } from '../shared/types';
import { canPlantOnTile } from '../agents/card';
import { getDisruptionModifiers } from '../agents/card/powers';

interface HandDisplayProps {
  state: GameState;
  playerId: string;
  selectedCardId: number | null;
  plantMode: boolean;
  onSelectCard: (cardId: number) => void;
}

export function HandDisplay({
  state,
  playerId,
  selectedCardId,
  plantMode,
  onSelectCard,
}: HandDisplayProps) {
  const player = state.players.find(p => p.id === playerId)!;

  if (player.hand.length === 0) {
    return (
      <div style={{ color: '#5A4830', fontSize: 12, padding: '8px 0', fontStyle: 'italic', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
        Hand is empty
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', gap: 10, overflowX: 'auto',
      padding: '4px 0 8px', alignItems: 'flex-start',
    }}>
      {player.hand.map(cardId => {
        const card = getCard(cardId);
        const affordable = player.resources.spore >= card.cost;

        // Check if card is plantable anywhere in the network
        const plantable = plantMode && affordable && player.networkTileIds.some(tileId => {
          if (!canPlantOnTile(cardId, tileId, state)) return false;
          return !getDisruptionModifiers(tileId, playerId, state).cannotPlantOnTile;
        });

        const isSelected = selectedCardId === cardId;

        return (
          <div
            key={cardId}
            onClick={() => plantMode && plantable && onSelectCard(cardId)}
            style={{
              flexShrink: 0,
              opacity: plantMode && !plantable ? 0.35 : 1,
              transform: isSelected ? 'translateY(-8px)' : 'none',
              transition: 'transform 0.15s, opacity 0.15s',
              cursor: plantMode && plantable ? 'pointer' : 'default',
              outline: isSelected ? `2px solid #fff` : 'none',
              borderRadius: 10,
            }}
          >
            <CardComponent
              card={card}
              isSelected={isSelected}
              isPlayable={!plantMode || plantable}
            />
          </div>
        );
      })}
    </div>
  );
}
