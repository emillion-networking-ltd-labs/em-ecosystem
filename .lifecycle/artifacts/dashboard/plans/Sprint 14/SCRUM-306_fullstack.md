# Fullstack Implementation Plan: SCRUM-306 Avatar Upload with Image Cropper

---

## Codebase State Snapshot

- **Date**: 2026-04-13
- **Last completed ticket**: SCRUM-305 Phase 13-15 (Mobile responsive + Global notifications)
- **Integration state verified**: Yes
- **Files verified against live code**:
  - `nexacore-api/src/users/users.controller.ts` — 11 endpoints, constructor: `UsersService` only
  - `nexacore-api/src/users/users.service.ts` — constructor: 7 deps (PrismaService, AuditService, SessionsService, MailService, PasswordBreachService, TrustedDeviceService, TokenDenyListService)
  - `nexacore-api/src/users/users.module.ts` — imports: AuditModule, SessionsModule, MailModule, forwardRef(AuthModule)
  - `nexacore-api/src/users/dto/update-profile.dto.ts` — avatarUrl as @IsUrl @MaxLength(500) optional string
  - `nexacore-api/src/users/entities/user.entity.ts` — SafeUser includes avatarUrl (not omitted)
  - `nexacore-api/src/app.module.ts` — 11 module imports, no ServeStaticModule, no storage module
  - `nexacore-api/prisma/schema.prisma:74` — User.avatarUrl String? already exists
  - `nexacore-api/package.json` — @nestjs/platform-express ^11.1.17 installed, @types/multer NOT installed
  - `nexacore-dashboard/src/components/ui/Avatar.tsx` — 3-tier fallback (img → initials → icon), sizes sm/md/lg
  - `nexacore-dashboard/src/components/profile/ProfileForm.tsx:206-210` — display-only avatar, NO buttons
  - `nexacore-dashboard/src/lib/api.ts` — no multipart upload method, Content-Type always application/json
  - `nexacore-dashboard/src/lib/types.ts` — SafeUser.avatarUrl: string|null, UpdateProfileDto.avatarUrl?: string
  - `nexacore-dashboard/src/context/AuthContext.tsx:219-239` — refreshSession() fetches fresh user via /auth/me
  - `nexacore-dashboard/src/lib/toast-messages.ts` — PROFILE_TOAST section with success/error pattern
  - `nexacore-dashboard/src/components/ui/Slider.tsx` — value/onChange(number)/min/max/step props
  - `nexacore-dashboard/src/components/ui/ConfirmModal.tsx` — sizes sm/md/lg, children slot, focus trap
  - `nexacore-dashboard/package.json` — react-easy-crop NOT installed

- **Constructor signatures verified**:
  - `UsersController(private readonly usersService: UsersService)` — 1 dep
  - `UsersService(prisma, auditService, sessionsService, mailService, @Inject(forwardRef) passwordBreachService, @Inject(forwardRef) trustedDeviceService, @Inject(forwardRef) tokenDenyListService)` — 7 deps

- **Discrepancies with integration-state.md**: integration-state.md is in ai-specs repo (separate from em-ecosystem-code), not directly accessible from code repo. Verified all state from live code.

---

## Regression Impact Analysis

### Blast radius

**Backend (direct dependents of modified files):**
- `users.controller.ts` — imported by: `users.module.ts`, tested by: `users.controller.spec.ts`
- `users.service.ts` — imported by: `users.controller.ts`, `auth.service.ts`, `login.service.ts`, tested by: `users.service.spec.ts`
- `users.module.ts` — imported by: `app.module.ts`
- `app.module.ts` — root module, no importers

**Frontend (direct dependents of modified files):**
- `ProfileForm.tsx` — imported by: `profile/page.tsx`
- `api.ts` — imported by: ~20+ components (but adding a method is non-breaking)
- `toast-messages.ts` — imported by: ~10+ components (adding entries is non-breaking)

### Breaking changes identified
- **None.** All changes are additive (new endpoints, new methods, new component). No existing signatures or exports change.

