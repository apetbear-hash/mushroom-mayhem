import type { CardDefinition } from '../../shared/types';
import { TYPE_COLORS, RESOURCE_COLORS, HABITAT_COLORS } from '../../shared/constants';

const BASE = import.meta.env.BASE_URL;

// Card IDs that have photo art in public/cards/
const CARD_ART: Record<number, string> = {
  1:  `${BASE}cards/chanterelle.png`,
  8:  `${BASE}cards/chaga.png`,
  10: `${BASE}cards/saffron-milk-cap.png`,
  11: `${BASE}cards/morel.png`,
  12: `${BASE}cards/king-bolete.png`,
  13: `${BASE}cards/black-truffle.png`,
  14: `${BASE}cards/matsutake.png`,
  15: `${BASE}cards/golden-chanterelle.png`,
  17: `${BASE}cards/hedgehog-mushroom.png`,
  20: `${BASE}cards/coral-mushroom.png`,
  38: `${BASE}cards/indigo-milky-cap.png`,
  41: `${BASE}cards/amanita-caesar.png`,
  43: `${BASE}cards/old-man-of-the-woods.png`,
  45: `${BASE}cards/hen-egg-bolete.png`,
};

interface CardProps {
  card: CardDefinition;
  isSelected?: boolean;
  isPlayable?: boolean;
  onClick?: () => void;
}

const RESOURCE_ICONS: Record<string, string> = {
  spore:    '🍄',
  moisture: '💧',
  sunlight: '☀️',
};

// Dark card body — matches each board tile's deep palette
const HABITAT_CARD_BG: Record<string, string> = {
  tree:  '#0E1A0A',
  decay: '#1A0A04',
  shade: '#120830',
  wet:   '#041418',
  open:  '#1A1408',
};

// Art area gradient (mid tones matching tile art)
const HABITAT_ART_GRADIENT: Record<string, [string, string]> = {
  tree:  ['#1E3810', '#2E5020'],
  decay: ['#3A1608', '#5E2C14'],
  shade: ['#1A0C38', '#2A1650'],
  wet:   ['#0C2830', '#164040'],
  open:  ['#3A2C08', '#5A4818'],
};

// Habitat icon symbols for the left sidebar
const HABITAT_ICON: Record<string, string> = {
  tree: '🌲', decay: '🍂', shade: '🌙', wet: '💧', open: '☀️',
};

// Type icon symbols matching reference style
const TYPE_ICON: Record<string, string> = {
  mycorrhizal:   '⊙',
  saprophytic:   '◎',
  parasitic:     '★',
  symbiotic:     '∞',
  opportunistic: '◈',
};

