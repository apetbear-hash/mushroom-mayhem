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

// Cards that are worth swapping (0 pts, 0 resources) — shown as "recommended"
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
      if (next.has(cardId)) {
        next.delete(cardId);
      } else if (next.size < maxSwap) {
        next.add(cardId);
      }
      return next;
    });
  }

  function handleConfirm() {
    if (selectedCards.size === 0) { onSkip(); return; }

    const discardIds = Array.from(selectedCards);
    const drawn = state.deck.slice(0, discardIds.length);
    const newHand = player.hand.filter(id => !discardIds.includes(id)).concat(drawn);

    const newState: GameState = {
      ...state,
      players: state.players.map(p =>
        p.id === playerId ? { ...p, hand: newHand } : p,
      ),
      deck: state.deck.slice(discardIds.length),
      discard: [...state.discard, ...discardIds],
    };
    onConfirm(newState);
  }

  if (effect !== 'germination_gamble') return null;

  const swapCount = selectedCards.size;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.82)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 150, fontFamily: 'sans-serif',
    }}>
      <div style={{
        background: '#12121f',
        border: '2px solid #5cb85c',
        borderRadius: 20, padding: '28px 32px',
        maxWidth: 580, width: '100%',
        boxShadow: '0 0 40px #5cb85c22',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#5cb85c', letterSpacing: 3, marginBottom: 6 }}>
            🌿 SPRING EFFECT
          </div>
          <div style={{ fontSize: 18, color: '#eee', fontWeight: 800, marginBottom: 6 }}>
            Germination Gamble
          </div>
          <div style={{ fontSize: 12, color: '#888', maxWidth: 380, margin: '0 auto' }}>
            Swap unwanted cards for fresh draws. Select cards to replace,
            then draw the same number from the deck.
            {maxSwap === 0 && (
              <span style={{ color: '#e05c5c', display: 'block', marginTop: 4 }}>
                Deck is empty — no swaps available.
              </span>
            )}
          </div>
        </div>

        {/* Cards */}
        {maxSwap > 0 && (
          <div style={{
            display: 'flex', gap: 8, justifyContent: 'center',
            flexWrap: 'wrap', marginBottom: 16,
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
                      ? '2px solid #e05c5c'
                      : recommended && canSelect ? '1.5px dashed #5cb85c55' : 'none',
                    borderRadius: 10,
                  }}
                >
                  <CardComponent card={getCard(cardId)} isPlayable={!isSelected} />
                  {isSelected && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      borderRadius: 10, background: 'rgba(0,0,0,0.55)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: '#e05c5c', fontWeight: 700, letterSpacing: 1,
                    }}>
                      SWAP OUT
                    </div>
                  )}
                  {!isSelected && recommended && (
                    <div style={{
                      position: 'absolute', bottom: 4, left: 0, right: 0,
                      textAlign: 'center', fontSize: 8, color: '#5cb85c', letterSpacing: 0.5,
                    }}>
                      ↑ low value
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Status line */}
        <div style={{ textAlign: 'center', fontSize: 11, color: '#666', marginBottom: 20, minHeight: 16 }}>
          {swapCount === 0 && maxSwap > 0 && 'Click cards to swap them out — or skip to keep your hand'}
          {swapCount > 0 && `Swapping ${swapCount} card${swapCount > 1 ? 's' : ''} — draw ${swapCount} fresh`}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={onSkip}
            style={{
              background: 'transparent', border: '1px solid #333',
              color: '#666', borderRadius: 8, padding: '10px 22px',
              cursor: 'pointer', fontSize: 13,
            }}
          >
            Skip
          </button>
          <button
            onClick={handleConfirm}
            disabled={maxSwap === 0}
            style={{
              background: swapCount > 0 ? '#5cb85c' : '#1a1a2e',
              color: swapCount > 0 ? '#111' : '#555',
              border: `1px solid ${swapCount > 0 ? '#5cb85c' : '#333'}`,
              borderRadius: 8, padding: '10px 28px',
              cursor: swapCount > 0 ? 'pointer' : 'default',
              fontWeight: 700, fontSize: 13,
            }}
          >
            {swapCount > 0 ? `Swap ${swapCount} card${swapCount > 1 ? 's' : ''} →` : 'Keep hand →'}
          </button>
        </div>
      </div>
    </div>
  );
}
