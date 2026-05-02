import { useState } from 'react';
import type { GameState } from '../shared/types';
import { CardComponent } from '../agents/card/CardComponent';
import { getCard } from '../agents/card/cards';
import { portraitEmoji } from '../agents/turn/playerSetupData';

interface DraftPhaseScreenProps {
  state: GameState;
  onConfirm: (finalState: GameState) => void;
}

const MAX_DISCARD = 4;
const HUMAN_PLAYER_ID = 'player_0';

function applyAIDraft(state: GameState): GameState {
  let s = state;
  for (const p of s.players) {
    if (p.id === HUMAN_PLAYER_ID) continue;
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
      if (next.has(cardId)) next.delete(cardId);
      else if (next.size < MAX_DISCARD) next.add(cardId);
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

  const canDiscard = markedForDiscard.size < MAX_DISCARD;

  return (
    <div style={{
      minHeight: '100vh', background: '#EAE0C8',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Cormorant Garamond', Georgia, serif", padding: 24,
    }}>
      <div style={{ maxWidth: 1060, width: '100%' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            fontSize: 11, letterSpacing: 3, color: '#8A7848',
            textTransform: 'uppercase', marginBottom: 12,
          }}>
            Starting Draft
          </div>
          <div style={{ fontSize: 40, fontWeight: 700, color: '#1A1408', lineHeight: 1, letterSpacing: -1 }}>
            Choose your starting hand
          </div>
          <div style={{ fontStyle: 'italic', fontSize: 16, color: '#6A5030', marginTop: 10, maxWidth: 480, margin: '10px auto 0' }}>
            Trade up to {MAX_DISCARD} cards for spores. Traded cards go to the discard pile —
            you will not draw them again.
          </div>
        </div>

        {/* Player badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          marginBottom: 28, padding: '8px 20px',
          border: `1px solid ${humanPlayer.color}55`,
          background: `${humanPlayer.color}10`,
          marginLeft: '50%', transform: 'translateX(-50%)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, ${humanPlayer.color}cc, ${humanPlayer.color}55)`,
            border: `2px solid ${humanPlayer.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>
            {portraitEmoji(humanPlayer.portrait)}
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: humanPlayer.color, lineHeight: 1 }}>
              {humanPlayer.name}
            </div>
            <div style={{ fontSize: 13, color: '#6A5030', marginTop: 3, fontStyle: 'italic' }}>
              Starting with {startingSpores} 🍄
              {sporesGained > 0 && (
                <span style={{ color: '#C84820' }}> (+{sporesGained} from trade)</span>
              )}
            </div>
          </div>
        </div>

        {/* Cards */}
        <div style={{ overflowX: 'auto', marginBottom: 20, paddingBottom: 8 }}>
          <div style={{
            display: 'flex', gap: 14, justifyContent: 'center',
            minWidth: 'max-content',
          }}>
          {humanPlayer.hand.map(cardId => {
            const card = getCard(cardId);
            const isMarked = markedForDiscard.has(cardId);
            const isDisabled = !isMarked && !canDiscard;

            return (
              <div
                key={cardId}
                onClick={() => !isDisabled && toggleCard(cardId)}
                style={{
                  position: 'relative',
                  zoom: 0.9,
                  transform: isMarked ? 'translateY(10px)' : 'none',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s',
                  opacity: isDisabled ? 0.3 : 1,
                  cursor: isDisabled ? 'default' : 'pointer',
                  outline: isMarked ? '2px solid #C84820' : 'none',
                  outlineOffset: 3,
                  borderRadius: 14,
                  boxShadow: isMarked
                    ? '0 4px 16px rgba(200,72,32,0.3)'
                    : '0 4px 12px rgba(26,20,8,0.12)',
                }}
              >
                <CardComponent card={card} isPlayable={!isMarked} />
                {isMarked && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    borderRadius: 14,
                    background: 'rgba(200,72,32,0.45)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 4,
                  }}>
                    <div style={{ fontSize: 22 }}>🍄</div>
                    <div style={{
                      fontSize: 11, color: '#F2ECD8', fontWeight: 700,
                      letterSpacing: 1, textTransform: 'uppercase',
                    }}>
                      Trade +1
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>

        {/* Status line */}
        <div style={{ textAlign: 'center', marginBottom: 28, minHeight: 22 }}>
          {markedForDiscard.size === 0 && (
            <span style={{ fontStyle: 'italic', fontSize: 15, color: '#8A7848' }}>
              Click a card to trade it for 1 spore — up to {MAX_DISCARD} cards
            </span>
          )}
          {markedForDiscard.size > 0 && markedForDiscard.size < MAX_DISCARD && (
            <span style={{ fontStyle: 'italic', fontSize: 15, color: '#6A5030' }}>
              Trading {markedForDiscard.size} card{markedForDiscard.size > 1 ? 's' : ''} — you can trade {MAX_DISCARD - markedForDiscard.size} more
            </span>
          )}
          {markedForDiscard.size === MAX_DISCARD && (
            <span style={{ fontStyle: 'italic', fontSize: 15, color: '#C84820' }}>
              {MAX_DISCARD} cards selected — maximum reached
            </span>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          {markedForDiscard.size > 0 && (
            <button
              onClick={() => setMarkedForDiscard(new Set())}
              style={{
                background: 'transparent', border: '1px solid #C8B88A',
                color: '#6A5030', padding: '13px 28px',
                cursor: 'pointer', fontSize: 15,
                fontFamily: "'Cormorant Garamond', Georgia, serif",
              }}
            >
              Clear selection
            </button>
          )}
          <button
            onClick={handleConfirm}
            style={{
              background: '#C84820', color: '#F2ECD8',
              border: 'none', padding: '14px 48px',
              fontSize: 18, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              letterSpacing: 0.3,
              boxShadow: '0 4px 18px rgba(200,72,32,0.3)',
            }}
          >
            {markedForDiscard.size === 0
              ? 'Keep all cards →'
              : `Trade ${markedForDiscard.size} card${markedForDiscard.size > 1 ? 's' : ''} & start →`}
          </button>
        </div>

      </div>
    </div>
  );
}
