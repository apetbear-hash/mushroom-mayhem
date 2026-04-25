import type { CardDefinition } from '../../shared/types';
import { TYPE_COLORS, RESOURCE_COLORS, HABITAT_COLORS } from '../../shared/constants';

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

const HABITAT_LABELS: Record<string, string> = {
  tree:  'Tree',
  decay: 'Decay',
  shade: 'Shade',
  wet:   'Wet',
  open:  'Open',
};

// Warm illustrated scene gradients — match board habitat palette
const SCENE_GRADIENTS: Record<string, [string, string]> = {
  tree:  ['#2A4018', '#4A6028'],
  decay: ['#5A2808', '#8A4820'],
  shade: ['#2A1848', '#3A2858'],
  wet:   ['#1A4840', '#2A6858'],
  open:  ['#B09838', '#6A8828'],
};

function CardScene({ habitats, typeColor }: { habitats: readonly string[]; typeColor: string }) {
  const h = habitats[0] ?? 'tree';
  const [from, to] = SCENE_GRADIENTS[h] ?? ['#2A1808', '#4A3018'];

  return (
    <div style={{
      height: 62, overflow: 'hidden', position: 'relative',
      background: `linear-gradient(180deg, ${from} 0%, ${to} 100%)`,
    }}>
      {/* Ambient type-color glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 70%, ${typeColor}44 0%, transparent 68%)`,
      }}/>
      {/* Illustrated mushroom */}
      <svg width="160" height="62" viewBox="0 0 160 62" style={{ position: 'absolute', inset: 0, display: 'block' }}>
        {/* Ground shadow */}
        <ellipse cx="80" cy="57" rx="22" ry="3" fill="#1A0A06" opacity={0.35}/>
        {/* Stem */}
        <rect x="76" y="40" width="8" height="17" fill="#D8CEB0" rx="2"/>
        {/* Stem ring */}
        <ellipse cx="80" cy="48" rx="7" ry="1.8" fill="#C8B898" opacity={0.7}/>
        {/* Cap underside */}
        <ellipse cx="80" cy="38" rx="25" ry="6" fill={typeColor} opacity={0.55}/>
        {/* Cap */}
        <ellipse cx="80" cy="36" rx="28" ry="15" fill={typeColor}/>
        {/* Cap highlight */}
        <ellipse cx="71" cy="28" rx="8" ry="3" fill="#fff" opacity={0.3}/>
        {/* Ambient spore particles */}
        <circle cx="24"  cy="15" r="1.5" fill={typeColor} opacity={0.22}/>
        <circle cx="132" cy="11" r="1.2" fill={typeColor} opacity={0.18}/>
        <circle cx="50"  cy="9"  r="1"   fill="#E8A030"  opacity={0.2}/>
        <circle cx="112" cy="20" r="1.2" fill="#E8A030"  opacity={0.16}/>
        <circle cx="148" cy="30" r="0.9" fill={typeColor} opacity={0.15}/>
      </svg>
      {/* Ground strip */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 10,
        background: 'rgba(14,9,7,0.28)',
      }}/>
    </div>
  );
}

export function CardComponent({ card, isSelected = false, isPlayable = true, onClick }: CardProps) {
  const typeColor = TYPE_COLORS[card.type] ?? '#8B6F47';
  const resourceEntries = Object.entries(card.generates).filter(([, v]) => (v ?? 0) > 0);

  return (
    <div
      onClick={isPlayable ? onClick : undefined}
      style={{
        width: 160,
        height: 290,
        borderRadius: 6,
        border: `1.5px solid ${isSelected ? '#D4A04A' : typeColor + 'AA'}`,
        background: '#F2EAD8',
        color: '#1A140F',
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize: 11,
        cursor: isPlayable ? 'pointer' : 'default',
        opacity: isPlayable ? 1 : 0.45,
        boxShadow: isSelected
          ? `0 0 14px ${typeColor}88, 0 4px 12px rgba(14,9,7,0.5)`
          : '0 3px 10px rgba(14,9,7,0.35)',
        userSelect: 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Type stripe */}
      <div style={{
        background: typeColor,
        padding: '4px 8px',
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        color: '#fff',
        fontFamily: 'sans-serif',
        flexShrink: 0,
      }}>
        {card.type}{card.isOngoing && <span style={{ marginLeft: 6, opacity: 0.8 }}>· Ongoing</span>}
      </div>

      {/* Illustrated scene */}
      <CardScene habitats={card.habitats} typeColor={typeColor}/>

      {/* Divider */}
      <div style={{ height: 1, background: `${typeColor}55`, flexShrink: 0 }}/>

      {/* Name + pts */}
      <div style={{ padding: '7px 8px 3px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4, flexShrink: 0 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.2, color: '#1A140F' }}>{card.name}</div>
          <div style={{ color: '#8A7848', fontSize: 10, fontStyle: 'italic', marginTop: 2 }}>{card.scientificName}</div>
        </div>
        {card.pts > 0 && (
          <div style={{
            background: '#D4A04A',
            color: '#1A0A00',
            borderRadius: 3,
            padding: '2px 6px',
            fontWeight: 800,
            fontSize: 14,
            flexShrink: 0,
            minWidth: 22,
            textAlign: 'center',
            fontFamily: 'sans-serif',
            lineHeight: 1.3,
          }}>
            {card.pts}
          </div>
        )}
      </div>

      {/* Cost + Habitats */}
      <div style={{
        padding: '3px 8px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderTop: '1px solid #D8C8A0',
        flexShrink: 0,
      }}>
        <span style={{ color: '#8B6F47', fontWeight: 700, fontFamily: 'sans-serif', fontSize: 10 }}>
          {card.cost}🍄
        </span>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {card.habitats.map(h => (
            <span key={h} style={{
              background: HABITAT_COLORS[h] + '33',
              border: `1px solid ${HABITAT_COLORS[h]}88`,
              color: '#2A1810',
              borderRadius: 3,
              padding: '1px 5px',
              fontSize: 10,
              fontWeight: 600,
              fontFamily: 'sans-serif',
            }}>
              {HABITAT_LABELS[h]}
            </span>
          ))}
        </div>
      </div>

      {/* Resource generation */}
      {resourceEntries.length > 0 && (
        <div style={{
          padding: '3px 8px', display: 'flex', gap: 6,
          borderTop: '1px solid #D8C8A0',
          fontFamily: 'sans-serif',
          flexShrink: 0,
        }}>
          {resourceEntries.map(([resource, amount]) => (
            <span key={resource} style={{ color: RESOURCE_COLORS[resource], fontWeight: 700, fontSize: 10 }}>
              +{amount}{RESOURCE_ICONS[resource]}
            </span>
          ))}
        </div>
      )}

      {/* Power text — fixed remaining space, clipped */}
      <div style={{
        padding: '5px 8px 8px',
        color: card.isOngoing ? '#2A6858' : '#3A2810',
        fontSize: 10,
        lineHeight: 1.5,
        fontStyle: 'italic',
        flex: 1,
        overflow: 'hidden',
        borderTop: '1px solid #D8C8A0',
      }}>
        {card.power}
      </div>
    </div>
  );
}
