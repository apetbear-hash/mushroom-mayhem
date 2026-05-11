import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

const BASE = import.meta.env.BASE_URL;

const P = {
  ink: '#0B0705', paper: '#F2EAD8', cream: '#E8DCC8',
  amber: '#E89A3A', amberDeep: '#A55818',
  moss: '#5C7338', forest: '#1A2014',
};

// ─── Easing ──────────────────────────────────────────────────────────────────
const ease = {
  outQuad:  (t: number) => t * (2 - t),
  inQuad:   (t: number) => t * t,
  outBack:  (t: number) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outExpo:  (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
};
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const prog = (t: number, start: number, end: number) => clamp((t - start) / (end - start), 0, 1);

// ─── Scene timings ────────────────────────────────────────────────────────────
const DURATION = 120;
const S = {
  intro:   { s: 0,   e: 6   },
  over:    { s: 6,   e: 14  },
  hab:     { s: 14,  e: 30  },
  card:    { s: 30,  e: 50  },
  play:    { s: 50,  e: 85  },
  seasons: { s: 85,  e: 105 },
  outro:   { s: 105, e: 120 },
};

// ─── Timeline context ─────────────────────────────────────────────────────────
type TCtx = {
  time: number; duration: number; playing: boolean;
  setTime: (t: number | ((p: number) => number)) => void;
  setPlaying: (v: boolean | ((p: boolean) => boolean)) => void;
};
const TL = createContext<TCtx>({ time: 0, duration: DURATION, playing: false, setTime: () => {}, setPlaying: () => {} });
const useTime = () => useContext(TL).time;

// ─── Sprite ───────────────────────────────────────────────────────────────────
function Sprite({ s, e, children }: { s: number; e: number; children: ReactNode }) {
  const t = useTime();
  return t >= s && t <= e ? <>{children}</> : null;
}

// ─── Scene components ─────────────────────────────────────────────────────────

function IntroScene() {
  const t = useTime();
  const p = prog(t, S.intro.s, S.intro.e);
  const scale = 0.9 + ease.outBack(p) * 0.1;
  const opacity = p < 0.7 ? ease.outQuad(p / 0.7) : ease.inQuad((1 - p) / 0.3);
  return (
    <Sprite s={S.intro.s} e={S.intro.e}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity }}>
        <img src={`${BASE}splash.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}/>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,7,5,0.55) 0%, rgba(11,7,5,0.88) 100%)' }}/>
        <div style={{ position: 'relative', textAlign: 'center', transform: `scale(${scale})` }}>
          <div style={{ fontSize: 14, letterSpacing: 4, textTransform: 'uppercase', color: P.amber, marginBottom: 16, fontWeight: 600 }}>How to Play</div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 96, fontWeight: 700, margin: 0, color: P.paper, letterSpacing: -1, textShadow: '0 4px 24px rgba(0,0,0,0.8)' }}>
            Mushroom <span style={{ fontStyle: 'italic', color: P.amber }}>Mayhem</span>
          </h1>
        </div>
      </div>
    </Sprite>
  );
}

function OverviewScene() {
  const t = useTime();
  const p = prog(t, S.over.s, S.over.e);
  const items = [{ icon: '👥', text: '2–4 Players' }, { icon: '🎯', text: 'Hex Strategy' }, { icon: '🏆', text: 'High Score Wins' }];
  return (
    <Sprite s={S.over.s} e={S.over.e}>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${P.forest} 0%, ${P.ink} 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 56, fontWeight: 700, textAlign: 'center', margin: '0 0 50px', maxWidth: 800, color: P.paper, opacity: ease.outQuad(clamp(p * 2, 0, 1)) }}>
          Grow your network.<br/>Plant mushrooms. Score points.
        </h2>
        <div style={{ display: 'flex', gap: 30, maxWidth: 900 }}>
          {items.map((item, i) => {
            const ip = ease.outExpo(clamp((p - 0.3 - i * 0.15) / 0.2, 0, 1));
            return (
              <div key={i} style={{ background: 'rgba(242,234,216,0.08)', border: '1px solid rgba(242,234,216,0.2)', borderRadius: 8, padding: 30, textAlign: 'center', flex: 1, transform: `translateY(${(1 - ip) * 30}px)`, opacity: ease.outQuad(clamp((p - 0.3 - i * 0.15) / 0.2, 0, 1)) }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{item.icon}</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{item.text}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Sprite>
  );
}

function HabitatsScene() {
  const t = useTime();
  const p = prog(t, S.hab.s, S.hab.e);
  const ho = ease.outQuad(clamp(p * 3, 0, 1));
  const habitats = [
    { name: 'Wet',    img: `${BASE}tiles/tile-wet.png`,   desc: 'Streams & marshes' },
    { name: 'Shade',  img: `${BASE}tiles/tile-shade.png`, desc: 'Under canopy' },
    { name: 'Open',   img: `${BASE}tiles/tile-open.png`,  desc: 'Sunlit clearings' },
    { name: 'Tree',   img: `${BASE}tiles/tile-tree.png`,  desc: 'Living wood' },
    { name: 'Decay',  img: `${BASE}tiles/tile-decay.png`, desc: 'Rotting logs' },
    { name: 'Blight', img: `${BASE}tiles/tile-blight.png`,desc: 'Corrupted' },
  ];
  return (
    <Sprite s={S.hab.s} e={S.hab.e}>
      <div style={{ position: 'absolute', inset: 0, background: P.ink, padding: 80 }}>
        <div style={{ fontSize: 14, letterSpacing: 3, textTransform: 'uppercase', color: P.amber, marginBottom: 16, opacity: ho }}>The Board</div>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 52, fontWeight: 700, margin: '0 0 16px', color: P.paper, opacity: ho }}>Six Habitats</h2>
        <p style={{ fontSize: 18, marginBottom: 40, opacity: 0.75, maxWidth: 700 }}>Each mushroom can only be planted on specific habitat types</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, maxWidth: 1100 }}>
          {habitats.map((h, i) => {
            const ip = clamp((p - 0.2 - i * 0.08) / 0.15, 0, 1);
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, transform: `scale(${ease.outBack(ip)})`, opacity: ease.outQuad(ip) }}>
                <div style={{ width: 180, height: 180, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(242,234,216,0.2)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                  <img src={h.img} alt={h.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                </div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 700, color: P.amber }}>{h.name}</div>
                <div style={{ fontSize: 14, opacity: 0.7, fontStyle: 'italic' }}>{h.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Sprite>
  );
}

function CardAnatomyScene() {
  const t = useTime();
  const p = prog(t, S.card.s, S.card.e);
  const ho = ease.outQuad(clamp(p * 3, 0, 1));
  const co = ease.outQuad(clamp((p - 0.05) / 0.15, 0, 1));

  // Callouts positioned in 1920×1080 canvas coords.
  // Card (400×560) centred at x=960, y≈605 (card top≈325, bottom≈885).
  const callouts = [
    { x: 615,  y: 395, label: 'Habitat',   desc: 'Tree tile only',            tx: 818,  ty: 405, d: 0.15 },
    { x: 1315, y: 395, label: 'Points',    desc: '1 symbiosis point',          tx: 1110, ty: 405, d: 0.20 },
    { x: 615,  y: 590, label: 'Cost',      desc: '2 spores to plant',          tx: 818,  ty: 580, d: 0.25 },
    { x: 1315, y: 590, label: 'Generates', desc: '+1 spore per turn',          tx: 1110, ty: 580, d: 0.30 },
    { x: 615,  y: 760, label: 'Type',      desc: 'Mycorrhizal',                tx: 845,  ty: 730, d: 0.35 },
    { x: 1315, y: 760, label: 'Ability',   desc: 'Gain 2 spores when planted', tx: 1060, ty: 800, d: 0.40 },
  ];

  return (
    <Sprite s={S.card.s} e={S.card.e}>
      <div style={{ position: 'absolute', inset: 0, background: P.cream, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
        <div style={{ fontSize: 14, letterSpacing: 3, textTransform: 'uppercase', color: '#5A3A28', marginBottom: 16, opacity: ho }}>Reading Cards</div>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 52, fontWeight: 700, margin: '0 0 40px', color: '#5A3A28', textAlign: 'center', opacity: ho }}>Card Anatomy</h2>

        {/* Card image */}
        <div style={{ position: 'relative', opacity: co, transform: `scale(${0.96 + co * 0.04})` }}>
          <img src={`${BASE}cards/saffron-milk-cap.jpg`} alt="Saffron Milk Cap" style={{ width: 400, height: 560, objectFit: 'cover', boxShadow: '0 24px 48px rgba(90,58,40,0.3)', borderRadius: 8 }}/>
        </div>

        {/* Pointer lines */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {callouts.map((c, i) => {
            const ip = clamp((p - c.d) / 0.15, 0, 1);
            const op = ease.outQuad(ip);
            if (op < 0.01) return null;
            const ext = op;
            return (
              <g key={i} opacity={op}>
                <line x1={c.tx} y1={c.ty} x2={c.tx + (c.x - c.tx) * ext} y2={c.ty + (c.y - c.ty) * ext} stroke="#5A3A28" strokeWidth="2" strokeDasharray="5,4"/>
                <circle cx={c.tx} cy={c.ty} r="6" fill="#5A3A28"/>
              </g>
            );
          })}
        </svg>

        {/* Label boxes */}
        {callouts.map((c, i) => {
          const ip = clamp((p - c.d) / 0.15, 0, 1);
          const op = ease.outQuad(ip);
          if (op < 0.01) return null;
          return (
            <div key={i} style={{ position: 'absolute', left: c.x, top: c.y, transform: 'translate(-50%,-50%)', opacity: op }}>
              <div style={{ background: '#5A3A28', color: P.cream, padding: '8px 16px', borderRadius: 6, textAlign: 'center', minWidth: 130, boxShadow: '0 4px 12px rgba(90,58,40,0.3)', whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{c.label}</div>
                <div style={{ fontSize: 10, opacity: 0.85 }}>{c.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </Sprite>
  );
}

function GameplayScene() {
  const t = useTime();
  const p = prog(t, S.play.s, S.play.e);
  const ho = clamp(p * 20, 0, 1);
  const actions = [
    { icon: '🎴', name: 'Draw',   time: 0,  desc: 'Draw cards — costs scale each card drawn: 1☀️, 2☀️, 3☀️...' },
    { icon: '🔀', name: 'Spread', time: 9,  desc: 'Expand your network — cost grows with network size' },
    { icon: '🌱', name: 'Plant',  time: 18, desc: 'Play mushroom cards onto matching tiles — costs spores' },
    { icon: '💤', name: 'Rest',   time: 26, desc: 'Gain 1 of each resource — free, but ends your turn' },
  ];
  const curIdx = actions.findIndex(a => t >= S.play.s + a.time && t < S.play.s + a.time + 9);
  const cur = curIdx >= 0 ? actions[curIdx] : null;
  const ap = cur ? clamp((t - (S.play.s + cur.time)) / 9, 0, 1) : 0;
  return (
    <Sprite s={S.play.s} e={S.play.e}>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${P.forest} 0%, ${P.ink} 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
        <div style={{ fontSize: 14, letterSpacing: 3, textTransform: 'uppercase', color: P.amber, marginBottom: 16, opacity: ho }}>Your Turn</div>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 52, fontWeight: 700, margin: '0 0 16px', textAlign: 'center', color: P.paper, opacity: ho }}>Choose One Action</h2>
        <p style={{ fontSize: 18, textAlign: 'center', maxWidth: 600, opacity: 0.7, marginBottom: 50 }}>Repeat it as many times as you can afford</p>
        {cur && (
          <div style={{ background: 'rgba(232,154,58,0.12)', border: '2px solid rgba(232,154,58,0.3)', borderRadius: 12, padding: 50, maxWidth: 720, textAlign: 'center', transform: `scale(${0.95 + ease.outBack(ap) * 0.05})`, opacity: ease.outQuad(ap) }}>
            <div style={{ fontSize: 80, marginBottom: 20 }}>{cur.icon}</div>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 48, fontWeight: 700, margin: '0 0 15px', color: P.amber }}>{cur.name}</h3>
            <p style={{ fontSize: 20, margin: 0, lineHeight: 1.5 }}>{cur.desc}</p>
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 100, display: 'flex', gap: 12 }}>
          {actions.map((_, i) => (
            <div key={i} style={{ width: i === curIdx ? 40 : 10, height: 10, borderRadius: 5, background: i <= curIdx ? P.amber : 'rgba(242,234,216,0.2)', transition: 'all 300ms' }}/>
          ))}
        </div>
      </div>
    </Sprite>
  );
}

function SeasonsScene() {
  const t = useTime();
  const p = prog(t, S.seasons.s, S.seasons.e);
  const ho = ease.outQuad(clamp(p * 3, 0, 1));
  const seasons = [
    { name: 'Spring', icon: '🌱', color: '#5C7338' },
    { name: 'Summer', icon: '☀️', color: '#D4A843' },
    { name: 'Autumn', icon: '🍂', color: '#C04A1E' },
    { name: 'Winter', icon: '❄️', color: '#4FA8A4' },
  ];
  return (
    <Sprite s={S.seasons.s} e={S.seasons.e}>
      <div style={{ position: 'absolute', inset: 0, background: P.ink, padding: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 14, letterSpacing: 3, textTransform: 'uppercase', color: P.amber, marginBottom: 16, opacity: ho }}>20 Turns</div>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 52, fontWeight: 700, margin: '0 0 16px', color: P.paper, textAlign: 'center', opacity: ho }}>Four Seasons</h2>
        <p style={{ fontSize: 18, textAlign: 'center', maxWidth: 600, opacity: 0.7, marginBottom: 50 }}>One random effect per season — game ends after Turn 20</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, maxWidth: 900 }}>
          {seasons.map((s, i) => {
            const ip = clamp((p - 0.2 - i * 0.1) / 0.2, 0, 1);
            return (
              <div key={i} style={{ background: `${s.color}15`, border: `2px solid ${s.color}40`, borderRadius: 8, padding: 30, textAlign: 'center', transform: `scale(${ease.outBack(ip)})`, opacity: ease.outQuad(ip) }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>{s.icon}</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 700, color: s.color }}>{s.name}</div>
              </div>
            );
          })}
        </div>
      </div>
    </Sprite>
  );
}

function OutroScene() {
  const t = useTime();
  const p = prog(t, S.outro.s, S.outro.e);
  const op = ease.outQuad(p);
  const sc = 0.96 + op * 0.04;
  return (
    <Sprite s={S.outro.s} e={S.outro.e}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: op }}>
        <img src={`${BASE}cta-mushrooms.png`} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}/>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(11,7,5,0.85) 0%, rgba(11,7,5,0.75) 100%)' }}/>
        <div style={{ position: 'relative', textAlign: 'center', transform: `scale(${sc})` }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 64, fontWeight: 700, margin: '0 0 24px', color: P.paper, textShadow: '0 4px 24px rgba(0,0,0,0.8)' }}>Ready to Explore?</h2>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic', fontSize: 24, color: P.paper, opacity: 0.85, marginBottom: 40 }}>
            Build your network. Outwit rivals. May your spores spread wide.
          </p>
          <div style={{ display: 'inline-block', background: `linear-gradient(135deg, ${P.amber}, ${P.amberDeep})`, color: P.ink, padding: '20px 50px', borderRadius: 8, fontSize: 22, fontWeight: 700, boxShadow: '0 12px 32px rgba(232,154,58,0.5)' }}>
            Play Mushroom Mayhem
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
    <button onClick={onClick} title={title} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: hov ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#f6f4ef', cursor: 'pointer', padding: 0, flexShrink: 0, transition: 'background 120ms' }}>
      {children}
    </button>
  );
}

interface PBProps { time: number; duration: number; playing: boolean; onPlayPause: () => void; onReset: () => void; onSeek: (t: number) => void; onHover: (t: number | null) => void; }

function PlaybackBar({ time, duration, playing, onPlayPause, onReset, onSeek, onHover }: PBProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const pct = duration > 0 ? (time / duration) * 100 : 0;
  const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const mono = 'JetBrains Mono, monospace';

  const tFromE = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!trackRef.current) return 0;
    const r = trackRef.current.getBoundingClientRect();
    return clamp((e.clientX - r.left) / r.width, 0, 1) * duration;
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: 'rgba(14,10,6,0.95)', borderTop: '1px solid rgba(255,255,255,0.07)', width: '100%', color: '#f6f4ef', userSelect: 'none', flexShrink: 0 }}>
      <IconBtn onClick={onReset} title="Restart">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 2v10M12 2L5 7l7 5V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/></svg>
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
        onMouseDown={e => { setDragging(true); onSeek(tFromE(e)); onHover(null); }}
      >
        <div style={{ position: 'absolute', left: 0, right: 0, height: 4, background: 'rgba(255,255,255,0.12)', borderRadius: 2 }}/>
        <div style={{ position: 'absolute', left: 0, width: `${pct}%`, height: 4, background: P.amber, borderRadius: 2 }}/>
        <div style={{ position: 'absolute', left: `${pct}%`, top: '50%', width: 12, height: 12, marginLeft: -6, marginTop: -6, background: '#fff', borderRadius: 6, boxShadow: '0 2px 4px rgba(0,0,0,0.4)' }}/>
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
      else if (e.code === 'ArrowLeft') setTime(t => clamp(t - (e.shiftKey ? 1 : 0.1), 0, DURATION));
      else if (e.code === 'ArrowRight') setTime(t => clamp(t + (e.shiftKey ? 1 : 0.1), 0, DURATION));
      else if (e.key === '0') setTime(0);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const dt = hoverTime ?? time;
  const ctx = useMemo(() => ({ time: dt, duration: DURATION, playing, setTime, setPlaying }), [dt, playing]);

  return (
    <div ref={stageRef} style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#0a0a0a' }}>
      <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', minHeight: 0 }}>
        <div style={{ width, height, position: 'relative', transform: `scale(${scale})`, transformOrigin: 'center', flexShrink: 0, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', overflow: 'hidden', background: P.ink }}>
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
    </Stage>
  );
}
