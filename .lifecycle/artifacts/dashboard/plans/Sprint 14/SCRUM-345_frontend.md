# Frontend Implementation Plan: SCRUM-345 Cleanup deletes + renumber (B10a — FINAL CLEANUP step 1 of 2)

**Detected scope**: `frontend` (docs reconciliation — read-only on code, write-only on `ai-specs/specs/ui-design-system.md`)

> **B10a of 9+ sub-tickets** from SCRUM-329 Part B reconciliation (Cleanup split into B10a + B10b per B9b verify recommendation). Sibling of SCRUM-334-344 (B1-B9b) — all completed. **11th application** of carry-forward Accepted-Trivial pattern. **Most structurally complex Part B sub-ticket** — 5 deletes + 49-section renumber (2.7× larger than B4's 18-section renumber) + ~380 cross-reference text updates + Toast suffix removal + 9 bare-ref edge cases. User confirmed **Approach A (Python script)** for Phase 2 + Phase 3 (renumber + cross-ref updates). 1 user-approval gate (script review before execution). Section count grows §1-§55 → §1-§50 (-5).

## 1. Codebase State Verification (2026-05-03)

- **Sprint**: Sprint 14 (id=477)
- **Module**: `dashboard`
- **Anchors**:
  - Code (`em-ecosystem`): `8d2fa80c` (post-SAT01-5 round 2 — unchanged through B1-B9b)
  - Doc (`ai-specs`): `0e50606` (post-/update-docs of SCRUM-344 / B9b)
- **File to be written**: `ai-specs/specs/ui-design-system.md` (single in-place modification via Python script)
- **Files to be created**: `integrations/jira-mcp-server/scripts/scrum345_renumber.py` (the executor script)

## 2. Overview

This ticket executes the **structural cleanup phase** of B10 — the most complex single operation in Part B. Per user-confirmed Approach A, a Python script will execute the bulk of the work programmatically, with a single user-approval gate to review the script's logic + a dry-run output before committing.

After this ticket:
- 5 Doc-only sections deleted (§2 Icon Set, §11 Quick Notification, §12 Payment Form, §13 Speedometer, §14 Notification)
- 49 sections renumbered (8 shift -1, 41 shift -5)
- ~380 cross-references updated doc-wide
- Toast §19 (now §14) heading drops "(Quick Notification)" historical suffix
- 9 bare-ref edge cases corrected
- 1 §11 Quick Notification reference (in §19 historical note) removed

Final state: **§1-§50** (-5 from pre-B10a). **B10b will follow** with §1 Card reconciliation + registry fix (first code change in entire Part B).

## 3. Architecture Context

```
ui-design-system.md (post-0e50606 / B9b — §1-§55)

Sections to DELETE (5):
├─ §2 Icon Set                       (toolbar of IconButtons — not a single component)
├─ §11 Quick Notification            (Phase C item — no code)
├─ §12 Payment Form                  (Phase D item — no payment flow)
├─ §13 Speedometer                   (no implementation, no use case)
└─ §14 Notification                  (Phase C item — no code)

Sections to RENUMBER (49):
├─ §3-§10 shift -1 (after §2 delete, before §11-§14 deletes)
└─ §15-§55 shift -5 (after all 5 deletes)
```

After B10a:
```
ui-design-system.md (post-B10a — §1-§50)

§1 Card                              (unchanged)
§2-§9 (formerly §3-§10)              (8 sections shifted -1)
§10-§50 (formerly §15-§55)           (41 sections shifted -5)

§14 Toast Message                    (was §19 Toast Message (Quick Notification) — suffix dropped)
```

**Branching exception**: 11th application of carry-forward Accepted-Trivial. No `feature/SCRUM-345-frontend` branch in `em-ecosystem-code`. Convention silenced.

## 4. Implementation Steps

### Step 0: No code branch (carry-forward Accepted-Trivial)

Working directly in `ai-specs/` working tree on `main`. No re-justification needed (11th application).

### Step 1: Discovery (already complete from /enrich-us)

All 55 current section headings catalogued. ~380 cross-reference impact mapped per-section. 9 bare-ref edge cases identified at known line positions. 1 orphan reference (§11 Quick Notification in §19's historical note) flagged.

### Step 2: Write the renumber script (Gate 1 — single user-approval gate)

Build `integrations/jira-mcp-server/scripts/scrum345_renumber.py` with the following logic:

```python
"""SCRUM-345 (B10a) renumber script: delete 5 sections + renumber 49 + update cross-refs."""

import sys
from pathlib import Path

DOC = Path("ai-specs/specs/ui-design-system.md")

# Section name table (for safe disambiguation in replacements)
NAMES = {
    1: "Card",
    3: "Sidebar Items", 4: "Calendar", 5: "Modal", 6: "Tabs",
    7: "Context Menu", 8: "Analytics Graph", 9: "Breadcrumbs", 10: "Tooltip",
    15: "Button Set", 16: "Toggle", 17: "Slider", 18: "Pagination",
    19: "Toast Message",  # NOTE: heading currently has "(Quick Notification)" suffix — handled separately
    20: "Checkboxes", 21: "Input", 22: "DateInput", 23: "MfaDigitInput",
    24: "FormField", 25: "Select", 26: "IdleWarningModal", 27: "CommandPalette",
    28: "CopyField", 29: "QrCodeCard", 30: "RecoveryCodesGrid",
    31: "TurnstileWidget", 32: "CountdownTimer", 33: "Avatar", 34: "Badge",
    35: "IconBadge", 36: "Spinner", 37: "InfinitySpinner", 38: "RingSpinner",
    39: "Divider", 40: "Accordion", 41: "EmptyState", 42: "IconButton",
    43: "SegmentedControl", 44: "ToastContainer", 45: "AlertBox",
    46: "ErrorAlert", 47: "InlineError", 48: "RateLimitBanner",
    49: "ThemeToggle", 50: "LanguageSelector", 51: "EmailSelector",
    52: "DataTable", 53: "StickyCard", 54: "ImageCropper",
    55: "BeforeAfterSlider",
}

# Renumber map (OLD -> NEW)
RENUMBER = {
    # 8 sections shift -1 (after §2 Icon Set delete)
    3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7, 9: 8, 10: 9,
    # 41 sections shift -5 (after §11+§12+§13+§14 deletes)
    15: 10, 16: 11, 17: 12, 18: 13, 19: 14, 20: 15,
    21: 16, 22: 17, 23: 18, 24: 19, 25: 20, 26: 21,
    27: 22, 28: 23, 29: 24, 30: 25, 31: 26, 32: 27,
    33: 28, 34: 29, 35: 30, 36: 31, 37: 32, 38: 33,
    39: 34, 40: 35, 41: 36, 42: 37, 43: 38, 44: 39,
    45: 40, 46: 41, 47: 42, 48: 43, 49: 44, 50: 45,
    51: 46, 52: 47, 53: 48, 54: 49, 55: 50,
}

# Sections to DELETE (5)
DELETES = [2, 11, 12, 13, 14]
DELETE_NAMES = {
    2: "Icon Set", 11: "Quick Notification", 12: "Payment Form",
    13: "Speedometer", 14: "Notification",
}

def delete_section(text, num, name):
    """Delete section §num Name + closing --- + trailing blank line."""
    import re
    # Pattern: from "### num. name" to next "### " or "## " heading
    # Capture: heading + content + closing --- + blank line + (boundary preserved)
    pattern = rf"### {num}\. {re.escape(name)}\n.*?\n---\n\n(?=### |## )"
    new_text, count = re.subn(pattern, "", text, count=1, flags=re.DOTALL)
    assert count == 1, f"Expected 1 match for §{num} {name}, got {count}"
    return new_text

def drop_toast_suffix(text):
    """Drop '(Quick Notification)' from §19 Toast Message heading."""
    old = "### 19. Toast Message (Quick Notification)"
    new = "### 19. Toast Message"
    assert old in text, f"Expected to find: {old}"
    return text.replace(old, new, 1)

def remove_quick_notification_ref(text):
    """Remove the §11 Quick Notification reference inside §19 historical note."""
    # Find the "Heading note:" blockquote containing the §11 ref and remove it entirely.
    old = '''> **Heading note:** the "(Quick Notification)" suffix is historical — it predates the §11 Quick Notification Doc-only section (which has no code implementation). The suffix will be reconsidered in B10 Cleanup once the Doc-only sections are addressed.

'''
    if old in text:
        return text.replace(old, "", 1)
    return text  # already removed or different format

def handle_bare_refs(text):
    """Handle 9 bare §N references (no section name) with context-aware replacements.

    These must be done BEFORE the named renumber pass, using OLD numbers.
    """
    bare_refs = [
        # (context, old_text, new_text)
        # Line 544 §27 Select reference (in §7 Context Menu Doc-only blockquote)
        ("disambiguate from the form-input `Select` component (now §27)",
         "disambiguate from the form-input `Select` component (now §27)",
         "disambiguate from the form-input `Select` component (now §22)"),

        # Line 1226 §4 Calendar reference in DateInput
        ("Popover | Calendar component (§4),",
         "Popover | Calendar component (§4),",
         "Popover | Calendar component (§3),"),

        # Lines 2000, 2049, 2090: §36 / §37 / §38 Spinner trio bare refs
        ("First of the **Spinner trio** (§36 / §37 / §38) — see comparison table at the end of §38.",
         "First of the **Spinner trio** (§36 / §37 / §38) — see comparison table at the end of §38.",
         "First of the **Spinner trio** (§31 / §32 / §33) — see comparison table at the end of §33."),

        ("Second of the **Spinner trio** (§36 / §37 / §38) — see comparison table at the end of §38.",
         "Second of the **Spinner trio** (§36 / §37 / §38) — see comparison table at the end of §38.",
         "Second of the **Spinner trio** (§31 / §32 / §33) — see comparison table at the end of §33."),

        ("Third and final of the **Spinner trio** (§36 / §37 / §38).",
         "Third and final of the **Spinner trio** (§36 / §37 / §38).",
         "Third and final of the **Spinner trio** (§31 / §32 / §33)."),

        # Line 2072 §36 InfinitySpinner use-case reference
        ("smaller and steadier visual footprint than the rotating circle (§36)",
         "smaller and steadier visual footprint than the rotating circle (§36)",
         "smaller and steadier visual footprint than the rotating circle (§31)"),

        # Line 2104 §37 RingSpinner reference
        ("`stroke=\"currentColor\"`. Inherits color via `stroke=\"currentColor\"` — same mechanism as §37.",
         "same mechanism as §37.",
         "same mechanism as §32."),

        # Line 2112 §36 / §37 RingSpinner use-case reference
        ("without the rotational motion of §36 (less dizzying when filling a large viewport) and with a more organic feel than the geometric figure-8 of §37.",
         "without the rotational motion of §36 (less dizzying when filling a large viewport) and with a more organic feel than the geometric figure-8 of §37.",
         "without the rotational motion of §31 (less dizzying when filling a large viewport) and with a more organic feel than the geometric figure-8 of §32."),

        # Line 2287 §33-§41 range reference (Display primitives cluster)
        ("Across the Display primitives cluster (§33-§41), **four components**",
         "Across the Display primitives cluster (§33-§41), **four components**",
         "Across the Display primitives cluster (§28-§36), **four components**"),
    ]
    for context, old, new in bare_refs:
        if old in text:
            text = text.replace(old, new, 1)
        else:
            print(f"WARN: Bare ref not found: {old[:80]}")
    return text

