import type { CardDefinition } from '../../shared/types';
import { TYPE_COLORS, RESOURCE_COLORS, HABITAT_COLORS } from '../../shared/constants';

interface CardProps {
  card: CardDefinition;
  isSelected?: boolean;
  isPlayable?: boolean;
  onClick?: () => void;
}

const RESOURCE_ICONS: Record<string, string> = {
  spore:    '🍄',
  moisture: '💧',
  sunlight: '☀️',
};

const HABITAT_LABELS: Record<string, string> = {
  tree:  'Tree',
  decay: 'Decay',
  shade: 'Shade',
  wet:   'Wet',
  open:  'Open',
};

export function CardComponent({ card, isSelected = false, isPlayable = true, onClick }: CardProps) {
  const typeColor = TYPE_COLORS[card.type] ?? '#888';
  const resourceEntries = Object.entries(card.generates).filter(([, v]) => (v ?? 0) > 0);

  return (
    <div
      onClick={isPlayable ? onClick : undefined}
      style={{
        width: 140,
        borderRadius: 10,
        border: `2px solid ${isSelected ? '#fff' : typeColor}`,
        background: '#1a1a2e',
        color: '#eee',
        fontFamily: 'sans-serif',
        fontSize: 11,
        cursor: isPlayable ? 'pointer' : 'default',
        opacity: isPlayable ? 1 : 0.5,
        boxShadow: isSelected ? `0 0 10px ${typeColor}` : '0 2px 6px rgba(0,0,0,0.5)',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Type stripe */}
      <div style={{
        background: typeColor,
        borderRadius: '8px 8px 0 0',
        padding: '4px 8px',
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: '#fff',
      }}>
        {card.type}
      </div>

      {/* Card name + pts */}
      <div style={{ padding: '6px 8px 2px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 12, lineHeight: 1.3 }}>{card.name}</div>
          <div style={{ color: '#aaa', fontSize: 9, fontStyle: 'italic' }}>{card.scientificName}</div>
        </div>
        {card.pts > 0 && (
          <div style={{
            background: '#c9a84c',
            color: '#1a1a1a',
            borderRadius: 4,
            padding: '2px 5px',
            fontWeight: 700,
            fontSize: 13,
            minWidth: 20,
            textAlign: 'center',
          }}>
            {card.pts}
          </div>
        )}
      </div>

      {/* Cost + Habitats */}
      <div style={{ padding: '2px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ color: RESOURCE_COLORS.spore, fontWeight: 700 }}>
            {card.cost}🍄
          </span>
        </div>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {card.habitats.map(h => (
            <span
              key={h}
              style={{
                background: HABITAT_COLORS[h],
                color: '#fff',
                borderRadius: 3,
                padding: '1px 4px',
                fontSize: 9,
                fontWeight: 600,
              }}
            >
              {HABITAT_LABELS[h]}
            </span>
          ))}
        </div>
      </div>

      {/* Resource generation */}
      {resourceEntries.length > 0 && (
        <div style={{ padding: '2px 8px', display: 'flex', gap: 6 }}>
          {resourceEntries.map(([resource, amount]) => (
            <span key={resource} style={{ color: RESOURCE_COLORS[resource], fontWeight: 600 }}>
              +{amount}{RESOURCE_ICONS[resource]}
            </span>
          ))}
        </div>
      )}

      {/* Power text */}
      <div style={{
        padding: '4px 8px 8px',
        color: card.isOngoing ? '#b8e0d4' : '#ccc',
        fontSize: 10,
        lineHeight: 1.4,
        flex: 1,
      }}>
        {card.power}
      </div>
    </div>
  );
}
