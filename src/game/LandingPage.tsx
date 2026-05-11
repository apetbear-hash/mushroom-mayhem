import { useState, useEffect } from 'react';
import { HowToPlayVideo } from './HowToPlayVideo';

const PALETTE = {
  ink:       '#0B0705',
  inkSoft:   '#18120D',
  paper:     '#F2EAD8',
  paperWarm: '#E8DCC0',
  amber:     '#E89A3A',
  amberDeep: '#A55818',
  rust:      '#C04A1E',
  moss:      '#5C7338',
  mossDeep:  '#2E3A1B',
  blood:     '#9E2A20',
  forest:    '#1A2014',
};

const txt = {
  serif:   { fontFamily: "'Cormorant Garamond', Georgia, serif" } as React.CSSProperties,
  sans:    { fontFamily: "'Inter', -apple-system, sans-serif" } as React.CSSProperties,
  mono:    { fontFamily: "'JetBrains Mono', monospace" } as React.CSSProperties,
  display: { fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, lineHeight: 0.95, letterSpacing: -1 } as React.CSSProperties,
  eyebrow: { fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: 3, textTransform: 'uppercase' as const },
};

function useViewport() {
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return {
    vw,
    isMobile:  vw < 720,
    isTablet:  vw >= 720 && vw < 1080,
    isDesktop: vw >= 1080,
    isNarrow:  vw < 880,
  };
}


function FeatureIllustration({ kind }: { kind: 'hex' | 'cards' }) {
  if (kind === 'hex') {
    // warm illustrated hex map — cream sky, warm habitat tiles, orange-red & white mushroom tokens
    return (
      <svg viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice"
           style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="fhx-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D8CEB0"/><stop offset="100%" stopColor="#A89860"/>
          </linearGradient>
          <radialGradient id="fhx-glow" cx="0.5" cy="0.35" r="0.65">
            <stop offset="0%" stopColor="#E8A030" stopOpacity={0.35}/><stop offset="100%" stopColor="#E8A030" stopOpacity={0}/>
          </radialGradient>
        </defs>
        <rect width="400" height="280" fill="url(#fhx-bg)"/>
        <ellipse cx="200" cy="120" rx="220" ry="130" fill="url(#fhx-glow)"/>
        {/* Ground strip */}
        <path d="M 0 230 Q 200 218 400 230 L 400 280 L 0 280 Z" fill="#8A7040"/>
        <path d="M 0 248 Q 200 238 400 248 L 400 280 L 0 280 Z" fill="#7A6030" opacity={0.7}/>
        <g transform="translate(200 138)">
          {(() => {
            const hexes: React.ReactElement[] = [];
            const r = 30, w = r * Math.sqrt(3);
            // warm habitat colors: meadow, forest, wet, shade
            const colors = ['#9AAE50','#5A7828','#3A7060','#7A6030'];
            const strokes = ['#78883A','#3A5818','#2A5050','#5A4020'];
            for (let row = -2; row <= 2; row++) {
              for (let col = -3; col <= 3; col++) {
                const x = col * w + (row % 2 ? w / 2 : 0);
                const y = row * r * 1.5;
                const idx = (row + col + 6) % colors.length;
                const pts = [0,60,120,180,240,300].map(a => {
                  const rad = (a * Math.PI) / 180;
                  return `${x + r*Math.cos(rad)},${y + r*Math.sin(rad)}`;
                }).join(' ');
                hexes.push(
                  <g key={`${row}-${col}`}>
                    <polygon points={pts} fill={colors[idx]} opacity={0.9} stroke={strokes[idx]} strokeWidth="1.5"/>
                    <polygon points={pts} fill="none" stroke="#E8D8A0" strokeWidth="0.4" opacity={0.35}/>
                  </g>
                );
              }
            }
            return hexes;
          })()}
        </g>
        {/* Mushroom tokens — orange-red, white, golden */}
        {([[145,108,'#C84820'],[234,125,'#EDE8D8'],[182,165,'#C89018'],[284,182,'#C84820'],[112,172,'#EDE8D8']] as [number,number,string][]).map(([x,y,col],i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <ellipse cx="0" cy="7" rx="10" ry="2" fill="#5A3810" opacity={0.35}/>
            <rect x="-3" y="-3" width="6" height="11" fill="#D8CEB0" rx="1"/>
            <ellipse cx="0" cy="-6" rx="12" ry="7" fill={col}/>
            <ellipse cx="-4" cy="-9" rx="3" ry="1.2" fill="#fff" opacity={0.6}/>
          </g>
        ))}
        {/* Spore particles */}
        {Array.from({ length: 16 }).map((_, i) => {
          const x = (i * 67 + 15) % 395;
          const y = ((i * 53 + 10) % 200) + 10;
          return <circle key={i} cx={x} cy={y} r={1 + (i%3)*0.6} fill="#E8A030" opacity={0.18 + (i%4)*0.09}/>;
        })}
      </svg>
    );
  }
  // cards variant — warm parchment bg, illustrated card fan
  return (
    <svg viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice"
         style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="fcd-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D0C4A0"/><stop offset="100%" stopColor="#8A7848"/>
        </linearGradient>
        <radialGradient id="fcd-glow" cx="0.5" cy="0.5" r="0.65">
          <stop offset="0%" stopColor="#E8A830" stopOpacity={0.4}/><stop offset="100%" stopColor="#E8A830" stopOpacity={0}/>
        </radialGradient>
      </defs>
      <rect width="400" height="280" fill="url(#fcd-bg)"/>
      {/* Ground */}
      <path d="M 0 230 Q 200 218 400 230 L 400 280 L 0 280 Z" fill="#7A6030"/>
      <ellipse cx="200" cy="180" rx="200" ry="90" fill="url(#fcd-glow)"/>
      {/* Small teal rock formation, like splash image */}
      <path d="M 310 230 Q 340 170 370 160 Q 395 148 400 185 Q 400 210 380 225 Z" fill="#2A5850" opacity={0.85}/>
      {([
        { rot: -18, x: 86,  y: 55,  cap: '#C84820', capScene: '#9AAE50', stem: '#D8CEB0' },
        { rot: -5,  x: 158, y: 38,  cap: '#EDE8D8', capScene: '#3A7060', stem: '#D0C898' },
        { rot: 6,   x: 228, y: 45,  cap: '#C89018', capScene: '#5A7828', stem: '#D8CEB0' },
        { rot: 19,  x: 295, y: 60,  cap: '#C84820', capScene: '#7A6030', stem: '#D0C898' },
      ]).map((c, i) => (
        <g key={i} transform={`translate(${c.x} ${c.y}) rotate(${c.rot})`}>
          {/* Card body — parchment */}
          <rect x="0" y="0" width="82" height="124" rx="5" fill="#F2EAD8" stroke="#C8A860" strokeWidth="1.2" opacity={0.97}/>
          {/* Illustrated scene area */}
          <rect x="4" y="4" width="74" height="64" rx="3" fill={c.capScene} opacity={0.8}/>
          {/* Mushroom in scene */}
          <g transform="translate(41 52)">
            <ellipse cx="0" cy="8" rx="13" ry="2" fill="#1A0A06" opacity={0.3}/>
            <rect x="-3" y="-5" width="6" height="14" fill={c.stem} rx="1"/>
            <ellipse cx="0" cy="-10" rx="18" ry="11" fill={c.cap}/>
            <ellipse cx="-5" cy="-14" rx="4" ry="1.5" fill="#fff" opacity={0.5}/>
          </g>
          {/* Card name bar */}
          <rect x="4" y="70" width="74" height="12" fill="#E8E0C8"/>
          <rect x="7" y="74" width="44" height="2.5" fill="#5A3810" opacity={0.6}/>
          {/* Card text lines */}
          <rect x="4" y="84" width="74" height="36" fill="#EDE6D4" opacity={0.8}/>
          <rect x="7" y="89" width="60" height="1.5" fill={c.cap} opacity={0.55}/>
          <rect x="7" y="95" width="64" height="1.2" fill="#7A6030" opacity={0.35}/>
          <rect x="7" y="100" width="54" height="1.2" fill="#7A6030" opacity={0.35}/>
          <rect x="7" y="105" width="38" height="1.2" fill="#7A6030" opacity={0.35}/>
          {/* Cost pip */}
          <circle cx="68" cy="73" r="5" fill={c.cap} opacity={0.9}/>
          <text x="68" y="76" textAnchor="middle" fill="#fff" fontSize="6" fontWeight="700">{i + 2}</text>
        </g>
      ))}
      {/* Spore particles */}
      {Array.from({ length: 14 }).map((_, i) => {
        const x = (i * 41 + 12) % 396;
        const y = (i * 57 + 8) % 270;
        return <circle key={i} cx={x} cy={y} r={1 + (i%3)*0.5} fill="#E8A030" opacity={0.2 + (i%3)*0.15}/>;
      })}
    </svg>
  );
}