def renumber_named(text):
    """Replace §N Name -> §M Name for all 49 renumbered sections (high-to-low not needed since names disambiguate)."""
    for old_n, new_n in RENUMBER.items():
        name = NAMES.get(old_n)
        if not name:
            continue
        # Heading
        text = text.replace(f"### {old_n}. {name}", f"### {new_n}. {name}", 1)
        # Cross-references
        text = text.replace(f"§{old_n} {name}", f"§{new_n} {name}")
    return text

def main():
    text = DOC.read_text(encoding="utf-8")
    original_len = len(text)
    print(f"Original: {original_len} chars, {text.count(chr(10))} lines")

    # Phase 4a: Drop Toast suffix (do BEFORE renumber to keep heading intact)
    text = drop_toast_suffix(text)
    print("Phase 4a: Toast suffix dropped")

    # Phase 4b: Remove §11 Quick Notification ref in §19 historical note
    text = remove_quick_notification_ref(text)
    print("Phase 4b: §11 Quick Notification ref removed")

    # Phase 4c: Handle bare §N refs (using OLD numbers — must be done BEFORE renumber)
    text = handle_bare_refs(text)
    print("Phase 4c: 9 bare-ref edge cases corrected")

    # Phase 1: Delete 5 sections
    for num in DELETES:
        name = DELETE_NAMES[num]
        text = delete_section(text, num, name)
        print(f"Phase 1: Deleted §{num} {name}")

    # Phase 2 + 3 combined: Renumber headings + cross-references (named, safe)
    text = renumber_named(text)
    print("Phase 2 + 3: 49 sections renumbered (headings + cross-refs)")

    # Write back
    DOC.write_text(text, encoding="utf-8")
    final_len = len(text)
    print(f"Final: {final_len} chars, {text.count(chr(10))} lines (delta: {final_len - original_len:+d} chars)")

