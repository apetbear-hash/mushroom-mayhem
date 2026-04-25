import { useState, useEffect } from 'react';

const PALETTE = {
  ink:       '#0E0907',
  inkSoft:   '#1A140F',
  paper:     '#F2EAD8',
  paperWarm: '#E8DCC0',
  amber:     '#D4A04A',
  amberDeep: '#A87214',
  moss:      '#5C7338',
  mossDeep:  '#2E3A1B',
  blood:     '#8E2820',
  forest:    '#1F2A1A',
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

// ── SVG backdrop ──────────────────────────────────────────────────────────────

function PaintedForestBackdrop({ id = 'bg', variant = 'deep' }: { id?: string; variant?: 'deep' | 'warm' }) {
  const p = variant === 'deep'
    ? { sky: '#1A2516', mist: '#3F5234', floor: '#0A0F08', trunks: '#0A0604', glow: '#D4A04A', canopy: '#2C3A22' }
    : { sky: '#3A2812', mist: '#6B4520', floor: '#1F0F08', trunks: '#0E0604', glow: '#F0BC6C', canopy: '#5A3A18' };

  return (
    <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice"
         style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.sky}/>
          <stop offset="50%" stopColor={p.mist} stopOpacity={0.85}/>
          <stop offset="100%" stopColor={p.floor}/>
        </linearGradient>
        <radialGradient id={`${id}-godray`} cx="0.5" cy="0" r="1">
          <stop offset="0%" stopColor={p.glow} stopOpacity={0.55}/>
          <stop offset="55%" stopColor={p.glow} stopOpacity={0.08}/>
          <stop offset="100%" stopColor={p.glow} stopOpacity={0}/>
        </radialGradient>
        <radialGradient id={`${id}-vignette`} cx="0.5" cy="0.55" r="0.8">
          <stop offset="55%" stopColor="#000" stopOpacity={0}/>
          <stop offset="100%" stopColor="#000" stopOpacity={0.85}/>
        </radialGradient>
        <filter id={`${id}-blur`}><feGaussianBlur stdDeviation="3"/></filter>
        <filter id={`${id}-noise`}>
          <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed="3"/>
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.13 0"/>
          <feComposite in2="SourceGraphic" operator="in"/>
        </filter>
      </defs>
      <rect width="1200" height="800" fill={`url(#${id}-sky)`}/>
      <g filter={`url(#${id}-blur)`}>
        <ellipse cx="240" cy="180" rx="320" ry="120" fill={p.canopy} opacity={0.55}/>
        <ellipse cx="900" cy="140" rx="380" ry="140" fill={p.canopy} opacity={0.45}/>
        <ellipse cx="600" cy="220" rx="500" ry="100" fill={p.mist} opacity={0.4}/>
      </g>
      <polygon points="300,0 580,0 700,520 380,520" fill={`url(#${id}-godray)`} opacity={0.7}/>
      <polygon points="620,0 780,0 820,440 640,440" fill={`url(#${id}-godray)`} opacity={0.5}/>
      <g opacity={0.85}>
        <path d="M 100 800 L 110 350 Q 130 320 150 360 L 165 800 Z" fill={p.trunks}/>
        <path d="M 980 800 L 992 280 Q 1015 260 1038 290 L 1050 800 Z" fill={p.trunks}/>
        <path d="M 250 800 L 258 480 L 275 800 Z" fill={p.trunks} opacity={0.7}/>
        <path d="M 870 800 L 876 460 L 894 800 Z" fill={p.trunks} opacity={0.7}/>
      </g>
      <g>
        <path d="M -20 800 L 0 200 Q 30 140 70 200 L 90 800 Z" fill="#070403"/>
        <path d="M 20 240 L 25 380" stroke="#1F140C" strokeWidth="2" fill="none" opacity={0.6}/>
        <path d="M 45 280 L 52 480" stroke="#1F140C" strokeWidth="2" fill="none" opacity={0.5}/>
        <ellipse cx="40" cy="500" rx="22" ry="12" fill="#3A4A22" opacity={0.5}/>
        <path d="M 1110 800 L 1140 180 Q 1170 130 1210 200 L 1230 800 Z" fill="#070403"/>
        <path d="M 1160 240 L 1168 420" stroke="#1F140C" strokeWidth="2" fill="none" opacity={0.55}/>
        <ellipse cx="1175" cy="560" rx="20" ry="10" fill="#3A4A22" opacity={0.45}/>
      </g>
      <g>
        {Array.from({ length: 28 }).map((_, i) => {
          const x = (i * 73 + 40) % 1180;
          const y = ((i * 91 + 30) % 700) + 30;
          const r = 0.8 + (i % 4) * 0.6;
          return <circle key={i} cx={x} cy={y} r={r} fill={p.glow} opacity={0.18 + (i % 3) * 0.18}/>;
        })}
      </g>
      <path d="M 0 700 Q 300 670 600 695 Q 900 680 1200 700 L 1200 800 L 0 800 Z" fill={p.floor}/>
      <ellipse cx="600" cy="780" rx="500" ry="40" fill="#000" opacity={0.5}/>
      <rect width="1200" height="800" fill={`url(#${id}-vignette)`}/>
      <rect width="1200" height="800" filter={`url(#${id}-noise)`} opacity={0.5}/>
    </svg>
  );
}


