import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

const BASE = import.meta.env.BASE_URL;

// ─── Easing ───────────────────────────────────────────────────────────────────
const Easing = {
  linear:         (t: number) => t,
  easeInQuad:     (t: number) => t * t,
  easeOutQuad:    (t: number) => t * (2 - t),
  easeInCubic:    (t: number) => t * t * t,
  easeOutCubic:   (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeOutExpo:    (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeOutBack:    (t: number) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  easeInOutSine:  (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeInOutCubicFull: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
};

// ─── Palette ──────────────────────────────────────────────────────────────────
const P = {
  ink: '#0B0705', inkGreen: '#0A0E08', panel: '#11190C', panel2: '#16210F',
  paper: '#F2EAD8', cream: '#E8DCC8', amber: '#E89A3A', amberDeep: '#A55818',
  gold: '#D4A843', moss: '#7A9D6B', mossDeep: '#5C7338', forest: '#1A2014',
  brown: '#5A3A28', spore: '#D4B88C', moisture: '#6AA0D4', sunlight: '#E6BE5D',
};

// ─── Assets ───────────────────────────────────────────────────────────────────
const HAB_ART: Record<string, string> = {
  tree:   `${BASE}tiles/tile-tree.png`,
  decay:  `${BASE}tiles/tile-decay.png`,
  shade:  `${BASE}tiles/tile-shade.png`,
  wet:    `${BASE}tiles/tile-wet.png`,
  open:   `${BASE}tiles/tile-open.png`,
  blight: `${BASE}tiles/tile-blight.png`,
};
const HAB_COLOR: Record<string, string> = {
  tree: '#6B8A54', decay: '#B06A44', shade: '#8A6BB0',
  wet: '#3A9D98', open: '#E0B050', blight: '#6A5A65',
};

// ─── Math helpers ─────────────────────────────────────────────────────────────
const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function spring(t: number, damping = 7, freq = 2.4): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 1 - Math.exp(-damping * t) * Math.cos(freq * Math.PI * t);
}


function valueAt(events: Array<{ t: number; delta: number }>, base: number, local: number) {
  let v = base, last = -999;
  for (const e of events) if (local >= e.t) { v += e.delta; last = Math.max(last, e.t); }
  const pop = last > -999 ? Math.exp(-7 * (local - last)) : 0;
  return { value: v, pop };
}

function hexPos(q: number, r: number, size: number) {
  return { x: size * Math.sqrt(3) * (q + r / 2), y: size * 1.5 * r };
}

// ─── Scene timings ────────────────────────────────────────────────────────────
const DURATION = 120;
const SC = {
  intro:    { start: 0,   end: 8   },
  overview: { start: 8,   end: 16  },
  habitats: { start: 16,  end: 34  },
  card:     { start: 34,  end: 54  },
  gameplay: { start: 54,  end: 92  },
  seasons:  { start: 92,  end: 106 },
  outro:    { start: 106, end: 120 },
};
const BOUNDARIES = [
  SC.overview.start, SC.habitats.start, SC.card.start,
  SC.gameplay.start, SC.seasons.start, SC.outro.start,
];

// ─── Timeline context ─────────────────────────────────────────────────────────
type TCtx = {
  time: number; duration: number; playing: boolean;
  setTime: (t: number | ((p: number) => number)) => void;
  setPlaying: (v: boolean | ((p: boolean) => boolean)) => void;
};
const TL = createContext<TCtx>({ time: 0, duration: DURATION, playing: false, setTime: () => {}, setPlaying: () => {} });
const useTime = () => useContext(TL).time;

function useScene(key: keyof typeof SC) {
  const t = useTime();
  const { start, end } = SC[key];
  return { t, local: t - start, p: clamp((t - start) / (end - start)), dur: end - start };
}

// ─── Sprite ───────────────────────────────────────────────────────────────────
function Sprite({ start, end, children }: { start: number; end: number; children: ReactNode }) {
  const t = useTime();
  return t >= start && t <= end ? <>{children}</> : null;
}

// ─── AmbientSpores ────────────────────────────────────────────────────────────
function AmbientSpores({ count = 30, tint = '#E8C07A', opacity = 0.5 }: { count?: number; tint?: string; opacity?: number }) {
  const t = useTime();
  const motes = useMemo(() => Array.from({ length: count }).map((_, i) => ({
    x: (i * 137.5) % 1920, baseY: (i * 223.3) % 1080, r: 1 + (i % 4) * 0.9,
    sway: 30 + (i % 5) * 22, speed: 12 + (i % 6) * 7, phase: (i * 1.7) % (Math.PI * 2),
    o: (0.25 + (i % 4) * 0.2) * opacity,
  })), [count, opacity]);
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {motes.map((m, i) => {
        let y = (m.baseY - t * m.speed) % 1140; if (y < -30) y += 1140;
        const x = m.x + Math.sin(t * 0.5 + m.phase) * m.sway;
        return <div key={i} style={{
          position: 'absolute', left: x, top: y, width: m.r * 2, height: m.r * 2,
          borderRadius: '50%', background: tint, opacity: m.o,
          boxShadow: `0 0 ${m.r * 3}px ${tint}`,
        }}/>;
      })}
    </div>
  );
}

// ─── Vignette + Grain ─────────────────────────────────────────────────────────
function Vignette({ strength = 0.5 }: { strength?: number }) {
  return <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
    background: `radial-gradient(ellipse at 50% 46%, rgba(0,0,0,0) 52%, rgba(0,0,0,${strength}) 100%)` }}/>;
}
function Grain({ opacity = 0.045 }: { opacity?: number }) {
  return <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity, mixBlendMode: 'overlay' as const,
    backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.6'/></svg>\")",
    backgroundSize: '260px 260px' }}/>;
}