### API contract impact
- Two NEW endpoints: `POST /users/me/avatar`, `DELETE /users/me/avatar`. Frontend must implement. No existing endpoints change.

### Schema migration impact
- **None.** `User.avatarUrl` field already exists.

### Test files requiring updates
- `users.controller.spec.ts` — add tests for new upload/delete endpoints
- `users.service.spec.ts` — add tests for new uploadAvatar/removeAvatar methods (if added to service)

### Blast radius size: **~8 files affected** — moderate, flag for careful regression testing.

---

## BACKEND SECTION

---

### Overview

Add file upload infrastructure to NexaCore: a `StorageModule` with provider abstraction (local disk now, S3/R2 later), two new avatar endpoints (upload + delete), and file serving for uploaded assets.

### Architecture Context

- **New module**: `StorageModule` — provides `FileStorageService` interface + `LocalStorageProvider`
- **Modified module**: `UsersModule` — imports StorageModule, new controller endpoints
- **Modified root**: `AppModule` — imports StorageModule, configures ServeStaticModule for /uploads
- **Guards**: `JwtAuthGuard` on both new endpoints (same as existing `PATCH me`)
- **Audit**: `PROFILE_UPDATE` action logged for both upload and remove

### Implementation Steps

#### Step 0: Create Feature Branch
- `git checkout main && git pull origin main`
- `git checkout -b feature/SCRUM-306-fullstack`

#### Step 1: Install @types/multer
- **Action**: `cd nexacore-api && npm install -D @types/multer`
- **Why**: TypeScript types for `Express.Multer.File` used in controller

#### Step 2: Create StorageModule
- **Files**:
  - `nexacore-api/src/storage/storage.module.ts`
  - `nexacore-api/src/storage/file-storage.service.ts` (interface)
  - `nexacore-api/src/storage/local-storage.provider.ts` (implementation)
  - `nexacore-api/src/storage/index.ts` (barrel export)

- **FileStorageService interface**:
  ```ts
  interface FileStorageService {
    upload(buffer: Buffer, key: string): Promise<string>; // returns relative URL
    delete(key: string): Promise<void>;
    getPublicUrl(key: string): string;
  }
  ```

- **LocalStorageProvider**:
  - Inject `ConfigService` to read `UPLOAD_DIR` env var (default: `./uploads`)
  - `upload()`: writes to `{UPLOAD_DIR}/avatars/{key}`, returns `/uploads/avatars/{key}`
  - `delete()`: removes file from disk (fs.unlink), no-op if not found
  - `getPublicUrl()`: returns `/uploads/avatars/{key}`
  - File naming: `{userId}-{timestamp}.{ext}`

- **StorageModule**:
  ```ts
  @Module({
    providers: [{ provide: 'FILE_STORAGE', useClass: LocalStorageProvider }],
    exports: ['FILE_STORAGE'],
  })
  export class StorageModule {}
  ```

#### Step 3: Configure Static File Serving
- **File**: `nexacore-api/src/app.module.ts`
- **Action**: Add `ServeStaticModule` from `@nestjs/serve-static` to serve `/uploads` directory
- **Install**: `npm install @nestjs/serve-static`
- **Config**:
  ```ts
  ServeStaticModule.forRoot({
    rootPath: join(process.cwd(), 'uploads'),
    serveRoot: '/uploads',
    serveStaticOptions: { index: false },
  })
  ```
- **Also**: Import `StorageModule` in AppModule imports array
- **Also**: Add `uploads/` to `.gitignore`

#### Step 4: Add Avatar Endpoints to UsersController
- **File**: `nexacore-api/src/users/users.controller.ts`

- **POST me/avatar** (after existing `PATCH me` endpoint, ~line 60):
  ```ts
  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @UploadedFile(new ParseFilePipe({
      validators: [
        new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }), // 2MB
        new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
      ],
    }))
    file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const userId = (req.user as SafeUser).id;
    return this.usersService.uploadAvatar(userId, file, extractRequestMeta(req));
  }
  ```