function FeatureIllustration({ kind }: { kind: 'hex' | 'cards' }) {
  if (kind === 'hex') {
    return (
      <svg viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice"
           style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="fhx-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1A2516"/><stop offset="100%" stopColor="#0A0F08"/>
          </linearGradient>
          <radialGradient id="fhx-glow" cx="0.5" cy="0.4" r="0.7">
            <stop offset="0%" stopColor="#D4A04A" stopOpacity={0.5}/><stop offset="100%" stopColor="#D4A04A" stopOpacity={0}/>
          </radialGradient>
          <filter id="fhx-noise">
            <feTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="2" seed="7"/>
            <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.12 0"/>
            <feComposite in2="SourceGraphic" operator="in"/>
          </filter>
        </defs>
        <rect width="400" height="280" fill="url(#fhx-bg)"/>
        <ellipse cx="200" cy="140" rx="220" ry="120" fill="url(#fhx-glow)"/>
        <g transform="translate(200 140)">
          {(() => {
            const hexes: React.ReactElement[] = [];
            const r = 32, w = r * Math.sqrt(3);
            const colors = ['#3A5025','#5A3018','#2D4068','#4A4A60'];
            for (let row = -2; row <= 2; row++) {
              for (let col = -3; col <= 3; col++) {
                const x = col * w + (row % 2 ? w / 2 : 0);
                const y = row * r * 1.5;
                const c = colors[(row + col + 5) % colors.length];
                const pts = [0,60,120,180,240,300].map(a => {
                  const rad = (a * Math.PI) / 180;
                  return `${x + r*Math.cos(rad)},${y + r*Math.sin(rad)}`;
                }).join(' ');
                hexes.push(
                  <g key={`${row}-${col}`}>
                    <polygon points={pts} fill={c} opacity={0.85} stroke="#0A0F08" strokeWidth="2"/>
                    <polygon points={pts} fill="none" stroke="#D4A04A" strokeWidth="0.5" opacity={0.3}/>
                  </g>
                );
              }
            }
            return hexes;
          })()}
        </g>
        {([[140,100,'#C8281A'],[230,120,'#D4A04A'],[180,160,'#5C3A60'],[280,180,'#8E2820'],[110,170,'#D4A04A']] as [number,number,string][]).map(([x,y,col],i) => (
          <g key={i} transform={`translate(${x} ${y})`}>
            <ellipse cx="0" cy="6" rx="10" ry="2" fill="#000" opacity={0.5}/>
            <rect x="-3" y="-2" width="6" height="10" fill="#F2E8C8" rx="1"/>
            <ellipse cx="0" cy="-5" rx="11" ry="6" fill={col}/>
            <circle cx="-3" cy="-7" r="1.5" fill="#fff" opacity={0.8}/>
          </g>
        ))}
        <rect width="400" height="280" filter="url(#fhx-noise)" opacity={0.5}/>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice"
         style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="fcd-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3A2818"/><stop offset="100%" stopColor="#0F0805"/>
        </linearGradient>
        <radialGradient id="fcd-glow" cx="0.5" cy="0.5" r="0.6">
          <stop offset="0%" stopColor="#F0BC6C" stopOpacity={0.45}/><stop offset="100%" stopColor="#F0BC6C" stopOpacity={0}/>
        </radialGradient>
        <filter id="fcd-noise">
          <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed="11"/>
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.14 0"/>
          <feComposite in2="SourceGraphic" operator="in"/>
        </filter>
      </defs>
      <rect width="400" height="280" fill="url(#fcd-bg)"/>
      <ellipse cx="200" cy="160" rx="200" ry="100" fill="url(#fcd-glow)"/>
      {([
        { rot: -16, x: 100, y: 70,  cap: '#D4A04A', capDk: '#5A3210' },
        { rot: -4,  x: 170, y: 50,  cap: '#C8281A', capDk: '#3A0805' },
        { rot: 8,   x: 240, y: 60,  cap: '#5C3A60', capDk: '#1F0E22' },
        { rot: 18,  x: 300, y: 80,  cap: '#2A1810', capDk: '#0A0605' },
      ]).map((c, i) => (
        <g key={i} transform={`translate(${c.x} ${c.y}) rotate(${c.rot})`}>
          <rect x="0" y="0" width="80" height="120" rx="6" fill="#0A0907" stroke={c.cap} strokeWidth="1" opacity={0.95}/>
          <rect x="3" y="3" width="74" height="62" rx="4" fill={c.capDk}/>
          <g transform="translate(40 50)">
            <ellipse cx="0" cy="8" rx="14" ry="2" fill="#000" opacity={0.5}/>
            <rect x="-3" y="-4" width="6" height="14" fill="#F2E8C8" rx="1"/>
            <ellipse cx="0" cy="-8" rx="18" ry="11" fill={c.cap}/>
            <ellipse cx="-5" cy="-12" rx="3" ry="1.2" fill="#fff" opacity={0.55}/>
          </g>
          <rect x="3" y="68" width="74" height="14" fill="#1A1208"/>
          <rect x="6" y="73" width="42" height="3" fill="#F2EAD8" opacity={0.85}/>
          <rect x="3" y="84" width="74" height="33" fill="#1A1208" opacity={0.7}/>
          <rect x="6" y="89" width="60" height="1.5" fill={c.cap} opacity={0.7}/>
          <rect x="6" y="94" width="64" height="1.2" fill="#F2EAD8" opacity={0.4}/>
          <rect x="6" y="99" width="58" height="1.2" fill="#F2EAD8" opacity={0.4}/>
          <rect x="6" y="104" width="40" height="1.2" fill="#F2EAD8" opacity={0.4}/>
        </g>
      ))}
      {Array.from({ length: 14 }).map((_, i) => {
        const x = (i * 31 + 20) % 400;
        const y = (i * 53 + 10) % 280;
        return <circle key={i} cx={x} cy={y} r={1 + (i%3)*0.5} fill="#F0BC6C" opacity={0.3 + (i%3)*0.18}/>;
      })}
      <rect width="400" height="280" filter="url(#fcd-noise)" opacity={0.5}/>
    </svg>
  );
}

function NewsPaintedThumb({ scheme }: { scheme: 'devlog' | 'lore' | 'community' }) {
  const schemes = {
    devlog:    { sky: '#3A1610', floor: '#0E0403', glow: '#F05A42', trunks: '#0A0202', canopy: '#5A1810' },
    lore:      { sky: '#1A1F3A', floor: '#06080F', glow: '#A488B8', trunks: '#03030A', canopy: '#2A2050' },
    community: { sky: '#1A2516', floor: '#0A0F08', glow: '#D4A04A', trunks: '#0A0604', canopy: '#2C3A22' },
  };
  const p = schemes[scheme];
  const id = `news-${scheme}`;
  return (
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice"
         style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.sky}/><stop offset="100%" stopColor={p.floor}/>
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.45" r="0.7">
          <stop offset="0%" stopColor={p.glow} stopOpacity={0.45}/><stop offset="100%" stopColor={p.glow} stopOpacity={0}/>
        </radialGradient>
        <filter id={`${id}-blur`}><feGaussianBlur stdDeviation="2"/></filter>
        <filter id={`${id}-noise`}>
          <feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed={scheme.length}/>
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.12 0"/>
          <feComposite in2="SourceGraphic" operator="in"/>
        </filter>
      </defs>
      <rect width="400" height="240" fill={`url(#${id}-sky)`}/>
      <ellipse cx="200" cy="120" rx="220" ry="110" fill={`url(#${id}-glow)`}/>
      <g filter={`url(#${id}-blur)`} opacity={0.7}>
        <ellipse cx="100" cy="80" rx="120" ry="50" fill={p.canopy}/>
        <ellipse cx="320" cy="70" rx="140" ry="50" fill={p.canopy} opacity={0.8}/>
      </g>
      <path d="M -20 240 L -10 60 Q 10 30 30 60 L 40 240 Z" fill={p.trunks}/>
      <path d="M 360 240 L 372 50 Q 392 20 412 50 L 420 240 Z" fill={p.trunks}/>
      <g transform="translate(200 180)">
        <ellipse cx="0" cy="8" rx="50" ry="5" fill="#000" opacity={0.6}/>
        <rect x="-8" y="-10" width="16" height="20" fill="#F2E8C8" rx="2"/>
        <ellipse cx="0" cy="-18" rx="40" ry="22" fill={p.glow}/>
        <ellipse cx="-12" cy="-25" rx="6" ry="2" fill="#fff" opacity={0.55}/>
        <circle cx="-8" cy="-22" r="3" fill="#F2EAD8"/>
        <circle cx="10" cy="-18" r="2.5" fill="#F2EAD8"/>
      </g>
      {Array.from({ length: 18 }).map((_, i) => {
        const x = (i * 47 + 20) % 400;
        const y = (i * 37 + 10) % 200;
        return <circle key={i} cx={x} cy={y} r={1 + (i%3)*0.4} fill={p.glow} opacity={0.3 + (i%3)*0.18}/>;
      })}
      <rect width="400" height="240" filter={`url(#${id}-noise)`} opacity={0.5}/>
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
  const items = ['Game', 'Cards', 'News', 'Lore', 'Community'];
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
      {/* Dark gradient overlay so text stays readable */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(14,9,7,0.45) 0%, rgba(14,9,7,0.2) 40%, rgba(14,9,7,0.75) 100%)',
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
          <a href="#trailer" style={{
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
              <div style={{ ...txt.serif, fontSize: 16, fontWeight: 600, lineHeight: 1.15 }}>Watch the Trailer</div>
              <div style={{ ...txt.mono, fontSize: 8.5, letterSpacing: 1.6, opacity: 0.6, marginTop: 3, textTransform: 'uppercase' }}>2:14 · Announcement</div>
            </div>
          </a>
        </div>
      </div>
    </header>
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

function News({ vp }: { vp: ReturnType<typeof useViewport> }) {
  const { isNarrow } = vp;
  const posts = [
    { kicker: 'Devlog',    date: 'Apr 18, 2026', read: '6 min', title: 'Patch 0.7 — the parasitic update.', body: 'Fly Agaric finally pulls its weight. We rebalanced six type interactions and added a new season effect.', scheme: 'devlog' as const },
    { kicker: 'Lore',      date: 'Apr 02, 2026', read: '3 min', title: 'Notes from the Mycelial Codex.', body: 'A short field journal on how the forest remembers — and what that means for our card text rules.', scheme: 'lore' as const },
    { kicker: 'Community', date: 'Mar 24, 2026', read: '4 min', title: 'Tournament results & decklists.', body: 'Fifty players, eight rounds, one absurd Reishi-mirror final. Top 8 decklists inside.', scheme: 'community' as const },
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
            <div style={{ ...txt.eyebrow, color: PALETTE.amberDeep, marginBottom: 12 }}>§ 02 — Field Journal</div>
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
                <NewsPaintedThumb scheme={p.scheme}/>
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
      <PaintedForestBackdrop id="cta-bg" variant="warm"/>
      <svg viewBox="0 0 100 100" style={{ position: 'absolute', top: 60, right: 80, width: 80, height: 80, opacity: 0.55, zIndex: 1 }}>
        <ellipse cx="50" cy="50" rx="40" ry="28" fill="#C8281A"/>
        <circle cx="35" cy="38" r="6" fill="#F8EBD0"/>
        <circle cx="60" cy="44" r="5" fill="#F8EBD0"/>
        <circle cx="48" cy="32" r="4" fill="#F8EBD0"/>
      </svg>
      <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <div style={{ ...txt.eyebrow, color: PALETTE.amber, marginBottom: 16, opacity: 0.85 }}>◈ ⌘ Sporewell Open ⌘ ◈</div>
        <h2 style={{ ...txt.display, fontSize: titleSize, margin: 0, maxWidth: 1200, textShadow: '0 4px 24px rgba(0,0,0,0.7)' }}>
          Plant a spore.<br/>
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
      <Features vp={vp}/>
      <News vp={vp}/>
      <BigCTA vp={vp} onPlay={onPlay}/>
      <Footer vp={vp}/>
    </div>
  );
}
