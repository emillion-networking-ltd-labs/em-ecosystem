# Contributing — EM Ecosystem

Convenciones de **proyecto** que NO están ya forzadas por tooling ni son textbook genérico.
Lo *enforce-able* vive en config y **no se repite aquí**: duplicación → `jscpd` (`.jscpd.json`);
secretos → `gitleaks`; patrones peligrosos (`eval`/`child_process`/`__proto__`/`console.log`) →
`eslint-plugin-security` + `security.yml`; formato → `prettier`; coverage → jest config.
Artefactos técnicos en **inglés**. Decisiones arquitectónicas (no convenciones) → `emkeel-governance/adr/`.

## Backend — `nexacore-api` (NestJS + Prisma)

**Estructura de módulo.** Cada feature module: `{m}.module.ts` (imports/providers/exports) ·
`{m}.controller.ts` (HTTP + guards; delega en el servicio) · `{m}.service.ts` (`@Injectable()`,
lógica + `PrismaService`) · `dto/*.dto.ts` (class-validator) · `guards/*.guard.ts` ·
`strategies/*.strategy.ts` · `tests/`. Ficheros en kebab-case (`auth.service.ts`).

**PrismaService.** `PrismaService extends PrismaClient` con `OnModuleInit`/`OnModuleDestroy`
(`$connect`/`$disconnect`); `PrismaModule` es `@Global()` (disponible sin import explícito).

**Validación.** DTOs con class-validator; `ValidationPipe` global en `main.ts` con
`whitelist: true` + `forbidNonWhitelisted: true` + `transform: true`.

**Errores — mensajes.** Todo mensaje a cliente usa las constantes de
`src/common/constants/error-messages.ts` (nunca strings inline). Disciplina **anti-enumeración**
(OWASP ASVS; CWE-200/203/209): endpoints públicos = máxima genericidad; **nunca** revelar
existencia de email, estado de cuenta, enrolamiento MFA, claves de permiso, nombre del rol root,
ni detección de reuse de token. Timing de rate-limit/lockout vía header `Retry-After` (no en el
body). Los audit logs sí capturan el motivo real internamente (fire-and-forget).

**Errores — formato de respuesta.** Toda excepción pasa por `HttpExceptionFilter` con el sobre:

```json
{ "success": false, "error": { "message": "...", "code": "CONFLICT", "statusCode": 409 } }
```

(validación añade `details: []`). Mapeo: 400 `VALIDATION_ERROR` · 401 `UNAUTHORIZED` ·
403 `FORBIDDEN` · 404 `NOT_FOUND` · 409 `CONFLICT` · 500 `INTERNAL_SERVER_ERROR`. Usar las
subclases `HttpException` de NestJS.

**REST.** URLs basadas en recurso (no acciones); método HTTP adecuado; `@HttpCode()` explícito;
guards compuestos vía `@UseGuards(JwtAuthGuard, RolesGuard, …)`; rutas anidadas para sub-recursos
(`/projects/:id/members`).

**Tests.** Fichero `[componente].spec.ts` en `tests/` del módulo. Naming
`should_[comportamiento]_when_[condición]` (snake_case en `describe`, camelCase en `it`). Patrón
**AAA** (Arrange-Act-Assert). Mocks con `jest.Mocked<T>` vía `TestingModule`; mock de servicios en
tests de controller, mock de `PrismaService` en tests de servicio; `jest.clearAllMocks()` en
`beforeEach`. Cubrir happy-path + error + edge + validación. *(Los umbrales de coverage viven en
`nexacore-api/package.json` (jest) — enforced en CI.)*

## Frontend — `nexacore-dashboard` (Next.js + React)

**Componentes.** Funcionales + hooks; `'use client'` solo cuando usan hooks/eventos/browser APIs
(Server Components por defecto). Props con interfaz TS que **extiende los atributos HTML** nativos
al envolver un elemento. Organizar por dominio (`components/{projects,teams,billing,…}/`).

**Estado.** Estado complejo (auth, project) = Context + `useReducer` con acciones tipadas; **un
context por dominio** (evita re-renders). Estado local = `useState`/`useEffect`; extraer custom
hooks para lógica reutilizable.

**Capa de servicio (ApiClient).** Singleton `ApiClient` (fetch) con inyección de
`Authorization: Bearer`. Access token **solo en memoria**; refresh token en cookie **httpOnly**
(route handler). Refresh silencioso en 401 **excepto** los endpoints del set `SKIP_REFRESH_ON_401`
(`/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/forgot-password`) — un 401 ahí significa
"credenciales inválidas", no "sesión expirada" (anti-enumeración, SCRUM-217/342). Al añadir un
endpoint público que pueda devolver 401 por credenciales → añadirlo al set.

**Errores de backend = toast-only (obligatorio).** Los callbacks de `AuthContext` despachan
`AUTH_STOP` (no `AUTH_ERROR`) y muestran el error del servidor vía
`addToast({ variant: "error", … })`. `<InlineError>` queda reservado a validación **client-side**
(nunca poblado desde una respuesta del servidor). Detección de errores de backend vía constantes de
`src/lib/error-constants.ts` + helpers de `error-utils.ts` (no crear `extractMessage` locales).

**Design System.** Usar componentes `ui/` y tokens semánticos (`text-content-primary`,
`bg-surface-primary`, `text-h1…`) — nunca HTML crudo ni hex/rgba arbitrarios. `/admin/design-system`
es la fuente de verdad. Componente nuevo en `ui/` → añadir su §section en el design-system + entrada
en `componentRegistry` + bloque en `ComponentShowcase`.

**Tests.** React Testing Library: probar **comportamiento de usuario** (no implementación);
`data-testid` para selección; cubrir éxito + error; organizar por feature en `tests/`.

---

### No machine-enforced (convención + revisión)
Estas reglas **no** las fuerza ningún linter y dependen de convención + PR review (gaps reales, no
implementados aquí): la disciplina anti-enumeración de mensajes de error (backend) y el set
`SKIP_REFRESH_ON_401` + el contrato *toast-only* (frontend). Tratarlas como invariantes de seguridad
en revisión.