if __name__ == "__main__":
    main()
```

**Gate 1**: Present the script + a dry-run output to the user for approval. Dry-run shows: (a) which sections are deleted, (b) which renumbers are applied, (c) the final character/line delta.

### Step 3: Execute script (in-place modification)

Once user approves the script, run it:

```bash
cd "c:/Users/grupo/OneDrive/Desktop/EMILLION NETWORKING LABS"
python integrations/jira-mcp-server/scripts/scrum345_renumber.py
```

The script modifies `ui-design-system.md` in place. `git diff` will show the full delta for verification.

### Step 4: Build verification (comprehensive AC checks)

```bash
cd ai-specs/ai-specs/specs

# AC1: 5 deleted sections gone
for spec in "2:Icon Set" "11:Quick Notification" "12:Payment Form" "13:Speedometer" "14:Notification"; do
  n="${spec%%:*}"; name="${spec#*:}"
  c=$(grep -cE "^### $n\. $name" ui-design-system.md)
  echo "DELETED §$n $name: $c (expected 0)"
done

# AC2: Section numbering continuous §1-§50
grep -E '^### [0-9]+\.' ui-design-system.md | grep -oE '^### [0-9]+' | grep -oE '[0-9]+' \
  | awk 'BEGIN{prev=0} {if ($1 != prev+1) print "GAP at " $1; prev=$1} END{print "max="prev}'
