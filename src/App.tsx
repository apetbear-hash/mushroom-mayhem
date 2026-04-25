import { useState } from 'react';
import type { GameState } from './shared/types';
import { PlayerSetup } from './agents/turn/PlayerSetup';
import type { PlayerDraft } from './agents/turn/PlayerSetup';
import { GameScreen } from './game/GameScreen';
import { DraftPhaseScreen } from './game/DraftPhaseScreen';
import { BalancePanel } from './agents/balance';
import { createInitialGameState } from './agents/simulation/gameInit';

type Screen = 'setup' | 'draft' | 'game' | 'balance';

export function App() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [gameState, setGameState] = useState<GameState | null>(null);

  function handleSetupConfirm(players: PlayerDraft[]) {
    setGameState(createInitialGameState(players));
    setScreen('draft');
  }

  function handleDraftConfirm(draftedState: GameState) {
    setGameState(draftedState);
    setScreen('game');
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

  if (screen === 'draft' && gameState) {
    return <DraftPhaseScreen state={gameState} onConfirm={handleDraftConfirm} />;
  }

  if (screen === 'game' && gameState) {
    return (
      <GameScreen
        initialState={gameState}
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
