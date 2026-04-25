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
      background: 'rgba(14,9,4,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 150, fontFamily: "'Cormorant Garamond', Georgia, serif",
    }}>
      <div style={{
        background: '#231C10',
        border: '2px solid #6AA84A',
        borderRadius: 20, padding: '28px 32px',
        maxWidth: 580, width: '100%',
        boxShadow: '0 0 48px rgba(106,168,74,0.2)',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: '#6AA84A', letterSpacing: 3, marginBottom: 6, fontFamily: 'sans-serif' }}>
            🌿 SPRING EFFECT
          </div>
          <div style={{ fontSize: 22, color: '#EAE0C8', fontWeight: 800, marginBottom: 6 }}>
            Germination Gamble
          </div>
          <div style={{ fontSize: 14, color: '#B09848', maxWidth: 380, margin: '0 auto', lineHeight: 1.5 }}>
            Swap unwanted cards for fresh draws. Select cards to replace,
            then draw the same number from the deck.
            {maxSwap === 0 && (
              <span style={{ color: '#C84820', display: 'block', marginTop: 4, fontSize: 13 }}>
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
                      ? '2px solid #C84820'
                      : recommended && canSelect ? '1.5px dashed #6AA84A55' : 'none',
                    borderRadius: 14,
                  }}
                >
                  <CardComponent card={getCard(cardId)} isPlayable={!isSelected} />
                  {isSelected && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                      borderRadius: 14, background: 'rgba(14,9,4,0.6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: '#C84820', fontWeight: 700, letterSpacing: 1,
                      fontFamily: 'sans-serif',
                    }}>
                      SWAP OUT
                    </div>
                  )}
                  {!isSelected && recommended && (
                    <div style={{
                      position: 'absolute', bottom: 4, left: 0, right: 0,
                      textAlign: 'center', fontSize: 10, color: '#6AA84A', letterSpacing: 0.5,
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

        {/* Status line */}
        <div style={{ textAlign: 'center', fontSize: 13, color: '#6A5830', marginBottom: 20, minHeight: 16 }}>
          {swapCount === 0 && maxSwap > 0 && 'Click cards to swap them out — or skip to keep your hand'}
          {swapCount > 0 && `Swapping ${swapCount} card${swapCount > 1 ? 's' : ''} — draw ${swapCount} fresh`}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={onSkip}
            style={{
              background: 'transparent', border: '1px solid #3C3018',
              color: '#B09848', borderRadius: 8, padding: '10px 22px',
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
              background: swapCount > 0 ? '#C84820' : '#1A1408',
              color: swapCount > 0 ? '#EAE0C8' : '#6A5830',
              border: `1px solid ${swapCount > 0 ? '#C84820' : '#3C3018'}`,
              borderRadius: 8, padding: '10px 28px',
              cursor: swapCount > 0 ? 'pointer' : 'default',
              fontWeight: 700, fontSize: 15,
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              boxShadow: swapCount > 0 ? '0 4px 16px rgba(200,72,32,0.35)' : 'none',
            }}
          >
            {swapCount > 0 ? `Swap ${swapCount} card${swapCount > 1 ? 's' : ''} →` : 'Keep hand →'}
          </button>
        </div>
      </div>
    </div>
  );
}
