# SCRUM-21 — UI/UX Design Proposal

> **Author:** Claude (Senior UI/UX)
> **Date:** 2026-02-25
> **Based on:** `dashboard-overview.json` (Figma extraction), `ui-design-system.md` (tokens), existing codebase
> **Layout reference:** 1440×1024 Figma artboard — Sidebar (212px) | Center content | Right Bar (280px)

---

## Figma vs. Design System Discrepancies (Flagged)

> Per our workflow: "ALWAYS evaluate Figma vs ui-design-system FIRST. If coherent → replicate. If discrepancy → flag BEFORE coding."

| # | Element | Figma Value | Design System Value | Decision |
|---|---------|-------------|-------------------|----------|
| 1 | Card border-radius (metric/chart) | `20px` | Card: 16px, Analytics Graph: 16px | **Use 16px** (`rounded-2xl`) — no token for 20px, design system prevails |
| 2 | Chart card background | `#f9f9fa` | Card: `#ffffff`, Analytics: `#ffffff` | **Use `bg-surface-secondary`** (`#fbfbfb`) — closest token, nearly identical |
| 3 | NavBar icon containers | 24×24, radius 12px | Icon Set: 28×28, radius 8px | **Use Figma values** — NavBar is a distinct context from standalone Icon Set |
| 4 | Breadcrumb text size | 12px/400 | Divider: 14px/400 (items undefined) | **Figma text = 12px, Divider = 14px per design system** — use both as specified |

**None of these discrepancies replace a documented component.** They are contextual adaptations within specific layouts.

---

## Design Philosophy

