import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameState, ActionType } from '../shared/types';
import { BoardComponent } from '../agents/board/BoardComponent';
import { SeasonalEffectPanel } from '../agents/seasonal';
import { TurnAnnouncement, GameHUD } from '../agents/turn';
import {
  resolveDrawAction,
  resolveSpreadAction,
  resolvePlantAction,
  resolveRestAction,
  resolveInkyCapDiscard,
  resolveShiitakeSwap,
  advanceTurn,
  resolveCollectPhase,
  resolveFinalHarvestBonus,
  canSpreadTo,
} from '../agents/turn';
import type { PlantOpts } from '../agents/turn/actions';
import { canPlantOnTile, getDisruptionModifiers } from '../agents/card';
import { getCard } from '../agents/card/cards';
import { getSeason } from '../agents/seasonal';
import { getAdjacentTileIds } from '../agents/board/boardGenerator';
import { isSeasonStart, isSeasonEnd, applySeasonStart, applySeasonEnd } from '../agents/seasonal';
import { aiTakeTurn } from '../agents/simulation/aiPlayer';
import { ActionBar } from './ActionBar';
import { HandDisplay } from './HandDisplay';
import { GameOverScreen } from './GameOverScreen';
import { SeasonEffectModal } from './SeasonEffectModal';
import { AISummaryOverlay, generateAISummary } from './AISummaryOverlay';
import type { AISummary } from './AISummaryOverlay';

interface GameScreenProps {
  initialState: GameState;
  onNewGame: () => void;
}

// Human player is always the first draft entry — id 'player_0' regardless of turn order.
const HUMAN_PLAYER_ID = 'player_0';

// Planting this card cannot be undone (immediately blocks other players from spreading).
const NON_UNDOABLE_PLANT_CARDS = new Set([30]); // Pigskin Puffball

type PlantSecondaryType = 'oyster_copy' | 'oyster_copy_2' | 'shaggy_mane_adj' | 'indigo_reduce';
interface PlantSecondaryInfo {
  type: PlantSecondaryType;
  cardId: number;
  primaryTileId: string;
  accumulatedOpts?: PlantOpts;
}

function needsSecondary(cardId: number): PlantSecondaryType | null {
  if (cardId === 2) return 'oyster_copy';
  if (cardId === 37) return 'shaggy_mane_adj';
  if (cardId === 38) return 'indigo_reduce';
  return null;
}

function computeSecondaryTiles(
  state: GameState,
  playerId: string,
  primaryTileId: string,
  type: PlantSecondaryType,
): Set<string> {
  const adjIds = getAdjacentTileIds(primaryTileId, state.tiles);
  const player = state.players.find(p => p.id === playerId)!;
  if (type === 'oyster_copy') {
    return new Set(adjIds.filter(id =>
      player.networkTileIds.includes(id) && !state.tiles[id]?.mushroomCardId,
    ));
  }
  if (type === 'shaggy_mane_adj') {
    return new Set(adjIds.filter(id =>
      state.placedMushrooms.some(m => m.tileId === id && m.playerId === playerId),
    ));
  }
  if (type === 'indigo_reduce') {
    return new Set(adjIds.filter(id => player.networkTileIds.includes(id)));
  }
  return new Set();
}

function secondaryPrompt(type: PlantSecondaryType): string {
  if (type === 'oyster_copy') return 'Choose an adjacent network tile for the first free Oyster copy, or Skip.';
  if (type === 'oyster_copy_2') return 'Choose an adjacent network tile for the second free Oyster copy, or Skip.';
  if (type === 'shaggy_mane_adj') return 'Choose an adjacent friendly mushroom to grant +3 pts, or Skip.';
  if (type === 'indigo_reduce') return 'Choose an adjacent owned tile to permanently reduce spread cost, or Skip.';
  return '';
}