function MushroomArt({ typeColor, type }: { typeColor: string; type: string }) {
  // Large illustrated mushroom centered in art area
  const cx = 110, cy = 120, stemH = 54, stemW = 14;
  const capRx = type === 'saprophytic' ? 52 : type === 'parasitic' ? 44 : 50;
  const capRy = type === 'saprophytic' ? 20 : 36;

  if (type === 'saprophytic') {
    // Shelf/bracket — stacked fan layers
    return (
      <g>
        {[0, 22, 42].map((dy, i) => {
          const rx = capRx - i * 8, ry = capRy - i * 3;
          const y = cy - dy;
          return (
            <g key={i}>
              <ellipse cx={cx} cy={y + ry * 0.4} rx={rx * 0.9} ry={ry * 0.35} fill={typeColor} opacity={0.4}/>
              <path d={`M ${cx - rx} ${y} A ${rx} ${ry} 0 0 1 ${cx + rx} ${y} Z`} fill={typeColor}/>
              <path d={`M ${cx - rx * 0.5} ${y - ry * 0.5} A ${rx * 0.45} ${ry * 0.4} 0 0 1 ${cx + rx * 0.1} ${y - ry * 0.55}`}
                stroke="#ffffff44" strokeWidth={2} fill="none"/>
            </g>
          );
        })}
        <ellipse cx={cx} cy={cy + 6} rx={20} ry={5} fill="#1A0A06" opacity={0.4}/>
      </g>
    );
  }

  if (type === 'parasitic') {
    // Coral — central mass with spines
    const spines = 16, innerR = 28, outerR = 58;
    return (
      <g>
        {Array.from({ length: spines }, (_, i) => {
          const ang = (i / spines) * Math.PI * 2 - Math.PI / 2;
          return (
            <line key={i}
              x1={cx + Math.cos(ang) * innerR} y1={cy - 10 + Math.sin(ang) * innerR * 0.75}
              x2={cx + Math.cos(ang) * outerR} y2={cy - 10 + Math.sin(ang) * outerR * 0.7}
              stroke={typeColor} strokeWidth={6} strokeLinecap="round"/>
          );
        })}
        <ellipse cx={cx} cy={cy - 10} rx={innerR * 1.1} ry={innerR * 0.9} fill={typeColor}/>
        <ellipse cx={cx - 10} cy={cy - 18} rx={14} ry={6} fill="#ffffff33"/>
        <ellipse cx={cx} cy={cy + 14} rx={24} ry={5} fill="#1A0A06" opacity={0.4}/>
      </g>
    );
  }

  if (type === 'symbiotic') {
    // Oyster cluster — overlapping fan caps
    return (
      <g>
        {[
          { ox: cx - 32, oy: cy - 4,  rx: 40, ry: 20, rot: -20 },
          { ox: cx + 10, oy: cy - 16, rx: 46, ry: 22, rot:  12 },
          { ox: cx - 10, oy: cy - 46, rx: 34, ry: 18, rot:  -6 },
        ].map((f, i) => (
          <g key={i} transform={`rotate(${f.rot} ${f.ox} ${f.oy})`}>
            <ellipse cx={f.ox} cy={f.oy + f.ry * 0.3} rx={f.rx * 0.88} ry={f.ry * 0.4} fill={typeColor} opacity={0.4}/>
            <path d={`M ${f.ox - f.rx} ${f.oy} A ${f.rx} ${f.ry} 0 0 1 ${f.ox + f.rx} ${f.oy} Z`} fill={typeColor}/>
            <path d={`M ${f.ox - f.rx * 0.5} ${f.oy - f.ry * 0.45} A ${f.rx * 0.4} ${f.ry * 0.35} 0 0 1 ${f.ox + f.rx * 0.2} ${f.oy - f.ry * 0.42}`}
              stroke="#ffffff44" strokeWidth={2} fill="none"/>
          </g>
        ))}
        <ellipse cx={cx} cy={cy + 8} rx={30} ry={6} fill="#1A0A06" opacity={0.4}/>
      </g>
    );
  }

  if (type === 'opportunistic') {
    // Honey cluster — 3 caps at different heights
    return (
      <g>
        {[
          { x: cx - 30, y: cy - 14, r: 28, sh: 34 },
          { x: cx + 4,  y: cy - 36, r: 32, sh: 52 },
          { x: cx + 32, y: cy - 10, r: 24, sh: 28 },
        ].map((c, i) => (
          <g key={i}>
            <rect x={c.x - c.r * 0.18} y={c.y} width={c.r * 0.36} height={c.sh} fill="#C8A870" rx={3}/>
            <ellipse cx={c.x} cy={c.y + c.sh * 0.4} rx={c.r * 0.38} ry={c.r * 0.12} fill="#B89060" opacity={0.7}/>
            <ellipse cx={c.x} cy={c.y} rx={c.r * 0.88} ry={c.r * 0.32} fill={typeColor} opacity={0.5}/>
            <ellipse cx={c.x} cy={c.y} rx={c.r} ry={c.r * 0.38} fill={typeColor}/>
            <ellipse cx={c.x - c.r * 0.2} cy={c.y - c.r * 0.15} rx={c.r * 0.28} ry={c.r * 0.12} fill="#ffffff33"/>
          </g>
        ))}
        <ellipse cx={cx} cy={cy + 8} rx={36} ry={6} fill="#1A0A06" opacity={0.35}/>
      </g>
    );
  }

  // mycorrhizal default — classic dome cap
  return (
    <g>
      <ellipse cx={cx} cy={cy + 8} rx={28} ry={6} fill="#1A0A06" opacity={0.4}/>
      <rect x={cx - stemW / 2} y={cy - stemH + 8} width={stemW} height={stemH} fill="#D8C8A0" rx={stemW * 0.35}/>
      <ellipse cx={cx} cy={cy - stemH + 10} rx={stemW * 1.8} ry={stemW * 0.55} fill="#C8B890" opacity={0.7}/>
      <ellipse cx={cx} cy={cy - stemH + 8} rx={capRx * 0.9} ry={capRy * 0.32} fill={typeColor} opacity={0.5}/>
      <ellipse cx={cx} cy={cy - stemH + 8} rx={capRx} ry={capRy} fill={typeColor}/>
      <ellipse cx={cx - capRx * 0.22} cy={cy - stemH + 8 - capRy * 0.32} rx={capRx * 0.32} ry={capRy * 0.28} fill="#ffffff33"/>
    </g>
  );
}