- **DELETE me/avatar** (after POST me/avatar):
  ```ts
  @Delete('me/avatar')
  @UseGuards(JwtAuthGuard)
  async removeAvatar(@Req() req: Request) {
    const userId = (req.user as SafeUser).id;
    return this.usersService.removeAvatar(userId, extractRequestMeta(req));
  }
  ```

- **Imports to add**: `Post, Delete, UseInterceptors, UploadedFile` from `@nestjs/common`, `FileInterceptor` from `@nestjs/platform-express`, `ParseFilePipe, MaxFileSizeValidator, FileTypeValidator` from `@nestjs/common`, `Express` namespace for `Multer.File`

#### Step 5: Add Avatar Methods to UsersService
- **File**: `nexacore-api/src/users/users.service.ts`

- **Constructor change**: Add `@Inject('FILE_STORAGE') private readonly storage: FileStorageService` as 8th dependency

- **uploadAvatar method**:
  ```ts
  async uploadAvatar(userId: string, file: Express.Multer.File, ctx?: RequestContext): Promise<{ avatarUrl: string }> {
    const ext = file.originalname.split('.').pop() || 'jpg';
    const key = `${userId}-${Date.now()}.${ext}`;

    // Delete old avatar if local
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.avatarUrl?.startsWith('/uploads/')) {
      const oldKey = user.avatarUrl.replace('/uploads/avatars/', '');
      await this.storage.delete(oldKey);
    }

    const url = await this.storage.upload(file.buffer, key);
    await this.prisma.user.update({ where: { id: userId }, data: { avatarUrl: url } });

    await this.auditService.log({
      action: 'PROFILE_UPDATE',
      userId,
      details: { field: 'avatarUrl', action: 'upload' },
      ...ctx,
    });

    return { avatarUrl: url };
  }
  ```

- **removeAvatar method**:
  ```ts
  async removeAvatar(userId: string, ctx?: RequestContext): Promise<{ avatarUrl: null }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user?.avatarUrl?.startsWith('/uploads/')) {
      const key = user.avatarUrl.replace('/uploads/avatars/', '');
      await this.storage.delete(key);
    }

    await this.prisma.user.update({ where: { id: userId }, data: { avatarUrl: null } });

    await this.auditService.log({
      action: 'PROFILE_UPDATE',
      userId,
      details: { field: 'avatarUrl', action: 'remove' },
      ...ctx,
    });

    return { avatarUrl: null };
  }
  ```

#### Step 6: Update UsersModule
- **File**: `nexacore-api/src/users/users.module.ts`
- **Action**: Add `StorageModule` to imports array

#### Step 7: Add Multer Memory Storage Config
- **Note**: By default, `FileInterceptor` uses disk storage. For our use case, we need `memoryStorage` so the file buffer is available.
- **Option A**: Pass storage option inline in `FileInterceptor`:
  ```ts
  FileInterceptor('avatar', { storage: memoryStorage() })
  ```
  Import `memoryStorage` from `multer`.
- **Option B**: Register `MulterModule` in `UsersModule` with `memoryStorage`. Option A is simpler for a single endpoint.

#### Step 8: Backend Tests
- **File**: `nexacore-api/src/users/tests/users.controller.spec.ts`
  - Add test: POST me/avatar with valid image → 201, returns { avatarUrl }
  - Add test: POST me/avatar with invalid type → 422
  - Add test: POST me/avatar with file too large → 422
  - Add test: POST me/avatar unauthenticated → 401
  - Add test: DELETE me/avatar → 200, returns { avatarUrl: null }
  - Add test: DELETE me/avatar when no avatar → 200 (no-op)

- **File**: `nexacore-api/src/storage/tests/local-storage.provider.spec.ts` (new)
  - Test upload writes file to disk
  - Test delete removes file
  - Test delete non-existent file is no-op
  - Test getPublicUrl returns correct path

---

## FRONTEND SECTION

---

### Overview

