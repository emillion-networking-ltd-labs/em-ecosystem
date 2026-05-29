# EM NexaCore — Design System Viewer & Theme Configurator

> **Technical Specification.** Defines the architecture for an in-app design system viewer and theme configurator accessible to SUPERADMIN. Last update: 2026-03-18.

---

## Vision

A built-in section at `/admin/design-system` that serves three purposes:

1. **Component Catalog** — Visual reference of every UI component with all variants and states, rendered with actual code (not screenshots). Catches design drift immediately.
2. **Token Inspector** — Shows all design tokens (colors, typography, spacing, shadows, radii) with live swatches. Verifies code matches Figma.
3. **Theme Configurator** — Allows admins to customize colors and typography per project. Changes apply in real-time via CSS custom properties.

---

## Architecture Levels

### Level 1: Component Showcase (Phase A — Sprint 14)

**Goal**: Every UI component visible in one place, with all variants.

**Route**: `/admin/design-system`

**Page structure**:
```
/admin/design-system
  ├── Tokens
  │   ├── Colors (primary, secondary, semantic, neutral scale)
  │   ├── Typography (font families, sizes, weights, line heights)
  │   ├── Spacing (4, 8, 12, 16, 24, 32, 48, 64)
  │   ├── Border Radii (sm, md, lg, xl, 2xl, full)
  │   └── Shadows (sm, md, lg, card)
  ├── Atoms
  │   ├── Button (variants: primary/secondary/outline/ghost/destructive × sizes × states)
  │   ├── Input (text/email/password/search × states: default/focus/error/disabled)
  │   ├── Badge (variants: default/success/warning/error/info × sizes)
  │   ├── Spinner (sizes: sm/md/lg)
  │   ├── Avatar (sizes × with/without image × initials fallback)
  │   ├── Icon (lucide icon grid with search)
  │   └── Toggle/Switch (on/off × sizes × disabled)
  ├── Molecules
  │   ├── FormField (label + input + error message + helper text)
  │   ├── SearchBar (with/without results dropdown)
  │   ├── MetricCard (with/without trend, loading skeleton)
  │   ├── Toast (success/error/warning/info × with/without action)
  │   ├── EmptyState (icon + message + action; variant=default|error per SCRUM-408)
  │   └── Breadcrumbs (with/without separator variants)
  ├── Organisms
  │   ├── DataTable (sortable, filterable, paginated, loading, empty)
  │   ├── Modal (confirmation, form, info × sizes)
  │   ├── Sidebar (collapsed/expanded, active states)
  │   ├── NavBar (with/without search, notification bell)
  │   └── Form (login-like, settings-like, CRUD-like)
  └── Templates
      ├── ListPage (header + filters + table + pagination)
      ├── DetailPage (header + tabs + content sections)
      └── SettingsPage (sidebar nav + form sections)
```

**Implementation pattern**:

```typescript
// Component registry pattern
interface ComponentEntry {
  name: string;
  category: 'atom' | 'molecule' | 'organism' | 'template';
  description: string;
  component: React.ComponentType;
  variants: VariantConfig[];
  tokens: string[]; // Design tokens this component uses
}

// Registry
const componentRegistry: ComponentEntry[] = [
  {
    name: 'Button',
    category: 'atom',
    description: 'Primary action trigger with multiple variants',
    component: Button,
    variants: [
      { props: { variant: 'primary', size: 'md' }, label: 'Primary Medium' },
      { props: { variant: 'outline', size: 'sm' }, label: 'Outline Small' },
      // ...all combinations
    ],
    tokens: ['--color-primary', '--color-primary-foreground', '--radius-md'],
  },
  // ...
];
```

**Interactive playground**: Use `react-live` (npm: `react-live`, 4.6k stars, MIT) for editable code examples. Components: `LiveProvider`, `LiveEditor`, `LivePreview`, `LiveError`. Lightweight (~26KB), no iframe overhead, renders in same React tree.