// ─── SporeBurst ───────────────────────────────────────────────────────────────
function SporeBurst({ at, dur = 0.9 }: { at: number; dur?: number }) {
  const t = useTime();
  const local = t - (at - dur / 2);
  if (local < 0 || local > dur) return null;
  const p = clamp(local / dur);
  const flash = Math.sin(p * Math.PI);
  const ringR = lerp(40, 1300, Easing.easeOutCubic(p));
  const motes = 26;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 50 }}>
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
        width: 700, height: 700, borderRadius: '50%',
        background: `radial-gradient(circle, rgba(232,154,58,${0.45 * flash}) 0%, rgba(232,154,58,0) 60%)` }}/>
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
        width: ringR, height: ringR, borderRadius: '50%',
        border: `2px solid rgba(232,192,122,${0.5 * (1 - p)})` }}/>
      {Array.from({ length: motes }).map((_, i) => {
        const ang = (i / motes) * Math.PI * 2;
        const dist = lerp(20, 820, Easing.easeOutQuad(p));
        const x = 960 + Math.cos(ang) * dist, y = 540 + Math.sin(ang) * dist * 0.62;
        const r = 2 + (i % 3) * 2;
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: r * 2, height: r * 2,
          borderRadius: '50%', background: '#F0C878', opacity: 0.8 * (1 - p), boxShadow: '0 0 8px #E8A342' }}/>;
      })}
    </div>
  );
}

// ─── KineticHeading ───────────────────────────────────────────────────────────
type Word = { t: string; accent?: boolean; italic?: boolean };
function KineticHeading({ words, p, startFrac = 0, stagger = 0.07, span = 0.5, size = 96,
  lineHeight = 1.04, align = 'center', color = P.paper, accent = P.amber,
  shadow = '0 4px 24px rgba(0,0,0,0.55)' }:
  { words: Word[]; p: number; startFrac?: number; stagger?: number; span?: number;
    size?: number; lineHeight?: number; align?: string; color?: string; accent?: string; shadow?: string }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0 0.28em',
      justifyContent: align === 'center' ? 'center' : 'flex-start',
      fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: size,
      lineHeight, letterSpacing: '-0.01em', textAlign: align as 'center' | 'left' }}>
      {words.map((w, i) => {
        const wt = clamp((p - (startFrac + i * stagger)) / span);
        const e = spring(wt);
        return <span key={i} style={{ display: 'inline-block',
          transform: `translateY(${(1 - e) * 42}px)`, opacity: clamp(wt * 1.5),
          color: w.accent ? accent : color, fontStyle: w.italic ? 'italic' : 'normal',
          textShadow: shadow, willChange: 'transform, opacity' }}>{w.t}</span>;
      })}
    </div>
  );
}

// ─── Eyebrow ─────────────────────────────────────────────────────────────────
function Eyebrow({ label, p, color = P.amber, align = 'center' }:
  { label: string; p: number; color?: string; align?: string }) {
  const e = Easing.easeOutCubic(clamp(p / 0.4));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: e,
      justifyContent: align === 'center' ? 'center' : 'flex-start' }}>
      <div style={{ width: 26 * e, height: 2, background: color, borderRadius: 1 }}/>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, letterSpacing: 4,
        textTransform: 'uppercase', color, fontWeight: 600 }}>{label}</div>
      <div style={{ width: 26 * e, height: 2, background: color, borderRadius: 1 }}/>
    </div>
  );
}

// ─── KenBurns ─────────────────────────────────────────────────────────────────
function KenBurns({ src, p, from = 1.06, to = 1.16, panX = 0, panY = -2, overlay }:
  { src: string; p: number; from?: number; to?: number; panX?: number; panY?: number; overlay?: string }) {
  const s = lerp(from, to, Easing.easeInOutSine(p));
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${src})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        transform: `scale(${s}) translate(${panX * p}%, ${panY * p}%)`, willChange: 'transform' }}/>
      {overlay && <div style={{ position: 'absolute', inset: 0, background: overlay }}/>}
    </div>
  );
}

// ─── HexTile ─────────────────────────────────────────────────────────────────
function HexTile({ habitat, size = 150, glow = false }:
  { habitat: string; size?: number; glow?: boolean }) {
  const c = HAB_COLOR[habitat] || '#888';
  const clip = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <div style={{ position: 'absolute', inset: -3, clipPath: clip,
        background: glow ? `radial-gradient(circle, ${c} 0%, ${c}00 70%)` : c, opacity: glow ? 0.9 : 0.5 }}/>
      <div style={{ position: 'absolute', inset: 0, clipPath: clip, overflow: 'hidden',
        boxShadow: `inset 0 0 0 2px ${c}` }}>
        <img src={HAB_ART[habitat]} alt={habitat} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
      </div>
    </div>
  );
}