export function CardComponent({ card, isSelected = false, isPlayable = true, onClick }: CardProps) {
  const typeColor  = TYPE_COLORS[card.type] ?? '#8B6F47';
  const primaryH   = card.habitats[0] ?? 'tree';
  const cardBg     = HABITAT_CARD_BG[primaryH]  ?? '#0E0A06';
  const [artFrom, artTo] = HABITAT_ART_GRADIENT[primaryH] ?? ['#1A1008', '#2A1808'];
  const resourceEntries = Object.entries(card.generates).filter(([, v]) => (v ?? 0) > 0);
  const photoArt = CARD_ART[card.id];

  const ART_H = 172;
  const CARD_W = 200;
  const CARD_H = 330;

  return (
    <div
      onClick={isPlayable ? onClick : undefined}
      style={{
        width: CARD_W,
        height: CARD_H,
        borderRadius: 14,
        border: `1.5px solid ${isSelected ? '#D4A04A' : typeColor + '66'}`,
        background: cardBg,
        color: '#F2EAD8',
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        cursor: isPlayable ? 'pointer' : 'default',
        opacity: isPlayable ? 1 : 0.4,
        boxShadow: isSelected
          ? `0 0 20px ${typeColor}88, 0 6px 20px rgba(0,0,0,0.7)`
          : '0 4px 16px rgba(0,0,0,0.6)',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* ── Art area ─────────────────────────────────────────────── */}
      <div style={{
        position: 'relative', height: ART_H, flexShrink: 0, overflow: 'hidden',
        background: `linear-gradient(170deg, ${artFrom} 0%, ${artTo} 100%)`,
      }}>
        {photoArt ? (
          /* Photo art — fills the area, darkened at bottom for overlay legibility */
          <>
            <img
              src={photoArt}
              alt={card.name}
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'contain', objectPosition: 'center',
                display: 'block',
              }}
            />
            {/* Bottom fade so cost/resource badges stay readable */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, transparent 45%, rgba(0,0,0,0.72) 100%)',
            }}/>
          </>
        ) : (
          <>
            {/* Radial glow behind mushroom */}
            <div style={{
              position: 'absolute', inset: 0,
              background: `radial-gradient(ellipse at 60% 80%, ${typeColor}55 0%, transparent 65%)`,
            }}/>

            {/* Mushroom illustration */}
            <svg
              width={CARD_W} height={ART_H}
              viewBox={`0 0 ${CARD_W} ${ART_H}`}
              style={{ position: 'absolute', inset: 0, display: 'block' }}
            >
              {/* Ambient spores */}
              {[[22,18],[170,24],[50,12],[155,44],[30,60],[185,70],[140,14]].map(([x,y],i) => (
                <circle key={i} cx={x} cy={y} r={1.2 + (i%3)*0.6} fill={typeColor} opacity={0.18 + (i%4)*0.06}/>
              ))}
              {/* Ground strip */}
              <path d={`M 0 ${ART_H - 22} Q ${CARD_W/2} ${ART_H - 30} ${CARD_W} ${ART_H - 22} L ${CARD_W} ${ART_H} L 0 ${ART_H} Z`}
                fill="#1A0A06" opacity={0.45}/>
              {/* Mushroom */}
              <MushroomArt typeColor={typeColor} type={card.type}/>
            </svg>
          </>
        )}

        {/* Habitat affinity icons — left side */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          {card.habitats.map(h => (
            <div key={h} title={h} style={{
              width: 26, height: 26, borderRadius: '50%',
              background: HABITAT_COLORS[h] + 'CC',
              border: `1.5px solid ${HABITAT_COLORS[h]}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
            }}>
              {HABITAT_ICON[h]}
            </div>
          ))}
        </div>

        {/* Points badge — top right */}
        {card.pts > 0 && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            width: 40, height: 40, borderRadius: '50%',
            background: typeColor,
            border: `2px solid ${typeColor}`,
            boxShadow: `0 0 12px ${typeColor}88, 0 2px 8px rgba(0,0,0,0.6)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'sans-serif', fontWeight: 900, fontSize: 18,
            color: '#fff',
          }}>
            {card.pts}
          </div>
        )}

        {/* Resource generation — bottom of art */}
        {resourceEntries.length > 0 && (
          <div style={{
            position: 'absolute', bottom: 10, right: 10,
            display: 'flex', gap: 5,
          }}>
            {resourceEntries.map(([res, amt]) => (
              <div key={res} style={{
                background: 'rgba(14,9,7,0.75)', backdropFilter: 'blur(4px)',
                border: `1px solid ${RESOURCE_COLORS[res]}88`,
                borderRadius: 20, padding: '3px 8px',
                fontFamily: 'sans-serif', fontWeight: 700, fontSize: 11,
                color: RESOURCE_COLORS[res],
                display: 'flex', alignItems: 'center', gap: 3,
              }}>
                {RESOURCE_ICONS[res]} +{amt}
              </div>
            ))}
          </div>
        )}

        {/* Cost pip — bottom left of art */}
        <div style={{
          position: 'absolute', bottom: 10, left: 10,
          background: 'rgba(14,9,7,0.75)', backdropFilter: 'blur(4px)',
          border: '1px solid #8B6F4788',
          borderRadius: 20, padding: '3px 8px',
          fontFamily: 'sans-serif', fontWeight: 700, fontSize: 11,
          color: '#C8A870',
          display: 'flex', alignItems: 'center', gap: 3,
        }}>
          🍄 {card.cost}
        </div>
      </div>

      {/* Thin habitat-color accent line */}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${typeColor}, ${HABITAT_COLORS[primaryH]})`, flexShrink: 0 }}/>

      {/* ── Info section ─────────────────────────────────────────── */}
      <div style={{ padding: '10px 12px 10px', display: 'flex', flexDirection: 'column', flex: 1, gap: 0, minHeight: 0 }}>

        {/* Name */}
        <div style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.15, color: '#F2EAD8', letterSpacing: 0.2, marginBottom: 7 }}>
          {card.name}
        </div>

        {/* Type row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          paddingBottom: 7, borderBottom: `1px solid ${typeColor}44`,
          marginBottom: 7,
        }}>
          <span style={{ color: typeColor, fontSize: 13 }}>{TYPE_ICON[card.type] ?? '◈'}</span>
          <span style={{
            color: typeColor, fontFamily: 'sans-serif', fontSize: 10,
            fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase',
          }}>
            {card.type}
          </span>
          {card.isOngoing && (
            <span style={{ color: typeColor, fontFamily: 'sans-serif', fontSize: 10, opacity: 0.7 }}>· Ongoing</span>
          )}
        </div>

        {/* Ability label */}
        <div style={{
          fontFamily: 'sans-serif', fontSize: 10, fontWeight: 700,
          letterSpacing: 2, textTransform: 'uppercase',
          color: '#C8A030', marginBottom: 5,
        }}>
          Ability
        </div>

        {/* Power text */}
        <div style={{
          fontSize: 14, lineHeight: 1.5,
          color: '#FFFFFF',
          textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
          flex: 1, overflow: 'hidden',
        }}>
          {card.power}
        </div>
      </div>
    </div>
  );
}