**Prop controls**: Custom-built panel (not a library). For each component, define a prop schema:
```typescript
interface PropControl {
  name: string;
  type: 'select' | 'boolean' | 'string' | 'number' | 'color';
  options?: string[];  // For select
  default: unknown;
}
```
Render a controls panel that generates form inputs from the schema. Feed controlled values into the rendered component. Same pattern as shadcn/ui's playground.

---

### Level 2: Token Inspector (Phase A — Sprint 14-15)

**Goal**: Visual verification that code tokens match design system.

**Token display format**:

| Token | Display | Controls |
|-------|---------|----------|
| Colors | Swatch + hex/oklch + contrast ratio | Side-by-side with Figma reference value |
| Typography | Rendered sample text at each scale step | Font family, size, weight, line-height |
| Spacing | Visual blocks at each scale step | Pixel value overlay |
| Radii | Rounded boxes at each radius | Pixel value label |
| Shadows | Cards with each shadow level | Visual comparison |

**Source of truth chain**:
```
Figma (Tokens Studio plugin)
  → Export JSON (DTCG format)
    → Git repo (ai-specs/specs/tokens/*.json)
      → Style Dictionary v4 + @tokens-studio/sd-transforms
        → CSS custom properties file
          → Imported by Tailwind via @theme
            → Available as utility classes
              → Rendered in Token Inspector page
```

**DTCG token format** (W3C Design Tokens Community Group standard):
```json
{
  "color": {
    "primary": {
      "$type": "color",
      "$value": "#1B5E20",
      "$description": "Main brand color, used for primary actions"
    },
    "primary-foreground": {
      "$type": "color",
      "$value": "#FFFFFF",
      "$description": "Text on primary color backgrounds"
    }
  },
  "spacing": {
    "sm": {
      "$type": "dimension",
      "$value": "8px"
    }
  }
}
```

**Token pipeline tools**:

| Tool | npm Package | Purpose |
|------|------------|---------|
| Style Dictionary v4 | `style-dictionary` | Transform tokens to CSS/JS/platform outputs |
| Tokens Studio bridge | `@tokens-studio/sd-transforms` | Connect Figma Tokens Studio export with Style Dictionary |
| culori | `culori` | Color manipulation (OKLCH conversions, contrast calculation) |

**Drift detection**: The Token Inspector can compare:
- **Code tokens** (read from computed CSS variables at runtime)
- **Spec tokens** (read from the DTCG JSON source files)
- Flag mismatches with visual diff (red highlight)

---

### Level 3: Theme Configurator (Phase A-B — Sprint 15+)

**Goal**: Allow customization of visual tokens per project/tenant.

#### Architecture

**CSS custom properties as the theming layer**:

```css
/* Base theme (default) — defined in @theme or :root */
:root {
  --color-primary: oklch(0.72 0.11 178);
  --color-primary-foreground: oklch(0.98 0.01 178);
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.15 0 0);
  --radius-base: 0.5rem;
  --font-family: 'Inter', sans-serif;
}

/* Dark mode override */
.dark {
  --color-background: oklch(0.15 0 0);
  --color-foreground: oklch(0.95 0 0);
}

/* Project-specific override (future — loaded from database) */
[data-theme="project-123"] {
  --color-primary: oklch(0.55 0.15 250);
  --color-primary-foreground: oklch(0.98 0.01 250);
}
```

**Tailwind v4 integration**: Use `@theme` directive so utility classes (`bg-primary`, `text-foreground`, etc.) automatically resolve to CSS variables.

#### Editor UI

**Layout**: Split-panel with resizable divider.

