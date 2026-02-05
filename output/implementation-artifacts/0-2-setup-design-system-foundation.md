# Story 0.2: Setup Design System Foundation

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a shared Tailwind configuration with vintage cinema design tokens,
So that Web and Mobile apps have consistent styling.

## Acceptance Criteria

1. **Given** the monorepo structure from Story 0.1, **When** the design system is configured, **Then** `packages/config/tailwind/preset.js` contains all vintage tokens:
   - Colors: rouge-cinema (#D32F2F), bordeaux-profond (#B71C1C), or-antique (#FFD54F), jaune-marquise (#F9A825), creme-ecran (#FFF8E1), beige-papier (#EFEBE9), sepia-chaud (#8D6E63), noir-velours (#1A1A1A)
   - Dark mode colors: primary (#EF5350), surface (#2D2D2D), background (#1A1A1A), border (#5D4037), text-primary (#FFF8E1), text-secondary (#BCAAA4)
   - Semantic colors: success (#4CAF50/#66BB6A), warning (#FF9800/#FFA726), error (#F44336/#EF5350), info (#2196F3/#42A5F5)
   - Fonts: bebas (Bebas Neue), playfair (Playfair Display), crimson (Crimson Text)
   - Spacing scale: base 8px (space-1: 4px through space-8: 48px)
   - Border radius: rounded-sm (4px), rounded (8px), rounded-lg (12px), rounded-xl (16px), rounded-full (9999px)
   - Box shadows: shadow-sm, shadow, shadow-lg, shadow-vintage
2. **And** font files (Bebas Neue, Playfair Display, Crimson Text) are available for both Web and Mobile consumption
3. **And** the preset can be imported by Web and Mobile apps via `require('@reeltime/config/tailwind/preset')`
4. **And** dark mode is configured with `class` strategy (manual toggle) and `prefers-color-scheme` media query support
5. **And** the typography scale is defined: display (32px/Bebas), headline (24px/Playfair), title (20px/Playfair), subtitle (16px/Crimson), body (14px/Crimson), caption (12px/Crimson), label (11px/Bebas)

## Tasks / Subtasks

- [ ] Task 1: Create Tailwind preset with vintage color tokens (AC: #1)
  - [ ] Create `packages/config/tailwind/preset.js`
  - [ ] Define `colors` extending Tailwind with all vintage tokens (rouge-cinema, bordeaux-profond, or-antique, jaune-marquise, creme-ecran, beige-papier, sepia-chaud, noir-velours)
  - [ ] Add dark mode color variants under `dark:` prefix (per UX spec dark mode palette)
  - [ ] Add semantic colors (success, warning, error, info) with light/dark variants
  - [ ] Configure `darkMode: ['class', { mediaQuery: 'prefers-color-scheme' }]` for dual strategy
- [ ] Task 2: Configure font families in preset (AC: #1, #5)
  - [ ] Define `fontFamily` with: `bebas: ['Bebas Neue', 'sans-serif']`, `playfair: ['Playfair Display', 'serif']`, `crimson: ['Crimson Text', 'serif']`
  - [ ] Define `fontSize` scale matching UX spec typography system:
    - `display`: [32px, { lineHeight: '1.2', fontWeight: '400' }]
    - `headline`: [24px, { lineHeight: '1.2', fontWeight: '700' }]
    - `title`: [20px, { lineHeight: '1.3', fontWeight: '600' }]
    - `subtitle`: [16px, { lineHeight: '1.3', fontWeight: '600' }]
    - `body`: [14px, { lineHeight: '1.5', fontWeight: '400' }]
    - `caption`: [12px, { lineHeight: '1.4', fontWeight: '400' }]
    - `label`: [11px, { lineHeight: '1.4', fontWeight: '400', letterSpacing: '0.05em', textTransform: 'uppercase' }]
- [ ] Task 3: Configure spacing, border-radius, and shadows (AC: #1)
  - [ ] Define `spacing` scale: `{ '1': '4px', '2': '8px', '3': '12px', '4': '16px', '5': '24px', '6': '32px', '8': '48px' }`
  - [ ] Define `borderRadius`: `{ sm: '4px', DEFAULT: '8px', lg: '12px', xl: '16px', full: '9999px', ticket: '8px' }`
  - [ ] Define `boxShadow`: `{ sm: '...', DEFAULT: '...', lg: '...', vintage: '0 4px 6px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8)' }`
- [ ] Task 4: Setup font files for Web consumption (AC: #2)
  - [ ] Download or reference Google Fonts: Bebas Neue (400), Playfair Display (400, 600, 700), Crimson Text (400, 400i, 600)
  - [ ] Place font files in `apps/web/public/fonts/` OR configure Google Fonts CDN link in `apps/web/index.html`
  - [ ] Add `@font-face` declarations in `apps/web/src/styles/globals.css` (if self-hosting)
- [ ] Task 5: Setup font files for Mobile consumption (AC: #2)
  - [ ] Place font files in `apps/mobile/assets/fonts/`
  - [ ] Configure font loading in Expo via `expo-font` or `app.json` fonts config
  - [ ] Verify fonts render correctly on Android
- [ ] Task 6: Export preset from packages/config (AC: #3)
  - [ ] Update `packages/config/package.json` to export `./tailwind/preset`
  - [ ] Ensure the preset can be consumed via `const preset = require('@reeltime/config/tailwind/preset')` in consumer `tailwind.config.ts`
  - [ ] Create example consumer config showing how to use: `presets: [require('@reeltime/config/tailwind/preset')]`
- [ ] Task 7: Verify design system integration (AC: #1, #2, #3, #4, #5)
  - [ ] Create a minimal test HTML/component that uses all color tokens
  - [ ] Verify dark mode toggles correctly
  - [ ] Verify fonts render correctly (Bebas for headlines, Playfair for titles, Crimson for body)
  - [ ] Verify spacing and shadow tokens are accessible
  - [ ] Run `pnpm turbo run build` — must succeed

## Dev Notes

### Architecture Context

**CRITICAL: This story depends on Story 0.1 (monorepo structure).**

The monorepo from Story 0.1 provides `packages/config/` where the shared Tailwind preset lives. This story creates the design system foundation that ALL subsequent UI stories (2.6, 2.7, 2.8, 2.9, 3.4, 3.5, etc.) will depend on.

**Target files:**
- `packages/config/tailwind/preset.js` — Main design token file
- `packages/config/package.json` — Updated exports
- `apps/web/public/fonts/` or CDN config — Web fonts
- `apps/mobile/assets/fonts/` — Mobile fonts

### Technical Stack Requirements

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | v3+ | Web styling utility framework |
| **NativeWind** | v4 | Tailwind for React Native |
| **Google Fonts** | N/A | Bebas Neue, Playfair Display, Crimson Text |

### Tailwind Preset Structure (packages/config/tailwind/preset.js)

```javascript
// packages/config/tailwind/preset.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        // Vintage Cinema palette (light mode)
        'rouge-cinema': '#D32F2F',
        'bordeaux-profond': '#B71C1C',
        'or-antique': '#FFD54F',
        'jaune-marquise': '#F9A825',
        'creme-ecran': '#FFF8E1',
        'beige-papier': '#EFEBE9',
        'sepia-chaud': '#8D6E63',
        'noir-velours': '#1A1A1A',
        // Semantic colors
        success: { light: '#4CAF50', dark: '#66BB6A' },
        warning: { light: '#FF9800', dark: '#FFA726' },
        error: { light: '#F44336', dark: '#EF5350' },
        info: { light: '#2196F3', dark: '#42A5F5' },
      },
      fontFamily: {
        bebas: ['Bebas Neue', 'sans-serif'],
        playfair: ['Playfair Display', 'serif'],
        crimson: ['Crimson Text', 'serif'],
      },
      fontSize: {
        display: ['32px', { lineHeight: '1.2', fontWeight: '400' }],
        headline: ['24px', { lineHeight: '1.2', fontWeight: '700' }],
        title: ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        subtitle: ['16px', { lineHeight: '1.3', fontWeight: '600' }],
        body: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.4', fontWeight: '400' }],
        label: ['11px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '24px',
        '6': '32px',
        '8': '48px',
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
        ticket: '8px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.1)',
        DEFAULT: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 20px rgba(0, 0, 0, 0.15)',
        vintage: '0 4px 6px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
      },
    },
  },
};
```

### Consumer Example (apps/web/tailwind.config.ts)

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  presets: [require('@reeltime/config/tailwind/preset')],
  content: ['./src/**/*.{ts,tsx}', './index.html'],
};

export default config;
```

### Font Strategy Decision

**Option A (Recommandé pour MVP): Google Fonts CDN**
- Add `<link>` in `apps/web/index.html` pointing to Google Fonts
- For mobile: download `.ttf` files and use `expo-font`
- Pro: Zero build complexity, fast setup
- Con: Requires network on first load (Web)

**Option B: Self-hosted fonts**
- Download all font files to `apps/web/public/fonts/`
- Define `@font-face` in `globals.css`
- Pro: No external dependency
- Con: More setup, larger initial bundle

**Decision:** Use Option A (Google Fonts CDN for Web + downloaded fonts for Mobile) for fastest implementation. Can migrate to self-hosted later.

### Dark Mode Strategy

The UX spec defines a dual dark mode approach:
1. **`prefers-color-scheme` media query** — Automatic based on OS setting
2. **`class` strategy** — Manual toggle via `dark` class on `<html>`

Tailwind v3 supports `darkMode: 'class'` which enables the manual toggle. The automatic detection is handled in JavaScript by reading `window.matchMedia('(prefers-color-scheme: dark)')` and adding/removing the `dark` class.

### Naming Conventions (from Architecture)

| Element | Convention | Example |
|---------|-----------|---------|
| Config files | `camelCase.js` or `camelCase.ts` | `preset.js` |
| Color tokens | `kebab-case` | `rouge-cinema`, `beige-papier` |
| Font tokens | `lowercase` | `bebas`, `playfair`, `crimson` |
| Tailwind classes | standard Tailwind | `bg-rouge-cinema`, `font-playfair`, `text-display` |

### Anti-Patterns to AVOID

- **DO NOT** use CSS custom properties (`--color-primary`) — use Tailwind tokens only
- **DO NOT** create separate color files for light/dark — use Tailwind dark: prefix
- **DO NOT** hardcode hex values in components — always use token names (`bg-rouge-cinema`)
- **DO NOT** install Tailwind in `packages/config/` — it's only consumed by apps
- **DO NOT** use `rem` units for the typography scale — use `px` as defined in UX spec to ensure pixel-perfect rendering
- **DO NOT** override Tailwind's default spacing entirely — use `extend` to ADD custom values
- **DO NOT** modify the existing Flask app (app.py, modules/, templates/)

### Previous Story Learnings (Story 0.1)

From the Story 0.1 context:
- Monorepo lives in `reeltime-v2/` at project root (separate from Flask app)
- Packages use `@reeltime/*` naming convention
- `packages/config/package.json` must export correctly for workspace resolution
- `pnpm install` must succeed after changes
- `.npmrc` has `shamefully-hoist=true` for Expo/NativeWind compatibility

### Project Structure Notes

- `packages/config/tailwind/preset.js` is consumed by ALL apps (web, mobile)
- Font files for mobile go in `apps/mobile/assets/fonts/` (Expo convention)
- Font files for web can use CDN (Google Fonts) or `apps/web/public/fonts/`
- The Tailwind preset does NOT include `content` paths — each consumer defines its own
- NativeWind v4 reads the same Tailwind config, so tokens work cross-platform automatically

### References

- [Source: output/planning-artifacts/ux-design-specification.md#Design System Foundation] — Color system, typography, spacing, shadows
- [Source: output/planning-artifacts/ux-design-specification.md#Visual Design Foundation] — Complete color tokens light/dark, typography scale
- [Source: output/planning-artifacts/architecture.md#Styling Solution] — Tailwind + NativeWind shared config approach
- [Source: output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] — Naming patterns
- [Source: output/planning-artifacts/epics.md#Story 0.2] — Acceptance criteria and user story
- [Source: output/planning-artifacts/ux-design-specification.md#Accessibility Considerations] — WCAG AA contrast ratios
- [Source: output/planning-artifacts/ux-design-specification.md#Component Strategy] — Custom components using these tokens

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
