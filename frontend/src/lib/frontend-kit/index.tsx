'use client'

import React from 'react'
import type { ReactNode, CSSProperties } from 'react'

/* ── helpers ─────────────────────────────────────────────────────────────── */

function wkSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

/* ── WFrame ───────────────────────────────────────────────────────────────── */

interface WFrameProps {
  children?: ReactNode
  label?: string
  style?: CSSProperties
  className?: string
  variant?: string
}

export function WFrame({ children, label, style, className = '' }: WFrameProps) {
  return (
    <div className={`wk-frame ${className}`.trim()} style={style}>
      {label ? <div className="wk-frame-label">{label}</div> : null}
      {children}
    </div>
  )
}

/* ── WBox ─────────────────────────────────────────────────────────────────── */

type WBoxTone = 'line' | 'ok' | 'warn' | 'primary' | 'ai'

interface WBoxProps {
  children?: ReactNode
  style?: CSSProperties
  tone?: WBoxTone
  dashed?: boolean
  className?: string
  [key: string]: unknown
}

export function WBox({ children, style = {}, tone = 'line', dashed = false, className = '' }: WBoxProps) {
  const borderColor = tone === 'line' ? 'var(--ui-line)' : `var(--ui-${tone})`
  const s: CSSProperties = {
    border: `1px ${dashed ? 'dashed' : 'solid'} ${borderColor}`,
    borderRadius: 8,
    background: 'var(--ui-panel)',
    padding: 12,
    ...style,
  }
  return <div className={`wk-box ${className}`.trim()} style={s}>{children}</div>
}

/* ── WH ───────────────────────────────────────────────────────────────────── */

const WH_LEVEL_SIZE: Record<number, number> = { 1: 28, 2: 22, 3: 18, 4: 15, 5: 13 }

interface WHProps {
  children?: ReactNode
  size?: number
  weight?: number
  style?: CSSProperties
  mono?: boolean
  level?: number
}

export function WH({ children, size, weight = 600, style = {}, mono = false, level }: WHProps) {
  const resolvedSize = size ?? (level ? WH_LEVEL_SIZE[level] ?? 18 : 18)
  return (
    <div style={{
      fontFamily: mono ? 'Geist Mono, ui-monospace, monospace' : 'Geist, ui-sans-serif, system-ui, sans-serif',
      fontSize: resolvedSize,
      fontWeight: weight,
      color: 'var(--ui-ink)',
      letterSpacing: resolvedSize > 20 ? -0.4 : -0.1,
      lineHeight: 1.15,
      fontFeatureSettings: '"ss01", "cv11"',
      ...style,
    }}>{children}</div>
  )
}

/* ── WT ───────────────────────────────────────────────────────────────────── */

type WTColor = 'ink' | 'ink-soft' | 'ink-faint' | 'ok' | 'warn' | 'primary' | 'ai' | 'dim' | 'default' | 'graphite' | 'blue'

const WT_SIZE_MAP: Record<string, number> = { xs: 10, sm: 11, base: 13, md: 14, lg: 16 }
const WT_COLOR_MAP: Record<string, string> = {
  dim: 'ink-faint',
  default: 'ink',
  graphite: 'ink-soft',
  blue: 'primary',
}

interface WTProps {
  children?: ReactNode
  size?: number | string
  color?: WTColor
  mono?: boolean
  weight?: number | string
  style?: CSSProperties
  truncate?: boolean
  as?: string
  className?: string
}

const WT_WEIGHT_MAP: Record<string, number> = { medium: 500, bold: 600, default: 400 }

export function WT({ children, size = 13, color = 'ink', mono = false, weight, style = {}, truncate, className }: WTProps) {
  const resolvedWeight = typeof weight === 'string' ? (WT_WEIGHT_MAP[weight] ?? 400) : weight
  const resolvedSize = typeof size === 'string' ? (WT_SIZE_MAP[size] ?? 13) : size
  const resolvedColor = WT_COLOR_MAP[color] ?? color
  return (
    <div style={{
      fontFamily: mono ? 'Geist Mono, ui-monospace, monospace' : 'Geist, ui-sans-serif, system-ui, sans-serif',
      fontSize: resolvedSize,
      fontWeight: resolvedWeight ?? (resolvedSize <= 11 ? 500 : 400),
      color: `var(--ui-${resolvedColor})`,
      lineHeight: 1.3,
      letterSpacing: mono ? 0 : (resolvedSize <= 11 ? 0.2 : 0),
      ...(truncate ? { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } : {}),
      ...style,
    }} className={className}>{children}</div>
  )
}

