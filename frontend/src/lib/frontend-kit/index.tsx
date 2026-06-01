'use client'

import React from 'react'
import type { ReactNode, HTMLAttributes, ButtonHTMLAttributes } from 'react'

/* ── WBox ────────────────────────────────────────────────────────────── */

type WBoxVariant = 'default' | 'flat' | 'inset' | 'well' | 'row'

interface WBoxProps extends HTMLAttributes<HTMLDivElement> {
  variant?: WBoxVariant
}

export function WBox({ variant = 'default', className = '', children, ...rest }: WBoxProps) {
  const cls = `fk-box fk-box--${variant} ${className}`.trim()
  return <div className={cls} {...rest}>{children}</div>
}

/* ── WPill ───────────────────────────────────────────────────────────── */

type WPillVariant = 'default' | 'active' | 'warn' | 'ok' | 'amber' | 'ink' | 'outline' | 'ghost' | 'chip'

interface WPillProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: WPillVariant
  active?: boolean
}

export function WPill({ variant = 'default', active, className = '', children, ...rest }: WPillProps) {
  const activeClass = active ? 'is-active' : ''
  const cls = `fk-pill fk-pill--${variant} ${activeClass} ${className}`.trim()
  return <span className={cls} {...rest}>{children}</span>
}

/* ── WT (text) ───────────────────────────────────────────────────────── */

type WTSize = 'xs' | 'sm' | 'base' | 'md' | 'lg'
type WTColor = 'default' | 'dim' | 'graphite' | 'warn' | 'ok' | 'blue'
type WTWeight = 'default' | 'medium' | 'bold'
type WTAs = 'span' | 'p' | 'div' | 'label' | 'li'

interface WTProps extends HTMLAttributes<HTMLElement> {
  size?: WTSize
  color?: WTColor
  weight?: WTWeight
  mono?: boolean
  truncate?: boolean
  as?: WTAs
}

export function WT({
  size = 'base',
  color = 'default',
  weight = 'default',
  mono = false,
  truncate = false,
  as: Tag = 'span',
  className = '',
  children,
  ...rest
}: WTProps) {
  const classes = [
    'fk-t',
    `fk-t--${size}`,
    color !== 'default' ? `fk-t--${color}` : '',
    weight !== 'default' ? `fk-t--${weight}` : '',
    mono ? 'fk-t--mono' : '',
    truncate ? 'fk-t--truncate' : '',
    className,
  ].filter(Boolean).join(' ')
  return <Tag className={classes} {...(rest as HTMLAttributes<HTMLSpanElement>)}>{children}</Tag>
}

/* ── WH (heading) ────────────────────────────────────────────────────── */

type WHLevel = 1 | 2 | 3 | 4 | 5

interface WHProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: WHLevel
}

export function WH({ level = 2, className = '', children, ...rest }: WHProps) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5'
  const cls = `fk-h fk-h--${level} ${className}`.trim()
  return <Tag className={cls} {...rest}>{children}</Tag>
}

/* ── WAvatar ─────────────────────────────────────────────────────────── */

type WAvatarSize = 'sm' | 'md' | 'lg' | 'xl'

interface WAvatarProps {
  initials?: string
  src?: string
  alt?: string
  size?: WAvatarSize
  square?: boolean
  className?: string
}

export function WAvatar({ initials, src, alt, size = 'md', square = false, className = '' }: WAvatarProps) {
  const cls = [
    'fk-avatar',
    `fk-avatar--${size}`,
    square ? 'fk-avatar--square' : '',
    className,
  ].filter(Boolean).join(' ')
  return (
    <div className={cls}>
      {src ? <img src={src} alt={alt ?? ''} /> : (initials ?? '?')}
    </div>
  )
}

/* ── WBar (progress bar) ─────────────────────────────────────────────── */

type WBarSize = 'sm' | 'default' | 'lg'
type WBarColor = 'default' | 'ok' | 'warn' | 'amber'

interface WBarProps {
  value: number
  max?: number
  size?: WBarSize
  color?: WBarColor
  className?: string
}

