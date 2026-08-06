"""ECO-233 — code-health Piece 1: done-proofs for the sealed agreement `code-health-p1`.

These verify the real behavior of Piece 1 (wake the emkeel `check_code_health` gate via `code-health.toml`
plus the `comment-language --count` adapter), born in this PR. A done-proof must name a test born here
(`check_agreement_points_closed`); these are governance-level tests of the gate integration, not existence.
"""
import os
import subprocess
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def test_code_health_toml_declares_comment_language():
    """Points 1/2/5: `code-health.toml` exists at the repo root and declares the `comment-language` check
    with baseline 1060 and a command that runs the design-system scanner in `--count` mode."""
    cfg = ROOT / "code-health.toml"
    assert cfg.is_file(), "code-health.toml must exist at the repo root"
    data = tomllib.loads(cfg.read_text(encoding="utf-8"))
    checks = {c["name"]: c for c in data.get("check", [])}
    assert "comment-language" in checks, "code-health.toml must declare the comment-language check"
    c = checks["comment-language"]
    assert c["baseline"] == 1060
    assert "check-comment-language.mjs" in c["command"] and "--count" in c["command"]


def test_comment_language_count_prints_integer():
    """Point 3: `--count` prints ONLY the current violation count — a pure integer on the last stdout line,
    which the gate's `_parse_count` reads — and exits 0. Run from the repo root, as the gate does."""
    r = subprocess.run(
        ["node", "design-system/scripts/check-comment-language.mjs", "--count"],
        cwd=str(ROOT), capture_output=True, text=True,
    )
    assert r.returncode == 0, r.stderr
    last = [ln for ln in r.stdout.splitlines() if ln.strip()][-1].strip()
    assert last.isdigit(), f"last stdout line must be a pure integer, got {last!r}"


def test_check_code_health_gate_wakes():
    """Points 4/6: the gate is DORMANT until `code-health.toml` declares a check. Here `load_checks` returns
    the comment-language check, so `check_code_health` is AWAKE — embodying D1 (language gated), D6 (ratchet
    enforcement: count <= baseline) and D7 (config in code-health.toml at the root + the emkeel gate)."""
    os.environ.setdefault("EMKEEL_REPO_DIR", str(ROOT))
    from emkeel.gates.check_code_health import load_checks

    names = [c["name"] for c in load_checks(ROOT)]
    assert "comment-language" in names, "the gate must load the comment-language check (awake, not dormant)"
