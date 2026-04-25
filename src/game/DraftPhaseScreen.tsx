import { useState } from 'react';
import type { GameState } from '../shared/types';
import { CardComponent } from '../agents/card/CardComponent';
import { getCard } from '../agents/card/cards';
import { portraitEmoji } from '../agents/turn/playerSetupData';

interface DraftPhaseScreenProps {
  state: GameState;
  onConfirm: (finalState: GameState) => void;
}

const MAX_DISCARD = 2;

const HUMAN_PLAYER_ID = 'player_0';

// Auto-draft for AI players: discard 0-pt/0-resource cards (up to 2) for spores.
function applyAIDraft(state: GameState): GameState {
  let s = state;
  for (const p of s.players) {
    if (p.id === HUMAN_PLAYER_ID) continue; // human drafts manually
    const toDiscard = p.hand
      .filter(id => {
        const c = getCard(id);
        return c.pts === 0 && Object.keys(c.generates).length === 0;
      })
      .slice(0, MAX_DISCARD);
    if (toDiscard.length === 0) continue;
    s = {
      ...s,
      players: s.players.map(pl => pl.id === p.id
        ? {
          ...pl,
          hand: pl.hand.filter(id => !toDiscard.includes(id)),
          resources: { ...pl.resources, spore: pl.resources.spore + toDiscard.length },
        }
        : pl,
      ),
      discard: [...s.discard, ...toDiscard],
    };
  }
  return s;
}

export function DraftPhaseScreen({ state, onConfirm }: DraftPhaseScreenProps) {
  const humanPlayer = state.players.find(p => p.id === HUMAN_PLAYER_ID)!;
  const [markedForDiscard, setMarkedForDiscard] = useState<Set<number>>(new Set());

  const sporesGained = markedForDiscard.size;
  const startingSpores = humanPlayer.resources.spore + sporesGained;

  function toggleCard(cardId: number) {
    setMarkedForDiscard(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else if (next.size < MAX_DISCARD) {
        next.add(cardId);
      }
      return next;
    });
  }

  function handleConfirm() {
    const discardIds = Array.from(markedForDiscard);
    let s = {
      ...state,
      players: state.players.map(p => p.id === HUMAN_PLAYER_ID
        ? {
          ...p,
          hand: p.hand.filter(id => !discardIds.includes(id)),
          resources: { ...p.resources, spore: p.resources.spore + discardIds.length },
        }
        : p,
      ),
      discard: [...state.discard, ...discardIds],
    };
    s = applyAIDraft(s);
    onConfirm(s);
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0d0d1a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'sans-serif', padding: 24,
    }}>
      <div style={{ maxWidth: 700, width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: '#555', letterSpacing: 3, marginBottom: 8 }}>
            STARTING DRAFT
          </div>
          <div style={{ fontSize: 22, color: '#eee', fontWeight: 800, marginBottom: 8 }}>
            Choose your starting hand
          </div>
          <div style={{ fontSize: 13, color: '#777', maxWidth: 440, margin: '0 auto' }}>
            Trade up to {MAX_DISCARD} cards for spores. Traded cards go to the discard pile —
            you will not draw them again.
          </div>
        </div>

        {/* Player info */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 24, justifyContent: 'center',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: humanPlayer.color + '22',
            border: `2px solid ${humanPlayer.color}66`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>
            {portraitEmoji(humanPlayer.portrait)}
          </div>
          <div>
            <div style={{ color: humanPlayer.color, fontWeight: 700, fontSize: 15 }}>
              {humanPlayer.name}
            </div>
            <div style={{ color: '#555', fontSize: 11 }}>
              Starting with {startingSpores} 🍄 spore{startingSpores !== 1 ? 's' : ''}
              {sporesGained > 0 && (
                <span style={{ color: '#c9a84c' }}> (+{sporesGained} from trade)</span>
              )}
            </div>
          </div>
        </div>

        {/* Cards */}
        <div style={{
          display: 'flex', gap: 10, justifyContent: 'center',
          flexWrap: 'wrap', marginBottom: 24,
        }}>
          {humanPlayer.hand.map(cardId => {
            const card = getCard(cardId);
            const isMarked = markedForDiscard.has(cardId);
            const canMark = markedForDiscard.size < MAX_DISCARD || isMarked;

            return (
              <div
                key={cardId}
                onClick={() => canMark && toggleCard(cardId)}
                style={{
                  position: 'relative',
                  transform: isMarked ? 'translateY(8px)' : 'none',
                  transition: 'transform 0.15s, opacity 0.15s',
                  opacity: isMarked ? 0.6 : (!canMark ? 0.4 : 1),
                  cursor: canMark ? 'pointer' : 'default',
                  outline: isMarked ? '2px solid #c9a84c' : 'none',
                  borderRadius: 10,
                }}
              >
                <CardComponent card={card} isPlayable={!isMarked} />
                {isMarked && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    borderRadius: 10,
                    background: 'rgba(0,0,0,0.55)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: '#c9a84c', fontWeight: 700, letterSpacing: 1,
                  }}>
                    TRADE +1🍄
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Hint */}
        <div style={{ textAlign: 'center', marginBottom: 20, minHeight: 18 }}>
          {markedForDiscard.size === 0 && (
            <span style={{ color: '#444', fontSize: 12 }}>
              Click a card to trade it for 1 spore
            </span>
          )}
          {markedForDiscard.size > 0 && markedForDiscard.size < MAX_DISCARD && (
            <span style={{ color: '#888', fontSize: 12 }}>
              Trading {markedForDiscard.size} card{markedForDiscard.size > 1 ? 's' : ''} — you can trade {MAX_DISCARD - markedForDiscard.size} more
            </span>
          )}
          {markedForDiscard.size === MAX_DISCARD && (
            <span style={{ color: '#c9a84c', fontSize: 12 }}>
              Maximum {MAX_DISCARD} cards selected
            </span>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {markedForDiscard.size > 0 && (
            <button
              onClick={() => setMarkedForDiscard(new Set())}
              style={{
                background: 'transparent', border: '1px solid #333',
                color: '#666', borderRadius: 8, padding: '12px 24px',
                cursor: 'pointer', fontSize: 13,
              }}
            >
              Clear selection
            </button>
          )}
          <button
            onClick={handleConfirm}
            style={{
              background: '#5cb85c', color: '#111',
              border: 'none', borderRadius: 8,
              padding: '14px 40px', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', letterSpacing: 0.5,
            }}
          >
            {markedForDiscard.size === 0 ? 'Keep all cards →' : `Trade ${markedForDiscard.size} card${markedForDiscard.size > 1 ? 's' : ''} & start →`}
          </button>
        </div>
      </div>
    </div>
  );
}