```
┌──────────────────────────────────────────────┐
│  Admin Chrome (fixed theme)                   │
├───────────────┬──────────────────────────────┤
│               │                              │
│  Controls     │  Scoped Preview              │
│  Panel        │  (inherits custom vars)      │
│               │                              │
│  • Colors     │  ┌─ Button ─┐ ┌─ Card ──┐  │
│  • Typography │  │ Primary  │ │ Sample   │  │
│  • Spacing    │  └──────────┘ │ content  │  │
│  • Radii      │               └──────────┘  │
│  • Presets    │                              │
│               │  ┌─ Table ──────────────┐   │
│  [Save]       │  │ Name    Role   Status│   │
│  [Reset]      │  │ Alice   Admin  Active│   │
│  [Export]     │  └──────────────────────┘   │
│               │                              │
├───────────────┴──────────────────────────────┤
│  Footer                                       │
└──────────────────────────────────────────────┘
```

**Key decision: Same-document with scoped container (no iframe)**:
- Apply custom CSS variables to a wrapper `<div>` instead of `:root`
- Preview components inside that div inherit the variables
- Admin UI chrome outside uses its own fixed theme
- Simpler than iframe (no postMessage, shared React context)
- Sufficient isolation for preview purposes

**Controls libraries** (all lightweight, accessible):

| Library | npm Package | Size | Purpose |
|---------|------------|------|---------|
| react-colorful | `react-colorful` | 3.2KB | Color picker |
| react-resizable-panels | `react-resizable-panels` | 8KB | Split panel layout |
| Radix Slider | `@radix-ui/react-slider` | — | Numeric value sliders |
| Radix Select | `@radix-ui/react-select` | — | Dropdowns for fonts/presets |
| Radix Tabs | `@radix-ui/react-tabs` | — | Tab navigation for categories |

#### Data Model (for when Settings module exists)

```typescript
interface ThemeConfig {
  id: string;
  projectId: string;       // FK to Project (or null for system default)
  name: string;            // "Default", "Dark Corporate", "Ocean Blue"
  isActive: boolean;

  // Color tokens
  colors: {
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    accent: string;
    accentForeground: string;
    background: string;
    foreground: string;
    muted: string;
    mutedForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
  };

  // Typography tokens
  typography: {
    fontFamily: string;
    fontFamilyMono: string;
  };

  // Shape tokens
  shape: {
    borderRadius: string;  // Base radius (e.g., "0.5rem")
  };

  // Metadata
  createdAt: DateTime;
  updatedAt: DateTime;
  createdBy: string;
}
```

**Storage strategy**:

| Data | Storage | Rationale |
|------|---------|-----------|
| Theme definitions (schema) | Database (Prisma ThemeConfig) | Persists, shared across team |
| Active theme selection | Database + cookie | Server needs it for SSR |
| Theme CSS variables | Generated at runtime from DB record | Applied to `[data-theme]` |
| User preference (light/dark) | localStorage + cookie | Quick client-side + SSR |
| Token source of truth | Git repo (DTCG JSON) | Version controlled |

**Theme loading flow**:
```
1. User visits dashboard
2. Middleware reads projectId from session/URL
3. Server fetches ThemeConfig for projectId from database
4. CSS variables injected into <html> via data-theme attribute
5. Tailwind utilities resolve to project-specific values
6. If no custom theme → falls back to system default
```

---

## Industry References

| Reference | What to Learn | URL Pattern |
|-----------|--------------|-------------|
| **shadcn/ui Themes** | CSS variable-based theming with OKLCH colors, theme generator, copy-paste model | ui.shadcn.com/themes |
| **Radix Themes** | 12-step semantic color scale (1=bg, 9=solid, 11=text), component-level color prop | radix-ui.com/themes |
| **Shopify Theme Editor** | Settings schema/data separation, live preview, sections + blocks hierarchy | shopify.dev/themes |
| **Chakra UI Playground** | Interactive theme editor with immediate CSS variable updates | chakra-ui.com |
| **Vercel Platforms** | Multi-tenant resolution via middleware + per-tenant config | github.com/vercel/platforms |
| **Style Dictionary** | Token transformation pipeline, DTCG format, multi-platform output | amzn.github.io/style-dictionary |
| **Tokens Studio** | Figma-to-code token sync, Git integration, DTCG export | tokens.studio |

