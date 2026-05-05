import { useState } from 'react';
import type { GameState, Habitat, Season, Tile } from '../../shared/types';
import { TYPE_COLORS, HABITAT_COLORS } from '../../shared/constants';
import { getCard } from '../card/cards';
import { CardComponent, MushroomArt } from '../card/CardComponent';
import { getSeason } from '../seasonal';
import { hexToPixel, hexPolygonPoints } from './hexMath';

const EMPTY_STROKE = '#7A6040';
const TILE_SIZE = 72;

const BASE = import.meta.env.BASE_URL;

// CSS padding around the board SVG that reveals the seasonal border illustration.
// The SVG itself stays at its original size — only the wrapper div grows.
const SEASON_BORDER = 120;

const SEASON_BG: Record<Season, string | null> = {
  spring: null, // add board-spring.png to public/seasons/ to re-enable
  summer: null,
  autumn: null,
  winter: null,
};

const TILE_IMAGES: Record<Habitat, string> = {
  tree:  `${BASE}tiles/tile-tree.png`,
  decay: `${BASE}tiles/tile-decay.png`,
  shade: `${BASE}tiles/tile-shade.png`,
  wet:   `${BASE}tiles/tile-wet.png`,
  open:  `${BASE}tiles/tile-open.png`,
};

const HABITAT_TINTS: Record<Habitat, string> = {
  tree:  '#2A7A18',
  wet:   '#1A50C0',
  shade: '#6018A8',
  decay: '#7A9018',
  open:  '#C8A010',
};

const HABITAT_LABELS: Record<string, string> = {
  tree: 'Tree', decay: 'Decay', shade: 'Shade', wet: 'Wet', open: 'Open',
};

const HABITAT_DESCRIPTIONS: Record<string, string> = {
  tree:  'Dense woodland — mycorrhizal and opportunistic species thrive here.',
  decay: 'Rotting organic matter — ideal for saprophytic fungi.',
  shade: 'Dark undergrowth — favours symbiotic and parasitic types.',
  wet:   'Moist, boggy ground — most mushroom types can grow here.',
  open:  'Exposed meadow — opportunistic fungi; high sunlight yield.',
};

interface BoardProps {
  state: GameState;
  highlightedTileIds?: Set<string>;
  selectedTileId?: string | null;
  onTileClick?: (tileId: string) => void;
  recentlyPlantedTileId?: string | null;
}

function ownerColor(tile: Tile, state: GameState): string | null {
  if (!tile.ownerId) return null;
  const player = state.players.find(p => p.id === tile.ownerId);
  return player?.color ?? null;
}

function safeId(tileId: string): string {
  return tileId.replace(/[^a-zA-Z0-9_-]/g, '_');
}

// ── Gradient defs ─────────────────────────────────────────────────────────────

