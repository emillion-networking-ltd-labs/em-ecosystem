export type ComponentCategory = "atom" | "molecule";

export interface ComponentEntry {
  name: string;
  category: ComponentCategory;
  description: string;
  files: string[];
  count?: number;
}

export const componentRegistry: ComponentEntry[] = [
  // ─── Atoms ──────────────────────────────────────────────
  {
    name: "Button",
    category: "atom",
    description:
      "Primary, secondary, outline, danger + link buttons + icon buttons + circle",
    files: ["Button.tsx"],
  },
  {
    name: "Input",
    category: "atom",
    description:
      "Text input with label, error, password toggle — default and filled variants + DateInput",
    files: ["Input.tsx", "DateInput.tsx"],
    count: 2,
  },
  {
    name: "Badge",
    category: "atom",
    description:
      "Status indicator — 5 color variants, 3 sizes + Icon Badge (sm/md/lg)",
    files: ["Badge.tsx", "IconBadge.tsx"],
    count: 2,
  },
  {
    name: "Spinner",
    category: "atom",
    description: "Loading spinner — circular, infinity, ring — 3 sizes",
    files: ["Spinner.tsx", "InfinitySpinner.tsx", "RingSpinner.tsx"],
    count: 3,
  },
  {
    name: "Avatar",
    category: "atom",
    description: "User avatar — image, initials, fallback icon — 3 sizes",
    files: ["Avatar.tsx"],
  },
  {
    name: "Toggle",
    category: "atom",
    description: "On/off switch with label — 3 sizes",
    files: ["Toggle.tsx"],
  },
  {
    name: "Checkbox",
    category: "atom",
    description: "Checked, unchecked, indeterminate — 3 sizes",
    files: ["Checkbox.tsx"],
  },
  {
    name: "Tooltip",
    category: "atom",
    description:
      "Floating tooltip with diamond arrow — auto position detection",
    files: ["Tooltip.tsx"],
  },
  {
    name: "Divider",
    category: "atom",
    description: "Separator — horizontal, vertical, with label (OR)",
    files: ["Divider.tsx"],
  },
  {
    name: "Slider",
    category: "atom",
    description: "Range slider with custom track, handle, label",
    files: ["Slider.tsx"],
  },
  {
    name: "Accordion",
    category: "atom",
    description: "Expandable content panel — single or multi",
    files: ["Accordion.tsx"],
  },
  {
    name: "CopyField",
    category: "atom",
    description: "Read-only copyable text — API keys, secrets, tokens",
    files: ["CopyField.tsx"],
  },
  {
    name: "Digit Input",
    category: "atom",
    description: "Multi-cell numeric input — MFA codes, OTP, verification",
    files: ["MfaDigitInput.tsx"],
  },
  {
    name: "QR Code Card",
    category: "atom",
    description: "QR code display with copyable secret key",
    files: ["QrCodeCard.tsx", "CopyField.tsx"],
  },
  {
    name: "FormField",
    category: "atom",
    description: "Label + any control + error — consistent form field wrapper",
    files: ["FormField.tsx"],
  },
  {
    name: "EmptyState",
    category: "atom",
    description:
      "Icon + title + description + action — tables, lists, search results",
    files: ["EmptyState.tsx"],
  },
  {
    name: "Card",
    category: "atom",
    description:
      "Container card — container, container-flat, inner, inner-flat",
    files: ["globals.css"],
    count: 4,
  },

  // ─── Molecules ──────────────────────────────────────────
  {
    name: "Tabs",
    category: "molecule",
    description: "Tab bar — subtle, nav, nav-horizontal with overflow dots",
    files: ["Tabs.tsx"],
  },
  {
    name: "Select / Dropdown",
    category: "molecule",
    description:
      "Select, LanguageSelector, EmailSelector — auto edge detection",
    files: ["Select.tsx", "LanguageSelector.tsx"],
    count: 3,
  },
  {
    name: "Navigation",
    category: "molecule",
    description:
      "Breadcrumbs (auto-collapse) + Pagination (primary/outline buttons)",
    files: ["Breadcrumbs.tsx", "Pagination.tsx"],
    count: 2,
  },
  {
    name: "DataTable",
    category: "molecule",
    description:
      "Data table with column config, sorting, loading and empty states",
    files: ["DataTable.tsx"],
  },
  {
    name: "Feedback / Alerts",
    category: "molecule",
    description:
      "Toast, inline error, boxed error, rate limit, countdown, full page",
    files: [
      "Toast.tsx",
      "ToastContainer.tsx",
      "InlineError.tsx",
      "RateLimitBanner.tsx",
      "CountdownTimer.tsx",
      "ErrorAlert.tsx",
    ],
    count: 7,
  },
  {
    name: "Calendar",
    category: "molecule",
    description: "Date picker — day/month/year navigation with circle buttons",
    files: ["Calendar.tsx"],
  },
  {
    name: "Charts",
    category: "molecule",
    description: "Line chart, doughnut chart, speedometer — Recharts SVG",
    files: ["TotalUsersChart.tsx", "UserRoleChart.tsx", "ChartCard.tsx"],
    count: 3,
  },
  {
    name: "Recovery Codes Grid",
    category: "atom",
    description: "2×5 grid of monospace recovery codes",
    files: ["RecoveryCodesGrid.tsx"],
  },
  {
    name: "Modal",
    category: "molecule",
    description:
      "Confirm modal — primary/danger variants, focus trap, Escape close, overlay click",
    files: ["ConfirmModal.tsx", "IdleWarningModal.tsx"],
    count: 2,
  },
  {
    name: "Sidebar",
    category: "molecule",
    description:
      "Collapsible navigation — 68px collapsed, 212px expanded, mobile slide-in",
    files: ["Sidebar.tsx"],
  },
];

export const categoryMeta: {
  key: ComponentCategory;
  label: string;
  count: number;
}[] = [
  {
    key: "atom",
    label: "Atoms",
    count: componentRegistry.filter((c) => c.category === "atom").length,
  },
  {
    key: "molecule",
    label: "Molecules",
    count: componentRegistry.filter((c) => c.category === "molecule").length,
  },
];

export const categoryColors: Record<ComponentCategory, string> = {
  atom: "info",
  molecule: "success",
} as const;
