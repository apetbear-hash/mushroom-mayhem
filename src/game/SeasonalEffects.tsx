import { useEffect, useState, useMemo, useRef } from 'react';
import type { Season } from '../shared/types';

interface Props { season: Season; }

type Cfg = {
  label: string; emoji: string; tagline: string;
  accent: string;
  colors: readonly string[];
  count: number; animName: string;
  minSz: number; maxSz: number; minDur: number; maxDur: number;
};

const CFG: Record<Season, Cfg> = {
  spring: {
    label: 'Spring', emoji: '🌸',
    tagline: 'New growth stirs beneath the soil.',
    accent: '#FF8AAA',
    colors: ['#FFB7C5', '#FF9EBB', '#FFC8D8', '#FFAEC9', '#FFE4F0', '#ffffff'],
    count: 22, animName: 'sPetal', minSz: 5, maxSz: 9, minDur: 7, maxDur: 12,
  },
  summer: {
    label: 'Summer', emoji: '☀️',
    tagline: 'The canopy blazes with light and life.',
    accent: '#F5C020',
    colors: ['#FFFDE7', '#FFF176', '#FFE082', '#FFD54F', '#FFF9C4'],
    count: 18, animName: 'sMote', minSz: 3, maxSz: 6, minDur: 9, maxDur: 15,
  },
  autumn: {
    label: 'Autumn', emoji: '🍂',
    tagline: 'The forest exhales in amber and gold.',
    accent: '#E06820',
    colors: ['#FF6B2B', '#D4420A', '#E87A30', '#C8A010', '#8B3A0A', '#E8B820'],
    count: 28, animName: 'sLeaf', minSz: 7, maxSz: 13, minDur: 5, maxDur: 9,
  },
  winter: {
    label: 'Winter', emoji: '❄️',
    tagline: 'Frost claims the silent woodland floor.',
    accent: '#88BBDD',
    colors: ['#E3F2FD', '#BBDEFB', '#E1F5FE', '#ffffff', '#B3E5FC'],
    count: 32, animName: 'sSnow', minSz: 3, maxSz: 7, minDur: 8, maxDur: 15,
  },
};

const KEYFRAMES = `
@keyframes sPetal {
  0%   { transform: translateY(-10px) translateX(0) rotate(0deg); opacity: 0; }
  5%   { opacity: 0.9; }
  95%  { opacity: 0.8; }
  100% { transform: translateY(110vh) translateX(var(--sw)) rotate(var(--rt)); opacity: 0; }
}
@keyframes sMote {
  0%   { transform: translateY(110vh) translateX(0); opacity: 0; }
  8%   { opacity: 0.75; }
  92%  { opacity: 0.30; }
  100% { transform: translateY(-10px) translateX(var(--sw)); opacity: 0; }
}
@keyframes sLeaf {
  0%   { transform: translateY(-10px) translateX(0) rotate(0deg); opacity: 0; }
  5%   { opacity: 1; }
  45%  { transform: translateY(46vh) translateX(var(--ms)) rotate(200deg); opacity: 1; }
  95%  { opacity: 0.9; }
  100% { transform: translateY(110vh) translateX(var(--sw)) rotate(var(--rt)); opacity: 0; }
}
@keyframes sSnow {
  0%   { transform: translateY(-10px) translateX(0); opacity: 0; }
  8%   { opacity: 0.9; }
  50%  { transform: translateY(52vh) translateX(calc(var(--sw) * 0.4)); opacity: 0.9; }
  92%  { opacity: 0.9; }
  100% { transform: translateY(110vh) translateX(var(--sw)); opacity: 0; }
}
@keyframes sCardIn {
  0%   { opacity: 0; transform: translateY(24px) scale(0.92); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes sCardOut {
  0%   { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-16px) scale(0.96); }
}
@keyframes sBgIn  { from { opacity: 0; } to { opacity: 1; } }
@keyframes sBgOut { from { opacity: 1; } to { opacity: 0; } }
`;

type P = {
  id: number; left: number; delay: number; dur: number;
  size: number; sw: number; rt: number; ms: number; ci: number;
};

