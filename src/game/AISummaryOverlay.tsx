import { useEffect } from 'react';
import type { GameState } from '../shared/types';
import { getCard } from '../agents/card/cards';
import { portraitEmoji } from '../agents/turn/playerSetupData';
import { getSeason } from '../agents/seasonal';

export interface AISummary {
  playerName: string;
  playerColor: string;
  playerPortrait: string;
  lines: string[];
}

export function generateAISummary(
  before: GameState,
  after: GameState,
  playerId: string,
): AISummary {
  const pBefore = before.players.find(p => p.id === playerId)!;
  const pAfter  = after.players.find(p => p.id === playerId)!;
  const lines: string[] = [];

  const newMushrooms = after.placedMushrooms.filter(m =>
    m.playerId === playerId &&
    !before.placedMushrooms.some(mb => mb.tileId === m.tileId),
  );
  for (const m of newMushrooms) {
    lines.push(`🍄 Spawned ${getCard(m.cardId).name}`);
  }

  const networkGain = pAfter.networkTileIds.length - pBefore.networkTileIds.length;
  if (networkGain > 0) {
    lines.push(`🌐 Spread to ${networkGain} new tile${networkGain > 1 ? 's' : ''}`);
  }

  const handDelta = (pAfter.hand.length - pBefore.hand.length) + newMushrooms.length;
  if (handDelta > 0) {
    lines.push(`🃏 Drew ${handDelta} card${handDelta > 1 ? 's' : ''}`);
  }

  const scoreGain = pAfter.score - pBefore.score;
  if (scoreGain > 0) {
    lines.push(`⭐ +${scoreGain} point${scoreGain > 1 ? 's' : ''}`);
  }

  if (lines.length === 0) lines.push('💤 Rested');

  return {
    playerName:    pBefore.name,
    playerColor:   pBefore.color,
    playerPortrait: pBefore.portrait,
    lines,
  };
}

interface AISummaryOverlayProps {
  summary: AISummary;
  currentTurn: number;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export function AISummaryOverlay({
  summary, currentTurn, onDismiss, autoDismissMs = 2400,
}: AISummaryOverlayProps) {
  const season = getSeason(currentTurn);
  const SEASON_ICON: Record<string, string> = {
    spring: '🌿', summer: '☀️', autumn: '🍂', winter: '❄️',
  };

  useEffect(() => {
    const t = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(t);
  }, [onDismiss, autoDismissMs]);

  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(14,9,4,0.55)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        zIndex: 140, fontFamily: 'sans-serif',
        paddingBottom: 80,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#231C10',
          border: `1.5px solid ${summary.playerColor}44`,
          borderRadius: 14, padding: '16px 20px',
          minWidth: 260, maxWidth: 340,
          boxShadow: `0 4px 32px ${summary.playerColor}22`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: summary.playerColor + '1A',
            border: `1.5px solid ${summary.playerColor}55`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>
            {portraitEmoji(summary.playerPortrait)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: summary.playerColor, fontWeight: 700, fontSize: 13 }}>
              {summary.playerName}
            </div>
            <div style={{ color: '#6A5830', fontSize: 10 }}>
              {SEASON_ICON[season]} Turn {currentTurn} · tap to dismiss
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {summary.lines.map((line, i) => (
            <div key={i} style={{
              background: '#1A1408', borderRadius: 6,
              padding: '5px 10px', fontSize: 12, color: '#C8B890',
            }}>
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
