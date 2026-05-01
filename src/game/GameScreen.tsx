import { useState, useEffect, useCallback, useRef } from 'react';
import type { GameState, ActionType } from '../shared/types';
import { BoardComponent } from '../agents/board/BoardComponent';
import { TurnAnnouncement } from '../agents/turn';
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
import { HandDisplay } from './HandDisplay';
import { GameOverScreen } from './GameOverScreen';
import { SeasonEffectModal } from './SeasonEffectModal';
import { AISummaryOverlay, generateAISummary } from './AISummaryOverlay';
import type { AISummary } from './AISummaryOverlay';
import { SEASONS, SEASON_TURNS } from '../shared/constants';

const SEASON_UI = {
  spring: { icon: '🌿', color: '#3A6828', bg: 'rgba(58,104,40,0.10)', label: 'Spring' },
  summer: { icon: '☀️',  color: '#A07010', bg: 'rgba(160,112,16,0.10)', label: 'Summer' },
  autumn: { icon: '🍂', color: '#B83818', bg: 'rgba(184,56,24,0.10)', label: 'Autumn' },
  winter: { icon: '❄️',  color: '#2868A0', bg: 'rgba(40,104,160,0.10)', label: 'Winter' },
} as const;

const KIND_COLOR: Record<string, string> = {
  positive: '#3A6828', negative: '#B83818', risk: '#A07010', neutral: '#8A7848',
};

const EFFECT_INFO: Record<string, { label: string; kind: string; desc: string }> = {
  thaw:               { label: 'Thaw',               kind: 'positive', desc: 'Spread −1 💧 (min 1)' },
  spring_rain:        { label: 'Spring Rain',         kind: 'positive', desc: 'Turn start: all players gain +3 💧' },
  germination_gamble: { label: 'Germination Gamble',  kind: 'risk',     desc: 'Your turn start: discard your hand & redraw freely' },
  creeping_mist:      { label: 'Creeping Mist',       kind: 'risk',     desc: 'Shade/Wet spread −1 💧, but no resource gain on those tiles' },
  sluggish_soil:      { label: 'Sluggish Soil',       kind: 'negative', desc: 'All players lose 1 of each resource per turn (min 1)' },
  long_days:          { label: 'Long Days',           kind: 'positive', desc: 'All mushrooms generate +1 🍄 per harvest' },
  abundant_canopy:    { label: 'Abundant Canopy',     kind: 'positive', desc: 'Shade mushrooms earn +1 ⭐ per turn' },
  drought:            { label: 'Drought',             kind: 'negative', desc: 'Turn start: 💧→0. No moisture gain this season' },
  scorching_heat:     { label: 'Scorching Heat',      kind: 'negative', desc: 'Spread +1 💧. Open tiles yield no points' },
  mild_summer:        { label: 'Mild Summer',         kind: 'neutral',  desc: 'No special effect this season' },
  mushroom_festival:  { label: 'Mushroom Festival',   kind: 'positive', desc: 'Season end: +1 ⭐ per planted mushroom' },
  spore_wind:         { label: 'Spore Wind',          kind: 'positive', desc: '+4 🍄 and 1 free tile for all at season start' },
  blight:             { label: 'Blight',              kind: 'negative', desc: 'Season start: 3–5 tiles become blighted forever' },
  long_summer:        { label: 'Long Summer',         kind: 'positive', desc: 'Copies the Summer effect into Autumn' },
  decay_bloom:        { label: 'Decay Bloom',         kind: 'risk',     desc: 'Decay tiles give +2 resources/turn, but score 0' },
  deep_freeze:        { label: 'Deep Freeze',         kind: 'negative', desc: 'No spreading allowed. Spread cards disabled' },
  mycelium_harmony:   { label: 'Mycelium Harmony',    kind: 'positive', desc: 'Score = length of longest same-type mushroom chain' },
  mild_winter:        { label: 'Mild Winter',         kind: 'neutral',  desc: 'No special effect this season' },
  winter_stores:      { label: 'Winter Stores',       kind: 'positive', desc: 'Turn start: +2 🍄💧☀️ for all players' },
  final_harvest:      { label: 'Final Harvest',       kind: 'risk',     desc: 'No resources from mushrooms. Season end: +1 ⭐ per 3 unspent resources' },
};

