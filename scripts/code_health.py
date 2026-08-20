#!/usr/bin/env python3
"""code-health ratchet — the repo's own enforcement of the checks declared in `code-health.toml`.

Replaces the external `check_code_health` gate with a self-contained script (Python stdlib only:
`tomllib` ships with 3.11+). Same contract as before, so `code-health.toml` needs no changes:

    [[check]]
    name     = "comment-language"                 # what this measures
    command  = "node scripts/foo.mjs --count ..."  # prints the CURRENT violation count
    baseline = 1060                                # the committed debt ceiling

Each command runs from the repo root and prints an integer on the LAST line of stdout: the number
of violations right now. The ratchet then enforces two rules:

  1. The baseline may only DECREASE. A PR that raises `baseline` above the base branch's value fails
     — that is the loophole that would let new debt in disguised as a config change.
  2. The current count must not exceed the declared baseline. New violations fail the check; the
     existing (legacy) debt does not, so there is no big-bang cleanup.

When the count comes in UNDER the baseline, the check passes and prints a hint: the debt shrank and
the baseline can be lowered to lock the win in. On `push` (no base branch to diff against) rule 1 is
skipped and rule 2 still applies.

Usage:
    python3 scripts/code_health.py            # BASE_REF from the environment, or no-base mode
    BASE_REF=origin/main python3 scripts/code_health.py
"""
from __future__ import annotations

import os
import subprocess
import sys
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG_NAME = "code-health.toml"


def load_checks(text: str) -> list[dict]:
    """Parse the `[[check]]` entries out of a code-health.toml body."""
    data = tomllib.loads(text)
    return data.get("check", [])


def baselines_at(ref: str) -> dict[str, int] | None:
    """The {name: baseline} declared in `code-health.toml` on `ref`, or None if unavailable there.

    None means "no base to compare against" (a new file, a shallow clone, a push build) — the caller
    then skips the may-only-decrease rule rather than inventing a baseline.
    """
    if not ref:
        return None
    try:
        blob = subprocess.run(
            ["git", "show", f"{ref}:{CONFIG_NAME}"],
            cwd=ROOT, capture_output=True, text=True, check=True,
        ).stdout
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None
    return {c["name"]: c["baseline"] for c in load_checks(blob) if "name" in c and "baseline" in c}


def run_count(command: str) -> tuple[int | None, str]:
    """Run a check command from the repo root; return (count, error). Count is the last stdout line."""
    proc = subprocess.run(command, cwd=ROOT, shell=True, capture_output=True, text=True)
    if proc.returncode != 0:
        return None, f"command exited {proc.returncode}: {(proc.stderr or proc.stdout).strip()[:400]}"
    lines = [ln.strip() for ln in proc.stdout.splitlines() if ln.strip()]
    if not lines:
        return None, "command printed nothing; expected the violation count on the last stdout line"
    last = lines[-1]
    if not last.isdigit():
        return None, f"last stdout line must be a pure integer, got {last!r}"
    return int(last), ""


def evaluate_check(check: dict, base: dict[str, int] | None, counter=run_count) -> tuple[bool, str]:
    """Apply both ratchet rules to one check. Returns (passed, message).

    Pure apart from `counter`, which is injected so the rules can be tested without running commands.
    `base` is the base branch's baselines, or None when there is no base to compare against.
    """
    name = check.get("name", "<unnamed>")
    command, baseline = check.get("command"), check.get("baseline")
    if not command or baseline is None:
        return False, f"FAIL: check {name!r} must declare both `command` and `baseline`."

    # Rule 1 — the baseline may only decrease.
    if base is not None and name in base and baseline > base[name]:
        return False, (
            f"FAIL: {name!r} raises its baseline {base[name]} -> {baseline}. The ratchet only "
            f"decreases: fix the violations instead of widening the ceiling."
        )

    # Rule 2 — the current count must not exceed the declared baseline.
    count, error = counter(command)
    if count is None:
        return False, f"FAIL: {name!r} — {error}"

    if count > baseline:
        return False, (
            f"FAIL: {name!r} is at {count}, above its baseline of {baseline} (+{count - baseline}). "
            f"This change adds violations — fix them, or fix the ones you are touching to stay "
            f"under the ceiling."
        )
    if count < baseline:
        return True, (
            f"OK: {name!r} at {count}, under baseline ({baseline}). Debt shrank — lower the "
            f"baseline to {count} in {CONFIG_NAME} to lock it in."
        )
    return True, f"OK: {name!r} at baseline ({baseline})."


def main() -> int:
    config = ROOT / CONFIG_NAME
    if not config.is_file():
        print(f"OK: no {CONFIG_NAME} at the repo root — nothing declared, nothing to enforce.")
        return 0

    checks = load_checks(config.read_text(encoding="utf-8"))
    if not checks:
        print(f"OK: {CONFIG_NAME} declares no checks — dormant.")
        return 0

    base = baselines_at(os.environ.get("BASE_REF", ""))
    if base is None:
        print("note: no base branch to compare against — enforcing count <= baseline only.")

    failed = False
    for check in checks:
        passed, message = evaluate_check(check, base)
        print(message, file=sys.stdout if passed else sys.stderr)
        failed = failed or not passed

    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