function HabitatDefs({ prefix }: { prefix: string }) {
  return (
    <defs>
      {/* Warm illustrated palette — matches splash image art style */}
      <linearGradient id={`${prefix}-tree`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#2A4018" />
        <stop offset="55%"  stopColor="#4A6028" />
        <stop offset="100%" stopColor="#2A3A18" />
      </linearGradient>
      <linearGradient id={`${prefix}-decay`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#5A2808" />
        <stop offset="50%"  stopColor="#8A4820" />
        <stop offset="100%" stopColor="#5A3010" />
      </linearGradient>
      <linearGradient id={`${prefix}-shade`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#2A1848" />
        <stop offset="50%"  stopColor="#3A2858" />
        <stop offset="100%" stopColor="#2A1838" />
      </linearGradient>
      <linearGradient id={`${prefix}-wet`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#1A4840" />
        <stop offset="40%"  stopColor="#2A6858" />
        <stop offset="100%" stopColor="#1A3838" />
      </linearGradient>
      <linearGradient id={`${prefix}-open`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%"   stopColor="#C8A840" />
        <stop offset="45%"  stopColor="#E0C058" />
        <stop offset="100%" stopColor="#6A8828" />
      </linearGradient>
    </defs>
  );
}

// ── Habitat background art ────────────────────────────────────────────────────

function HabitatArt({
  habitat, cx, cy, s, gp,
}: {
  habitat: Habitat; cx: number; cy: number; s: number; gp: string;
}) {
  const hw = s * 0.866;

  if (habitat === 'tree') {
    return (
      <g>
        <rect x={cx-hw} y={cy-s} width={hw*2} height={s*2} fill={`url(#${gp}-tree)`} />
        <ellipse cx={cx} cy={cy+s*0.65} rx={hw*0.9} ry={s*0.2} fill="#1A2C0A" />
        {/* Left pine tree */}
        <rect x={cx-s*0.465} y={cy+s*0.14} width={s*0.075} height={s*0.22} fill="#6A4828" />
        <polygon points={`${cx-s*0.52},${cy+s*0.2} ${cx-s*0.41},${cy+s*0.2} ${cx-s*0.465},${cy-s*0.1}`} fill="#4A6820" />
        <polygon points={`${cx-s*0.5},${cy+s*0.02} ${cx-s*0.43},${cy+s*0.02} ${cx-s*0.465},${cy-s*0.3}`} fill="#6A8828" />
        {/* Central golden autumn tree (like splash) */}
        <rect x={cx-s*0.055} y={cy+s*0.25} width={s*0.11} height={s*0.32} fill="#6A4828" />
        <polygon points={`${cx-s*0.3},${cy+s*0.32} ${cx+s*0.3},${cy+s*0.32} ${cx},${cy+s*0.0}`} fill="#7A9830" />
        <polygon points={`${cx-s*0.24},${cy+s*0.05} ${cx+s*0.24},${cy+s*0.05} ${cx},${cy-s*0.3}`} fill="#C89018" />
        <polygon points={`${cx-s*0.17},${cy-s*0.24} ${cx+s*0.17},${cy-s*0.24} ${cx},${cy-s*0.62}`} fill="#D4A020" />
        <polygon points={`${cx-s*0.06},${cy-s*0.55} ${cx+s*0.06},${cy-s*0.55} ${cx},${cy-s*0.65}`} fill="#F8D870" fillOpacity={0.7} />
        {/* Warm spore specks */}
        <circle cx={cx-s*0.3}  cy={cy-s*0.72} r={1.4} fill="#FFE870" fillOpacity={0.9} />
        <circle cx={cx+s*0.42} cy={cy-s*0.65} r={1.0} fill="#FFE870" fillOpacity={0.75} />
        <circle cx={cx+s*0.1}  cy={cy-s*0.82} r={1.7} fill="#FFE870" fillOpacity={1.0} />
        <circle cx={cx-s*0.15} cy={cy-s*0.87} r={0.9} fill="#FFE870" fillOpacity={0.7} />
      </g>
    );
  }

  if (habitat === 'decay') {
    return (
      <g>
        <rect x={cx-hw} y={cy-s} width={hw*2} height={s*2} fill={`url(#${gp}-decay)`} />
        <ellipse cx={cx+s*0.04} cy={cy+s*0.22} rx={hw*0.72} ry={s*0.2} fill="#3A1208" fillOpacity={0.55} />
        {/* Rotting log — warm earthy amber */}
        <ellipse cx={cx}        cy={cy+s*0.14} rx={hw*0.72} ry={s*0.19} fill="#7A3818" />
        <ellipse cx={cx}        cy={cy+s*0.11} rx={hw*0.72} ry={s*0.16} fill="#A85030" />
        <ellipse cx={cx+hw*0.65} cy={cy+s*0.11} rx={s*0.14} ry={s*0.16} fill="#582010" fillOpacity={0.75} />
        {/* Orange-red mushroom — matches splash image cap color */}
        <rect x={cx-s*0.34} y={cy-s*0.44} width={s*0.085} height={s*0.3} fill="#D8B880" />
        <ellipse cx={cx-s*0.3} cy={cy-s*0.44} rx={s*0.21}  ry={s*0.115} fill="#C84820" />
        <ellipse cx={cx-s*0.3} cy={cy-s*0.46} rx={s*0.17}  ry={s*0.085} fill="#E86038" />
        <circle cx={cx-s*0.3}  cy={cy-s*0.5}   r={s*0.032} fill="#FFF8E8" fillOpacity={0.88} />
        <circle cx={cx-s*0.19} cy={cy-s*0.445} r={s*0.026} fill="#FFF8E8" fillOpacity={0.82} />
        {/* Ground fungi details — warm */}
        <ellipse cx={cx-s*0.08} cy={cy+s*0.42} rx={s*0.075} ry={s*0.04} fill="#9A5828" fillOpacity={0.72} transform={`rotate(-12 ${cx-s*0.08} ${cy+s*0.42})`} />
        <ellipse cx={cx+s*0.22} cy={cy+s*0.46} rx={s*0.06}  ry={s*0.035} fill="#C07038" fillOpacity={0.68} transform={`rotate(20 ${cx+s*0.22} ${cy+s*0.46})`} />
      </g>
    );
  }

  if (habitat === 'shade') {
    return (
      <g>
        <rect x={cx-hw} y={cy-s} width={hw*2} height={s*2} fill={`url(#${gp}-shade)`} />
        {/* Warm purple ambient pools */}
        <circle cx={cx-s*0.14} cy={cy+s*0.18} r={s*0.24} fill="#9060C0" fillOpacity={0.18} />
        <circle cx={cx+s*0.3}  cy={cy-s*0.02} r={s*0.17} fill="#C09AE0" fillOpacity={0.15} />
        {/* Fern/vine stems — warm purple-brown */}
        <path d={`M ${cx-hw} ${cy-s*0.08} Q ${cx-s*0.12} ${cy-s*0.6} ${cx+s*0.22} ${cy-s*0.88}`}
          stroke="#4A2868" strokeWidth={s*0.1} fill="none" strokeLinecap="round" />
        <path d={`M ${cx-s*0.12} ${cy-s*0.28} Q ${cx+s*0.12} ${cy-s*0.04} ${cx+s*0.42} ${cy+s*0.12}`}
          stroke="#3A1858" strokeWidth={s*0.07} fill="none" strokeLinecap="round" />
        {/* Bioluminescent mushroom orb — warmer glow */}
        <circle cx={cx+s*0.14} cy={cy+s*0.38} r={s*0.16} fill="#C870E0" fillOpacity={0.3} />
        <circle cx={cx+s*0.14} cy={cy+s*0.38} r={s*0.09} fill="#E0A0F0" fillOpacity={0.52} />
        <circle cx={cx+s*0.14} cy={cy+s*0.38} r={s*0.04} fill="#F8D8FF" fillOpacity={0.78} />
        {/* Ground spore caps */}
        <ellipse cx={cx-s*0.14} cy={cy+s*0.6} rx={s*0.1}   ry={s*0.046} fill="#3A1858" fillOpacity={0.78} transform={`rotate(-16 ${cx-s*0.14} ${cy+s*0.6})`} />
        <ellipse cx={cx+s*0.3}  cy={cy+s*0.62} rx={s*0.086} ry={s*0.04}  fill="#2A0C48" fillOpacity={0.72} transform={`rotate(14 ${cx+s*0.3} ${cy+s*0.62})`} />
      </g>
    );
  }

  if (habitat === 'wet') {
    return (
      <g>
        <rect x={cx-hw} y={cy-s} width={hw*2} height={s*2} fill={`url(#${gp}-wet)`} />
        {/* Water rings — teal like splash rocks */}
        <ellipse cx={cx} cy={cy+s*0.28} rx={hw*0.66} ry={s*0.115} fill="none" stroke="#40C8B8" strokeWidth={0.95} strokeOpacity={0.5} />
        <ellipse cx={cx} cy={cy+s*0.28} rx={hw*0.43} ry={s*0.075} fill="none" stroke="#40C8B8" strokeWidth={0.72} strokeOpacity={0.38} />
        {/* Lily pad — warm green */}
        <ellipse cx={cx-s*0.2} cy={cy+s*0.1} rx={s*0.23} ry={s*0.13} fill="#2A7838" />
        <polygon points={`${cx-s*0.2},${cy+s*0.1} ${cx-s*0.26},${cy-s*0.02} ${cx-s*0.14},${cy-s*0.02}`} fill={`url(#${gp}-wet)`} />
        {/* Warm cream-yellow lily flower */}
        <circle cx={cx-s*0.2} cy={cy+s*0.04} r={s*0.075} fill="#FFF8D8" fillOpacity={0.95} />
        <circle cx={cx-s*0.2} cy={cy+s*0.04} r={s*0.042} fill="#FFE870" />
        {/* Reed stalks — warm brown */}
        <line x1={cx+s*0.28} y1={cy+s*0.7}  x2={cx+s*0.3}  y2={cy-s*0.88} stroke="#7A5820" strokeWidth={1.9} />
        <ellipse cx={cx+s*0.29} cy={cy-s*0.74} rx={s*0.047} ry={s*0.17} fill="#9A5828" />
        <line x1={cx+s*0.43} y1={cy+s*0.7}  x2={cx+s*0.45} y2={cy-s*0.65} stroke="#7A5820" strokeWidth={1.5} />
        <ellipse cx={cx+s*0.44} cy={cy-s*0.54} rx={s*0.04}  ry={s*0.13} fill="#9A5828" />
        {/* Water surface shimmer */}
        <ellipse cx={cx+s*0.08} cy={cy+s*0.48} rx={s*0.13}  ry={s*0.036} fill="#60D8C8" fillOpacity={0.25} />
      </g>
    );
  }

  if (habitat === 'open') {
    const sunX = cx + s*0.3;
    const sunY = cy - s*0.52;
    const rays = [0, 45, 90, 135, 180, 225, 270, 315];
    return (
      <g>
        <rect x={cx-hw} y={cy-s} width={hw*2} height={s*2} fill={`url(#${gp}-open)`} />
        {/* Warm olive-green meadow layers */}
        <path d={`M ${cx-hw} ${cy+s*0.12} Q ${cx-s*0.22} ${cy-s*0.22} ${cx+s*0.12} ${cy+s*0.08} Q ${cx+s*0.42} ${cy+s*0.32} ${cx+hw} ${cy+s*0.06} L ${cx+hw} ${cy+s} L ${cx-hw} ${cy+s} Z`} fill="#6A9028" fillOpacity={0.9} />
        <path d={`M ${cx-hw} ${cy+s*0.44} Q ${cx-s*0.08} ${cy+s*0.18} ${cx+s*0.26} ${cy+s*0.4} Q ${cx+s*0.54} ${cy+s*0.56} ${cx+hw} ${cy+s*0.36} L ${cx+hw} ${cy+s} L ${cx-hw} ${cy+s} Z`} fill="#4A7018" fillOpacity={0.92} />
        {/* Bright golden sun */}
        <circle cx={sunX} cy={sunY} r={s*0.26} fill="#FFE870" fillOpacity={0.28} />
        <circle cx={sunX} cy={sunY} r={s*0.17} fill="#FFE050" fillOpacity={0.95} />
        <circle cx={sunX} cy={sunY} r={s*0.11} fill="#FFD028" />
        {rays.map((deg, i) => {
          const rad = (deg * Math.PI) / 180;
          return <line key={i} x1={sunX+Math.cos(rad)*s*0.22} y1={sunY+Math.sin(rad)*s*0.22} x2={sunX+Math.cos(rad)*s*0.31} y2={sunY+Math.sin(rad)*s*0.31} stroke="#FFE070" strokeWidth={1.15} strokeOpacity={0.8} />;
        })}
        {/* Wildflowers — warm palette, no cold purple */}
        <circle cx={cx-s*0.33} cy={cy+s*0.17} r={s*0.068} fill="#FF9070" />
        <line x1={cx-s*0.33} y1={cy+s*0.24} x2={cx-s*0.33} y2={cy+s*0.46} stroke="#4A7018" strokeWidth={1.25} />
        <circle cx={cx-s*0.06} cy={cy+s*0.21} r={s*0.057} fill="#FFB830" />
        <line x1={cx-s*0.06} y1={cy+s*0.27} x2={cx-s*0.07} y2={cy+s*0.46} stroke="#4A7018" strokeWidth={1.05} />
        <circle cx={cx+s*0.09} cy={cy+s*0.13} r={s*0.052} fill="#D4A040" />
        <line x1={cx+s*0.09} y1={cy+s*0.19} x2={cx+s*0.08} y2={cy+s*0.43} stroke="#4A7018" strokeWidth={1.05} />
      </g>
    );
  }

  return null;
}

// ── Blight art ────────────────────────────────────────────────────────────────

function BlightArt({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  const hw = s * 0.866;
  return (
    <g>
      {/* Void background */}
      <rect x={cx-hw} y={cy-s} width={hw*2} height={s*2} fill="#0a0412" />
      {/* Cracked earth lines */}
      <path d={`M ${cx} ${cy+s*0.3} L ${cx-s*0.3} ${cy+s*0.6}`}  stroke="#2a0a3a" strokeWidth={s*0.04} fill="none" />
      <path d={`M ${cx} ${cy+s*0.3} L ${cx+s*0.35} ${cy+s*0.55}`} stroke="#2a0a3a" strokeWidth={s*0.04} fill="none" />
      <path d={`M ${cx} ${cy+s*0.3} L ${cx-s*0.1}  ${cy-s*0.05}`} stroke="#2a0a3a" strokeWidth={s*0.03} fill="none" />
      <path d={`M ${cx-s*0.3} ${cy+s*0.6} L ${cx-s*0.5} ${cy+s*0.5}`} stroke="#1a0828" strokeWidth={s*0.025} fill="none" />
      <path d={`M ${cx+s*0.35} ${cy+s*0.55} L ${cx+s*0.55} ${cy+s*0.38}`} stroke="#1a0828" strokeWidth={s*0.025} fill="none" />
      {/* Dead twisted roots/branches */}
      <path d={`M ${cx-s*0.1} ${cy+s*0.7} Q ${cx-s*0.3} ${cy+s*0.2} ${cx-s*0.5} ${cy-s*0.1}`}
        stroke="#1e0830" strokeWidth={s*0.07} fill="none" strokeLinecap="round" />
      <path d={`M ${cx+s*0.1} ${cy+s*0.7} Q ${cx+s*0.35} ${cy+s*0.15} ${cx+s*0.55} ${cy-s*0.2}`}
        stroke="#1a0628" strokeWidth={s*0.06} fill="none" strokeLinecap="round" />
      <path d={`M ${cx-s*0.5} ${cy-s*0.1} Q ${cx-s*0.2} ${cy-s*0.3} ${cx+s*0.05} ${cy-s*0.7}`}
        stroke="#1e0830" strokeWidth={s*0.05} fill="none" strokeLinecap="round" />
      {/* Gnarled branch tips */}
      <path d={`M ${cx-s*0.5} ${cy-s*0.1} Q ${cx-s*0.65} ${cy-s*0.25} ${cx-s*0.58} ${cy-s*0.4}`}
        stroke="#1e0830" strokeWidth={s*0.035} fill="none" strokeLinecap="round" />
      <path d={`M ${cx+s*0.55} ${cy-s*0.2} Q ${cx+s*0.7} ${cy-s*0.35} ${cx+s*0.6} ${cy-s*0.5}`}
        stroke="#1a0628" strokeWidth={s*0.03} fill="none" strokeLinecap="round" />
      {/* Corruption glow pools */}
      <circle cx={cx-s*0.15} cy={cy+s*0.05} r={s*0.22} fill="#5a0080" fillOpacity={0.14} />
      <circle cx={cx+s*0.2}  cy={cy-s*0.25} r={s*0.14} fill="#8000c0" fillOpacity={0.12} />
      <circle cx={cx-s*0.1}  cy={cy+s*0.45} r={s*0.1}  fill="#c000ff" fillOpacity={0.1} />
      {/* Blight spores (glowing dots) */}
      <circle cx={cx-s*0.18} cy={cy+s*0.1}  r={s*0.045} fill="#cc44ff" fillOpacity={0.7} />
      <circle cx={cx+s*0.25} cy={cy-s*0.18} r={s*0.035} fill="#aa22ee" fillOpacity={0.65} />
      <circle cx={cx-s*0.05} cy={cy-s*0.4}  r={s*0.03}  fill="#dd66ff" fillOpacity={0.8} />
      <circle cx={cx+s*0.38} cy={cy+s*0.22} r={s*0.025} fill="#bb33ff" fillOpacity={0.6} />
      <circle cx={cx-s*0.38} cy={cy-s*0.15} r={s*0.022} fill="#cc44ff" fillOpacity={0.55} />
      {/* Dark haze at edges */}
      <ellipse cx={cx} cy={cy} rx={hw*0.9} ry={s*0.85} fill="none" stroke="#3a0050" strokeWidth={s*0.08} strokeOpacity={0.4} />
    </g>
  );
}

// ── Blight tooltip ────────────────────────────────────────────────────────────

function BlightTooltip({ pos }: { pos: { x: number; y: number } }) {
  const TW = 200, TH = 64, margin = 12;
  let tx = pos.x + 18;
  let ty = pos.y - TH / 2;
  if (tx + TW > window.innerWidth  - margin) tx = pos.x - TW - 8;
  if (ty < margin)                           ty = margin;
  if (ty + TH > window.innerHeight - margin) ty = window.innerHeight - TH - margin;

  return (
    <div style={{
      position: 'fixed', left: tx, top: ty, width: TW,
      zIndex: 300, pointerEvents: 'none',
      borderRadius: 6, overflow: 'hidden',
      border: '1.5px solid #cc44ff66',
      background: '#F2EAD8',
      boxShadow: '0 8px 32px rgba(14,9,7,0.55)',
      fontFamily: "'Cormorant Garamond', Georgia, serif",
    }}>
      <div style={{ background: '#9933cc', padding: '5px 10px', fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#fff', fontFamily: 'sans-serif' }}>
        Blighted
      </div>
      <div style={{ padding: '8px 10px', fontSize: 14, color: '#3A2810', lineHeight: 1.4, fontStyle: 'italic' }}>
        Mushrooms cannot grow on blight tiles.
      </div>
    </div>
  );
}

// ── Hover tooltip ─────────────────────────────────────────────────────────────

function TileHoverTooltip({
  tile, owner, mushroomCardId, pos,
}: {
  tile: Tile;
  owner: { name: string; color: string } | null;
  mushroomCardId: number | null;
  pos: { x: number; y: number };
}) {
  const card = mushroomCardId !== null ? getCard(mushroomCardId) : null;

  const margin = 12;
  const TW = card ? 200 : 210;
  const TH = card ? 330 : 160;
  let tx = pos.x + 18;
  let ty = pos.y - TH / 2;
  if (tx + TW > window.innerWidth  - margin) tx = pos.x - TW - 8;
  if (ty < margin)                           ty = margin;
  if (ty + TH > window.innerHeight - margin) ty = window.innerHeight - TH - margin;

  // Mushroom tile — render the actual card
  if (card) {
    return (
      <div style={{ position: 'fixed', left: tx, top: ty, zIndex: 300, pointerEvents: 'none' }}>
        <CardComponent card={card} />
      </div>
    );
  }

  // Empty tile — habitat info
  const typeColor = HABITAT_TINTS[tile.habitat];
  const artS  = 52;
  const artVB = `${-artS*0.866} ${-artS*0.9} ${artS*1.732} ${artS*1.4}`;

  return (
    <div style={{
      position: 'fixed', left: tx, top: ty, width: TW,
      zIndex: 300, pointerEvents: 'none',
      borderRadius: 6, overflow: 'hidden',
      border: `1.5px solid ${typeColor}99`,
      background: '#F2EAD8',
      boxShadow: `0 8px 32px rgba(14,9,7,0.55), 0 0 0 1px ${typeColor}22`,
      fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 13, color: '#1A140F',
    }}>
      {/* Header: habitat label + owner badge */}
      <div style={{ background: typeColor, padding: '5px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: '#fff', fontFamily: 'sans-serif' }}>
          {HABITAT_LABELS[tile.habitat]}
        </span>
        {owner && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: owner.color, display: 'inline-block', border: '1px solid rgba(255,255,255,0.5)', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#fff', opacity: 0.9, fontFamily: 'sans-serif' }}>{owner.name}</span>
          </span>
        )}
      </div>

      {/* Habitat art strip */}
      <div style={{ overflow: 'hidden', height: 80 }}>
        <svg width="100%" height="80" viewBox={artVB} preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
          <HabitatDefs prefix="tt" />
          <HabitatArt habitat={tile.habitat} cx={0} cy={0} s={artS} gp="tt" />
        </svg>
      </div>

      {/* Habitat badge + spawn badge */}
      <div style={{ padding: '5px 10px 4px', display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ background: HABITAT_COLORS[tile.habitat]+'33', border: `1px solid ${HABITAT_COLORS[tile.habitat]}88`, color: '#2A1810', borderRadius: 4, padding: '1px 6px', fontSize: 12, fontWeight: 600 }}>
          {HABITAT_LABELS[tile.habitat]}
        </span>
        {tile.isSpawn && (
          <span style={{ background: '#D4A04A33', border: '1px solid #D4A04A88', color: '#5A3000', borderRadius: 4, padding: '1px 6px', fontSize: 12, fontWeight: 600 }}>
            Spawn
          </span>
        )}
      </div>

      {/* Habitat description */}
      <div style={{ padding: '3px 10px 10px', color: '#3A2810', fontSize: 13, lineHeight: 1.5, fontStyle: 'italic' }}>
        {HABITAT_DESCRIPTIONS[tile.habitat]}
      </div>
    </div>
  );
}

// ── Board component ───────────────────────────────────────────────────────────

export function BoardComponent({
  state,
  highlightedTileIds = new Set(),
  selectedTileId = null,
  onTileClick,
  recentlyPlantedTileId = null,
}: BoardProps) {
  const [hoveredTileId, setHoveredTileId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const season = getSeason(state.currentTurn);
  const seasonBg = SEASON_BG[season];

  const tiles = Object.values(state.tiles);
  const pixels = tiles.map(t => hexToPixel(t.coord, TILE_SIZE));
  // SVG stays at the original tight bounds — unchanged for all player counts
  const minX = Math.min(...pixels.map(p => p.x)) - TILE_SIZE * 1.2;
  const minY = Math.min(...pixels.map(p => p.y)) - TILE_SIZE * 1.2;
  const maxX = Math.max(...pixels.map(p => p.x)) + TILE_SIZE * 1.2;
  const maxY = Math.max(...pixels.map(p => p.y)) + TILE_SIZE * 1.2;
  const width  = maxX - minX;
  const height = maxY - minY;

  const hoveredTile     = hoveredTileId ? (state.tiles[hoveredTileId] ?? null) : null;
  const hoveredMushroom = hoveredTileId
    ? (state.placedMushrooms.find(m => m.tileId === hoveredTileId) ?? null)
    : null;
  const hoveredOwner = hoveredTile?.ownerId
    ? (state.players.find(p => p.id === hoveredTile.ownerId) ?? null)
    : null;

  const pad = seasonBg ? SEASON_BORDER : 0;

  return (
    <div style={{
      position: 'relative',
      display: 'inline-block',
      padding: pad,
    }}>
      {/* Seasonal background — behind the SVG, muted so it doesn't distract */}
      {seasonBg && (
        <img
          src={seasonBg}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            borderRadius: 6,
            filter: 'saturate(0.45) brightness(0.55)',
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
      )}
      <svg
        viewBox={`${minX} ${minY} ${width} ${height}`}
        width={width}
        height={height}
        style={{ display: 'block', position: 'relative', zIndex: 1 }}
      >
        <defs>
          <style>{`
            @keyframes tilePlant {
              0%   { opacity: 0.75; transform: scale(0.7); }
              55%  { opacity: 0.4;  transform: scale(1.15); }
              100% { opacity: 0;    transform: scale(1.0); }
            }
            .tile-plant-anim {
              animation: tilePlant 0.6s ease-out forwards;
              transform-box: fill-box;
              transform-origin: center center;
              pointer-events: none;
            }
          `}</style>
        </defs>
        <HabitatDefs prefix="g" />

        {tiles.map(tile => {
          const center    = hexToPixel(tile.coord, TILE_SIZE);
          const artPoints    = hexPolygonPoints(center, TILE_SIZE - 1);
          const borderPoints = hexPolygonPoints(center, TILE_SIZE - 2);
          const isHighlighted = highlightedTileIds.has(tile.id);
          const isSelected    = selectedTileId === tile.id;
          const color    = ownerColor(tile, state);
          const clipId   = `clip-${safeId(tile.id)}`;
          const mushroom = state.placedMushrooms.find(m => m.tileId === tile.id) ?? null;
          const card     = mushroom ? getCard(mushroom.cardId) : null;

          return (
            <g
              key={tile.id}
              onClick={() => onTileClick?.(tile.id)}
              onMouseEnter={e => { setHoveredTileId(tile.id); setTooltipPos({ x: e.clientX, y: e.clientY }); }}
              onMouseMove={e  => setTooltipPos({ x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setHoveredTileId(null)}
              style={{ cursor: onTileClick ? 'pointer' : 'default' }}
            >
              <defs>
                <clipPath id={clipId}>
                  <polygon points={artPoints} />
                </clipPath>
              </defs>

              {/* Art layer */}
              <g clipPath={`url(#${clipId})`}>
                {tile.isBlight ? (
                  <>
                    <BlightArt cx={center.x} cy={center.y} s={TILE_SIZE} />
                    <image
                      href={`${BASE}tiles/tile-blight.png`}
                      x={center.x - TILE_SIZE * 0.866}
                      y={center.y - TILE_SIZE}
                      width={TILE_SIZE * 1.732}
                      height={TILE_SIZE * 2}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </>
                ) : (
                  <>
                    {/* SVG fallback — shows while image loads or if missing */}
                    <HabitatArt habitat={tile.habitat} cx={center.x} cy={center.y} s={TILE_SIZE} gp="g" />
                    {/* Painted tile image */}
                    <image
                      href={TILE_IMAGES[tile.habitat]}
                      x={center.x - TILE_SIZE * 0.866}
                      y={center.y - TILE_SIZE}
                      width={TILE_SIZE * 1.732}
                      height={TILE_SIZE * 2}
                      preserveAspectRatio="xMidYMid slice"
                    />
                  </>
                )}

                {/* Habitat colour tint */}
                {!tile.isBlight && (
                  <polygon points={artPoints} fill={HABITAT_TINTS[tile.habitat]} fillOpacity={0.22} />
                )}

                {/* Unowned dim overlay */}
                {!tile.ownerId && (
                  <polygon points={artPoints} fill="#1A0A00" fillOpacity={0.2} />
                )}

                {/* Highlight overlay */}
                {isHighlighted && (
                  <polygon points={artPoints} fill="#ffe066" fillOpacity={0.2} />
                )}

                {/* Mushroom art on top of habitat */}
                {card && !tile.isBlight && (
                  <ellipse
                    cx={center.x} cy={center.y - TILE_SIZE * 0.05}
                    rx={TILE_SIZE * 0.38} ry={TILE_SIZE * 0.36}
                    fill={color ?? '#ffffff'}
                    fillOpacity={color ? 0.28 : 0.12}
                  />
                )}
                {card && !tile.isBlight && (
                  <svg
                    x={center.x - 36}
                    y={center.y - 58}
                    width={72}
                    height={67}
                    viewBox="35 25 150 140"
                  >
                    <MushroomArt typeColor={TYPE_COLORS[card.type] ?? '#888'} type={card.type} />
                  </svg>
                )}

                {/* Plant animation flash */}
                {tile.id === recentlyPlantedTileId && (
                  <polygon
                    key={`anim-${tile.id}`}
                    points={artPoints}
                    fill="#ffffff"
                    className="tile-plant-anim"
                  />
                )}
              </g>

              {/* Hex border */}
              <polygon
                points={borderPoints}
                fill="none"
                stroke={
                  isSelected     ? '#fff'
                  : isHighlighted ? '#ffe066'
                  : tile.ownerId && color ? color
                  : EMPTY_STROKE
                }
                strokeWidth={isSelected ? 3 : isHighlighted ? 2.5 : tile.ownerId ? 2 : 1.2}
              />

              {/* Spawn dot */}
              {tile.isSpawn && !tile.ownerId && (
                <circle cx={center.x} cy={center.y} r={6} fill="#fff" fillOpacity={0.3} />
              )}

              {/* Owner dot */}
              {color && (
                <circle
                  cx={center.x + TILE_SIZE * 0.5} cy={center.y - TILE_SIZE * 0.55}
                  r={6} fill={color} stroke="#111" strokeWidth={1.2}
                />
              )}

              {/* Points badge on planted mushroom */}
              {card && card.pts > 0 && (
                <>
                  <circle
                    cx={center.x - TILE_SIZE * 0.42} cy={center.y + TILE_SIZE * 0.6}
                    r={TILE_SIZE * 0.18} fill="#D4A04A" stroke="#1A0A00" strokeWidth={1.5}
                  />
                  <text
                    x={center.x - TILE_SIZE * 0.42} y={center.y + TILE_SIZE * 0.65}
                    textAnchor="middle" fontSize={TILE_SIZE * 0.18}
                    fill="#1A0A00" fontFamily="sans-serif" fontWeight={800}
                    style={{ pointerEvents: 'none' }}
                  >
                    {card.pts}
                  </text>
                </>
              )}


            </g>
          );
        })}
      </svg>

      {hoveredTile && !hoveredTile.isBlight && (
        <TileHoverTooltip
          tile={hoveredTile}
          owner={hoveredOwner ? { name: hoveredOwner.name, color: hoveredOwner.color } : null}
          mushroomCardId={hoveredMushroom?.cardId ?? null}
          pos={tooltipPos}
        />
      )}
      {hoveredTile?.isBlight && (
        <BlightTooltip pos={tooltipPos} />
      )}
    </div>
  );
}