export function WBar({ value, max = 100, size = 'default', color = 'default', className = '' }: WBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const wrapCls = ['fk-bar', size !== 'default' ? `fk-bar--${size}` : '', className].filter(Boolean).join(' ')
  const fillCls = ['fk-bar__fill', color !== 'default' ? `fk-bar__fill--${color}` : ''].filter(Boolean).join(' ')
  return (
    <div className={wrapCls}>
      <div className={fillCls} style={{ width: `${pct}%` }} />
    </div>
  )
}

/* ── WStamp ──────────────────────────────────────────────────────────── */

type WStampVariant = 'default' | 'blue' | 'ink' | 'outline'

interface WStampProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: WStampVariant
}

export function WStamp({ variant = 'default', className = '', children, ...rest }: WStampProps) {
  const cls = `fk-stamp fk-stamp--${variant} ${className}`.trim()
  return <span className={cls} {...rest}>{children}</span>
}

/* ── WIcon ───────────────────────────────────────────────────────────── */

type WIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type WIconColor = 'default' | 'dim' | 'blue' | 'warn' | 'ok'

interface WIconProps {
  children: ReactNode
  size?: WIconSize
  color?: WIconColor
  className?: string
}

export function WIcon({ children, size = 'md', color = 'default', className = '' }: WIconProps) {
  const cls = [
    'fk-icon',
    `fk-icon--${size}`,
    color !== 'default' ? `fk-icon--${color}` : '',
    className,
  ].filter(Boolean).join(' ')
  return <span className={cls}>{children}</span>
}

/* ── WLiveDot ────────────────────────────────────────────────────────── */

type WLiveDotColor = 'ok' | 'amber' | 'warn' | 'dim'

interface WLiveDotProps {
  label?: string
  color?: WLiveDotColor
  className?: string
}

export function WLiveDot({ label, color = 'ok', className = '' }: WLiveDotProps) {
  const cls = `fk-live-dot ${className}`.trim()
  const dotCls = ['fk-live-dot__dot', color !== 'ok' ? `fk-live-dot__dot--${color}` : ''].filter(Boolean).join(' ')
  return (
    <span className={cls}>
      <span className={dotCls} />
      {label && <span>{label}</span>}
    </span>
  )
}

/* ── WSectionLabel ───────────────────────────────────────────────────── */

interface WSectionLabelProps {
  children: ReactNode
  className?: string
}

export function WSectionLabel({ children, className = '' }: WSectionLabelProps) {
  const cls = `fk-section-label ${className}`.trim()
  return <div className={cls}>{children}</div>
}

/* ── WBtn ────────────────────────────────────────────────────────────── */

type WBtnVariant = 'primary' | 'blue' | 'outline' | 'ghost' | 'danger'
type WBtnSize = 'sm' | 'default' | 'lg'

interface WBtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: WBtnVariant
  size?: WBtnSize
  pill?: boolean
}

export function WBtn({
  variant = 'outline',
  size = 'default',
  pill = false,
  className = '',
  children,
  ...rest
}: WBtnProps) {
  const classes = [
    'fk-btn',
    `fk-btn--${variant}`,
    size !== 'default' ? `fk-btn--${size}` : '',
    pill ? 'fk-btn--pill' : '',
    className,
  ].filter(Boolean).join(' ')
  return <button className={classes} {...rest}>{children}</button>
}

