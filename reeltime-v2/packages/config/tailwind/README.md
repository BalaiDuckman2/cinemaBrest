# Tailwind Preset - ReelTime Design System

## Usage

In your app's `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  presets: [require('@reeltime/config/tailwind/preset')],
  content: ['./src/**/*.{ts,tsx}', './index.html'],
};

export default config;
```

## Design Tokens

### Colors
- `rouge-cinema`, `bordeaux-profond`, `or-antique`, `jaune-marquise`
- `creme-ecran`, `beige-papier`, `sepia-chaud`, `noir-velours`
- Dark mode: `dark-primary`, `dark-surface`, `dark-background`, `dark-border`
- Semantic: `success-light/dark`, `warning-light/dark`, `error-light/dark`, `info-light/dark`

### Typography
- `font-bebas` (Bebas Neue), `font-playfair` (Playfair Display), `font-crimson` (Crimson Text)
- `text-display`, `text-headline`, `text-title`, `text-subtitle`, `text-body`, `text-caption`, `text-label`

### Spacing
- `space-1` (4px) through `space-8` (48px)

### Shadows
- `shadow-sm`, `shadow`, `shadow-lg`, `shadow-vintage`