// ─── Gameplay sub-components ──────────────────────────────────────────────────
function ResChip({ glyph, color, value, pop, label }:
  { glyph: string; color: string; value: number; pop: number; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12,
      background: `linear-gradient(160deg, ${P.panel2}, ${P.panel})`, border: `1.5px solid ${color}66`,
      borderRadius: 14, padding: '12px 18px', minWidth: 130,
      transform: `scale(${1 + pop * 0.16})`,
      boxShadow: `0 10px 22px -12px rgba(0,0,0,0.7), 0 0 ${pop * 22}px ${color}88` }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
        background: `radial-gradient(circle at 35% 30%, ${color}, ${color}99)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
        border: '2px solid rgba(255,255,255,0.35)', boxShadow: '0 3px 8px rgba(0,0,0,0.4)' }}>{glyph}</div>
      <div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 32,
          lineHeight: 1, color: P.paper }}>{value}</div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: 2,
          textTransform: 'uppercase', color: `${color}dd`, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

function HandCard({ name, cost, habitat, w = 108, style = {} }:
  { name: string; cost: number; habitat: string; w?: number; style?: React.CSSProperties }) {
  return (
    <div style={{ width: w, aspectRatio: '3 / 4.2', borderRadius: 10, position: 'relative',
      background: `linear-gradient(160deg, ${P.panel2}, #0C1207)`, border: `1.5px solid ${P.mossDeep}`,
      padding: 7, color: P.paper, boxShadow: '0 12px 24px -10px rgba(0,0,0,0.7)', ...style }}>
      <div style={{ position: 'absolute', top: -9, left: -9, width: 30, height: 30, borderRadius: '50%',
        background: `radial-gradient(circle at 35% 30%, ${P.spore}, ${P.amberDeep})`, color: P.ink,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15,
        border: `2px solid ${P.paper}` }}>{cost}</div>
      <div style={{ borderRadius: 6, overflow: 'hidden', aspectRatio: '1/1', marginTop: 6,
        position: 'relative', border: `1px solid ${P.mossDeep}66` }}>
        <img src={HAB_ART[habitat]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.55 }}/>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 34 }}>🍄</div>
      </div>
      <div style={{ textAlign: 'center', fontFamily: "'Cormorant Garamond', serif",
        fontWeight: 700, fontSize: 12, marginTop: 5, lineHeight: 1 }}>{name}</div>
    </div>
  );
}

// ─── Scenes ───────────────────────────────────────────────────────────────────

function IntroScene() {
  const { p, local } = useScene('intro');
  const exit = 1 - clamp((local - 7) / 1);
  return (
    <Sprite start={SC.intro.start} end={SC.intro.end}>
      <div style={{ position: 'absolute', inset: 0, background: P.ink, opacity: exit }}>
        <KenBurns src={`${BASE}splash.png`} p={p} from={1.08} to={1.2} panY={-3}
          overlay="linear-gradient(180deg, rgba(11,7,5,0.35) 0%, rgba(11,7,5,0.72) 62%, rgba(11,7,5,0.92) 100%)" />
        <AmbientSpores count={30} opacity={0.6} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 22 }}>
          <div style={{ opacity: clamp((p - 0.08) / 0.2), transform: `translateY(${(1 - clamp((p - 0.08) / 0.2)) * 12}px)` }}>
            <Eyebrow label="How to Play" p={clamp((p - 0.05) / 0.3)} />
          </div>
          <KineticHeading p={p} startFrac={0.12} stagger={0.11} size={132}
            words={[{ t: 'Mushroom' }, { t: 'Mayhem', accent: true, italic: true }]} />
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 27,
            color: 'rgba(242,234,216,0.85)', textShadow: '0 2px 12px rgba(0,0,0,0.7)',
            opacity: clamp((p - 0.5) / 0.3), transform: `translateY(${(1 - clamp((p - 0.5) / 0.3)) * 14}px)` }}>
            A strategy game of spores, soil &amp; symbiosis
          </div>
        </div>
      </div>
    </Sprite>
  );
}