Install `react-easy-crop`, create a reusable `ImageCropper` component using `ConfirmModal` + `Slider`, add `upload()` method to `apiClient`, integrate upload/remove buttons in `ProfileForm`, and add toast messages.

### Architecture Context

- **New component**: `src/components/ui/ImageCropper.tsx` — reusable crop modal
- **New utility**: `src/lib/crop-image.ts` — canvas-based crop extraction
- **Modified**: `ProfileForm.tsx` — avatar overlay buttons, crop modal integration
- **Modified**: `api.ts` — new `upload<T>()` method for multipart
- **Modified**: `toast-messages.ts` — AVATAR_UPDATED / AVATAR_UPDATE_FAILED
- **New dependency**: `react-easy-crop`

### Implementation Steps

#### Step 9: Install react-easy-crop
- `cd nexacore-dashboard && npm install react-easy-crop`

#### Step 10: Add upload() Method to apiClient
- **File**: `nexacore-dashboard/src/lib/api.ts`
- **Action**: Add method that accepts `FormData` and skips `Content-Type: application/json`:
  ```ts
  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const headers: Record<string, string> = {
      ...(this.accessToken && { Authorization: `Bearer ${this.accessToken}` }),
      ...(this.deviceFingerprint && { "X-Device-Fingerprint": this.deviceFingerprint }),
    };
    // CSRF token
    const csrfToken = getCsrfCookie();
    if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers, // NO Content-Type — browser sets multipart boundary
      body: formData,
      credentials: "include",
    });
    // reuse existing error handling pattern (401 retry, etc.)
    ...
  }
  ```
- **Note**: Must handle 401 silent refresh like the existing `request()` method. Can extract the retry logic to a shared helper, or duplicate the minimal retry block.

#### Step 11: Create crop-image.ts Utility
- **File**: `nexacore-dashboard/src/lib/crop-image.ts`
- **Action**: Canvas-based crop function:
  ```ts
  export async function getCroppedImg(
    imageSrc: string,
    cropArea: { x: number; y: number; width: number; height: number },
    outputSize = 256,
  ): Promise<Blob> {
    // 1. Create image element, load src
    // 2. Create canvas at outputSize x outputSize
    // 3. Draw cropped region scaled to canvas
    // 4. Return canvas.toBlob('image/jpeg', 0.9)
  }
  ```
- **Output**: JPEG at 256x256px (good balance of quality vs size for avatars)

#### Step 12: Create ImageCropper Component
- **File**: `nexacore-dashboard/src/components/ui/ImageCropper.tsx`
- **Props**:
  ```ts
  interface ImageCropperProps {
    open: boolean;
    imageSrc: string;
    onCrop: (blob: Blob) => void;
    onClose: () => void;
    aspect?: number;        // default 1 (square)
    cropShape?: "round" | "rect"; // default "round"
    loading?: boolean;
  }
  ```
- **Implementation**:
  - Uses `ConfirmModal` size="lg" as wrapper
  - Inside `children` slot:
    - `react-easy-crop` `<Cropper>` component with `cropShape="round"`, `aspect={1}`
    - `<Slider>` below for zoom control (min=1, max=3, step=0.01)
    - Preview: 3 `<Avatar>` at sm/md/lg showing crop preview (optional, can be v2)
  - `onConfirm`: calls `getCroppedImg()` with crop area → passes blob to `onCrop`
  - **Cropper container**: needs explicit height, e.g., `h-[300px] relative` for the crop area
  - Design system tokens for all styling

#### Step 13: Add Toast Messages
- **File**: `nexacore-dashboard/src/lib/toast-messages.ts`
- **Add to PROFILE_TOAST**:
  ```ts
  AVATAR_UPDATED: { variant: "success", title: "Avatar updated", description: "Your profile photo has been saved." },
  AVATAR_REMOVED: { variant: "success", title: "Avatar removed" },
  AVATAR_UPDATE_FAILED: (msg: string): ToastMsg => ({ variant: "error", title: "Avatar update failed", description: msg }),
  ```

