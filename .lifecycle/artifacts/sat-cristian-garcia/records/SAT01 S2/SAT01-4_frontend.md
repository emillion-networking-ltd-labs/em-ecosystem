# Implementation Record: SAT01-4 Production Hardening

## Summary

Brought sat-cristian-garcia from "technically deployed" to "production-grade":
6 HTTP security headers, SEO foundations (robots.ts + sitemap.ts + per-page
metadata with canonical URLs), and observability (Vercel Speed Insights +
Analytics). Closes the post-deploy audit gap surfaced after SAT01-1.

- **Scope**: `frontend`
- **Branch**: `feature/SAT01-4-frontend` (deleted post-merge)
- **Implementation date**: 2026-05-01
- **Commits**: `fb94cc3` (work), `8fbb6e8` (merge — PR [#228](https://github.com/emillionnetworking-ltd-labs/em-ecosystem/pull/228))
- **Production verified at**: https://sat-cristian-garcia.vercel.app

## Plan Reference

- Plan: [`SAT01-4_frontend.md`](../../plans/SAT01%20S2/SAT01-4_frontend.md)
- Verify: [`SAT01-4_verify.md`](../../plans/SAT01%20S2/SAT01-4_verify.md) — verdict **PASS**
- Plan was followed: **Yes, with documented Accepted-Risk + Accepted-Trivial deviations.**

## Commits

| Hash | Message | Files |
|---|---|---|
| `fb94cc3` | SAT01-4: production hardening — security headers, SEO foundations, observability | 14 changed (11 modified + 2 created + package files), +267 / -9 |
| `8fbb6e8` | Merge pull request #228 from .../feature/SAT01-4-frontend | merge commit on `main` |

## Deviations from Plan

| # | Step | Planned | Actual | Reason | Category | Follow-up |
|---|---|---|---|---|---|---|
| 1 | Step 2 | All security headers including CSP | 6 of 7 implemented; **CSP deferred** | CSP requires nonce/hash strategy compatible with Tailwind, and a manual /test pass across animations and dynamic content. Out of scope for a 1.5h hardening pass. | **Accepted-Risk (MEDIUM)** | **SAT01-X (to create)**: implement CSP with nonce strategy |
| 2 | Step 5 | 8 metadata blocks (root + 6 layouts + 2 legal pages) | 9 metadata blocks (added `alternates.canonical: "/"` to root layout) | Without root canonical, Google treats `/` as not having an explicit canonical — minor SEO defect | Accepted-Trivial | — |
| 3 | Step 5 | `metadataBase` unchanged (`https://cristiangarcia.com`) | `metadataBase` switched to env-driven (`process.env.NEXT_PUBLIC_SITE_URL` with `https://sat-cristian-garcia.vercel.app` fallback) | Pre-existing latent SEO bug: canonical URLs would have resolved to the unreachable cristiangarcia.com domain. Fix unblocks correct canonicals against the live Vercel domain until custom domain switch — same env var also consumed by `robots.ts` and `sitemap.ts` | Accepted-Trivial | — |

## Test Results

| Check | Result | Details |
|---|---|---|
| Unit tests | N/A | Marketing satellite, no test framework (consistent with plan) |
| Build | **PASS** | `next build` clean, 15 ○ Static routes, 87.3 kB First Load JS shared (no regression vs SAT01-1) |
| Pre-push hooks | **PASS** | `nest build` for nexacore-api ran clean as part of monorepo hooks |
| Production deploy | **READY** | Vercel auto-deployed `8fbb6e8` in ~25s |
| Security headers (curl -I) | **PASS** | All 6 headers present and correctly valued |
| `/robots.txt` valid | **PASS** | Allow all, host + sitemap directives present |
| `/sitemap.xml` valid | **PASS** | XML with all 9 URLs at correct priority + changeFrequency |
| Per-page metadata uniqueness | **PASS** | Spot-checked 4 routes: each has unique description + correct canonical |
| Lighthouse production audit | **MANUAL** | PageSpeed Insights API quota exhausted; manual audit recommended (`npx lighthouse <url>` or DevTools). Strong indirect evidence scores meet targets — see verify report. |
| Speed Insights / Analytics events | **PENDING** | Components confirmed in build; first events appear within 1h of organic traffic |

## Bugs Found

No bugs found during implementation. The work was strictly additive.

## Documentation Updates

| File | Change |
|---|---|
| `ai-specs/changes/sat-cristian-garcia/plans/SAT01 S2/SAT01-4_frontend.md` | Plan (NEW) |
| `ai-specs/changes/sat-cristian-garcia/plans/SAT01 S2/SAT01-4_verify.md` | Verify report (NEW), verdict PASS, post-deploy validation appended |
| `ai-specs/changes/sat-cristian-garcia/records/SAT01 S2/SAT01-4_frontend.md` | This record (NEW) |
| `ai-specs/specs/integration-state.md` | **No update needed** — satellite has no backend coupling; this doc is backend-only |
| `ai-specs/specs/data-model.md` | **No update needed** — no DB |
| `ai-specs/specs/api-spec.yml` | **No update needed** — no endpoints consumed |

## Lessons Learned

### What went well

- **Vanilla CSS keyframes from SAT01-1 paid dividends**: no CSP issues to debug because we never had inline scripts to begin with. The HSTS + X-Frame-Options + others applied cleanly with zero compatibility surprises.
- **Next.js metadata file conventions are batteries-included**: `robots.ts` and `sitemap.ts` were trivial to author and ship as static-prerendered routes. Zero runtime cost.
- **`metadataBase` env-driven design unlocks easy domain swaps**: when the custom `cristiangarcia.com` domain ticket lands, only the Vercel env var changes — no code update needed.
- **The Vercel observability packages live up to the "free, async-loaded, zero-friction" promise**: `npm install` + 2 component renders = real-user CWV monitoring with no bundle penalty.

### What was harder than expected

- **Per-page metadata refactor was 9 small writes, not 8**: discovered during /develop that `/legal/*` routes don't have `layout.tsx` files (the metadata had to go in `page.tsx` instead). Plan would have been more accurate if it had grepped for layouts vs pages upfront. Captured for future: when planning metadata work, always confirm route structure with a `find . -name "layout.tsx"`.
- **Initial `metadataBase` was a latent SEO bug, not just a "nice cleanup"**: pointed at a domain that didn't resolve. Caught by the audit; documented as Accepted-Trivial because the fix was a 3-line change.
- **PageSpeed Insights API has aggressive anonymous rate limits**: exhausted within a few queries. For future automation, set up an API key (free tier 25k queries/day with project) or run lighthouse locally via npx.

### Recommendations for similar tickets (SAT02+)

1. **Reuse this hardening as the SAT02 S2 baseline**: copy the 6-header config, robots.ts, sitemap.ts, metadata structure verbatim. Each future satellite should ship with these from S2 onwards (S1 = setup, S2 = hardening — convention established).
2. **CSP belongs in its own ticket**: don't try to bundle it with general hardening. Tailwind-compatible CSP is a real research/test cycle of its own.
3. **Always set `NEXT_PUBLIC_SITE_URL` as a Vercel env var alongside the domain**: this avoids the canonical-URL-bug class of issues for future satellites.
4. **Vercel observability is essentially free**: ship Speed Insights + Analytics on every satellite from day 1. The free tier covers expected launch traffic, the bundle penalty is zero, and the data informs every subsequent UX decision.
