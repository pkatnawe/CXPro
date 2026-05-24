# ADR-0001: CSS Strategy - Blueprint Design System

## Status

Accepted

## Context

The CXPro application needs a consistent visual design system to ensure a unified user experience across all signed-in OCA (Operations Control Agent) screens. The frontend-design/ directory contains a complete Blueprint design system with:

- Custom utility classes (.bp-*) for consistent styling
- Light and dark theme support via CSS variables
- Typography system using Archivo and JetBrains Mono fonts
- Pre-designed component patterns for three-panel layouts, cards, grids, etc.

We needed to decide how to integrate this design system into our Next.js application.

## Decision

We will copy the blueprint.css file wholesale from frontend-design/ into our Next.js application and use the .bp-* utility classes directly in our components.

Key aspects of this decision:
1. Copy blueprint.css verbatim to frontend/src/styles/blueprint.css (no modifications)
2. Import it globally in the root layout
3. Use .bp-* utility classes throughout components instead of Tailwind utilities
4. Preserve the exact class names and structure from the design mockups
5. Load Archivo and JetBrains Mono fonts via next/font/google and expose as CSS variables

## Consequences

### Positive

- **Design consistency**: Using the exact blueprint.css ensures pixel-perfect matching with the design mockups
- **No translation errors**: Copying verbatim eliminates risk of CSS translation mistakes
- **Faster implementation**: Developers can directly use class names from the design reference
- **Theme support built-in**: Light/dark themes work immediately via data-theme attribute
- **Single source of truth**: The blueprint.css file remains the authoritative design specification

### Negative

- **Duplicate CSS frameworks**: We now have both Tailwind (from earlier development) and Blueprint utilities
- **Larger bundle size**: Including two CSS systems increases the initial CSS payload
- **Mixed styling patterns**: Some legacy components use Tailwind while new ones use Blueprint
- **No tree-shaking**: We include all Blueprint utilities even if not all are used

### Neutral

- **Migration path**: Existing Tailwind-styled components continue to work and can be migrated incrementally
- **Learning curve**: Developers need to learn Blueprint utility class conventions (.bp-* naming)
- **Documentation dependency**: Teams must reference blueprint-app.jsx for component patterns

## Notes

This decision aligns with PRD #17's requirement to preserve the exact visual design from frontend-design/ while maintaining all existing Slice 01-09 functionality. The wholesale copy approach prioritizes design fidelity and implementation speed over CSS optimization.