import { useState, useEffect } from 'react';

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

// ── SVG backdrop ──────────────────────────────────────────────────────────────

function PaintedForestBackdrop({ id = 'bg', variant = 'deep' }: { id?: string; variant?: 'deep' | 'warm' }) {
  // "warm" uses the illustrated splash art style: cream bg, orange-red caps, teal rocks, golden tree
  if (variant === 'warm') {
    return (
      <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice"
           style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}>
        <defs>
          <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D8CEB0"/>
            <stop offset="60%" stopColor="#C8B888"/>
            <stop offset="100%" stopColor="#A89860"/>
          </linearGradient>
          <radialGradient id={`${id}-glow`} cx="0.4" cy="0.3" r="0.7">
            <stop offset="0%" stopColor="#E8A830" stopOpacity={0.4}/>
            <stop offset="100%" stopColor="#E8A830" stopOpacity={0}/>
          </radialGradient>
          <radialGradient id={`${id}-vignette`} cx="0.5" cy="0.5" r="0.8">
            <stop offset="50%" stopColor="#1A100A" stopOpacity={0}/>
            <stop offset="100%" stopColor="#1A100A" stopOpacity={0.7}/>
          </radialGradient>
          <filter id={`${id}-blur`}><feGaussianBlur stdDeviation="4"/></filter>
        </defs>
        <rect width="1200" height="800" fill={`url(#${id}-sky)`}/>
        <ellipse cx="500" cy="300" rx="600" ry="280" fill={`url(#${id}-glow)`}/>

        {/* Distant rock formation (teal, like the splash) */}
        <path d="M 550 520 Q 600 380 680 340 Q 750 300 820 360 Q 880 400 900 480 Q 860 500 750 510 Z"
              fill="#2A5850" opacity={0.9}/>
        <path d="M 560 520 Q 610 400 670 370 Q 720 340 760 380"
              fill="none" stroke="#1A3830" strokeWidth="3" opacity={0.6}/>

        {/* Golden autumn tree (right side) */}
        <path d="M 980 800 L 990 500 Q 995 480 1005 500 L 1010 800 Z" fill="#5A3818"/>
        <path d="M 1000 480 Q 960 380 920 320 Q 960 340 980 300 Q 1000 260 1020 300 Q 1040 340 1080 320 Q 1060 380 1020 480 Z"
              fill="#C89018" opacity={0.95}/>
        <path d="M 1000 480 Q 970 400 940 360 Q 970 370 990 340"
              fill="none" stroke="#E8A820" strokeWidth="2" opacity={0.5}/>
        <ellipse cx="1000" cy="340" rx="80" ry="60" fill="#D4A020" opacity={0.5}/>

        {/* Large orange-red mushroom cluster (center-left) */}
        <g transform="translate(300 680)">
          {/* Big cap */}
          <ellipse cx="0" cy="8" rx="130" ry="14" fill="#1A0A06" opacity={0.5}/>
          <rect x="-16" y="-120" width="32" height="130" fill="#C8C0A0" rx="4"/>
          <path d="M -160 -100 C -165 -200 -100 -260 0 -270 C 100 -260 165 -200 160 -100 C 120 -120 80 -124 0 -120 C -80 -124 -120 -120 -160 -100 Z"
                fill="#C84820"/>
          <path d="M -158 -108 C -162 -198 -98 -256 0 -266" fill="none" stroke="#E87040" strokeWidth="3" opacity={0.7}/>
          <ellipse cx="-60" cy="-200" rx="30" ry="8" fill="#fff" opacity={0.25}/>
        </g>

        {/* White mushroom group (left) */}
        <g transform="translate(120 680)">
          <ellipse cx="0" cy="6" rx="55" ry="6" fill="#1A0A06" opacity={0.4}/>
          <rect x="-8" y="-90" width="16" height="96" fill="#D8D0B0" rx="3"/>
          <path d="M -70 -80 C -72 -140 -44 -168 0 -172 C 44 -168 72 -140 70 -80 C 52 -92 28 -94 0 -92 C -28 -94 -52 -92 -70 -80 Z"
                fill="#EDE8D8"/>
          <path d="M -68 -86 C -70 -138 -42 -164 0 -168" fill="none" stroke="#fff" strokeWidth="2" opacity={0.6}/>
        </g>
        <g transform="translate(180 700)">
          <rect x="-6" y="-60" width="12" height="64" fill="#D0C8A8" rx="2"/>
          <path d="M -45 -52 C -46 -92 -28 -108 0 -110 C 28 -108 46 -92 44 -52 C 32 -60 18 -62 0 -60 C -18 -62 -32 -60 -45 -52 Z"
                fill="#E8E2D0"/>
        </g>

        {/* Red accent plants */}
        <g opacity={0.9}>
          <path d="M 440 680 Q 430 640 438 600 Q 446 560 440 520" fill="none" stroke="#C83818" strokeWidth="4" strokeLinecap="round"/>
          <path d="M 440 600 Q 420 580 410 560" fill="none" stroke="#C83818" strokeWidth="3" strokeLinecap="round"/>
          <path d="M 440 570 Q 456 548 462 528" fill="none" stroke="#C83818" strokeWidth="3" strokeLinecap="round"/>
        </g>

        {/* Ground */}
        <path d="M 0 700 Q 400 680 700 695 Q 900 688 1200 700 L 1200 800 L 0 800 Z" fill="#8A7040"/>
        <path d="M 0 730 Q 300 718 600 725 Q 900 718 1200 730 L 1200 800 L 0 800 Z" fill="#7A6030" opacity={0.6}/>

        {/* Spore particles */}
        {Array.from({ length: 20 }).map((_, i) => {
          const x = (i * 67 + 30) % 1180;
          const y = ((i * 83 + 20) % 600) + 50;
          const r = 1 + (i % 3) * 0.8;
          return <circle key={i} cx={x} cy={y} r={r} fill="#E8A030" opacity={0.2 + (i % 4) * 0.1}/>;
        })}

        <rect width="1200" height="800" fill={`url(#${id}-vignette)`}/>
      </svg>
    );
  }

  // "deep" — original dark forest (used for hero fallback)
  const p = { sky: '#1A2516', mist: '#3F5234', floor: '#0A0F08', trunks: '#0A0604', glow: '#D4A04A', canopy: '#2C3A22' };
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
      </g>
      <polygon points="300,0 580,0 700,520 380,520" fill={`url(#${id}-godray)`} opacity={0.7}/>
      <polygon points="620,0 780,0 820,440 640,440" fill={`url(#${id}-godray)`} opacity={0.5}/>
      <g opacity={0.85}>
        <path d="M 100 800 L 110 350 Q 130 320 150 360 L 165 800 Z" fill={p.trunks}/>
        <path d="M 980 800 L 992 280 Q 1015 260 1038 290 L 1050 800 Z" fill={p.trunks}/>
      </g>
      <path d="M -20 800 L 0 200 Q 30 140 70 200 L 90 800 Z" fill="#070403"/>
      <path d="M 1110 800 L 1140 180 Q 1170 130 1210 200 L 1230 800 Z" fill="#070403"/>
      {Array.from({ length: 28 }).map((_, i) => {
        const x = (i * 73 + 40) % 1180;
        const y = ((i * 91 + 30) % 700) + 30;
        return <circle key={i} cx={x} cy={y} r={0.8 + (i % 4) * 0.6} fill={p.glow} opacity={0.18 + (i % 3) * 0.18}/>;
      })}
      <path d="M 0 700 Q 300 670 600 695 Q 900 680 1200 700 L 1200 800 L 0 800 Z" fill={p.floor}/>
      <rect width="1200" height="800" fill={`url(#${id}-vignette)`}/>
      <rect width="1200" height="800" filter={`url(#${id}-noise)`} opacity={0.5}/>
    </svg>
  );
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
      <Features vp={vp}/>
      <News vp={vp}/>
      <BigCTA vp={vp} onPlay={onPlay}/>
      <Footer vp={vp}/>
    </div>
  );
}