function NewsPaintedThumb({ scheme }: { scheme: 'devlog' | 'lore' | 'community' }) {
  // All three use warm illustrated palette, each with a distinct accent
  const schemes = {
    devlog: {
      sky1: '#D4B880', sky2: '#A07830',
      ground: '#7A5020', ground2: '#5A3810',
      glow: '#E8A030', glowOp: 0.45,
      cap: '#C84820', rock: '#2A5850',
      treeCanopy: '#C89018', treeTrunk: '#5A3818',
    },
    lore: {
      sky1: '#C8C0D8', sky2: '#8878A8',
      ground: '#7A6878', ground2: '#5A4858',
      glow: '#C8A8E0', glowOp: 0.4,
      cap: '#EDE8D8', rock: '#483060',
      treeCanopy: '#B890C8', treeTrunk: '#3A2848',
    },
    community: {
      sky1: '#B8D098', sky2: '#6A9848',
      ground: '#5A8030', ground2: '#3A5820',
      glow: '#D4C840', glowOp: 0.4,
      cap: '#EDE8D8', rock: '#2A5850',
      treeCanopy: '#8AB830', treeTrunk: '#3A5820',
    },
  };
  const p = schemes[scheme];
  const id = `news-${scheme}`;
  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice"
         style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.sky1}/><stop offset="100%" stopColor={p.sky2}/>
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.45" cy="0.3" r="0.65">
          <stop offset="0%" stopColor={p.glow} stopOpacity={p.glowOp}/><stop offset="100%" stopColor={p.glow} stopOpacity={0}/>
        </radialGradient>
        <filter id={`${id}-blur`}><feGaussianBlur stdDeviation="3"/></filter>
      </defs>
      <rect width="400" height="240" fill={`url(#${id}-sky)`}/>
      <ellipse cx="180" cy="100" rx="220" ry="100" fill={`url(#${id}-glow)`}/>
      {/* Distant rock formation (teal/accent) */}
      <path d="M 240 200 Q 280 130 320 115 Q 360 100 385 145 Q 395 175 380 200 Z"
            fill={p.rock} opacity={0.85}/>
      {/* Tree trunk + canopy */}
      <path d="M 55 240 L 60 150 Q 63 142 67 150 L 72 240 Z" fill={p.treeTrunk}/>
      <path d="M 63 148 Q 30 100 20 68 Q 42 82 58 58 Q 63 45 70 58 Q 78 75 95 65 Q 80 100 72 148 Z"
            fill={p.treeCanopy} opacity={0.92}/>
      <ellipse cx="63" cy="90" rx="35" ry="22" fill={p.treeCanopy} opacity={0.45}/>
      {/* Ground */}
      <path d="M 0 200 Q 200 188 400 200 L 400 240 L 0 240 Z" fill={p.ground}/>
      <path d="M 0 215 Q 200 206 400 215 L 400 240 L 0 240 Z" fill={p.ground2} opacity={0.7}/>
      {/* Main mushroom (center-left) */}
      <g transform="translate(175 198)">
        <ellipse cx="0" cy="6" rx="42" ry="5" fill="#1A0A06" opacity={0.3}/>
        <rect x="-6" y="-50" width="12" height="56" fill="#D8CEB0" rx="2"/>
        <path d="M -55 -38 C -57 -80 -34 -98 0 -100 C 34 -98 57 -80 55 -38 C 38 -48 20 -50 0 -48 C -20 -50 -38 -48 -55 -38 Z"
              fill={p.cap}/>
        <ellipse cx="-16" cy="-72" rx="10" ry="3" fill="#fff" opacity={0.3}/>
      </g>
      {/* Small accent mushroom */}
      <g transform="translate(280 205)">
        <rect x="-4" y="-28" width="8" height="30" fill="#D0C898" rx="1.5"/>
        <path d="M -28 -22 C -29 -46 -18 -56 0 -57 C 18 -56 29 -46 27 -22 C 18 -28 10 -29 0 -28 C -10 -29 -18 -28 -28 -22 Z"
              fill="#EDE8D8"/>
      </g>
      {/* Spore particles */}
      {Array.from({ length: 16 }).map((_, i) => {
        const x = (i * 43 + 18) % 395;
        const y = ((i * 61 + 12) % 180) + 8;
        return <circle key={i} cx={x} cy={y} r={1 + (i%3)*0.45} fill={p.glow} opacity={0.18 + (i%4)*0.1}/>;
      })}
    </svg>
  );
}

function LogoMark({ size = 32, color = PALETTE.paper }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M 4 16 Q 4 4, 16 4 Q 28 4, 28 16 Q 28 18, 26 18 L 6 18 Q 4 18, 4 16 Z" fill={color}/>
      <circle cx="11" cy="10" r="1.6" fill={PALETTE.ink}/>
      <circle cx="17" cy="8" r="2" fill={PALETTE.ink}/>
      <circle cx="22" cy="11" r="1.4" fill={PALETTE.ink}/>
      <path d="M 12 18 L 12 26 Q 12 28, 14 28 L 18 28 Q 20 28, 20 26 L 20 18" fill={color}/>
    </svg>
  );
}

// ── Sections ──────────────────────────────────────────────────────────────────

function Nav({ isNarrow, menuOpen, setMenuOpen, onPlay }: {
  isNarrow: boolean; menuOpen: boolean;
  setMenuOpen: (fn: (o: boolean) => boolean) => void;
  onPlay: () => void;
}) {
  const items = ['Game', 'Rules', 'Cards', 'News', 'Lore', 'Community'];
  return (
    <nav style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
      padding: isNarrow ? '16px 20px' : '22px 36px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
    }}>
      <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none', color: PALETTE.paper }}>
        <LogoMark size={isNarrow ? 30 : 36}/>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ ...txt.serif, fontWeight: 700, fontSize: isNarrow ? 20 : 24, letterSpacing: 0.4 }}>
            Mushroom Mayhem
          </span>
          {!isNarrow && (
            <span style={{ ...txt.mono, fontSize: 9, letterSpacing: 3, opacity: 0.7, marginTop: 4, textTransform: 'uppercase' }}>
              A Painted Boardgame
            </span>
          )}
        </div>
      </a>

      {!isNarrow && (
        <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          {items.map(it => (
            <a key={it} href={`#${it.toLowerCase()}`} style={{
              ...txt.eyebrow, color: PALETTE.paper, textDecoration: 'none', opacity: 0.85,
            }}>{it}</a>
          ))}
          <button onClick={onPlay} style={{
            background: PALETTE.amber, color: PALETTE.ink,
            padding: '10px 20px', border: 'none', cursor: 'pointer',
            ...txt.serif, fontWeight: 700, fontSize: 16,
            borderRadius: 2,
            boxShadow: '0 4px 14px -2px rgba(212,160,74,0.55), inset 0 -2px 0 rgba(0,0,0,0.15)',
          }}>Play Now →</button>
        </div>
      )}

      {isNarrow && (
        <button onClick={() => setMenuOpen(o => !o)} aria-label="Menu" style={{
          background: 'rgba(14,9,7,0.65)', border: `1px solid ${PALETTE.paper}55`,
          backdropFilter: 'blur(8px)', width: 44, height: 44, borderRadius: 4,
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 5,
          cursor: 'pointer', padding: 0,
        }}>
          <span style={{ width: 20, height: 2, background: PALETTE.paper, transform: menuOpen ? 'translateY(7px) rotate(45deg)' : 'none', transition: 'transform 200ms', display: 'block' }}/>
          <span style={{ width: 20, height: 2, background: PALETTE.paper, opacity: menuOpen ? 0 : 1, transition: 'opacity 200ms', display: 'block' }}/>
          <span style={{ width: 20, height: 2, background: PALETTE.paper, transform: menuOpen ? 'translateY(-7px) rotate(-45deg)' : 'none', transition: 'transform 200ms', display: 'block' }}/>
        </button>
      )}

      {isNarrow && menuOpen && (
        <div style={{
          position: 'fixed', top: 70, right: 16, left: 16, zIndex: 60,
          background: 'rgba(14,9,7,0.95)', backdropFilter: 'blur(14px)',
          border: `1px solid ${PALETTE.paper}33`, padding: '20px 22px', borderRadius: 4,
          boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {items.map(it => (
              <a key={it} href={`#${it.toLowerCase()}`} onClick={() => setMenuOpen(() => false)} style={{
                ...txt.serif, fontSize: 22, fontWeight: 600,
                color: PALETTE.paper, textDecoration: 'none',
                padding: '12px 0', borderBottom: `1px solid ${PALETTE.paper}1a`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                {it}<span style={{ opacity: 0.4, fontSize: 16 }}>→</span>
              </a>
            ))}
            <button onClick={() => { setMenuOpen(() => false); onPlay(); }} style={{
              marginTop: 14, background: PALETTE.amber, color: PALETTE.ink,
              padding: '16px 22px', border: 'none', cursor: 'pointer',
              ...txt.serif, fontWeight: 700, fontSize: 20, textAlign: 'center', borderRadius: 2,
            }}>Play Now →</button>
          </div>
        </div>
      )}
    </nav>
  );
}

function Hero({ vp, onPlay }: { vp: ReturnType<typeof useViewport>; onPlay: () => void }) {
  const { isNarrow, isMobile } = vp;
  const titleSize = isMobile ? 56 : isNarrow ? 72 : 110;
  return (
    <header style={{
      position: 'relative', overflow: 'hidden',
      minHeight: isMobile ? 720 : 820,
      height: isMobile ? 'auto' : '100vh',
      maxHeight: isMobile ? 'none' : 920,
      color: PALETTE.paper, background: PALETTE.ink,
    }}>
      {/* Splash image backdrop */}
      <img src={`${import.meta.env.BASE_URL}splash.png`} alt="" aria-hidden="true" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        objectFit: 'cover', objectPosition: 'center top',
        display: 'block',
      }}/>
      {/* Bottom-fade keeps text legible; top keeps painting bright */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(11,7,5,0.15) 0%, rgba(11,7,5,0) 25%, rgba(11,7,5,0) 55%, rgba(11,7,5,0.6) 85%, rgba(11,7,5,0.92) 100%)',
      }}/>
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 30% 70%, rgba(11,7,5,0) 0%, rgba(11,7,5,0.35) 90%)',
      }}/>

      <div style={{
        position: 'absolute', top: isNarrow ? 90 : 140, left: 36, zIndex: 4,
        display: isNarrow ? 'none' : 'flex', alignItems: 'center', gap: 8,
        ...txt.mono, fontSize: 10, letterSpacing: 3, color: PALETTE.paper, opacity: 0.6, textTransform: 'uppercase',
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E84A2A', boxShadow: '0 0 10px #E84A2A' }}/>
        Live forage · 0:48
      </div>

      <div style={{
        position: 'absolute',
        left: isNarrow ? 20 : 48, right: isNarrow ? 20 : 48, bottom: isNarrow ? 32 : 56,
        zIndex: 5,
        display: 'flex',
        flexDirection: isNarrow ? 'column' : 'row',
        alignItems: isNarrow ? 'stretch' : 'flex-end',
        justifyContent: 'space-between',
        gap: isNarrow ? 22 : 36,
      }}>
        <div style={{ maxWidth: 720, flex: 1 }}>
          <div style={{ ...txt.eyebrow, color: PALETTE.amber, marginBottom: 14 }}>
            ◈ A painted fantasy boardgame ◈
          </div>
          <h1 style={{
            ...txt.display, fontSize: titleSize, margin: 0, color: PALETTE.paper,
            textShadow: '0 4px 24px rgba(0,0,0,0.7), 0 1px 2px rgba(0,0,0,0.9)',
          }}>
            Mushroom<br/>
            <span style={{ fontStyle: 'italic', color: PALETTE.amber }}>Mayhem.</span>
          </h1>
          {!isMobile && (
            <p style={{
              ...txt.serif, fontStyle: 'italic', fontSize: 22, marginTop: 18,
              maxWidth: 520, lineHeight: 1.4,
              color: 'rgba(242,234,216,0.85)',
              textShadow: '0 2px 10px rgba(0,0,0,0.7)',
            }}>
              Place spores, claim biomes, outwit rivals. A hex-grid card game from the underbrush.
            </p>
          )}
        </div>

        <div style={{
          background: 'rgba(14,9,7,0.75)', backdropFilter: 'blur(14px)',
          border: `1px solid ${PALETTE.amber}55`,
          padding: isNarrow ? 18 : 22,
          width: isNarrow ? 'auto' : 360, flexShrink: 0,
          boxShadow: '0 24px 48px rgba(0,0,0,0.6)', borderRadius: 4,
        }}>
          <div style={{ ...txt.eyebrow, color: PALETTE.amber, opacity: 0.85, marginBottom: 14 }}>┌─ Begin</div>
          <button onClick={onPlay} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            background: PALETTE.amber, color: PALETTE.ink, padding: '16px 20px',
            border: 'none', cursor: 'pointer', width: '100%', marginBottom: 10,
            boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.18), 0 4px 14px -2px rgba(212,160,74,0.45)',
            transition: 'transform 160ms',
          }}
            onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseOut={e => (e.currentTarget.style.transform = 'translateY(0)')}>
            <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
              <div style={{ ...txt.serif, fontSize: 22, fontWeight: 700, lineHeight: 1.1 }}>Play the Game</div>
              <div style={{ ...txt.mono, fontSize: 9, letterSpacing: 1.8, opacity: 0.7, marginTop: 4, textTransform: 'uppercase' }}>Free · Browser</div>
            </div>
            <span style={{ fontSize: 22, flexShrink: 0 }}>→</span>
          </button>
          <a href="#how-to-play" style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px',
            border: `1px solid ${PALETTE.paper}33`, color: PALETTE.paper, textDecoration: 'none',
            background: 'rgba(242,234,216,0.04)', transition: 'background 160ms',
          }}
            onMouseOver={e => (e.currentTarget.style.background = 'rgba(242,234,216,0.1)')}
            onMouseOut={e => (e.currentTarget.style.background = 'rgba(242,234,216,0.04)')}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', border: `1.5px solid ${PALETTE.paper}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <div style={{ width: 0, height: 0, borderLeft: `10px solid ${PALETTE.paper}`, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', marginLeft: 3 }}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...txt.serif, fontSize: 16, fontWeight: 600, lineHeight: 1.15 }}>How to Play</div>
              <div style={{ ...txt.mono, fontSize: 8.5, letterSpacing: 1.6, opacity: 0.6, marginTop: 3, textTransform: 'uppercase' }}>2:00 · Interactive</div>
            </div>
          </a>
        </div>
      </div>
    </header>
  );
}