The Figma reference (SnowUI kit) establishes a **minimal, monochrome aesthetic** with:
- `#f9f9fa` card backgrounds (NOT white) — subtle contrast against the white page
- `radius-2xl` (20px) for content cards (slightly larger than the design system's 16px — we use 16px per our tokens)
- 14px/600 for section titles, 14px/400 for body, 12px/400 for captions
- Color ONLY in data-viz elements (charts, metric cards, notification badges)
- No heavy borders — just `rgba(0,0,0,0.05)` subtle strokes

**Our adaptation:** We respect this aesthetic but apply our design system tokens faithfully. Where the Figma uses `#000000` we use `#1c1c1c` (content-primary). Where it uses `#f9f9fa` we use `--surface-secondary` (fbfbfb). All colors flow through CSS vars so dark mode works automatically.

---

## 1. Sidebar (Redesign)

### Current State
Basic sidebar with 3 nav items (Dashboard, Profile, Admin), user avatar at bottom, collapse toggle.

### Proposed Design

```
┌──────────────────────┐
│  [Avatar] NexaCore    │  ← Logo area (h-16, px-4)
│                       │
├──────────────────────┤  ← Separator: 1px border-default
│  MAIN                 │  ← Section label: text-caption, content-tertiary
│                       │
│  ● ◉ Dashboard        │  ← Active: bg-surface-subtle, rounded-3xl
│    👤 Profile          │     padding 8px, gap-4px
│    🛡 Admin            │     Icon 20px + text 14px/400
│                       │
├──────────────────────┤
│  ACCOUNT              │  ← Section label
│                       │
│    ⚙ Settings          │  ← Future item (disabled/hidden for now)
│    📄 Documentation    │  ← External link to /api/docs
│                       │
├──────────────────────┤
│          SPACER       │  ← flex-1 pushes user to bottom
├──────────────────────┤
│  [JD] John Doe        │  ← User card at bottom
│   john@example.com    │     Avatar (24×24 circle) + name + email
│   USER                │     Role badge
└──────────────────────┘
```

### Specifications

| Element | Token/Value | Notes |
|---------|-------------|-------|
| **Width** | `w-[212px]` expanded / `w-[68px]` collapsed | Matches Figma sidebar |
| **Background** | `bg-surface-primary` | White/dark auto |
| **Right border** | `border-r border-border-default` | `rgba(0,0,0,0.05)` |
| **Padding** | `p-4` (16px all sides) | Matches Figma |
| **Section label** | `text-caption font-semibold text-content-tertiary uppercase tracking-wider` | 12px, 40% opacity, matches "Dashboards"/"Pages" in Figma |
| **Section gap** | `gap-1` (4px between items) | Figma uses 4px |
| **Between sections** | `mt-6` (24px) | Clear separation |

#### Nav Item — Active

```
Outer: flex items-center gap-1 rounded-3xl px-2 py-2
       bg-surface-subtle
Icon:  20×20, text-content-primary (100%)
Arrow: hidden (active = expanded, no arrow needed)
Text:  text-body-sm (14px/400), text-content-primary
```

#### Nav Item — Inactive

```
Outer: flex items-center gap-1 rounded-xl px-2 py-2
       hover:bg-surface-subtle transition-colors
Icon:  20×20, text-content-primary
Arrow: 16×16, text-content-tertiary (only if expandable)
Text:  text-body-sm (14px/400), text-content-primary
```

#### User Card (bottom)

```
Container: border-t border-border-default p-3
Avatar:    24×24 circle, bg-surface-inverse, text-content-inverse
           Shows first initial (uppercase), text-caption font-semibold
Name:      text-body-sm font-medium, text-content-primary, truncate
Email:     text-caption, text-content-tertiary, truncate
Role:      text-caption, content-tertiary (inline after email or below)
```

#### Icons (lucide-react, 20px)

| Route | Icon | lucide name |
|-------|------|-------------|
| /dashboard | ChartPie or LayoutDashboard | `PieChart` |
| /profile | User | `User` |
| /admin | Shield | `Shield` |
| Settings | Settings | `Settings` |
| Docs | FileText | `FileText` |

---

## 2. NavBar (Redesign)

### Current State
Basic navbar with hamburger (mobile), theme toggle, user dropdown.

### Proposed Design

```
┌─────────────────────────────────────────────────────────────────────┐
│ [≡][☆]  Dashboards / Overview          [🔍 Search  ⌘K] [☀][🔔][≡R]│
└─────────────────────────────────────────────────────────────────────┘
```

### Layout: `flex items-center justify-between h-[68px] border-b border-border-default px-7`

#### Left Side — Icons + Breadcrumbs

```
┌──────────────────────────────────────┐
│ [Sidebar] [Star]   Dashboards / Default │
└──────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| **Sidebar toggle** | 24×24, padding 4px, rounded-xl, lucide `PanelLeft` (16×16) |
| **Star/Bookmark** | 24×24, padding 4px, rounded-xl, lucide `Star` (16×16) |
| **Gap between icon group & breadcrumbs** | 8px |
| **Breadcrumb segment (parent)** | text-caption (12px/400), text-content-tertiary, rounded-lg (8px) px-2 py-1 |
| **Breadcrumb separator** | "/" text-body-sm (14px/400), content-primary/20 |
| **Breadcrumb segment (current)** | text-caption (12px/400), text-content-primary (100%), rounded-lg (8px) |

#### Right Side — Search + Actions

```
┌──────────────────────────────────────────────────┐
│ [🔍 Search    /]  [☀] [🕐] [🔔] [≡R]           │
└──────────────────────────────────────────────────┘
```

| Element | Spec |
|---------|------|
| **Search bar** | 160×28, bg-surface-subtle, rounded-2xl, px-2 py-1, gap-2 |
| **Search icon** | 16×16, content-tertiary |
| **Search text** | text-caption (12px/400), content-tertiary, "Search" |
| **Shortcut badge** | text-caption, content-tertiary, border border-border-default, rounded-xs (4px), px-1 |
| **Gap search→icons** | 20px (gap-5) |
| **Action icon** | 24×24, padding 4px, rounded-xl, hover:bg-surface-subtle |
| **Icons** | Sun/Moon (theme), Clock (history), Bell (notifications), PanelRight (right sidebar) |

#### Mobile Adaptation
- Hide search bar, breadcrumbs, sidebar/star icons
- Show hamburger `Menu` icon (left)
- Show theme toggle + user avatar (right)
- Breadcrumbs move below navbar as a secondary bar (optional, or remove)

---

## 3. Dashboard Page (`/dashboard`)

### Layout

```
┌─────────────── Main Content Area (p-6) ──────────────┐
│                                                        │
│  Overview (title)                         [Today ▼]    │
│                                                        │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │
│  │ Views  │ │ Visits │ │New User│ │Active  │          │
│  │ 7,265  │ │ 3,671  │ │  156   │ │ 2,318  │          │
│  │ +11.01%│ │ -0.03% │ │+15.03% │ │ +6.08% │          │
│  └────────┘ └────────┘ └────────┘ └────────┘          │
│                                                        │
│  ┌───────────────────────────────┐ ┌──────────┐       │
│  │   Total Users (Line Chart)   │ │ Traffic  │       │
│  │   ▲ This year ▲ Last year    │ │ by Site  │       │
│  │   ~~~~~~~~~~~~~~~~~~~~~~~~~~~│ │ ████████ │       │
│  │   Jan  Feb  Mar  Apr  May    │ │ Google   │       │
│  └───────────────────────────────┘ └──────────┘       │
│                                                        │
│  ┌──────────────────┐ ┌──────────────────┐            │
│  │ Traffic by Device │ │Traffic by Location│            │
│  │   ██ ██ ██ ██    │ │   🍩 Donut Chart │            │
│  │   Lin Mac iOS Win│ │   US 52% CA 23%  │            │
│  └──────────────────┘ └──────────────────┘            │
│                                                        │
│  ┌────────────────────────────────────────────┐       │
│  │       Marketing & SEO (Full Width)         │       │
│  │   ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██     │       │
│  │   Jan Feb Mar Apr May Jun Jul Aug Sep ...  │       │
│  └────────────────────────────────────────────┘       │
└────────────────────────────────────────────────────────┘
```

### Component Breakdown

#### 3.1 Page Header

```
flex items-center justify-between mb-6

Title:  "Overview"
        text-body-sm font-semibold text-content-primary
        bg-transparent px-2 py-1 rounded-xl

Action: "Today" dropdown
        text-caption text-content-primary
        flex items-center gap-1 px-2 py-1 rounded-lg
        ChevronDown 16×16, content-tertiary
```

#### 3.2 Metric Cards (4-column grid)

```
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7 mb-7
```

Each card:

| Property | Value |
|----------|-------|
| Size | Fluid (1/4 of container) — min ~200px |
| Background | Alternating: `#edeefc` (purple-soft) / `#e6f1fd` (blue-soft) |
| Border | `border border-border-default` |
| Radius | `rounded-2xl` (16px) |
| Shadow | `shadow-card` |
| Padding | `p-6` (24px) |
| Gap | `gap-2` (8px) |
| Layout | Vertical |

**Children:**
- **Label**: `text-caption text-content-primary` (12px/400)
- **Value row**: `flex items-center gap-2`
  - Number: `text-heading-lg text-content-primary` (24px/600)
  - Badge: `flex items-center gap-1`
    - Trend text: `text-caption` (12px/400), green if positive, red if negative
    - Arrow icon: `TrendingUp` or `TrendingDown` (16×16)

**Dark mode note**: The soft background colors (`#edeefc`, `#e6f1fd`) need dark variants. Suggest mapping to slightly darkened versions in dark mode via CSS vars or conditional classes:
- Light: `#edeefc` / `#e6f1fd`
- Dark: `#2a2a3d` / `#1e2d3d`

#### 3.3 Charts Row 1 — Line Chart + Bar Chart

```
grid grid-cols-1 lg:grid-cols-[1fr_202px] gap-7 mb-7
```

**All chart cards share:**

| Property | Value |
|----------|-------|
| Background | `bg-surface-secondary` (`#fbfbfb`) |
| Border | `border border-border-default` |
| Radius | `rounded-2xl` (16px) |
| Padding | `p-6` (24px) |
| Gap | `gap-4` (16px) |

**Total Users (Line Chart) — 3/4 width:**
- Tab bar: `flex items-center gap-4`
  - Active tab: `text-body-sm font-semibold text-content-primary`
  - Inactive tab: `text-body-sm text-content-tertiary`
  - Separator: `text-body-sm text-content-primary/20` "|"
  - Legend tags: Dot (8×8 circle) + `text-caption`
- Chart: Use `recharts` or `chart.js` — Line chart with 2 series
  - Y-axis: `text-caption text-content-tertiary` (30K, 20K, 10K, 0)
  - X-axis: `text-caption text-content-tertiary` (Jan–Jul)
  - Line 1 (this year): `stroke: var(--content-primary)` with gradient fill
  - Line 2 (last year): `stroke: #a0bce8`

**Traffic by Website — fixed 202px width:**
- Title: `text-body-sm font-semibold`
- Horizontal stacked bars with labels
- 6 items: Google, YouTube, Instagram, Pinterest, Facebook, Twitter
- Each: `text-caption` label + segmented bar (3 opacity levels of content-primary)

#### 3.4 Charts Row 2 — Device + Location

```
grid grid-cols-1 lg:grid-cols-2 gap-7 mb-7
```

**Traffic by Device (Vertical Bar Chart):**
- 6 bars with unique colors: `#a0bce8`, `#6be6d3`, `#000000`, `#7dbbff`, `#b899eb`, `#71dd8c`
- X-axis labels: Linux, Mac, iOS, Windows, Android, Other
- Y-axis: 30K, 20K, 10K, 0

**Traffic by Location (Donut Chart):**
- Donut chart (120×120) with 4 segments
- Legend card: rounded-2xl, gap-3
  - Each row: colored dot + country name + percentage
  - US 52.1%, Canada 22.8%, Mexico 13.9%, Other 11.2%

#### 3.5 Full Width Chart — Marketing & SEO

```
col-span-full
```

- 12 vertical bars (Jan–Dec), same unique color cycle as Device chart
- Same card styling as all other charts

#### 3.6 Right Panel (NOT part of main content — separate layout column)

**This is a secondary sidebar (280px) on the right side of the dashboard layout, visible on `lg+` only.**

```
fixed right-0 top-[68px] w-[280px] h-[calc(100vh-68px)]
overflow-y-auto border-l border-border-default
bg-surface-primary p-4 space-y-4
```

**Section: Notifications**
- Title: `text-body-sm text-content-primary px-2 py-1`
- Items (4):
  ```
  flex items-center gap-2 p-2 rounded-xl
  ├── Icon container: 24×24, rounded-lg, bg-[#edeefc] or bg-[#e6f1fd]
  │   └── lucide icon 16×16
  ├── Text column:
  │   ├── Message: text-body-sm text-content-primary
  │   └── Time: text-caption text-content-tertiary
  ```

**Section: Activities**
- Title: `text-body-sm text-content-primary`
- Items (5): Same structure but with circular avatars (24×24) instead of icon boxes
- Timeline: Vertical dotted line on the left (pseudo-element or absolute div)

**Section: Contacts**
- Title: `text-body-sm text-content-primary`
- Items (6): Avatar (24×24 circle) + Name (`text-body-sm`)

---

## 4. Profile Page (`/profile`)

### Layout

```
┌─────────────── Main Content Area (p-6) ──────────────┐
│                                                        │
│  Profile (title)                                       │
│                                                        │
│  ┌────────────────────────────────────────────┐       │
│  │  PROFILE INFORMATION                       │       │
│  │                                            │       │
│  │  [Avatar]  Upload / Remove                 │       │
│  │                                            │       │
│  │  First Name          Last Name             │       │
│  │  ┌──────────────┐   ┌──────────────┐      │       │
│  │  │ John         │   │ Doe          │      │       │
│  │  └──────────────┘   └──────────────┘      │       │
│  │                                            │       │
│  │  Email (read-only)                         │       │
│  │  ┌──────────────────────────────────┐     │       │
│  │  │ john.doe@example.com        🔒   │     │       │
│  │  └──────────────────────────────────┘     │       │
│  │                                    [Save] │       │
│  └────────────────────────────────────────────┘       │
│                                                        │
│  ┌────────────────────────────────────────────┐       │
│  │  CHANGE PASSWORD                           │       │
│  │                                            │       │
│  │  Current Password                          │       │
│  │  ┌──────────────────────────────────┐     │       │
│  │  │ ••••••••                    [👁]  │     │       │
│  │  └──────────────────────────────────┘     │       │
│  │                                            │       │
│  │  New Password                              │       │
│  │  ┌──────────────────────────────────┐     │       │
│  │  │                             [👁]  │     │       │
│  │  └──────────────────────────────────┘     │       │
│  │  [Password strength indicator]             │       │
│  │                                            │       │
│  │  Confirm New Password                      │       │
│  │  ┌──────────────────────────────────┐     │       │
│  │  │                             [👁]  │     │       │
│  │  └──────────────────────────────────┘     │       │
│  │                                 [Update]  │       │
│  └────────────────────────────────────────────┘       │
│                                                        │
│  ┌────────────────────────────────────────────┐       │
│  │  ACCOUNT INFORMATION                       │       │
│  │                                            │       │
│  │  ┌─────────────┬───────────────────────┐  │       │
│  │  │ Member since│ Feb 15, 2026          │  │       │
│  │  │ Role        │ USER                  │  │       │
│  │  │ Status      │ ● Active              │  │       │
│  │  │ Email       │ ✓ Verified            │  │       │
│  │  └─────────────┴───────────────────────┘  │       │
│  └────────────────────────────────────────────┘       │
│                                                        │
│  ┌────────────────────────────────────────────┐       │
│  │  CONNECTED ACCOUNTS                        │       │
│  │                                            │       │
│  │  ┌──────────────────────────────────┐     │       │
│  │  │  [G] Google    Connected ✓       │     │       │
│  │  └──────────────────────────────────┘     │       │
│  │  ┌──────────────────────────────────┐     │       │
│  │  │  [GH] GitHub   [Connect]         │     │       │
│  │  └──────────────────────────────────┘     │       │
│  └────────────────────────────────────────────┘       │
└────────────────────────────────────────────────────────┘
```

### Specifications

**Page layout**: Single column, `max-w-2xl` (672px), centered or left-aligned. Cards stacked vertically with `gap-6`.

**No right panel on Profile** — profile is content-focused, not data-viz.

#### 4.1 Profile Information Card

| Property | Value |
|----------|-------|
| Container | `card` class (bg-surface-primary, border, shadow-card, rounded-2xl, p-6) |
| Title | `text-body-sm font-semibold text-content-primary uppercase tracking-wider mb-6` |
| Layout | Vertical, gap-6 |

**Avatar section:**
```
flex items-center gap-4

Avatar:   w-16 h-16 rounded-circle bg-surface-subtle
          overflow-hidden
          If avatarUrl: <img>
          Else: Initials (text-heading-lg, text-content-primary)

Actions:  flex flex-col gap-1
          "Upload photo" — text-body-sm font-medium text-content-primary
                           cursor-pointer hover:underline
          "Remove" — text-body-sm text-content-tertiary
                     cursor-pointer hover:text-error
```

**Name fields (2-column):**
```
grid grid-cols-1 sm:grid-cols-2 gap-6

Each field:
  Label:  text-label (15px/600), text-content-primary, mb-1.5
  Input:  h-12, bg-transparent, border border-border-default,
          rounded-lg (8px), px-4, text-body-md
          focus: outline 2px offset-2px content-primary/75
```

**Email field (read-only):**
```
Label + Input (same styling)
  Input has: bg-[var(--input-bg-disabled)] cursor-not-allowed
  Lock icon: lucide Lock 16×16, content-tertiary, absolute right-4
```

**Save button:**
```
flex justify-end mt-2

Button: Primary style
  bg-surface-inverse text-content-inverse
  h-10 px-6 rounded-md text-body-sm font-medium
  border border-border-default
  hover:opacity-90 transition-opacity
  disabled: opacity-50 cursor-not-allowed
```

#### 4.2 Change Password Card

Same card container. Fields:
1. **Current Password** — password input with eye toggle
2. **New Password** — password input + password strength indicator (reuse from register page)
3. **Confirm New Password** — password input with match validation

**Password toggle (eye icon):**
```
absolute right-4 top-1/2 -translate-y-1/2
lucide Eye or EyeOff, 16×16, content-tertiary
cursor-pointer hover:text-content-primary
```

**Update button:** Same as Save (Primary style)

#### 4.3 Account Information Card

Same card container. Content as a definition list:

```
dl grid grid-cols-[140px_1fr] gap-y-3

dt: text-body-sm text-content-tertiary
dd: text-body-sm text-content-primary

Items:
  "Member since" → formatted date (e.g. "Feb 15, 2026")
  "Role"         → role badge (text-caption, bg-surface-subtle, rounded-md, px-2 py-0.5)
  "Status"       → green dot (8×8 bg-success rounded-full) + "Active"
  "Email"        → check icon (success) + "Verified" or warning icon + "Not verified"
```

#### 4.4 Connected Accounts Card

Same card container.

```
space-y-3

Each provider row:
  flex items-center justify-between p-4 rounded-xl border border-border-default

  Left:
    flex items-center gap-3
    Icon: Provider logo (24×24) — GoogleIcon or GithubIcon
    Name: text-body-sm font-medium

  Right (connected):
    flex items-center gap-2
    text-caption text-success "Connected"
    Check icon (16×16, success)

  Right (not connected):
    Button: Secondary/Outline style
    text-caption, border border-border-default, rounded-md
    px-4 py-1.5 "Connect"
    hover:bg-surface-subtle
```

---

## 5. Admin Page (`/admin`)

### Layout

```
┌─────────────── Main Content Area (p-6) ──────────────┐
│                                                        │
│  User Management (title)               [🔍 Search]    │
│                                                        │
│  ┌────────────────────────────────────────────┐       │
│  │                                            │       │
│  │  ┌──────┬────────┬──────┬────────┬───────┐│       │
│  │  │ User │ Email  │ Role │ Status │Actions││       │
│  │  ├──────┼────────┼──────┼────────┼───────┤│       │
│  │  │[AV]  │john@.. │ USER │ ●Active│ [⋯]  ││       │
│  │  │John  │        │      │        │       ││       │
│  │  ├──────┼────────┼──────┼────────┼───────┤│       │
│  │  │[AV]  │jane@.. │ADMIN │ ●Active│ [⋯]  ││       │
│  │  │Jane  │        │      │        │       ││       │
│  │  ├──────┼────────┼──────┼────────┼───────┤│       │
│  │  │[AV]  │bob@..  │ USER │ ●Locked│ [⋯]  ││       │
│  │  │Bob   │        │      │        │       ││       │
│  │  └──────┴────────┴──────┴────────┴───────┘│       │
│  │                                            │       │
│  │  ◀ Prev   1  [2]  3  ...  10   Next ▶     │       │
│  │                                            │       │
│  └────────────────────────────────────────────┘       │
└────────────────────────────────────────────────────────┘
```

### Specifications

**Page header:**
```
flex items-center justify-between mb-6

Title:  "User Management"
        text-body-sm font-semibold text-content-primary

Search: Same search bar style as NavBar
        w-64 h-10 bg-surface-secondary rounded-full
        px-4 gap-2 border border-border-default
        lucide Search 16×16 + input text-body-sm
```

#### 5.1 Users Table Card

| Property | Value |
|----------|-------|
| Container | `card` class (same as other cards) |
| Table | Full width, no outer border (card provides it) |

**Table head:**
```
border-b border-border-default

th: text-caption font-semibold text-content-tertiary uppercase tracking-wider
    px-4 py-3 text-left
```

**Table rows:**
```
border-b border-border-default last:border-b-0
hover:bg-surface-subtle transition-colors

td: px-4 py-3 text-body-sm text-content-primary
```

**User cell (first column):**
```
flex items-center gap-3

Avatar: 32×32, rounded-circle, bg-surface-subtle
        Shows initials or image
Name:   text-body-sm font-medium
```

**Role badge:**
```
inline-flex items-center px-2 py-0.5 rounded-md text-caption font-medium

SUPERADMIN: bg-[#edeefc] text-[#4f507f]   (purple)
ADMIN:      bg-[#e6f1fd] text-info         (blue)
USER:       bg-surface-subtle text-content-secondary (neutral)
```

**Status indicator:**
```
flex items-center gap-1.5

Dot:   w-2 h-2 rounded-full
       Active:  bg-success
       Locked:  bg-error
       Inactive: bg-content-disabled

Label: text-body-sm
       Active:  text-content-primary "Active"
       Locked:  text-error "Locked"
       Inactive: text-content-disabled "Inactive"
```

**Actions (three-dot menu):**
```
Trigger: 32×32, rounded-lg, hover:bg-surface-subtle
         lucide MoreHorizontal 16×16

Dropdown (per Dropdown component #7):
  w-[241px] rounded-3xl border border-border-default
  bg-surface-primary shadow-card p-6 (24px)

  Items (per Dropdown spec — ALL text is text-caption 12px/400):
    Active:   bg-surface-inverse text-content-inverse rounded-3xl p-2 gap-2
              icon 16×16 white, text-caption text-content-inverse
    Inactive: no fill, rounded-3xl p-2 gap-2
              icon 16×16, text-caption text-content-primary
    Danger:   no fill, rounded-3xl p-2 gap-2
              icon 16×16 text-error, text-caption text-error

  Menu items:
    "Change Role"  — lucide ShieldCheck 16×16
    "Lock Account"  / "Unlock Account" — lucide Lock or Unlock 16×16
    ──────────── (separator)
    "Delete User"  — lucide Trash2 16×16, text-error (danger item)
```

#### 5.2 Pagination (Component #21)

```
flex items-center justify-center gap-[17px] mt-4

Prev: flex items-center gap-1
      Arrow icon (6x12, stroke 1.8px content-primary)
      "Prev" text-body-sm font-medium text-content-secondary (50% opacity)

Pages: flex items-center gap-2
       Active:   38×38, bg-surface-subtle, border border-content-primary
                 rounded-sm (5px), text-body-sm font-bold, text-content-primary
       Inactive: 38×38, bg-surface-secondary, rounded-sm (5px)
                 text-body-sm font-medium, text-content-primary
       Ellipsis: 38×38, bg-surface-secondary, text-body-sm "..."

Next: flex items-center gap-1
      "Next" text-body-sm font-medium text-content-primary
      Arrow icon (lucide ChevronRight 16×16)
```

#### 5.3 Confirmation Modal (Component #5)

Used for destructive actions (role change, lock, delete).

```
Fixed overlay: bg-black/40 z-50

Modal (Figma Modal spec):
  w-[427px] bg-surface-secondary rounded-3xl (24px)
  border border-border-default shadow-card

  Top section:
    bg-surface-primary border-b border-border-default
    p-6 rounded-t-3xl
    Layout: HORIZONTAL, gap-4

    Title:       text-heading-md (20px/600), text-content-primary
    Description: text-body-sm text-content-secondary

  Bottom section:
    flex justify-end gap-3 p-3

    Cancel: no fill, h-10 px-6 rounded-md
            text-body-sm font-medium text-content-secondary
            tracking-[-0.28px] hover:bg-surface-subtle

    Confirm (normal): bg-surface-inverse text-content-inverse
                      h-10 px-6 rounded-md text-body-sm font-medium
                      tracking-[-0.28px]

    Confirm (danger): bg-error text-white
                      h-10 px-6 rounded-md text-body-sm font-medium
                      tracking-[-0.28px]
```

#### Admin-specific actions:

| Action | Modal Title | Confirm Button |
|--------|------------|----------------|
| Change Role | "Change user role" | "Change Role" (primary) + role selector in description |
| Lock | "Lock user account" | "Lock Account" (danger) |
| Unlock | "Unlock user account" | "Unlock" (primary) |
| Delete | "Delete user" | "Delete" (danger) |

**Role change**: Inside modal description area, add a simple radio/select:
```
"Change role for {user.email}"
Select: rounded-lg border, h-10 px-4
  Options: USER / ADMIN / SUPERADMIN
```

---

## 6. DashboardLayout Changes

### Current: Sidebar + NavBar + Content
### Proposed: Sidebar + NavBar + Content + Right Panel (conditional)

```tsx
<div className="min-h-screen bg-surface-secondary">
  {/* Sidebar (left, fixed) */}
  <Sidebar />

  {/* Mobile sidebar overlay */}

  {/* Main area */}
  <div className="transition-[margin] duration-200 lg:ml-[212px]"
       style={{ marginRight: showRightPanel ? '280px' : '0' }}>

    <NavBar />

    <main className="p-4 lg:p-6">
      {children}
    </main>
  </div>

  {/* Right panel (optional, dashboard only) */}
  {showRightPanel && <RightPanel />}
</div>
```

The right panel only shows on `/dashboard` route. Profile and Admin pages use the full width.

---

## 7. Responsive Breakpoints

| Breakpoint | Sidebar | Right Panel | Content | NavBar |
|-----------|---------|-------------|---------|--------|
| `< 768px` (mobile) | Hidden (overlay) | Hidden | Full width, p-4 | Hamburger + avatar |
| `768–1024px` (tablet) | Collapsed (68px) | Hidden | Fluid, p-6 | Full with search |
| `> 1024px` (desktop) | Expanded (212px) | Visible (280px, dashboard only) | Fluid between sidebars | Full |

---

## 8. New Components Needed

| Component | Location | Used By |
|-----------|----------|---------|
| `RightPanel` | `components/layout/RightPanel.tsx` | Dashboard only |
| `MetricCard` | `components/dashboard/MetricCard.tsx` | Dashboard |
| `ChartCard` | `components/dashboard/ChartCard.tsx` | Dashboard (wrapper) |
| `ProfileForm` | `components/profile/ProfileForm.tsx` | Profile |
| `ChangePasswordForm` | `components/profile/ChangePasswordForm.tsx` | Profile |
| `AccountInfo` | `components/profile/AccountInfo.tsx` | Profile |
| `ConnectedAccounts` | `components/profile/ConnectedAccounts.tsx` | Profile |
| `UsersTable` | `components/admin/UsersTable.tsx` | Admin |
| `Pagination` | `components/ui/Pagination.tsx` | Admin (reusable) |
| `ConfirmModal` | `components/ui/ConfirmModal.tsx` | Admin (reusable) |
| `ActionDropdown` | `components/admin/ActionDropdown.tsx` | Admin |
| `Breadcrumbs` | `components/ui/Breadcrumbs.tsx` | NavBar |
| `SearchBar` | `components/ui/SearchBar.tsx` | NavBar, Admin |

---

## 9. Chart Library Recommendation

**recharts** (React-specific, declarative, lightweight):
- `LineChart` for Total Users
- `BarChart` for Traffic by Device, Marketing & SEO
- `PieChart` (donut variant) for Traffic by Location
- Horizontal bars: custom component or `BarChart layout="vertical"`

Alternative: **chart.js** + **react-chartjs-2** if user prefers.

For the initial implementation, charts will use **placeholder/mock data** since there's no analytics backend. The chart components will accept data as props so they can be connected to real APIs later.

---

## 10. Dark Mode Considerations

All components use semantic tokens, so dark mode works automatically EXCEPT:

| Element | Light | Dark | Implementation |
|---------|-------|------|----------------|
| Metric card bg (purple) | `#edeefc` | `#2a2a3d` | CSS var `--metric-purple` |
| Metric card bg (blue) | `#e6f1fd` | `#1e2d3d` | CSS var `--metric-blue` |
| Chart colors | Fixed palette | Same palette | No change needed |
| Notification icon bg | `#edeefc` / `#e6f1fd` | Same dark variants | Same CSS vars |
| Role badges | `#edeefc` / `#e6f1fd` | Same dark variants | Same CSS vars |

Add to `globals.css`:
```css
:root {
  --metric-purple: #edeefc;
  --metric-blue: #e6f1fd;
  --notification-purple: #edeefc;
  --notification-blue: #e6f1fd;
}
.dark {
  --metric-purple: #2a2a3d;
  --metric-blue: #1e2d3d;
  --notification-purple: #2a2a3d;
  --notification-blue: #1e2d3d;
}
```

---

## Summary — What Changes vs. Current Code

| File | Change |
|------|--------|
| `Sidebar.tsx` | **Rewrite** — Add section labels, match 212px width, Figma-style nav items, section separators |
| `NavBar.tsx` | **Rewrite** — Add breadcrumbs (left), search bar, action icons (right), match h-[68px] |
| `DashboardLayout.tsx` | **Update** — Support right panel, adjust sidebar width from 220→212px |
| `globals.css` | **Add** — 4 new CSS vars for metric/notification colors |
| `tailwind.config.ts` | **Add** — Map new CSS vars to Tailwind tokens |
| `/dashboard/page.tsx` | **Rewrite** — Full dashboard with metric cards, charts, page header |
| `/profile/page.tsx` | **Rewrite** — 4-section profile page |
| `/admin/page.tsx` | **Rewrite** — Users table with pagination, search, action dropdown, confirm modal |
| **13 new component files** | As listed in Section 8 |

---

## Appendix: Design System Compliance Audit

### Documented Components Used — Exact Compliance

| Design System Component | Used In | Compliance |
|------------------------|---------|------------|
| **#3 Sidebar Items** | Sidebar | ✅ Active: fill 5%, radius 24px, pad 8px, gap 4px. Inactive: no fill, radius 12px. Icons 20×20, text 14px/400 |
| **#5 Modal** | Admin ConfirmModal | ✅ 427px, bg secondary, radius 24px. Top: white, pad 24px, gap 16px horizontal. Buttons: pad 12px, radius 6px, h40, 14px/500, **tracking -0.28** |
| **#7 Dropdown** | Admin ActionDropdown | ✅ 241px, bg white, radius 24px, **pad 24px**. Active: fill inverse, text 12px/400 white. Inactive: text 12px/400. Delete: text error |
| **#8 Analytics Graph** | Dashboard Charts | ✅ Radius 16px, pad 24px, gap 16px. Active label 14px/600, inactive 14px/400 40%, divider 20%, tags 12px/400 |
| **#10 Breadcrumbs** | NavBar | ✅ Gap 8px, items radius **8px**, divider **14px/400 20%** opacity |
| **#18 Button Set** | All buttons | ✅ Primary: fill inverse, text inverse, radius 6px, border. Medium: h40, pad 10/24, 14px/500 |
| **#21 Pagination** | Admin table | ✅ Gap 17px, active 38×38 fill 5% + stroke, radius 5px, 14px/700. Inactive fill secondary, 14px/500. Prev **50%** opacity |
| **Common: Card Container** | All cards | ✅ bg-surface-primary, border-default, shadow-card, rounded-2xl, p-6 |
| **Common: Input Field** | Profile forms | ✅ h48, transparent, border, rounded-lg (8px), pad 12/16, 15px/400, label 15px/600 |
| **Common: Input States** | Profile forms | ✅ hover/focus outline 2px offset-2px, error outline error color 75% |
| **Common: Button Primary** | All primary buttons | ✅ bg #1c1c1c, text white, border 5%, radius 6px |
| **Common: Button Secondary** | Profile/Admin | ✅ bg transparent, text primary, border, hover:bg-surface-subtle |
| **Common: Icons** | Global | ✅ lucide-react, 16×16 default. Nav icons 20×20 per Component #3 |
| **Common: Active/Inactive** | Sidebar, tabs | ✅ Active fill 5% or solid inverse. Inactive no fill or secondary |

### Components NOT Modified (preserved as-is)

Calendar (#4), Tabs (#6), Search Results (#9), Tooltip (#11), Quick Notification (#12), Payment Form (#13), Speedometer (#14), Notification (#15), Input Phone (#16), Input Currency (#17), Toggle (#19), Slider (#20), Input Text (#22), Search Field (#23), Toast (#24), Checkboxes (#25), Selector Trigger, Password Check, Links/Text Links, Decorative Grid.

**Zero documented components were replaced or overridden.**