/* ── WLabel ───────────────────────────────────────────────────────────────── */

interface WLabelProps {
  children?: ReactNode
  style?: CSSProperties
}

export function WLabel({ children, style = {} }: WLabelProps) {
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
  )
}

/* ── WLines ───────────────────────────────────────────────────────────────── */

interface WLinesProps {
  count?: number
  widths?: number[]
  gap?: number
  style?: CSSProperties
}

export function WLines({ count = 3, widths = [100, 80, 60], gap = 8, style = {} }: WLinesProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap, ...style }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ height: 6, width: `${widths[i % widths.length]}%`, background: 'var(--ui-line)', borderRadius: 3 }} />
      ))}
    </div>
  )
}

/* ── WPill ────────────────────────────────────────────────────────────────── */

type WPillTone = 'ink' | 'ok' | 'warn' | 'primary' | 'ai'
type WPillSize = 'sm' | 'md'

interface WPillProps {
  children?: ReactNode
  tone?: WPillTone
  filled?: boolean
  style?: CSSProperties
  size?: WPillSize
  variant?: string
  active?: boolean
  onClick?: React.MouseEventHandler<HTMLSpanElement>
}

export function WPill({ children, tone = 'ink', filled = false, style = {}, size = 'md' }: WPillProps) {
  const fg = tone === 'ink' ? 'var(--ui-ink)' : `var(--ui-${tone})`
  const bg = filled
    ? (tone === 'ink' ? 'var(--ui-ink)' : `var(--ui-${tone})`)
    : `var(--ui-${tone}-soft)`
  const txt = filled
    ? (tone === 'ink' ? 'var(--ui-panel)' : `var(--ui-on-${tone})`)
    : fg
  const px = size === 'sm' ? 7 : 9
  const py = size === 'sm' ? 1 : 3
  const borderColor = filled
    ? 'transparent'
    : tone === 'ink' ? 'var(--ui-line-strong)' : `var(--ui-${tone}-line)`

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: `${py}px ${px}px`,
      borderRadius: 6,
      border: `1px solid ${borderColor}`,
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
  )
}

/* ── WBtn ─────────────────────────────────────────────────────────────────── */

type WBtnTone = 'primary' | 'ok' | 'warn'
type WBtnVariant = 'solid' | 'outline' | 'ghost' | 'blue' | 'danger' | 'primary'
type WBtnSize = 'sm' | 'md' | 'lg'

interface WBtnProps {
  children?: ReactNode
  tone?: WBtnTone
  variant?: WBtnVariant
  size?: WBtnSize
  style?: CSSProperties
  icon?: ReactNode
  trailing?: ReactNode
  hero?: boolean
  block?: boolean
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export function WBtn({
  children,
  tone: toneProp = 'primary',
  variant: variantProp = 'solid',
  size = 'md',
  style = {},
  icon,
  trailing,
  hero = false,
  block = false,
  onClick,
  disabled,
  type = 'button',
}: WBtnProps) {
  const variant = variantProp === 'blue' || variantProp === 'primary' ? 'solid' : variantProp === 'danger' ? 'solid' : variantProp
  const tone = variantProp === 'blue' || variantProp === 'primary' ? 'primary' : variantProp === 'danger' ? 'warn' : toneProp
  const isSolid = variant === 'solid'
  const isGhost = variant === 'ghost'
  const padPx = { sm: '6px 10px', md: '8px 13px', lg: '10px 16px' }[size]
  const fontPx = { sm: 12, md: 13, lg: 14 }[size]
  const radius = { sm: 6, md: 7, lg: 8 }[size]

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`wk-btn wk-btn-${variant}`}
      style={{
        display: block ? 'flex' : 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: padPx,
        borderRadius: radius,
        background: isSolid
          ? (hero ? 'var(--ui-gradient)' : `var(--ui-${tone})`)
          : (isGhost ? 'transparent' : 'var(--ui-panel)'),
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
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        whiteSpace: 'nowrap',
        lineHeight: 1.2,
        boxShadow: isSolid
          ? (hero
            ? 'var(--ui-shadow-accent), inset 0 1px 0 rgba(255,255,255,0.18)'
            : '0 1px 0 rgba(13,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.12)')
          : 'none',
        transition: 'transform 120ms ease, box-shadow 160ms ease, background 160ms ease',
        textDecoration: 'none',
        ...style,
      }}
    >
      {icon ? <span style={{ display: 'inline-flex', alignItems: 'center', opacity: 0.95 }}>{icon}</span> : null}
      <span>{children}</span>
      {trailing ? <span style={{ display: 'inline-flex', alignItems: 'center', opacity: 0.85, marginLeft: 1 }}>{trailing}</span> : null}
    </button>
  )
}

