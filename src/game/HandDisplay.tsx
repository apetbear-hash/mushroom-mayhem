import { useState } from 'react';
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

const CARD_SCALE = 0.72;
// Hover scale relative to zoom'd size — brings card to ~full size
const HOVER_SCALE = 1 / CARD_SCALE;

export function HandDisplay({
  state, playerId, selectedCardId, plantMode, onSelectCard,
}: HandDisplayProps) {
  const player = state.players.find(p => p.id === playerId)!;
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null);

  if (player.hand.length === 0) {
    return (
      <div style={{
        color: '#8A7848', fontSize: 13, padding: '8px 0',
        fontStyle: 'italic', fontFamily: "'Cormorant Garamond', Georgia, serif",
      }}>
        Hand is empty
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', gap: 8, overflowX: 'auto',
      padding: '4px 0 4px', alignItems: 'flex-end',
    }}>
      {player.hand.map(cardId => {
        const card = getCard(cardId);
        const affordable = player.resources.spore >= card.cost;

        const plantable = plantMode && affordable && player.networkTileIds.some(tileId => {
          if (!canPlantOnTile(cardId, tileId, state)) return false;
          return !getDisruptionModifiers(tileId, playerId, state).cannotPlantOnTile;
        });

        const isSelected = selectedCardId === cardId;
        const isHovered = hoveredCardId === cardId;

        // Compute transform: hovered → scale up to full size; selected → lift; both → combine
        let transform = 'none';
        if (isHovered && isSelected) transform = `scale(${HOVER_SCALE}) translateY(-14px)`;
        else if (isHovered)          transform = `scale(${HOVER_SCALE}) translateY(-4px)`;
        else if (isSelected)         transform = 'translateY(-10px)';

        return (
          <div
            key={cardId}
            onClick={() => plantMode && plantable && onSelectCard(cardId)}
            onMouseEnter={() => setHoveredCardId(cardId)}
            onMouseLeave={() => setHoveredCardId(null)}
            style={{
              flexShrink: 0,
              zoom: CARD_SCALE,
              opacity: plantMode && !plantable ? 0.35 : 1,
              transform,
              transformOrigin: 'bottom center',
              transition: 'transform 0.18s ease, opacity 0.15s',
              cursor: plantMode && plantable ? 'pointer' : 'default',
              outline: isSelected ? `2px solid #1A1408` : 'none',
              borderRadius: 14,
              zIndex: isHovered ? 20 : isSelected ? 10 : 1,
              position: 'relative',
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
