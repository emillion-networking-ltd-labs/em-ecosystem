# Strategy: design-propagation

Status: DRAFT
Strategy: design-propagation   <!-- feature specs reference this with a `Strategy: design-propagation` line -->
Impact: high   <!-- low | medium | high — `low` lets a trivial strategy pass critiqued with 1 lens; absent = high (full ≥3-lens panel) -->

## Goal
Decide the mechanism that propagates a design change from the single source (`design-system/`) to **every**
consumer (dashboard + N satellites) with TOTAL element-level coverage, a per-element modifiability contract
(what a satellite may re-brand vs. what is normatively locked), detection of BOTH error classes (raw
out-of-range value AND semantically-misused-but-valid token), and an organized "design update" rollout that
scales toward ~100 satellites without breaking any brand — including propagating the strategy MANUALS
themselves. The mechanism must work in **both directions** and be **permanent**: *forward* (a new design update
reaches every consumer, and new elements are born in-norm) AND *backward* (detect the ALREADY-BUILT corpus —
elements the AI produced before this system existed — and bring it up to the norm). It is a standing regime, not
a one-off migration. **Calibration note:** the vision spans 100 satellites, but there are **2 consumers today**;
the Recommendation builds only the minimum that pays now and gates the rest behind an explicit trigger.

## Context
<!-- grounded facts ONLY — cite file:line (repo) or a URL (market) for every claim -->
- The distribution model is **pull, copy-based, single-source**: the CLI copies FROM `design-system/` into a
  consumer's `--dest`, and aborts if the source isn't `design-system` (design-system/registry/cli.mjs:13,
  design-system/registry/cli.mjs:48). Ratified as "governed copy with reconciliation, NOT zero-copy"
  (emkeel-governance/adr/006-satellite-component-reuse.md:22).
- `update` is a **blunt overwrite**: the no-overwrite guard (design-system/registry/cli.mjs:50) is bypassed on
  `update` (`overwrite: cmd === "update"`), so `copyFileSync` clobbers a diverged copy unconditionally
  (design-system/registry/cli.mjs:52) — re-pull destroys per-client divergence. There is **no version
  manifest and no base-revision store**: nothing records which DS revision a consumer last pulled, so a real
  merge has nothing to merge against — only "re-copy latest".
- Coverage today is **copy-fidelity, not element identity**, and **change-triggered**: `check-drift` (tokens)
  and `check-component-drift` (components) verify a consumer copy is identical to the DS source of a file that
  ALREADY changed there, and run only in PRs touching those files (design-system/scripts/check-drift.mjs:50-56,
  design-system/scripts/check-component-drift.mjs:25-31). Nothing does a **full sweep of every element** of a
  consumer for a wrong-but-valid token.
- **Reliability of detection is a CONSEQUENCE of how elements are constructed.** New elements are AUTHORED, not
  hand-coded ad-hoc: build-against-the-contract → register in the design-system → a Storybook story (the story
  gates enforce coverage/variants/norm — design-system/scripts/check-story-norm.mjs:2) → human approval in
  Storybook before it enters the registry. So for NEW work the self-describing property (registered identity +
  semantic tokens, no raw values) is guaranteed at authoring time — an element is either a *known component*
  (identity from the registry) or an *explicitly-declared divergence*, never an anonymous raw blob. The
  **construction contract** is NOT the approval flow — it is the *researched, written standard* for how an
  element is correctly and organizedly built (which primitive/markup, which semantic token per role, canonical
  class organization, minimal nesting, no genuine redundancy); the flow is only where that standard is applied
  and checked. This is why the answer is a *defined* construction standard, not "scan harder".
- **A pre-system LEGACY corpus already exists and escapes today's gates.** Many elements were built (by the AI)
  before this token/construction contract existed. ECO-136 had to re-sync the **stale dashboard** (135 drifted
  declarations) to the norm and migrate `sat-cristian-garcia` from its 648-line fork BY HAND
  (emkeel-governance/adr/027-arquitectura-tokens-color.md:63), and residual escapes remain (untokenized colors;
  card-like elements wearing the wrong border). Because the gates are
  change-triggered, an untouched legacy element is never flagged — so the mechanism needs a way to DETECT the
  already-built and drive it to norm, not only to govern new work.
- The divergence valve is **file-level and reason-less**: `check-component-drift` allows a drifted copy if the
  file contains the substring `@em-ui-adapted` anywhere; the advertised `<razón>` is never parsed
  (design-system/scripts/check-component-drift.mjs:60-66, design-system/scripts/check-component-drift.mjs:62).
  No **element-level** lock/editable contract exists.