/* ── WSectionLabel ────────────────────────────────────────────────────────── */

type WSectionTone = 'primary' | 'ok' | 'warn' | 'ai' | 'ink'

interface WSectionLabelProps {
  children?: ReactNode
  dot?: boolean
  tone?: WSectionTone
  style?: CSSProperties
}

export function WSectionLabel({ children, dot = false, tone = 'primary', style = {} }: WSectionLabelProps) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      padding: '4px 10px',
      borderRadius: 999,
      border: `1px solid var(--ui-${tone}-line)`,
      background: `var(--ui-${tone}-soft)`,
      color: `var(--ui-${tone})`,
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
  )
}

/* ── WBrandHeading ────────────────────────────────────────────────────────── */

interface WBrandHeadingProps {
  children?: ReactNode
  size?: number
  style?: CSSProperties
}

export function WBrandHeading({ children, size = 44, style = {} }: WBrandHeadingProps) {
  return (
    <div className="wk-display" style={{ fontSize: size, color: 'var(--ui-ink)', ...style }}>
      {children}
    </div>
  )
}

/* ── WLiveDot ─────────────────────────────────────────────────────────────── */

type WLiveDotTone = 'primary' | 'ok' | 'warn' | 'ai' | 'ink'

interface WLiveDotProps {
  tone?: WLiveDotTone
  color?: string
  size?: number
  label?: string
  style?: CSSProperties
}

export function WLiveDot({ tone, color, size = 7, style = {} }: WLiveDotProps) {
  const COLOR_MAP: Record<string, string> = { ok: 'ok', warn: 'warn', amber: 'ai', dim: 'ink-faint' }
  const resolvedTone = tone ?? (color ? (COLOR_MAP[color] ?? color) : 'primary')
  return (
    <span
      className="wk-live-dot"
      style={{
        width: size,
        height: size,
        color: `var(--ui-${resolvedTone})`,
        ...style,
      }}
    />
  )
}

/* ── WAI ──────────────────────────────────────────────────────────────────── */

interface WAIProps {
  children?: ReactNode
  style?: CSSProperties
  compact?: boolean
}

export function WAI({ children, style = {}, compact = false }: WAIProps) {
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
  )
}

/* ── WNote ────────────────────────────────────────────────────────────────── */

interface WNoteProps {
  children?: ReactNode
  style?: CSSProperties
}

export function WNote({ children, style = {} }: WNoteProps) {
  return (
    <div
      data-wknote="1"
      style={{
        position: 'relative',
        fontFamily: 'Geist Mono, ui-monospace, monospace',
        fontSize: 11,
        color: 'var(--ui-note)',
        lineHeight: 1.35,
        letterSpacing: 0.1,
        paddingLeft: 8,
        borderLeft: '2px solid var(--ui-note)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/* ── WAvatar ──────────────────────────────────────────────────────────────── */

interface WAvatarProps {
  initials?: string
  size?: number
  seed?: string
  style?: CSSProperties
}

export function WAvatar({ initials, size = 24, seed = 'a', style = {} }: WAvatarProps) {
  const r = wkSeed(seed)
  const fills = ['#2160e0', '#1a8754', '#b87f12', '#7d4ae0', '#0c8aa1']
  const c = fills[r % fills.length]
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: c,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif',
      fontSize: size * 0.4,
      fontWeight: 600,
      color: '#fff',
      letterSpacing: 0.2,
      flexShrink: 0,
      ...style,
    }}>{initials}</div>
  )
}

/* ── WBar ─────────────────────────────────────────────────────────────────── */

type WBarColor = 'primary' | 'ok' | 'warn' | 'ai' | 'default'

interface WBarProps {
  value?: number
  max?: number
  height?: number
  size?: string | number
  color?: WBarColor
  style?: CSSProperties
  className?: string
}

export function WBar({ value = 50, max = 100, height = 6, color = 'primary', style = {}, className }: WBarProps) {
  const resolvedColor = color === 'default' ? 'primary' : color
  return (
    <div className={className} style={{
      height,
      width: '100%',
      borderRadius: 999,
      background: 'var(--ui-line)',
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: `${(value / max) * 100}%`,
        background: `var(--ui-${resolvedColor})`,
        borderRadius: 999,
      }} />
    </div>
  )
}

/* ── WIcon ────────────────────────────────────────────────────────────────── */

type WIconColor = 'ink' | 'ink-soft' | 'ink-faint' | 'ok' | 'warn' | 'primary'

interface WIconProps {
  glyph?: string
  size?: number
  color?: WIconColor
  style?: CSSProperties
}

export function WIcon({ glyph = '◇', size = 16, color = 'ink', style = {} }: WIconProps) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      fontSize: size * 0.85,
      fontWeight: 500,
      color: `var(--ui-${color})`,
      fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif',
      ...style,
    }}>{glyph}</span>
  )
}

