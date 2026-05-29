# Audit: ui-design-system.md vs UI Core code (2026-05-02)

**Ticket**: SCRUM-329 (Part A)
**Plan**: ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-329_frontend.md
**Status**: Audit complete, awaiting user review before opening Part B sub-tickets.

## Anchors (for reproducibility)

This audit reflects the state of these specific commits. If either repo advances, re-run the methodology below to detect new drift.

- **Code (em-ecosystem)**: `8d2fa80c2a4443560845f785462f42dde0bb7c5c` (`main`, post-SAT01-5 round 2)
- **Doc (ai-specs)**: `4412163bcf4dce8650ca58e10bd102a670e7c0b4` (`main`, post-SAT01-5 docs commit)

## Methodology

Reproducible procedure used to produce the audit table. Every claim in this document traces back to one of these commands run against the anchor commits above.

```bash
# 1. Code component inventory (the universe to classify)
ls em-ecosystem-code/nexacore-dashboard/src/components/ui/*.tsx | wc -l
# → 48

# 2. Spec exports inventory (authoritative documented values per component)
grep -rE '^export const \w+(Specs|Variants|Sizes|Classes)\s' \
  em-ecosystem-code/nexacore-dashboard/src/components/ui/
# → 41 exports across 38 distinct files (some files export multiple, e.g. Button has variantClasses + sizeClasses + linkSizeClasses)

# 3. Registry catalog (cross-reference layer between code and doc)
cat em-ecosystem-code/nexacore-dashboard/src/lib/component-registry.ts
# → 30 entries, each with name + category + description + files[]
# Some entries aggregate multiple files (Modal=2, Feedback/Alerts=6, Command Palette=2, Charts=3)

# 4. Doc section enumeration
grep -nE '^### [0-9]+\.' ai-specs/ai-specs/specs/ui-design-system.md
# → 25 numbered component sections (### 1. Card through ### 25. Checkboxes)
grep -nE '^### ' ai-specs/ai-specs/specs/ui-design-system.md | wc -l
# Plus 13 Common Patterns subsections under "## Common Patterns"

# 5. For each of 48 components, classification follows this decision rule:
#    a. Does the spec export's documented values match the doc section text?  → Documented-Aligned
#    b. Does a doc section exist but values disagree?                          → Documented-Drifted (Notes WHAT drifted)
#    c. Is there no own doc section (may be passing-mention elsewhere)?        → Missing-from-doc
#    d. Doc section exists but no code component implements it?                → Doc-only (separate subsection)
#    e. Doc mapping is unclear (multiple plausible sections)?                  → Ambiguous (separate subsection)
```

**Authoritative source for "Aligned vs Drifted" comparison**: the spec export object inside each `.tsx` file (e.g., `tooltipSpecs`, `buttonVariants`, `sliderSpecs`). NEVER inferred from JSX class strings. Components without a spec export fall back to JSX-based comparison and are noted accordingly.

---

## Summary

| Metric | Count |
|---|---|
| Code files (`nexacore-dashboard/src/components/ui/*.tsx`) | 48 |
| Registry entries (`component-registry.ts`) | 30 |
| Doc sections (`ui-design-system.md` `## Components`) | 25 numbered sections + 13 `## Common Patterns` subsections |

### Classification distribution (over the 48 code rows)

| Classification | Count |
|---|---|
| Documented-Aligned | 2 |
| Documented-Drifted | 15 |
| Missing-from-doc | 29 |
| Ambiguous | 2 |
| **Total** | **48** |

### Doc-only candidates (separate, not in 48 rows)

| Count |
|---|
| 4 numbered sections that have no code component (§2 Icon Set, §8 Analytics Graph, §13 Payment Form, §14 Speedometer) — and §12 Quick Notification + §15 Notification represent UI patterns the dashboard doesn't yet build (handled separately) |

### Narrative

The doc is **fragmented and behind code**. Of 48 components in code, only 2 are cleanly documented (Toggle in §19, InlineError as part of Common Patterns "Input Field error message"). Most code (29/48 ≈ 60%) has no own doc section at all — these are mostly later additions (auth-specific atoms, spinners, advanced primitives) that grew without doc updates. 15 rows are "Drifted" — they have a doc section, but the documented values (often pixel dimensions or visual variants) no longer match the implementation, which has consolidated to design-token classes and grown additional variants/sizes/states. 4 doc sections describe components that were never built in code (Analytics Graph, Payment Form, Speedometer, Icon Set) — these are aspirational UI patterns from the original Figma kit. The doc also fragments `Input` into 3 sections (Phone §16, Currency §17, Text §22), while code has unified into a single component with size and variant props. 2 components are ambiguous (SearchTrigger, ThemeToggle) — the doc implies multiple possible mappings and explicit user disambiguation is needed before Part B can edit those sections.

---

## Audit table

Legend for **Classification**:
- **Documented-Aligned** — doc section exists and the spec export's key values are consistent with it
- **Documented-Drifted** — doc section exists but values disagree with the code's spec export or JSX
- **Missing-from-doc** — code component exists, no own doc section (may be referenced in passing elsewhere)
- **Doc-only** — listed in the separate Doc-only section below
- **Ambiguous** — doc mapping is unclear; listed in the Ambiguities section