- The token layer is already single-source at runtime (TW v4: change the raw `--X`, it propagates intra-DS);
  brand override lands as a `[data-brand]` scope validated per-satellite by `check-brand-contrast`
  (emkeel-governance/adr/027-arquitectura-tokens-color.md:58, design-system/scripts/check-brand-contrast.mjs:50-51).
  So brand is a **re-binding of aesthetic tokens** in a scope, not a per-element value — a norm update changes a
  norm token and structurally CANNOT reach the brand scope.
- **The design-tokens non-goal is TWO clauses, and they are NOT equal** (emkeel-governance/strategy/design-tokens.md:76,
  emkeel-governance/strategy/design-tokens.md:89): **(1)** the DTCG pipeline/generator is a **deferrable YAGNI**
  — "por ahora … revisitar con ≥3-4 consumidores"; **(2)** "un generador que empuje a consumidores violaría el
  pull de em-ui (ADR-007)" is a **HARD invariant**, re-ratified in emkeel-governance/adr/027-arquitectura-tokens-color.md:36
  (`accepted`). design-tokens.md carries `Status: DRAFT` in its header, but the /strategy contract makes the
  MERGE the approval (#535) — it is a ratified decision, so any option touching either clause must be explicit,
  not silent.
- This strategy's kill-criteria are fixed in its sidecar: the per-element model must not cost more than drift
  catches, per-element tagging must be maintainable, and semantic detection must not drown in false positives
  at scale (emkeel-governance/strategy/design-propagation.process.json:8).
- The strategy MANUALS that must also propagate are "living standards" consumers are expected to track
  (emkeel-governance/strategy/satellite-quality.md:57, emkeel-governance/strategy/satellite-design.md:71).
- **Market — layered tokens**: indirection by layers (option/primitive → semantic → component); private option
  tokens decouple consumers from base changes (https://martinfowler.com/articles/design-token-based-ui-architecture.html).
  Multi-brand = a per-brand base layer of literals + one shared semantic layer aliasing it
  (https://www.alwaystwisted.com/articles/a-design-tokens-workflow-part-9); DTCG reached first stable version
  2025.10 (https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/).
- **Market — copy distribution & its update pain**: shadcn distributes source by copy and "unlike npm packages
  there is no automatic update path"; a customized component "can only be diffed by hand" — shadcn itself
  **punted** on merge, offering only an experimental `diff` + manual apply
  (https://vercel.com/academy/shadcn-ui/updating-and-maintaining-components,
  https://github.com/shadcn-ui/ui/discussions/790). Registries can be namespaced/private/auth-gated
  (https://ui.shadcn.com/docs/registry/namespace). Scale rollout is solved with semver + release management
  (https://www.supernova.io/blog/8-examples-of-versioning-in-leading-design-systems,
  https://stevekinney.com/courses/enterprise-ui/versioning-and-release-management).
- **Market — the two error classes & the lock boundary**: static linters catch the RAW-value class
  (`stylelint-declaration-strict-value`, MetaMask `color-no-hex` — https://github.com/AndyOGo/stylelint-declaration-strict-value,
  https://github.com/MetaMask/eslint-plugin-design-tokens/blob/main/docs/rules/color-no-hex.md). **Correction
  from the critique:** Polaris `custom-property-allowed-list` is a token-VALIDITY check (is it a real/public
  token), NOT a role→token map — it does not catch "valid but wrong-role"
  (https://polaris-react.shopify.com/tools/stylelint-polaris/rules/conventions-custom-property-allowed-list);
  the same holds for SLDS (https://developer.salesforce.com/docs/platform/slds-linter/guide/reference-rules.html).
  So the semantic class is only statically catchable when element IDENTITY is KNOWN (a registered component),
  not inferred from arbitrary JSX. The lock BOUNDARY is a real CSS primitive: `@layer` makes precedence follow
  layer order, not specificity — **but unlayered styles beat any layered rule**, so the lock holds only if the
  satellite override is ITSELF in a lower-priority layer (https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@layer).

## Options
<!-- at least 2 real options; EVERY row MUST cite a Source (file:line or URL). `emkeel strategy check` enforces it. -->
| # | Option | Source | Pros | Cons | Risk |
|---|--------|--------|------|------|------|
| 1 | **Evolve copy-governance in place** — keep pull/copy; extend the `@em-ui-adapted` valve file→element; add `check-raw-color`; run the existing drift checks as a full sweep; a fleet **report** (still blunt overwrite on update). No manifest, no base-store, DTCG stays deferred. | design-system/registry/cli.mjs:52, design-system/scripts/check-component-drift.mjs:60-66, https://github.com/MetaMask/eslint-plugin-design-tokens/blob/main/docs/rules/color-no-hex.md | Smallest build; pure continuity of ADR-006/007; every gate incremental & testable; honors design-tokens.md:89. | Blunt `update` STILL destroys satellite divergence on re-pull — the core scale bug survives; no controlled "update to vN"; no legacy census; manual/manuals propagation unaddressed. | med |
| 2 | **Compiled DTCG + versioned package** — re-platform tokens to a DTCG source compiled by Style Dictionary/Terrazzo into per-brand CSS; ship components as a semver package / auth'd registry; propagate updates as version bumps; brand = a "mode". | https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/, https://www.alwaystwisted.com/articles/a-design-tokens-workflow-part-9, https://ui.shadcn.com/docs/registry/namespace, https://www.supernova.io/blog/8-examples-of-versioning-in-leading-design-systems | Industry-standard at 100 satellites; true compiled single-source; semver = controlled rollout; brand-as-mode is a first-class multi-brand pattern. | **Pulls design-tokens.md:89's deferred DTCG trigger EARLY** (defined revisit = ≥3-4 consumers; today = 2) → needs its own strategy/ADR; a compiled package removes the satellite's own-your-copy top layer; heavy re-platform = the exact YAGNI the kill-criteria warn against. | high |
| 3 | **Hybrid, phased (RECOMMEND — minimum now, trigger-gated rest)** — keep pull/copy. **Now:** per-consumer `em-ui.manifest.json` pinning the DS **git-SHA per file** + **base-pinned assisted reconcile** (`git merge-file`, writes conflict markers, never auto-resolves) replacing blunt overwrite; `check-raw-color`; a **normalization census (report)** that classifies the whole corpus against a defined construction standard and drives legacy to norm; existing drift as a full sweep; a **pull-only** fleet **reporter**. **Trigger-gated (≥N consumers):** element-level markers; a **per-known-component** token allow-list; census **auto-codemod** + structural advisory; `@layer` lock; manual-version propagation. DTCG stays deferred. | design-system/registry/cli.mjs:52, https://github.com/shadcn-ui/ui/discussions/790, emkeel-governance/adr/027-arquitectura-tokens-color.md:63, https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@layer | Fixes the real scale bug NOW; mechanizes ECO-136's manual reconcile (forward AND backward); stays inside the pull invariant (ADR-007); honest about static-catchable vs. design review. | Most moving parts overall → strictly phased & trigger-gated; base-store + `git merge-file` + the census classifier are the load-bearing new surface; the wrong-role case is NOT fully a gate. | med |

## Recommendation
**Option 3, but calibrated: build the minimum now, gate the rest behind an explicit consumer-count trigger.**
The critique was decisive on scope — there are **2 consumers today** (dashboard + sat-cristian-garcia), and this
strategy's own kill-criteria (design-propagation.process.json:8) name the per-element model, per-element tagging
and semantic detection as the failure mode at 2-3 consumers. So the recommendation is NOT "build everything now."

**Build now (pays for itself at 2 consumers):**
1. **Base-pinned manifest + assisted reconcile.** `em-ui.manifest.json` per consumer pins the DS **git-SHA per
   file** (a version string alone can't merge — the critique's load-bearing correction). `update` runs
   `git merge-file` against that pinned base and writes standard conflict markers a human resolves; it NEVER
   silently auto-merges and never clobbers a declared adaptation. This is the honest "base-pinned assisted
   reconcile", the gap shadcn itself punted on (https://github.com/shadcn-ui/ui/discussions/790). Fixes the
   concrete blunt-overwrite bug (design-system/registry/cli.mjs:52).
2. **`check-raw-color` + full-sweep the existing drift checks.** The raw-value class is cleanly static
   (https://github.com/MetaMask/eslint-plugin-design-tokens/blob/main/docs/rules/color-no-hex.md); running the
   existing `check-drift`/`check-component-drift` UNCONDITIONALLY (not change-triggered) gives the "total
   coverage" sweep with no new semantic gate.
3. **Construction standard + normalization census (report mode).** First the missing foundation: *research and
   write the standard for how an element is correctly and organizedly built* — which registered primitive/markup,
   which semantic token per role, canonical class organization, minimal nesting, no genuine redundancy. It
   extends StoryConventions and is what makes "correct construction" checkable. Without it you cannot tell a
   *canonical* pattern from a *redundant* one — e.g. `border border-border-components` is CORRECT (`border` =
   width + `border-border-components` = the token color; 22 uses in the DS, `border border-border-strong` 51 —
   design-system/tokens/tokens.css:155), yet a naive duplicate-class lint would false-positive on it. Then the
   **normalization census** — the mechanized, repeatable form of ECO-136's manual reconciliation
   (emkeel-governance/adr/027-arquitectura-tokens-color.md:63) — runs a **full-corpus** pass (every element in
   the DS + every consumer, NOT change-triggered) and classifies each element AGAINST that standard:
   *conforms* / *raw value* (→ `check-raw-color`) / *wrong-but-valid token on a known component* /
   *anonymous element that should be a registered primitive* / *disorganized construction* (real redundancy,
   contradictory utilities, needless nesting — NOT a naive dedup). Report-first is cheap and immediately useful;
   the auto-codemod is gated below.
4. **Rollout safety** (completeness fix): a propagated update can BREAK a consumer, and satellite VRT is not a
   required check — so a consumer can **pin/hold** a version, the reporter **halts on first red**, and each
   consumer's own VRT runs before its update lands.

**Gate behind a trigger (revisit at ≥N consumers — mirrors design-tokens.md's ≥3-4 rule):**
5. **Element-level modifiability** — `@brand-locked` / `@ds-governed` / `@partial` extend the valve file→element;
   at 2 consumers the file-level valve + the manifest already protect divergence.
6. **Per-known-component token allow-list** — NOT role inference (not feasible, and its own kill-criterion). The
   registry KNOWS a file's component identity (Button.tsx = Button), so allow-list the tokens each *registered
   component* may use. The residual "valid-but-wrong-role token on a card-like element" is **design review**, not
   a static gate — stated honestly, because Polaris/SLDS do NOT catch it
   (https://polaris-react.shopify.com/tools/stylelint-polaris/rules/conventions-custom-property-allowed-list).
7. **Census auto-codemod + structural advisory** — mechanical classes from the census (raw value→token, class
   de-dup/normalize) applied as review-gated PRs; the "smells like a registered primitive" structural cases
   surfaced as an advisory worklist for design review (never an auto-rewrite). Scale-gated: codemod safety and
   false-positive tuning need the larger corpus.
8. **`@layer` structural lock** — locked base tokens in a layer that out-ranks the satellite override BY LAYER
   ORDER; requires the override to be **itself layered** (unlayered styles beat any layer —
   https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@layer).
9. **Manual-version propagation** — each strategy manual carries a version a consumer records; a gate flags a
   consumer lagging a manual bump.

**Two directions, one engine (the "forever + retrofit" answer):** *forward* = the authoring flow (contract →
Storybook story → your approval → registry) + norm-token propagation + the base-pinned reconcile, so new work is
born self-describing and updates reach everyone; *backward* = the normalization census classifies the existing
corpus and drives it to norm. It is the **same classifier** run in both directions — which is why the mechanism
is a standing regime, not a one-off: re-run the census whenever a new norm lands or a new satellite is absorbed,
and the full-sweep gates + authoring flow keep everything in norm thereafter. Detection is reliable because
construction makes every element self-describing (known component, or declared divergence, never a raw blob) —
not because a scanner tries harder.

**Governance boundary (the critique's hardest catch):** the fleet orchestrator is **pull-only** — it REPORTS
fleet drift and OPENS PRs / triggers each consumer's own `em-ui update`; it never writes bytes into consumer
paths. A central pusher would violate the HARD invariant (design-tokens.md:76, ADR-027:36 `accepted`) — that is
Option 2's territory and would need its own ADR, not a fold-in here. Likewise DTCG stays a **deferred** non-goal
behind its written ≥3-4-consumer trigger (design-tokens.md:89): this strategy records WHEN to revisit; it does
not pre-build it.

## Non-goals
- Reviving the DTCG pipeline / a push generator NOW — deferred behind the ≥3-4-consumer trigger
  (design-tokens.md:89); Option 2 is the documented escalation, not this ticket.
- **A central actor that PUSHES bytes into consumer paths** — forbidden hard invariant (design-tokens.md:76,
  ADR-027:36); the fleet layer stays pull-only (report + PR + trigger-own-update).
- Re-platforming em-ui to a compiled npm package — the satellite keeps owning its copy (ADR-006/007).
- **A static gate that infers element ROLE from JSX** — not feasible; the wrong-role case is design review, and
  only the per-known-component allow-list + raw-value ban + construction-standard conformance are gates.
- **A naive "duplicate class = bad" lint** — it would false-positive on canonical patterns like `border` +
  `border-<token>` (width + color). The check enforces the *defined* construction standard (organized, canonical
  token application; real redundancy / contradictory utilities / needless nesting), NOT string-level dedup, and
  NOT cosmetic formatting (prettier's job).
- The normalization census as a **one-off migration** — it is a *standing mode*, re-runnable whenever a norm
  lands or a satellite is absorbed.
- Redesigning any brand palette (satellite-design / ECO-128) or the selection-model gate (ECO-141).
- Auto-EDITING a satellite's brand-locked elements during an update — locked means SKIP + report, never rewrite
  a brand decision.

## Decisions
<!-- optional: link the chosen decision as an ADR, e.g. emkeel-governance/adr/007-<slug>.md -->
- On approval: record as an ADR in `emkeel-governance/adr/` extending ADR-006/007/027 to the propagation layer
  (it does NOT supersede them; the pull invariant is preserved). Phase as separate ECO tickets: the four
  "build now" items (1-4) first; items 5-9 each gated behind the consumer-count trigger.
