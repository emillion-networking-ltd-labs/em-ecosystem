# Implementation Record: SAT01-1 Website Frontend (Cristian Garcia)

## Summary

Initial implementation of Cristian García's personal trainer marketing site —
the first production satellite under EM Ecosystem's satellite app architecture.
Bespoke Next.js 14 SSG landing with conversion-oriented sections, design-system
component reuse from `nexacore-dashboard`, and a session-gated splash loader.

- **Scope**: `frontend`
- **Branch**: `feature/SAT01-1-frontend` (deleted post-merge)
- **Implementation dates**: ~2026-04-15 → 2026-04-30 (iterative)
- **Merge commit**: `e45c113` (PR [#227](https://github.com/emillionnetworking-ltd-labs/em-ecosystem/pull/227))

## Plan Reference

- Plan: [`SAT01-1_frontend.md`](../../plans/SAT01%20S1/SAT01-1_frontend.md)
- Plan was followed: **Yes, with documented deviations** — all 10 plan steps DONE
  or DONE-DEVIATED (Accepted-Trivial / Accepted-Quality, no Risk, no Scope-Gap).

## Commits

| Hash | Message | Key Files |
|------|---------|-----------|
| `947d6ae` | SAT01-1: Build sat-cristian-garcia satellite (initial implementation) | 94 files, 11,956 insertions — full satellite under `satellites/sat-cristian-garcia/` |
| `e45c113` | Merge pull request #227 from .../feature/SAT01-1-frontend | Merge commit on `main` |

The implementation was developed iteratively over multiple working sessions but
landed in a single squashed initial commit because the satellite is a greenfield
greenfield artifact — no incremental git history exists for the pre-commit
iterations (the working tree was untracked until the final commit).

## Deviations from Plan

| # | Step | Planned | Actual | Reason | Category | Follow-up |
|---|------|---------|--------|--------|----------|-----------|
| 1 | Step 3 | 15 UI Core components | 17 (15 + BeforeAfterSlider, Divider) | Portfolio + Transformations sections needed extras | Accepted-Trivial | — |
| 2 | Step 4 | 17 image assets | 23 images | Iteration enriched content (about-portrait, app-tapiz, hero-studio-bw, portfolio-front-pose, portfolio-hero, services-background, transformations folder) | Accepted-Trivial | — |
| 3 | Step 7 | 8 sections | 11 (8 + SocialProofSection, HeroCTA, AppPreview, TransformationsPreview) | Enriched home with mobile app preview + richer testimonials carousel | Accepted-Trivial | — |
| 4 | Step 10 | Visual style guide doc | Inline only (in plan + globals.css comments) | Time-boxed; existing artifacts cover the spec implicitly | Accepted-Quality | **SAT01-2** (created — see Section 8) |
| 5 | Section 2 | Red OR electric blue accent | Gold (`#8B6914` / `#D4A843`) | Better fit with "premium fitness" brand positioning; fits the dark theme | Accepted-Trivial | — |
| 6 | Section 2 | Inter / Montserrat / Poppins | system-ui stack | Consistency with `nexacore-dashboard` design system | Accepted-Trivial | — |
| 7 | Section 3 | Mandatory loader animation | Implemented as **real loader** (not just animation) | Goes beyond spec — splash gates on `window.load` so it has utility on slow networks | Accepted-Trivial (over-delivery) | — |
| 8 | (project-wide) | Satellite at `em-ecosystem-code/sat-cristian-garcia/` | Moved to `em-ecosystem-code/satellites/sat-cristian-garcia/` (new convention) | Future-proof folder organization for SAT02+ | Accepted-Trivial | SCRUM-331 follow-up comment posted |

Deviations were validated in `/verify` (verdict **PASS**, see
[`SAT01-1_verify.md`](../../plans/SAT01%20S1/SAT01-1_verify.md)). No reclassification.

## Test Results

| Check | Result | Details |
|-------|--------|---------|
| Unit tests | N/A | No test framework configured (consistent with marketing satellite plan) |
| Integration tests | N/A | No backend integration to test |
| Build | **PASS** | `next build` clean, 13 routes static-prerendered, 87.3 kB First Load JS shared |
| Manual verification | Done iteratively | All 9 pages verified visually during development |
| Pre-push hook | **PASS** | Repo-level `nest build` (for nexacore-api) ran clean |

Routes prerendered (all `○ Static`):
```
/, /_not-found, /contacto, /legal/privacidad, /legal/terminos,
/portfolio, /precios, /servicios, /sobre-mi, /testimonios
```

## Bugs Found

Bugs surfaced and fixed during iteration (none reached production):

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| Form validation showed errors twice (FormField + Input both rendered the message) | Low | Fixed | `error="..."` → FormField (message); `hasError={!!errors.x}` → Input (visual state only) |
| `Select` dropdown overflowed card container in form context | Low | Fixed | Added `fullWidth` prop to `Select` (backwards-compatible) — extends design system to support form-grade layout |
| `Button` with `href` did not navigate (rendered as `<button>`) | Medium | Fixed | Default to `<a>` element when `href` provided and no `as` specified |
| Lightbox buttons hidden behind image on mobile | Medium | Fixed | Added `z-10` to all 3 IconButtons inside Lightbox |
| Touch hover got stuck on Lightbox buttons | Medium | Fixed | Replaced inline buttons with design-system `<IconButton variant="boxed" size="sm">` (correct touch behavior) |
| `useFadeInOnView` race condition (CSS transition + React state updates raced) | Medium | Fixed | Refactored from CSS transitions → CSS animations (deterministic with delays) |
| `Instagram` icon not exported from `lucide-react` 1.8 | Low | Fixed | Substituted with `AtSign` icon |
| First section parallax caused jump on refresh (`rect.top` positive under navbar) | Low | Fixed | Established rule: first section never has parallax; combine intro + content into single tall first section |
| IntroLoader flash bug — splash appeared briefly then disappeared in dev | High (dev only) | Fixed | StrictMode dev double-invoked `useEffect`; first run set `sessionStorage.intro_seen`, second run saw the flag and bailed. Moved `setItem` to the unmount timer (after splash completes) |
| IntroLoader exit animation — page revealed before splash finished | Medium | Fixed | Refactored exit from fixed-timestamp to event-driven: JS adds `.exiting` class → CSS chain `tremble (200ms) → punch-out (200ms) → overlay fade (250ms)`. Page reveals only after overlay finishes |
| FOUC on first paint before React hydration | Medium | Fixed | Render overlay in SSR HTML + synchronous `<head>` script adds `.intro-skip` class for repeat visitors before body parses |

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/changes/sat-cristian-garcia/plans/SAT01 S1/SAT01-1_verify.md` | Updated verdict from PASS-WITH-DEBT → PASS after IntroLoader implementation |
| `ai-specs/changes/sat-cristian-garcia/records/SAT01 S1/SAT01-1_frontend.md` | This record (NEW) |
| `ai-specs/specs/product-roadmap.md` | Phase E updated: SAT01 shipped, satellite folder convention documented |
| `ai-specs/specs/workflow-standards.mdc` | Added satellite folder convention (`satellites/sat-{client}/`) to project structure section |
| `MEMORY.md` (auto-memory) | Updated path conventions to reflect `satellites/sat-{client}/` location |
| Jira SCRUM-331 | Posted comment with path-update notes (uiCoreSource needs `../../` instead of `../`) |
| `ai-specs/specs/integration-state.md` | **No update needed** — satellite has no backend coupling (no modules, guards, controllers, services, or permissions) |
| `ai-specs/specs/data-model.md` | **No update needed** — no database entities |
| `ai-specs/specs/api-spec.yml` | **No update needed** — no API endpoints consumed or exposed |

## Lessons Learned

### What went well

- **Vanilla CSS keyframes** held up perfectly for all animation needs (fade-in on viewport, parallax, slider transitions, splash sequence). Bundle stays at 87.3 kB First Load JS shared — a result a Framer Motion-equivalent app would not match.
- **Design system reuse** via copy-paste from `nexacore-dashboard` worked frictionlessly for the first satellite. Drift was minimal and contained (1 prop divergence, ~8 satellite-only animations, 1 hook).
- **`/verify` quality gate** caught the missing Section 3 loader before commit — the iteration that resolved it produced a higher-quality artifact (real loader gated on `window.load`) than a fixed-timer would have been.
- **Folder convention move** before commit (sat → `satellites/sat-`) cost ~5 min and saves migration pain when SAT02 lands.

### What was harder than expected

- **CSS animation timing race conditions**: chained animations on the same element with `forwards` fill-mode + React state updates produce unpredictable behavior in dev StrictMode. The IntroLoader exit went through 4 iterations (timer-only → CSS-chain co-running → CSS-chain staged → event-driven via `.exiting` class) before being correct.
- **SSR FOUC for splash overlay**: the naive React-only approach left the page visible for ~100-200ms before hydration. Required adding a synchronous `<head>` script + CSS `.intro-skip` rule to fully eliminate.
- **Touch behavior on mobile Lightbox buttons**: tap-to-stick hover state was confusing. Using the design system's `IconButton` (which already handled this correctly) was the right answer — but discovering this required ruling out custom solutions (`hoverOnlyWhenSupported`, `blur()` on touchend, etc.) that the user explicitly rejected.

### Recommendations for similar tickets (SAT02+)

1. **Use shadcn-style CLI from day one**: SCRUM-331 will land the `em-ui` CLI for satellite UI Core distribution. Future satellites should be scaffolded with `em-ui init <name>` rather than copy-paste, eliminating the drift class of bugs encountered here.
2. **Don't skip `/verify`**: the gap between "code that builds" and "ticket that meets acceptance criteria" was real (Section 3 was missed during /develop). The verify gate caught it.
3. **First-paint asset strategy**: any "above the fold" animation (splash, hero) needs SSR-rendered base state + synchronous `<head>` script for correct first-paint behavior. React-only doesn't work.
4. **Plan the loader behavior, not just the animation**: a splash that's a fixed timer is design theatre; a splash gated on `window.load` is a real UX feature. Default to the latter.
5. **Animation library decision**: confirmed CSS keyframes are sufficient for landing-page animations (fade-in, slide, splash, before/after, parallax). Avoid adding Framer Motion / GSAP / Lottie for landings — they cost more bundle than they're worth at this scale.
