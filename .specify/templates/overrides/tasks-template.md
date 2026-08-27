<!--
  Project override of tasks-template (docs/process/lifecycle.md §2.5). Resolution:
  .specify/templates/overrides/ replaces the packaged template (common.sh, priority 1, "replace").

  EVERY task line carries FOUR fields beyond Spec Kit's own markers (lifecycle §2.5): the FR- it
  satisfies, its class (test | implementation), its test file, and its implementation files. The
  traceability gate of §2.5 and the two denials of docs/standard/code.md §7.3 read EXACTLY this
  line format. One line per task; multi-file lists are comma-separated WITHOUT spaces.

  LINE GRAMMAR (checkbox · id · optional Spec Kit markers · FR · class · files · description):

    - [ ] T001 [P] [US1] [FR-001] [test] test=tests/test_x.py impl=src/x.py :: Description

  REGEX (anchored, one line per task — documented here because the gate reads this format):

    ^- \[[ xX]\] T\d{3,}(?: \[(?:P|US\d+)\])* \[FR-\d{3,}\] \[(?:test|implementation)\] test=\S+ impl=\S+ :: .+$

  Field notes:
  - [FR-###]: every task cites an FR- that exists in the approved spec.md — including setup and
    foundational tasks, which cite the FR- they serve. A task no FR- backs is work no approved
    requirement asked for, and the gate rejects it.
  - [test] tasks write ONLY their test= file. [implementation] tasks write ONLY their impl= files.
    While the active task (first unchecked) is [test], the guard denies writing implementation
    files; once it is [implementation], the guard denies modifying that task's test= file
    (docs/standard/code.md §7.3). The guard abstains when a task lacks these fields.
  - test= names one file; impl= names one or more, comma-separated. Use the sentinel - for a field
    not yet determined, never an empty field. SENTINEL SEMANTICS: - means "undetermined", NOT
    "declared as none", and it activates the abstention of docs/standard/code.md §7.3 — a task with
    test=- (or impl=-) does NOT trigger the order denials; the guard abstains for it.
  - Tasks are NOT optional test-wise: every FR- has at least one [test] task (docs/standard/code.md
    §7.2, "one test per FR-"). The packaged template's "Tests are OPTIONAL" does not apply here.
-->

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`

**Prerequisites**: plan.md (required), spec.md (required)

**Organization**: Grouped by user story, each independently implementable and testable. Within a
story, [test] tasks precede the [implementation] tasks they verify (test-first order, GOVERNANCE
§4.4 decision of 2026-08-21).

## Format: `[ID] [P?] [Story] [FR] [class] test= impl= :: Description`

- **[P]**: can run in parallel (different files, no dependencies)
- **[US#]**: the user story the task belongs to
- **[FR-###]**: the requirement the task satisfies
- **[test | implementation]**: the task's class, read by the guard

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: project initialization and basic structure; each task cites the FR- it serves

- [ ] T001 [FR-001] [implementation] test=- impl=pyproject.toml :: Create project structure per implementation plan
- [ ] T002 [P] [FR-001] [implementation] test=- impl=.github/workflows/ci.yml :: Configure lint and format checks

## Phase 2: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [What this story delivers]

**Independent Test**: [How to verify this story on its own]

### Tests for User Story 1

- [ ] T003 [P] [US1] [FR-001] [test] test=tests/test_[name].py impl=src/[module].py :: Failing test for [behavior of FR-001]
- [ ] T004 [P] [US1] [FR-002] [test] test=tests/test_[name2].py impl=src/[module2].py :: Failing test for [behavior of FR-002]

### Implementation for User Story 1

- [ ] T005 [US1] [FR-001] [implementation] test=tests/test_[name].py impl=src/[module].py :: Implement [behavior] until T003 passes
- [ ] T006 [US1] [FR-002] [implementation] test=tests/test_[name2].py impl=src/[module2].py :: Implement [behavior] until T004 passes

**Checkpoint**: User Story 1 fully functional and testable on its own

## Phase 3: User Story 2 - [Title] (Priority: P2)

[Same structure: tests first, then implementation, every task with its four fields]

## Dependencies

- [test] tasks of a story before its [implementation] tasks (guard-enforced order)
- [Cross-story dependencies, if any, listed here]