function VideoSection({ vp }: { vp: ReturnType<typeof useViewport> }) {
  const { isNarrow } = vp;
  return (
    <section id="how-to-play" style={{ background: '#0a0a0a', borderTop: `1px solid ${PALETTE.amber}22` }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: isNarrow ? '48px 20px 56px' : '64px 56px 72px' }}>
        <div style={{ ...txt.eyebrow, color: PALETTE.amber, marginBottom: 12 }}>◈ How to Play</div>
        <h2 style={{ ...txt.display, fontSize: isNarrow ? 34 : 52, margin: '0 0 28px', color: PALETTE.paper }}>
          Learn in two minutes.
        </h2>
        {/* 16:9 letterbox container — Stage fills it via position:absolute,inset:0 */}
        <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 8, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
          <div style={{ position: 'absolute', inset: 0 }}>
            <HowToPlayVideo />
          </div>
        </div>
        <p style={{ ...txt.serif, fontStyle: 'italic', fontSize: isNarrow ? 14 : 16, color: 'rgba(242,234,216,0.45)', marginTop: 16, textAlign: 'center' }}>
          Space to pause · ← → to scrub · Click the timeline to seek
        </p>
      </div>
    </section>
  );
}

function Features({ vp }: { vp: ReturnType<typeof useViewport> }) {
  const { isNarrow } = vp;
  const features = [
    {
      eyebrow: '✦ Mechanic · 01',
      title: 'Spore-fueled hex strategy.',
      body: 'Six biomes, sixty cards, infinite combinations. Every turn you\'ll choose between feeding the colony, sabotaging your rival, or risking it all on a season change.',
      bullet: '60+ cards · 6 biomes · 1–4 players',
      kind: 'hex' as const,
    },
    {
      eyebrow: '✦ Art · 02',
      title: 'Hand-painted, fully alive.',
      body: 'Every species is a tiny oil painting. Caps gleam under canopy light; gills curl in shadow; spores drift across illuminated borders. Made to be lingered over.',
      bullet: 'Painted card art · animated reveals',
      kind: 'cards' as const,
    },
  ];
  return (
    <section style={{
      background: PALETTE.paper, color: PALETTE.ink,
      padding: isNarrow ? '72px 20px' : '120px 56px', position: 'relative',
    }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ ...txt.eyebrow, color: PALETTE.amberDeep, marginBottom: 12 }}>§ 01 — The Forest, but tactical</div>
        <h2 style={{ ...txt.display, fontSize: isNarrow ? 38 : 64, margin: 0, maxWidth: 900 }}>
          Two things make Mayhem tick:<br/>
          <span style={{ fontStyle: 'italic', color: PALETTE.mossDeep }}>strategy & paint.</span>
        </h2>
        <div style={{
          marginTop: isNarrow ? 40 : 64,
          display: 'grid',
          gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr',
          gap: isNarrow ? 24 : 32,
        }}>
          {features.map((f, i) => (
            <article key={i} style={{
              background: PALETTE.paperWarm, border: `1px solid ${PALETTE.ink}1a`,
              boxShadow: '0 24px 48px -16px rgba(14,9,7,0.18), 0 4px 8px rgba(14,9,7,0.06)',
              borderRadius: 4, overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ position: 'relative', aspectRatio: '10 / 7', overflow: 'hidden', background: PALETTE.forest }}>
                <FeatureIllustration kind={f.kind}/>
              </div>
              <div style={{ padding: isNarrow ? 22 : 32 }}>
                <div style={{ ...txt.eyebrow, color: PALETTE.amberDeep, fontSize: 10 }}>{f.eyebrow}</div>
                <h3 style={{ ...txt.display, fontSize: isNarrow ? 28 : 36, margin: '10px 0 14px', color: PALETTE.ink }}>{f.title}</h3>
                <p style={{ ...txt.serif, fontStyle: 'italic', fontSize: 18, lineHeight: 1.5, color: PALETTE.inkSoft, margin: 0, opacity: 0.85 }}>{f.body}</p>
                <div style={{
                  marginTop: 24, paddingTop: 18, borderTop: `1px solid ${PALETTE.ink}22`,
                  ...txt.mono, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: PALETTE.mossDeep,
                }}>{f.bullet}</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowToPlay({ vp }: { vp: ReturnType<typeof useViewport> }) {
  const { isNarrow, isMobile } = vp;

  const steps = [
    {
      num: '01',
      title: 'Behold! Your colony awakens.',
      body: 'Three tiles. Five cards. A handful of spores and a dream. Discard any cards you do not fancy and watch each one transform into a free spore right before your eyes. The forest is generous to those bold enough to begin!',
    },
    {
      num: '02',
      title: 'Choose your act for the evening.',
      body: 'Ladies and gentlefolk, you may do exactly one spectacular thing this turn. Sprawl your network into new territory! Conjure a mushroom onto the board! Rummage through the deck for hidden wonders! Or simply rest and let the forest refill your pouches.',
    },
    {
      num: '03',
      title: 'Now witness the harvest!',
      body: 'Every mushroom you have ever planted will now perform on cue. Spores appear! Moisture drips! Sunlight pours in! No instruction needed. Your fungi know their role and they play it magnificently, turn after turn.',
    },
    {
      num: '04',
      title: 'The seasons are alive!',
      body: 'Spring! Summer! Autumn! Winter! Five turns apiece, with one extraordinary effect revealed for each before the curtain even rises. Will you face a scorching drought? A mushroom festival? A creeping frost? You shall know from the very start. The question is: will you be brilliant about it?',
    },
    {
      num: '05',
      title: 'Take your bow. Count your glory.',
      body: 'Points shower down the instant you plant. Ongoing mushrooms keep performing their little trick each and every turn. After twenty glorious turns the player with the most symbiosis points wins. May the most magnificent mycelium prevail!',
    },
  ];

  const resources = [
    { icon: '🍄', name: 'Spore',    color: '#8B6F47', desc: 'Plant mushrooms' },
    { icon: '💧', name: 'Moisture', color: '#3A6EA8', desc: 'Grow your network' },
    { icon: '☀️', name: 'Sunlight', color: '#D4A843', desc: 'Draw new cards' },
  ];

  const habitats = [
    { name: 'Tree',  color: '#2A7A18', bg: '#2A7A1822', note: 'The neighbourhood everybody wants! Broad, welcoming, and absolutely teeming with possibility.' },
    { name: 'Decay', color: '#7A5018', bg: '#7A501822', note: 'Rotten logs! Crumbling bark! Ugly? Perhaps. Extraordinarily productive? Oh, most certainly.' },
    { name: 'Shade', color: '#6018A8', bg: '#6018A822', note: 'Cool, dim, and wonderfully mysterious. One extra drop of moisture to enter. Worth every drip, we assure you.' },
    { name: 'Wet',   color: '#1A50C0', bg: '#1A50C022', note: 'Soggy, rare, and quietly spectacular. Home to creatures that thrive absolutely nowhere else on the board.' },
    { name: 'Open',  color: '#C8A010', bg: '#C8A01022', note: 'Sun-kissed clearings where any mushroom is welcome! Do note the sky above has opinions about what happens here.' },
  ];

  const actions = [
    { name: 'Spread', cost: 'Moisture (grows costlier as your network does)',  icon: '🕸️' },
    { name: 'Plant',  cost: 'Spores (whatever the card asks for)',             icon: '🍄' },
    { name: 'Draw',   cost: '1 Sunlight per card',                             icon: '☀️' },
    { name: 'Rest',   cost: 'Absolutely free! Gain 1 of each resource',        icon: '💤' },
  ];

  return (
    <section id="game" style={{
      background: PALETTE.ink, color: PALETTE.paper,
      padding: isNarrow ? '72px 20px' : '120px 56px',
      borderTop: `1px solid ${PALETTE.amber}22`,
    }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ ...txt.eyebrow, color: PALETTE.amber, marginBottom: 12 }}>§ 02 — Rules of the Underbrush</div>
        <h2 style={{ ...txt.display, fontSize: isNarrow ? 38 : 64, margin: '0 0 16px', color: PALETTE.paper }}>
          Step right up.<br/>
          <span style={{ fontStyle: 'italic', color: PALETTE.amber }}>The forest awaits.</span>
        </h2>
        <p style={{ ...txt.serif, fontStyle: 'italic', fontSize: isNarrow ? 16 : 20, maxWidth: 640, lineHeight: 1.6, color: 'rgba(242,234,216,0.7)', margin: 0 }}>
          Four seasons. Twenty turns. Two steps each. One shared forest and it belongs to whoever grows the most magnificent colony. Allow us to explain.
        </p>

        {/* Steps */}
        <div style={{
          marginTop: isNarrow ? 48 : 72,
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isNarrow ? '1fr 1fr' : 'repeat(5, 1fr)',
          gap: isNarrow ? 16 : 20,
        }}>
          {steps.map(s => (
            <div key={s.num} style={{
              background: 'rgba(242,234,216,0.05)',
              border: `1px solid ${PALETTE.paper}18`,
              borderTop: `2px solid ${PALETTE.amber}`,
              padding: isNarrow ? 18 : 24,
              borderRadius: 4,
            }}>
              <div style={{ ...txt.mono, fontSize: 10, letterSpacing: 3, color: PALETTE.amber, opacity: 0.85, marginBottom: 12 }}>
                Step {s.num}
              </div>
              <div style={{ ...txt.serif, fontWeight: 700, fontSize: isNarrow ? 18 : 20, color: PALETTE.paper, lineHeight: 1.2, marginBottom: 10 }}>
                {s.title}
              </div>
              <p style={{ ...txt.serif, fontStyle: 'italic', fontSize: 16, lineHeight: 1.55, color: 'rgba(242,234,216,0.65)', margin: 0 }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>

        {/* Two-column reference */}
        <div style={{
          marginTop: isNarrow ? 48 : 72,
          display: 'grid',
          gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr',
          gap: isNarrow ? 24 : 40,
        }}>

          {/* Actions */}
          <div>
            <div style={{ ...txt.eyebrow, color: PALETTE.paper, opacity: 0.5, marginBottom: 20 }}>◈ Actions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {actions.map(a => (
                <div key={a.name} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 16px',
                  background: 'rgba(242,234,216,0.04)',
                  border: `1px solid ${PALETTE.paper}14`,
                  borderRadius: 3,
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{a.icon}</span>
                  <div>
                    <div style={{ ...txt.serif, fontWeight: 700, fontSize: 15, color: PALETTE.paper }}>{a.name}</div>
                    <div style={{ ...txt.mono, fontSize: 10, letterSpacing: 1.5, color: PALETTE.amber, opacity: 0.8, marginTop: 2 }}>{a.cost}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 14, padding: '14px 16px',
              background: 'rgba(232,154,58,0.08)', border: `1px solid ${PALETTE.amber}33`, borderRadius: 3,
              ...txt.serif, fontStyle: 'italic', fontSize: 13, lineHeight: 1.5, color: 'rgba(242,234,216,0.6)',
            }}>
              Commit to one action type and perform it as many glorious times as your resources permit. A jack of all trades, dear friend, feeds absolutely nobody.
            </div>
          </div>

          {/* Habitats + Resources */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            <div>
              <div style={{ ...txt.eyebrow, color: PALETTE.paper, opacity: 0.5, marginBottom: 20 }}>◈ Habitats</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {habitats.map(h => (
                  <div key={h.name} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px',
                    background: h.bg,
                    border: `1px solid ${h.color}44`,
                    borderLeft: `3px solid ${h.color}`,
                    borderRadius: 3,
                  }}>
                    <div style={{
                      ...txt.mono, fontWeight: 600, fontSize: 11, letterSpacing: 1.5, color: h.color,
                      minWidth: 44, textTransform: 'uppercase',
                    }}>{h.name}</div>
                    <div style={{ ...txt.serif, fontSize: 13, color: 'rgba(242,234,216,0.65)', fontStyle: 'italic' }}>{h.note}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ ...txt.eyebrow, color: PALETTE.paper, opacity: 0.5, marginBottom: 16 }}>◈ Resources</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {resources.map(r => (
                  <div key={r.name} style={{
                    flex: 1, padding: '14px 12px', textAlign: 'center',
                    background: `${r.color}18`, border: `1px solid ${r.color}44`, borderRadius: 3,
                  }}>
                    <div style={{ fontSize: 22 }}>{r.icon}</div>
                    <div style={{ ...txt.serif, fontWeight: 700, fontSize: 13, color: PALETTE.paper, marginTop: 6 }}>{r.name}</div>
                    <div style={{ ...txt.mono, fontSize: 9, letterSpacing: 1.5, color: r.color, marginTop: 4, textTransform: 'uppercase' }}>{r.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Season timeline */}
        <div style={{ marginTop: isNarrow ? 48 : 64 }}>
          <div style={{ ...txt.eyebrow, color: PALETTE.paper, opacity: 0.5, marginBottom: 20 }}>◈ The Year — one wild effect per season</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isNarrow ? '1fr 1fr' : 'repeat(4, 1fr)',
            gap: 12,
          }}>
            {([
              { name: 'Spring', turns: '1–5',   color: '#7AB828', bg: '#7AB82812', icon: '🌸', note: 'The ground stirs! The spores wake up! Anything is possible. Thaw · Spring Rain · Creeping Mist · Germination Gamble · Sluggish Soil' },
              { name: 'Summer', turns: '6–10',  color: '#E8A030', bg: '#E8A03012', icon: '☀️', note: 'Hot! Glorious! Possibly catastrophic! The stage is all yours. Long Days · Abundant Canopy · Drought · Scorching Heat · Mild Summer' },
              { name: 'Autumn', turns: '11–15', color: '#C84820', bg: '#C8482012', icon: '🍂', note: 'Festival season and blight season rolled into one spectacular act. Mushroom Festival · Spore Wind · Blight · Long Summer · Decay Bloom' },
              { name: 'Winter', turns: '16–20', color: '#6898C8', bg: '#6898C812', icon: '❄️', note: 'Hush now. The finale approaches. The most patient colony always blooms last. Deep Freeze · Mycelium Harmony · Mild Winter · Winter Stores · Final Harvest' },
            ] as { name: string; turns: string; color: string; bg: string; icon: string; note: string }[]).map(s => (
              <div key={s.name} style={{
                padding: '18px 18px 16px',
                background: s.bg,
                border: `1px solid ${s.color}44`,
                borderTop: `3px solid ${s.color}`,
                borderRadius: 3,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ ...txt.serif, fontWeight: 700, fontSize: 17, color: s.color }}>{s.icon} {s.name}</span>
                  <span style={{ ...txt.mono, fontSize: 10, letterSpacing: 2, color: PALETTE.paper, opacity: 0.5 }}>T{s.turns}</span>
                </div>
                <p style={{ ...txt.serif, fontSize: 12, fontStyle: 'italic', lineHeight: 1.5, color: 'rgba(242,234,216,0.5)', margin: 0 }}>
                  {s.note}
                </p>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 14, padding: '12px 16px',
            background: 'rgba(242,234,216,0.04)', border: `1px solid ${PALETTE.paper}14`, borderRadius: 3,
            ...txt.serif, fontStyle: 'italic', fontSize: 13, color: 'rgba(242,234,216,0.5)', lineHeight: 1.5,
          }}>
            All four season effects are revealed before anyone takes a single turn. That is not luck, dear audience. That is a puzzle. A delightful, spore-dusted, utterly magnificent puzzle.
          </div>
        </div>

      </div>
    </section>
  );
}

function Rulebook({ vp }: { vp: ReturnType<typeof useViewport> }) {
  const { isNarrow } = vp;

  const badgeBase: React.CSSProperties = {
    display: 'inline-block', padding: '3px 8px', borderRadius: 3,
    fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase',
  };
  const badges: Record<string, React.CSSProperties> = {
    positive: { ...badgeBase, background: 'rgba(92,115,56,0.15)', color: '#2E3A1B' },
    negative: { ...badgeBase, background: 'rgba(158,42,32,0.15)', color: '#4A0E0A' },
    risk:     { ...badgeBase, background: 'rgba(232,154,58,0.15)', color: '#A55818' },
    neutral:  { ...badgeBase, background: 'rgba(24,18,13,0.08)',   color: '#18120D' },
    mirror:   { ...badgeBase, background: 'rgba(154,127,184,0.15)',color: '#5A3A60' },
  };

  const cardStyle: React.CSSProperties = {
    background: '#fff', border: '1px solid rgba(24,18,13,0.1)',
    borderRadius: 8, padding: 28, marginBottom: 24,
    boxShadow: '0 8px 24px -8px rgba(14,9,7,0.12)',
  };
  const calloutStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, rgba(92,115,56,0.04), rgba(232,154,58,0.04))',
    borderLeft: '4px solid #5C7338', padding: 24, margin: '28px 0', borderRadius: '0 6px 6px 0',
  };
  const secNum: React.CSSProperties = { ...txt.mono, fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: PALETTE.amberDeep, marginBottom: 10, fontWeight: 600 };
  const secTitle: React.CSSProperties = { ...txt.serif, fontSize: 36, fontWeight: 700, letterSpacing: -0.5, marginBottom: 8, color: PALETTE.inkSoft };
  const secIntro: React.CSSProperties = { ...txt.serif, fontSize: 17, fontStyle: 'italic', color: 'rgba(24,18,13,0.78)', marginBottom: 28, paddingLeft: 20, borderLeft: `3px solid ${PALETTE.amber}`, lineHeight: 1.6 };
  const cardTitle: React.CSSProperties = { ...txt.serif, fontSize: 21, fontWeight: 600, marginBottom: 16, color: PALETTE.inkSoft };
  const calloutTitle: React.CSSProperties = { ...txt.mono, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.5, color: PALETTE.mossDeep, marginBottom: 10 };
  const costPill: React.CSSProperties = { ...txt.mono, display: 'inline-block', background: PALETTE.moss, color: PALETTE.paper, padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, marginLeft: 8 };
  const sec: React.CSSProperties = { marginBottom: 60 };

  const setupSteps: { n: string; title: string; desc: React.ReactNode }[] = [
    { n: '1', title: 'Build the Board', desc: <>Randomly draw and arrange hex tiles: <strong>2p = 24 tiles</strong>, <strong>3p = 30</strong>, <strong>4p = 35</strong>. Create a connected landscape—no isolated tiles.</> },
    { n: '2', title: 'Draw Season Effects', desc: <>Shuffle each season's effect deck separately. Draw 1 effect per season and place them face-up. This is the <strong>forecast</strong>—all players know what's coming all year.</> },
    { n: '3', title: 'Determine Turn Order', desc: <>Each player draws 1 card. The player with the <strong>highest symbiosis point value</strong> goes first. Tiebreaker: highest spore cost. Shuffle all cards back.</> },
    { n: '4', title: 'Claim Starting Networks', desc: <>Each player spawns at a corner tile. Starting network = <strong>spawn tile + 2 adjacent tiles</strong>. Mark with your network tokens.</> },
    { n: '5', title: 'Draft Starting Hands', desc: <>Deal 5 cards to each player. Keep as many as you like (minimum 1). For each card discarded, gain <strong>1 spore</strong>.</> },
    { n: '6', title: 'Starting Resources', desc: <>Each player begins with <strong>1 spore, 1 moisture, and 1 sunlight</strong>, plus any spores gained from the draft. Spring begins!</> },
  ];

  const seasons = [
    { name: 'Spring', turns: 'Turns 1–5', effects: [
      { name: 'Thaw',                badge: 'positive', desc: 'All spread costs reduced by 1 (minimum 1).' },
      { name: 'Spring Rain',         badge: 'positive', desc: 'All players gain 3 moisture at the start of the season.' },
      { name: 'Germination Gamble',  badge: 'risk',     desc: 'At the start of each turn this season, the active player may discard any number of cards and draw that many replacements before taking actions.' },
      { name: 'Creeping Mist',       badge: 'risk',     desc: 'Shade and Wet tiles cost 1 less to spread into (minimum 1). But all mushrooms on Shade and Wet tiles produce no resources this season.' },
      { name: 'Sluggish Soil',       badge: 'negative', desc: 'All mushrooms produce 1 fewer resource of each type this season (minimum 1). Symbiosis points are unaffected.' },
    ]},
    { name: 'Summer', turns: 'Turns 6–10', effects: [
      { name: 'Long Days',       badge: 'positive', desc: 'All mushrooms produce +1 bonus spore on each harvest.' },
      { name: 'Abundant Canopy',badge: 'positive', desc: 'Each turn this season, Shade-habitat mushrooms score +1 bonus symbiosis point per turn.' },
      { name: 'Drought',        badge: 'negative', desc: "All players' moisture drops to 0 at start of season. No moisture can be gained from any source this season." },
      { name: 'Scorching Heat', badge: 'negative', desc: 'Spreading costs +1 extra for all tile types. Open-habitat mushrooms produce no symbiosis points (still produce resources).' },
      { name: 'Mild Summer',    badge: 'neutral',  desc: 'No seasonal effect.' },
    ]},
    { name: 'Autumn', turns: 'Turns 11–15', effects: [
      { name: 'Mushroom Festival', badge: 'positive', desc: 'At season end, each player scores +1 per mushroom on the board.' },
      { name: 'Spore Wind',        badge: 'positive', desc: 'Start of season: all players gain 4 spores. Each network expands 1 tile for free.' },
      { name: 'Decay Bloom',       badge: 'risk',     desc: 'Decay mushrooms produce +2. But decay mushrooms score 0 this season.' },
      { name: 'Blight',            badge: 'negative', desc: '3–5 random unoccupied tiles become permanently blighted (unusable).' },
      { name: 'Long Summer',       badge: 'mirror',   desc: "Summer's effect applies again for all autumn turns." },
    ]},
    { name: 'Winter', turns: 'Turns 16–20', effects: [
      { name: 'Deep Freeze',       badge: 'negative', desc: 'No spreading allowed for the entire season. All spread-related mushroom effects are also disabled.' },
      { name: 'Mycelium Harmony',  badge: 'positive', desc: 'Each turn, players score symbiosis equal to the length of their single longest connected chain of identical mushroom types.' },
      { name: 'Mild Winter',       badge: 'neutral',  desc: 'No seasonal effect. The final 5 turns play as normal.' },
      { name: 'Winter Stores',     badge: 'positive', desc: 'At the start of the season, all players gain +2 of each resource (spores, moisture, sunlight).' },
      { name: 'Final Harvest',     badge: 'risk',     desc: 'Mushrooms score but produce no resources this season. At end of final turn, score +1 symbiosis for every 3 unspent resources (any type combined).' },
    ]},
  ];

  const tableRow = (cols: [string, string, string], isHeader?: boolean, lastRow?: boolean) => (
    <div style={{
      display: 'grid', gridTemplateColumns: '2fr 3fr 1fr', gap: 14,
      padding: '14px 22px',
      borderBottom: lastRow ? 'none' : '1px solid rgba(24,18,13,0.05)',
      background: isHeader ? 'linear-gradient(135deg, #5C7338, #2E3A1B)' : undefined,
      color: isHeader ? PALETTE.paper : undefined,
    }}>
      <div style={isHeader ? { fontWeight: 600, fontSize: 12, letterSpacing: 1, textTransform: 'uppercase' } : { ...txt.sans, fontWeight: 600, color: PALETTE.inkSoft }}>{cols[0]}</div>
      <div style={isHeader ? { fontSize: 12 } : { ...txt.sans, fontSize: 13, color: 'rgba(24,18,13,0.75)' }}>{cols[1]}</div>
      <div style={isHeader ? { fontSize: 12, textAlign: 'right' } : { ...txt.sans, textAlign: 'right', fontWeight: 700, color: PALETTE.amberDeep }}>{cols[2]}</div>
    </div>
  );

  return (
    <section id="rules" style={{
      background: PALETTE.paper, color: PALETTE.inkSoft,
      padding: isNarrow ? '72px 20px' : '100px 56px',
      borderTop: `1px solid ${PALETTE.ink}1a`,
    }}>
      <div style={{ maxWidth: 920, margin: '0 auto' }}>

        {/* Rulebook header */}
        <header style={{ textAlign: 'center', marginBottom: 64, paddingBottom: 48, borderBottom: '2px solid rgba(24,18,13,0.15)' }}>
          <div style={{ ...txt.mono, fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase', color: PALETTE.amberDeep, marginBottom: 16, fontWeight: 600 }}>Official Rulebook</div>
          <h2 style={{
            ...txt.serif, fontSize: isNarrow ? 48 : 72, fontWeight: 700, letterSpacing: -1.5, marginBottom: 20, margin: '0 0 20px',
            background: `linear-gradient(135deg, ${PALETTE.inkSoft} 0%, ${PALETTE.moss} 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Mycelium</h2>
          <p style={{ ...txt.serif, fontSize: isNarrow ? 16 : 19, fontStyle: 'italic', color: 'rgba(24,18,13,0.55)', maxWidth: 560, margin: '0 auto' }}>
            A strategic game of fungal supremacy, seasonal turmoil, and the hidden war beneath the forest floor.
          </p>
        </header>

        {/* § 01 Introduction */}
        <div style={sec}>
          <div style={secNum}>§ 01 — Introduction</div>
          <h3 style={secTitle}>Welcome to the Network</h3>
          <p style={secIntro}>Beneath the autumn canopy, an ancient competition unfolds. You are mycelium—the vast, unseen intelligence of the forest floor—and your goal is simple: spread your network, cultivate your mushrooms, and claim dominion over the woodland.</p>
          <div style={cardStyle}>
            <div style={cardTitle}>Game Overview</div>
            <p style={{ ...txt.sans, fontSize: 15, lineHeight: 1.7, marginBottom: 10 }}><strong>Players:</strong> 2–4 mycelia (each controlling one fungal network)</p>
            <p style={{ ...txt.sans, fontSize: 15, lineHeight: 1.7, marginBottom: 10 }}><strong>Duration:</strong> 20 turns across 4 seasons (approximately 60–90 minutes)</p>
            <p style={{ ...txt.sans, fontSize: 15, lineHeight: 1.7, margin: 0 }}><strong>Objective:</strong> Score the most <strong>symbiosis points</strong> by planting mushrooms on compatible habitat tiles, managing resources wisely, and adapting to the whims of nature. Highest score at the end of Winter wins.</p>
          </div>
          <div style={calloutStyle}>
            <div style={calloutTitle}>The Heart of the Game</div>
            <p style={{ ...txt.sans, fontSize: 15, color: PALETTE.inkSoft, margin: 0, lineHeight: 1.65 }}>
              Mycelium is a game about <strong>patience, timing, and opportunism</strong>. The forest rewards those who read the seasonal winds, claim the right territories, and play their mushrooms when the moment is ripe. Your invisible mycelium network spreads tile by tile—once claimed, a tile is yours alone. Every card has a cost. Every tile has a story. Every season changes everything.
            </p>
          </div>
        </div>

        {/* § 02 Components */}
        <div style={sec}>
          <div style={secNum}>§ 02 — Components</div>
          <h3 style={secTitle}>What's in the Box</h3>
          <div style={cardStyle}>
            <ul style={{ ...txt.sans, lineHeight: 2, fontSize: 15, margin: 0, paddingLeft: 22 }}>
              <li><strong>50 Mushroom Cards</strong> — Each depicts a unique species with abilities, habitats, costs, and symbiosis point values</li>
              <li><strong>35 Hex Tiles</strong> — Tree groves, decay piles, shaded hollows, wet bogs, and open clearings (24–35 tiles used depending on player count)</li>
              <li><strong>4 Player Mats</strong> — Track your resources (spores, moisture, sunlight) and display your hand</li>
              <li><strong>Resource Tokens</strong> — Wooden tokens for spores, moisture, and sunlight</li>
              <li><strong>Season Tracker</strong> — A reference card showing the current season and its active effect (the full forecast is visible from game start)</li>
              <li><strong>Network Tokens</strong> — Player-colored markers to claim tiles as part of your mycelium network</li>
              <li><strong>Mushroom Tokens</strong> — Player-colored markers to place on tiles when you plant a mushroom</li>
            </ul>
          </div>
          <div style={{ display: 'flex', gap: 16, margin: '20px 0', flexWrap: 'wrap' }}>
            {[{ icon: '🍄', name: 'Spores', bg: '#8B6F47' }, { icon: '💧', name: 'Moisture', bg: '#3A6EA8' }, { icon: '☀️', name: 'Sunlight', bg: '#D4A843' }].map(r => (
              <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', padding: '13px 18px', borderRadius: 6, border: '1px solid rgba(24,18,13,0.1)' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>{r.icon}</div>
                <span style={{ ...txt.sans, fontSize: 15, fontWeight: 600, color: PALETTE.inkSoft }}>{r.name}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12, margin: '20px 0' }}>
            {[
              { icon: '🌲', name: 'Tree',  bg: '#4A6741', fg: PALETTE.paper },
              { icon: '🍂', name: 'Decay', bg: '#9E5A40', fg: PALETTE.paper },
              { icon: '🌑', name: 'Shade', bg: '#6B4E8B', fg: PALETTE.paper },
              { icon: '💧', name: 'Wet',   bg: '#2D7D7B', fg: PALETTE.paper },
              { icon: '☀️', name: 'Open',  bg: '#D4A843', fg: PALETTE.inkSoft },
            ].map(h => (
              <div key={h.name} style={{ background: '#fff', border: '1px solid rgba(24,18,13,0.1)', padding: '14px 10px', borderRadius: 6, textAlign: 'center' }}>
                <div style={{ width: 42, height: 42, margin: '0 auto 10px', borderRadius: '50%', background: h.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: h.fg }}>{h.icon}</div>
                <div style={{ ...txt.sans, fontSize: 13, fontWeight: 600, color: PALETTE.inkSoft }}>{h.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* § 03 Setup */}
        <div style={sec}>
          <div style={secNum}>§ 03 — Setup</div>
          <h3 style={secTitle}>Preparing the Forest</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, margin: '28px 0' }}>
            {setupSteps.map(s => (
              <div key={s.n} style={{ background: '#fff', border: '1px solid rgba(24,18,13,0.1)', padding: 22, borderRadius: 8, boxShadow: '0 4px 16px -6px rgba(14,9,7,0.1)' }}>
                <div style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #E89A3A, #C04A1E)', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, marginBottom: 14 }}>{s.n}</div>
                <div style={{ ...txt.sans, fontSize: 16, fontWeight: 600, marginBottom: 9, color: PALETTE.inkSoft }}>{s.title}</div>
                <div style={{ ...txt.sans, fontSize: 13, color: 'rgba(24,18,13,0.78)', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* § 04 Turn Structure */}
        <div style={sec}>
          <div style={secNum}>§ 04 — Turn Structure</div>
          <h3 style={secTitle}>How to Play</h3>
          <p style={secIntro}>The game unfolds over 20 turns (5 per season). Each turn, the active player takes actions, then the Collect phase triggers for all players.</p>
          <div style={{ display: 'flex', gap: 16, margin: '24px 0', flexWrap: 'wrap' }}>
            {[
              { n: 'Step 1', title: 'Choose Action Type', desc: 'Pick one action type and repeat it as many times as you can afford' },
              { n: 'Step 2', title: 'Collect', desc: 'All players harvest resources from their mushrooms' },
            ].map(s => (
              <div key={s.n} style={{ flex: 1, minWidth: 190, background: 'linear-gradient(135deg, #5C7338 0%, #2E3A1B 100%)', color: PALETTE.paper, padding: 22, borderRadius: 8, boxShadow: '0 8px 16px -6px rgba(14,9,7,0.25)' }}>
                <div style={{ ...txt.mono, fontSize: 11, letterSpacing: 2, opacity: 0.7, marginBottom: 8, textTransform: 'uppercase' }}>{s.n}</div>
                <div style={{ ...txt.serif, fontSize: 19, fontWeight: 600, marginBottom: 7 }}>{s.title}</div>
                <div style={{ ...txt.sans, fontSize: 13, opacity: 0.9, lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
          <div style={calloutStyle}>
            <div style={calloutTitle}>Important Rule</div>
            <p style={{ ...txt.sans, fontSize: 15, color: PALETTE.inkSoft, margin: 0, lineHeight: 1.65 }}>
              On your turn, choose <strong>one action type</strong> and repeat it as many times as you can afford. You <strong>cannot mix</strong> action types in a single turn. Choose wisely!
            </p>
          </div>
          <h4 style={{ ...txt.serif, fontSize: 24, fontWeight: 600, margin: '36px 0 18px', color: PALETTE.inkSoft }}>Available Actions</h4>
          <div style={{ display: 'grid', gap: 12, margin: '18px 0' }}>
            {[
              { name: '🎴 Draw',   cost: 'sunlight (scaling)', desc: 'Draw mushroom cards into your hand. Cost scales per card drawn this turn: 1st = 1 sunlight, 2nd = 2, 3rd = 3, etc. Can repeat multiple times.' },
              { name: '🔀 Spread', cost: 'moisture (scaling)', desc: 'Expand your network to adjacent unoccupied tiles. Cost depends on current network size (1–5 tiles = 1, 6–7 = 2, 8–9 = 3, 10–11 = 4, 12+ = 5). Wet and Shade tiles cost +1 extra moisture.' },
              { name: '🌱 Plant',  cost: 'spores (per card)',  desc: "Play mushroom cards from your hand onto tiles in your network. The tile must match at least one of the card's required habitats OR be an Open tile. Pay the card's spore cost. Symbiosis points score immediately." },
              { name: '💤 Rest',   cost: 'free (once only)',   desc: 'Gain 1 moisture + 1 spore + 1 sunlight. Cannot be repeated—this ends your turn immediately.' },
            ].map(a => (
              <div key={a.name} style={{ background: '#fff', border: '1px solid rgba(24,18,13,0.1)', borderLeft: `4px solid ${PALETTE.amber}`, padding: 18, borderRadius: 4 }}>
                <div style={{ ...txt.serif, fontSize: 17, fontWeight: 600, color: PALETTE.inkSoft, marginBottom: 7 }}>
                  {a.name}<span style={costPill}>{a.cost}</span>
                </div>
                <p style={{ ...txt.sans, fontSize: 14, color: 'rgba(24,18,13,0.78)', lineHeight: 1.6, margin: 0 }}>{a.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ ...cardStyle, marginTop: 32 }}>
            <div style={cardTitle}>Action Cost Scaling</div>
            <div style={{ ...txt.sans, fontSize: 16, fontWeight: 600, margin: '18px 0 9px', color: PALETTE.inkSoft }}>Draw Cost Scaling</div>
            <div style={{ background: '#fff', border: '1px solid rgba(24,18,13,0.1)', borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
              {tableRow(['Card Number', 'Cost', 'Total'], true)}
              {tableRow(['1st card', '1 sunlight', '1'])}
              {tableRow(['2nd card', '2 sunlight', '3'])}
              {tableRow(['3rd card', '3 sunlight', '6'])}
              {tableRow(['4th card', '4 sunlight', '10'], false, true)}
            </div>
            <div style={{ ...txt.sans, fontSize: 16, fontWeight: 600, margin: '18px 0 9px', color: PALETTE.inkSoft }}>Spread Cost Scaling</div>
            <div style={{ background: '#fff', border: '1px solid rgba(24,18,13,0.1)', borderRadius: 8, overflow: 'hidden' }}>
              {tableRow(['Network Size', 'Base Cost', 'Wet/Shade'], true)}
              {tableRow(['1–5 tiles', '1 moisture', '2'])}
              {tableRow(['6–7 tiles', '2 moisture', '3'])}
              {tableRow(['8–9 tiles', '3 moisture', '4'])}
              {tableRow(['10–11 tiles', '4 moisture', '5'])}
              {tableRow(['12+ tiles', '5 moisture', '6'], false, true)}
            </div>
            <p style={{ ...txt.serif, fontSize: 14, fontStyle: 'italic', color: 'rgba(24,18,13,0.65)', marginTop: 14 }}>Example: A 7-tile network spreading to a Shade tile costs 2 (base) + 1 (Shade premium) = 3 moisture.</p>
          </div>
          <div style={calloutStyle}>
            <div style={calloutTitle}>Strategic Tip</div>
            <p style={{ ...txt.sans, fontSize: 15, color: PALETTE.inkSoft, margin: 0, lineHeight: 1.65 }}>
              Both Draw and Spread actions have scaling costs. Drawing 4 cards costs 10 sunlight total! Spread costs scale with your <strong>total network size</strong>. Wet and Shade tiles offer powerful mushrooms but cost extra to reach—plan accordingly.
            </p>
          </div>
        </div>

        {/* § 05 Collect Phase */}
        <div style={sec}>
          <div style={secNum}>§ 05 — The Collect Phase</div>
          <h3 style={secTitle}>Harvesting the Network</h3>
          <p style={secIntro}>After the active player completes their actions, <strong>all players simultaneously</strong> collect resources from their mushrooms.</p>
          <div style={cardStyle}>
            <div style={cardTitle}>How Collecting Works</div>
            <ol style={{ ...txt.sans, lineHeight: 2, fontSize: 15, margin: 0, paddingLeft: 22 }}>
              <li>Look at each mushroom card you've planted on the board.</li>
              <li>Each card generates resources shown on the card (Spore, Moisture, or Sunlight).</li>
              <li>Apply any <strong>(Ongoing)</strong> card abilities that trigger during Collect.</li>
              <li>Apply season effects that modify collection (e.g., "All mushrooms produce +1 spore").</li>
              <li>Take the appropriate tokens and add them to your supply.</li>
            </ol>
          </div>
          <div style={calloutStyle}>
            <div style={calloutTitle}>When Effects Trigger</div>
            <p style={{ ...txt.sans, fontSize: 15, color: PALETTE.inkSoft, margin: 0, lineHeight: 1.65 }}>
              <strong>[When Planted]</strong> effects trigger once, immediately when you play the card. <strong>(Ongoing)</strong> effects trigger every Collect phase. Mushrooms generate resources <strong>every turn</strong> during Collect—not just on your turn. Plant early and harvest often!
            </p>
          </div>
        </div>

        {/* § 06 Seasons & Effects */}
        <div style={sec}>
          <div style={secNum}>§ 06 — Seasons & Effects</div>
          <h3 style={secTitle}>The Turning Year</h3>
          <p style={secIntro}>Every 5 turns, the season advances. Each season brings one random effect from its pool—revealed during setup so you can plan ahead.</p>
          <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : 'repeat(2, 1fr)', gap: 18, margin: '24px 0' }}>
            {seasons.map(s => (
              <div key={s.name} style={{ background: '#fff', border: '2px solid rgba(24,18,13,0.1)', borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 24px -8px rgba(14,9,7,0.15)' }}>
                <div style={{ padding: '18px 20px', background: 'linear-gradient(135deg, #5C7338 0%, #2E3A1B 100%)', color: PALETTE.paper }}>
                  <div style={{ ...txt.serif, fontSize: 22, fontWeight: 700, marginBottom: 3 }}>{s.name}</div>
                  <div style={{ ...txt.mono, fontSize: 11, opacity: 0.8, letterSpacing: 1, textTransform: 'uppercase' }}>{s.turns}</div>
                </div>
                <div style={{ padding: 20 }}>
                  {s.effects.map((e, ei) => (
                    <div key={e.name} style={{ marginBottom: ei < s.effects.length - 1 ? 13 : 0, paddingBottom: ei < s.effects.length - 1 ? 13 : 0, borderBottom: ei < s.effects.length - 1 ? '1px solid rgba(24,18,13,0.06)' : 'none' }}>
                      <div style={{ ...txt.sans, fontSize: 14, fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                        {e.name}<span style={badges[e.badge]}>{e.badge}</span>
                      </div>
                      <div style={{ ...txt.sans, fontSize: 13, color: 'rgba(24,18,13,0.72)', lineHeight: 1.5 }}>{e.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={calloutStyle}>
            <div style={calloutTitle}>Adaptation is Key</div>
            <p style={{ ...txt.sans, fontSize: 15, color: PALETTE.inkSoft, margin: 0, lineHeight: 1.65 }}>
              The revealed forecast allows you to <strong>plan several turns ahead</strong>. If you see "Drought" coming in Summer, stockpile moisture in Spring. If "Deep Freeze" locks down spreading in Winter, expand aggressively in Autumn. The forest favors the prepared.
            </p>
          </div>
        </div>

        {/* § 07 Scoring & Victory */}
        <div style={sec}>
          <div style={secNum}>§ 07 — Scoring & Victory</div>
          <h3 style={secTitle}>Claiming the Crown</h3>
          <p style={secIntro}>After turn 20 (the end of Winter), the game ends. Tally your points and crown the champion mycelium.</p>
          <div style={{ background: '#fff', border: '1px solid rgba(24,18,13,0.1)', borderRadius: 8, overflow: 'hidden', margin: '24px 0' }}>
            {tableRow(['Source', 'Description', 'Points'], true)}
            {tableRow(['Mushroom Cards', 'Each planted mushroom scores symbiosis points when planted (one-time, unless marked Ongoing).', 'Varies'])}
            {tableRow(['(Ongoing) Abilities', 'Cards marked (Ongoing) score points each Collect phase while on the board.', 'Varies'])}
            {tableRow(['Season Effects', "Some season effects award symbiosis points at season's end or game end.", 'Varies'])}
            {tableRow(['Leftover Resources', 'Only with "Final Harvest": +1 symbiosis per 3 unspent resources (any type, combined).', '+1 / 3'], false, true)}
          </div>
          <div style={cardStyle}>
            <div style={cardTitle}>Tiebreaker</div>
            <p style={{ ...txt.sans, fontSize: 15, marginBottom: 12, lineHeight: 1.6 }}>If two players are tied, the winner is determined by:</p>
            <ol style={{ ...txt.sans, lineHeight: 2, fontSize: 15, margin: 0, paddingLeft: 22 }}>
              <li><strong>Largest network</strong> (most tiles)</li>
              <li><strong>Most mushrooms</strong> on the board</li>
              <li><strong>First in turn order</strong> (the player who went first wins)</li>
            </ol>
          </div>
        </div>

        {/* § 08 Quick Reference */}
        <div style={{ marginBottom: 0 }}>
          <div style={secNum}>§ 08 — Quick Reference</div>
          <h3 style={secTitle}>At-a-Glance Guide</h3>
          <div style={cardStyle}>
            <div style={cardTitle}>Turn Sequence</div>
            <ol style={{ ...txt.sans, lineHeight: 2, fontSize: 15, margin: 0, paddingLeft: 22 }}>
              <li><strong>Choose Action Type:</strong> Pick one action (Draw, Spread, Plant, or Rest)</li>
              <li><strong>Repeat It:</strong> Repeat that action as many times as you can afford (except Rest)</li>
              <li><strong>Collect Phase:</strong> All players collect resources from their mushrooms</li>
              <li><strong>Pass:</strong> Next player becomes active</li>
              <li><strong>Season Change:</strong> Every 5 turns, advance to the next season</li>
            </ol>
          </div>
          <div style={cardStyle}>
            <div style={cardTitle}>Key Rules</div>
            <ul style={{ ...txt.sans, lineHeight: 2, fontSize: 15, margin: 0, paddingLeft: 22 }}>
              <li>You can only plant mushrooms on tiles <strong>in your network</strong>.</li>
              <li>A tile must match <strong>at least one</strong> of the card's required habitats, <strong>OR be an Open tile</strong>.</li>
              <li>Once claimed, a tile belongs to that player—<strong>no shared tiles</strong>.</li>
              <li>Spread costs scale with <strong>network size</strong>. Wet and Shade tiles cost +1 extra moisture.</li>
              <li>Resources are collected <strong>every turn</strong> by all players during Collect.</li>
              <li>Season effects are <strong>revealed at setup</strong>—use the forecast to plan your year!</li>
            </ul>
          </div>
          <div style={{ ...cardStyle, marginBottom: 0 }}>
            <div style={cardTitle}>Winning Strategy</div>
            <ul style={{ ...txt.sans, lineHeight: 2, fontSize: 15, margin: 0, paddingLeft: 22 }}>
              <li><strong>Plant early:</strong> Mushrooms generate resources every turn—the earlier you plant, the more you harvest.</li>
              <li><strong>Read the forecast:</strong> Adapt your strategy to upcoming season effects visible from game start.</li>
              <li><strong>Claim premium habitats:</strong> Wet and Shade tiles cost extra but host powerful mushrooms.</li>
              <li><strong>Manage network size:</strong> Larger networks cost more to expand—balance growth with resource generation.</li>
              <li><strong>High-cost cards are high-reward:</strong> Cards like Black Truffle (8 pts) and Amanita Caesar (10 pts) are worth the investment.</li>
              <li><strong>Commit to one action type:</strong> Strategic focus beats scattered play every time.</li>
            </ul>
          </div>
        </div>

        {/* Rulebook footer */}
        <div style={{ textAlign: 'center', padding: '48px 0 0', borderTop: '2px solid rgba(24,18,13,0.15)', marginTop: 56 }}>
          <p style={{ ...txt.serif, fontStyle: 'italic', color: 'rgba(24,18,13,0.55)', fontSize: 16, margin: 0 }}>
            May your spores spread wide, your networks thrive, and your mushrooms reign supreme beneath the autumn canopy.{' '}
            <span style={{ display: 'inline-block', width: 6, height: 6, background: PALETTE.amber, borderRadius: '50%', opacity: 0.5, verticalAlign: 'middle', margin: '0 8px' }}/>
            <strong>Good luck, mycelia.</strong>
          </p>
        </div>

      </div>
    </section>
  );
}

function News({ vp }: { vp: ReturnType<typeof useViewport> }) {
  const { isNarrow } = vp;
  const base = import.meta.env.BASE_URL;
  const posts = [
    { kicker: 'Devlog',    date: 'Apr 18, 2026', read: '6 min', title: 'Patch 0.7 — the parasitic update.', body: 'Fly Agaric finally pulls its weight. We rebalanced six type interactions and added a new season effect.', scheme: 'devlog' as const, image: `${base}news-parasitic.png` },
    { kicker: 'Lore',      date: 'Apr 02, 2026', read: '3 min', title: 'Notes from the Mycelial Codex.', body: 'A short field journal on how the forest remembers — and what that means for our card text rules.', scheme: 'lore' as const, image: `${base}news-codex.png` },
    { kicker: 'Community', date: 'Mar 24, 2026', read: '4 min', title: 'Tournament results & decklists.', body: 'Fifty players, eight rounds, one absurd Reishi-mirror final. Top 8 decklists inside.', scheme: 'community' as const, image: `${base}news-tournament.png` },
  ];
  const kickerColors: Record<string, string> = { Devlog: PALETTE.blood, Lore: '#7A6BA0', Community: PALETTE.moss };
  return (
    <section style={{
      background: PALETTE.paperWarm, color: PALETTE.ink,
      padding: isNarrow ? '72px 20px' : '120px 56px',
      borderTop: `1px solid ${PALETTE.ink}1a`,
    }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{
          display: 'flex', flexDirection: isNarrow ? 'column' : 'row',
          justifyContent: 'space-between', alignItems: isNarrow ? 'flex-start' : 'flex-end',
          gap: 20, marginBottom: isNarrow ? 32 : 56,
        }}>
          <div>
            <div style={{ ...txt.eyebrow, color: PALETTE.amberDeep, marginBottom: 12 }}>§ 03 — Field Journal</div>
            <h2 style={{ ...txt.display, fontSize: isNarrow ? 38 : 56, margin: 0 }}>
              Latest from <span style={{ fontStyle: 'italic', color: PALETTE.mossDeep }}>the canopy.</span>
            </h2>
          </div>
          <a href="#all-posts" style={{
            ...txt.mono, fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase',
            color: PALETTE.ink, textDecoration: 'none',
            paddingBottom: 4, borderBottom: `1.5px solid ${PALETTE.ink}`,
            alignSelf: isNarrow ? 'flex-start' : 'auto',
          }}>Read all updates →</a>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isNarrow ? '1fr' : 'repeat(3, 1fr)',
          gap: isNarrow ? 22 : 28,
        }}>
          {posts.map((p, i) => (
            <a key={i} href={`#post-${i}`} style={{
              textDecoration: 'none', color: PALETTE.ink, display: 'flex', flexDirection: 'column',
              background: PALETTE.paper, border: `1px solid ${PALETTE.ink}1a`, borderRadius: 4,
              overflow: 'hidden', boxShadow: '0 16px 32px -12px rgba(14,9,7,0.18)',
              transition: 'transform 200ms, box-shadow 200ms',
            }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 24px 48px -16px rgba(14,9,7,0.28)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 16px 32px -12px rgba(14,9,7,0.18)'; }}>
              <div style={{ position: 'relative', aspectRatio: '5 / 3', overflow: 'hidden', background: PALETTE.forest }}>
                {p.image ? (
                  <img src={p.image} alt="" aria-hidden="true" style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: 'cover', objectPosition: 'center',
                  }}/>
                ) : (
                  <NewsPaintedThumb scheme={p.scheme}/>
                )}
                <div style={{
                  position: 'absolute', top: 14, left: 14,
                  background: 'rgba(14,9,7,0.85)', backdropFilter: 'blur(6px)',
                  padding: '5px 10px', ...txt.mono, fontSize: 9, letterSpacing: 2,
                  color: kickerColors[p.kicker], textTransform: 'uppercase', borderRadius: 2,
                  border: `1px solid ${kickerColors[p.kicker]}55`,
                }}>{p.kicker}</div>
              </div>
              <div style={{ padding: 22, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ ...txt.mono, fontSize: 10, letterSpacing: 2, color: PALETTE.ink, opacity: 0.55, textTransform: 'uppercase' }}>
                  {p.date} · {p.read} read
                </div>
                <h3 style={{ ...txt.serif, fontWeight: 700, fontSize: 24, margin: '10px 0 12px', lineHeight: 1.15, letterSpacing: -0.3 }}>{p.title}</h3>
                <p style={{ ...txt.serif, fontStyle: 'italic', fontSize: 16, lineHeight: 1.5, color: PALETTE.inkSoft, opacity: 0.78, margin: 0, flex: 1 }}>{p.body}</p>
                <div style={{
                  marginTop: 18, paddingTop: 14, borderTop: `1px solid ${PALETTE.ink}1a`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  ...txt.mono, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase',
                }}>
                  <span style={{ color: PALETTE.amberDeep }}>Continue reading</span>
                  <span>→</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function BigCTA({ vp, onPlay }: { vp: ReturnType<typeof useViewport>; onPlay: () => void }) {
  const { isNarrow, isMobile } = vp;
  const titleSize = isMobile ? 64 : isNarrow ? 96 : 144;
  return (
    <section id="play" style={{
      position: 'relative', overflow: 'hidden',
      padding: isNarrow ? '100px 20px' : '160px 56px',
      color: PALETTE.paper, background: PALETTE.ink, isolation: 'isolate',
    }}>
      {/* Painted mushroom photograph backdrop */}
      <img src={`${import.meta.env.BASE_URL}cta-mushrooms.png`} alt="" aria-hidden="true"
           style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', zIndex: 0 }}/>
      {/* Left-heavy darkening gradient so headline stays legible */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: 'linear-gradient(90deg, rgba(11,7,5,0.78) 0%, rgba(11,7,5,0.55) 45%, rgba(11,7,5,0.35) 100%)',
      }}/>
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: 'linear-gradient(180deg, rgba(11,7,5,0.25) 0%, rgba(11,7,5,0) 30%, rgba(11,7,5,0) 70%, rgba(11,7,5,0.55) 100%)',
      }}/>
      {/* Floating cap motif */}
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', top: 60, right: 80, width: 80, height: 80, opacity: 0.55, zIndex: 1 }}>
        <ellipse cx="50" cy="50" rx="40" ry="28" fill="#C8281A"/>
        <circle cx="35" cy="38" r="6" fill="#F8EBD0"/>
        <circle cx="60" cy="44" r="5" fill="#F8EBD0"/>
        <circle cx="48" cy="32" r="4" fill="#F8EBD0"/>
      </svg>
      <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div style={{ ...txt.eyebrow, color: PALETTE.amber, marginBottom: 16, opacity: 0.85 }}>◈ ⌘ Sporewell Open ⌘ ◈</div>
        <h2 style={{ ...txt.display, fontSize: titleSize, margin: 0, maxWidth: 1200, textShadow: '0 4px 24px rgba(0,0,0,0.7)' }}>
          Spawn a spore.<br/>
          <span style={{ fontStyle: 'italic', color: PALETTE.amber }}>Reshape the forest.</span>
        </h2>
        <p style={{ ...txt.serif, fontStyle: 'italic', fontSize: isNarrow ? 18 : 22, marginTop: 26, maxWidth: 640, lineHeight: 1.5, color: 'rgba(242,234,216,0.82)' }}>
          The demo is live. The full game arrives this autumn. Either way — your colony is waiting.
        </p>
        <div style={{ marginTop: 40, display: 'flex', flexWrap: 'wrap', gap: 14 }}>
          <button onClick={onPlay} style={{
            background: PALETTE.amber, color: PALETTE.ink,
            padding: isNarrow ? '18px 28px' : '22px 38px', border: 'none', cursor: 'pointer',
            ...txt.serif, fontWeight: 700, fontSize: isNarrow ? 18 : 22,
            borderRadius: 2, display: 'inline-flex', alignItems: 'center', gap: 12,
            boxShadow: '0 8px 24px -4px rgba(212,160,74,0.55), inset 0 -2px 0 rgba(0,0,0,0.18)',
            transition: 'transform 160ms',
          }}
            onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={e => (e.currentTarget.style.transform = 'translateY(0)')}>
            Play Mushroom Mayhem <span>→</span>
          </button>
          <a href="#wishlist" style={{
            border: `1px solid ${PALETTE.paper}55`, color: PALETTE.paper,
            padding: isNarrow ? '18px 24px' : '22px 28px',
            ...txt.serif, fontWeight: 500, fontSize: isNarrow ? 16 : 18,
            textDecoration: 'none', borderRadius: 2,
            background: 'rgba(242,234,216,0.05)', backdropFilter: 'blur(6px)',
            display: 'inline-flex', alignItems: 'center',
          }}>Wishlist on Steam</a>
        </div>
        <div style={{
          marginTop: isNarrow ? 56 : 80, display: 'flex', flexWrap: 'wrap', gap: isNarrow ? 24 : 48,
          ...txt.mono, fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', opacity: 0.6,
        }}>
          <span>v0.7 Demo Live</span>
          <span>· Win / Mac / Linux</span>
          <span>· 1–4 players</span>
          <span>· Free to play</span>
        </div>
      </div>
    </section>
  );
}

function Footer({ vp }: { vp: ReturnType<typeof useViewport> }) {
  const { isNarrow } = vp;
  const cols = [
    { title: 'Game',      links: ['Overview', 'Cards', 'Biomes', 'Play'] },
    { title: 'Community', links: ['Discord', 'Reddit', 'Tournaments', 'Press Kit'] },
    { title: 'Studio',    links: ['About', 'Devblog', 'Newsletter', 'Contact'] },
  ];
  return (
    <footer style={{
      background: PALETTE.ink, color: PALETTE.paper,
      padding: isNarrow ? '60px 20px 30px' : '80px 56px 40px',
      borderTop: `1px solid ${PALETTE.amber}33`,
    }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isNarrow ? '1fr' : '1.4fr 1fr 1fr 1fr',
          gap: isNarrow ? 32 : 48, marginBottom: 48,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <LogoMark size={36}/>
              <span style={{ ...txt.serif, fontWeight: 700, fontSize: 24, letterSpacing: 0.4 }}>Mushroom Mayhem</span>
            </div>
            <p style={{ ...txt.serif, fontStyle: 'italic', fontSize: 16, opacity: 0.7, marginTop: 16, maxWidth: 360, lineHeight: 1.5 }}>
              A painted fantasy boardgame about spores, hexes, and very questionable lifestyle choices.
            </p>
            <div style={{ marginTop: 22, ...txt.mono, fontSize: 10, letterSpacing: 2, opacity: 0.5, textTransform: 'uppercase' }}>
              hello@sporestudio.fm
            </div>
          </div>
          {cols.map(col => (
            <div key={col.title}>
              <div style={{ ...txt.eyebrow, color: PALETTE.amber, marginBottom: 18, opacity: 0.9 }}>{col.title}</div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {col.links.map(l => (
                  <li key={l}>
                    <a href={`#${l.toLowerCase()}`} style={{ ...txt.serif, fontSize: 17, color: PALETTE.paper, textDecoration: 'none', opacity: 0.85 }}>{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{
          paddingTop: 22, borderTop: `1px solid ${PALETTE.paper}1a`,
          display: 'flex', flexDirection: isNarrow ? 'column' : 'row',
          justifyContent: 'space-between', alignItems: isNarrow ? 'flex-start' : 'center', gap: 14,
          ...txt.mono, fontSize: 10, letterSpacing: 2, opacity: 0.5, textTransform: 'uppercase',
        }}>
          <span>© 2026 Spore Studio · Made in the underbrush.</span>
          <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
            <span>Privacy</span><span>Terms</span><span>Accessibility</span><span>EULA</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Google Fonts loader ───────────────────────────────────────────────────────

function useFonts() {
  useEffect(() => {
    if (document.getElementById('landing-fonts')) return;
    const link = document.createElement('link');
    link.id = 'landing-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap';
    document.head.appendChild(link);
  }, []);
}

// ── Page root ─────────────────────────────────────────────────────────────────

export function LandingPage({ onPlay }: { onPlay: () => void }) {
  useFonts();
  const vp = useViewport();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ background: PALETTE.ink, minHeight: '100vh', color: PALETTE.paper, fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <Nav isNarrow={vp.isNarrow} menuOpen={menuOpen} setMenuOpen={setMenuOpen} onPlay={onPlay}/>
      <Hero vp={vp} onPlay={onPlay}/>
      <VideoSection vp={vp}/>
      <Features vp={vp}/>
      <HowToPlay vp={vp}/>
      <Rulebook vp={vp}/>
      <News vp={vp}/>
      <BigCTA vp={vp} onPlay={onPlay}/>
      <Footer vp={vp}/>
    </div>
  );
}
