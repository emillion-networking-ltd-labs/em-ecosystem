# Frontend Implementation Plan: SCRUM-290 Add react-live Interactive Playground

## Overview

Add an in-browser JSX editor with real-time preview to the design system viewer using react-live. Admins can edit JSX and see components rendered instantly.

## Implementation Steps

### Step 0: Create Feature Branch + Install Dependency

New dependency: `react-live` ^4.1 (26KB, MIT, in-browser JSX transpilation via sucrase)

### Step 1: Create CodePlayground Component

**File**: `src/components/admin/CodePlayground.tsx`

- `scope` object with all 16 UI components + useState available in editor
- `defaultCode` with a mixed JSX example
- 4 example templates: Buttons, Form Elements, Badges & Avatars, Interactive
- Split-panel layout: LiveEditor (left) + LivePreview (right)
- LiveError for invalid JSX display
- `noInline` mode detection for function-component examples

### Step 2: Integrate into Design System Page

Add "Playground" tab to viewTabs. Render `<CodePlayground />` when active.

### Step 3: Build Verification

## Notes

- New dependency: react-live (only npm package added in Sprint 14)
- Page bundle increases significantly (~95 kB) due to sucrase transpiler
- All 16 UI components in scope for playground editing
