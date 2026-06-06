/* wireframe-kit.jsx — clean low-fi UI primitives for CX Pro.
   Sharp, modern SaaS feel. Engineering dot grid background.
   Geist Sans body, Geist Mono for codes/numbers. */

// Compatibility shims — keep API; return clean values (no wobble).
function wkSeed(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h); }
function wkRadius() { return '8px'; }
function wkTilt() { return 0; }

// ── Frame: artboard surface ─────────────────────────────────────────────────
function WFrame({ children, label, style }) {
  return (
    <div className="wk-frame" style={style}>
      {label ? <div className="wk-frame-label">{label}</div> : null}
      {children}
    </div>
  );
}

// ── Box: card container ─────────────────────────────────────────────────────
function WBox({ children, style = {}, tone = 'line', dashed = false, seed = 'b', tilt = 0, className = '' }) {
  const borderColor = tone === 'line' ? 'var(--ui-line)' : `var(--ui-${tone})`;
  const s = {
    border: `1px ${dashed ? 'dashed' : 'solid'} ${borderColor}`,
    borderRadius: 8,
    background: 'var(--ui-panel)',
    padding: 12,
    ...style,
  };
  return <div className={`wk-box ${className}`} style={s}>{children}</div>;
}

// ── Type ────────────────────────────────────────────────────────────────────
function WH({ children, size = 18, weight = 600, style = {}, mono = false }) {
  return (
    <div style={{
      fontFamily: mono ? 'Geist Mono, ui-monospace, monospace' : 'Geist, ui-sans-serif, system-ui, sans-serif',
      fontSize: size,
      fontWeight: weight,
      color: 'var(--ui-ink)',
      letterSpacing: size > 20 ? -0.4 : -0.1,
      lineHeight: 1.15,
      fontFeatureSettings: '"ss01", "cv11"',
      ...style,
    }}>{children}</div>
  );
}
function WT({ children, size = 13, color = 'ink', mono = false, weight, style = {} }) {
  return (
    <div style={{
      fontFamily: mono ? 'Geist Mono, ui-monospace, monospace' : 'Geist, ui-sans-serif, system-ui, sans-serif',
      fontSize: size,
      fontWeight: weight ?? (size <= 11 ? 500 : 400),
      color: `var(--ui-${color})`,
      lineHeight: 1.3,
      letterSpacing: mono ? 0 : (size <= 11 ? 0.2 : 0),
      ...style,
    }}>{children}</div>
  );
}
function WLabel({ children, style = {} }) {
  return (
    <div style={{
      fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif',
      fontSize: 10.5,
      fontWeight: 600,
      color: 'var(--ui-ink-faint)',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      ...style,
    }}>{children}</div>
  );
}

// ── Placeholder lines (clean rounded rects) ─────────────────────────────────
function WLines({ count = 3, widths = [100, 80, 60], gap = 8, style = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap, ...style }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ height: 6, width: `${widths[i % widths.length]}%`, background: 'var(--ui-line)', borderRadius: 3 }} />
      ))}
    </div>
  );
}

// ── Pill / Badge ────────────────────────────────────────────────────────────
function WPill({ children, tone = 'ink', filled = false, style = {}, seed = 'p', size = 'md' }) {
  const fg = tone === 'ink' ? 'var(--ui-ink)' : `var(--ui-${tone})`;
  const bg = filled ? (tone === 'ink' ? 'var(--ui-ink)' : `var(--ui-${tone})`) : `var(--ui-${tone}-soft)`;
  const txt = filled ? (tone === 'ink' ? 'var(--ui-panel)' : 'var(--ui-on-' + tone + ')') : fg;
  const px = size === 'sm' ? 7 : 9, py = size === 'sm' ? 1 : 3;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: `${py}px ${px}px`,
      borderRadius: 6,
      border: filled ? '1px solid transparent' : `1px solid ${tone === 'ink' ? 'var(--ui-line-strong)' : `var(--ui-${tone}-line)`}`,
      background: bg,
      color: txt,
      fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif',
      fontSize: size === 'sm' ? 10.5 : 11.5,
      fontWeight: 500,
      lineHeight: 1.2,
      whiteSpace: 'nowrap',
      letterSpacing: 0.1,
      ...style,
    }}>{children}</span>
  );
}

