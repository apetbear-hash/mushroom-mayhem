import type { Season } from '../../shared/types';
import { SEASON_TURNS } from '../../shared/constants';

export { selectSeasonalEffects, applySeasonStart, applySeasonEnd, isSeasonStart, isSeasonEnd } from './effects';
export { SeasonalEffectPanel } from './SeasonalEffectPanel';

// Returns the season for a given turn number (1–20). Clamps to winter for out-of-range values
// so that post-game state (turn 21) doesn't crash components that call this.
export function getSeason(turn: number): Season {
  const clamped = Math.max(1, Math.min(20, turn));
  for (const [season, [start, end]] of Object.entries(SEASON_TURNS) as [Season, [number, number]][]) {
    if (clamped >= start && clamped <= end) return season;
  }
  return 'winter';
}
