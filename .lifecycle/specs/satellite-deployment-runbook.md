# Satellite Deployment Runbook

> **Operational document.** Step-by-step procedure for taking a new satellite app
> from green-field to production. Captures the gotchas and conventions
> established during SAT01 (Cristian García, 2026-04-30 → 2026-05-01).
>
> Future satellites should **follow this runbook section by section**, not
> re-derive the procedure from scratch.

---

## Scope

This runbook covers:

- Sprint structure: **S1 (Setup & Landing)** + **S2 (Production Hardening)**
- Vercel project provisioning via API
- GitHub App / Vercel integration prerequisites
- Custom domain wiring
- Production verification

Out of scope:

- The implementation of the satellite UI (covered by per-ticket plans)
- The em-ui CLI for component distribution (SCRUM-331)
- Backend integration with NexaCore (only relevant when satellite consumes API)

---

## 0. Prerequisites (one-time per Vercel team)

These steps **must be done once** before the first satellite is deployed; subsequent
satellites reuse the established connection.

### 0.1 Vercel API token

1. Sign in to Vercel as the team owner
2. Go to https://vercel.com/account/tokens
3. **Create Token**:
   - Name: `claude-code-em-ecosystem` (or similar identifier)
   - Scope: target team (e.g., `emillionnetworking-ltd-labs-projects`)
   - Expiration: **90 days** (rotate at expiry — do not use indefinite tokens)
4. Save the token to `integrations/vercel-api/.env`:
   ```env
   VERCEL_TOKEN="vcp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   VERCEL_TEAM_ID="team_xxxxxxxxxxxxxxxxxxxxxxxx"
   VERCEL_TEAM_SLUG="your-team-slug"
   GITHUB_ORG="your-github-org"
   ```
5. Verify with `curl`:
   ```bash
   export $(grep -v '^#' integrations/vercel-api/.env | xargs)
   curl -s -H "Authorization: Bearer $VERCEL_TOKEN" "https://api.vercel.com/v2/user" | python3 -m json.tool
   ```
   Expected: `user.username` returns the team owner identity.

### 0.2 Vercel GitHub App installation

This is the **most-overlooked prerequisite**. Vercel can NOT see GitHub repos until
this is done — the API will return 0 repos in `search-repo` calls.

1. Open https://github.com/apps/vercel/installations/new
2. Select the GitHub org that owns the satellite repo (`emillionnetworking-ltd-labs`)
3. Choose **"Only select repositories"** (principle of least privilege)
4. Add **`em-ecosystem`** to the allowed list (and any other repos future satellites might live in)
5. Click **Install**. GitHub will redirect to Vercel; complete any final linking prompt.
6. Verify via API:
   ```bash
   curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
     "https://api.vercel.com/v1/integrations/git-namespaces?provider=github"
   ```
   Expected: returns at least one namespace entry. Note the `installationId` and the
   `slug` — needed in step 1.2.
7. Confirm the repo is searchable:
   ```bash
   NS_ID=<installationId from step 6>
   curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
     "https://api.vercel.com/v1/integrations/search-repo?provider=github&namespaceId=$NS_ID&teamId=$VERCEL_TEAM_ID"
   ```
   Expected: returns the `em-ecosystem` repo with a `repos[0].id` (numeric GitHub repo ID — needed in step 1.4).

If step 7 returns 0 repos, the GitHub App was installed but the satellite repo is
not in its access list. Go back to https://github.com/settings/installations,
configure the Vercel app, and add the repo.

---

## 1. Sprint S1 — Setup & Landing

**Goal**: scaffold the satellite, build the marketing site, ship to Vercel under
the default `*.vercel.app` URL. No custom domain, minimal observability — that's S2.

**Estimated effort**: 1-2 weeks depending on the volume of bespoke content.

### 1.1 Jira project + sprint setup

1. Create the Jira project (if not already): key `SAT{NN}` where `NN` is the next
   sequential number (e.g., SAT02). Project type: Scrum.
2. Create the first sprint via the Agile API:
   ```bash
   export $(grep -v '^#' integrations/jira-mcp-server/.env | xargs)
   BOARD_ID=$(curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
     "$JIRA_BASE_URL/rest/agile/1.0/board?projectKeyOrId=SAT02" | \
     python3 -c "import sys,json; print(json.loads(sys.stdin.read())['values'][0]['id'])")
   curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" -H "Content-Type: application/json" \
     -X POST "$JIRA_BASE_URL/rest/agile/1.0/sprint" \
     -d "{\"name\":\"SAT02 S1 - Setup & Landing\",\"originBoardId\":$BOARD_ID,\"goal\":\"Scaffold satellite, build marketing pages, deploy to Vercel default URL.\"}"
   ```
   **Important**: Sprint names are limited to 30 characters by Jira — keep within
   the established convention (e.g., `SAT02 S1 - Setup & Landing`).