/* ── WHeader ─────────────────────────────────────────────────────────── */

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
  const cls = `fk-header ${className}`.trim()
  return (
    <div className={cls}>
      <div className="fk-header__left">
        {crumbs && crumbs.length > 0 && (
          <div className="fk-header__crumbs">
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="fk-header__crumb-sep">›</span>}
                {(c.href || c.onClick) ? (
                  <button className="fk-header__crumb-link" onClick={c.onClick}>{c.label}</button>
                ) : (
                  <span>{c.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
        <h1 className="fk-header__title">{title}</h1>
        {subtitle && <p className="fk-header__sub">{subtitle}</p>}
      </div>
      {actions && <div className="fk-header__actions">{actions}</div>}
    </div>
  )
}

/* ── WSideNav ────────────────────────────────────────────────────────── */

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
  const cls = `fk-sidenav ${className}`.trim()
  return (
    <nav className={cls}>
      {items.map(item => {
        const isActive = item.id === activeId
        const itemCls = ['fk-sidenav__item', isActive ? 'is-active' : ''].filter(Boolean).join(' ')
        const badgeCls = ['fk-sidenav__badge', item.badgeAlert ? 'fk-sidenav__badge--alert' : ''].filter(Boolean).join(' ')
        const inner = (
          <>
            {item.icon && <span className="fk-sidenav__icon">{item.icon}</span>}
            <span>{item.label}</span>
            {item.badge != null && <span className={badgeCls}>{item.badge}</span>}
          </>
        )
        if (item.href) {
          return (
            <a key={item.id} href={item.href} className={itemCls}>{inner}</a>
          )
        }
        return (
          <button key={item.id} className={itemCls} onClick={item.onClick}>{inner}</button>
        )
      })}
    </nav>
  )
}

/* ── WFrame ──────────────────────────────────────────────────────────── */

type WFrameVariant = 'default' | 'full' | 'padded'

interface WFrameProps extends HTMLAttributes<HTMLDivElement> {
  variant?: WFrameVariant
}

export function WFrame({ variant = 'default', className = '', children, ...rest }: WFrameProps) {
  const cls = ['fk-frame', variant !== 'default' ? `fk-frame--${variant}` : '', className].filter(Boolean).join(' ')
  return <div className={cls} {...rest}>{children}</div>
}

/* ── WTab / WTabs helpers ────────────────────────────────────────────── */

interface WTabsProps {
  tabs: string[]
  active: string
  onChange: (tab: string) => void
  className?: string
}

export function WTabs({ tabs, active, onChange, className = '' }: WTabsProps) {
  const cls = `fk-tabs ${className}`.trim()
  return (
    <div className={cls}>
      {tabs.map(tab => (
        <button
          key={tab}
          className={`fk-tab ${tab === active ? 'is-active' : ''}`}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

/* ── WKV / WKVGrid helpers ───────────────────────────────────────────── */

interface WKVProps {
  label: string
  children: ReactNode
  className?: string
}

export function WKV({ label, children, className = '' }: WKVProps) {
  return (
    <div className={`fk-kv ${className}`.trim()}>
      <span className="fk-kv__key">{label}</span>
      <span className="fk-kv__val">{children}</span>
    </div>
  )
}

interface WKVGridProps {
  children: ReactNode
  className?: string
}

export function WKVGrid({ children, className = '' }: WKVGridProps) {
  return <div className={`fk-kv-grid ${className}`.trim()}>{children}</div>
}

/* ── WSkeleton ───────────────────────────────────────────────────────── */

interface WSkeletonProps {
  width?: string | number
  height?: string | number
  className?: string
}

export function WSkeleton({ width, height = '1em', className = '' }: WSkeletonProps) {
  return (
    <span
      className={`fk-skeleton ${className}`.trim()}
      style={{ display: 'inline-block', width, height }}
    />
  )
}

/* ── WEmpty ──────────────────────────────────────────────────────────── */

interface WEmptyProps {
  icon?: ReactNode
  title?: string
  subtitle?: string
  action?: ReactNode
  className?: string
}

export function WEmpty({ icon, title = 'Nothing here', subtitle, action, className = '' }: WEmptyProps) {
  return (
    <div className={`fk-empty ${className}`.trim()}>
      {icon && <div className="fk-empty__icon">{icon}</div>}
      <div className="fk-empty__title">{title}</div>
      {subtitle && <div className="fk-empty__sub">{subtitle}</div>}
      {action}
    </div>
  )
}

/* ── PhaseTracker ────────────────────────────────────────────────────── */

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
    <div className={`fk-phase-tracker ${className}`.trim()}>
      {PHASE_STEPS.map((step, idx) => {
        let state: PhaseTrackerState = 'upcoming'
        if (idx < currentIdx) state = 'done'
        else if (idx === currentIdx) state = 'current'

        return (
          <div key={step} className="fk-phase-tracker__step">
            {idx > 0 && <div className={`fk-phase-tracker__line fk-phase-tracker__line--${idx <= currentIdx ? 'done' : 'upcoming'}`} />}
            <div className={`fk-phase-tracker__circle fk-phase-tracker__circle--${state}`}>
              {state === 'done' && <span className="fk-phase-tracker__check">✓</span>}
              {state === 'current' && <span className="fk-phase-tracker__dot" />}
            </div>
            <div className={`fk-phase-tracker__label fk-phase-tracker__label--${state}`}>{step}</div>
          </div>
        )
      })}
    </div>
  )
}
