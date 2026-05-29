# Frontend Implementation Plan: SAT01-1 FINAL — Same Stack as Dashboard

## 1. Header

- **Ticket**: SAT01-1
- **Date**: 2026-04-21 (FINAL — previous attempts used Tailwind v4, broke theming)
- **Key decision**: Use **Next.js 14 + Tailwind v3** (identical to nexacore-dashboard) so UI Core components and dark/light theming work without adaptation.

---

## 2. Overview

Build a multi-page satellite website using the EXACT same tech stack and theming pattern as nexacore-dashboard. Dark/light mode works natively because we use the same `tailwind.config.ts` (color mappings to CSS vars), same `globals.css` (`:root`/`.dark` overrides), same `ThemeContext`, and same `postcss.config`.

The ONLY customization is replacing the accent color from green to gold and adding satellite-specific CSS variables for branding.

---

## 3. Why Same Stack (lesson learned)

Previous attempts used Next.js 16 + Tailwind v4 (CSS-first). This broke theming because:
- Tailwind v4 uses `@theme inline` / `@import "tailwindcss"` instead of `tailwind.config.ts`
- The dark mode `darkMode: "class"` config doesn't exist in v4 (needs `@custom-variant`)
- UI Core components were built for Tailwind v3 utility class resolution
- CSS variable override pattern (`var(--surface-primary)`) didn't bridge correctly to v4 `@theme`

**Solution**: Same stack eliminates ALL bridging issues.

---

## 4. Implementation Steps

### Step 0: Feature Branch
- `git checkout main && git pull origin main`
- `git checkout -b feature/SAT01-1-frontend`

### Step 1: Scaffold Next.js 14 Project
- `npx create-next-app@14 sat-cristian-garcia --typescript --tailwind --app --src-dir --eslint`
- This gives Next.js 14 + Tailwind v3 + PostCSS + TypeScript
- Update `package.json`: name `@em-ecosystem/sat-cristian-garcia`
- Install: `npm install lucide-react`

### Step 2: Copy Theming Infrastructure from Dashboard
Copy these files VERBATIM from `nexacore-dashboard/`:
1. `tailwind.config.ts` → satellite root (modify accent color only)
2. `postcss.config.mjs` → satellite root
3. `src/context/ThemeContext.tsx` → satellite
4. `src/hooks/useTheme.ts` → satellite

Then create `src/app/globals.css` based on dashboard's, but with satellite brand colors:
- `:root` (light): same structure, accent → `#8B6914` (dark gold)
- `.dark` (dark): same structure, accent → `#D4A843` (light gold)
- Card patterns, animations, etc.

### Step 3: Copy UI Core Components
Copy from `nexacore-dashboard/src/components/ui/` (15 components):
- Button, InfinitySpinner, Input, IconButton, FormField, InlineError
- Select, Badge, Tabs, Accordion, Avatar, Tooltip
- ConfirmModal, Spinner, ThemeToggle

Zero modifications needed — they work identically because same Tailwind config.

### Step 4: Copy Image Assets
Same 17 images + logotipo from `attachments/` to `public/images/`.

### Step 5: Create Layout
- `layout.tsx`: THEME_INIT_SCRIPT in `<head>`, metadata, Providers wrapper
- `providers.tsx`: ThemeProvider wrapping children
- `PublicNavbar`: logotipo, nav links, ThemeToggle, responsive hamburger
- `PublicFooter`: logotipo, nav, legal, contact

**Navbar theming**: Uses `bg-surface-primary`, `text-content-secondary`, `border-border-components` — ALL are CSS vars that auto-switch with `.dark` class. No conditional logic needed.

### Step 6: Create Static Data
`src/lib/data.ts` — all content (services, testimonials, pricing, portfolio, about, nav links)

### Step 7: Create Section Components (compositions)
Each uses ONLY UI Core components + Tailwind utility classes that reference CSS vars:
- HeroSection: Button, Badge. Uses bg-surface-primary, text-content-primary
- SocialProofSection: animated counters
- ServicesPreview: Card (.card-flat), Badge, Button
- PortfolioPreview: Image grid, ConfirmModal (lightbox)
- TestimonialsPreview: Card, Avatar, Badge
- PricingSection: Card, Badge, Button, Tabs
- ContactForm: FormField, Input, Select, Button
- CTASection: Button

### Step 8: Build 9 Pages
Each page: PublicNavbar + sections + PublicFooter
- `/` — Landing
- `/sobre-mi` — About
- `/servicios` — Services detail
- `/portfolio` — Full gallery
- `/testimonios` — All testimonials
- `/contacto` — Contact form
- `/precios` — Pricing + FAQ (Accordion)
- `/legal/privacidad` — Privacy
- `/legal/terminos` — Terms

### Step 9: Build Verification
- `npm run build` — 0 errors
- Toggle dark/light — ALL elements visible in BOTH modes
- Verify: Button, Input, Select, Badge, Card, Avatar all adapt
- Responsive: 375px, 768px, 1440px
- No FOUC on reload

### Step 10: Documentation

---

## 5. Dark/Light Theming Checklist

Every element MUST use CSS var-backed classes (not hardcoded colors):

| Element | Light Mode | Dark Mode | Class |
|---------|-----------|-----------|-------|
| Page bg | white | near-black | `bg-surface-secondary` |
| Card bg | white | dark | `bg-surface-primary` |
| Primary text | dark | white | `text-content-primary` |
| Secondary text | dark/65% | white/60% | `text-content-secondary` |
| Borders | black/10% | white/10% | `border-border-strong` |
| Accent | dark gold | light gold | `text-accent` / `bg-accent` |
| Buttons primary | dark bg, white text | dark bg, white text | `bg-surface-inverse text-content-inverse` |
| Inputs | white bg | dark bg | `bg-transparent` + border vars |

**RULES**:
- NEVER use `text-white` or `bg-black` in sections (only in overlays over images)
- ALWAYS use `text-content-*`, `bg-surface-*`, `border-border-*`
- Hero overlay text is the ONLY exception (always white because overlay is always dark)

---

## 6. Satellite Brand Overrides (vs dashboard)

| Token | Dashboard | Satellite Light | Satellite Dark |
|-------|-----------|----------------|---------------|
| `--accent` | `#1b5e20` (green) | `#8B6914` (dark gold) | `#D4A843` (gold) |
| `--accent-light` | `#2e7d32` | `#D4A843` | `#E0BC6A` |
| Surface colors | unchanged | unchanged | unchanged |
| Content colors | unchanged | unchanged | unchanged |
| Border colors | unchanged | unchanged | unchanged |
| Semantic colors | unchanged | unchanged | unchanged |

Only the accent changes. Everything else inherits dashboard patterns.
