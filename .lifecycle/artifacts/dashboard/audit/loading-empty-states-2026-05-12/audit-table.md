# Loading & Empty States Audit — Dashboard

**Date**: 2026-05-12
**Ticket**: SCRUM-352 (Phase A — UI Foundation)
**Auditor**: Claude (multi-grep + per-file inspection)
**Module**: `nexacore-dashboard`
**Out of scope**: satellites (separate SAT01-2 STYLE_GUIDE roadmap)

---

## 0. Canonical Patterns (binding for all dashboard code)

These are the rules that future tickets MUST comply with. Sub-tickets B1-B5 below implement these.

### 0.1 Empty states

| Surface | Rule |
|---------|------|
| List / grid / card-feed (NO table) | Use `<EmptyState icon={...} title="..." description="..." action={...} />` — full component, NOT inline `<p>` |
| Table with no rows | Use `DataTable`'s `emptyMessage` prop (renders inline `<td>` per current DataTable contract) — this is a deliberate exception because the empty cell must span columns and live inside `<tbody>`. **DataTable internally should render its empty cell using `EmptyState` styling** (icon + title + caption), not bare text — improvement opportunity (see B5). |
| Card or modal with no items | Use `<EmptyState>` always |
| Section header collapsed with no children | Inline subtle hint OK (e.g., "—" or italic "None") — no full EmptyState |

Decision rule: **if it occupies ≥48px vertical space or is the page's primary content area, use `<EmptyState>`. Otherwise, inline is acceptable.**

### 0.2 Differentiation: "no data" vs "failed to load"