interface GameScreenProps {
  initialState: GameState;
  onNewGame: () => void;
}

// Human player is always the first draft entry — id 'player_0' regardless of turn order.
const HUMAN_PLAYER_ID = 'player_0';

// Planting this card cannot be undone (immediately blocks other players from spreading).
const NON_UNDOABLE_PLANT_CARDS = new Set([30]); // Pigskin Puffball

type PlantSecondaryType = 'oyster_copy' | 'oyster_copy_2' | 'shaggy_mane_adj';
interface PlantSecondaryInfo {
  type: PlantSecondaryType;
  cardId: number;
  primaryTileId: string;
  accumulatedOpts?: PlantOpts;
}

function needsSecondary(cardId: number): PlantSecondaryType | null {
  if (cardId === 2) return 'oyster_copy';
  if (cardId === 37) return 'shaggy_mane_adj';
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
  return new Set();
}

function secondaryPrompt(type: PlantSecondaryType): string {
  if (type === 'oyster_copy') return 'Choose an adjacent network tile for the first free Oyster copy, or Skip.';
  if (type === 'oyster_copy_2') return 'Choose an adjacent network tile for the second free Oyster copy, or Skip.';
  if (type === 'shaggy_mane_adj') return 'Choose an adjacent friendly mushroom to grant +3 pts, or Skip.';
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
  const [showAlmanac, setShowAlmanac] = useState(false);
  const [forecastOpen, setForecastOpen] = useState(true);

  const seasonModalShownForTurn = useRef<number>(-1);

  const currentPlayer = state.players[state.currentPlayerIndex];
  const isHumanTurn = currentPlayer.id === HUMAN_PLAYER_ID;

  const season = getSeason(state.currentTurn);
  const sm = SEASON_UI[season];
  const effectInfo = EFFECT_INFO[state.forecast[season] as string] ?? { label: state.forecast[season] as string, kind: 'neutral', desc: '' };
  const turnInSeasonNum = state.currentTurn - SEASON_TURNS[season][0] + 1;
  const hasActionThisTurn = state.turnState.actionType !== null || state.turnState.restUsed;

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
      setFeedback(canUndo ? 'Mushroom spawned!' : 'Mushroom spawned! (cannot undo)');
    } catch (e: unknown) {
      setUndoState(null);
      setPlantSecondary(null);
      setFeedback(e instanceof Error ? e.message : 'Error spawning.');
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
          setFeedback(canUndo ? 'Mushroom spawned!' : 'Mushroom spawned! (cannot undo)');
        } catch (e: unknown) { setUndoState(null); setFeedback(e instanceof Error ? e.message : 'Cannot spawn here.'); }
        return;
      }

      const opts: PlantOpts = { ...accumulatedOpts };
      if (type === 'oyster_copy_2') opts.oysterCopyTileId2 = tileId;
      if (type === 'shaggy_mane_adj') opts.adjacentFriendlyTileId = tileId;
      const canUndo = !NON_UNDOABLE_PLANT_CARDS.has(cardId);
      try {
        if (canUndo) setUndoState(state);
        setState(prev => resolvePlantAction(prev, currentPlayer.id, cardId, primaryTileId, opts));
        setPlantSecondary(null);
        setSelectedCardId(null);
        setHighlightedTiles(new Set());
        setFeedback(canUndo ? 'Mushroom spawned!' : 'Mushroom spawned! (cannot undo)');
      } catch (e: unknown) {
        setUndoState(null);
        setFeedback(e instanceof Error ? e.message : 'Cannot spawn here.');
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
        setFeedback(canUndo ? 'Mushroom spawned!' : 'Mushroom spawned! (cannot undo)');
      } catch (e: unknown) {
        setUndoState(null);
        setFeedback(e instanceof Error ? e.message : 'Cannot spawn here.');
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

  const handleCancel = useCallback(() => {
    setSelectedAction(null);
    setSelectedCardId(null);
    setHighlightedTiles(new Set());
    setFeedback('');
    setPlantSecondary(null);
  }, []);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', background: '#EAE0C8',
      overflow: 'hidden', fontFamily: "'Cormorant Garamond', Georgia, serif",
    }}>

      {/* ══ HEADER ══ */}
      <header style={{
        flexShrink: 0, height: 64,
        display: 'flex', alignItems: 'stretch',
        background: '#DDD0B0',
        borderBottom: '2px solid #C8B88A',
        zIndex: 40,
      }}>
        {/* Season block */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 20px', minWidth: 210, flexShrink: 0,
          background: sm.bg, borderRight: '1px solid #C8B88A',
        }}>
          <div style={{
            width: 36, height: 36, display: 'flex', alignItems: 'center',
            justifyContent: 'center', border: `1.5px solid ${sm.color}`,
            fontSize: 18, flexShrink: 0, borderRadius: 3,
          }}>{sm.icon}</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: sm.color, lineHeight: 1 }}>{sm.label}</div>
            <div style={{ fontStyle: 'italic', fontSize: 13, color: '#6A5030', marginTop: 2 }}>{effectInfo.label}</div>
          </div>
        </div>

        {/* Turn number + season pip track */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 16, borderRight: '1px solid #C8B88A', padding: '0 20px',
        }}>
          <div style={{ flexShrink: 0, textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#1A1408', lineHeight: 1, letterSpacing: -1 }}>
              {state.currentTurn}<span style={{ fontSize: 14, color: '#8A7848', fontWeight: 400 }}>/20</span>
            </div>
            <div style={{ fontStyle: 'italic', fontSize: 13, color: '#8A7848' }}>
              Turn {turnInSeasonNum} of 5
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {SEASONS.map((s, si) => {
              const sc = SEASON_UI[s].color;
              const isCur = s === season;
              return (
                <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {Array.from({ length: 5 }).map((_, ti) => {
                      const t = si * 5 + ti + 1;
                      const active = t === state.currentTurn;
                      const past = t < state.currentTurn;
                      return (
                        <div key={ti} style={{
                          width: active ? 10 : 6, height: active ? 10 : 6,
                          borderRadius: '50%',
                          background: (past || active) ? sc : '#C8B88A',
                          boxShadow: active ? `0 0 4px ${sc}` : 'none',
                          opacity: past ? 0.4 : 1, transition: 'all 180ms',
                        }}/>
                      );
                    })}
                  </div>
                  <span style={{ fontSize: 9, letterSpacing: 1, color: isCur ? sc : '#8A7848', textTransform: 'uppercase' }}>
                    {s.slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Player chips + Almanac button */}
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          {state.players.map((pp, i) => {
            const isActive = i === state.currentPlayerIndex;
            return (
              <div key={pp.id} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px',
                borderLeft: '1px solid #C8B88A',
                background: isActive ? `${pp.color}18` : 'transparent',
                position: 'relative',
              }}>
                {isActive && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: pp.color }}/>}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: `radial-gradient(circle at 35% 35%, ${pp.color}cc, ${pp.color}66)`,
                  border: `2px solid ${isActive ? pp.color : pp.color + '66'}`,
                  boxShadow: isActive ? `0 0 8px ${pp.color}55` : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{pp.name[0]}</span>
                </div>
                <div>
                  <div style={{
                    fontSize: 11, letterSpacing: 1, fontWeight: 700, lineHeight: 1,
                    color: isActive ? '#1A1408' : '#6A5030', textTransform: 'uppercase',
                  }}>
                    {pp.name}{isActive && <span style={{ marginLeft: 4, fontSize: 9 }}>▶</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 2 }}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: '#1A1408', lineHeight: 1 }}>{pp.score}</span>
                    <span style={{ fontSize: 10, color: '#8A7848' }}>pts</span>
                  </div>
                </div>
              </div>
            );
          })}
          <button
            onClick={() => setShowAlmanac(true)}
            style={{
              borderLeft: '1px solid #C8B88A', padding: '0 16px',
              background: 'transparent', border: 'none',
              fontSize: 12, letterSpacing: 1, color: '#6A5030',
              cursor: 'pointer', textTransform: 'uppercase',
              fontFamily: 'inherit', fontWeight: 600,
            }}
          >Almanac</button>
        </div>
      </header>

      {/* ══ MIDDLE ROW ══ */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

        {/* LEFT: Action panel */}
        <div style={{
          width: 140, flexShrink: 0,
          background: '#DDD0B0', borderRight: '1px solid #C8B88A',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Active player + resources */}
          <div style={{ padding: '10px 10px 8px', borderBottom: '1px solid #C8B88A', flexShrink: 0 }}>
            <div style={{
              fontSize: 10, letterSpacing: 1, color: currentPlayer.color,
              textTransform: 'uppercase', marginBottom: 7, fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: currentPlayer.color }}/>
              {currentPlayer.name}
            </div>
            {[
              { label: 'Spore',    val: currentPlayer.resources.spore,    color: '#8B6F47', icon: '🍄' },
              { label: 'Moisture', val: currentPlayer.resources.moisture, color: '#3A6EA8', icon: '💧' },
              { label: 'Sunlight', val: currentPlayer.resources.sunlight, color: '#C48820', icon: '☀️' },
            ].map(r => (
              <div key={r.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '4px 6px', marginBottom: 2,
                border: `1px solid ${r.color}40`, background: `${r.color}10`, borderRadius: 3,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 12 }}>{r.icon}</span>
                  <span style={{ fontSize: 10, color: r.color, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>
                    {r.label.slice(0, 3)}
                  </span>
                </div>
                <span style={{ fontSize: 22, fontWeight: 700, color: '#1A1408', lineHeight: 1 }}>{r.val}</span>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          {isHumanTurn && !state.isOver && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '6px 6px', flexShrink: 0 }}>
              {([
                { id: 'draw'   as ActionType, icon: '✦', label: 'Draw',   sub: '1☀/card',  color: '#C48820' },
                { id: 'spread' as ActionType, icon: '⬡', label: 'Spread', sub: 'scales💧', color: '#3A6EA8' },
                { id: 'plant'  as ActionType, icon: '◉', label: 'Plant',  sub: 'card cost', color: '#8B6F47' },
                { id: 'rest'   as ActionType, icon: '◎', label: 'Rest',   sub: '+1 each',  color: '#4A8030' },
              ]).map(a => {
                const isActive = selectedAction === a.id;
                const noAction = selectedAction === null;
                return (
                  <button
                    key={a.id}
                    onClick={() => { if (noAction || isActive) handleActionSelect(a.id); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7, padding: '8px 8px',
                      border: `1px solid ${isActive ? a.color : noAction ? '#C8B88A' : 'transparent'}`,
                      background: isActive ? `${a.color}18` : 'transparent',
                      color: isActive ? a.color : noAction ? '#1A1408' : '#8A7848',
                      cursor: (noAction || isActive) ? 'pointer' : 'default',
                      opacity: (!noAction && !isActive) ? 0.4 : 1,
                      transition: 'all 130ms', textAlign: 'left',
                      borderRadius: 3, fontFamily: 'inherit',
                    }}
                  >
                    <span style={{ fontSize: 15, flexShrink: 0 }}>{a.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1 }}>{a.label}</div>
                      <div style={{ fontSize: 10, opacity: 0.65, lineHeight: 1, marginTop: 2 }}>{a.sub}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ flex: 1 }}/>

          {/* Undo / Cancel / End Turn */}
          {isHumanTurn && !state.isOver && (undoState || selectedAction !== null || hasActionThisTurn) && (
            <div style={{
              padding: '6px 6px', borderTop: '1px solid #C8B88A',
              display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0,
            }}>
              {undoState && (
                <button onClick={handleUndo} style={{
                  padding: '6px 6px', background: 'transparent',
                  border: '1px solid #C8B88A', color: '#6A5030', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 12, width: '100%', borderRadius: 3,
                }}>↩ Undo</button>
              )}
              {selectedAction !== null && (
                <button onClick={handleCancel} style={{
                  padding: '7px 6px', background: 'transparent',
                  border: '1px solid #C8B88A', color: '#6A5030', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 12, width: '100%', borderRadius: 3,
                }}>× Cancel</button>
              )}
              {hasActionThisTurn && (
                <button onClick={handleEndTurn} style={{
                  padding: '10px 6px', background: 'rgba(58,104,40,0.12)',
                  border: '1px solid rgba(58,104,40,0.55)', color: '#3A6828', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 13, fontWeight: 700, width: '100%', borderRadius: 3,
                }}>End Turn →</button>
              )}
            </div>
          )}

          {/* AI thinking */}
          {!isHumanTurn && !state.isOver && !showAnnouncement && !aiSummary && (
            <div style={{ padding: '10px 8px', borderTop: '1px solid #C8B88A', flexShrink: 0, textAlign: 'center' }}>
              <div style={{ fontSize: 11, letterSpacing: 1, color: currentPlayer.color, textTransform: 'uppercase', fontWeight: 700 }}>
                {currentPlayer.name}
              </div>
              <div style={{ fontStyle: 'italic', fontSize: 12, color: '#8A7848', marginTop: 2 }}>thinking…</div>
            </div>
          )}
        </div>

        {/* CENTER: Board */}
        <div style={{
          flex: 1, overflow: 'auto',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <BoardComponent
            state={state}
            highlightedTileIds={highlightedTiles}
            onTileClick={isHumanTurn ? handleTileClick : undefined}
          />

          {/* Action hint */}
          {selectedAction && isHumanTurn && !showAnnouncement && (
            <div style={{
              position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(221,208,176,0.96)', border: '1px solid #C8B88A',
              borderRadius: 20, padding: '8px 20px',
              fontStyle: 'italic', fontSize: 15, color: '#6A5030',
              pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10,
              boxShadow: '0 2px 10px rgba(26,20,8,0.12)',
            }}>
              {selectedAction === 'draw'   && 'Drew a card — click Draw again for more (each costs 1 more ☀️)'}
              {selectedAction === 'spread' && 'Click a glowing tile to spread your network'}
              {selectedAction === 'plant'  && (selectedCardId != null ? '✓ Card selected — click an owned tile' : 'Select a card below, then click an owned tile')}
              {selectedAction === 'rest'   && 'Rested — gained +1 of each resource'}
            </div>
          )}
        </div>

        {/* RIGHT: Forecast panel */}
        <div style={{
          width: forecastOpen ? 200 : 28, flexShrink: 0,
          background: '#DDD0B0', borderLeft: '1px solid #C8B88A',
          transition: 'width 240ms ease',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          <button
            onClick={() => setForecastOpen(o => !o)}
            style={{
              height: 36, flexShrink: 0, background: 'transparent', border: 'none',
              borderBottom: '1px solid #C8B88A', color: '#6A5030', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 10px', width: '100%', fontWeight: 600,
            }}
          >
            {forecastOpen
              ? <><span>Forecast</span><span style={{ opacity: 0.5 }}>▶</span></>
              : <span style={{ margin: 'auto' }}>◀</span>}
          </button>
          {forecastOpen && (
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {SEASONS.map((s, si) => {
                const e = EFFECT_INFO[state.forecast[s] as string] ?? { label: state.forecast[s] as string, kind: 'neutral', desc: '' };
                const smeta = SEASON_UI[s];
                const cur = s === season;
                const past = si < SEASONS.indexOf(season);
                return (
                  <div key={s} style={{
                    padding: '10px 12px', borderBottom: '1px solid #C8B88A',
                    background: cur ? smeta.bg : 'transparent',
                    borderLeft: cur ? `3px solid ${smeta.color}` : '3px solid transparent',
                    opacity: past ? 0.5 : 1,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 14 }}>{smeta.icon}</span>
                      <span style={{ fontSize: 12, letterSpacing: 1, color: smeta.color, textTransform: 'uppercase', fontWeight: 700 }}>
                        {smeta.label}
                        {cur && (
                          <span style={{
                            marginLeft: 5, background: smeta.color, color: '#EAE0C8',
                            padding: '1px 4px', fontSize: 8, borderRadius: 2,
                          }}>NOW</span>
                        )}
                      </span>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1408', lineHeight: 1.2, marginBottom: 3 }}>
                      {e.label}
                    </div>
                    {cur && (
                      <div style={{ fontStyle: 'italic', fontSize: 13, color: '#6A5030', lineHeight: 1.4 }}>{e.desc}</div>
                    )}
                    {!cur && (
                      <div style={{ fontSize: 11, color: KIND_COLOR[e.kind] ?? '#8A7848', textTransform: 'uppercase', letterSpacing: 1 }}>
                        {e.kind}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ══ BOTTOM: Hand tray (always visible) ══ */}
      <div style={{
        flexShrink: 0, background: '#DDD0B0',
        borderTop: `2px solid ${currentPlayer.color}`,
      }}>
        <div style={{ height: 2, background: `linear-gradient(90deg, ${currentPlayer.color}, ${currentPlayer.color}44, transparent 70%)` }}/>

        {/* Tray header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '5px 16px 4px', borderBottom: '1px solid #C8B88A',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: currentPlayer.color }}/>
            <span style={{ fontSize: 12, letterSpacing: 1, color: '#1A1408', textTransform: 'uppercase', fontWeight: 700 }}>
              {currentPlayer.name}'s Hand
            </span>
            <span style={{
              fontSize: 11, color: '#8A7848', padding: '2px 7px',
              border: '1px solid #C8B88A', borderRadius: 2,
            }}>{currentPlayer.hand.length} cards</span>

            {plantSecondary && (
              <>
                <span style={{ fontStyle: 'italic', fontSize: 13, color: '#6A5030' }}>
                  {secondaryPrompt(plantSecondary.type)}
                </span>
                <button onClick={handleSkipSecondary} style={{
                  background: 'transparent', border: '1px solid #C8B88A', color: '#6A5030',
                  padding: '3px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', borderRadius: 3,
                }}>Skip</button>
              </>
            )}
            {inkyCapPendingTileId && !plantSecondary && (
              <>
                <span style={{ fontStyle: 'italic', fontSize: 13, color: '#C89028' }}>
                  Inky Cap: discard for +3 🍄?
                </span>
                <button onClick={handleInkyCapConfirm} style={{
                  background: '#C84820', border: 'none', color: '#F2EAD8',
                  padding: '3px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 700,
                  fontFamily: 'inherit', borderRadius: 3,
                }}>Discard +3🍄</button>
                <button onClick={() => setInkyCapPendingTileId(null)} style={{
                  background: 'transparent', border: '1px solid #C8B88A', color: '#6A5030',
                  padding: '3px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', borderRadius: 3,
                }}>Cancel</button>
              </>
            )}
            {canShiitakeSwap && !inkyCapPendingTileId && !plantSecondary && (
              <>
                <span style={{ fontStyle: 'italic', fontSize: 13, color: '#3A6EA8' }}>Shiitake: 1💧 → 1☀️</span>
                <button onClick={handleShiitakeSwap} style={{
                  background: '#2A6888', border: 'none', color: '#F2EAD8',
                  padding: '3px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 700,
                  fontFamily: 'inherit', borderRadius: 3,
                }}>Swap</button>
              </>
            )}
            {selectedAction === 'plant' && !plantSecondary && !inkyCapPendingTileId && isHumanTurn && (
              <span style={{ fontStyle: 'italic', fontSize: 13, color: selectedCardId != null ? '#8B6F47' : '#8A7848' }}>
                {selectedCardId != null ? '✓ Card selected — click an owned tile' : 'Click a card to select for planting'}
              </span>
            )}
            {feedback && !plantSecondary && !inkyCapPendingTileId && selectedAction !== 'plant' && (
              <span style={{ fontStyle: 'italic', fontSize: 13, color: '#8A7848' }}>{feedback}</span>
            )}
          </div>

          {selectedAction === 'draw' && isHumanTurn && (
            <button
              onClick={handleDrawAgain}
              disabled={currentPlayer.resources.sunlight < state.turnState.cardsDrawnThisTurn + 1}
              style={{
                padding: '5px 14px', background: 'rgba(196,136,32,0.15)',
                border: '1px solid #C48820', color: '#8A5C10', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 12, fontWeight: 700, flexShrink: 0, borderRadius: 3,
              }}
            >+ Draw Card ({state.turnState.cardsDrawnThisTurn + 1}☀)</button>
          )}
        </div>

        {/* Hand cards */}
        <div style={{ padding: '8px 12px', overflowX: 'auto', overflowY: 'visible' }}>
          <HandDisplay
            state={state}
            playerId={currentPlayer.id}
            selectedCardId={selectedCardId}
            plantMode={selectedAction === 'plant' && !plantSecondary && isHumanTurn}
            onSelectCard={handleSelectCard}
          />
        </div>
      </div>

      {/* ══ OVERLAYS ══ */}
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

      {/* ══ ALMANAC OVERLAY ══ */}
      {showAlmanac && (
        <div
          onClick={() => setShowAlmanac(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(26,20,8,0.5)', zIndex: 100,
            backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#EAE0C8', border: '1px solid #C8B88A',
              padding: '28px 32px', maxWidth: 940, width: '100%',
              boxShadow: '0 8px 40px rgba(26,20,8,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: 3, color: '#8A7848', textTransform: 'uppercase' }}>Seasonal</div>
                <div style={{ fontSize: 36, fontWeight: 700, color: '#1A1408' }}>Almanac</div>
              </div>
              <button
                onClick={() => setShowAlmanac(false)}
                style={{
                  background: 'transparent', border: '1px solid #C8B88A',
                  color: '#6A5030', cursor: 'pointer', width: 38, height: 38,
                  fontFamily: 'inherit', fontSize: 20,
                }}
              >×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
              {SEASONS.map((s, si) => {
                const e = EFFECT_INFO[state.forecast[s] as string] ?? { label: state.forecast[s] as string, kind: 'neutral', desc: '' };
                const smeta = SEASON_UI[s];
                const cur = s === season;
                const past = si < SEASONS.indexOf(season);
                return (
                  <div key={s} style={{
                    padding: '18px 16px',
                    border: `1.5px solid ${cur ? smeta.color : '#C8B88A'}`,
                    background: cur ? smeta.bg : '#DDD0B0',
                    opacity: past ? 0.55 : 1, position: 'relative', borderRadius: 4,
                  }}>
                    {cur && (
                      <div style={{
                        position: 'absolute', top: 0, right: 0,
                        background: smeta.color, color: '#EAE0C8',
                        fontSize: 9, letterSpacing: 2, padding: '3px 8px', textTransform: 'uppercase',
                        borderBottomLeftRadius: 4,
                      }}>NOW</div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <span style={{ fontSize: 16 }}>{smeta.icon}</span>
                      <span style={{ fontSize: 11, letterSpacing: 1.5, color: smeta.color, textTransform: 'uppercase', fontWeight: 700 }}>{smeta.label}</span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1A1408', marginBottom: 8, lineHeight: 1.2 }}>{e.label}</div>
                    <div style={{ fontStyle: 'italic', fontSize: 14, color: '#6A5030', lineHeight: 1.5 }}>{e.desc}</div>
                    <div style={{
                      marginTop: 12, fontSize: 10, letterSpacing: 1.5, fontWeight: 600,
                      color: KIND_COLOR[e.kind] ?? '#8A7848',
                      textTransform: 'uppercase', padding: '4px 0', borderTop: '1px solid #C8B88A',
                    }}>{e.kind}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
