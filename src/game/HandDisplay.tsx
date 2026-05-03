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
      display: 'flex', overflowX: 'auto',
      padding: '52px 8px 4px', alignItems: 'flex-end',
    }}>
      {player.hand.map((cardId, idx) => {
        const card = getCard(cardId);
        const affordable = player.resources.spore >= card.cost;

        const plantable = plantMode && affordable && player.networkTileIds.some(tileId => {
          if (!canPlantOnTile(cardId, tileId, state)) return false;
          return !getDisruptionModifiers(tileId, playerId, state).cannotPlantOnTile;
        });

        const isSelected = selectedCardId === cardId;
        const isHovered = hoveredCardId === cardId;
        const isLast = idx === player.hand.length - 1;
        const origin = idx === 0 ? 'bottom left' : isLast ? 'bottom right' : 'bottom center';

        let transform = 'none';
        if (isHovered && isSelected) transform = `scale(${HOVER_SCALE}) translateY(-18px)`;
        else if (isHovered)          transform = `scale(${HOVER_SCALE}) translateY(-8px)`;
        else if (isSelected)         transform = 'translateY(-12px)';

        return (
          <div
            key={cardId}
            onClick={() => plantMode && plantable && onSelectCard(cardId)}
            onMouseEnter={() => setHoveredCardId(cardId)}
            onMouseLeave={() => setHoveredCardId(null)}
            style={{
              flexShrink: 0,
              zoom: CARD_SCALE,
              marginRight: isLast ? 0 : -82,
              opacity: plantMode && !plantable ? 0.35 : 1,
              transform,
              transformOrigin: origin,
              transition: 'transform 0.18s ease, opacity 0.15s',
              cursor: plantMode && plantable ? 'pointer' : 'default',
              outline: isSelected ? `2px solid #1A1408` : 'none',
              borderRadius: 14,
              zIndex: isHovered ? 20 : isSelected ? 10 : idx,
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
