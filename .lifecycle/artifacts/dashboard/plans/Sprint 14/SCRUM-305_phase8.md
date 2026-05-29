# SCRUM-305 Phase 8 — Plan: Unify page headers (title + breadcrumbs)

## Scope
Frontend

## Reference
Design System page uses the correct pattern:
```
<div className="mb-6 flex items-center gap-2">
  <h1 className="text-h2 font-semibold text-content-primary">Title</h1>
  <span className="inline-block h-6 w-px bg-border-strong" />
  <Breadcrumbs items={[...]} />
</div>
```

## Analysis

| Page | Current | Fix needed |
|------|---------|------------|
| Design System | title + separator + breadcrumbs inline | REFERENCE — no change |
| User Management | breadcrumbs above, h1 below | Merge into one line |
| Audit Logs | breadcrumbs above, h1 + description below | Merge into one line, keep description below |
| Permissions | breadcrumbs above, h1 below | Merge into one line |
| Dashboard | h1 only, no breadcrumbs | Add breadcrumbs inline |
| Profile | h1 only, no breadcrumbs | Add breadcrumbs inline |
| Settings | breadcrumbs above, h1 below | Merge into one line |

## Steps

### Step 1 — User Management (admin/page.tsx)
Merge breadcrumbs + title into one line with separator

### Step 2 — Audit Logs (admin/audit-logs/page.tsx)
Merge breadcrumbs + title into one line, description stays below

### Step 3 — Permissions (admin/permissions/page.tsx)
Merge breadcrumbs + title into one line

### Step 4 — Dashboard (dashboard/page.tsx)
Add breadcrumbs inline with existing title

### Step 5 — Profile (profile/page.tsx)
Add breadcrumbs inline with title

### Step 6 — Settings (settings/page.tsx)
Merge breadcrumbs + title into one line

### Step 7 — Build verification