function computeSpreadTiles(state: GameState, playerId: string): Set<string> {
  const player = state.players.find(p => p.id === playerId)!;
  const tiles = new Set<string>();
  for (const tileId of player.networkTileIds) {
    for (const adjId of getAdjacentTileIds(tileId, state.tiles)) {
      const tile = state.tiles[adjId];
      if (!tile || tile.ownerId || tile.isBlight) continue;
      const { allowed } = canSpreadTo(adjId, playerId, state);
      if (allowed) tiles.add(adjId);
    }
  }
  return tiles;
}

function computePlantTiles(state: GameState, playerId: string, cardId: number): Set<string> {
  const player = state.players.find(p => p.id === playerId)!;
  const tiles = new Set<string>();
  for (const tileId of player.networkTileIds) {
    if (!canPlantOnTile(cardId, tileId, state)) continue;
    const disruption = getDisruptionModifiers(tileId, playerId, state);
    if (disruption.cannotPlantOnTile) continue;
    tiles.add(tileId);
  }
  return tiles;
}

// Returns true if the player has at least one action they can realistically complete.
function hasAnyValidAction(state: GameState, playerId: string): boolean {
  const player = state.players.find(p => p.id === playerId)!;
  const season = getSeason(state.currentTurn);
  const effect = state.forecast[season];
  const isDeepFreeze = season === 'winter' && effect === 'deep_freeze';
  const isDrought = effect === 'drought';

  const nextDrawCost = state.turnState.cardsDrawnThisTurn + 1;
  const deckOrDiscard = state.deck.length > 0 || state.discard.length > 0;
  if (player.resources.sunlight >= nextDrawCost && deckOrDiscard) return true;

  const pendingFree = state.pendingFreeSpreads.find(ps => ps.playerId === playerId);
  const hasFreeSpread = !!(pendingFree && pendingFree.spreadsRemaining > 0);
  if ((hasFreeSpread || (player.resources.moisture >= 1 && !isDrought)) && !isDeepFreeze) {
    for (const tileId of player.networkTileIds) {
      for (const adjId of getAdjacentTileIds(tileId, state.tiles)) {
        const tile = state.tiles[adjId];
        if (!tile || tile.ownerId || tile.isBlight) continue;
        const { allowed } = canSpreadTo(adjId, playerId, state);
        if (allowed) return true;
      }
    }
  }

  for (const cardId of player.hand) {
    const card = getCard(cardId);
    if (player.resources.spore < card.cost) continue;
    for (const tileId of player.networkTileIds) {
      if (!canPlantOnTile(cardId, tileId, state)) continue;
      const disruption = getDisruptionModifiers(tileId, playerId, state);
      if (!disruption.cannotPlantOnTile) return true;
    }
  }

  return false;
}