// ── Button (primary action) ─────────────────────────────────────────────────
function WBtn({ children, tone = 'primary', variant = 'solid', size = 'md', style = {}, icon, trailing, hero = false, block = false }) {
  const isSolid = variant === 'solid';
  const isGhost = variant === 'ghost';
  const padPx = { sm: '6px 10px', md: '8px 13px', lg: '10px 16px' }[size];
  const fontPx = { sm: 12, md: 13, lg: 14 }[size];
  const radius = { sm: 6, md: 7, lg: 8 }[size];
  return (
    <span className={`wk-btn wk-btn-${variant}`} style={{
      display: block ? 'flex' : 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      padding: padPx,
      borderRadius: radius,
      background: isSolid ? (hero ? 'var(--ui-gradient)' : `var(--ui-${tone})`) : (isGhost ? 'transparent' : 'var(--ui-panel)'),
      color: isSolid ? `var(--ui-on-${tone})` : `var(--ui-${tone})`,
      border: isGhost
        ? '1px solid transparent'
        : isSolid
          ? `1px solid color-mix(in oklab, var(--ui-${tone}) 80%, black 20%)`
          : `1px solid var(--ui-${tone}-line)`,
      fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif',
      fontSize: fontPx,
      fontWeight: 500,
      letterSpacing: -0.05,
      cursor: 'default',
      whiteSpace: 'nowrap',
      lineHeight: 1.2,
      boxShadow: isSolid
        ? (hero
            ? 'var(--ui-shadow-accent), inset 0 1px 0 rgba(255,255,255,0.18)'
            : '0 1px 0 rgba(13,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.12)')
        : 'none',
      transition: 'transform 120ms ease, box-shadow 160ms ease, background 160ms ease',
      ...style,
    }}>
      {icon ? <span style={{ display: 'inline-flex', alignItems: 'center', opacity: 0.95 }}>{icon}</span> : null}
      <span>{children}</span>
      {trailing ? <span style={{ display: 'inline-flex', alignItems: 'center', opacity: 0.85, marginLeft: 1 }}>{trailing}</span> : null}
    </span>
  );
}

// ── AI surface marker — amber pill with ✦ ──────────────────────────────────
function WAI({ children, style = {}, compact = false }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: compact ? '2px 7px' : '3px 9px',
      borderRadius: 6,
      background: 'var(--ui-ai-soft)',
      color: 'var(--ui-ai)',
      border: '1px solid var(--ui-ai-line)',
      fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif',
      fontSize: compact ? 11 : 12,
      fontWeight: 500,
      letterSpacing: 0.1,
      lineHeight: 1.2,
      ...style,
    }}>
      <span style={{ fontSize: compact ? 10 : 11, transform: 'translateY(-0.5px)' }}>✦</span>
      {children}
    </span>
  );
}

// ── Margin note — clean designer annotation ─────────────────────────────────
function WNote({ children, style = {}, arrow = 'none', tilt = 0 }) {
  return (
    <div data-wknote="1" style={{
      position: 'relative',
      fontFamily: 'Geist Mono, ui-monospace, monospace',
      fontSize: 11,
      color: 'var(--ui-note)',
      lineHeight: 1.35,
      letterSpacing: 0.1,
      paddingLeft: 8,
      borderLeft: '2px solid var(--ui-note)',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Avatar — clean circle, neutral fills ────────────────────────────────────
function WAvatar({ initials, size = 24, seed = 'a', style = {} }) {
  const r = wkSeed(seed);
  const fills = ['#2160e0', '#1a8754', '#b87f12', '#7d4ae0', '#0c8aa1'];
  const c = fills[r % fills.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: c,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif',
      fontSize: size * 0.4, fontWeight: 600, color: '#fff',
      letterSpacing: 0.2,
      ...style,
    }}>{initials}</div>
  );
}

// ── Bar (progress) ─────────────────────────────────────────────────────────
function WBar({ value = 50, max = 100, height = 6, color = 'primary', style = {} }) {
  return (
    <div style={{
      height, width: '100%', borderRadius: 999,
      background: 'var(--ui-line)',
      position: 'relative', overflow: 'hidden',
      ...style,
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: `${(value / max) * 100}%`,
        background: `var(--ui-${color})`,
        borderRadius: 999,
      }} />
    </div>
  );
}

// ── Icon (text glyph placeholder; keeps existing screen calls happy) ───────
function WIcon({ glyph = '◇', size = 16, color = 'ink', style = {} }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: size, height: size, fontSize: size * 0.85, fontWeight: 500,
      color: `var(--ui-${color})`,
      fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif',
      ...style,
    }}>{glyph}</span>
  );
}

