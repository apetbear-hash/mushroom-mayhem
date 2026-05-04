import { useState } from 'react';
import type { GameState } from '../shared/types';
import { CardComponent } from '../agents/card/CardComponent';
import { getCard } from '../agents/card/cards';
import { getSeason } from '../agents/seasonal';

interface SeasonEffectModalProps {
  state: GameState;
  playerId: string;
  onConfirm: (newState: GameState) => void;
  onSkip: () => void;
}

function isLowValue(cardId: number): boolean {
  const c = getCard(cardId);
  return c.pts === 0 && Object.keys(c.generates).length === 0;
}

export function SeasonEffectModal({ state, playerId, onConfirm, onSkip }: SeasonEffectModalProps) {
  const season = getSeason(state.currentTurn);
  const effect = state.forecast[season];
  const player = state.players.find(p => p.id === playerId)!;

  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());
  const maxSwap = Math.min(player.hand.length - 1, state.deck.length);

  function toggleCard(cardId: number) {
    setSelectedCards(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else if (next.size < maxSwap) next.add(cardId);
      return next;
    });
  }

  function handleConfirm() {
    if (selectedCards.size === 0) { onSkip(); return; }
    const discardIds = Array.from(selectedCards);
    const drawn = state.deck.slice(0, discardIds.length);
    const newHand = player.hand.filter(id => !discardIds.includes(id)).concat(drawn);
    onConfirm({
      ...state,
      players: state.players.map(p => p.id === playerId ? { ...p, hand: newHand } : p),
      deck: state.deck.slice(discardIds.length),
      discard: [...state.discard, ...discardIds],
    });
  }

  if (effect !== 'germination_gamble') return null;

  const swapCount = selectedCards.size;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(26,20,8,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 150, fontFamily: "'Cormorant Garamond', Georgia, serif",
    }}>
      <div style={{
        background: '#F2ECD8',
        border: '2px solid #4A8030',
        borderRadius: 20, padding: '28px 32px',
        maxWidth: 'min(92vw, 1100px)', width: '100%',
        boxShadow: '0 8px 48px rgba(26,20,8,0.25)',
      }}>
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#4A8030', letterSpacing: 3, marginBottom: 6, fontFamily: 'sans-serif' }}>
            🌿 SPRING EFFECT
          </div>
          <div style={{ fontSize: 22, color: '#1A1408', fontWeight: 800, marginBottom: 6 }}>
            Germination Gamble
          </div>
          <div style={{ fontSize: 14, color: '#3A1E08', maxWidth: 380, margin: '0 auto', lineHeight: 1.5 }}>
            Swap unwanted cards for fresh draws. Select cards to replace,
            then draw the same number from the deck.
            {maxSwap === 0 && (
              <span style={{ color: '#C84820', display: 'block', marginTop: 4, fontSize: 15 }}>
                Deck is empty — no swaps available.
              </span>
            )}
          </div>
        </div>

        {maxSwap > 0 && (
          <div style={{
            display: 'flex', gap: 8,
            overflowX: 'auto', marginBottom: 16,
            padding: '4px 2px',
            scrollbarWidth: 'thin', scrollbarColor: '#C8B88A transparent',
          }}>
            {player.hand.map(cardId => {
              const isSelected = selectedCards.has(cardId);
              const recommended = isLowValue(cardId);
              const canSelect = selectedCards.size < maxSwap || isSelected;

              return (
                <div
                  key={cardId}
                  onClick={() => canSelect && toggleCard(cardId)}
                  style={{
                    position: 'relative',
                    transform: isSelected ? 'translateY(6px)' : 'none',
                    transition: 'transform 0.15s, opacity 0.15s',
                    opacity: isSelected ? 0.55 : (!canSelect ? 0.35 : 1),
                    cursor: canSelect ? 'pointer' : 'default',
                    outline: isSelected
                      ? '2px solid #C84820'
                      : recommended && canSelect ? '1.5px dashed #4A803088' : 'none',
                    borderRadius: 14,
                  }}
                >
                  <CardComponent card={getCard(cardId)} isPlayable={!isSelected} />
                  {isSelected && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      borderRadius: 14, background: 'rgba(26,20,8,0.5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, color: '#F2ECD8', fontWeight: 700, letterSpacing: 1,
                      fontFamily: 'sans-serif',
                    }}>
                      SWAP OUT
                    </div>
                  )}
                  {!isSelected && recommended && (
                    <div style={{
                      position: 'absolute', bottom: 4, left: 0, right: 0,
                      textAlign: 'center', fontSize: 12, color: '#4A8030', letterSpacing: 0.5,
                      fontFamily: 'sans-serif',
                    }}>
                      ↑ low value
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ textAlign: 'center', fontSize: 15, color: '#4A2E08', marginBottom: 20, minHeight: 16 }}>
          {swapCount === 0 && maxSwap > 0 && 'Click cards to swap them out — or skip to keep your hand'}
          {swapCount > 0 && `Swapping ${swapCount} card${swapCount > 1 ? 's' : ''} — draw ${swapCount} fresh`}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={onSkip}
            style={{
              background: 'transparent', border: '1px solid #C8B88A',
              color: '#3A1E08', borderRadius: 8, padding: '10px 22px',
              cursor: 'pointer', fontSize: 14,
              fontFamily: "'Cormorant Garamond', Georgia, serif",
            }}
          >
            Skip
          </button>
          <button
            onClick={handleConfirm}
            disabled={maxSwap === 0}
            style={{
              background: swapCount > 0 ? '#C84820' : '#DDD0B0',
              color: swapCount > 0 ? '#F2ECD8' : '#4A2E08',
              border: 'none',
              borderRadius: 8, padding: '10px 28px',
              cursor: swapCount > 0 ? 'pointer' : 'default',
              fontWeight: 700, fontSize: 15,
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              boxShadow: swapCount > 0 ? '0 4px 16px rgba(200,72,32,0.3)' : 'none',
            }}
          >
            {swapCount > 0 ? `Swap ${swapCount} card${swapCount > 1 ? 's' : ''} →` : 'Keep hand →'}
          </button>
        </div>
      </div>
    </div>
  );
}