#### Step 14: Integrate in ProfileForm
- **File**: `nexacore-dashboard/src/components/profile/ProfileForm.tsx`
- **Changes**:

  1. **Hidden file input**: `<input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelect} />`

  2. **Avatar overlay buttons** (replace display-only avatar, ~line 204-210):
     ```tsx
     <div className="-mt-10">
       <div className="group/avatar relative inline-flex rounded-full bg-surface-tertiary p-2 ring-1 ring-border-strong">
         <Avatar src={user.avatarUrl} name={fullName} size="lg" />
         <div className="absolute inset-0 flex items-center justify-center gap-1 rounded-full opacity-0 transition-opacity group-hover/avatar:opacity-100 bg-black/40">
           <IconButton variant="default" size="sm" onClick={() => fileInputRef.current?.click()} aria-label="Upload photo">
             <Camera size={16} />
           </IconButton>
           {user.avatarUrl && (
             <IconButton variant="danger" size="sm" onClick={handleRemoveAvatar} aria-label="Remove photo">
               <Trash2 size={16} />
             </IconButton>
           )}
         </div>
       </div>
     </div>
     ```

  3. **State**:
     ```ts
     const fileInputRef = useRef<HTMLInputElement>(null);
     const [cropSrc, setCropSrc] = useState<string | null>(null);
     const [uploading, setUploading] = useState(false);
     ```

  4. **handleFileSelect**: Read file as data URL → `setCropSrc(dataUrl)` → opens ImageCropper

  5. **handleCrop(blob)**: 
     ```ts
     setUploading(true);
     const formData = new FormData();
     formData.append("avatar", blob, "avatar.jpg");
     await apiClient.upload("/users/me/avatar", formData);
     await refreshSession();
     addToast(PROFILE_TOAST.AVATAR_UPDATED);
     setCropSrc(null);
     setUploading(false);
     ```

  6. **handleRemoveAvatar**:
     ```ts
     await apiClient.delete("/users/me/avatar");
     await refreshSession();
     addToast(PROFILE_TOAST.AVATAR_REMOVED);
     ```

  7. **ImageCropper modal** (in JSX, alongside other modals):
     ```tsx
     <ImageCropper
       open={!!cropSrc}
       imageSrc={cropSrc || ""}
       onCrop={handleCrop}
       onClose={() => setCropSrc(null)}
       loading={uploading}
     />
     ```

#### Step 15: Update Component Registry + Showcase (optional, can defer)
- **File**: `nexacore-dashboard/src/lib/component-registry.ts` — add ImageCropper entry
- **File**: `nexacore-dashboard/src/components/admin/ComponentShowcase.tsx` — add ImageCropper showcase section

