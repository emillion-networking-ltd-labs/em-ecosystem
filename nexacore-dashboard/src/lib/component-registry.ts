export type ComponentCategory = "atom" | "molecule" | "organism" | "utility";

export interface ComponentEntry {
  name: string;
  category: ComponentCategory;
  description: string;
  fileName: string;
}

export const componentRegistry: ComponentEntry[] = [
  // ─── Atoms (11) ──────────────────────────────────────────────
  {
    name: "Button",
    category: "atom",
    description: "Primary action trigger with variants and sizes",
    fileName: "Button.tsx",
  },
  {
    name: "Input",
    category: "atom",
    description: "Text input with label, error, and password toggle",
    fileName: "Input.tsx",
  },
  {
    name: "Badge",
    category: "atom",
    description: "Status indicator with semantic color variants",
    fileName: "Badge.tsx",
  },
  {
    name: "Spinner",
    category: "atom",
    description: "Circular border loading spinner — sm/md/lg",
    fileName: "Spinner.tsx",
  },
  {
    name: "Avatar",
    category: "atom",
    description: "User avatar with image, initials, and fallback",
    fileName: "Avatar.tsx",
  },
  {
    name: "Toggle",
    category: "atom",
    description: "On/off switch with label",
    fileName: "Toggle.tsx",
  },
  {
    name: "Checkbox",
    category: "atom",
    description: "Checkbox with checked, unchecked, and indeterminate states",
    fileName: "Checkbox.tsx",
  },
  {
    name: "Tooltip",
    category: "atom",
    description: "Floating tooltip with 4 position options",
    fileName: "Tooltip.tsx",
  },
  {
    name: "Divider",
    category: "atom",
    description: "Separator line — horizontal, vertical, with label (OR)",
    fileName: "Divider.tsx",
  },
  {
    name: "Slider",
    category: "atom",
    description: "Range slider with custom track and handle",
    fileName: "Slider.tsx",
  },
  {
    name: "Accordion",
    category: "atom",
    description: "Expandable content panel — single or multi (exclusive)",
    fileName: "Accordion.tsx",
  },

  // ─── Molecules (10) ──────────────────────────────────────────
  {
    name: "Tabs",
    category: "molecule",
    description:
      "Tab bar — solid, subtle, nav, nav-horizontal variants with 3 sizes",
    fileName: "Tabs.tsx",
  },
  {
    name: "Select",
    category: "molecule",
    description: "Dropdown select with keyboard navigation",
    fileName: "Select.tsx",
  },
  {
    name: "Calendar",
    category: "molecule",
    description: "Calendar with day/month/year views and date selection",
    fileName: "Calendar.tsx",
  },
  {
    name: "Pagination",
    category: "molecule",
    description: "Page navigation with ellipsis support",
    fileName: "Pagination.tsx",
  },
  {
    name: "Toast",
    category: "molecule",
    description: "Auto-dismiss notification with 4 variants",
    fileName: "Toast.tsx",
  },
  {
    name: "ErrorAlert",
    category: "molecule",
    description: "Error alert banner (unused — pending removal)",
    fileName: "ErrorAlert.tsx",
  },
  {
    name: "Breadcrumbs",
    category: "molecule",
    description: "Navigation breadcrumb trail — auto-collapses on overflow",
    fileName: "Breadcrumbs.tsx",
  },
  {
    name: "ConfirmModal",
    category: "molecule",
    description: "Confirmation dialog with focus trap",
    fileName: "ConfirmModal.tsx",
  },

  {
    name: "ChartCard",
    category: "molecule",
    description: "Chart container with title and legend",
    fileName: "dashboard/ChartCard.tsx",
  },
  {
    name: "TotalUsersChart",
    category: "molecule",
    description: "Line chart — dark mode adaptive, interactive tooltips",
    fileName: "dashboard/TotalUsersChart.tsx",
  },
  {
    name: "UserRoleChart",
    category: "molecule",
    description: "Doughnut chart — users by role with API data",
    fileName: "dashboard/UserRoleChart.tsx",
  },

  // ─── Organisms (4) ──────────────────────────────────────────
  {
    name: "DataTable",
    category: "organism",
    description:
      "Generic data table with column config, loading and empty states",
    fileName: "DataTable.tsx",
  },
  {
    name: "LanguageSelector",
    category: "organism",
    description: "Language picker with search dropdown",
    fileName: "LanguageSelector.tsx",
  },
  {
    name: "ThemeToggle",
    category: "organism",
    description: "Light/dark mode toggle",
    fileName: "ThemeToggle.tsx",
  },
  {
    name: "TurnstileWidget",
    category: "organism",
    description: "Cloudflare Turnstile CAPTCHA",
    fileName: "TurnstileWidget.tsx",
  },

  // ─── Utility (5) ─────────────────────────────────────────────
  {
    name: "InfinitySpinner",
    category: "utility",
    description: "Infinity loop loading animation",
    fileName: "InfinitySpinner.tsx",
  },
  {
    name: "RingSpinner",
    category: "utility",
    description: "Ring-shaped spinner variant",
    fileName: "RingSpinner.tsx",
  },
  {
    name: "CountdownTimer",
    category: "utility",
    description: "Rate limit countdown digits",
    fileName: "CountdownTimer.tsx",
  },
  {
    name: "RateLimitBanner",
    category: "utility",
    description: "Rate limit/lockout notification banner",
    fileName: "RateLimitBanner.tsx",
  },
  {
    name: "ToastContainer",
    category: "utility",
    description: "Toast queue manager",
    fileName: "ToastContainer.tsx",
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
  {
    key: "organism",
    label: "Organisms",
    count: componentRegistry.filter((c) => c.category === "organism").length,
  },
  {
    key: "utility",
    label: "Utility",
    count: componentRegistry.filter((c) => c.category === "utility").length,
  },
];

export const categoryColors: Record<ComponentCategory, string> = {
  atom: "info",
  molecule: "success",
  organism: "warning",
  utility: "default",
} as const;
