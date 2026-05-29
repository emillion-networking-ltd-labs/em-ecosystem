# Implementation Record: SCRUM-306 Avatar Upload with Image Cropper

## Summary

Fullstack avatar upload feature: backend StorageModule with file upload/serve infrastructure, frontend ImageCropper component with react-easy-crop, non-destructive original image preservation for re-editing, and design system enhancements (IconButton tooltips, ConfirmModal xl size).

- **Scope**: fullstack
- **Branch**: `feature/SCRUM-306-fullstack`
- **PR**: #204 (merged)
- **Implementation dates**: 2026-04-13 to 2026-04-15

## Plan Reference

- Plan: `ai-specs/changes/dashboard/plans/Sprint 14/SCRUM-306_fullstack.md`
- Plan was followed: **Partially** — all planned features implemented plus significant enhancements (original image preservation, crop data persistence, CSP fixes, tooltips, confirmation modal)

## Commits

| Hash | Message | Key Files Changed |
|------|---------|-------------------|
| `839ed43` | SCRUM-306: Avatar upload with image cropper + original preservation | 35 files (991+, 49-) |
| `898e946` | Merge pull request #204 | merge commit |

## Deviations from Plan

| Step | Planned | Actual | Reason | Category | Follow-up |
|------|---------|--------|--------|----------|-----------|
| 4 | FileInterceptor (single file) | FileFieldsInterceptor (avatar + original) | Support original image preservation | Accepted-Trivial | — |
| 5 | uploadAvatar saves only crop | Saves original file + cropData to DB | Non-destructive re-editing | Accepted-Trivial | — |
| 8 | Full test suite for avatar endpoints | Mock stubs only, no test cases | Time constraint | Accepted-Quality | SCRUM-312 |
| 11 | Fixed 256px output | Native crop dimensions | Better quality preservation | Accepted-Trivial | — |
| 12 | Basic ImageCropper | Extended with CropData, initialCropData, cropSize, initialCroppedAreaPercentages | Crop position restoration | Accepted-Trivial | — |
| 14 | Overlay buttons on avatar | Buttons positioned right of avatar + confirmation modal | Better UX | Accepted-Trivial | — |
| 16-17 | Update API spec + docs | Deferred to /update-docs | Per workflow | Deferred | This record |

### Unplanned additions
- Prisma migration: `avatarOriginalUrl String?` + `avatarCropData Json?` on User
- CSP: `img-src ${apiUrl}` for uploaded files, `style-src 'unsafe-inline'` for react-easy-crop
- `resolveAvatarSrc()` in Avatar.tsx — resolves `/uploads/` to API URL
- IconButton `tooltip` + `tooltipPosition` props — wraps in Tooltip component
- ConfirmModal `xl` size (720px)
- Remove avatar confirmation modal (variant=danger)
- Tooltip `whitespace-nowrap` auto-width
- `.cropper-crop-area` CSS class (dashed border on crop circle)
- `.gitignore` `uploads/` directory
- ImageCropper showcase in ComponentShowcase + component-registry entry

## Test Results

- **Backend build**: PASS (nest build clean)
- **Backend tests**: 1012/1012 pass
- **Frontend build**: PASS (npm run build clean)
- **Frontend TypeScript**: 0 new errors
- **Prettier**: All files formatted (pre-commit hook)
- **Manual verification**: Upload, crop, edit (re-crop from original), remove with confirmation — all working

## Bugs Found

| Bug | Severity | Status | Resolution |
|-----|----------|--------|------------|
| Avatar not displaying after upload — CSP blocking img-src from API | HIGH | Fixed | Added `${apiUrl}` to img-src in middleware.ts |
| react-easy-crop inline styles blocked by CSP nonce | HIGH | Fixed | Changed style-src to `'unsafe-inline'` (nonce ignores unsafe-inline per spec) |
| Crop output not matching visual preview | HIGH | Fixed | Root cause: CSP blocking inline styles prevented react-easy-crop transforms. Also switched from manual crop/zoom restoration to `initialCroppedAreaPercentages` (official react-easy-crop prop) |
| Original image deleted on re-edit | MEDIUM | Fixed | Backend now preserves `avatarOriginalUrl` when no new original file is sent |
| Prisma Json field null assignment | LOW | Fixed | Use `Prisma.JsonNull` instead of plain `null` for nullable Json fields |

## Documentation Updates

| File | Changes Made |
|------|-------------|
| `ai-specs/specs/integration-state.md` | Added StorageModule to Module Registry + changelog entry |
| `ai-specs/specs/api-spec.yml` | Added POST/DELETE /users/me/avatar endpoints |
| `ai-specs/specs/data-model.md` | Added avatarOriginalUrl + avatarCropData to User entity |
| `ai-specs/changes/dashboard/records/Sprint 14/SCRUM-306_fullstack.md` | This record |

## Lessons Learned

- **CSP + third-party libraries**: react-easy-crop uses inline styles for image positioning (transform/translate). CSP with nonce ignores `'unsafe-inline'` per W3C spec. Must check library CSS requirements before integration.
- **Crop position restoration**: The `crop {x,y}` state from react-easy-crop is layout-dependent (varies with container size). Use `initialCroppedAreaPercentages` (percentage-based) for reliable restoration — it's layout-independent.
- **Prisma Json null**: Nullable Json fields require `Prisma.JsonNull` token, not plain `null`, in update/create operations.
- **Original image preservation**: Saving the original image server-side enables non-destructive re-editing. The crop metadata (percentages) enables exact position restoration. This is the industry standard (Slack, GitHub).
- **Backend startup test**: Always run `nest start` after DI changes to catch dependency resolution errors that `nest build` misses.