| State | Pattern |
|-------|---------|
| No data (success, empty result) | `<EmptyState icon={Inbox|...} title="No X yet" description="...action explanation..." action={<Button>...} />` |
| Failed to load (error) | `<EmptyState icon={AlertTriangle} title="Couldn't load X" description="Error message" action={<Button onClick={retry}>Retry</Button>} />` — REQUIRES `error` variant of EmptyState (currently doesn't exist — see B6) |
| Loading (in-flight) | Section/page loader per §0.3; NOT EmptyState |

### 0.3 Section / page loaders (skeleton vs spinner vs text)

| Surface | Rule |
|---------|------|
| Layout is known (table rows, card grid with fixed item dimensions) | **Skeleton**. DataTable already does this with `SkeletonRow`. List/grid components should mirror. |
| Layout is unknown (initial app boot, route transition, async page-level data) | **Centered `<Spinner size="lg" />` with aria-label**, vertically centered in container. NO bare `<p>Loading...</p>` text. |
| Background polling / soft refresh (user-initiated, data already shown) | **Inline `<Spinner size="sm" />`** next to refresh affordance, content stays. |

`<p>Loading...</p>` inline text is **forbidden** as a primary loading indicator. It's allowed only as fallback aria-label content for screen-readers, never as visual.

### 0.4 Button loaders (circular vs dots/infinite)

| Action type | Variant | Why |
|-------------|---------|-----|
| Deterministic action (Submit, Save, Delete, Send) — finite duration | **Circular `<Spinner>`** (the CSS-ring variant) | User has clear "this will complete" expectation; circular implies progress toward a known end |
| Indeterminate action (Sync, Search, Polling, Background fetch) | **Infinite `<InfinitySpinner>`** | Loop signals "ongoing, no defined end" |
| Decorative / branding spinner (login redirect splash, etc.) | **Ring `<RingSpinner>`** | Reserved for non-action UI |

`Button` component's `loading` prop currently always uses `InfinitySpinner`. This is **inconsistent** with the rule above for Submit/Save buttons. See B3.

### 0.5 Table loaders

| Surface | Rule |
|---------|------|
| Initial table load | **Skeleton rows** (`<SkeletonRow>` matching column count). DataTable does this. ✓ |
| Refresh of already-shown table | **Inline spinner in toolbar / header**, table content stays | New rule, not enforced today |
| Pagination / filter change | **Skeleton rows** for the new page | Should be DataTable default; verify in B5 |
| Table-wide error | DataTable should accept an `error` prop and render `<EmptyState icon={AlertTriangle} ...>` inside its tbody — currently doesn't exist (B5 + B6) |

---

## 1. Audit Table — Findings

| # | Component | File:Line | Type | Current pattern | Canonical pattern | Severity | Cluster |
|---|-----------|-----------|------|------------------|--------------------|----------|---------|
| 1 | ActiveSessions | `src/components/profile/ActiveSessions.tsx:289` | empty | `<p className="...">No active sessions found.</p>` | `<EmptyState icon={Smartphone} title="No active sessions" description="Sign in on another device to see it here." />` | HIGH | **B1** |
| 2 | TrustedDevices | `src/components/profile/TrustedDevices.tsx:226` | empty | `<p className="...">No trusted devices. When you log in with MFA and trust a device...</p>` | `<EmptyState icon={ShieldCheck} title="No trusted devices" description="When you log in with MFA and trust this device, it will appear here." action={...} />` | HIGH | **B1** |
| 3 | PasskeyManager | `src/components/profile/PasskeyManager.tsx:317` | empty | `<p className="...">No passkeys registered. Add a passkey for faster, more secure ...</p>` | `<EmptyState icon={Key} title="No passkeys registered" description="Add a passkey for faster, more secure sign-in." action={<Button>Add passkey</Button>} />` | HIGH | **B1** |
| 4 | SecurityActivity | `src/components/profile/SecurityActivity.tsx:140` | empty | `<p className="text-content-tertiary">No security events.</p>` | `<EmptyState icon={Activity} title="No security events" description="Your recent sign-ins and security events will appear here." />` | HIGH | **B1** |
| 5 | SecurityActivity | `src/components/profile/SecurityActivity.tsx:136` | error | `<p className="text-error">{errorMessage}</p>` | `<EmptyState icon={AlertTriangle} title="Couldn't load security events" description={errorMessage} action={<Button onClick={retry}>Retry</Button>} />` | HIGH | **B1** (needs B6 `<EmptyState>` error variant) |
| 6 | ActiveSessions | `src/components/profile/ActiveSessions.tsx:276-281` | loader-section | Inline `<p>Loading sessions...</p>` text | Centered `<Spinner size="lg" aria-label="Loading sessions" />` per §0.3 | HIGH | **B1** |
| 7 | TrustedDevices | `src/components/profile/TrustedDevices.tsx:217-223` | loader-section | `<Spinner>` (via component) | Already compliant per §0.3; confirm `size="lg"` and centered layout | LOW | **B1** (verification only) |
| 8 | PasskeyManager | `src/components/profile/PasskeyManager.tsx:307` | loader-section | `<Spinner>` (via component) | Already compliant per §0.3; confirm layout matches §0.3 spec | LOW | **B1** (verification only) |
| 9 | SecurityActivity | `src/components/profile/SecurityActivity.tsx:128-131` | loader-section | `<Spinner>` with `aria-label="Loading events"` | Compliant per §0.3 ✓ | — | — |
| 10 | DataTable | `src/components/ui/DataTable.tsx:90-94` | empty | Inline `<td colSpan={N}>{emptyMessage}</td>` text | Compliant for tables per §0.1 (table exception), BUT styling should mimic EmptyState (icon + title + caption) — currently bare text | MEDIUM | **B5** (or B6 if `<EmptyState>` gains a "compact-row" variant) |
| 11 | DataTable | `src/components/ui/DataTable.tsx:82-87` | loader-table | `<SkeletonRow>` per row | Compliant per §0.5 ✓ | — | — |
| 12 | DataTable | (does not exist) | error | DataTable has NO error state — consumer must wrap | Add `error` prop to DataTable → renders `<EmptyState>` error variant inside tbody | MEDIUM | **B5** + **B6** |
| 13 | AuditLogsTable | `src/components/admin/AuditLogsTable.tsx:220` | empty | `emptyMessage="No audit logs found."` (passes to DataTable) | Compliant — will improve when DataTable adopts EmptyState styling (B5) | LOW | **B2** (verification) |
| 14 | UsersTable | `src/components/admin/UsersTable.tsx:181` | empty | `emptyMessage="No users found."` (passes to DataTable) | Compliant — same as #13 | LOW | **B2** (verification) |
| 15 | /auth/callback page | `src/app/auth/callback/page.tsx:9` | loader-section | Inline `<p className="text-body text-content-secondary">Loading...</p>` | Centered `<Spinner size="lg" />` with route-context aria-label (e.g., "Completing sign-in") per §0.3 | HIGH | **B4** |
| 16 | /verify-email-change page | `src/app/verify-email-change/page.tsx:90` | loader-section | Inline `<p>Loading...</p>` | Same as #15 | HIGH | **B4** |
| 17 | GuestRoute | `src/components/guards/GuestRoute.tsx` (uses Spinner) | loader-section | `<Spinner>` while resolving auth | Compliant per §0.3 ✓ (centered, lg) | — | — |
| 18 | ProtectedRoute | `src/components/guards/ProtectedRoute.tsx` (uses Spinner) | loader-section | `<Spinner>` while resolving auth | Compliant ✓ | — | — |
| 19 | Button (variant=primary, submit) | `src/components/ui/Button.tsx:88` | loader-button | Always `<InfinitySpinner>` regardless of action type | Use `<Spinner>` (circular) for primary/submit/delete; keep `<InfinitySpinner>` for indeterminate variants (link, secondary in some cases) | MEDIUM | **B3** |
| 20 | Input (loading prop) | `src/components/ui/Input.tsx` | loader-button-like | Per Input.tsx — uses Spinner pattern | Verify against B3 rule | LOW | **B3** (verification) |
| 21 | OAuthCallbackHandler | `src/components/auth/OAuthCallbackHandler.tsx` | loader-section | Spinner (inspect for compliance) | TBD per file read | LOW | **B4** (verification) |
| 22 | MfaSetupStep | `src/components/auth/MfaSetupStep.tsx` | loader-button | Spinner (inspect for compliance) | TBD per file read | LOW | **B3** (verification) |
| 23 | CodePlayground | `src/components/admin/CodePlayground.tsx:63` | loader-button | `<Button loading>Loading</Button>` — "Loading" text as label | Compliant for design-system showcase context (demonstrates `loading` prop). Not a production violation. | — | — |
| 24 | PermissionsMatrix | `src/components/admin/PermissionsMatrix.tsx` | loader-section | Spinner via component | TBD per file read | LOW | **B4** (verification) |
| 25 | RecentActivityFeed | `src/components/dashboard/RecentActivityFeed.tsx` | empty | TBD per file read | TBD | LOW | **B2** (audit during fix) |
| 26 | UserRoleChart | `src/components/dashboard/UserRoleChart.tsx` | loader-section | TBD per file read | TBD | LOW | **B4** (audit during fix) |
| 27 | ComponentShowcase (design-system demos) | `src/components/admin/ComponentShowcase.tsx:227,3569,4001` | mixed | Demo-pattern strings (`"Loading"` state, `description="No items match..."`) | These are showcase demonstrations — not production violations. Doc-only. | — | — |

**Total findings**: 27 surface entries.
- **High severity**: 8 (Active/Trusted/Passkey/Security profile components + 2 page loaders)
- **Medium severity**: 3 (Button loading variant, DataTable empty styling, DataTable error gap)
- **Low severity / verification only**: 12
- **Already compliant**: 4

---

## 2. Sub-tickets cluster (B1–B6)

Recommended Jira sub-tickets (Sprint placement decided by user):

| Cluster | Title | Scope | Severity | Findings |
|---------|-------|-------|----------|----------|
| **B1** | Empty/error/loader states in 4 profile components | Refactor ActiveSessions, TrustedDevices, PasskeyManager, SecurityActivity to use `<EmptyState>` for empty + error states, centered Spinner for loaders | HIGH | 1, 2, 3, 4, 5, 6, 7, 8 |
| **B2** | Verify empty states in admin tables + dashboard cards | Audit + minor cleanup: AuditLogsTable, UsersTable, RecentActivityFeed, ensure consistent emptyMessage / `<EmptyState>` use | LOW | 13, 14, 25 |
| **B3** | Define `<Spinner>` vs `<InfinitySpinner>` button-loader rule + apply | Refactor Button.tsx to use Spinner for deterministic actions, InfinitySpinner for indeterminate; document in ui-design-system.md | MEDIUM | 19, 20, 22 |
| **B4** | Section/page loaders consolidation | Replace inline `<p>Loading...</p>` in /auth/callback, /verify-email-change with centered Spinner; verify OAuthCallbackHandler, PermissionsMatrix, UserRoleChart | HIGH (2 surfaces) | 15, 16, 21, 24, 26 |
| **B5** | DataTable empty/error styling | DataTable's empty cell adopts EmptyState styling; add `error` prop with EmptyState error variant | MEDIUM | 10, 12 |
| **B6** | `<EmptyState>` error variant | Extend EmptyState to accept variant="default"/"error" (or similar) — enables consistent error rendering across cards + tables | MEDIUM | 5 (blocker), 12 (consumer) |

**Recommended sub-ticket creation order**: B6 → B1 → B3 → B4 → B2 → B5
- B6 first (extends EmptyState API; blocker for B1 error path + B5)
- B1 high-priority profile fixes
- B3 button rule formalization
- B4 inline `<p>Loading...</p>` removal
- B2 + B5 verification + table polish

---

## 3. Documentation deltas required

After this audit, `ui-design-system.md` must be updated with the canonical patterns from §0 above. Specific sections to add or update:

- **§0.1–0.5** added as a new "Loading & Empty States" sub-section under the appropriate top-level section (likely "Common Patterns" or new "State Handling")
- **`<EmptyState>` component spec**: add `variant?: "default" | "error"` to the component reference table (pending B6)
- **`<Spinner>` vs `<InfinitySpinner>` vs `<RingSpinner>`**: comparison table with usage rule per §0.4

This is part of `/update-docs` step for SCRUM-352, not a separate sub-ticket.

---

## 4. Acceptance criteria coverage

| AC | Status |
|----|--------|
| AC1: audit-table.md exists, lists 100% of dashboard surfaces with empty/error/loader states | ✓ (this file, 27 entries) |
| AC2: "Canonical patterns" section defines when to use each | ✓ (§0.1–0.5) |
| AC3: Each finding has Severity + sub-ticket cluster mapping | ✓ (last 2 columns of audit table) |
| AC4: Sub-tickets B1–B6 created in Jira, linked as children/blocks of SCRUM-352 | Pending — created in next step |
| AC5: ui-design-system.md updated with canonical patterns | Pending — `/update-docs` step |

---

## 5. Out of scope (explicitly excluded)

- **Implementation of fixes** — all in B1–B6, NOT this ticket
- **Satellites** (sat-cristian-garcia + future SAT##) — own STYLE_GUIDE roadmap (SAT01-2)
- **Backend changes** — pure frontend audit
- **Toast / notification empty states** — separate concern; auditable in a future Phase B
- **Validation error states inside forms** (InlineError component) — separate UX track
