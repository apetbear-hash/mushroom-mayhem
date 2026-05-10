import { useState, useEffect } from 'react';
import type { GameState } from './shared/types';
import { PlayerSetup } from './agents/turn/PlayerSetup';
import type { PlayerDraft } from './agents/turn/PlayerSetup';
import { GameScreen } from './game/GameScreen';
import { DraftPhaseScreen } from './game/DraftPhaseScreen';
import { OrderRevealScreen } from './game/OrderRevealScreen';
import { BalancePanel } from './agents/balance';
import { LandingPage } from './game/LandingPage';
import { createInitialGameState } from './agents/simulation/gameInit';
import type { OrderEntry } from './agents/simulation/gameInit';

type Screen = 'landing' | 'setup' | 'order-reveal' | 'draft' | 'game' | 'balance';

export function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [orderCards, setOrderCards] = useState<OrderEntry[]>([]);
  const [devMode, setDevMode] = useState(false);
  const [humanPlayerIds, setHumanPlayerIds] = useState<string[]>(['player_0']);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const isInGame = screen === 'order-reveal' || screen === 'draft' || screen === 'game';

  useEffect(() => {
    if (!isInGame) return;
    window.history.pushState(null, '', window.location.href);
    function handlePopState() {
      window.history.pushState(null, '', window.location.href);
      setShowLeaveConfirm(true);
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isInGame]);

  function handleSetupConfirm(players: PlayerDraft[], isDevMode: boolean) {
    const { state, orderCards: cards } = createInitialGameState(players);
    setDevMode(isDevMode);
    setHumanPlayerIds(players.map((p, i) => p.isHuman ? `player_${i}` : null).filter((id): id is string => id !== null));
    setGameState(state);
    setOrderCards(cards);
    setScreen('order-reveal');
  }

  function handleDraftConfirm(draftedState: GameState) {
    setGameState(draftedState);
    setScreen('game');
  }

  function handleLeaveConfirmed() {
    setShowLeaveConfirm(false);
    setGameState(null);
    setScreen('setup');
  }

  // Non-game screens — no overlay needed
  if (screen === 'landing') {
    return <LandingPage onPlay={() => setScreen('setup')} />;
  }

  if (screen === 'setup') {
    return (
      <div style={{ minHeight: '100vh', background: '#0d0d1a' }}>
        <PlayerSetup onConfirm={handleSetupConfirm} />
        <div style={{ textAlign: 'center', paddingBottom: 24 }}>
          <button
            onClick={() => setScreen('balance')}
            style={{
              background: 'transparent', border: '1px solid #333',
              color: '#555', borderRadius: 8, padding: '8px 20px',
              cursor: 'pointer', fontSize: 12,
            }}
          >
            Balance Agent
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'balance') {
    return (
      <div style={{ background: '#0d0d1a', minHeight: '100vh' }}>
        <div style={{ padding: '12px 24px', borderBottom: '1px solid #222' }}>
          <button
            onClick={() => setScreen('setup')}
            style={{
              background: 'transparent', border: '1px solid #444',
              color: '#888', borderRadius: 6, padding: '6px 14px',
              cursor: 'pointer', fontSize: 12,
            }}
          >
            ← Back
          </button>
        </div>
        <BalancePanel />
      </div>
    );
  }

  // Game screens — rendered together so the leave-confirm overlay can float above any of them
  return (
    <>
      {screen === 'order-reveal' && (
        <OrderRevealScreen
          orderCards={orderCards}
          onContinue={() => setScreen('draft')}
        />
      )}
      {screen === 'draft' && gameState && (
        <DraftPhaseScreen
          state={gameState}
          onConfirm={handleDraftConfirm}
          humanPlayerIds={humanPlayerIds}
        />
      )}
      {screen === 'game' && gameState && (
        <GameScreen
          initialState={gameState}
          devMode={devMode}
          humanPlayerIds={humanPlayerIds}
          onNewGame={() => setScreen('setup')}
        />
      )}

      {showLeaveConfirm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(14,10,4,0.88)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Cormorant Garamond', Georgia, serif",
        }}>
          <div style={{
            background: '#F2ECD8',
            borderRadius: 12,
            padding: '40px 48px',
            textAlign: 'center',
            maxWidth: 340,
            boxShadow: '0 16px 64px rgba(0,0,0,0.7)',
          }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🍄</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1A1408', marginBottom: 8 }}>
              Leave the game?
            </div>
            <div style={{ fontSize: 15, color: '#3A1E08', fontStyle: 'italic', marginBottom: 32, lineHeight: 1.6 }}>
              Your progress will be lost and you'll return to player setup.
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => setShowLeaveConfirm(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid #C8B88A',
                  color: '#3A1E08',
                  padding: '12px 24px',
                  fontSize: 16,
                  cursor: 'pointer',
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  borderRadius: 8,
                }}
              >
                Keep playing
              </button>
              <button
                onClick={handleLeaveConfirmed}
                style={{
                  background: '#C84820',
                  color: '#F2ECD8',
                  border: 'none',
                  padding: '12px 28px',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  borderRadius: 8,
                  boxShadow: '0 4px 18px rgba(200,72,32,0.35)',
                }}
              >
                Leave game
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
