import type { GameState } from '../../shared/types';
import type { PlayerDraft } from '../turn/PlayerSetup';
import { createInitialGameState } from './gameInit';
import { aiTakeTurn } from './aiPlayer';
import { advanceTurn } from '../turn/actions';
import { resolveFinalHarvestBonus } from '../turn/collectPhase';
import { applySeasonStart, applySeasonEnd, isSeasonStart, isSeasonEnd } from '../seasonal/effects';
import { COLOR_OPTIONS, PORTRAITS } from '../turn/playerSetupData';

// ── Default draft generator ───────────────────────────────────────────────────

export function buildAIDrafts(count: number): PlayerDraft[] {
  return Array.from({ length: count }, (_, i) => ({
    name: `AI ${i + 1}`,
    portrait: PORTRAITS[i % PORTRAITS.length].id,
    color: COLOR_OPTIONS[i % COLOR_OPTIONS.length].hex,
    isHuman: false,
  }));
}

// ── Game result ───────────────────────────────────────────────────────────────

export interface GameResult {
  finalState: GameState;
  winnerIndex: number;      // index in players array; -1 = tie
  winnerStartPosition: number; // turnOrder of the winner
  scores: number[];
  turnsPlayed: number;
  cardPlayCounts: Record<number, number>; // cardId → times planted this game
  errors: string[];         // any caught errors during the run
}

// ── Single game runner ────────────────────────────────────────────────────────

export function runGame(
  playerCount: number,
  drafts?: PlayerDraft[],
): GameResult {
  const playerDrafts = drafts ?? buildAIDrafts(playerCount);
  let state = createInitialGameState(playerDrafts).state;
  const errors: string[] = [];
  const cardPlayCounts: Record<number, number> = {};

  for (let turn = 1; turn <= 20; turn++) {
    // Season start trigger (once per season, at first turn of each season)
    if (isSeasonStart(turn)) {
      try {
        state = applySeasonStart(state);
      } catch (e) {
        errors.push(`Season start T${turn}: ${e}`);
      }
    }

    // All players take their turns
    for (let pi = 0; pi < playerCount; pi++) {
      try {
        const before = state.placedMushrooms.length;
        state = aiTakeTurn(state);
        // Track newly planted cards
        const after = state.placedMushrooms.length;
        if (after > before) {
          for (let m = before; m < after; m++) {
            const id = state.placedMushrooms[m].cardId;
            cardPlayCounts[id] = (cardPlayCounts[id] ?? 0) + 1;
          }
        }
      } catch (e) {
        errors.push(`Turn ${turn} P${pi}: ${e}`);
      }

      // Advance to next player (or next turn)
      try {
        state = advanceTurn(state);
      } catch (e) {
        errors.push(`AdvanceTurn T${turn} P${pi}: ${e}`);
      }
    }

    // Season end trigger
    if (isSeasonEnd(turn)) {
      try {
        state = applySeasonEnd(state, turn);
      } catch (e) {
        errors.push(`Season end T${turn}: ${e}`);
      }
    }
  }

  // Final Harvest end-of-game bonus
  state = resolveFinalHarvestBonus(state);

  // Determine winner
  const scores = state.players.map(p => p.score);
  const maxScore = Math.max(...scores);
  const topPlayers = state.players.filter(p => p.score === maxScore);

  let winnerIndex = -1;
  if (topPlayers.length === 1) {
    winnerIndex = state.players.indexOf(topPlayers[0]);
  } else {
    // Tiebreak 1: largest network
    const maxNetwork = Math.max(...topPlayers.map(p => p.networkTileIds.length));
    const networkTied = topPlayers.filter(p => p.networkTileIds.length === maxNetwork);
    if (networkTied.length === 1) {
      winnerIndex = state.players.indexOf(networkTied[0]);
    } else {
      // Tiebreak 2: most mushrooms on board
      const mushroomCounts = networkTied.map(p =>
        state.placedMushrooms.filter(m => m.playerId === p.id).length,
      );
      const maxMushrooms = Math.max(...mushroomCounts);
      const mushroomWinner = networkTied.find(
        (_p, i) => mushroomCounts[i] === maxMushrooms,
      );
      if (mushroomWinner) winnerIndex = state.players.indexOf(mushroomWinner);
    }
  }

  return {
    finalState: state,
    winnerIndex,
    winnerStartPosition: winnerIndex >= 0 ? state.players[winnerIndex].turnOrder : -1,
    scores,
    turnsPlayed: 20,
    cardPlayCounts,
    errors,
  };
}