#### Step 16: Update API Spec
- **File**: `ai-specs/ai-specs/specs/api-spec.yml`
- **Add**:
  - `POST /users/me/avatar` — requestBody: multipart/form-data (avatar field, image/*, max 2MB), response 201: { avatarUrl: string }
  - `DELETE /users/me/avatar` — response 200: { avatarUrl: null }
  - Fix naming: align spec `avatar` field name to `avatarUrl` in UpdateProfileDto schema

#### Step 17: Update Technical Documentation
- `api-spec.yml` — new endpoints (covered in Step 16)
- `integration-state.md` — add StorageModule to module map
- `data-model.md` — no changes (avatarUrl already documented)

---

## Implementation Order

1. Step 0: Create feature branch
2. Step 1: Install @types/multer (backend)
3. Step 2: Create StorageModule
4. Step 3: Configure static file serving + install @nestjs/serve-static
5. Step 4: Add avatar endpoints to controller
6. Step 5: Add avatar methods to service
7. Step 6: Update UsersModule imports
8. Step 7: Configure multer memory storage
9. Step 8: Backend tests
10. Step 9: Install react-easy-crop (frontend)
11. Step 10: Add upload() method to apiClient
12. Step 11: Create crop-image.ts utility
13. Step 12: Create ImageCropper component
14. Step 13: Add toast messages
15. Step 14: Integrate in ProfileForm
16. Step 15: Component registry + showcase (optional)
17. Step 16: Update API spec
18. Step 17: Update documentation

---

## Testing Checklist

### Backend
- [ ] POST /users/me/avatar with valid JPEG → 201, returns { avatarUrl }
- [ ] POST /users/me/avatar with valid PNG → 201
- [ ] POST /users/me/avatar with valid WebP → 201
- [ ] POST /users/me/avatar with PDF → 422 validation error
- [ ] POST /users/me/avatar with 3MB file → 422 file too large
- [ ] POST /users/me/avatar without auth → 401
- [ ] POST /users/me/avatar replaces old local avatar (old file deleted from disk)
- [ ] DELETE /users/me/avatar → 200, avatarUrl set to null, file deleted from disk
- [ ] DELETE /users/me/avatar when no avatar → 200, no-op
- [ ] DELETE /users/me/avatar when avatarUrl is external URL → 200, avatarUrl null, no file deletion
- [ ] LocalStorageProvider.upload writes file correctly
- [ ] LocalStorageProvider.delete removes file
- [ ] Static file serving: uploaded file accessible via GET /uploads/avatars/{key}

### Frontend
- [ ] Click avatar → file picker opens (only jpg/png/webp)
- [ ] Select image → ImageCropper modal opens with round crop area
- [ ] Zoom slider works (1x-3x)
- [ ] Crop + Save → uploads to backend, avatar updates across app (NavBar, Profile)
- [ ] Remove button visible only when avatar exists
- [ ] Remove → avatar falls back to initials
- [ ] Upload error → toast error message
- [ ] Loading state during upload (button disabled)
- [ ] Cropper modal closes on cancel/escape/overlay click

### Regression
- [ ] Existing PATCH /users/me still works (avatarUrl as URL string)
- [ ] OAuth avatar URL not affected by delete (only local /uploads/ URLs deleted from disk)
- [ ] All existing profile edit modals (name, email, password) still work
- [ ] NavBar avatar reflects changes after upload/remove

---

## Error Handling

### Backend
| Scenario | Status | Response |
|----------|--------|----------|
| Invalid file type | 422 | `{ statusCode: 422, message: "Validation failed (expected type is /^image\\/(jpeg|png|webp)$/)" }` |
| File too large | 422 | `{ statusCode: 422, message: "Validation failed (expected size is less than 2097152)" }` |
| No file provided | 422 | `{ statusCode: 422, message: "File is required" }` |
| Unauthenticated | 401 | Standard JWT error |
| Storage write failure | 500 | `{ statusCode: 500, message: "Internal server error" }` |

### Frontend
| Scenario | Action |
|----------|--------|
| 422 validation error | Toast: "Avatar update failed" + server message |
| Network error | Toast: "Avatar update failed" + "Network error" |
| 401 expired | Silent refresh + retry (handled by apiClient) |

---

## Dependencies

### Backend (new)
- `@nestjs/serve-static` — static file serving
- `@types/multer` — TypeScript types (devDependency)

### Frontend (new)
- `react-easy-crop` — crop UI component

---

## Notes

- **No Prisma migration needed** — `avatarUrl String?` already exists on User model
- **Storage abstraction**: `FILE_STORAGE` injection token allows swapping `LocalStorageProvider` for S3/R2 provider later without changing consumer code
- **Client-side crop**: The cropped blob is sent to the server, not the full original image. This reduces upload size and bandwidth
- **OAuth avatars preserved**: The delete endpoint only removes files from local `/uploads/` path. External OAuth avatar URLs (Google, GitHub) are simply set to null in DB without file deletion
- **CORS**: Static file serving via `ServeStaticModule` uses the same origin as the API — no CORS issues
- **Security**: File type validated by NestJS `FileTypeValidator` which checks MIME type header, not just extension. For extra security, could add magic-byte validation in a future ticket