3. Create the implementation ticket SAT02-1 from the
   [`templates/satellite-S1-setup-plan.md`](templates/satellite-S1-setup-plan.md)
   template.
4. Assign the ticket to the sprint via the Agile API:
   ```bash
   curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" -H "Content-Type: application/json" \
     -X POST "$JIRA_BASE_URL/rest/agile/1.0/sprint/<sprint-id>/issue" \
     -d '{"issues":["SAT02-1"]}'
   ```

### 1.2 Code scaffold

Per the folder convention in `frontend-standards.mdc` "Building Satellite App
Frontends":

1. From `em-ecosystem-code/` root, run:
   ```bash
   cd em-ecosystem-code/satellites
   npx create-next-app@14 sat-{client-kebab} --typescript --tailwind --app --src-dir
   ```
2. Update `package.json`:
   - Name: `@em-ecosystem/sat-{client-kebab}`
   - Add `"engines": { "node": ">=22.0.0" }`
3. Copy the design tokens from `nexacore-dashboard/src/app/globals.css` (`:root` and
   `.dark` blocks) and `nexacore-dashboard/tailwind.config.ts` (semantic color
   definitions). Customise per-satellite tokens (e.g., accent color) in the same
   file by overriding the relevant CSS variables.
4. Copy UI Core components from `nexacore-dashboard/src/components/ui/` to the new
   satellite's `src/components/ui/`. (Once SCRUM-331's `em-ui` CLI ships, replace
   manual copy with `em-ui add <component>`.)

### 1.3 Build + per-page metadata + IntroLoader

Implement per the ticket plan. By the end of S1 the satellite should have:

- All public marketing routes (typically: `/`, `/sobre-mi`, `/servicios`,
  `/portfolio`, `/testimonios`, `/contacto`, `/precios`, `/legal/privacidad`,
  `/legal/terminos`)
- Page titles in each route layout (or page.tsx for routes without layout)
- Open Graph baseline metadata in root layout
- IntroLoader splash screen on first session visit (vanilla CSS keyframes, no
  Framer Motion — keeps bundle lean)

**Hardening (security headers, robots.ts, sitemap.ts, Speed Insights, Analytics)
is intentionally NOT done in S1.** That's S2's scope, and bundling it into S1
makes the verify gate harder to interpret.

### 1.4 First Vercel deployment

After build passes locally and the code is merged to `main`:

1. Get the GitHub repo numeric ID:
   ```bash
   curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
     "https://api.vercel.com/v1/integrations/search-repo?provider=github&namespaceId=$NS_ID&teamId=$VERCEL_TEAM_ID" | \
     python3 -c "import sys,json; print(json.loads(sys.stdin.read())['repos'][0]['id'])"
   ```
2. Create the Vercel project:
   ```bash
   curl -s -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
     -X POST "https://api.vercel.com/v11/projects?teamId=$VERCEL_TEAM_ID" \
     -d '{
       "name": "sat-{client-kebab}",
       "framework": "nextjs",
       "rootDirectory": "satellites/sat-{client-kebab}",
       "gitRepository": {
         "type": "github",
         "repo": "emillionnetworking-ltd-labs/em-ecosystem"
       },
       "commandForIgnoringBuildStep": "git diff HEAD^ HEAD --quiet ./"
     }'
   ```
   Save the returned `id` (e.g., `prj_xxxxxxxx`). This is the Vercel project ID.
3. Patch the Node version (cannot be set during creation):
   ```bash
   curl -s -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
     -X PATCH "https://api.vercel.com/v9/projects/$PROJ_ID?teamId=$VERCEL_TEAM_ID" \
     -d '{"nodeVersion":"22.x"}'
   ```

### 1.5 First-deploy gotcha — Ignored Build Step bypass

> **THIS IS THE MOST IMPORTANT GOTCHA IN THIS RUNBOOK.** Skip it and the first
> deploy will silently cancel itself with no clear error.

**The problem**: `commandForIgnoringBuildStep: "git diff HEAD^ HEAD --quiet ./"`
runs from the satellite's `rootDirectory` and checks whether the LATEST commit on
main touched that directory. On the first deploy, the latest commit is often
unrelated (e.g., a `.gitignore` update at root, a docs commit). Result: `git diff`
exits 0 → Vercel cancels the build → no deploy.

**The fix**:

1. Temporarily disable the Ignored Build Step:
   ```bash
   curl -s -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
     -X PATCH "https://api.vercel.com/v9/projects/$PROJ_ID?teamId=$VERCEL_TEAM_ID" \
     -d '{"commandForIgnoringBuildStep":null}'
   ```
