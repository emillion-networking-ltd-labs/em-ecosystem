# SCRUM-305 Phase 9 — Plan: Border token alignment

## Scope
Frontend

## New token
- `border-components`: rgba(0,0,0,0.15) light / rgba(255,255,255,0.20) dark
- Tailwind class: `border-border-components`
- Already added to globals.css + tailwind.config + TokenInspector

## Border token system (after this phase)
| Token | Opacity (light) | Use |
|-------|----------------|-----|
| subtle | 3% | Dividers inside components |
| default | 5% | Dividers, separators |
| strong | 8% | Cards, containers, modals |
| components | 15% | Inputs, selects, buttons, checkboxes, toggles |

## Steps

### Step 1 — Cards: border-default → border-strong
**Files**: All profile cards (11), settings (2), modals (ConfirmModal, IdleWarningModal), PermissionsMatrix
- Change `border-border-default` → `border-border-strong`

### Step 2 — Components: border-strong → border-components
**Files**: Input.tsx, Select.tsx, Button.tsx (outline), Checkbox.tsx, Toggle.tsx, DateInput.tsx, Calendar.tsx, Accordion.tsx, MfaDigitInput.tsx, CopyField.tsx, Slider.tsx, Tabs.tsx, Toast.tsx, Tooltip.tsx, DataTable.tsx
- Change `border-border-strong` → `border-border-components` on interactive elements
- Keep `border-border-strong` on CSS card classes (card, card-flat, etc.)

### Step 3 — card CSS classes stay border-strong
- card, card-flat, card-container, card-container-flat, auth-card — NO CHANGE

### Step 4 — Build verification