export function GameScreen({ initialState, onNewGame }: GameScreenProps) {
  const [state, setState] = useState<GameState>(() => {
    if (isSeasonStart(initialState.currentTurn)) {
      return applySeasonStart(initialState);
    }
    return initialState;
  });

  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [highlightedTiles, setHighlightedTiles] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState('');
  const [undoState, setUndoState] = useState<GameState | null>(null);
  const [plantSecondary, setPlantSecondary] = useState<PlantSecondaryInfo | null>(null);
  const [inkyCapPendingTileId, setInkyCapPendingTileId] = useState<string | null>(null);

  const seasonModalShownForTurn = useRef<number>(-1);

  const currentPlayer = state.players[state.currentPlayerIndex];
  const isHumanTurn = currentPlayer.id === HUMAN_PLAYER_ID;

  // Derived: Shiitake (id 3) swap availability
  const hasShiitakeOnBoard = isHumanTurn && state.placedMushrooms.some(
    m => m.playerId === currentPlayer.id && m.cardId === 3,
  );
  const humanPlayer = state.players.find(p => p.id === currentPlayer.id)!;
  const canShiitakeSwap = hasShiitakeOnBoard && humanPlayer.resources.moisture >= 1;

  // Run AI turn: show summary overlay, then announcement.
  useEffect(() => {
    if (showAnnouncement || aiSummary || isHumanTurn || state.isOver) return;

    const timer = setTimeout(() => {
      const stateBefore = state;
      const aiPlayerId = currentPlayer.id;

      let s = aiTakeTurn(stateBefore);
      const summary = generateAISummary(stateBefore, s, aiPlayerId);
      const endedTurn = s.currentTurn;
      s = advanceTurn(s);
      if (s.currentPlayerIndex === 0 && isSeasonEnd(endedTurn)) {
        s = applySeasonEnd(s, endedTurn);
      }
      if (s.isOver) {
        s = resolveFinalHarvestBonus(s);
      }
      if (isSeasonStart(s.currentTurn) && s.currentPlayerIndex === 0) {
        s = applySeasonStart(s);
      }

      setState(s);
      setAiSummary(summary);
      // Announcement is shown when summary dismisses (handleAiSummaryDismiss).
    }, 400);

    return () => clearTimeout(timer);
  }, [showAnnouncement, aiSummary, isHumanTurn, state, currentPlayer]);

  function handleAiSummaryDismiss() {
    setAiSummary(null);
    setSelectedAction(null);
    setSelectedCardId(null);
    setPlantSecondary(null);
    setInkyCapPendingTileId(null);
    setHighlightedTiles(new Set());
    setFeedback('');
    setUndoState(null);
    setShowAnnouncement(true);
  }

  // Auto-rest when human player has no valid actions and hasn't acted yet.
  useEffect(() => {
    if (!isHumanTurn || showAnnouncement || showSeasonModal || state.isOver) return;
    if (state.turnState.actionType !== null || state.turnState.restUsed) return;
    if (hasAnyValidAction(state, currentPlayer.id)) return;

    try {
      setState(prev => resolveRestAction(prev, currentPlayer.id));
      setSelectedAction('rest');
      setFeedback('No actions available — auto-rested.');
    } catch {
      /* already rested or edge case — End Turn will still be available */
    }
  }, [isHumanTurn, showAnnouncement, showSeasonModal, state, currentPlayer]);

  // After announcement dismisses, check if season modal should appear.
  function handleAnnouncementDismiss() {
    setShowAnnouncement(false);
    if (isHumanTurn) {
      const pendingFree = state.pendingFreeSpreads.find(ps => ps.playerId === currentPlayer.id);
      if (pendingFree && pendingFree.spreadsRemaining > 0) {
        setFeedback(`Hen's Egg Stinkhorn: ${pendingFree.spreadsRemaining} free spread(s) available! Use the Spread action.`);
      }

      // Scarlet Waxy Cap (id 49): triggered at start of Autumn — notify player of result.
      if (getSeason(state.currentTurn) === 'autumn' && state.currentPlayerIndex === 0) {
        const scarletCaps = state.placedMushrooms.filter(
          m => m.playerId === currentPlayer.id && m.cardId === 49,
        );
        if (scarletCaps.length > 0) {
          // Copies placed this turn have turnsOnBoard === 0 AND are not the original mushroom.
          // Simplest: report how many Scarlet Waxy Caps are on the board and let the player see.
          const copyCount = scarletCaps.filter(m => m.turnsOnBoard === 0).length;
          if (copyCount > 0) {
            setFeedback(`Scarlet Waxy Cap: ${copyCount} free cop${copyCount > 1 ? 'ies' : 'y'} placed on adjacent tiles!`);
          } else {
            // Had Scarlet Waxy Cap but no empty adjacent network tiles for copies.
            setFeedback('Scarlet Waxy Cap: no empty adjacent network tiles — copies could not be placed.');
          }
        }
      }
    }
    if (
      isHumanTurn &&
      getSeason(state.currentTurn) === 'spring' &&
      state.forecast.spring === 'germination_gamble' &&
      seasonModalShownForTurn.current !== state.currentTurn
    ) {
      seasonModalShownForTurn.current = state.currentTurn;
      setShowSeasonModal(true);
    }
  }

  function handleUndo() {
    if (!undoState) return;
    setState(undoState);
    setUndoState(null);
    setPlantSecondary(null);
    setInkyCapPendingTileId(null);
    setSelectedAction(null);
    setSelectedCardId(null);
    setHighlightedTiles(new Set());
    setFeedback('Action undone.');
  }

  const handleSelectAction = useCallback((action: ActionType) => {
    if (action === 'draw') {
      try {
        setState(prev => resolveDrawAction(prev, currentPlayer.id, { count: 1 }));
        setUndoState(null);
        setSelectedAction('draw');
        setPlantSecondary(null);
        setHighlightedTiles(new Set());
        setFeedback('Drew 1 card.');
      } catch (e: unknown) {
        setFeedback(e instanceof Error ? e.message : 'Cannot draw.');
      }
      return;
    }

    if (action === 'rest') {
      try {
        setUndoState(state);
        setState(prev => resolveRestAction(prev, currentPlayer.id));
        setSelectedAction('rest');
        setHighlightedTiles(new Set());
        setFeedback('Rested. +1🍄💧☀️');
      } catch (e: unknown) {
        setUndoState(null);
        setFeedback(e instanceof Error ? e.message : 'Cannot rest.');
      }
      return;
    }

    if (action === 'spread') {
      setSelectedAction('spread');
      setSelectedCardId(null);
      setPlantSecondary(null);
      setHighlightedTiles(computeSpreadTiles(state, currentPlayer.id));
      setFeedback('');
      return;
    }

    if (action === 'plant') {
      setSelectedAction('plant');
      setSelectedCardId(null);
      setPlantSecondary(null);
      setHighlightedTiles(new Set());
      setFeedback('');
      return;
    }
  }, [state, currentPlayer]);

  const handleSelectCard = useCallback((cardId: number) => {
    setSelectedCardId(cardId);
    setHighlightedTiles(computePlantTiles(state, currentPlayer.id, cardId));
    setFeedback('');
  }, [state, currentPlayer]);

  const handleSkipSecondary = useCallback(() => {
    if (!plantSecondary) return;
    const { cardId, primaryTileId, accumulatedOpts } = plantSecondary;
    const canUndo = !NON_UNDOABLE_PLANT_CARDS.has(cardId);
    try {
      if (canUndo) setUndoState(state);
      setState(prev => resolvePlantAction(prev, currentPlayer.id, cardId, primaryTileId, accumulatedOpts ?? {}));
      setPlantSecondary(null);
      setSelectedCardId(null);
      setHighlightedTiles(new Set());
      setFeedback(canUndo ? 'Mushroom planted!' : 'Mushroom planted! (cannot undo)');
    } catch (e: unknown) {
      setUndoState(null);
      setPlantSecondary(null);
      setFeedback(e instanceof Error ? e.message : 'Error planting.');
    }
  }, [plantSecondary, state, currentPlayer]);

  const handleInkyCapConfirm = useCallback(() => {
    if (!inkyCapPendingTileId) return;
    try {
      setState(prev => resolveInkyCapDiscard(prev, currentPlayer.id, inkyCapPendingTileId));
      setFeedback('Inky Cap discarded: +3 spores!');
    } catch (e: unknown) {
      setFeedback(e instanceof Error ? e.message : 'Cannot discard.');
    }
    setInkyCapPendingTileId(null);
  }, [inkyCapPendingTileId, currentPlayer]);

  const handleShiitakeSwap = useCallback(() => {
    try {
      setState(prev => resolveShiitakeSwap(prev, currentPlayer.id));
      setFeedback('Shiitake: 1💧 → 1☀️');
    } catch (e: unknown) {
      setFeedback(e instanceof Error ? e.message : 'Cannot swap.');
    }
  }, [currentPlayer]);

  const handleTileClick = useCallback((tileId: string) => {
    if (!isHumanTurn || state.isOver) return;

    // Secondary choice for plant effects (Oyster copy, Shaggy Mane adj, Indigo reduce)
    if (plantSecondary) {
      if (!highlightedTiles.has(tileId)) return;
      const { cardId, primaryTileId, type, accumulatedOpts } = plantSecondary;

      // Oyster first copy: chain into second copy selection
      if (type === 'oyster_copy') {
        const remaining = computeSecondaryTiles(state, currentPlayer.id, primaryTileId, 'oyster_copy');
        remaining.delete(tileId);
        if (remaining.size > 0) {
          setPlantSecondary({ type: 'oyster_copy_2', cardId, primaryTileId, accumulatedOpts: { oysterCopyTileId: tileId } });
          setHighlightedTiles(remaining);
          setFeedback(secondaryPrompt('oyster_copy_2'));
          return;
        }
        // Only one valid tile — plant with just the one copy
        const canUndo = !NON_UNDOABLE_PLANT_CARDS.has(cardId);
        try {
          if (canUndo) setUndoState(state);
          setState(prev => resolvePlantAction(prev, currentPlayer.id, cardId, primaryTileId, { oysterCopyTileId: tileId }));
          setPlantSecondary(null); setSelectedCardId(null); setHighlightedTiles(new Set());
          setFeedback(canUndo ? 'Mushroom planted!' : 'Mushroom planted! (cannot undo)');
        } catch (e: unknown) { setUndoState(null); setFeedback(e instanceof Error ? e.message : 'Cannot plant here.'); }
        return;
      }

      const opts: PlantOpts = { ...accumulatedOpts };
      if (type === 'oyster_copy_2') opts.oysterCopyTileId2 = tileId;
      if (type === 'shaggy_mane_adj') opts.adjacentFriendlyTileId = tileId;
      if (type === 'indigo_reduce') opts.indigoReduceTileId = tileId;
      const canUndo = !NON_UNDOABLE_PLANT_CARDS.has(cardId);
      try {
        if (canUndo) setUndoState(state);
        setState(prev => resolvePlantAction(prev, currentPlayer.id, cardId, primaryTileId, opts));
        setPlantSecondary(null);
        setSelectedCardId(null);
        setHighlightedTiles(new Set());
        setFeedback(canUndo ? 'Mushroom planted!' : 'Mushroom planted! (cannot undo)');
      } catch (e: unknown) {
        setUndoState(null);
        setFeedback(e instanceof Error ? e.message : 'Cannot plant here.');
      }
      return;
    }

    // Inky Cap (id 32): clicking an owned Inky Cap tile with no active mode prompts discard
    if (!selectedAction && !plantSecondary && !inkyCapPendingTileId) {
      const inkyMush = state.placedMushrooms.find(
        m => m.tileId === tileId && m.playerId === currentPlayer.id && m.cardId === 32,
      );
      if (inkyMush) {
        setInkyCapPendingTileId(tileId);
        return;
      }
    }

    if (selectedAction === 'spread' && highlightedTiles.has(tileId)) {
      try {
        setUndoState(state);
        const nextState = resolveSpreadAction(state, currentPlayer.id, tileId);
        setState(nextState);
        setHighlightedTiles(computeSpreadTiles(nextState, currentPlayer.id));
        setFeedback('Spread to new tile!');
      } catch (e: unknown) {
        setUndoState(null);
        setFeedback(e instanceof Error ? e.message : 'Cannot spread here.');
      }
      return;
    }

    if (selectedAction === 'plant' && selectedCardId !== null && highlightedTiles.has(tileId)) {
      // Check if this card needs a secondary choice from the player
      const secondaryType = needsSecondary(selectedCardId);
      if (secondaryType) {
        const secondaryTiles = computeSecondaryTiles(state, currentPlayer.id, tileId, secondaryType);
        if (secondaryTiles.size > 0) {
          setPlantSecondary({ type: secondaryType, cardId: selectedCardId, primaryTileId: tileId });
          setHighlightedTiles(secondaryTiles);
          setFeedback(secondaryPrompt(secondaryType));
          return;
        }
        // No valid secondary targets — plant without the optional bonus
      }
      const canUndo = !NON_UNDOABLE_PLANT_CARDS.has(selectedCardId);
      try {
        if (canUndo) setUndoState(state);
        setState(prev => resolvePlantAction(prev, currentPlayer.id, selectedCardId, tileId));
        setSelectedCardId(null);
        setHighlightedTiles(new Set());
        setFeedback(canUndo ? 'Mushroom planted!' : 'Mushroom planted! (cannot undo)');
      } catch (e: unknown) {
        setUndoState(null);
        setFeedback(e instanceof Error ? e.message : 'Cannot plant here.');
      }
      return;
    }
  }, [isHumanTurn, state, selectedAction, highlightedTiles, selectedCardId, currentPlayer, plantSecondary, inkyCapPendingTileId]);

  const handleDrawAgain = useCallback(() => {
    try {
      setState(prev => resolveDrawAction(prev, currentPlayer.id, { count: 1 }));
      setUndoState(null);
      setFeedback('Drew another card.');
    } catch (e: unknown) {
      setFeedback(e instanceof Error ? e.message : 'Cannot draw.');
    }
  }, [currentPlayer]);

  const handleActionSelect = useCallback((action: ActionType) => {
    if (action === 'draw' && selectedAction === 'draw') {
      handleDrawAgain();
    } else {
      handleSelectAction(action);
    }
  }, [selectedAction, handleDrawAgain, handleSelectAction]);

  const handleEndTurn = useCallback(() => {
    if (!isHumanTurn) return;

    // Auto-pick best adjacent target for Lobster Mushroom (id 16) collect bonus
    const lobsterMushroom = state.placedMushrooms.find(
      m => m.playerId === currentPlayer.id && m.cardId === 16,
    );
    let lobsterTargetTileId: string | undefined;
    if (lobsterMushroom) {
      const adjIds = getAdjacentTileIds(lobsterMushroom.tileId, state.tiles);
      const friendlyAdj = state.placedMushrooms.find(
        m => m.playerId === currentPlayer.id && adjIds.includes(m.tileId),
      );
      if (friendlyAdj) lobsterTargetTileId = friendlyAdj.tileId;
    }

    try {
      setState(prev => {
        let s = resolveCollectPhase(prev, currentPlayer.id, { lobsterTargetTileId });
        const endedTurn = s.currentTurn;
        s = advanceTurn(s);
        if (s.currentPlayerIndex === 0 && isSeasonEnd(endedTurn)) {
          s = applySeasonEnd(s, endedTurn);
        }
        if (s.isOver) {
          s = resolveFinalHarvestBonus(s);
        }
        if (isSeasonStart(s.currentTurn) && s.currentPlayerIndex === 0) {
          s = applySeasonStart(s);
        }
        return s;
      });
      setSelectedAction(null);
      setSelectedCardId(null);
      setPlantSecondary(null);
      setInkyCapPendingTileId(null);
      setHighlightedTiles(new Set());
      setFeedback('');
      setUndoState(null);
      setShowAnnouncement(true);
    } catch (e: unknown) {
      setFeedback(e instanceof Error ? e.message : 'Error ending turn.');
    }
  }, [isHumanTurn, currentPlayer, state]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', background: '#0d0d1a',
      overflow: 'hidden', fontFamily: 'sans-serif',
    }}>
      <GameHUD state={state} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
          <BoardComponent
            state={state}
            highlightedTileIds={highlightedTiles}
            onTileClick={isHumanTurn ? handleTileClick : undefined}
          />
        </div>
        <div style={{
          width: 200, borderLeft: '1px solid #1e1e2e',
          overflowY: 'auto', flexShrink: 0,
        }}>
          <SeasonalEffectPanel state={state} />
        </div>
      </div>

      {isHumanTurn && !state.isOver && (
        <div style={{ borderTop: '1px solid #1e1e2e' }}>
          <ActionBar
            state={state}
            playerId={currentPlayer.id}
            selectedAction={selectedAction}
            message={feedback}
            onSelectAction={handleActionSelect}
            onEndTurn={handleEndTurn}
            undoState={undoState}
            onUndo={handleUndo}
          />
          {plantSecondary && (
            <div style={{
              background: '#0e1e0e', borderTop: '1px solid #2a5a2a',
              padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ color: '#7cdd7c', fontSize: 12, flex: 1 }}>
                {secondaryPrompt(plantSecondary.type)}
              </span>
              <button
                onClick={handleSkipSecondary}
                style={{
                  background: '#222', border: '1px solid #555', color: '#aaa',
                  borderRadius: 6, padding: '5px 14px', fontSize: 12, cursor: 'pointer',
                }}
              >
                Skip
              </button>
            </div>
          )}
          {inkyCapPendingTileId && (
            <div style={{
              background: '#1a140a', borderTop: '1px solid #5a3a0a',
              padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ color: '#d4a855', fontSize: 12, flex: 1 }}>
                Inky Cap: discard this mushroom to gain +3 spores?
              </span>
              <button
                onClick={handleInkyCapConfirm}
                style={{
                  background: '#5a3a0a', border: '1px solid #d4a855', color: '#d4a855',
                  borderRadius: 6, padding: '5px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 700,
                }}
              >
                Discard +3🍄
              </button>
              <button
                onClick={() => setInkyCapPendingTileId(null)}
                style={{
                  background: '#222', border: '1px solid #555', color: '#aaa',
                  borderRadius: 6, padding: '5px 14px', fontSize: 12, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          )}
          {canShiitakeSwap && !inkyCapPendingTileId && !plantSecondary && (
            <div style={{
              background: '#0a121a', borderTop: '1px solid #1a3a5a',
              padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ color: '#5c9ee0', fontSize: 12, flex: 1 }}>
                Shiitake: sacrifice 1💧 to gain 1☀️
              </span>
              <button
                onClick={handleShiitakeSwap}
                style={{
                  background: '#1a3a5a', border: '1px solid #5c9ee0', color: '#5c9ee0',
                  borderRadius: 6, padding: '5px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 700,
                }}
              >
                Swap 1💧→1☀️
              </button>
            </div>
          )}
          <div style={{ background: '#0a0a16', padding: '0 16px 12px' }}>
            <HandDisplay
              state={state}
              playerId={currentPlayer.id}
              selectedCardId={selectedCardId}
              plantMode={selectedAction === 'plant' && !plantSecondary}
              onSelectCard={handleSelectCard}
            />
          </div>
        </div>
      )}

      {!isHumanTurn && !state.isOver && !showAnnouncement && !aiSummary && (
        <div style={{
          borderTop: '1px solid #1e1e2e',
          padding: '16px', textAlign: 'center',
          color: currentPlayer.color, fontSize: 13, fontWeight: 600,
        }}>
          {currentPlayer.name} is thinking…
        </div>
      )}

      {showAnnouncement && !state.isOver && (
        <TurnAnnouncement
          player={currentPlayer}
          currentTurn={state.currentTurn}
          forecast={state.forecast}
          onDismiss={handleAnnouncementDismiss}
        />
      )}

      {aiSummary && !showAnnouncement && (
        <AISummaryOverlay
          summary={aiSummary}
          currentTurn={state.currentTurn}
          onDismiss={handleAiSummaryDismiss}
        />
      )}

      {showSeasonModal && (
        <SeasonEffectModal
          state={state}
          playerId={currentPlayer.id}
          onConfirm={newState => { setState(newState); setShowSeasonModal(false); }}
          onSkip={() => setShowSeasonModal(false)}
        />
      )}

      {state.isOver && (
        <GameOverScreen state={state} onNewGame={onNewGame} />
      )}
    </div>
  );
}