2. Trigger the first production deployment:
   ```bash
   curl -s -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
     -X POST "https://api.vercel.com/v13/deployments?teamId=$VERCEL_TEAM_ID" \
     -d "{
       \"name\": \"sat-{client-kebab}\",
       \"project\": \"$PROJ_ID\",
       \"target\": \"production\",
       \"gitSource\": {
         \"type\": \"github\",
         \"ref\": \"main\",
         \"repoId\": $REPO_ID
       }
     }"
   ```
3. Poll until READY:
   ```bash
   curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
     "https://api.vercel.com/v13/deployments/$DEPL_ID?teamId=$VERCEL_TEAM_ID" | \
     python3 -c "import sys,json; d=json.loads(sys.stdin.read()); print(d.get('readyState'))"
   ```
4. **Re-enable the Ignored Build Step** (critical — without this, every commit
   anywhere in the monorepo will trigger satellite rebuilds):
   ```bash
   curl -s -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
     -X PATCH "https://api.vercel.com/v9/projects/$PROJ_ID?teamId=$VERCEL_TEAM_ID" \
     -d '{"commandForIgnoringBuildStep":"git diff HEAD^ HEAD --quiet ./"}'
   ```

After this dance, all subsequent deploys are automatic — push to main with
changes in `satellites/sat-{client-kebab}/` triggers a rebuild; pushes that don't
touch the directory are skipped.

### 1.6 Smoke test

```bash
URL="https://sat-{client-kebab}.vercel.app"
curl -sI "$URL" | head -10           # 200 OK
curl -s "$URL" | grep -E '<title>'   # site title present
```

Open the URL in a browser, verify:
- All marketing pages load
- IntroLoader plays on first session visit
- No console errors

S1 is done when all this passes. Transition the SAT-X-1 ticket to Done.

---

## 2. Sprint S2 — Production Hardening

**Goal**: bring the satellite from "technically deployed" to "production-grade":
security headers, SEO foundations, observability. **MANDATORY** before inviting
real users or the client to review.

**Estimated effort**: 1.5h dev + 30min verify.

### 2.1 Plan from template

Use [`templates/satellite-S2-hardening-plan.md`](templates/satellite-S2-hardening-plan.md)
verbatim — the deliverables are the same for every satellite. Copy the template,
swap the satellite name and content-specific descriptions, file the plan at
`ai-specs/changes/sat-{client}/plans/SAT{NN} S2/SAT{NN}-X_frontend.md`.

### 2.2 Hardening checklist (the same 6 items every time)

See the full code patterns in
[`frontend-standards.mdc` "Production Hardening Baseline"](frontend-standards.mdc):

1. **Security headers** in `next.config.mjs` — 6 headers (HSTS, X-Frame-Options,
   X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control)
2. **`src/app/robots.ts`** — auto-generated `/robots.txt`
3. **`src/app/sitemap.ts`** — auto-generated `/sitemap.xml` with all public routes
4. **Per-page metadata** — every route has `title`, `description`,
   `alternates.canonical`, `openGraph` override
5. **`metadataBase` env-driven** — `process.env.NEXT_PUBLIC_SITE_URL` with the
   Vercel default URL as fallback. Set the env var in Vercel (Step 2.3) when
   custom domain switches over.
6. **Vercel observability** — `@vercel/speed-insights` + `@vercel/analytics`
   rendered in root layout

### 2.3 Vercel environment variables

For each environment (Production, Preview, Development), set in
Settings → Environment Variables:

```
NEXT_PUBLIC_SITE_URL = https://sat-{client-kebab}.vercel.app   # production-equivalent for now
```

When the custom domain is wired (section 3), update Production to the custom
domain URL. Preview and Development should remain on the Vercel default to keep
preview deploys self-canonical.

### 2.4 Post-deploy verification

After merge → auto-deploy READY:

```bash
URL="https://sat-{client-kebab}.vercel.app"

# Headers — must show all 6
curl -sI "$URL" | grep -iE "strict-transport|x-frame|x-content-type|referrer-policy|permissions-policy|x-dns-prefetch"

# robots.txt — must show User-Agent: *, Sitemap: directive
curl -s "$URL/robots.txt"

# sitemap.xml — must show all public routes with correct priorities
curl -s "$URL/sitemap.xml"

# Per-page metadata — must show unique description + canonical per route
for ROUTE in "" "/sobre-mi" "/portfolio"; do
  echo "=== $ROUTE ==="
  curl -s "$URL$ROUTE" | grep -oE '<(meta name="description"|link rel="canonical")[^>]*>'
done
```

Run Lighthouse manually (PageSpeed Insights API has aggressive anonymous
quota — register an API key for automation):

