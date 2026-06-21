# ECO-50 — /strategy deja de ser prosa saltable: conduce el motor de proceso gobernado de emkeel

Strategy: none

> `Strategy: none` declarado honestamente: esto es **tooling de proceso/gobernanza** (cómo se ejecuta el
> skill `/strategy`), no un feature de producto NexaCore. No sirve a `auth` ni a `satellites`; es
> meta-gobernanza deliberadamente standalone.

## Resumen
emkeel 0.1.75 (KEEL-89) trae un **motor genérico de proceso gobernado** que RECHAZA saltar pasos por
construcción (`evaluate_prereq`). El schema de `/strategy` ya está declarado en emkeel
(`scaffolded → researched → proposed → critiqued → checked → presented → approved`; `researched` exige
provenance, `approved` exige human gate). Hoy el skill (`.claude/skills/strategy/SKILL.md`) describe los
pasos en **prosa** → el agente puede saltárselos y el artefacto final igual pasa.

Este ticket **cablea** el skill al motor: cada paso, tras hacer su trabajo, ejecuta
`emkeel strategy advance <step> <topic> --set <evidencia>`. El motor —no la prosa— rechaza el orden
incorrecto o la evidencia ausente. `emkeel strategy status <topic>` muestra el progreso.

## API real del motor (verificada, no adivinada)
`emkeel strategy advance <step> <topic> [--set k=v]` / `emkeel strategy status <topic>`. Evidencia por paso:

| Paso | `--set` (evidencia obligatoria) |
|------|-------------------------------|
| `scaffolded` | `topic=<topic>` |
| `researched` | `sources=[<url>,<file:line>,…]` (≥1 URL o repo `file:line`) **o** `internal_only=true` |
| `proposed` | `options=[<opt1>,<opt2>,…]` (≥2 reales) |
| `critiqued` | `critique=<resumen del pase adversarial>` |
| `checked` | `check_passed=true` (tras `emkeel strategy check <topic>` en verde) |
| `presented` | `presented_to=<operador>` |
| `approved` | `approved_by=<operador>` (decisión humana registrada) |

## Acceptance Criteria
1. `SKILL.md` reescrito: **cada** paso ejecuta `emkeel strategy advance <step> <topic> --set <evidencia>`
   tras hacer el trabajo; ya no narra pasos saltables.
2. Seguir el `SKILL.md` lleva por el motor de principio a fin; `emkeel strategy status` refleja el avance.
3. Saltarse un paso (o avanzar sin la evidencia) lo **RECHAZA** `emkeel strategy advance` (exit 1), no la
   prosa — demostrado con la API real.
4. El **human gate** se preserva: `presented`/`approved` siguen siendo actos humanos; el agente NO decide
   por el operador (registra `approved_by=<operador>` solo tras el sí real).
5. La regla anti-alucinación se mantiene: `researched` exige provenance real (el motor rechaza lo demás).
6. Gates verdes (`gates`, Security Pipeline), ticket ECO-50 enlazado.

## Alignment
- **A qué norte se alinea:** a la dirección de **calidad del SDLC gobernado** de emkeel (ADR-0001
  *adopt-and-thin*: "done = un hecho computado, no una prosa autoatestiguada"; KEEL-89 ADR-0005: skills =
  procesos prereq-gated, no prosa + gate de salida). Este cambio materializa esa doctrina en `/strategy`.
- **Qué restricción del norte implementa:** "ningún paso obligatorio se salta en silencio". Antes el skill
  era prosa (saltable); ahora la **no-saltabilidad la garantiza el motor** instalado vía `pip install
  emkeel`, no la confianza en que el agente siga la narrativa.
- **No-goals:** no cambia el motor de emkeel (vive en emkeel; cualquier desajuste se reporta y se arregla
  allá, no se hand-parchea aquí); no toca producto (`nexacore-api`/`nexacore-dashboard`); no debilita el
  human gate.
