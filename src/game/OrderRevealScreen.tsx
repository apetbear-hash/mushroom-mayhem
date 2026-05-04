import { CardComponent } from '../agents/card/CardComponent';
import { getCard } from '../agents/card/cards';
import type { OrderEntry } from '../agents/simulation/gameInit';

interface OrderRevealScreenProps {
  orderCards: OrderEntry[];
  onContinue: () => void;
}

export function OrderRevealScreen({ orderCards, onContinue }: OrderRevealScreenProps) {
  return (
    <div style={{
      minHeight: '100vh', background: '#EAE0C8',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Cormorant Garamond', Georgia, serif", padding: 24,
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{
          fontSize: 11, letterSpacing: 3, color: '#4A2E08',
          textTransform: 'uppercase', marginBottom: 12,
        }}>
          Turn Order Determined
        </div>
        <div style={{ fontSize: 40, fontWeight: 700, color: '#1A1408', lineHeight: 1, letterSpacing: -1 }}>
          Highest card plays first
        </div>
        <div style={{ fontStyle: 'italic', fontSize: 16, color: '#3A1E08', marginTop: 10 }}>
          Each player revealed one card from the deck. Tiebreak: highest cost.
        </div>
      </div>

      {/* Player cards in order */}
      <div style={{
        display: 'flex', gap: 28, alignItems: 'flex-end',
        justifyContent: 'center', flexWrap: 'wrap', marginBottom: 44,
      }}>
        {orderCards.map((entry, i) => {
          const card = getCard(entry.cardId);
          const isFirst = i === 0;
          return (
            <div key={entry.playerId} style={{ textAlign: 'center' }}>
              {/* Rank badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                marginBottom: 12, padding: '5px 14px',
                border: `1px solid ${entry.color}55`,
                background: isFirst ? `${entry.color}18` : 'transparent',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: `radial-gradient(circle at 35% 35%, ${entry.color}cc, ${entry.color}55)`,
                  border: `1.5px solid ${entry.color}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{i + 1}</span>
                </div>
                <span style={{
                  fontSize: 13, letterSpacing: 1.5, fontWeight: 700,
                  color: isFirst ? entry.color : '#3A1E08', textTransform: 'uppercase',
                }}>
                  {entry.name}
                  {isFirst && <span style={{ marginLeft: 6, fontSize: 10 }}>▶ first</span>}
                </span>
              </div>

              {/* Card */}
              <div style={{
                transform: isFirst ? 'translateY(-8px)' : 'none',
                outline: isFirst ? `2px solid ${entry.color}` : 'none',
                outlineOffset: 4,
                borderRadius: 14,
                boxShadow: isFirst ? `0 8px 24px ${entry.color}44` : '0 4px 12px rgba(26,20,8,0.12)',
              }}>
                <CardComponent card={card} isPlayable />
              </div>

              {/* Score label */}
              <div style={{
                marginTop: 10, fontSize: 13, color: '#3A1E08', fontStyle: 'italic',
              }}>
                {card.pts} pt{card.pts !== 1 ? 's' : ''} · {card.cost} 🍄 cost
              </div>
            </div>
          );
        })}
      </div>

      {/* Continue */}
      <button
        onClick={onContinue}
        style={{
          background: '#C84820', color: '#F2ECD8',
          border: 'none', padding: '16px 48px',
          fontSize: 18, fontWeight: 700, cursor: 'pointer',
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          letterSpacing: 0.5,
          boxShadow: '0 4px 18px rgba(200,72,32,0.3)',
        }}
      >
        Continue to Draft →
      </button>
    </div>
  );
}