function OverviewScene() {
  const { p } = useScene('overview');
  const items = [
    { icon: '👥', k: 'Players',  v: '2–4' },
    { icon: '⏱️', k: 'Length',   v: '60–90 min' },
    { icon: '🏆', k: 'Goal',     v: 'Most symbiosis' },
  ];
  return (
    <Sprite start={SC.overview.start} end={SC.overview.end}>
      <div style={{ position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 30%, ${P.forest} 0%, ${P.inkGreen} 70%)` }}>
        <AmbientSpores count={22} opacity={0.35} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: 90, gap: 46 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 22 }}><Eyebrow label="The Idea" p={clamp(p / 0.3)} /></div>
            <KineticHeading p={p} startFrac={0.1} stagger={0.05} size={62} lineHeight={1.12}
              words={[{ t: 'Grow' }, { t: 'your' }, { t: 'network.' }, { t: 'Plant', accent: true }, { t: 'mushrooms.', accent: true }, { t: 'Score.' }]} />
          </div>
          <div style={{ display: 'flex', gap: 26 }}>
            {items.map((it, i) => {
              const w = clamp((p - (0.42 + i * 0.12)) / 0.3);
              const e = spring(w);
              return (
                <div key={i} style={{ width: 250, padding: '30px 26px', borderRadius: 14,
                  background: `linear-gradient(160deg, ${P.panel2}, ${P.panel})`, border: `1.5px solid ${P.mossDeep}66`,
                  textAlign: 'center', transform: `translateY(${(1 - e) * 34}px) scale(${lerp(0.9, 1, e)})`,
                  opacity: clamp(w * 1.4), boxShadow: '0 24px 44px -20px rgba(0,0,0,0.7)' }}>
                  <div style={{ fontSize: 62, marginBottom: 14, lineHeight: 1 }}>{it.icon}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 3,
                    textTransform: 'uppercase', color: P.moss, marginBottom: 6 }}>{it.k}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 30, color: P.paper }}>{it.v}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Sprite>
  );
}

function HabitatsScene() {
  const { p } = useScene('habitats');
  const habs = [
    { h: 'tree',   name: 'Tree',   desc: 'Living wood' },
    { h: 'decay',  name: 'Decay',  desc: 'Rotting logs' },
    { h: 'shade',  name: 'Shade',  desc: 'Under canopy' },
    { h: 'wet',    name: 'Wet',    desc: 'Streams & bog' },
    { h: 'open',   name: 'Open',   desc: 'Any mushroom' },
    { h: 'blight', name: 'Blight', desc: 'Corrupted' },
  ];
  return (
    <Sprite start={SC.habitats.start} end={SC.habitats.end}>
      <div style={{ position: 'absolute', inset: 0,
        background: `linear-gradient(160deg, ${P.panel} 0%, ${P.ink} 100%)` }}>
        <AmbientSpores count={20} opacity={0.3} />
        <div style={{ position: 'absolute', inset: 0, padding: '70px 90px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: 6 }}><Eyebrow label="The Board" p={clamp(p / 0.2)} align="left" /></div>
          <KineticHeading p={p} startFrac={0.05} stagger={0.06} size={56} align="left" lineHeight={1}
            words={[{ t: 'Six' }, { t: 'Habitats', accent: true }]} />
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 22,
            color: 'rgba(242,234,216,0.8)', marginTop: 12, opacity: clamp((p - 0.15) / 0.2) }}>
            Every mushroom can only be planted on its matching habitat.
          </div>
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: '1fr 1fr',
            gap: 20, marginTop: 34, placeItems: 'center' }}>
            {habs.map((hab, i) => {
              const w = clamp((p - (0.24 + i * 0.075)) / 0.28);
              const e = spring(w);
              const c = HAB_COLOR[hab.h];
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 18,
                  transform: `translateY(${(1 - e) * 40}px) scale(${lerp(0.85, 1, e)})`,
                  opacity: clamp(w * 1.4) }}>
                  <div style={{ filter: 'drop-shadow(0 8px 18px rgba(0,0,0,0.5))' }}>
                    <HexTile habitat={hab.h} size={128} />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 30, color: c }}>{hab.name}</div>
                    <div style={{ fontSize: 14, fontStyle: 'italic', color: 'rgba(242,234,216,0.7)' }}>{hab.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Sprite>
  );
}

function CardAnatomyScene() {
  const { p } = useScene('card');
  const cx = 960, cy = 560, cardW = 340;
  const calls = [
    { key: 'cost', label: 'Spore Cost',  desc: 'Pay to plant',       side: 'L', ax: -150, ay: -220, lx: 470,  ly: 300, delay: 0.16 },
    { key: 'pts',  label: 'Points',      desc: 'Symbiosis score',     side: 'R', ax:  150, ay: -220, lx: 1450, ly: 300, delay: 0.26 },
    { key: 'hab',  label: 'Habitat',     desc: 'Where it can grow',   side: 'L', ax: -120, ay:   60, lx: 470,  ly: 560, delay: 0.36 },
    { key: 'gen',  label: 'Generates',   desc: 'Resource / turn',     side: 'R', ax:  120, ay:   60, lx: 1450, ly: 560, delay: 0.46 },
    { key: 'type', label: 'Type',        desc: 'Mushroom family',     side: 'L', ax:  -70, ay:  150, lx: 470,  ly: 800, delay: 0.56 },
    { key: 'abil', label: 'Ability',     desc: 'Special power',       side: 'R', ax:   70, ay:  210, lx: 1450, ly: 800, delay: 0.66 },
  ] as const;
  const cardIn = spring(clamp((p - 0.04) / 0.16));
  return (
    <Sprite start={SC.card.start} end={SC.card.end}>
      <div style={{ position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 40%, ${P.cream} 0%, #D8C9AE 100%)` }}>
        <AmbientSpores count={16} tint="#B79A6A" opacity={0.25} />
        <div style={{ position: 'absolute', top: 60, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ marginBottom: 12 }}><Eyebrow label="Reading Cards" p={clamp(p / 0.2)} color={P.brown} /></div>
          <KineticHeading p={p} startFrac={0.04} stagger={0.06} size={54} color={P.brown} accent={P.amberDeep}
            shadow="none" words={[{ t: 'Card' }, { t: 'Anatomy', accent: true }]} />
        </div>

        <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {calls.map((c) => {
            const w = clamp((p - c.delay) / 0.14);
            const draw = Easing.easeOutCubic(w);
            const ax = cx + c.ax, ay = cy + c.ay;
            const elbowX = c.side === 'L' ? c.lx + 150 : c.lx - 150;
            const x1 = ax, y1 = ay;
            const x2 = lerp(ax, elbowX, draw), y2 = lerp(ay, c.ly, draw);
            const x3 = lerp(elbowX, c.lx + (c.side === 'L' ? 118 : -118), clamp((draw - 0.6) / 0.4)), y3 = c.ly;
            return (
              <g key={c.key} opacity={clamp(w * 1.6)}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={P.brown} strokeWidth="2.5" strokeDasharray="3,5" strokeLinecap="round" />
                {draw > 0.6 && <line x1={x2} y1={y2} x2={x3} y2={y3} stroke={P.brown} strokeWidth="2.5" strokeDasharray="3,5" strokeLinecap="round" />}
                <circle cx={ax} cy={ay} r={5} fill={P.brown} />
                <circle cx={ax} cy={ay} r={5 + 8 * (1 - clamp((p - c.delay) / 0.3))} fill="none" stroke={P.brown} strokeWidth="1.5" opacity={1 - clamp((p - c.delay) / 0.3)} />
              </g>
            );
          })}
        </svg>

        {calls.map((c) => {
          const w = clamp((p - c.delay - 0.06) / 0.16);
          const e = spring(w);
          return (
            <div key={c.key} style={{ position: 'absolute', left: `${(c.lx / 1920) * 100}%`, top: `${(c.ly / 1080) * 100}%`,
              transform: `translate(-50%,-50%) scale(${lerp(0.8, 1, e)})`, opacity: clamp(w * 1.5) }}>
              <div style={{ background: P.brown, color: P.cream, padding: '9px 16px', borderRadius: 8, minWidth: 132,
                textAlign: 'center', boxShadow: '0 8px 20px rgba(90,58,40,0.35)' }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 19, lineHeight: 1 }}>{c.label}</div>
                <div style={{ fontSize: 11, opacity: 0.85, marginTop: 3 }}>{c.desc}</div>
              </div>
            </div>
          );
        })}

        <div style={{ position: 'absolute', left: '50%', top: `${(cy / 1080) * 100}%`,
          transform: `translate(-50%,-50%) scale(${lerp(0.92, 1, cardIn)}) rotate(${lerp(-3, 0, cardIn)}deg)`,
          opacity: clamp(cardIn * 1.4) }}>
          <img src={`${BASE}cards/saffron-milk-cap.jpg`} alt="Saffron Milk Cap"
            style={{ width: cardW, height: 'auto', display: 'block',
              filter: 'drop-shadow(0 30px 55px rgba(90,58,40,0.42))' }}/>
        </div>
      </div>
    </Sprite>
  );
}

