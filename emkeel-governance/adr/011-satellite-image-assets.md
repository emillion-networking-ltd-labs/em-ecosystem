# ADR-011 — Satélites: pilar de IMÁGENES/ASSETS (assets reales + generación IA decorativa) + re-aim del aim

- **Estado:** Aceptada
- **Fecha:** 2026-06-22
- **Ticket:** [ECO-60](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-60) (re-aim + decisión) · seguimiento [ECO-61](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-61) (F7, implementación)
- **Strategy:** satellites
- **Decisor:** Operador (human gate, 2026-06-22)
- **Contexto de gobierno:** repo gobernado por Emkeel (ver `AGENTS.md`). Materializa el **re-aim ECO-60** del norte
  ([`strategy/satellites.md` §«Re-aim ECO-60» + D7 + F7](../strategy/satellites.md)). **Reconcilia con — no
  re-litiga —** §D4 (intent + split verdad/diseño), §D5 (brief persistido) y [ADR-010](010-satellite-design-generation.md)
  (diseño híbrido). El proceso `/strategy satellites` se re-corrió con research fresca → `approved`.

## Contexto
El **piloto Grupo Atis** (modo c) salió **peor que el original**: soso, **sin imágenes**, sin creatividad. Dos
causas medidas:
1. **Benchmark equivocado** — nos comparábamos con builders genéricos (Lovable/v0) en vez de con *"mejor que el
   original del cliente, sensación bespoke"*.
2. **El guardrail "no inventar" se aplicó también al DISEÑO**, ahogándolo — y **el generador no pone imágenes**,
   el gran hueco visual.

## Decisión

### 1. Re-aim del AIM (corrige la framing "tipo Lovable")
El norte NO es "un Lovable gobernado" ni competir con builders genéricos. Es un **SERVICIO con OFICIO de agencia**
que produce sitios **FIELES + bespoke**, con el **código en nuestro control** (escalable, propiedad nuestra).
**Benchmark = "mejor que el original del cliente + sensación bespoke" + satisfacción del cliente** — NO paridad
con builders genéricos (que se usan como **referencia de oficio**, no como rival ni techo —
https://www.framer.com/compare/framer-vs-lovable).

### 2. Línea HECHOS vs DISEÑO (afina §D4 — no lo cambia)
- **HECHOS** (servicios, precios, contacto, testimonios, datos del negocio) → **nunca inventar**; se **bloquean**
  (`extracted`/`provided`; `missing` se pregunta).
- **DISEÑO** (layout, composición, **imágenes decorativas**, visuales, redacción de chrome) → **se crea libremente**.
  El diseño **NO es un hecho**: la IA se suelta en la capa `proposed`, confirmable en el loop §D4. El guardrail
  era conservador con **ambos** → soso; **se separan**.

### 3. Pilar P5 — IMÁGENES / ASSETS
- **Assets REALES del cliente, EN PANTALLA:** **logo** siempre visible (header/hero) + **fotos reales ingeridas
  al satélite** (a `public/`), no se quedan en el backup (el Guardrail 1 de intake obliga a buscarlas en todo el
  árbol — el piloto las declaró `missing` con 1834 imágenes presentes).
- **Generación IA = un SET ORIGINAL y COHERENTE por cliente** (mismo estilo/paleta/ambiente, alineado a
  marca+rubro). Es **diseño → permitido**; la industria entera lo hace dentro del builder (Lovable genera imágenes
  server-side sin claves — https://docs.lovable.dev/integrations/ai; v0/Vercel vía AI Gateway multi-proveedor —
  https://vercel.com/docs/ai-gateway/capabilities/image-generation).
- **Línea decorativo-vs-real (honestidad — §D4 aplicada a imágenes):** logo y assets reales **NUNCA** generados;
  **generado = ilustrativo/decorativo/atmosférico**, **jamás** un HECHO concreto fabricado (nada de una foto falsa
  de "su flota/equipo/oficina" como real — erosiona la confianza, práctica que la industria marca como deshonesta:
  https://www.rocketspark.com/blog/post/380/the-ethics-of-using-ai-images-in-business-navigating-the-fine-line/,
  https://www.boralagency.com/ethical-practices-with-ai-images-and-video-explained/). **Real para lo documental,
  generado para lo decorativo / lo que falta.**
- **Ownership:** los assets generados se **hornean en el `public/` del satélite** → propiedad y código que
  controlamos (encaja con la escalabilidad y con §D5).
- **Firma de marca:** *"Powered by EM Ecosystem"* en el footer (como SAT01).
- **Cross-mode (a/b/c/d/e):** la **capacidad** y la **línea** son las mismas; cambia el **balance real-vs-generado**
  (a: máxima generación; b: generar en su estilo; c: real + decorativo para elevar; d: fotos IG + decorativo;
  e: estética de referencia que informa la generación).

### 4. Approach de generación = **opción 1: hosted Flux vía gateway multi-proveedor** (pluggable)
Generación vía **API hosted a través de un gateway multi-proveedor** (Flux en fal / Vercel AI Gateway), con el
**output horneado a `public/`**. Elegida por la relación **calidad/coste/ownership** (Flux.1.1 Pro, ~$0.03/MP,
$0.02–0.12/img, cero infra, uso comercial — https://fal.ai/learn/tools/ai-image-generators,
https://www.novakit.ai/blog/ai-image-generation-apis-2026-compared) y porque el proveedor queda **pluggable**.

## Alternativas descartadas
- **(2) Adobe Firefly (copyright-safe, indemnización)** — máxima seguridad legal
  (https://www.getaiperks.com/en/blogs/45-best-ai-image-generators-2026), pero más caro y estética menos "wow".
  **No se descarta del todo:** el gateway permite **escalar a Firefly** cuando un cliente exija indemnización.
- **(3) Self-hosted open-weight (Flux dev/schnell, SDXL)** — control total y sin coste por imagen a escala
  (https://huggingface.co/black-forest-labs/FLUX.1-schnell), pero GPU+ops; reservado para **alto volumen** (el
  gateway lo deja enchufable).
- **(4) Solo stock curado** — real y barato, pero **genérico/no bespoke** → no cumple el aim.

## Consecuencias
- **Fasificación: F7** (sobre F4/F5) — ingerir assets reales a `public/` + generación del set decorativo (gateway
  pluggable) + línea decorativo-vs-real + optimización (`next/image` + formatos modernos) + firma del footer.
  Implementación en [ECO-61](https://emillionnetworking-ltd-labs.atlassian.net/browse/ECO-61).
- **Honestidad sobre HECHOS preservada:** la generación amplía el **diseño** (capa `proposed`); los hechos del
  cliente nunca se fabrican, y una imagen generada **nunca** se presenta como un hecho concreto del negocio.
- **Ownership/escalabilidad:** assets horneados en `public/` = propiedad y código nuestros (coherente con §D5 y
  con el norte "código en nuestro control").
- **Reconcilia, no re-litiga:** §D4, §D5, ADR-010 (híbrido), F1–F6 quedan intactos; P5/F7 se construye encima.

## Notas
- Aprobada por el operador en el human gate del re-aim `/strategy satellites` (ECO-60, 2026-06-22), conducido por
  el motor (`emkeel strategy` → `approved`) con provenance de research real (builders Lovable/v0/Framer + modelos
  Flux/Firefly/SDXL + ética decorativo-vs-real). El "cómo" detallado vive en el ECO de F7 (ECO-61); el
  procedimiento operativo, en el runbook.