---

## Implementation Roadmap

### Sprint 14 (Phase A — UI Foundation)

| Week | Tasks |
|------|-------|
| 1 | Audit existing components, extract to `src/components/ui/`, define component registry |
| 1 | Create `/admin/design-system` route with category navigation |
| 2 | Build Token Inspector (colors, typography, spacing, radii, shadows) |
| 2 | Build Component Showcase (atoms: Button, Input, Badge, Spinner, Avatar, Toggle) |
| 3 | Build Component Showcase (molecules: FormField, SearchBar, MetricCard, Toast) |
| 3 | Build Component Showcase (organisms: DataTable, Modal) |
| 4 | Add react-live playground for interactive component editing |
| 4 | Build Layout Templates (ListPage, DetailPage, SettingsPage) |

### Sprint 15 (Theme Configurator Foundation)

| Week | Tasks |
|------|-------|
| 1 | Set up DTCG token files + Style Dictionary pipeline |
| 1 | Convert current Tailwind config to CSS variable-based @theme |
| 2 | Build Theme Configurator UI (split-panel, color pickers, typography controls) |
| 2 | Implement scoped preview container with runtime CSS variable updates |
| 3 | Add theme presets (Light, Dark, Ocean, Forest, Corporate) |
| 3 | Token drift detection (compare runtime CSS vars vs DTCG source) |
| 4 | Polish, test, documentation |

### Future (After Settings Module — Phase C)

| Tasks |
|-------|
| Persist ThemeConfig to database via Settings module |
| Load project-specific theme on authentication |
| Theme import/export (JSON) |
| Theme marketplace (share themes between projects) |

---

## New Dependencies

| Package | Version | Size | Purpose | When |
|---------|---------|------|---------|------|
| `react-live` | ^4.1 | 26KB | In-browser JSX playground for component demos | Sprint 14 |
| `react-colorful` | ^5.6 | 3.2KB | Lightweight color picker for theme configurator | Sprint 15 |
| `react-resizable-panels` | ^2.0 | 8KB | Split-panel layout for configurator editor | Sprint 15 |
| `culori` | ^4.0 | 15KB | Color manipulation (OKLCH, contrast ratios) | Sprint 15 |
| `style-dictionary` | ^4.0 | — | Token transformation pipeline (dev dependency) | Sprint 15 |
| `@tokens-studio/sd-transforms` | ^1.0 | — | Figma Tokens Studio → Style Dictionary bridge (dev dependency) | Sprint 15 |

**Note**: Radix UI primitives (Slider, Select, Tabs) are already available or easily added as shadcn/ui components.

---

## Permissions

| Permission | Who | Purpose |
|-----------|-----|---------|
| `design-system:read` | SUPERADMIN | View component catalog and token inspector |
| `design-system:write` | SUPERADMIN | Modify themes, create presets |
| `themes:read` | ADMIN | View project's active theme |
| `themes:write` | ADMIN | Customize project theme (when multi-tenant) |

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| In-app viewer, not Storybook | Uses actual app context (auth, permissions, theme), always accessible to admins, evolves into configurator |
| CSS custom properties (not CSS-in-JS) | Runtime switchable, SSR compatible, Tailwind v4 native support, no build step for theme changes |
| Same-document preview (not iframe) | Simpler, shared React context, sufficient isolation via scoped containers |
| react-live (not Sandpack) | Lightweight (26KB vs 200KB+), no iframe, sufficient for single-component demos |
| DTCG token format | W3C standard, Tokens Studio compatible, Style Dictionary compatible, future-proof |
| OKLCH color space | Perceptually uniform, better for generating color scales, Tailwind v4 default, CSS native |

---

**Document location**: `ai-specs/ai-specs/specs/design-system-viewer.md`
**Related**: `ai-specs/specs/product-roadmap.md` (Phase A), `ai-specs/specs/ui-design-system.md` (current tokens)
