<!--
  Project override of spec-template (GOVERNANCE §2.4). Resolution: .specify/templates/overrides/
  replaces the packaged template (common.sh resolve_template_content, priority 1, "replace").

  RESOLUTION LIMIT (GOVERNANCE §2.4, declared exception): resolve-template.sh returns this override
  — verified 2026-08-22 — which proves the RESOLVER works. But /speckit-specify has no script: the
  model is INSTRUCTED to copy the resolved template (commands/specify.md:96-97), so this template's
  application depends on an instruction being followed. The real guarantee comes from the gate that
  validates the written spec.md, never from resolution itself.

  issue-body-digest: the anchor of phase 0 (docs/process/lifecycle.md §2.1). The value below is a
  RECOGNIZABLE FILLER: the gate treats both its absence and an unreplaced filler as a missing anchor
  (GOVERNANCE §4.5 — a missing anchor equals a broken one). Replace it with the SHA-256, lowercase
  hexadecimal, of the raw Issue body as returned by: gh issue view <n> --json body
-->
<!-- issue-body-digest: PENDING-DIGEST-REPLACE-ME -->

# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`

**Issue**: #[###] — the branch number `###` IS the Issue number (docs/process/lifecycle.md §3)

**Created**: [DATE]

**Status**: Draft

**Input**: User description: "$ARGUMENTS"

<!--
  Do NOT add a "## Clarifications" section here. /speckit-clarify creates it, and its presence is the
  footprint that the command ran: a template that ships the heading would satisfy the gate of
  docs/process/lifecycle.md §2.2 without the work having happened.
-->

## User Scenarios & Testing *(mandatory)*

<!--
  User stories PRIORITIZED as independently testable journeys (P1 most critical). Each one must be a
  standalone slice: developed, tested, and demonstrated on its own.
-->

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language]

**Why this priority**: [Value, and why this level]

**Independent Test**: [How this can be tested on its own]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- What happens when [boundary condition]?
- How does the system handle [error scenario]?

## Requirements *(mandatory)*

<!--
  WRITING RULES — ISO/IEC/IEEE 29148 §5.2.7 closed list (GOVERNANCE §2.4). These CLASSES are banned
  from every requirement line; the gate scans requirement lines only:
    superlatives (best, most) · subjective language (user-friendly, easy to use, cost-effective) ·
    vague pronouns (it, this, that as subject) · ambiguous adverbs and adjectives (almost always,
    significant, minimal) · open-ended terms (support, including but not limited to, at a minimum) ·
    comparatives without reference (better than, higher quality) · loopholes (if possible, where
    appropriate, as applicable) · incomplete references (citations without date or version) ·
    negative statements.
  Also §5.2.4: active voice, positive statements, MUST for the obligatory.

  FORMAT — obligation + acceptance criterion (GOVERNANCE §2.4):
  - Each FR- carries exactly ONE obligation (one MUST). Two MUSTs = two requirements.
  - Each FR- names the SC- identifiers that verify it in its "Verified by" field. An FR with no SC
    is unverifiable and therefore not a requirement. "Verified by" is required BY FORMAT; no declared
    gate checks it yet — the §2.5 gate walks FR↔task, not FR↔SC. Gating it is a power not yet turned
    into a duty (GOVERNANCE §4.4): the operator decides that, never this template by implication.
-->

### Functional Requirements

- **FR-001**: System MUST [single specific capability]. *Verified by: SC-001*
- **FR-002**: System MUST [single specific capability]. *Verified by: SC-001, SC-002*

*Marking unclear requirements (resolved by /speckit-clarify before planning):*

- **FR-003**: System MUST [capability] via [NEEDS CLARIFICATION: choice not specified]

### Non-Functional Requirements

<!--
  Every NFR carries a RESPONSE MEASURE as a field: a number, its unit, and the condition under which
  it holds (GOVERNANCE §2.3 — "verifiable" is the characteristic with the greatest practical effect).
  An NFR whose measure field is empty does not pass the gate.
-->

- **NFR-001**: [Quality attribute, e.g., latency of X under load Y]
  - **Response measure**: [number + unit + condition, e.g., "≤ 100 ms per call, measured over the repository's own test suite"]
  - *Verified by: SC-003*

### Key Entities *(include if feature involves data)*

- **[Entity 1]**: [What it represents, key attributes without implementation]

## Success Criteria *(mandatory)*

<!--
  Technology-agnostic and measurable. Every SC- is referenced by at least one FR-/NFR- ("Verified
  by"), and the phase-6 validation checklist of the Issue derives one checkbox per SC- in bijection
  (docs/process/lifecycle.md §2.6).
-->

### Measurable Outcomes

- **SC-001**: [Measurable metric, e.g., "the scaffold command creates the directory and refuses to overwrite, shown by its test"]
- **SC-002**: [Measurable metric]
- **SC-003**: [Measurable metric backing NFR-001's response measure]

## Assumptions

- [Assumption chosen when the description did not specify a detail]
