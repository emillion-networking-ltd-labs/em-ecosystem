"""Tests for the repo's own code-health ratchet (`scripts/code_health.py`).

The point of a ratchet is what it REFUSES, so the failure paths are tested first-class: adding
violations must fail, and widening the ceiling must fail. Stdlib `unittest` only — no test
dependency to install, so the code-health workflow can run this on a bare runner.
"""
import importlib.util
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Load scripts/code_health.py as a module (it is a script path, not an installed package).
_spec = importlib.util.spec_from_file_location("code_health", ROOT / "scripts" / "code_health.py")
code_health = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(code_health)


def counter(value):
    """A stand-in for run_count that reports a fixed count, so rules are tested without commands."""
    return lambda _command: (value, "")


CHECK = {"name": "demo", "command": "echo 10", "baseline": 10}


class RatchetRules(unittest.TestCase):
    def test_at_baseline_passes(self):
        passed, message = code_health.evaluate_check(CHECK, base=None, counter=counter(10))
        self.assertTrue(passed)
        self.assertIn("at baseline", message)

    def test_under_baseline_passes_and_invites_lowering(self):
        passed, message = code_health.evaluate_check(CHECK, base=None, counter=counter(4))
        self.assertTrue(passed)
        self.assertIn("lower the baseline to 4", message)

    def test_over_baseline_fails(self):
        """New violations must not merge — this is the whole point of the ratchet."""
        passed, message = code_health.evaluate_check(CHECK, base=None, counter=counter(11))
        self.assertFalse(passed)
        self.assertIn("above its baseline", message)

    def test_raising_the_baseline_fails(self):
        """The loophole: widening the ceiling instead of fixing the debt."""
        raised = {**CHECK, "baseline": 99}
        passed, message = code_health.evaluate_check(raised, base={"demo": 10}, counter=counter(99))
        self.assertFalse(passed)
        self.assertIn("only", message)
        self.assertIn("decreases", message)

    def test_lowering_the_baseline_is_allowed(self):
        lowered = {**CHECK, "baseline": 3}
        passed, _ = code_health.evaluate_check(lowered, base={"demo": 10}, counter=counter(3))
        self.assertTrue(passed)

    def test_a_new_check_needs_no_base_entry(self):
        passed, _ = code_health.evaluate_check(CHECK, base={"other": 1}, counter=counter(10))
        self.assertTrue(passed)

    def test_incomplete_check_fails(self):
        passed, message = code_health.evaluate_check({"name": "x"}, base=None, counter=counter(0))
        self.assertFalse(passed)
        self.assertIn("must declare both", message)


class CountContract(unittest.TestCase):
    """The command contract: the violation count is the LAST line of stdout, an integer."""

    def test_reads_the_last_stdout_line(self):
        count, error = code_health.run_count("echo noise; echo 7")
        self.assertEqual(count, 7)
        self.assertEqual(error, "")

    def test_rejects_non_integer_output(self):
        count, error = code_health.run_count("echo not-a-number")
        self.assertIsNone(count)
        self.assertIn("pure integer", error)

    def test_rejects_a_failing_command(self):
        count, error = code_health.run_count("exit 3")
        self.assertIsNone(count)
        self.assertIn("exited 3", error)


class RealConfig(unittest.TestCase):
    """The declared checks must actually run and satisfy the ratchet on this commit."""

    def test_repo_config_passes(self):
        result = subprocess.run(
            [sys.executable, "scripts/code_health.py"],
            cwd=ROOT, capture_output=True, text=True,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_config_declares_the_fleet_language_checks(self):
        checks = code_health.load_checks((ROOT / "code-health.toml").read_text(encoding="utf-8"))
        names = {c["name"] for c in checks}
        self.assertIn("comment-language", names)
        self.assertTrue({n for n in names if n.startswith("comment-language-")},
                        "the fleet-wide language checks must stay declared")


if __name__ == "__main__":
    unittest.main()