// ── Sparkline ──────────────────────────────────────────────────────────────
function WSparkline({ points = [10, 14, 12, 18, 22, 19, 26, 30], width = 220, height = 60, color = 'primary', fill = true }) {
  const max = Math.max(...points), min = Math.min(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const pts = points.map((p, i) => [i * step, height - ((p - min) / range) * (height - 8) - 4]);
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const dFill = `${d} L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {fill ? <path d={dFill} fill={`var(--ui-${color}-soft)`} /> : null}
      <path d={d} fill="none" stroke={`var(--ui-${color})`} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ── Donut ──────────────────────────────────────────────────────────────────
function WDonut({ value = 64, size = 64, color = 'primary', label }) {
  const r = size / 2 - 4;
  const c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ui-line)" strokeWidth={4} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`var(--ui-${color})`} strokeWidth={4}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        <text x={size / 2} y={size / 2 + 4} textAnchor="middle"
          fontFamily="Geist, sans-serif" fontSize={size * 0.28} fontWeight={600} fill="var(--ui-ink)">{value}%</text>
      </svg>
      {label ? <WT size={10.5} color="ink-soft">{label}</WT> : null}
    </div>
  );
}

// ── Dot grid (engineering blueprint surface) ───────────────────────────────
function WDots({ style = {}, density = 18 }) {
  return (
    <div style={{
      backgroundImage: `radial-gradient(circle, var(--ui-dot) 1px, transparent 1px)`,
      backgroundSize: `${density}px ${density}px`,
      ...style,
    }} />
  );
}

// ── Header bar ──────────────────────────────────────────────────────────────
function WHeader({ title, crumbs = [], children, role }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 16px',
      borderBottom: '1px solid var(--ui-line)',
      background: 'var(--ui-panel)',
      height: 52,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <WBrandMark />
        {crumbs.length ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 ? <WT size={11} color="ink-faint">/</WT> : null}
                <WT size={12} color={i === crumbs.length - 1 ? 'ink' : 'ink-soft'} weight={i === crumbs.length - 1 ? 500 : 400}>{c}</WT>
              </React.Fragment>
            ))}
          </div>
        ) : null}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {children}
        {role ? <WPill tone="primary" size="sm">{role}</WPill> : null}
        <WAvatar initials="JM" size={26} />
      </div>
    </div>
  );
}

// ── Brand mark ──────────────────────────────────────────────────────────────
function WBrandMark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width={22} height={22} viewBox="0 0 22 22" style={{ display: 'block' }}>
        <rect x="1" y="1" width="20" height="20" rx="5" fill="var(--ui-ink)" />
        <path d="M 7 11 L 11 7 M 7 11 L 11 15" stroke="var(--ui-panel)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="14.5" cy="11" r="1.4" fill="var(--ui-primary)" />
      </svg>
      <span style={{ fontFamily: 'Geist, sans-serif', fontSize: 14, fontWeight: 600, letterSpacing: -0.2, color: 'var(--ui-ink)' }}>CX Pro</span>
    </div>
  );
}

// ── Side nav ────────────────────────────────────────────────────────────────
function WSideNav({ items, active, width = 200, footer }) {
  return (
    <div style={{
      width, flexShrink: 0,
      borderRight: '1px solid var(--ui-line)',
      background: 'var(--ui-panel-2)',
      padding: '12px 8px',
      display: 'flex', flexDirection: 'column', gap: 1,
    }}>
      {items.map((it, i) => {
        if (it === '---') return <div key={i} style={{ height: 1, background: 'var(--ui-line)', margin: '8px 4px' }} />;
        if (typeof it === 'string' && it.startsWith('§')) {
          return <div key={i} style={{
            padding: '12px 10px 4px',
            fontFamily: 'Geist, sans-serif', fontSize: 10, fontWeight: 600,
            color: 'var(--ui-ink-faint)', textTransform: 'uppercase', letterSpacing: 0.8,
          }}>{it.slice(1).trim()}</div>;
        }
        // Icon-only mode (when caller passes single-char glyph)
        const isGlyph = typeof it === 'string' && it.length <= 2;
        const isActive = it === active;
        return (
          <div key={i} style={{
            padding: isGlyph ? '8px 0' : '6px 10px',
            borderRadius: 6,
            background: isActive ? 'var(--ui-primary-soft)' : 'transparent',
            color: isActive ? 'var(--ui-primary)' : 'var(--ui-ink-soft)',
            fontFamily: 'Geist, sans-serif',
            fontSize: 13,
            fontWeight: isActive ? 500 : 400,
            display: 'flex', alignItems: 'center', justifyContent: isGlyph ? 'center' : 'flex-start', gap: 8,
          }}>
            {!isGlyph ? <span style={{ width: 14, height: 14, borderRadius: 3, border: `1.4px solid ${isActive ? 'var(--ui-primary)' : 'var(--ui-line-strong)'}` }} /> : null}
            {it}
          </div>
        );
      })}
      <div style={{ flex: 1 }} />
      {footer}
    </div>
  );
}

// ── Section label — mono uppercase pill, optional pulsing LED ───────────────
function WSectionLabel({ children, dot = false, tone = 'primary', style = {} }) {
  const fg = `var(--ui-${tone})`;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '4px 10px',
      borderRadius: 999,
      border: `1px solid var(--ui-${tone}-line)`,
      background: `var(--ui-${tone}-soft)`,
      color: fg,
      fontFamily: 'Geist Mono, ui-monospace, monospace',
      fontSize: 10.5,
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.14em',
      lineHeight: 1.2,
      ...style,
    }}>
      {dot ? <WLiveDot tone={tone} size={6} /> : null}
      {children}
    </span>
  );
}

// ── Brand display headline — Instrument Serif moment, with optional gradient word ──
function WBrandHeading({ children, size = 44, style = {} }) {
  return (
    <div className="wk-display" style={{ fontSize: size, color: 'var(--ui-ink)', ...style }}>
      {children}
    </div>
  );
}

// ── LED pulse dot ───────────────────────────────────────────────────────────
function WLiveDot({ tone = 'primary', size = 7, style = {} }) {
  return (
    <span className="wk-live-dot" style={{
      width: size, height: size,
      color: `var(--ui-${tone})`,
      ...style,
    }} />
  );
}

// ── Spec stamp — metal-nameplate style label ────────────────────────────────
function WStamp({ k, v, children, style = {} }) {
  return (
    <span className="wk-stamp" style={style}>
      {k ? <span className="k">{k}</span> : null}
      {v ? <span className="v">{v}</span> : null}
      {children}
    </span>
  );
}

// ── Console — row of LED + caps cells ───────────────────────────────────────
function WConsole({ cells = [], style = {} }) {
  return (
    <div className="wk-console" style={style}>
      {cells.map((c, i) => (
        <span key={i} className="cell">
          <span className={`led ${c.tone || 'ok'}`} />
          <span>{c.label}</span>
          {c.value ? <span style={{ color: 'var(--ui-ink)', fontWeight: 600, marginLeft: 2 }}>{c.value}</span> : null}
        </span>
      ))}
    </div>
  );
}

// ── Recessed well wrapper — for inputs / display screens ────────────────────
function WWell({ children, style = {}, className = '' }) {
  return (
    <div className={`wk-well ${className}`} style={{ padding: '6px 10px', ...style }}>{children}</div>
  );
}

Object.assign(window, {
  WFrame, WBox, WH, WT, WLabel, WLines, WPill, WBtn, WAI, WNote, WAvatar,
  WBar, WIcon, WSparkline, WDonut, WDots, WHeader, WSideNav, WBrandMark,
  WSectionLabel, WBrandHeading, WLiveDot,
  WStamp, WConsole, WWell,
  wkRadius, wkTilt, wkSeed,
});
