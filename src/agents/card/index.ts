import type { CardDefinition, GameState, Habitat, Player } from '../../shared/types';
import { CARDS, getCard } from './cards';

export { CARDS, getCard } from './cards';
export { CardComponent } from './CardComponent';
export * from './powers';

// ── Habitat compatibility ─────────────────────────────────────────────────────

export function canPlantOnHabitat(card: CardDefinition, habitat: Habitat): boolean {
  if (habitat === 'open') return true;
  return card.habitats.includes(habitat);
}

export function canPlantOnTile(
  cardId: number,
  tileId: string,
  state: GameState,
): boolean {
  const card = getCard(cardId);
  const tile = state.tiles[tileId];
  if (!tile) return false;
  if (tile.mushroomCardId !== null) return false; // tile already occupied
  if (tile.isBlight) return false;
  return canPlantOnHabitat(card, tile.habitat);
}

// ── Hand management ───────────────────────────────────────────────────────────

export function drawCards(
  player: Player,
  count: number,
  state: GameState,
): { updatedPlayer: Player; updatedDeck: number[] } {
  const drawn = state.deck.slice(0, count);
  const updatedDeck = state.deck.slice(count);
  return {
    updatedPlayer: { ...player, hand: [...player.hand, ...drawn] },
    updatedDeck,
  };
}

export function discardFromHand(
  player: Player,
  cardIds: number[],
): Player {
  const toDiscard = new Set(cardIds);
  const newHand = player.hand.filter(id => !toDiscard.has(id));
  return { ...player, hand: newHand };
}

export function removeFromHand(player: Player, cardId: number): Player {
  const idx = player.hand.indexOf(cardId);
  if (idx === -1) return player;
  const newHand = [...player.hand.slice(0, idx), ...player.hand.slice(idx + 1)];
  return { ...player, hand: newHand };
}

// ── Initial draft ─────────────────────────────────────────────────────────────
// Returns spores earned and the updated hand after draft discards.

export function resolveDraft(
  player: Player,
  discardedCardIds: number[],
): { updatedPlayer: Player; sporesGained: number } {
  const MIN_HAND = 1;
  const safeDiscard = discardedCardIds.slice(
    0,
    Math.max(0, player.hand.length - MIN_HAND)
  );
  const updatedPlayer = discardFromHand(
    { ...player, resources: { ...player.resources, spore: player.resources.spore + safeDiscard.length } },
    safeDiscard,
  );
  return { updatedPlayer, sporesGained: safeDiscard.length };
}

// ── Scoring helpers ───────────────────────────────────────────────────────────

export function buildInitialDeck(): number[] {
  const ids = CARDS.map(c => c.id);
  // Fisher-Yates shuffle
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}
