import { useState } from 'react';
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

  if (screen === 'landing') {
    return <LandingPage onPlay={() => setScreen('setup')}/>;
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

  if (screen === 'order-reveal') {
    return (
      <OrderRevealScreen
        orderCards={orderCards}
        onContinue={() => setScreen('draft')}
      />
    );
  }

  if (screen === 'draft' && gameState) {
    return <DraftPhaseScreen state={gameState} onConfirm={handleDraftConfirm} humanPlayerIds={humanPlayerIds} />;
  }

  if (screen === 'game' && gameState) {
    return (
      <GameScreen
        initialState={gameState}
        devMode={devMode}
        humanPlayerIds={humanPlayerIds}
        onNewGame={() => setScreen('setup')}
      />
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

  return null;
}