function gen(cfg: Cfg): P[] {
  return Array.from({ length: cfg.count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 10,
    dur: cfg.minDur + Math.random() * (cfg.maxDur - cfg.minDur),
    size: cfg.minSz + Math.random() * (cfg.maxSz - cfg.minSz),
    sw: (Math.random() - 0.5) * 150,
    rt: Math.random() * 720 - 360,
    ms: (Math.random() - 0.5) * 80,
    ci: Math.floor(Math.random() * cfg.colors.length),
  }));
}

function pStyle(season: Season, p: P, color: string): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'fixed',
    left: `${p.left}%`,
    top: 0,
    width: p.size,
    height: p.size * (season === 'spring' || season === 'autumn' ? 0.62 : 1),
    background: color,
    opacity: 0,
    animation: `${CFG[season].animName} ${p.dur}s ${p.delay}s infinite linear`,
    pointerEvents: 'none',
    zIndex: 4,
    ['--sw' as string]: `${p.sw}px`,
    ['--rt' as string]: `${p.rt}deg`,
    ['--ms' as string]: `${p.ms}px`,
  };
  if (season === 'spring') return { ...base, borderRadius: '50% 0 50% 0' };
  if (season === 'autumn') return { ...base, borderRadius: '50% 20% 50% 20%' };
  if (season === 'summer') return { ...base, borderRadius: '50%', boxShadow: `0 0 ${p.size + 2}px ${color}` };
  return { ...base, borderRadius: '50%' };
}

// Two-phase announcement: fade in (450ms) → hold → fade out (500ms)
const IN_MS  = 450;
const HOLD_MS = 2200;
const OUT_MS = 500;

export function SeasonalEffects({ season }: Props) {
  const cfg = CFG[season];
  const prevRef = useRef<Season | null>(null);
  // phase: 'in' | 'hold' | 'out' | null
  const [phase, setPhase] = useState<'in' | 'hold' | 'out' | null>('in');
  const particles = useMemo(() => gen(cfg), [season]);

  // Trigger announcement on season change (first mount shows spring)
  useEffect(() => {
    if (prevRef.current !== null && prevRef.current !== season) {
      setPhase('in');
    }
    prevRef.current = season;
  }, [season]);

  // Drive the in → hold → out → null state machine
  useEffect(() => {
    if (phase === 'in') {
      const t = setTimeout(() => setPhase('hold'), IN_MS);
      return () => clearTimeout(t);
    }
    if (phase === 'hold') {
      const t = setTimeout(() => setPhase('out'), HOLD_MS);
      return () => clearTimeout(t);
    }
    if (phase === 'out') {
      const t = setTimeout(() => setPhase(null), OUT_MS);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const accent = cfg.accent;
  const showing = phase !== null;

  return (
    <>
      <style>{KEYFRAMES}</style>

      {/* Ambient particles */}
      {particles.map(p => (
        <div key={`${season}-${p.id}`} style={pStyle(season, p, cfg.colors[p.ci])} />
      ))}

      {/* Season announcement */}
      {showing && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500, pointerEvents: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(10,6,2,0.28)',
          animation: phase === 'in'
            ? `sBgIn ${IN_MS}ms ease-out forwards`
            : phase === 'out'
            ? `sBgOut ${OUT_MS}ms ease-in forwards`
            : undefined,
          opacity: phase === 'hold' ? 1 : undefined,
        }}>
          <div style={{
            background: 'rgba(16,10,4,0.90)',
            border: `1.5px solid ${accent}AA`,
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            borderRadius: 16,
            padding: '32px 60px',
            textAlign: 'center',
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            boxShadow: `0 16px 64px rgba(0,0,0,0.65), 0 0 56px ${accent}28`,
            minWidth: 280,
            animation: phase === 'in'
              ? `sCardIn ${IN_MS}ms cubic-bezier(0.22,1,0.36,1) forwards`
              : phase === 'out'
              ? `sCardOut ${OUT_MS}ms ease-in forwards`
              : undefined,
          }}>
            <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 10 }}>{cfg.emoji}</div>
            <div style={{
              fontSize: 34, fontWeight: 700, color: accent,
              letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8,
            }}>
              {cfg.label}
            </div>
            <div style={{
              width: 36, height: 1.5, background: accent,
              margin: '0 auto 10px', opacity: 0.45,
            }} />
            <div style={{ fontSize: 15, color: '#C8B88A', fontStyle: 'italic', lineHeight: 1.6 }}>
              {cfg.tagline}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
