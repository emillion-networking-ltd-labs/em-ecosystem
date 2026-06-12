---
schema: freeze-status.schema.yml
last_updated: 2026-05-13

modules:
  - name: auth
    status: stable
    charter: specs/modules/auth/module-charter.md
    boundary: specs/modules/auth/module-boundary.md
    baseline: specs/modules/auth/stable-baseline.md
    since: 2026-05-13
    last_audit: audit-2026-05-09T01-10
    unfreeze_label: unfreeze-auth
    approvals_required: 2

  - name: users
    status: active
    charter: specs/modules/users/module-charter.md
    boundary: specs/modules/users/module-boundary.md
    since: 2026-05-13
---

# Global Freeze Status

Cross-module registry of lifecycle state. **The single source of truth** consumed by `check-freeze.py` (the CI gate) and, eventually, the ecosystem dashboard. Each entry mirrors the `status` of the corresponding `module-charter.md`; Phase 11 audit (Wave 4) catches drift.

This file is **machine-readable first, human-readable second**. The frontmatter is what CI reads; the body explains the policy.

## Status overview

Current snapshot. Update this file (and the affected module's charter in lockstep) when a status transitions.

| Module | Status | Since | Charter | Baseline | Last audit | Unfreeze label | Approvals |
|---|---|---|---|---|---|---|---|
| `auth` | **stable** | 2026-05-13 | [charter](modules/auth/module-charter.md) | [baseline](modules/auth/stable-baseline.md) | audit-2026-05-09T01-10 | `unfreeze-auth` | 2 |
| `users` | active | 2026-05-13 | [charter](modules/users/module-charter.md) | — | — | — | — |

**Not yet onboarded** (no charter, no entry in this file): `permissions`, `security`, `sessions`, `audit`, `geolocation`, `mail`, `common`, `dashboard`, plus satellite apps.

### Status semantics

| Status | Meaning | CI gate behavior |
|---|---|---|
| `active` | Module under normal development. No special protection. | No gate — all PRs pass freely. |
| `stable` | Module has reached a 0-FAIL audit baseline. Public surface is protected. | PRs touching the module's source tree MUST carry the `unfreeze-<module>` label. Without it, `check-freeze.py` blocks the merge. |
| `frozen` | Module deliberately locked (pre-release, security review, etc.). NO changes accepted without explicit unfreeze. | Same as `stable` — `unfreeze-<module>` label required. Documented `frozen_reason` makes the intent clear. |
| `deprecated` | End-of-life. Should not receive code changes. | No gate enforcement, but Phase 11 audit (Wave 4) emits a WARN per commit. |

## Freeze ritual

Promote a module from `active` to `stable`:

1. Run `/audit <module> full` and remediate every FAIL until the audit hits 0-FAIL.
2. Create `specs/modules/<module>/stable-baseline.md` per [`stable-baseline.schema.yml`](../schemas/stable-baseline.schema.yml). Capture the audit hash, real metrics (LOC, files, coverage, endpoints, models), and the public surface.
3. Update `specs/modules/<module>/module-charter.md` frontmatter: `status: active` → `stable`, populate `last_audit`, `last_audit_verdict: PASS`, `baseline: stable-baseline.md`.
4. Update THIS file: add or update the module's entry — `status: stable`, populate `baseline`, `last_audit`, `since`, `unfreeze_label`, `approvals_required`.
5. Open a single PR with all three files committed together. CI runs `check-freeze.py --check` to verify the entries are internally consistent.
6. Once merged: the module's stable status is in effect. Future PRs touching it MUST carry `unfreeze-<module>` label to make breaking changes.

Promoting from `stable` to `frozen` (e.g., release-candidate lockdown):

1. Update this file's entry: `status: stable` → `frozen`, add `frozen_at`, `frozen_by` (your handle), `frozen_reason` (≥10 chars).
2. Update charter: same status change.
3. Single PR. After merge, ALL PRs touching the module require unfreeze label until status is reset.

## Unfreeze ritual

Making a breaking change to a `stable` module (or any change to a `frozen` module):

1. **Open the PR** modifying the module. CI's `check-freeze.py` will report FAIL.
2. **Add the label** `unfreeze-<module>` (e.g., `unfreeze-auth`) — exactly matching the module's `unfreeze_label` field above.
3. **Update the baseline** as part of the SAME PR. Per [`stable-baseline.schema.yml`](../schemas/stable-baseline.schema.yml) `breaking_changes.new_baseline_after_merge: true`: the new `stable-baseline.md` is committed in this PR, and the previous version becomes a date-suffixed archive (e.g., `stable-baseline-2026-05-13.md`). The new file's `previous_baseline` field links to the archive.
4. **Get N approvals** where N is the `approvals_required` value in this file (default: 2).
5. CI re-runs `check-freeze.py`. With the label present + approvals met, the gate passes.
6. On merge, the new baseline is in effect. From that point, the next breaking change starts the ritual again.

Returning a module from `frozen` to `stable` (lifting the freeze without a breaking change):

1. Update this file: `status: frozen` → `stable`, remove `frozen_at`, `frozen_by`, `frozen_reason`.
2. Update charter accordingly.
3. Single PR. Once merged, the gate reverts to "breaking changes only require unfreeze label", not "every change".

## Adding a module to this registry

When a new module is created (or an existing module's charter is written for the first time):

1. Confirm `specs/modules/<module>/module-charter.md` exists and validates.
2. Append a new entry to `modules:` above. Minimum required for `active`: `name`, `status`, `charter`, `since`.
3. The module is now under the gate (no protection while `active`, but tracked).
4. When the module transitions to `stable`, follow the Freeze ritual above.

Active modules accumulate here as charters land. Wave 3 lands the two pilots (`auth`, `users`); the remaining ~8 modules onboard incrementally in later work.

## How CI uses this file

The repo `em-ecosystem-code` includes a GitHub Actions workflow that runs on every PR (template `freeze-gate-workflow-template.yml`). The workflow:

1. Computes the list of changed paths in the PR vs `main`.
2. Maps each changed path to a module (by inspecting `nexacore-api/src/<module>/*` and similar conventions).
3. Reads THIS file via `check-freeze.py`.
4. For each affected module:
   - `active` → pass.
   - `stable` or `frozen` → require label `unfreeze-<module>` on the PR. If missing, fail.
5. Surfaces a clear message linking back to the Unfreeze ritual above.

The CI workflow YAML is provided as a template by the framework; the consuming repo (em-ecosystem-code) copies it into `.github/workflows/freeze-gate.yml`. Wiring is an em-ecosystem ticket, not a framework ticket.

## References

- `freeze-status.schema.yml` — schema this file conforms to.
- `stable-baseline.schema.yml` — companion schema (per-module).
- `check-freeze.py` — the gate script.
- `freeze-gate-workflow-template.yml` — CI workflow template.
- Each `specs/modules/<module>/module-charter.md` — per-module identity.