/* ── WStamp ───────────────────────────────────────────────────────────────── */

interface WStampProps {
  k?: string
  v?: string
  children?: ReactNode
  style?: CSSProperties
  variant?: string
}

export function WStamp({ k, v, children, style = {} }: WStampProps) {
  return (
    <span className="wk-stamp" style={style}>
      {k ? <span className="k">{k}</span> : null}
      {v ? <span className="v">{v}</span> : null}
      {children}
    </span>
  )
}

/* ── WConsole ─────────────────────────────────────────────────────────────── */

type ConsoleTone = 'ok' | 'warn' | 'primary'

interface ConsoleCell {
  label: string
  tone?: ConsoleTone
  value?: string | number
}

interface WConsoleProps {
  cells?: ConsoleCell[]
  style?: CSSProperties
}

export function WConsole({ cells = [], style = {} }: WConsoleProps) {
  return (
    <div className="wk-console" style={style}>
      {cells.map((c, i) => (
        <span key={i} className="cell">
          <span className={`led ${c.tone ?? 'ok'}`} />
          <span>{c.label}</span>
          {c.value != null ? <span style={{ color: 'var(--ui-ink)', fontWeight: 600, marginLeft: 2 }}>{c.value}</span> : null}
        </span>
      ))}
    </div>
  )
}

/* ── WWell ────────────────────────────────────────────────────────────────── */

interface WWellProps {
  children?: ReactNode
  style?: CSSProperties
  className?: string
}

export function WWell({ children, style = {}, className = '' }: WWellProps) {
  return (
    <div className={`wk-well ${className}`.trim()} style={{ padding: '6px 10px', ...style }}>{children}</div>
  )
}

/* ── WSparkline ───────────────────────────────────────────────────────────── */

type WSparklineColor = 'primary' | 'ok' | 'warn'

interface WSparklineProps {
  points?: number[]
  width?: number
  height?: number
  color?: WSparklineColor
  fill?: boolean
}

export function WSparkline({ points = [10, 14, 12, 18, 22, 19, 26, 30], width = 220, height = 60, color = 'primary', fill = true }: WSparklineProps) {
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1
  const step = width / (points.length - 1)
  const pts = points.map((p, i) => [i * step, height - ((p - min) / range) * (height - 8) - 4])
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const dFill = `${d} L ${width} ${height} L 0 ${height} Z`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
      {fill ? <path d={dFill} fill={`var(--ui-${color}-soft)`} /> : null}
      <path d={d} fill="none" stroke={`var(--ui-${color})`} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

/* ── WDonut ───────────────────────────────────────────────────────────────── */

type WDonutColor = 'primary' | 'ok' | 'warn'

interface WDonutProps {
  value?: number
  size?: number
  color?: WDonutColor
  label?: string
}

export function WDonut({ value = 64, size = 64, color = 'primary', label }: WDonutProps) {
  const r = size / 2 - 4
  const c = 2 * Math.PI * r
  const off = c * (1 - value / 100)
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
  )
}

/* ── WDots ────────────────────────────────────────────────────────────────── */

interface WDotsProps {
  style?: CSSProperties
  density?: number
}

export function WDots({ style = {}, density = 18 }: WDotsProps) {
  return (
    <div style={{
      backgroundImage: `radial-gradient(circle, var(--ui-dot) 1px, transparent 1px)`,
      backgroundSize: `${density}px ${density}px`,
      ...style,
    }} />
  )
}

