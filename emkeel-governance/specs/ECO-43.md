# ECO-43 — launch-satellite modo (c): material LOCAL como fuente (además de URL)

Strategy: satellites

## Resumen
Extiende el **modo (c) "mejorar un sitio existente"** del skill [`/launch-satellite`](../../.claude/skills/launch-satellite/SKILL.md):
hoy solo contempla una **URL viva** (`fetch-url.mjs` exige `http(s)`). El operador hará el primer test desde
**material LOCAL** (p.ej. un backup de un sitio WordPress en disco, sin base de datos). El cableado se queda
en la **SUPERFICIE**: el modo (c) **pregunta siempre** "¿URL viva o material local? Si local, ¿qué ruta?" y,
si es local, **apunta al directorio** para que el **agente lo lea con sus herramientas normales** (`ls`,
`Read`), guiado por la prosa del operador y aplicando la **regla dura "no inventar"**. **No** se añade un
parser por tipo de fuente: leer el material es trabajo **conversacional** del agente, sea WordPress hoy u
otra cosa mañana. La rama URL queda intacta.

## Decisión de altitud (por qué SUPERFICIE, no parser)
Un analizador específico (p.ej. un `backup-intake.mjs` que entienda la estructura de WordPress) **ata el
skill a un tipo de fuente** y multiplica el código por cada formato futuro (Wix, un export estático, una
carpeta de assets…). El agente ya sabe leer directorios y razonar sobre su contenido. Así que el skill
aporta solo **dos cosas de superficie**:
1. **La convención del directorio de intake** (`.satellite-intake/<cliente>/`, **parámetro** — el material
   es movible sin tocar código; el cliente nunca se commitea).
2. **La obligación de preguntar** la fuente (URL vs local) y, si local, la ruta — **nunca auto-elegir**.

Lo demás —explorar el material y decidir qué es extraíble— lo hace el agente en prosa, con la regla
"no inventar": lo que **está** en los ficheros → `extracted` (source = la ruta real); lo que **no está**
→ `missing` → se pregunta. (Constatado con un backup WP real: de un backup *solo-ficheros* salen imágenes y
estructura, pero el **texto de páginas** vive en la BD ausente → `missing`; el agente lo ve al leer y lo pide.)

## Scope
- **SKILL.md modo (c)**: pregunta siempre "¿URL viva o material local? ¿qué ruta?"; si local, apunta al
  directorio (default `.satellite-intake/<cliente>/`, parámetro) y el agente lo lee con sus herramientas.
- **`.satellite-intake/.gitignore`**: guard — el material de cliente **NUNCA** se commitea.
- **NO** se añade parser por fuente; **NO** se toca la rama URL (`fetch-url.mjs`); **NO** se toca F1
  (`design-system/`, `em-ui/`); **NO** genera ni despliega.

## Acceptance Criteria
1. **Modo (c) pregunta siempre la fuente** ("¿URL viva o material local? ¿qué ruta?") y **nunca auto-elige**;
   si local, usa la **ruta como parámetro** (default `.satellite-intake/<cliente>/`).
2. **Lectura conversacional, sin parser por fuente:** si el material es local, el skill apunta al directorio y
   el **agente lo lee** (`ls`/`Read`) aplicando "no inventar" — lo presente → `extracted` (source = ruta real);
   lo ausente → `missing` → se pregunta. No se añade código que analice un formato concreto.
3. **Rama URL intacta:** `fetch-url.mjs` y su comportamiento del modo (c) no cambian.
4. **Guard del intake:** `.satellite-intake/.gitignore` ignora todo el material de cliente (verificable:
   `git check-ignore` sobre un fichero del backup); el directorio de cliente **no** aparece en el PR.
5. **Gates verdes:** `gates` (`Strategy: satellites`, `check_ticket_link` ECO-43), Security Pipeline /
   Security Gate, build + tests de lo afectado (la suite del skill sigue verde, sin tests de parser).

## Out of scope
- Un parser/analizador por tipo de fuente (WordPress u otro) — explícitamente descartado por altitud.
- Importar la BD / reconstruir el texto de páginas de un backup solo-ficheros (no existe en disco).
- Generación del satélite (ECO-25, F2b) y despliegue (F3); cambios en F1.

## Alignment
Refuerza el punto **1 (onboarding multi-modo)** del sistema `/launch-satellite` del norte
(`strategy/satellites.md` §Recommendation), dentro del **modo (c) clone-and-improve**: amplía la fuente de
"extracción real del cliente" de solo-URL a **material local**, **sin** acoplar el skill a un formato (el
agente lee en prosa). Mantiene la **regla dura "no inventar"** (lo ausente queda `missing`, se pide — nunca
se fabrica) y la **procedencia por campo**. No adelanta F2b/F3 ni toca F1.