```bash
npx lighthouse "$URL" --view --form-factor=mobile
```

Targets: Performance ≥ 90, SEO ≥ 95, Best Practices ≥ 95, Accessibility ≥ 90.

### 2.5 Vercel observability

After ~1 hour of organic traffic (or a manual visit):

- Vercel dashboard → project → **Speed Insights** tab: should show at least one event
- Vercel dashboard → project → **Analytics** tab: should show page view(s)

If empty after 24 hours with confirmed visits, the integration in `layout.tsx` is
broken — re-verify the `<SpeedInsights />` and `<Analytics />` components are
rendered.

S2 is done when:
- Verify report PASS
- Lighthouse scores meet targets
- Observability events visible in Vercel dashboards

---

## 3. Custom domain (when client confirms)

This is typically a separate ticket after S2 (e.g., `SAT{NN} S3 - Launch`).

### 3.1 Add domain to Vercel project

```bash
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
  -X POST "https://api.vercel.com/v10/projects/$PROJ_ID/domains?teamId=$VERCEL_TEAM_ID" \
  -d '{"name":"clientname.com"}'
```

### 3.2 Add www subdomain too (recommended)

```bash
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
  -X POST "https://api.vercel.com/v10/projects/$PROJ_ID/domains?teamId=$VERCEL_TEAM_ID" \
  -d '{"name":"www.clientname.com","redirect":"clientname.com","redirectStatusCode":308}'
```

Vercel returns DNS records the client must configure with their registrar
(typically an A record for apex pointing at `76.76.21.21` and a CNAME for `www`
pointing at `cname.vercel-dns.com`).

### 3.3 Update env var

After verification (Vercel will show "Valid Configuration" once DNS propagates):

```bash
# Update NEXT_PUBLIC_SITE_URL for Production environment to the custom domain
# (use Vercel UI Settings → Environment Variables, or PATCH via API)
```

### 3.4 SSL

Automatic via Let's Encrypt as soon as DNS is verified. No manual step.

---

## 4. Ongoing operations

### 4.1 Triggers — what causes a deploy

| Action | Vercel response |
|---|---|
| Push to `main` with changes in `satellites/sat-{client-kebab}/` | Production deploy auto |
| Push to `main` without changes in that directory | Build skipped (Ignored Build Step) |
| Open PR with changes in the directory | Preview deploy auto, URL commented in PR |
| Merge PR | Production updated |

### 4.2 Rollback

Vercel dashboard → project → Deployments → previous READY deployment → **Promote to Production**.
Atomic, ~1 second. No code changes needed.

### 4.3 Token rotation

Every 90 days (or on suspicion of leak):

1. Generate new token at https://vercel.com/account/tokens
2. Update `integrations/vercel-api/.env`
3. Revoke the old token

---

## 5. Common failures and fixes

| Symptom | Cause | Fix |
|---|---|---|
| First deploy state = `CANCELED` immediately, no error log | Ignored Build Step blocked because last commit didn't touch the satellite directory | Section 1.5 — disable, deploy, re-enable |
| `search-repo` API returns 0 repos | Vercel GitHub App not installed on org, or repo not in selected list | Section 0.2 — install app, add repo to access list |
| Build fails with "No Next.js version detected" | `rootDirectory` not set or wrong path | PATCH the project with correct `rootDirectory` |
| `nodeVersion` rejected on project creation | Field not allowed at creation time | Create first, then PATCH `nodeVersion` separately |
| Canonical URLs point at unreachable domain | Hardcoded `metadataBase` to a domain that doesn't exist yet | Use env-driven `metadataBase` (section 2.2) |
| All commits triggering all satellite rebuilds | Ignored Build Step disabled and never re-enabled after first-deploy bypass | PATCH `commandForIgnoringBuildStep` back to `git diff HEAD^ HEAD --quiet ./` |
| Lighthouse SEO score < 90 | Missing canonical, robots.txt, or sitemap.xml | Re-run section 2.4 verification |

---

## 6. References

- `frontend-standards.mdc` — Building Satellite App Frontends + Production Hardening Baseline
- `workflow-standards.mdc` — Satellite Sprint Convention
- `product-roadmap.md` — Phase E
- `templates/satellite-S1-setup-plan.md` — S1 plan template
- `templates/satellite-S2-hardening-plan.md` — S2 plan template
- `integrations/vercel-api/README.md` — API token + curl examples
- SCRUM-331 — em-ui CLI for satellite UI Core distribution (when ready, replaces manual component copy)

## 7. Changelog

| Date | Change | Source |
|---|---|---|
| 2026-05-01 | Initial document — captures SAT01 (Cristian García) deployment learnings | SAT01-1, SAT01-4 |