/* ── WBrandMark ───────────────────────────────────────────────────────────── */

export function WBrandMark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width={22} height={22} viewBox="0 0 22 22" style={{ display: 'block' }}>
        <rect x="1" y="1" width="20" height="20" rx="5" fill="var(--ui-ink)" />
        <path d="M 7 11 L 11 7 M 7 11 L 11 15" stroke="var(--ui-panel)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="14.5" cy="11" r="1.4" fill="var(--ui-primary)" />
      </svg>
      <span style={{ fontFamily: 'Geist, sans-serif', fontSize: 14, fontWeight: 600, letterSpacing: -0.2, color: 'var(--ui-ink)' }}>CX Pro</span>
    </div>
  )
}

/* ── PhaseTracker ─────────────────────────────────────────────────────────── */

const PHASE_STEPS = [
  'Design',
  'Submittals',
  'Install',
  'Pre-functional',
  'Functional',
  'IST',
  'Turnover',
  'Operations',
] as const

type PhaseStep = typeof PHASE_STEPS[number]
type PhaseTrackerState = 'done' | 'current' | 'upcoming'

const PHASE_TO_CURRENT_STEP: Record<string, PhaseStep> = {
  'pre-install': 'Install',
  'L2': 'Pre-functional',
  'L3': 'Functional',
  'L4': 'Functional',
  'L5': 'IST',
}

interface PhaseTrackerProps {
  phase: string
  className?: string
}

export function PhaseTracker({ phase, className = '' }: PhaseTrackerProps) {
  const currentStep = PHASE_TO_CURRENT_STEP[phase] ?? 'Install'
  const currentIdx = PHASE_STEPS.indexOf(currentStep)

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, overflowX: 'auto', padding: '4px 0 8px' }} className={className}>
      {PHASE_STEPS.map((step, idx) => {
        let state: PhaseTrackerState = 'upcoming'
        if (idx < currentIdx) state = 'done'
        else if (idx === currentIdx) state = 'current'

        const isDone = state === 'done'
        const isCurrent = state === 'current'
        const circleColor = isDone || isCurrent ? 'var(--ui-primary)' : 'var(--ui-line-strong)'
        const labelColor = isDone || isCurrent ? 'var(--ui-primary)' : 'var(--ui-ink-faint)'
        const labelWeight = isCurrent ? 700 : 500

        return (
          <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', flex: 1, minWidth: 64 }}>
            {idx > 0 && (
              <div style={{
                position: 'absolute',
                top: 10,
                right: '50%',
                width: '100%',
                height: 2,
                zIndex: 0,
                background: idx <= currentIdx ? 'var(--ui-primary)' : 'var(--ui-line)',
              }} />
            )}
            <div style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 1,
              flexShrink: 0,
              background: isDone ? 'var(--ui-primary)' : 'var(--ui-panel)',
              border: `2px solid ${circleColor}`,
            }}>
              {isDone && <span style={{ fontSize: 10, color: '#fff', lineHeight: 1 }}>✓</span>}
              {isCurrent && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ui-primary)', display: 'block' }} />}
            </div>
            <div style={{
              fontSize: 9,
              fontWeight: labelWeight,
              letterSpacing: '0.04em',
              textAlign: 'center',
              marginTop: 4,
              whiteSpace: 'nowrap',
              color: labelColor,
              fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif',
            }}>{step}</div>
          </div>
        )
      })}
    </div>
  )
}

/* ── WSideNav ─────────────────────────────────────────────────────────────── */

interface WSideNavItem {
  id: string
  label: string
  icon?: ReactNode
  badge?: string | number
  badgeAlert?: boolean
  href?: string
  onClick?: () => void
}

interface WSideNavProps {
  items: WSideNavItem[]
  activeId?: string
  className?: string
}