# expected: no GAP, max=50

# AC3: Each renumbered heading at correct number
for spec in "1:Card" "2:Sidebar Items" "3:Calendar" "4:Modal" "5:Tabs" "6:Context Menu" "7:Analytics Graph" "8:Breadcrumbs" "9:Tooltip" "10:Button Set" "11:Toggle" "12:Slider" "13:Pagination" "14:Toast Message" "15:Checkboxes" "16:Input" "17:DateInput" "18:MfaDigitInput" "19:FormField" "20:Select" "21:IdleWarningModal" "22:CommandPalette" "23:CopyField" "24:QrCodeCard" "25:RecoveryCodesGrid" "26:TurnstileWidget" "27:CountdownTimer" "28:Avatar" "29:Badge" "30:IconBadge" "31:Spinner" "32:InfinitySpinner" "33:RingSpinner" "34:Divider" "35:Accordion" "36:EmptyState" "37:IconButton" "38:SegmentedControl" "39:ToastContainer" "40:AlertBox" "41:ErrorAlert" "42:InlineError" "43:RateLimitBanner" "44:ThemeToggle" "45:LanguageSelector" "46:EmailSelector" "47:DataTable" "48:StickyCard" "49:ImageCropper" "50:BeforeAfterSlider"; do
  n="${spec%%:*}"; name="${spec#*:}"
  c=$(grep -cE "^### $n\. $name" ui-design-system.md)
  [ "$c" != "1" ] && echo "MISSING §$n $name (count: $c)"
