import { useEffect, useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Season } from '../shared/types';

interface Props { season: Season; onAnnouncementActiveChange?: (active: boolean) => void; }

type Cfg = {
  label: string; emoji: string;
  accent: string;
  colors: readonly string[];
  count: number; animName: string;
  minSz: number; maxSz: number; minDur: number; maxDur: number;
};

const CFG: Record<Season, Cfg> = {
  spring: {
    label: 'Spring', emoji: '🌸',
    accent: '#FF8AAA',
    colors: ['#FFB7C5', '#FF9EBB', '#FFC8D8', '#FFAEC9', '#FFE4F0', '#ffffff'],
    count: 22, animName: 'sPetal', minSz: 5, maxSz: 9, minDur: 7, maxDur: 12,
  },
  summer: {
    label: 'Summer', emoji: '☀️',
    accent: '#F5C020',
    colors: ['#FFFDE7', '#FFF176', '#FFE082', '#FFD54F', '#FFF9C4'],
    count: 18, animName: 'sMote', minSz: 3, maxSz: 6, minDur: 9, maxDur: 15,
  },
  autumn: {
    label: 'Autumn', emoji: '🍂',
    accent: '#E06820',
    colors: ['#FF6B2B', '#D4420A', '#E87A30', '#C8A010', '#8B3A0A', '#E8B820'],
    count: 28, animName: 'sLeaf', minSz: 7, maxSz: 13, minDur: 5, maxDur: 9,
  },
  winter: {
    label: 'Winter', emoji: '❄️',
    accent: '#88BBDD',
    colors: ['#E3F2FD', '#BBDEFB', '#E1F5FE', '#ffffff', '#B3E5FC'],
    count: 32, animName: 'sSnow', minSz: 3, maxSz: 7, minDur: 8, maxDur: 15,
  },
};

const KEYFRAMES_CSS = `
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
@keyframes sSeasonIn {
  0%   { opacity: 0; transform: scale(0.68); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes sSeasonOut {
  0%   { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.1); }
}
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
    zIndex: 6,
    ['--sw' as string]: `${p.sw}px`,
    ['--rt' as string]: `${p.rt}deg`,
    ['--ms' as string]: `${p.ms}px`,
  };
  if (season === 'spring') return { ...base, borderRadius: '50% 0 50% 0' };
  if (season === 'autumn') return { ...base, borderRadius: '50% 20% 50% 20%' };
  if (season === 'summer') return { ...base, borderRadius: '50%', boxShadow: `0 0 ${p.size + 2}px ${color}` };
  return { ...base, borderRadius: '50%' };
}

const IN_MS   = 1600;
const HOLD_MS = 2200;
const OUT_MS  = 900;

export function SeasonalEffects({ season, onAnnouncementActiveChange }: Props) {
  const cfg = CFG[season];
  const prevRef = useRef<Season | null>(null);
  const [phase, setPhase] = useState<'in' | 'hold' | 'out' | null>('in');
  const particles = useMemo(() => gen(cfg), [season]);
  const onChangeRef = useRef(onAnnouncementActiveChange);
  useEffect(() => { onChangeRef.current = onAnnouncementActiveChange; }, [onAnnouncementActiveChange]);

  // Inject keyframes once into <head> — more reliable than a <style> in the render tree
  useEffect(() => {
    const el = document.createElement('style');
    el.setAttribute('data-seasonal-effects', '');
    el.textContent = KEYFRAMES_CSS;
    document.head.appendChild(el);
    return () => { document.head.removeChild(el); };
  }, []);

  // Show announcement on season change; first mount always shows
  useEffect(() => {
    if (prevRef.current !== null && prevRef.current !== season) {
      setPhase('in');
    }
    prevRef.current = season;
  }, [season]);

  // Phase state machine: in → hold → out → null
  useEffect(() => {
    if (phase === 'in') {
      onChangeRef.current?.(true);
      const t = setTimeout(() => setPhase('hold'), IN_MS);
      return () => clearTimeout(t);
    }
    if (phase === 'hold') {
      const t = setTimeout(() => setPhase('out'), HOLD_MS);
      return () => clearTimeout(t);
    }
    if (phase === 'out') {
      const t = setTimeout(() => {
        setPhase(null);
        onChangeRef.current?.(false);
      }, OUT_MS);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const accent = cfg.accent;
  const showing = phase !== null;

  // Everything goes into document.body via portal — bypasses any overflow/transform ancestor
  return createPortal(
    <>
      {/* Ambient particles */}
      {particles.map(p => (
        <div key={`${season}-${p.id}`} style={pStyle(season, p, cfg.colors[p.ci])} />
      ))}

      {/* Season announcement */}
      {showing && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 500, pointerEvents: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.32) 0%, transparent 68%)',
          animation: phase === 'in'
            ? `sSeasonIn ${IN_MS}ms cubic-bezier(0.22,1,0.36,1) forwards`
            : phase === 'out'
            ? `sSeasonOut ${OUT_MS}ms ease-in forwards`
            : undefined,
          opacity: phase === 'hold' ? 1 : undefined,
        }}>
          <div style={{ textAlign: 'center', transform: 'translateY(-80px)' }}>
            <div style={{
              fontSize: 110, fontWeight: 400,
              fontFamily: "'Times New Roman', Times, serif",
              color: accent,
              textTransform: 'uppercase',
              letterSpacing: 10,
              WebkitTextStroke: '1.5px black',
              textShadow: `0 2px 24px rgba(0,0,0,0.95), 0 0 48px ${accent}66`,
            }}>
              {cfg.label}
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
}