| # | Component | Code file | Spec export(s) | Registry entry | Doc section | Classification | Notes |
|---|---|---|---|---|---|---|---|
| 1 | Accordion | `ui/Accordion.tsx` | `accordionSpecs` (line 19) | (none) | (none) | Missing-from-doc | Code has 2 trigger variants (default, section), divider option, ChevronDown rotate animation, 200ms grid-row CSS animation. Not registered in the doc at all. |
| 2 | AlertBox | `ui/AlertBox.tsx` | `alertBoxSpecs` (line 34) | Feedback / Alerts | (none) | Missing-from-doc | Inline boxed alert, 4 variants (warning/error/info/success). Doc has §24 Toast (a different component) and Common Patterns Input Field error (a different component) but no boxed inline-alert section. |
| 3 | Avatar | `ui/Avatar.tsx` | `sizeClasses` (line 24) | Avatar | (none) | Missing-from-doc | Avatar mentioned in passing only — §9 Search Results ("32x32"), §15 Notification ("40x40 ellipse, dual shadow"), Common Patterns Selector Trigger ("32x32 circle, bg #1c1c1c 5%"), and `--radius-circle` token. Code has 3 sizes (sm/md/lg = 32/40/64), name-fallback initials, image error fallback to User icon. No own section. |
| 4 | Badge | `ui/Badge.tsx` | `variantClasses` + `sizeClasses` | Badge | (none) | Missing-from-doc | Code has 7 variants (default, success, warning, error, info, kbd, overlay) and 3 sizes. Registry says "6 color variants + kbd + overlay, 3 sizes" — matches code (registry is accurate; the doc itself just doesn't have a Badge section). Tags appear in §8 Analytics Graph as "padding 2/8/2/4, radius 8px". |
| 5 | BeforeAfterSlider | `ui/BeforeAfterSlider.tsx` | `beforeAfterSliderSpecs` (line 27) | Before / After Slider | (none) | Missing-from-doc | Image comparison slider, horizontal+vertical orientations, click-to-jump and drag, clip-path-based labels. Not in the doc at all. |
| 6 | Breadcrumbs | `ui/Breadcrumbs.tsx` | `breadcrumbsSpecs` (line 16) | Navigation | §10 Breadcrumbs | Documented-Drifted | Drift: doc says home icon 20x20 (no specific lucide name), separator is text "/" 14px 20% opacity. Code uses `Birdhouse` (lucide) at 16px and `ChevronRight` 16px as separator with `text-content-tertiary`. Doc lacks the auto-collapse via ResizeObserver behavior the code implements. |
| 7 | Button | `ui/Button.tsx` | `variantClasses` + `sizeClasses` + `linkSizeClasses` | Button | §18 Button Set | Documented-Drifted | Drift: doc §18 lists 8 visual states (Primary, Secondary, Active, Secondary Active, Hover, Secondary Hover, Disabled, Secondary Disabled) — but those are state/hover renderings of 2 variants. Code exports 6 distinct variants: `primary`, `secondary`, `outline`, `danger`, `link`, `link-underline`. Doc does not document `outline`, `danger`, `link`, `link-underline`. Padding in doc is "21/36" pixels (lg) / "10/24" (md) — code uses Tailwind tokens `px-8 py-3` (lg = 32/12) and `px-6 py-2.5` (md = 24/10). Common Patterns Button (Primary) section partially covers it but still uses pixel values. |
| 8 | Calendar | `ui/Calendar.tsx` | `calendarSpecs` (line 50) | Calendar | §4 Calendar | Documented-Drifted | Drift: doc says container radius 24px (`rounded-3xl`), code uses `rounded-xl` (12px). Doc only mentions "days" view; code has 3 view modes (days/months/years) with `grid-cols-3` for months/years. Doc back/forward arrows shown as 24x24 rounded-1000px buttons; code uses `w-6 h-6 rounded-full` icon buttons with `ChevronLeft/Right` 16px. Doc says weekday headers 12px/400; code uses `text-caption font-normal text-center`. |
| 9 | Checkbox | `ui/Checkbox.tsx` | `checkboxSpecs` (line 29) | Checkbox | §25 Checkboxes | Documented-Drifted | Drift: doc only documents 2 states (checked, unchecked) at 20×20 with radius 5px. Code adds `indeterminate` state and 3 sizes (sm 16×16/4px, md 20×20/5px, lg 24×24/6px). Checked color and label spec match (md size). Disabled state present in code, missing in doc. |
| 10 | CommandPalette | `ui/CommandPalette.tsx` | `commandPaletteSpecs` (line 28) | Command Palette | (none) | Missing-from-doc | Cmd+K dialog with search, groups, items, shortcuts. cmdk library. No own section in doc. Could conceptually relate to §9 Search Results but the layout/interaction model is different (modal overlay, not inline panel). |
| 11 | ConfirmModal | `ui/ConfirmModal.tsx` | `confirmModalSpecs` (line 8) | Modal | §5 Modal | Documented-Drifted | Drift: doc says fixed 427×159 with `radius 24px` (`rounded-3xl`). Code uses `rounded-xl` (12px) and 4 sizes (sm 390 / md 480 / lg 600 / xl 720 — `max-w-*`). Doc has 1 button variant (Cancel + Confirm), code has `primary` and `danger` variants. Code adds X close button (top-right), focus trap, autofocus rules, Enter-submits. Doc has no MFA/danger styling guidance and no size scale. |
| 12 | CopyField | `ui/CopyField.tsx` | `copyFieldSpecs` (line 7) | CopyField, QR Code Card | (none) | Missing-from-doc | Read-only copyable text with Copy/Check icon toggle. 2 sizes (sm h-10 / md h-12). No own doc section. |
| 13 | CountdownTimer | `ui/CountdownTimer.tsx` | (no spec export) | Feedback / Alerts | (none) | Missing-from-doc | Animated digit-box countdown (MM:SS or SS), 2 variants (error/warning), 2 sizes (sm/lg). Vertical slide-in animation per digit change. Not in doc. |
| 14 | DataTable | `ui/DataTable.tsx` | (no spec export) | DataTable | (none) | Missing-from-doc | Generic data table with column config, sorting hooks via render functions, loading skeleton rows, empty state, optional row click. Not in doc. |
| 15 | DateInput | `ui/DateInput.tsx` | `dateInputSpecs` (line 25) | Input (registry groups with Input.tsx) | (none) | Missing-from-doc | Date input wrapper with calendar dropdown popover, 2 sizes (sm h-10 / md h-12), error state. No own doc section; closest relation is Common Patterns Input Field. |
| 16 | Divider | `ui/Divider.tsx` | `dividerSpecs` (line 7) | Divider | (none) | Missing-from-doc | 3 types: line, label (centered text), vertical. Uses `bg-border-strong` (0.08 opacity). The "/" and "|" dividers in §10 and §8 are inline text dividers, not the same component. No own section. |
| 17 | EmailSelector | `ui/EmailSelector.tsx` | `emailSelectorSpecs` (line 8) | (none — but related to Select / Dropdown) | Common Patterns "Selector Trigger" (Bordered variant) | Documented-Drifted | Drift: Common Patterns says trigger should be **`rounded-full`** pill (h-40px, px-16px) and is named the "Bordered" variant. Code exports `rounded-md` (6px), `px-6 py-2.5`. Dropdown content `rounded-xl` (12px) matches the pattern's `rounded-3xl` (24px) only loosely. Option uses `rounded-md` matching the pattern's `rounded-md` row. |
| 18 | EmptyState | `ui/EmptyState.tsx` | `emptyStateSpecs` (line 6) | EmptyState | (none) | Missing-from-doc | Icon (default Inbox 48px) + title + description + optional action. Mentioned only in passing inside Common Patterns "Selector Trigger" Results Card ("centered text 'No results', 14px"). No own section. |
| 19 | ErrorAlert | `ui/ErrorAlert.tsx` | (no spec export) | Feedback / Alerts | (none) | Missing-from-doc | Boxed error card with optional dismiss IconButton. Renders `border-error-border bg-error-bg`, `rounded-xl`, `p-4`. Custom inline SVG (info-circle stroke 1.5). Not in doc. |
| 20 | FormField | `ui/FormField.tsx` | `formFieldSpecs` (line 5) | FormField | (none) | Missing-from-doc | Wrapper for label + control + InlineError. Common Patterns Input Field describes label/error styling but not the wrapper component. No own section. |
| 21 | IconBadge | `ui/IconBadge.tsx` | `iconBadgeSpecs` (line 12) | Badge (registry groups with Badge.tsx) | (none) | Missing-from-doc | Square icon container, 5 variants (default/success/warning/error/info), 3 sizes (sm 32 / md 40 / lg 56). §2 Icon Set describes 28x28 icon frames with cornerRadius 8px which is conceptually the same primitive but with different dimensions (28 vs 32/40/56). Treated as Missing-from-doc since §2 is more of an "Icon Set toolbar" than a generic IconBadge primitive. |
| 22 | IconButton | `ui/IconButton.tsx` | `sizeClasses` (line 23) + `variantClasses` | (none) | (none) | Missing-from-doc | 4 variants (default, danger, boxed, boxed-hover) + an "inside input" variant in `variantClasses`. 2 sizes (sm `p-2` / md `p-3`). Tooltip integration. Not in doc. The `usage` export hints at where it's used (theme toggle, copy secret, password eye, calendar nav, calendar day). |
| 23 | IdleWarningModal | `ui/IdleWarningModal.tsx` | (no spec export) | Modal (registry groups with ConfirmModal.tsx) | (none) | Missing-from-doc | Specific modal for idle session warning. CountdownTimer + message + "Keep me signed in" Button. `w-[340px] rounded-xl border-border-strong bg-surface-secondary p-6 shadow-card`. Not the standard ConfirmModal structure. Not in doc. |
| 24 | ImageCropper | `ui/ImageCropper.tsx` | `imageCropperSpecs` (line 10) | Image Cropper | (none) | Missing-from-doc | Avatar circular crop modal using `react-easy-crop` + Slider for zoom. Output JPEG 0.9 quality. Not in doc. |
| 25 | InfinitySpinner | `ui/InfinitySpinner.tsx` | `infinitySpinnerSpecs` (line 23) | Spinner | (none) | Missing-from-doc | Figure-8 SVG dashoffset animation, 3 sizes (sm 16 / md 24 / lg 32), used inside Buttons during loading. Replicates DaisyUI v5 `loading-infinity`. No own doc section. |
| 26 | InlineError | `ui/InlineError.tsx` | `inlineErrorSpecs` (line 5) | Feedback / Alerts | Common Patterns "Input Field" error message | Documented-Aligned | Spec export checked: `inlineErrorSpecs` — `AlertTriangle 16px shrink-0 text-error` + `text-caption leading-6 text-error`. Doc Common Patterns Input Field section says "error message: Inter 12px/400, --color-error 100%; icon lucide/triangle-alert 16x16 at 100% opacity" — matches. |
| 27 | Input | `ui/Input.tsx` | `inputSpecs` (line 27) | Input | §16 Input Field (Phone) + §17 Input Field (Currency) + §22 Input Field (Text) + Common Patterns "Input Field" | Documented-Drifted | Drift (multi-axis): (a) Doc fragments into 3 numbered sections by use case (Phone with country code prefix; Currency with USD suffix; Text as 360×56 pill `radius 100px`) — code is a single unified `Input` with `size: sm \| md` and `variant: default \| filled` props. (b) Doc says pill `rounded-full` for Text variant; code uses `rounded-lg` (8px) for all variants. (c) Code has `filled` variant (search bars, dropdowns) — not documented. (d) Code has password toggle, loading spinner, leftIcon/rightIcon — not in §16/17/22. Common Patterns Input Field captures the default state model (border + outline) accurately for the form variant but doesn't reconcile with the §16/17/22 fragments. |
| 28 | LanguageSelector | `ui/LanguageSelector.tsx` | `languageSelectorSpecs` (line 21) | Select / Dropdown | Common Patterns "Selector Trigger" (Borderless variant) | Documented-Drifted | Drift: Common Patterns says Borderless trigger is `rounded-full` h-40px. Code uses `rounded-md` h-10. Popover container `rounded-xl` matches the pattern's `rounded-3xl` only loosely (12 vs 24). Option uses `rounded-md` (matches the pattern's row spec `rounded-md` for menu items). Pattern says popover gap with trigger 4px (`mt-1`/`mb-1`) — verify in JSX (not asserted in spec export). |
| 29 | MfaDigitInput | `ui/MfaDigitInput.tsx` | `mfaDigitInputSpecs` (line 5) | Digit Input | (none) | Missing-from-doc | Multi-cell digit input (default 6 cells), auto-advance, paste-to-distribute, error state, inputMode=numeric. No own doc section despite being a key MFA flow primitive. |
| 30 | Pagination | `ui/Pagination.tsx` | `paginationSpecs` (line 20) | Navigation | §21 Pagination | Documented-Drifted | Drift: doc says active page **38×38** with `fill #1c1c1c 5%` + `stroke 1px #1c1c1c` + `radius 5px` + text 14px/700; inactive **38×38** `fill #fbfbfb` + `radius 5px`. Code uses `h-8 w-8` (**32×32**), `rounded-md` (6px), and active=**`bg-surface-inverse`** (filled DARK, not light 5%). Doc has Prev/Next as text labels; code uses lucide `ChevronLeft/Right` icons in arrow buttons. Doc gap "8px"; code `gap-1` (4px). |
| 31 | QrCodeCard | `ui/QrCodeCard.tsx` | `qrCodeCardSpecs` (line 6) | QR Code Card | (none) | Missing-from-doc | QR image (192×192) above CopyField for the secret. White bg always (not theme-aware so QR remains scannable). Not in doc. |
| 32 | RateLimitBanner | `ui/RateLimitBanner.tsx` | (no spec export) | Feedback / Alerts | (none) | Missing-from-doc | Inline banner with Lock/AlertTriangle icon + message + CountdownTimer. Used during rate-limit lockouts. Not in doc. |
| 33 | RecoveryCodesGrid | `ui/RecoveryCodesGrid.tsx` | `recoveryCodesGridSpecs` (line 7) | Recovery Codes Grid | (none) | Missing-from-doc | 2-col grid of monospace codes inside `bg-surface-subtle p-4` card with copy-all Button below. Not in doc despite being a documented Registry primitive. |
| 34 | RingSpinner | `ui/RingSpinner.tsx` | `ringSpinnerSpecs` (line 24) | Spinner | (none) | Missing-from-doc | Ripple/sonar SVG SMIL animation, 3 sizes (sm 16 / md 24 / lg 32), used for page loading. Replicates DaisyUI v5 `loading-ring`. No own doc section. |
| 35 | SearchTrigger | `ui/SearchTrigger.tsx` | `searchTriggerSpecs` (line 6) | Command Palette | (Ambiguous — see below) | Ambiguous | Could map to §9 Search Results (a search input with results panel — different shape: 360×48 input + 360×333 results), §23 Search Field (a search input with embedded button — different: 351×54 with 94×40 inner button), or "Missing-from-doc" (it's actually a tiny button-styled trigger that opens the CommandPalette). Code uses `Button outline sm` tokens: h-8, rounded-md, with Search icon + "Search..." label + kbd Badge. None of the doc sections describe this exact pattern. See Ambiguities section below. |
| 36 | SegmentedControl | `ui/SegmentedControl.tsx` | `segmentedControlSpecs` + `sizeClasses` | (none) | (none) | Missing-from-doc | 3 variants (primary/secondary/outline) + 3 sizes (sm/md/lg). Container `rounded-lg bg-surface-subtle p-1`. Distinct from §6 Tabs (different visual: tabs has filled active state with border, segmented has shadow-sm and lives inside a single bordered group). No own section. |
| 37 | Select | `ui/Select.tsx` | `selectSpecs` (line 23) | Select / Dropdown | §7 Dropdown | Documented-Drifted | Drift: doc §7 shows a 6-item context menu with `radius 24px` (rounded-3xl) container, `radius 24px` items, padding 24, an active dark-fill item, and a special "Delete" red item. Code Select is a form `<select>`-like dropdown: trigger button h-10 `rounded-md`, dropdown `rounded-xl` p-6, items `rounded-md` h-10, has `selected` (dark fill) and `danger` (red text) variants. Concept matches but specific values diverge significantly. Note: §7 Dropdown could plausibly map to a future `ContextMenu` component instead — see Ambiguities. |
| 38 | SidebarNav | `ui/SidebarNav.tsx` | `sidebarNavSpecs` (line 41) | Sidebar | §3 Sidebar Items | Documented-Drifted | Drift: doc §3 shows simple 180×76 frame with active (5% fill, radius 24px, padding 8px) and inactive (no fill, radius 12px, padding 8px) tabs. Code is far more sophisticated: collapsed/expanded states, sections with headers, accordion children with parent toggle, flyout popovers (createPortal) on hover when collapsed, Tooltip on collapsed leaf items, integrates `Tabs variant=nav` and `IconButton boxed`. Doc covers visual tab style only; code adds whole interaction model. |
| 39 | Slider | `ui/Slider.tsx` | `sliderSpecs` (line 17) | Slider | §20 Slider | Documented-Drifted | Drift: doc says track 167×3, thumb 18×18 with stroke 3px `#000000`. Code track is 8px height with `rounded-full` and `border-2 border-border-components`; thumb 16×16 with `border-2`. Behaviors match (range slider with progress fill); pixel values disagree. |
| 40 | Spinner | `ui/Spinner.tsx` | `spinnerSpecs` (line 6) | Spinner | (none) | Missing-from-doc | Generic circular border spinner, 3 sizes (sm 16 / md 24 / lg 32), uses `border-border-strong border-t-content-primary`. Documented in registry as "circular, infinity, ring — 3 sizes" alongside InfinitySpinner and RingSpinner, but no doc section. Spec includes a `delayPattern` note: "300ms delay before showing — prevents flash on fast responses". |
| 41 | StickyCard | `ui/StickyCard.tsx` | (no spec export) | (none) | (none) | Missing-from-doc | Position-aware card (top/bottom) that becomes fixed when scrolled past viewport, with mobile collapsible strip. Uses IntersectionObserver + ResizeObserver. Not registered, not documented. |
| 42 | Tabs | `ui/Tabs.tsx` | `tabsSpecs` (line 61) + `variantStyles` + `sizeClasses` | Tabs | §6 Tabs | Documented-Drifted | Drift: doc §6 shows only the "subtle" variant (300×37 horizontal bar with `radius 5px` container, active fill `#fbfbfb`, inactive border-only). Code has 3 variants: `subtle` (matches doc loosely), `nav` (vertical sidebar nav, `rounded-md`), `nav-horizontal` (top nav bar). 3 sizes (sm h-8 / md h-10 / lg h-12) for subtle only. Code adds horizontal-scroll overflow with drag-to-scroll + dot indicators (mobile only). Doc lacks all of nav, nav-horizontal, sizes, and overflow handling. |
| 43 | ThemeToggle | `ui/ThemeToggle.tsx` | (no spec export) | (none) | (Ambiguous — Theme System "Toggle Component" line 126 vs no own section) | Ambiguous | Doc has a "Toggle Component" subsection nested inside `## Theme System (Light / Dark)` (line 126) describing `sun-dim` (16x16) + `moon` (16x16) icons inactive 50% / active 100%. Code uses `Sun` (not `sun-dim`) and `Moon` (lucide), wrapped in `IconButton variant=boxed size=sm` with tooltip. Could be considered "Documented but in the Theme section, not Components" or "Missing from Components list". See Ambiguities section. |
| 44 | Toast | `ui/Toast.tsx` | (no spec export) | Feedback / Alerts | §24 Toast Message | Documented-Drifted | Drift: doc says 416×84, `radius 100px (pill)`, padding 24h/16v, gap 8px, icon 16×16 stroke 2px (`triangle-alert`/`circle-check`/`circle-alert`/`file-exclamation-point`). Code uses `rounded-3xl` (24px, NOT pill 100px), `max-w-[550px]`, `py-3 pl-5 pr-4`, icon size **14** (not 16), and uses `Info` for info variant (not `file-exclamation-point`). Title typography: doc 12px/600; code `text-caption font-semibold leading-4` (≈ matches). Animation handled via framer-motion, not in doc. |
| 45 | ToastContainer | `ui/ToastContainer.tsx` | (no spec export) | Feedback / Alerts | (none, but §24 covers Toast positioning) | Missing-from-doc | Fixed-position container at `top-6` (24px from top) centered, `gap-2` between toasts. Pulls toast list from `useToast` context. §24 Toast Message describes only the toast pill itself, not the stacking container or animation logic. |
| 46 | Toggle | `ui/Toggle.tsx` | `toggleSpecs` (line 15) | Toggle | §19 Toggle | Documented-Aligned | Spec export checked: `toggleSpecs` — md size = "track: 40×22px · circle: 18px" matches doc §19 ("Switch: 40x22 (GROUP)"). Code adds 2 extra sizes (sm 32×18, lg 48×26) the doc doesn't enumerate but the doc is silent on size variants (does not state "only one size"), so this is treated as a non-conflicting extension. Track/circle colors map to surface-inverse/tertiary/primary tokens — consistent with doc Toggle on/off states. |
| 47 | Tooltip | `ui/Tooltip.tsx` | `tooltipSpecs` (line 26) | Tooltip | §11 Tooltip | Documented-Drifted | Drift: doc says body radius 4px (`--radius-xs`), padding 20/16 (vertical/horizontal), title 16px/700. Code uses `rounded-lg` (8px), padding `px-4 py-3` (16/12), text `text-caption font-normal` (≈ 12px, not 16/700). Arrow: doc 17×17 rectangle rotated, radius 2px; code 8×8 rotate-45 with `border border-border-components` (no explicit radius in spec). Code has 5 positions (top/bottom/left/right/auto with viewport-edge detection) — doc is silent on position behavior. |
| 48 | TurnstileWidget | `ui/TurnstileWidget.tsx` | (no spec export) | (none) | (none) | Missing-from-doc | Cloudflare Turnstile bot-detection widget wrapper (`@marsidev/react-turnstile`). Theme-aware. Not in doc; rendering is the iframe injected by Cloudflare, so doc-side reconciliation is mostly about where/when to render it (auth pages). |

---

## Doc-only candidates

Numbered doc sections that have **no matching code component** in the 48-file inventory.

### §2. Icon Set
> Toolbar-style icon row for header actions. 136×28, gap 8px, 4 icons (Light Theme/History/Notification/Sidebar) each in 28×28 frame, padding 4px, cornerRadius 8px.

- **Recommendation**: **merge or remove**. This is not a single component — it's a grouping of 4 separate IconButtons in the header. The IconButton primitive in code (`ui/IconButton.tsx`) is what actually renders these. Suggest removing §2 and adding an "Icon Set / header toolbar" example inside the future IconButton documentation in Part B.

### §8. Analytics Graph
> Chart card 538×330, radius 16px, padding 24, with title tabs, legend tags (radius 8px, dot+name), y-axis numbers, graph 451×244 frame.

- **Recommendation**: **keep but rewrite**. The closest code is `nexacore-dashboard/src/components/dashboard/TotalUsersChart.tsx` (registry: "Charts" entry, not in `ui/`). Recharts SVG. Doc spec is for an aspirational Figma chart card; code uses Recharts. Either rewrite to describe `ChartCard` + Recharts patterns, or remove and let the registry "Charts" entry stand alone.

### §13. Payment Form
> Multi-field payment card form, 400×420, radius 24, with Card number / Expiration+CVV / Cardholder name fields and Submit button. Fields use `radius 8px`, padding 12/16.

- **Recommendation**: **remove**. No payment flow exists yet (Phase D in product roadmap). When Stripe billing is implemented, the form will use `Input` + `FormField` primitives — no need for a section that describes a yet-to-be-built composite. Re-add later as a usage example, not a primitive.

### §14. Speedometer
> Gauge/meter visualization, 260×252 group, with vector arcs, scale labels, handle, arrow, percentage display.

- **Recommendation**: **remove**. No code implementation. Was an early Figma kit element; no current page renders a speedometer. If a usage gauge is needed later, build with Recharts and document the new pattern there.

### §12. Quick Notification (and §15. Notification)

> §12: Inline notification banner 400×72 with avatar stack and chevron, `radius 100px`. §15: Message notification card 400×174 with avatar/content/comment count/View button.

- **Recommendation**: **defer decision**. Not currently in code. Notification system is a Phase C item (per product-roadmap.md). These two sections describe distinct UI patterns (notification banner vs notification card) that may or may not be built once notifications are implemented. Keep for now, revisit when SCRUM-3xx Notifications work begins.

> §1 Card maps to code via the registry "Card" entry which lists `globals.css` (the `card-flat` / `card-container` CSS classes). This is not a `.tsx` component, so it falls into the "Out-of-ui-folder" footnote rather than Doc-only — see below.

---

## Ambiguities requiring user decision

### Ambiguity 1 — `SearchTrigger.tsx` mapping

| Possible mapping | Rationale |
|---|---|
| §9 Search Results | Doc §9 describes a "Search Bar" 360×48 input + 360×333 results panel. SearchTrigger is also a search-related primitive but is just the **trigger button** that opens the CommandPalette, not the input itself or the results panel. The CommandPalette is the dropdown/results-equivalent. |
| §23 Search Field | Doc §23 is a 351×54 search input with embedded "Search" button (`radius 100px` pill). SearchTrigger is similar in spirit (a clickable search affordance) but is `rounded-md` h-8 with a kbd Badge — not a pill input. |
| Missing-from-doc (recommended) | SearchTrigger is functionally a `Button outline sm` styled to look like a search affordance. It exists to open `CommandPalette`. The doc has neither §9 nor §23 in code form; the actual interaction the user sees is `SearchTrigger → CommandPalette modal`. Cleanest path: drop §9 and §23 (or merge into a single "Search" section) and add `SearchTrigger` as a sub-item under `CommandPalette`. |

**Recommended interpretation**: classify as **Missing-from-doc** in Part B. Drop §9 and §23 (no current code maps to either as drawn), and add a new "Search / Command Palette" section that documents `SearchTrigger` (the trigger button) + `CommandPalette` (the modal dialog).

### Ambiguity 2 — `ThemeToggle.tsx` mapping

| Possible mapping | Rationale |
|---|---|
| `## Theme System (Light / Dark) → Toggle Component` (line 126, currently a subsection of Theme System) | Doc explicitly documents the icons (sun-dim 16x16 + moon 16x16) and active/inactive states for the theme switcher. Most of the spec is about the icons, not the button shell. Code wraps these icons in `IconButton variant=boxed size=sm`, so the visual frame is documented elsewhere (or implicitly via IconButton — which has no own section). |
| Missing-from-doc | The "Components" list (§1-§25) does not have a Theme Toggle section. The spec lives under the Theme System chapter, which mixes design tokens, dark-mode mapping, and the toggle. A reader looking for "ThemeToggle" in the Components TOC won't find it. |

**Recommended interpretation**: keep the Theme System chapter as the source of truth for the toggle (it's appropriately scoped — explains *why* the toggle exists in context of the theme system) but in Part B, **add a one-liner cross-reference** at the right spot in the Components list ("ThemeToggle: see Theme System chapter") OR promote it to a Components section once IconButton is documented. Also fix the icon name drift: doc says `sun-dim`, code uses `Sun` (lucide). Pick one — either change Figma to `sun` or document the `Sun` variant.

### Ambiguity 3 — `Select.tsx` vs §7 Dropdown

(Surfaced even though not flagged Ambiguous in the table — recorded here for Part B awareness.)

§7 Dropdown describes a 6-item **context menu** (Edit, Duplicate, Archive, etc., plus a red Delete item). This UX pattern is closer to a future right-click `ContextMenu` component, which doesn't exist in code yet. Code's `Select` is a form-input dropdown.

**Recommended interpretation**: rename §7 from "Dropdown" to "Context Menu" and mark as Doc-only (until a real `ContextMenu` component is built). Then add a new "Select" section reflecting the actual `Select.tsx` shape. This is captured in the Part B split below as a B7 ("Form controls: Select drift") action.

---

## Out-of-ui-folder registry entries (footnote)

These registry entries reference files outside `nexacore-dashboard/src/components/ui/` and therefore are not in the 48-file audit scope:

| Registry entry | Files referenced | Notes |
|---|---|---|
| Card (atom) | `globals.css` | Card is a CSS class (`card-flat`, `card-container`), not a `.tsx`. Documented in §1 Card. Doc text mostly aligns with the CSS class structure. Recommend Part B verify the `globals.css` definitions match §1's pixel values. |
| Charts (molecule) | `TotalUsersChart.tsx`, `UserRoleChart.tsx`, `ChartCard.tsx` (in `nexacore-dashboard/src/components/dashboard/`, not `ui/`) | Recharts SVG charts. §8 Analytics Graph is the closest doc match but describes a hand-drawn Figma chart, not Recharts. |
| Sidebar (molecule) | `Sidebar.tsx` | The registry's "Sidebar" entry references `Sidebar.tsx`, but the actual code in `ui/` is `SidebarNav.tsx`. Likely a stale registry entry — verify in Part B (the registry says `["Sidebar.tsx"]` but the file is `SidebarNav.tsx` in `ui/`; this is a registry bug, not an audit finding). |
| Motion Patterns (molecule) | `framer-motion`, `globals.css` | Registry meta-entry pointing to the framer-motion library plus CSS keyframes in globals.css. Not a `.tsx` component. Doc has scattered animation specs (Card Entrance, Step Transitions, Status Icon Success/Error) under Auth Page Animations. |

---

## Recommendations for Part B sub-ticket split

The original /enrich-us proposal had 8 phases. Refined based on what the audit shows:

| Sub-ticket | Title | Components | Action type |
|---|---|---|---|
| **B1** | Form controls drift (Inputs) | Input (drift: pill variant, 3-section unification), DateInput (add section), MfaDigitInput (add section), Checkbox (drift: indeterminate, sizes), FormField (add section) | Edit + add |
| **B2** | Form controls drift (other) | Toggle (already aligned — minor add for sm/lg sizes), Slider (drift: track height, thumb size), Select (rename §7 Dropdown → §7 Context Menu Doc-only; add new Select section) | Edit + restructure |
| **B3** | Buttons + interactive | Button (drift: 6 variants, doc lists 8 states which conflate variant×state), IconButton (add section), SegmentedControl (add section) | Edit + add |
| **B4** | Navigation drift | Tabs (drift: 3 variants, sizes, overflow), Pagination (drift: dimensions, colors), Breadcrumbs (drift: lucide icons), SidebarNav (drift: sections + collapsed + flyouts) | Edit |
| **B5** | Feedback / Alerts (mostly add) | Toast (drift: shape — pill vs rounded-3xl), ToastContainer (add), AlertBox (add), ErrorAlert (add), InlineError (already aligned in Common Patterns — promote to its own section optional), CountdownTimer (add), RateLimitBanner (add) | Edit + add (heavy) |
| **B6** | Modals + overlays | ConfirmModal (drift: radius, sizes, danger variant, X close), IdleWarningModal (add), Tooltip (drift: radius, padding, text size, arrow), CommandPalette (add — replace §9/§23 with new Search section), SearchTrigger (sub-item under CommandPalette) | Edit + add |
| **B7** | Display primitives | Avatar (add), Badge (add), IconBadge (add), Spinner (add), InfinitySpinner (add), RingSpinner (add), Divider (add), Accordion (add), EmptyState (add), CopyField (add) | Add (heavy) |
| **B8** | Auth-specific + remaining | QrCodeCard (add), RecoveryCodesGrid (add), ImageCropper (add), BeforeAfterSlider (add), DataTable (add), StickyCard (add), TurnstileWidget (add), Calendar (drift: radius, view modes), ThemeToggle (cross-ref decision per Ambiguity 2), LanguageSelector + EmailSelector (drift: rounded-md vs rounded-full pill in Common Patterns Selector Trigger) | Edit + add |
| **B9** | Cleanup | Remove §13 Payment Form, §14 Speedometer, §2 Icon Set (or merge into IconButton). Defer §12 Quick Notification + §15 Notification (Phase C item). Reconcile §1 Card with `globals.css`. Fix registry entry: "Sidebar.tsx" → "SidebarNav.tsx". | Edit (cleanup) |

**Component counts per sub-ticket** (rows touched):
- B1: 5 (Input + DateInput + MfaDigitInput + Checkbox + FormField)
- B2: 3 (Toggle + Slider + Select)
- B3: 3 (Button + IconButton + SegmentedControl)
- B4: 4 (Tabs + Pagination + Breadcrumbs + SidebarNav)
- B5: 7 (Toast + ToastContainer + AlertBox + ErrorAlert + InlineError + CountdownTimer + RateLimitBanner)
- B6: 5 (ConfirmModal + IdleWarningModal + Tooltip + CommandPalette + SearchTrigger)
- B7: 10 (Avatar + Badge + IconBadge + Spinner + InfinitySpinner + RingSpinner + Divider + Accordion + EmptyState + CopyField)
- B8: 9 (QrCodeCard + RecoveryCodesGrid + ImageCropper + BeforeAfterSlider + DataTable + StickyCard + TurnstileWidget + Calendar + ThemeToggle + LanguageSelector + EmailSelector → 11 actually; consider splitting)
- B9: 0 components (cleanup-only)

**Notes on the split**:
- B7 is large (10 components) but homogeneous (all "add a new section, nothing to reconcile"). PR remains reviewable because each addition is independent.
- B8 should likely be split further once we start it — recommend B8a (Auth-specific atoms: QrCodeCard, RecoveryCodesGrid, ImageCropper, BeforeAfterSlider, ThemeToggle) and B8b (Misc + selectors: DataTable, StickyCard, TurnstileWidget, Calendar, LanguageSelector, EmailSelector).
- B9 (cleanup) should run **last**, after all additions/edits, so the deletions don't orphan cross-references.

**Total expected effort**: ~9 sub-tickets, mostly /develop with no code changes (docs-only). Each sub-ticket: 1 plan + 1 develop + 1 verify + 1 commit + 1 update-docs. Most sub-tickets <30 min of editing, B5 + B7 + B8 may be ~1h each.

---

## Long-term: prevent recurrence

**The deeper problem**: this audit reconciles a state, but does not address the *process* that caused the drift. The doc has drifted because it is **maintained by hand, separately from the code**. Once Part B closes today's gap, nothing prevents the same drift from accumulating again over the next 6-12 months. Major design systems (Adobe Spectrum, Material 3, Salesforce Lightning, Microsoft Fluent) avoid this by **generating documentation FROM the code**: components export specs/types/JSDoc, a build step extracts and renders the doc, and drift becomes structurally impossible.

**Recommended follow-up after Part B completes**: open a new ticket (suggest **SCRUM-3xx — "Auto-generate ui-design-system.md from code spec exports"**) to ship a doc generator. Approximate scope:

- Read all `*Specs`, `*Variants`, `*Classes` exports from `nexacore-dashboard/src/components/ui/*.tsx`
- Parse component JSDoc + TypeScript prop interfaces for the props table
- Render to markdown sections matching the format established in Part B
- Run as a CI check that fails the PR if `ui-design-system.md` differs from the generated output (forcing PRs to either regenerate the doc or update the spec export)
- Optional: also derive Storybook / ComponentShowcase content from the same source so the showcase, doc, and code stay in lockstep

**Why this matters**: without it, SCRUM-329 will recur every 12-18 months as new components ship without doc updates. The Part B effort (~9 sub-tickets) is one-time only if the generator lands afterward; otherwise it is a recurring tax.

**This recommendation is informational, not blocking**. Part A is complete and Part B can proceed with the doc-from-code recommendation captured in the implementation record. The follow-up ticket is created post-Part B (when there is a stable doc to generate from), not now.

---

**End of audit deliverable. Awaiting user review.**