done
echo "(no MISSING output = all 50 headings correct)"

# AC4: Toast §14 heading drops "(Quick Notification)" suffix
grep -cE '^### 14\. Toast Message$' ui-design-system.md  # expected: 1
grep -cE '^### 14\. Toast Message \(Quick Notification\)$' ui-design-system.md  # expected: 0

# AC5: NO orphan references to deleted sections
for spec in "2:Icon Set" "11:Quick Notification" "12:Payment Form" "13:Speedometer" "14:Notification"; do
  n="${spec%%:*}"; name="${spec#*:}"
  c=$(grep -c "§$n $name" ui-design-system.md)
  [ "$c" != "0" ] && echo "ORPHAN §$n $name: $c"
done
echo "(no ORPHAN output = all clean)"

# AC6: Doc-wide cross-ref text-match validation — sample 12 critical refs
for spec in "1:Card" "2:Sidebar Items" "3:Calendar" "4:Modal" "9:Tooltip" "10:Button Set" "14:Toast Message" "16:Input" "37:IconButton" "44:ThemeToggle" "47:DataTable" "50:BeforeAfterSlider"; do
  n="${spec%%:*}"; name="${spec#*:}"
  c=$(grep -cE "^### $n\. $name" ui-design-system.md)
  echo "§$n $name: $c"
done
# expected: each = 1

# AC7: Doc-wide broken-ref sweep extended to 12 patterns (7 historical + 5 newly-deleted)
for pattern in "§11 Tooltip" "§22 Checkboxes" "§18 Button Set" "§23 Input" "§24 DateInput" "§25 MfaDigitInput" "§26 FormField" "§2 Icon Set" "§11 Quick Notification" "§12 Payment Form" "§13 Speedometer" "§14 Notification"; do
  c=$(grep -c "$pattern" ui-design-system.md)
  [ "$c" != "0" ] && echo "BROKEN: '$pattern' = $c"
done
echo "(no BROKEN output = all clean)"

# AC8: Bare §N references (final pass — should resolve to real sections)
# Sample known bare refs:
grep -nE '\(now §[0-9]+\)' ui-design-system.md  # §22 Select reference (was §27)
grep -nE 'component \(§[0-9]+\)' ui-design-system.md  # §3 Calendar reference (was §4)
grep -nE 'Spinner trio.*§[0-9]+' ui-design-system.md  # §31/§32/§33 Spinner trio refs

# AC9: Display primitives cluster range reference
grep -E 'Display primitives cluster.*§[0-9]+-§[0-9]+' ui-design-system.md
# expected: §28-§36 (was §33-§41)

# AC10: file size delta
wc -l ui-design-system.md
# expected: ~3703 - X (X = lines in 5 deleted sections + Toast suffix line + §11 ref blockquote)
```

### Step 5: Update Technical Documentation

Covered by Step 3. The deliverable IS the doc update.

## 5. Implementation Order

```
── /develop phase (LOCAL, ai-specs working tree on main) ──
Step 0   No branch (carry-forward — 11th application)
Step 1   Discovery (already complete from /enrich-us)
Step 2   Write the renumber script → user approval (Gate 1)        ┐
                                                                    │  ~30-45 min total
Step 3   Execute script (in-place modification)                    │  (script writing
Step 4   Build verification (10 grep AC checks + spot-check)       │   takes most of it,
Step 5   (covered by Step 3)                                       │   execution is instant)
         ── /develop ends ──                                       ┘