function GameplayScene() {
  const { p, local } = useScene('gameplay');
  const size = 60;
  const tiles = [
    { q: 0, r: 0, h: 'tree' },   { q: 1, r: 0, h: 'decay' }, { q: -1, r: 1, h: 'shade' },
    { q: 0, r: 1, h: 'tree' },   { q: 1, r: 1, h: 'wet' },   { q: 2,  r: 0, h: 'open' },
    { q: -1, r: 2, h: 'decay' }, { q: 0, r: 2, h: 'tree' },  { q: 1,  r: 2, h: 'shade' },
  ];
  const pts = tiles.map(t => hexPos(t.q, t.r, size));
  const minX = Math.min(...pts.map(a => a.x)), maxX = Math.max(...pts.map(a => a.x));
  const minY = Math.min(...pts.map(a => a.y)), maxY = Math.max(...pts.map(a => a.y));
  const ox = -(minX + maxX) / 2, oy = -(minY + maxY) / 2;
  const BW = 760, BH = 560, bcx = BW / 2, bcy = BH / 2;
  const tileXY = (i: number) => ({ x: bcx + pts[i].x + ox, y: bcy + pts[i].y + oy });

  const T = { intro: 0, draw: 3, spread: 10, plant: 19, collect: 28, done: 36 };
  const boardIn = spring(clamp(local / 1.6));

  const claim1 = clamp((local - 12) / 1.6);
  const claim2 = clamp((local - 14.5) / 1.6);
  const owned = new Set([3, 6]);
  if (claim1 > 0.5) owned.add(4);
  if (claim2 > 0.5) owned.add(7);
  const claimT = (i: number) => i === 4 ? claim1 : i === 7 ? claim2 : (owned.has(i) ? 1 : 0);

  const plantFly = clamp((local - T.plant) / 2.2);
  const plantGrow = clamp((local - (T.plant + 2.2)) / 1.4);
  const planted = plantGrow > 0.05;

  const spore = valueAt([{ t: T.plant + 2.4, delta: -2 }, { t: 31, delta: +1 }, { t: 33, delta: +1 }], 3, local);
  const moist = valueAt([{ t: 12.8, delta: -1 }, { t: 15.3, delta: -1 }, { t: 32, delta: +1 }], 4, local);
  const sun   = valueAt([{ t: T.draw + 2, delta: -1 }, { t: 33.5, delta: +1 }], 2, local);

  const drawFly = clamp((local - (T.draw + 0.4)) / 2);
  const handHasDrawn = drawFly > 0.05;
  const kingPlanted = plantFly > 0.5;

  const steps = [
    { t0: T.draw,    t1: T.spread,       tag: 'Draw',    icon: '🎴', text: 'Spend sunlight to draw mushroom cards into your hand.' },
    { t0: T.spread,  t1: T.plant,        tag: 'Spread',  icon: '🕸️', text: 'Pay moisture to claim adjacent tiles — your mycelium network grows.' },
    { t0: T.plant,   t1: T.collect,      tag: 'Plant',   icon: '🌱', text: 'Spend spores to plant a card on a tile that matches its habitat.' },
    { t0: T.collect, t1: T.done + 4,     tag: 'Collect', icon: '✨', text: 'Every turn, each planted mushroom harvests its resource.' },
  ];
  const step = steps.find(s => local >= s.t0 && local < s.t1);

  return (
    <Sprite start={SC.gameplay.start} end={SC.gameplay.end}>
      <div style={{ position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 42%, ${P.forest} 0%, ${P.inkGreen} 74%)` }}>
        <AmbientSpores count={18} opacity={0.3} />

        <div style={{ position: 'absolute', top: 46, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{ marginBottom: 8 }}><Eyebrow label="A Turn, Step by Step" p={clamp(p / 0.1)} /></div>
          <KineticHeading p={p} startFrac={0.01} stagger={0.045} size={44} lineHeight={1}
            words={[{ t: 'Choose' }, { t: 'one' }, { t: 'action,', accent: true }, { t: 'repeat' }, { t: 'it.' }]} />
        </div>

        <div style={{ position: 'absolute', top: 150, right: 70, display: 'flex', flexDirection: 'column', gap: 12,
          opacity: boardIn, transform: `translateX(${(1 - boardIn) * 30}px)` }}>
          <ResChip glyph="🌰" color={P.spore}    value={spore.value} pop={spore.pop} label="Spore" />
          <ResChip glyph="💧" color={P.moisture} value={moist.value} pop={moist.pop} label="Moisture" />
          <ResChip glyph="☀️" color={P.sunlight} value={sun.value}   pop={sun.pop}   label="Sunlight" />
        </div>

        <div style={{ position: 'absolute', left: '46%', top: '52%',
          transform: `translate(-50%,-50%) scale(${lerp(0.92, 1, boardIn)})`, opacity: boardIn }}>
          <div style={{ position: 'relative', width: BW, height: BH }}>
            {tiles.map((tile, i) => {
              const { x, y } = tileXY(i);
              const entrance = spring(clamp((local - 0.3 - i * 0.07) / 1.2));
              const ct = claimT(i);
              const isTarget = (i === 4 || i === 7);
              const targetPulse = isTarget && local >= T.spread && local < 16
                ? (0.5 + 0.5 * Math.sin(local * 5)) : 0;
              return (
                <div key={i} style={{ position: 'absolute', left: x, top: y,
                  transform: `translate(-50%,-50%) scale(${entrance})`, opacity: entrance }}>
                  {ct > 0 && (
                    <div style={{ position: 'absolute', inset: -5,
                      clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
                      background: P.amber, opacity: 0.55 * ct, boxShadow: `0 0 ${26 * ct}px ${P.amber}` }}/>
                  )}
                  {targetPulse > 0 && ct < 0.5 && (
                    <div style={{ position: 'absolute', inset: -4,
                      clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)',
                      border: `3px dashed ${P.gold}`, opacity: 0.4 + targetPulse * 0.5 }}/>
                  )}
                  <HexTile habitat={tile.h} size={size * 2} />
                  {i === 4 && planted && (
                    <div style={{ position: 'absolute', left: '50%', top: '42%',
                      transform: `translate(-50%,-50%) scale(${spring(plantGrow)})`,
                      fontSize: 52, filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.6))' }}>🍄</div>
                  )}
                </div>
              );
            })}

            {plantFly > 0 && plantFly < 1 && (() => {
              const { x, y } = tileXY(4);
              const fx = lerp(bcx - 40, x, Easing.easeInOutCubicFull(plantFly));
              const fy = lerp(BH + 120, y, Easing.easeInOutCubicFull(plantFly));
              const sc = lerp(1, 0.5, plantFly);
              const rot = lerp(-8, 0, plantFly);
              return (
                <div style={{ position: 'absolute', left: fx, top: fy,
                  transform: `translate(-50%,-50%) scale(${sc}) rotate(${rot}deg)`,
                  opacity: 1 - clamp((plantFly - 0.8) / 0.2) }}>
                  <HandCard name="King Bolete" cost={4} habitat="wet" w={120} />
                </div>
              );
            })()}

            {local >= T.collect && local < 35 && Array.from({ length: 8 }).map((_, i) => {
              const prog = clamp((local - T.collect - i * 0.22) / 2.4);
              if (prog <= 0 || prog >= 1) return null;
              const src = tileXY(4);
              const kinds: [string][] = [[P.spore], [P.moisture], [P.sunlight]];
              const [c] = kinds[i % 3];
              const gx = src.x + Math.sin(i * 1.4) * 40;
              const gy = src.y - 30 - prog * 150;
              return (
                <div key={i} style={{ position: 'absolute', left: gx, top: gy,
                  transform: 'translate(-50%,-50%)', width: 22, height: 22, borderRadius: '50%',
                  background: c, opacity: (1 - prog) * 0.95, boxShadow: `0 0 14px ${c}`,
                  border: '2px solid rgba(255,255,255,0.6)' }}/>
              );
            })}
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 116, left: '46%', transform: 'translateX(-50%)',
          display: 'flex', gap: 14, alignItems: 'flex-end', opacity: boardIn }}>
          {!kingPlanted && (
            <div style={{ transform: `translateY(${plantFly > 0 ? -plantFly * 40 : 0}px)`,
              opacity: 1 - clamp(plantFly / 0.5) }}>
              <HandCard name="King Bolete" cost={4} habitat="wet" />
            </div>
          )}
          <HandCard name="Reishi" cost={4} habitat="shade" />
          {handHasDrawn && (
            <div style={{ transform: `translateY(${(1 - spring(drawFly)) * -160}px)`, opacity: clamp(drawFly * 1.4) }}>
              <HandCard name="Chanterelle" cost={2} habitat="tree" />
            </div>
          )}
        </div>

        {step && (() => {
          const bp = clamp((local - step.t0) / 0.5);
          const bexit = 1 - clamp((local - (step.t1 - 0.5)) / 0.5);
          const e = spring(bp) * bexit;
          return (
            <div style={{ position: 'absolute', bottom: 44, left: '50%',
              transform: `translateX(-50%) translateY(${(1 - e) * 16}px)`,
              opacity: clamp(e * 1.3), display: 'flex', alignItems: 'center', gap: 16,
              background: `linear-gradient(160deg, ${P.panel2}, ${P.panel})`,
              border: `1.5px solid ${P.mossDeep}77`,
              borderRadius: 14, padding: '14px 26px', maxWidth: 720,
              boxShadow: '0 22px 40px -18px rgba(0,0,0,0.7)' }}>
              <div style={{ width: 62, height: 62, borderRadius: 12,
                background: 'rgba(232,154,58,0.15)', border: `1px solid ${P.amber}66`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, flexShrink: 0 }}>{step.icon}</div>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700,
                  fontSize: 26, color: P.amber, lineHeight: 1 }}>{step.tag}</div>
                <div style={{ fontSize: 16, color: 'rgba(242,234,216,0.9)', marginTop: 5, lineHeight: 1.35 }}>{step.text}</div>
              </div>
            </div>
          );
        })()}

        <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 10 }}>
          {steps.map((s, i) => {
            const active = step === s, done = local >= s.t1;
            return (
              <div key={i} style={{ width: active ? 34 : 9, height: 9, borderRadius: 5,
                background: active || done ? P.amber : 'rgba(242,234,216,0.22)', transition: 'all 300ms' }}/>
            );
          })}
        </div>
      </div>
    </Sprite>
  );
}

function SeasonsScene() {
  const { p } = useScene('seasons');
  const seasons = [
    { name: 'Spring', icon: '🌱', c: '#6E8A3E', turns: '1–5'   },
    { name: 'Summer', icon: '☀️', c: '#D4A843', turns: '6–10'  },
    { name: 'Autumn', icon: '🍂', c: '#C4501E', turns: '11–15' },
    { name: 'Winter', icon: '❄️', c: '#5FA8C4', turns: '16–20' },
  ];
  return (
    <Sprite start={SC.seasons.start} end={SC.seasons.end}>
      <div style={{ position: 'absolute', inset: 0,
        background: `linear-gradient(160deg, ${P.panel} 0%, ${P.ink} 100%)` }}>
        <AmbientSpores count={18} opacity={0.3} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: 90 }}>
          <div style={{ marginBottom: 12 }}><Eyebrow label="20 Turns · 4 Seasons" p={clamp(p / 0.2)} /></div>
          <KineticHeading p={p} startFrac={0.04} stagger={0.06} size={54} lineHeight={1}
            words={[{ t: 'The' }, { t: 'Turning' }, { t: 'Year', accent: true }]} />
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 21,
            color: 'rgba(242,234,216,0.8)', marginTop: 14, marginBottom: 40, opacity: clamp((p - 0.15) / 0.2) }}>
            One random effect per season — revealed at the start, so you can plan ahead.
          </div>
          <div style={{ display: 'flex', gap: 22 }}>
            {seasons.map((s, i) => {
              const w = clamp((p - (0.28 + i * 0.11)) / 0.3);
              const e = spring(w);
              return (
                <div key={i} style={{ width: 210, padding: '36px 20px', borderRadius: 14, textAlign: 'center',
                  background: `linear-gradient(160deg, ${s.c}22, ${P.panel})`, border: `1.5px solid ${s.c}66`,
                  transform: `translateY(${(1 - e) * 40}px) scale(${lerp(0.86, 1, e)})`,
                  opacity: clamp(w * 1.4), boxShadow: '0 22px 40px -18px rgba(0,0,0,0.7)' }}>
                  <div style={{ fontSize: 68, marginBottom: 16, lineHeight: 1 }}>{s.icon}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 32, color: s.c }}>{s.name}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 2,
                    color: 'rgba(242,234,216,0.6)', marginTop: 6, textTransform: 'uppercase' }}>Turns {s.turns}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Sprite>
  );
}

function OutroScene() {
  const { p } = useScene('outro');
  return (
    <Sprite start={SC.outro.start} end={SC.outro.end}>
      <div style={{ position: 'absolute', inset: 0, background: P.ink }}>
        <KenBurns src={`${BASE}cta-mushrooms.png`} p={p} from={1.1} to={1.02} panY={2}
          overlay="linear-gradient(160deg, rgba(11,7,5,0.82) 0%, rgba(11,7,5,0.7) 100%)" />
        <AmbientSpores count={30} opacity={0.55} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 26 }}>
          <KineticHeading p={p} startFrac={0.06} stagger={0.08} size={78}
            words={[{ t: 'Ready' }, { t: 'to' }, { t: 'forage?', accent: true, italic: true }]} />
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 25,
            color: 'rgba(242,234,216,0.86)', textShadow: '0 2px 12px rgba(0,0,0,0.7)',
            opacity: clamp((p - 0.32) / 0.25), transform: `translateY(${(1 - clamp((p - 0.32) / 0.25)) * 12}px)` }}>
            Build your network. Outwit your rivals. Spread wide.
          </div>
          <div style={{ marginTop: 14, opacity: clamp((p - 0.5) / 0.25),
            transform: `scale(${lerp(0.9, 1, spring(clamp((p - 0.5) / 0.35)))})` }}>
            <div style={{ background: `linear-gradient(135deg, ${P.amber}, ${P.amberDeep})`, color: P.ink,
              padding: '20px 52px', borderRadius: 10, fontFamily: "'Cormorant Garamond', serif", fontWeight: 700,
              fontSize: 26, boxShadow: '0 16px 40px rgba(232,154,58,0.5)' }}>
              Play Mushroom Mayhem →
            </div>
          </div>
          <div style={{ marginTop: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 3,
            textTransform: 'uppercase', color: 'rgba(242,234,216,0.5)', opacity: clamp((p - 0.62) / 0.2) }}>
            2–4 players · 60–90 minutes
          </div>
        </div>
      </div>
    </Sprite>
  );
}

// ─── Playback bar ─────────────────────────────────────────────────────────────
function IconBtn({ children, onClick, title }: { children: ReactNode; onClick: () => void; title?: string }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: hov ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#f6f4ef',
        cursor: 'pointer', padding: 0, flexShrink: 0, transition: 'background 120ms' }}>
      {children}
    </button>
  );
}

interface PBProps {
  time: number; duration: number; playing: boolean;
  onPlayPause: () => void; onReset: () => void;
  onSeek: (t: number) => void; onHover: (t: number | null) => void;
}
function PlaybackBar({ time, duration, playing, onPlayPause, onReset, onSeek, onHover }: PBProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const pct = duration > 0 ? (time / duration) * 100 : 0;
  const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const mono = 'JetBrains Mono, monospace';

  const tFromE = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!trackRef.current) return 0;
    const r = trackRef.current.getBoundingClientRect();
    return clamp((e.clientX - r.left) / r.width) * duration;
  }, [duration]);

  useEffect(() => {
    if (!dragging) return;
    const up = () => setDragging(false);
    const mv = (e: MouseEvent) => onSeek(tFromE(e));
    window.addEventListener('mouseup', up);
    window.addEventListener('mousemove', mv);
    return () => { window.removeEventListener('mouseup', up); window.removeEventListener('mousemove', mv); };
  }, [dragging, tFromE, onSeek]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
      background: 'rgba(14,10,6,0.95)', borderTop: '1px solid rgba(255,255,255,0.07)',
      width: '100%', color: '#f6f4ef', userSelect: 'none', flexShrink: 0 }}>
      <IconBtn onClick={onReset} title="Restart">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 2v10M12 2L5 7l7 5V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
        </svg>
      </IconBtn>
      <IconBtn onClick={onPlayPause} title="Play / Pause (space)">
        {playing
          ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="3" y="2" width="3" height="10" fill="currentColor"/><rect x="8" y="2" width="3" height="10" fill="currentColor"/></svg>
          : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 2l9 5-9 5V2z" fill="currentColor"/></svg>
        }
      </IconBtn>
      <div style={{ fontFamily: mono, fontSize: 12, width: 36, textAlign: 'right', flexShrink: 0 }}>{fmt(time)}</div>
      <div ref={trackRef}
        style={{ flex: 1, height: 22, position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        onMouseMove={e => { onHover(tFromE(e)); if (dragging) onSeek(tFromE(e)); }}
        onMouseLeave={() => { if (!dragging) onHover(null); }}
        onMouseDown={e => { setDragging(true); onSeek(tFromE(e)); onHover(null); }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: 4, background: 'rgba(255,255,255,0.12)', borderRadius: 2 }}/>
        <div style={{ position: 'absolute', left: 0, width: `${pct}%`, height: 4, background: P.amber, borderRadius: 2 }}/>
        <div style={{ position: 'absolute', left: `${pct}%`, top: '50%', width: 12, height: 12,
          marginLeft: -6, marginTop: -6, background: '#fff', borderRadius: 6, boxShadow: '0 2px 4px rgba(0,0,0,0.4)' }}/>
      </div>
      <div style={{ fontFamily: mono, fontSize: 12, width: 36, color: 'rgba(246,244,239,0.45)', flexShrink: 0 }}>{fmt(duration)}</div>
    </div>
  );
}

// ─── Stage ────────────────────────────────────────────────────────────────────
function Stage({ width = 1920, height = 1080, children }: { width?: number; height?: number; children: ReactNode }) {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [scale, setScale] = useState(1);
  const stageRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastTs = useRef<number | null>(null);

  useEffect(() => {
    const el = stageRef.current; if (!el) return;
    const measure = () => {
      const barH = 42;
      setScale(Math.max(0.05, Math.min(el.clientWidth / width, (el.clientHeight - barH) / height)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height]);

  useEffect(() => {
    if (!playing) { lastTs.current = null; return; }
    const step = (ts: number) => {
      if (lastTs.current == null) lastTs.current = ts;
      const dt = (ts - lastTs.current) / 1000;
      lastTs.current = ts;
      setTime(t => { const n = t + dt; return n >= DURATION ? n % DURATION : n; });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); lastTs.current = null; };
  }, [playing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.code === 'Space') { e.preventDefault(); setPlaying(p => !p); }
      else if (e.code === 'ArrowLeft')  setTime(t => clamp(t - (e.shiftKey ? 1 : 0.1), 0, DURATION));
      else if (e.code === 'ArrowRight') setTime(t => clamp(t + (e.shiftKey ? 1 : 0.1), 0, DURATION));
      else if (e.key === '0') setTime(0);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const dt = hoverTime ?? time;
  const ctx = useMemo(() => ({ time: dt, duration: DURATION, playing, setTime, setPlaying }), [dt, playing]);

  return (
    <div ref={stageRef} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', background: '#0a0a0a' }}>
      <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', minHeight: 0 }}>
        <div style={{ width, height, position: 'relative', transform: `scale(${scale})`,
          transformOrigin: 'center', flexShrink: 0, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          overflow: 'hidden', background: P.ink }}>
          <TL.Provider value={ctx}>{children}</TL.Provider>
        </div>
      </div>
      <PlaybackBar time={time} duration={DURATION} playing={playing}
        onPlayPause={() => setPlaying(p => !p)}
        onReset={() => setTime(0)}
        onSeek={t => setTime(t)}
        onHover={setHoverTime}
      />
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────
export function HowToPlayVideo() {
  return (
    <Stage>
      <IntroScene />
      <OverviewScene />
      <HabitatsScene />
      <CardAnatomyScene />
      <GameplayScene />
      <SeasonsScene />
      <OutroScene />
      {BOUNDARIES.map((b, i) => <SporeBurst key={i} at={b} dur={0.95} />)}
      <Vignette strength={0.5} />
      <Grain opacity={0.045} />
    </Stage>
  );
}