export function WSideNav({ items, activeId, className = '' }: WSideNavProps) {
  return (
    <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }} className={className}>
      {items.map(item => {
        const isActive = item.id === activeId
        const inner = (
          <>
            {item.icon && <span style={{ width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</span>}
            <span>{item.label}</span>
            {item.badge != null && (
              <span style={{
                marginLeft: 'auto',
                fontSize: 10,
                fontWeight: 500,
                background: item.badgeAlert ? 'var(--ui-warn-soft)' : 'var(--ui-line)',
                color: item.badgeAlert ? 'var(--ui-warn)' : 'var(--ui-ink-faint)',
                padding: '1px 5px',
                borderRadius: 10,
              }}>{item.badge}</span>
            )}
          </>
        )

        const baseStyle: CSSProperties = {
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 10px',
          borderRadius: 5,
          fontSize: 13,
          fontWeight: isActive ? 500 : 450,
          color: isActive ? 'var(--ui-primary)' : 'var(--ui-ink-soft)',
          background: isActive ? 'var(--ui-primary-soft)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          textDecoration: 'none',
          width: '100%',
          fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif',
        }

        if (item.href) {
          return <a key={item.id} href={item.href} style={baseStyle}>{inner}</a>
        }
        return <button key={item.id} style={baseStyle} onClick={item.onClick}>{inner}</button>
      })}
    </nav>
  )
}

/* ── WHeader ──────────────────────────────────────────────────────────────── */

interface Crumb {
  label: string
  href?: string
  onClick?: () => void
}

interface WHeaderProps {
  crumbs?: Crumb[]
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}

export function WHeader({ crumbs, title, subtitle, actions, className = '' }: WHeaderProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        padding: '20px 0 16px',
        borderBottom: '1px solid var(--ui-line)',
        marginBottom: 20,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        {crumbs && crumbs.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--ui-ink-faint)' }}>
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span style={{ opacity: 0.5 }}>›</span>}
                {(c.href || c.onClick) ? (
                  <button style={{ color: 'var(--ui-ink-soft)', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', padding: 0 }} onClick={c.onClick}>{c.label}</button>
                ) : (
                  <span>{c.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ui-ink)', letterSpacing: -0.02, margin: 0, lineHeight: 1.2, fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--ui-ink-faint)', margin: 0 }}>{subtitle}</div>}
      </div>
      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>{actions}</div>}
    </div>
  )
}

/* ── WTabs ────────────────────────────────────────────────────────────────── */

interface WTabsProps {
  tabs: string[]
  active: string
  onChange: (tab: string) => void
  className?: string
}

export function WTabs({ tabs, active, onChange, className = '' }: WTabsProps) {
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--ui-line)', marginBottom: 20 }} className={className}>
      {tabs.map(tab => (
        <button
          key={tab}
          style={{
            padding: '8px 14px',
            fontSize: 12,
            fontWeight: tab === active ? 600 : 500,
            color: tab === active ? 'var(--ui-primary)' : 'var(--ui-ink-soft)',
            background: 'transparent',
            border: 'none',
            borderBottom: `2px solid ${tab === active ? 'var(--ui-primary)' : 'transparent'}`,
            cursor: 'pointer',
            fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif',
            marginBottom: -1,
          }}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

/* ── WKV / WKVGrid ────────────────────────────────────────────────────────── */

interface WKVProps {
  label: string
  children: ReactNode
  className?: string
}

export function WKV({ label, children, className = '' }: WKVProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }} className={className}>
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ui-ink-faint)', fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif' }}>{label}</span>
      <span style={{ fontSize: 13, color: 'var(--ui-ink)', wordBreak: 'break-all', fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif' }}>{children}</span>
    </div>
  )
}

interface WKVGridProps {
  children: ReactNode
  className?: string
}

export function WKVGrid({ children, className = '' }: WKVGridProps) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }} className={className}>{children}</div>
}

/* ── WSkeleton ────────────────────────────────────────────────────────────── */

interface WSkeletonProps {
  width?: string | number
  height?: string | number
  className?: string
}

export function WSkeleton({ width, height = '1em', className = '' }: WSkeletonProps) {
  return (
    <span
      style={{ display: 'inline-block', width, height, background: 'var(--ui-line)', borderRadius: 3 }}
      className={className}
    />
  )
}

/* ── WEmpty ───────────────────────────────────────────────────────────────── */

interface WEmptyProps {
  icon?: ReactNode
  title?: string
  subtitle?: string
  action?: ReactNode
  className?: string
}

export function WEmpty({ icon, title = 'Nothing here', subtitle, action, className = '' }: WEmptyProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '48px 24px', color: 'var(--ui-ink-faint)', textAlign: 'center' }} className={className}>
      {icon && <div style={{ width: 36, height: 36, opacity: 0.35 }}>{icon}</div>}
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ui-ink-soft)', fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif' }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: 'var(--ui-ink-faint)', fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif' }}>{subtitle}</div>}
      {action}
    </div>
  )
}