── /verify + /update-docs phases — same lifecycle as B1-B9b ──
```

**Estimated effort**: ~30-45 min /develop. Script writing takes most of the time; execution + AC checks are fast. **Much faster than the manual-Edit alternative** (~98 Edit operations).

## 6. Testing Checklist

- [ ] 5 sections deleted (AC1 passes — all 5 = 0)
- [ ] Numbering continuous §1-§50 (AC2 passes — max=50)
- [ ] All 50 renumbered headings at correct number with correct name (AC3 passes — no MISSING output)
- [ ] Toast §14 heading drops "(Quick Notification)" suffix (AC4 passes)
- [ ] NO orphan references to deleted sections (AC5 passes — no ORPHAN output)
- [ ] Cross-ref text-match validation sample of 12 critical refs (AC6 passes — each = 1)
- [ ] Doc-wide broken-ref sweep extended to 12 patterns (AC7 passes — no BROKEN output)
- [ ] Bare §N refs resolve correctly (AC8 passes — visual review of sample)
- [ ] Display primitives cluster range reference renumbered correctly (AC9 passes — §28-§36)
- [ ] File size delta consistent with 5 deletes + suffix removal (AC10 passes)
- [ ] Spot-check 5-10 cross-references resolve to correct sections post-renumber
- [ ] No internal cross-reference broken across the doc

## 7. Error Handling Patterns

N/A — markdown doc edit via script. Script uses `assert` to catch unexpected state (e.g., section not found at expected location). If any assertion fails, abort + report — don't write partial state.

## 8. UI/UX Considerations

N/A — docs change.

## 9. Dependencies

- Read access to `ai-specs/specs/ui-design-system.md`
- Write access to `ai-specs/specs/ui-design-system.md`
- Python 3.x for the renumber script
- User availability for 1 approval gate (script review)

## 10. Notes

- **1 user-approval gate** — smallest count yet (script review only, vs typical 3-9 component gates).
- **Approach A (Python script) confirmed by user** — much faster than the manual-Edit alternative (~98 Edits).
- **5 deletes + 49 renumbers + ~380 cross-ref updates** — most structurally complex Part B sub-ticket.
- **Toast §19 → §14, drops "(Quick Notification)" suffix** — historical reference no longer relevant after §11 deletion.
- **9 bare-ref edge cases** handled in Phase 4c BEFORE the named renumber (using OLD numbers as identifiers).
- **1 §11 Quick Notification reference** in §19's historical note removed entirely (Phase 4b).
- **Doc-wide broken-ref sweep extended** from 7 patterns (B8-B9a) to 12 patterns (added §2 Icon Set + §11 Quick Notification + §12 Payment Form + §13 Speedometer + §14 Notification — all newly-deleted, would be regression if any reference remains).
- **Cross-ref text-match validation continues** — sample 12 critical refs in AC6 to verify post-renumber state.
- **AC grep checks use `-cE` flag** — lesson from B4.
- **English content only**.

## 11. Next Steps After Implementation

After /update-docs commits SCRUM-345's edits, the **FINAL sub-ticket of SCRUM-329 Part B** is **B10b — §1 Card reconciliation + registry fix**. Scope:
- §1 Card reconciliation with `globals.css` `card-flat` CSS class (verify task — light docs work)
- Registry fix in `em-ecosystem-code/nexacore-dashboard/src/lib/component-registry.ts`: "Sidebar.tsx" → "SidebarNav.tsx" (FIRST code change in entire Part B since the lifecycle adaptation began — breaks docs-only adaptation pattern, requires `feature/SCRUM-XXX-frontend` branch + PR)

**B10b will close out the SCRUM-329 Part B reconciliation initiative entirely** (10 sub-tickets total: B1-B9b + B10a + B10b).

## 12. Implementation Verification

Final verification checklist:

- [ ] **Code Quality**: N/A
- [ ] **Functionality**: deliverable is `ui-design-system.md` with §1-§50 (post-deletes + post-renumber)
- [ ] **Testing**: Step 4's 10 grep AC checks all pass + spot-check
- [ ] **Integration**: section numbering continuous §1-§50; all 50 headings + cross-refs valid; doc-wide broken-ref sweep clean across 12 patterns
- [ ] **Documentation**: deliverable IS the doc; written in English; matches established template
- [ ] **No code branch in em-ecosystem-code**: confirm clean (B10b will introduce the first code branch)

## 13. Module-Level Planning

N/A.

## 14. Satellite App Planning

N/A.

---

**Plan ready. Awaiting user approval to proceed to `/develop SCRUM-345`.**
