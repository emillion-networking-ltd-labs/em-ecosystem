"use client";

import { useState, useRef, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Search,
  Trash2,
  Edit,
  Copy,
  Archive,
  Check,
  BarChart3,
  ShoppingCart,
  Settings,
  ChevronDown,
  ArrowLeft,
  AlertTriangle,
  CircleX,
  CircleCheck,
  CircleAlert,
  Info,
  X,
  Bell,
} from "lucide-react";
import CountdownTimer from "@/components/ui/CountdownTimer";
import TotalUsersChart from "@/components/dashboard/TotalUsersChart";
import Button, {
  variantClasses as buttonVariants,
  sizeClasses as buttonSizes,
  baseClass as buttonBase,
} from "@/components/ui/Button";
import Input, { inputSpecs } from "@/components/ui/Input";
import Badge, {
  variantClasses as badgeVariants,
  sizeClasses as badgeSizes,
  baseClass as badgeBase,
} from "@/components/ui/Badge";
import Spinner, { spinnerSpecs } from "@/components/ui/Spinner";
import InfinitySpinner, {
  infinitySpinnerSpecs,
} from "@/components/ui/InfinitySpinner";
import RingSpinner, { ringSpinnerSpecs } from "@/components/ui/RingSpinner";
import Avatar, {
  sizeClasses as avatarSizes,
  baseClass as avatarBase,
} from "@/components/ui/Avatar";
import Toggle, { toggleSpecs } from "@/components/ui/Toggle";
import Checkbox, { checkboxSpecs } from "@/components/ui/Checkbox";
import Tooltip, { tooltipSpecs } from "@/components/ui/Tooltip";
import Divider, { dividerSpecs } from "@/components/ui/Divider";
import Slider, { sliderSpecs } from "@/components/ui/Slider";
import Tabs, { tabsSpecs } from "@/components/ui/Tabs";
import Select, { selectSpecs } from "@/components/ui/Select";
import Calendar, { calendarSpecs } from "@/components/ui/Calendar";
import Pagination, { paginationSpecs } from "@/components/ui/Pagination";

import InlineError, { inlineErrorSpecs } from "@/components/ui/InlineError";
import FormField, { formFieldSpecs } from "@/components/ui/FormField";
import EmptyState, { emptyStateSpecs } from "@/components/ui/EmptyState";
import Breadcrumbs, { breadcrumbsSpecs } from "@/components/ui/Breadcrumbs";
import MfaDigitInput, {
  mfaDigitInputSpecs,
} from "@/components/ui/MfaDigitInput";
import CopyField, { copyFieldSpecs } from "@/components/ui/CopyField";
import QrCodeCard, { qrCodeCardSpecs } from "@/components/ui/QrCodeCard";
import RecoveryCodesGrid, {
  recoveryCodesGridSpecs,
} from "@/components/ui/RecoveryCodesGrid";
import IconButton, {
  variantClasses as iconBtnVariants,
  sizeClasses as iconBtnSizes,
  baseClass as iconBtnBase,
  usage as iconBtnUsage,
} from "@/components/ui/IconButton";
import SegmentedControl, {
  segmentedControlSpecs,
} from "@/components/ui/SegmentedControl";
import EmailSelector from "@/components/ui/EmailSelector";
import LanguageSelector, {
  languageSelectorSpecs,
} from "@/components/ui/LanguageSelector";
import DataTable, { type ColumnDef } from "@/components/ui/DataTable";
import ConfirmModal, { confirmModalSpecs } from "@/components/ui/ConfirmModal";
import DateInput, { dateInputSpecs } from "@/components/ui/DateInput";
import SidebarNav, { sidebarNavSpecs } from "@/components/ui/SidebarNav";
import type { SidebarNavSection as SidebarSection } from "@/components/ui/SidebarNav";
import IconBadge, { iconBadgeSpecs } from "@/components/ui/IconBadge";
import AlertBox, { alertBoxSpecs } from "@/components/ui/AlertBox";
import Accordion, {
  SingleAccordion,
  accordionSpecs,
} from "@/components/ui/Accordion";

/* ===== Section Wrapper ===== */

function ShowcaseSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="card-flat space-y-4 scroll-mt-20"
      id={`showcase-${title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/-$/, "")}`}
    >
      <h3 className="text-h3 font-semibold text-content-primary">{title}</h3>
      {children}
    </div>
  );
}

/* ===== Specs Panel (uses Accordion) ===== */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="shrink-0 p-1 rounded text-content-tertiary hover:text-content-primary transition-colors"
      aria-label="Copy classes"
    >
      {copied ? (
        <Check size={14} className="text-success" />
      ) : (
        <Copy size={14} />
      )}
    </button>
  );
}

function SpecsPanel({
  specs,
}: {
  specs: Record<string, Record<string, string>>;
}) {
  return (
    <SingleAccordion title="Specs">
      <div className="divide-y divide-border-strong">
        {Object.entries(specs).map(([section, entries]) => (
          <div key={section} className="py-3">
            <p className="text-caption font-semibold uppercase tracking-wider text-content-tertiary mb-2">
              {section}
            </p>
            <div className="space-y-1.5">
              {Object.entries(entries).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-caption font-normal text-content-tertiary w-20 shrink-0">
                    {key}
                  </span>
                  <code className="flex-1 text-caption bg-surface-secondary rounded px-2 py-1 text-content-primary font-mono overflow-x-auto">
                    {value}
                  </code>
                  <CopyButton text={value} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SingleAccordion>
  );
}

/* ===== Atom Showcases ===== */

/* Hover classes derived from Button.tsx variantClasses — static simulation of hover state */
const hoverClasses = {
  primary:
    "bg-surface-inverse text-content-inverse border border-border-components opacity-90",
  secondary:
    "bg-surface-subtle text-content-secondary border border-border-components",
  outline:
    "bg-surface-subtle text-content-primary border border-border-components",
  danger: "bg-error-bg text-error border border-error-border",
};

const baseButtonClass =
  "inline-flex items-center justify-center gap-2 font-normal rounded-md px-6 py-2.5 text-body h-10";

type ButtonRow = {
  state: string;
  disabled?: boolean;
  loading?: boolean;
  hover?: boolean;
};

const buttonRows: ButtonRow[] = [
  { state: "Normal" },
  { state: "Hover", hover: true },
  { state: "Disabled", disabled: true },
  { state: "Loading", loading: true },
  { state: "With icon" },
  { state: "Circle" },
];

function ButtonStateTable({ mode }: { mode: "light" | "dark" }) {
  const variants = ["primary", "secondary", "outline", "danger"] as const;

  const columns: ColumnDef<ButtonRow>[] = [
    {
      key: "state",
      label: mode,
      align: "left",
      width: "100px",
      headerClassName: "font-mono font-normal lowercase",
      render: (row) => row.state,
    },
    ...variants.map((v) => ({
      key: v,
      label: v.toUpperCase(),
      align: "center" as const,
      render: (row: ButtonRow) =>
        row.hover ? (
          <button className={`${baseButtonClass} ${hoverClasses[v]}`}>
            Button
          </button>
        ) : row.state === "Circle" ? (
          <div className="flex justify-center">
            <Button
              variant={v}
              fullWidth={false}
              className="!rounded-full !px-0 w-9 h-9 !min-w-0"
            >
              15
            </Button>
          </div>
        ) : (
          <Button
            variant={v}
            fullWidth={false}
            disabled={row.disabled}
            loading={row.loading}
          >
            {row.state === "With icon" && <Settings size={16} />}
            Button
          </Button>
        ),
    })),
  ];

  return (
    <div className={mode === "dark" ? "dark" : "light"}>
      <DataTable
        columns={columns}
        data={buttonRows}
        keyExtractor={(row) => row.state}
        hoverRows={false}
      />
    </div>
  );
}

function ButtonShowcase() {
  return (
    <ShowcaseSection title="Button">
      {/* Light Mode */}
      <ButtonStateTable mode="light" />

      {/* Dark Mode */}
      <ButtonStateTable mode="dark" />

      {/* Sizes — largest to smallest */}
      <div className="mt-6">
        <p className="text-body font-semibold text-content-primary mb-2">
          Sizes
        </p>
        <div className="flex flex-wrap items-end justify-center sm:justify-start gap-4">
          <div className="flex flex-col items-center gap-1.5">
            <Button variant="primary" size="lg" fullWidth={false}>
              Button
            </Button>
            <span className="text-caption text-content-tertiary">
              lg · 48px
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Button variant="primary" size="md" fullWidth={false}>
              Button
            </Button>
            <span className="text-caption text-content-tertiary">
              md · 40px (default)
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Button variant="primary" size="sm" fullWidth={false}>
              Button
            </Button>
            <span className="text-caption text-content-tertiary">
              sm · 32px
            </span>
          </div>
        </div>
      </div>

      {/* Link Buttons */}
      <p className="text-body font-semibold text-content-primary mb-2">
        Link Buttons
      </p>
      {(["light", "dark"] as const).map((mode) => {
        const linkColumns: ColumnDef<{ state: string; hover?: boolean }>[] = [
          {
            key: "state",
            label: mode,
            align: "left",
            width: "15%",
            headerClassName: "font-mono font-normal lowercase",
            render: (row) => row.state,
          },
          {
            key: "simple",
            label: "SIMPLE",
            align: "center",
            render: (row) =>
              row.hover ? (
                <span className="text-body font-normal text-content-primary">
                  Link
                </span>
              ) : (
                <button
                  className={`${linkSpecs.base} ${linkSpecs.variants.simple}`}
                >
                  Link
                </button>
              ),
          },
          {
            key: "underline",
            label: "UNDERLINE",
            align: "center",
            render: (row) =>
              row.hover ? (
                <span className="text-body font-normal text-content-primary underline">
                  Link
                </span>
              ) : (
                <button
                  className={`${linkSpecs.base} ${linkSpecs.variants.underline}`}
                >
                  Link
                </button>
              ),
          },
          {
            key: "underline-icon",
            label: "UNDERLINE + ICON",
            align: "center",
            render: (row) =>
              row.hover ? (
                <span className="inline-flex items-center justify-center gap-1 w-full text-body font-normal text-content-primary underline">
                  <ArrowLeft size={14} />
                  Link
                </span>
              ) : (
                <button
                  className={`inline-flex items-center justify-center gap-1 w-full ${linkSpecs.base} ${linkSpecs.variants.underline}`}
                >
                  <ArrowLeft size={14} />
                  Link
                </button>
              ),
          },
        ];
        return (
          <div
            key={`link-${mode}`}
            className={mode === "dark" ? "dark" : "light"}
          >
            <DataTable
              columns={linkColumns}
              data={[{ state: "Normal" }, { state: "Hover", hover: true }]}
              keyExtractor={(r) => r.state}
              hoverRows={false}
            />
          </div>
        );
      })}

      {/* Icon Buttons — uses <IconButton> component for propagation */}
      <p className="text-body font-semibold text-content-primary mb-2">
        Icon Buttons
      </p>
      {(["light", "dark"] as const).map((mode) => {
        const iconColumns: ColumnDef<{ state: string; hover?: boolean }>[] = [
          {
            key: "state",
            label: mode,
            align: "left",
            width: "100px",
            headerClassName: "font-mono font-normal lowercase",
            render: (row) => row.state,
          },
          {
            key: "default",
            label: "DEFAULT",
            align: "center",
            render: (row) => (
              <div className="flex justify-center">
                {row.hover ? (
                  <IconButton className="pointer-events-none hover:bg-surface-tertiary text-content-primary">
                    <Copy size={16} />
                  </IconButton>
                ) : (
                  <IconButton variant="default" aria-label="Default">
                    <Copy size={16} />
                  </IconButton>
                )}
              </div>
            ),
          },
          {
            key: "danger",
            label: "DANGER",
            align: "center",
            render: (row) => (
              <div className="flex justify-center">
                {row.hover ? (
                  <IconButton
                    variant="danger"
                    className="pointer-events-none bg-error-bg"
                  >
                    <Trash2 size={16} />
                  </IconButton>
                ) : (
                  <IconButton variant="danger" aria-label="Danger">
                    <Trash2 size={16} />
                  </IconButton>
                )}
              </div>
            ),
          },
          {
            key: "boxed",
            label: "BOXED",
            align: "center",
            render: (row) => (
              <div className="flex justify-center">
                {row.hover ? (
                  <IconButton variant="boxed" className="pointer-events-none">
                    <Settings size={16} />
                  </IconButton>
                ) : (
                  <IconButton variant="boxed" aria-label="Boxed">
                    <Settings size={16} />
                  </IconButton>
                )}
              </div>
            ),
          },
          {
            key: "boxed-hover",
            label: "BOXED-HOVER",
            align: "center",
            render: (row) => (
              <div className="flex justify-center">
                {row.hover ? (
                  <IconButton
                    variant="boxed-hover"
                    className="pointer-events-none bg-surface-tertiary text-content-primary"
                  >
                    <Bell size={16} />
                  </IconButton>
                ) : (
                  <IconButton variant="boxed-hover" aria-label="Boxed Hover">
                    <Bell size={16} />
                  </IconButton>
                )}
              </div>
            ),
          },
        ];
        return (
          <div
            key={`icon-${mode}`}
            className={mode === "dark" ? "dark" : "light"}
          >
            <DataTable
              columns={iconColumns}
              data={[{ state: "Normal" }, { state: "Hover", hover: true }]}
              keyExtractor={(r) => r.state}
              hoverRows={false}
            />
          </div>
        );
      })}

      <SpecsPanel
        specs={{
          Variants: buttonVariants,
          Sizes: buttonSizes,
          Base: { shared: buttonBase },
          Dimensions: {
            sm: "32px height · 12px font · 16/6px padding",
            "md (default)": "40px height · 14px font · 24/10px padding",
            lg: "48px height · 16px font · 32/12px padding",
            circle:
              "min-w-9 h-9 px-2 rounded-full · auto-width (round for short text, pill for long)",
          },
          "Link Variants": linkSpecs.variants,
          "Link Base": { shared: linkSpecs.base },
          "Icon Button Base": { shared: iconBtnBase },
          "Icon Button Variants": iconBtnVariants,
          "Icon Button Sizes": iconBtnSizes,
          "Icon Button Usage": iconBtnUsage,
        }}
      />
    </ShowcaseSection>
  );
}

const linkSpecs = {
  base: "text-body font-normal transition-colors",
  variants: {
    simple: "text-content-primary/75 hover:text-content-primary",
    underline:
      "text-content-primary/75 hover:text-content-primary hover:underline active:text-content-primary/75 active:underline active:decoration-dotted",
    "underline + icon":
      "Same as underline with flex items-center gap-1 + lucide icon 16px",
  },
};

function InputGrid({ mode }: { mode: "light" | "dark" }) {
  return (
    <div
      className={`card-flat !p-4 ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
    >
      <p className="text-caption text-content-tertiary font-mono mb-3">
        {mode}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Input label="Default" placeholder="Type here..." />
        <Input
          label="With icon"
          placeholder="Search..."
          leftIcon={<Search size={16} />}
        />
        <Input label="Password" type="password" placeholder="Enter password" />
        <Input
          label="Error state"
          placeholder="Invalid"
          error="This field is required"
        />
        <Input label="Disabled" placeholder="Cannot edit" disabled />
      </div>
    </div>
  );
}

function DateInputShowcase() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  return (
    <div className="flex flex-wrap gap-4">
      {(["light", "dark"] as const).map((mode) => (
        <div
          key={`dateinput-${mode}`}
          className={`flex-1 min-w-[200px] card-flat !p-4 ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
        >
          <p className="text-caption text-content-tertiary font-mono mb-3">
            {mode}
          </p>
          <div className="flex flex-col gap-3">
            <DateInput
              label="Start date"
              size="md"
              value={startDate}
              onChange={setStartDate}
            />
            <DateInput
              label="End date"
              size="sm"
              value={endDate}
              onChange={setEndDate}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function InputShowcase() {
  return (
    <ShowcaseSection title="Input">
      <InputGrid mode="light" />

      <InputGrid mode="dark" />

      {/* Sizes & Search */}
      <div>
        <div>
          <p className="text-body font-semibold text-content-primary mb-2">
            Sizes
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <Input placeholder="md · 48px (default)" />
              <span className="text-caption text-content-tertiary">
                md · 48px (default)
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <Input size="sm" placeholder="sm · 40px" />
              <span className="text-caption text-content-tertiary">
                sm · 40px
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <Input placeholder="md · no outline" variant="filled" />
              <span className="text-caption text-content-tertiary">
                md · 48px (no outline)
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              <Input size="sm" placeholder="sm · no outline" variant="filled" />
              <span className="text-caption text-content-tertiary">
                sm · 40px (no outline)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Date Input */}
      <p className="text-body font-semibold text-content-primary mb-2">
        Date Input
      </p>
      <DateInputShowcase />

      <SpecsPanel
        specs={{
          Container: { shared: inputSpecs.container },
          Sizes: inputSpecs.sizes,
          Label: { shared: inputSpecs.label },
          Input: { shared: inputSpecs.input },
          States: inputSpecs.states,
          Icons: inputSpecs.icons,
          "Date Input": dateInputSpecs.sizes,
          Dimensions: {
            "border-radius": "8px (rounded-lg)",
            "label font": "14px (text-body) / 22px line-height, semibold",
            outline: "2px, offset-2",
          },
        }}
      />
    </ShowcaseSection>
  );
}

function BadgeSizeGrid({ mode }: { mode: "light" | "dark" }) {
  const variants = ["default", "success", "warning", "error", "info"] as const;
  const sizes = ["lg", "md", "sm"] as const;
  return (
    <div
      className={`card-flat !p-4 ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
    >
      <p className="text-caption text-content-tertiary font-mono mb-3">
        {mode}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {sizes.map((size) => (
          <div key={size} className="card-flat !p-4">
            <p className="text-caption text-content-tertiary font-mono mb-3">
              {size} · {size === "sm" ? "12" : size === "md" ? "14" : "16"}px
              {size === "md" ? " (default)" : ""}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {variants.map((v) => (
                <Badge key={v} variant={v} size={size}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IconBadgeSizeGrid({ mode }: { mode: "light" | "dark" }) {
  const variants = ["default", "success", "warning", "error", "info"] as const;
  const sizes = ["lg", "md", "sm"] as const;
  const icons: Record<string, Record<number, React.ReactNode>> = {
    default: {
      16: <Settings size={16} />,
      24: <Settings size={24} />,
      32: <Settings size={32} />,
    },
    success: {
      16: <Check size={16} />,
      24: <Check size={24} />,
      32: <Check size={32} />,
    },
    warning: {
      16: <AlertTriangle size={16} />,
      24: <AlertTriangle size={24} />,
      32: <AlertTriangle size={32} />,
    },
    error: { 16: <X size={16} />, 24: <X size={24} />, 32: <X size={32} /> },
    info: {
      16: <Info size={16} />,
      24: <Info size={24} />,
      32: <Info size={32} />,
    },
  };
  return (
    <div
      className={`card-flat !p-4 ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
    >
      <p className="text-caption text-content-tertiary font-mono mb-3">
        {mode}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {sizes.map((size) => {
          const iconSize = size === "sm" ? 16 : size === "md" ? 24 : 32;
          return (
            <div key={size} className="card-flat !p-4">
              <p className="text-caption text-content-tertiary font-mono mb-3">
                {size} · {size === "sm" ? "32" : size === "md" ? "40" : "56"}px
                {size === "sm" ? " (default)" : ""}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {variants.map((v) => (
                  <div key={v} className="flex flex-col items-center gap-1">
                    <IconBadge variant={v} size={size}>
                      {icons[v][iconSize]}
                    </IconBadge>
                    <span className="text-caption text-content-tertiary font-mono">
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BadgeShowcase() {
  return (
    <ShowcaseSection title="Badge">
      <BadgeSizeGrid mode="light" />

      <BadgeSizeGrid mode="dark" />

      {/* Icon Badge */}
      <p className="text-body font-semibold text-content-primary mb-2">
        Icon Badge
      </p>
      <IconBadgeSizeGrid mode="light" />
      <IconBadgeSizeGrid mode="dark" />

      <SpecsPanel
        specs={{
          Variants: badgeVariants,
          Sizes: badgeSizes,
          Base: { shared: badgeBase },
          Dimensions: {
            sm: "12px font · 8/2px padding",
            "md (default)": "14px font · 10/4px padding",
            lg: "16px font · 12/6px padding",
          },
          "Icon Badge": iconBadgeSpecs.sizes,
        }}
      />
    </ShowcaseSection>
  );
}

const spinnerTypes = [
  { label: "Spinner (circular)", Component: Spinner },
  { label: "InfinitySpinner (buttons)", Component: InfinitySpinner },
  { label: "RingSpinner (pages)", Component: RingSpinner },
] as const;

function SpinnerGrid({ mode }: { mode: "light" | "dark" }) {
  return (
    <div
      className={`card-flat !p-4 ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
    >
      <p className="text-caption text-content-tertiary font-mono mb-3">
        {mode}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {spinnerTypes.map(({ label, Component }) => (
          <div key={label} className="card-flat !p-4">
            <p className="text-caption text-content-tertiary font-mono mb-3">
              {label}
            </p>
            <div className="flex flex-wrap items-end justify-center sm:justify-start gap-4">
              {(["lg", "md", "sm"] as const).map((s) => (
                <div key={s} className="flex flex-col items-center gap-1.5">
                  <div className="flex h-8 items-center justify-center">
                    <Component size={s} />
                  </div>
                  <span className="text-caption text-content-tertiary">
                    {s} · {s === "sm" ? "16" : s === "md" ? "24" : "32"}px
                    {s === "md" ? " (default)" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpinnerShowcase() {
  return (
    <ShowcaseSection title="Spinner">
      <SpinnerGrid mode="light" />

      <SpinnerGrid mode="dark" />

      <SpecsPanel
        specs={{
          "Spinner (circular)": {
            type: spinnerSpecs.type,
            base: spinnerSpecs.base,
            ...spinnerSpecs.sizes,
          },
          "InfinitySpinner (buttons)": {
            type: infinitySpinnerSpecs.type,
            base: infinitySpinnerSpecs.base,
            ...infinitySpinnerSpecs.sizes,
          },
          "RingSpinner (pages)": {
            type: ringSpinnerSpecs.type,
            base: ringSpinnerSpecs.base,
            ...ringSpinnerSpecs.sizes,
          },
        }}
      />
    </ShowcaseSection>
  );
}

const avatarDimensions = { sm: "32px", md: "40px", lg: "64px" } as const;

function AvatarGrid({ mode }: { mode: "light" | "dark" }) {
  const sizes = ["lg", "md", "sm"] as const;
  const names = ["Jane Doe", "Alice Brown", "Bob Wilson"];
  return (
    <div
      className={`card-flat !p-4 ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
    >
      <p className="text-caption text-content-tertiary font-mono mb-3">
        {mode}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(["image", "initials", "icon fallback"] as const).map((type) => (
          <div key={type} className="card-flat !p-4">
            <p className="text-caption text-content-tertiary font-mono mb-3">
              {type}
            </p>
            <div className="flex flex-wrap items-end justify-center sm:justify-start gap-3">
              {sizes.map((s, i) => (
                <div key={s} className="flex flex-col items-center gap-1.5">
                  {type === "image" ? (
                    <Avatar
                      size={s}
                      src={`https://i.pravatar.cc/64?u=${i + 1}`}
                      name={names[i]}
                    />
                  ) : type === "initials" ? (
                    <Avatar size={s} name={names[i]} />
                  ) : (
                    <Avatar size={s} />
                  )}
                  <span className="text-caption text-content-tertiary">
                    {s} · {avatarDimensions[s]}
                    {s === "md" ? " (default)" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AvatarShowcase() {
  return (
    <ShowcaseSection title="Avatar">
      <AvatarGrid mode="light" />

      <AvatarGrid mode="dark" />

      <SpecsPanel
        specs={{
          Sizes: avatarSizes,
          Base: { shared: avatarBase },
          Dimensions: {
            sm: "32px · 12px font · 14px icon",
            "md (default)": "40px · 14px font · 18px icon",
            lg: "64px · 20px font · 28px icon",
          },
          Fallbacks: {
            "1st": "Image (src prop)",
            "2nd": "Initials from name (2 letters max)",
            "3rd": "User icon (lucide)",
          },
        }}
      />
    </ShowcaseSection>
  );
}

function ToggleCard({ mode }: { mode: "light" | "dark" }) {
  const [values, setValues] = useState({
    off: false,
    on: true,
    sm: false,
    md: true,
    lg: true,
  });
  return (
    <div
      className={`flex-1 min-w-[280px] card-flat !p-4 ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
    >
      <p className="text-caption text-content-tertiary font-mono mb-3">
        {mode}
      </p>
      <div className="flex flex-wrap items-end justify-center sm:justify-start gap-4">
        <div className="flex flex-col items-center gap-1.5">
          <Toggle
            checked={values.off}
            onChange={(v) => setValues((s) => ({ ...s, off: v }))}
          />
          <span className="text-caption text-content-tertiary">
            {values.off ? "On" : "Off"}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Toggle
            checked={values.on}
            onChange={(v) => setValues((s) => ({ ...s, on: v }))}
          />
          <span className="text-caption text-content-tertiary">
            {values.on ? "On" : "Off"}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Toggle checked={false} disabled />
          <span className="text-caption text-content-tertiary">
            Disabled off
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Toggle checked={true} disabled />
          <span className="text-caption text-content-tertiary">
            Disabled on
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Toggle
            size="lg"
            checked={values.lg}
            onChange={(v) => setValues((s) => ({ ...s, lg: v }))}
          />
          <span className="text-caption text-content-tertiary">
            lg · 48×26px
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Toggle
            size="md"
            checked={values.md}
            onChange={(v) => setValues((s) => ({ ...s, md: v }))}
          />
          <span className="text-caption text-content-tertiary">
            md · 40×22px (default)
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Toggle
            size="sm"
            checked={values.sm}
            onChange={(v) => setValues((s) => ({ ...s, sm: v }))}
          />
          <span className="text-caption text-content-tertiary">
            sm · 32×18px
          </span>
        </div>
      </div>
    </div>
  );
}

function ToggleShowcase() {
  return (
    <ShowcaseSection title="Toggle">
      <div className="flex flex-wrap gap-4">
        <ToggleCard mode="light" />
        <ToggleCard mode="dark" />
      </div>

      <SpecsPanel
        specs={{
          Track: toggleSpecs.track,
          Circle: { shared: toggleSpecs.circle },
          Sizes: toggleSpecs.sizes,
        }}
      />
    </ShowcaseSection>
  );
}

function CheckboxCard({ mode }: { mode: "light" | "dark" }) {
  const [values, setValues] = useState({
    a: false,
    b: true,
    c: false,
    sm: true,
    md: true,
    lg: true,
  });
  return (
    <div
      className={`flex-1 min-w-[280px] card-flat !p-4 ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
    >
      <p className="text-caption text-content-tertiary font-mono mb-3">
        {mode}
      </p>
      <div className="flex flex-wrap items-end justify-center sm:justify-start gap-4">
        <div className="flex flex-col items-center gap-1.5">
          <Checkbox
            checked={values.a}
            onChange={(v) => setValues((s) => ({ ...s, a: v }))}
          />
          <span className="text-caption text-content-tertiary">
            {values.a ? "Checked" : "Unchecked"}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Checkbox
            checked={values.b}
            onChange={(v) => setValues((s) => ({ ...s, b: v }))}
          />
          <span className="text-caption text-content-tertiary">
            {values.b ? "Checked" : "Unchecked"}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Checkbox
            checked={values.c}
            onChange={(v) => setValues((s) => ({ ...s, c: v }))}
            indeterminate
          />
          <span className="text-caption text-content-tertiary">
            Indeterminate
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Checkbox checked={false} disabled />
          <span className="text-caption text-content-tertiary">
            Disabled off
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Checkbox checked={true} disabled />
          <span className="text-caption text-content-tertiary">
            Disabled on
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Checkbox
            size="lg"
            checked={values.lg}
            onChange={(v) => setValues((s) => ({ ...s, lg: v }))}
          />
          <span className="text-caption text-content-tertiary">lg · 24px</span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Checkbox
            size="md"
            checked={values.md}
            onChange={(v) => setValues((s) => ({ ...s, md: v }))}
          />
          <span className="text-caption text-content-tertiary">
            md · 20px (default)
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Checkbox
            size="sm"
            checked={values.sm}
            onChange={(v) => setValues((s) => ({ ...s, sm: v }))}
          />
          <span className="text-caption text-content-tertiary">sm · 16px</span>
        </div>
      </div>
    </div>
  );
}

function CheckboxShowcase() {
  return (
    <ShowcaseSection title="Checkbox">
      <div className="flex flex-wrap gap-4">
        <CheckboxCard mode="light" />
        <CheckboxCard mode="dark" />
      </div>

      <SpecsPanel
        specs={{
          Box: checkboxSpecs.box,
          Sizes: checkboxSpecs.sizes,
          Label: { shared: checkboxSpecs.label },
        }}
      />
    </ShowcaseSection>
  );
}

function TooltipCard({ mode }: { mode: "light" | "dark" }) {
  const positions = ["top", "bottom", "left", "right"] as const;
  return (
    <div
      className={`flex-1 min-w-[280px] card-flat !p-4 ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
    >
      <p className="text-caption text-content-tertiary font-mono mb-3">
        {mode}
      </p>
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 py-6">
        {positions.map((pos) => (
          <Tooltip key={pos} content={`Tooltip on ${pos}`} position={pos}>
            <Button variant="outline" size="md" fullWidth={false}>
              {pos.charAt(0).toUpperCase() + pos.slice(1)}
            </Button>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

function TooltipShowcase() {
  return (
    <ShowcaseSection title="Tooltip">
      <div className="flex flex-wrap gap-4">
        <TooltipCard mode="light" />
        <TooltipCard mode="dark" />
      </div>

      <SpecsPanel
        specs={{
          Container: { shared: tooltipSpecs.container },
          Text: { shared: tooltipSpecs.text },
          Arrow: { shared: tooltipSpecs.arrow },
          Positions: tooltipSpecs.positions,
        }}
      />
    </ShowcaseSection>
  );
}

function DividerShowcase() {
  return (
    <ShowcaseSection title="Divider">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[280px] card-flat !p-4 light bg-surface-primary">
          <p className="text-caption text-content-tertiary font-mono mb-3">
            light
          </p>
          <div className="space-y-3">
            <div className="space-y-4">
              <p className="text-body text-content-tertiary">Content above</p>
              <Divider />
              <p className="text-body text-content-tertiary">Content below</p>
            </div>
            <div className="space-y-4">
              <p className="text-body text-content-tertiary">Content above</p>
              <Divider label="OR" />
              <p className="text-body text-content-tertiary">Content below</p>
            </div>
            <div className="flex items-center gap-6 h-16">
              <div className="flex items-center gap-3 h-full">
                <p className="text-body text-content-tertiary">Left</p>
                <Divider orientation="vertical" />
                <p className="text-body text-content-tertiary">Right</p>
              </div>
              <div className="flex items-center gap-3 h-full">
                <p className="text-body text-content-tertiary">Left</p>
                <Divider orientation="vertical" label="OR" />
                <p className="text-body text-content-tertiary">Right</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-[280px] card-flat !p-4 dark bg-surface-primary">
          <p className="text-caption text-content-tertiary font-mono mb-3">
            dark
          </p>
          <div className="space-y-3">
            <div className="space-y-4">
              <p className="text-body text-content-tertiary">Content above</p>
              <Divider />
              <p className="text-body text-content-tertiary">Content below</p>
            </div>
            <div className="space-y-4">
              <p className="text-body text-content-tertiary">Content above</p>
              <Divider label="OR" />
              <p className="text-body text-content-tertiary">Content below</p>
            </div>
            <div className="flex items-center gap-6 h-16">
              <div className="flex items-center gap-3 h-full">
                <p className="text-body text-content-tertiary">Left</p>
                <Divider orientation="vertical" />
                <p className="text-body text-content-tertiary">Right</p>
              </div>
              <div className="flex items-center gap-3 h-full">
                <p className="text-body text-content-tertiary">Left</p>
                <Divider orientation="vertical" label="OR" />
                <p className="text-body text-content-tertiary">Right</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SpecsPanel
        specs={{
          Types: dividerSpecs.types,
          Base: dividerSpecs.base,
        }}
      />
    </ShowcaseSection>
  );
}

function SliderCard({ mode }: { mode: "light" | "dark" }) {
  const [v1, setV1] = useState(35);
  const [v2, setV2] = useState(70);
  return (
    <div
      className={`flex-1 min-w-[280px] card-flat !p-4 ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
    >
      <p className="text-caption text-content-tertiary font-mono mb-3">
        {mode}
      </p>
      <div className="space-y-4">
        <Slider value={v1} onChange={setV1} label="Volume" showValue />
        <Slider
          value={v2}
          onChange={setV2}
          min={0}
          max={200}
          step={10}
          label="Budget"
          showValue
        />
        <Slider value={50} onChange={() => {}} label="Disabled" disabled />
      </div>
    </div>
  );
}

function SliderShowcase() {
  return (
    <ShowcaseSection title="Slider">
      <div className="flex flex-wrap gap-4">
        <SliderCard mode="light" />
        <SliderCard mode="dark" />
      </div>

      <SpecsPanel
        specs={{
          Track: sliderSpecs.track,
          Thumb: sliderSpecs.thumb,
          Label: { shared: sliderSpecs.label },
          Value: { shared: sliderSpecs.value },
        }}
      />
    </ShowcaseSection>
  );
}

/* ===== Molecule Showcases ===== */

function TabsNavCard({ mode }: { mode: "light" | "dark" }) {
  const [active, setActive] = useState("dashboard");
  const navItems = [
    { label: "Dashboard", value: "dashboard", icon: <BarChart3 size={16} /> },
    { label: "Orders", value: "orders", icon: <ShoppingCart size={16} /> },
    { label: "Settings", value: "settings", icon: <Settings size={16} /> },
  ];
  return (
    <div
      className={`flex-1 card-flat !p-4 overflow-hidden ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
    >
      <p className="text-caption text-content-tertiary font-mono mb-3">
        {mode} · nav
      </p>
      <Tabs
        tabs={navItems}
        activeTab={active}
        onChange={setActive}
        variant="nav"
      />
    </div>
  );
}

function ScrollDotsWrapper({
  tabs,
  activeTab,
  onChange,
  children,
}: {
  tabs: { value: string }[];
  activeTab: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const scrollLeftRef = useRef(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setOverflows(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const el = scrollRef.current;
      if (!el) return;
      e.preventDefault();
      el.scrollLeft = scrollLeftRef.current - (e.clientX - startX.current);
    };
    const onUp = () => setDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

  const onMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current;
    if (!el || !overflows) return;
    setDragging(true);
    startX.current = e.clientX;
    scrollLeftRef.current = el.scrollLeft;
  };

  return (
    <>
      <div
        ref={scrollRef}
        style={{
          cursor: overflows ? (dragging ? "grabbing" : "grab") : undefined,
        }}
        className={`overflow-x-auto scrollbar-hide touch-pan-x select-none ${dragging ? "[&_*]:pointer-events-none" : ""}`}
        onMouseDown={onMouseDown}
      >
        {children}
      </div>
      {overflows && (
        <div className="flex justify-center gap-1 mt-2">
          {tabs.map((tab, i) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                onChange(tab.value);
                const el = scrollRef.current;
                if (!el) return;
                const tabEl = el.querySelectorAll("[role='tab']")[
                  i
                ] as HTMLElement;
                if (tabEl)
                  tabEl.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                    inline: "center",
                  });
              }}
              className="p-1 cursor-pointer"
            >
              <div
                className={`h-[9px] w-[9px] rounded-full transition-colors ${activeTab === tab.value ? "bg-surface-inverse" : "bg-border-strong hover:bg-content-primary/30"}`}
              />
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function NavHorizontalColumn() {
  const [activeLight, setActiveLight] = useState("dashboard");
  const [activeDark, setActiveDark] = useState("dashboard");
  const navItems = [
    { label: "Dashboard", value: "dashboard", icon: <BarChart3 size={16} /> },
    { label: "Orders", value: "orders", icon: <ShoppingCart size={16} /> },
    { label: "Settings", value: "settings", icon: <Settings size={16} /> },
  ];
  return (
    <div className="flex-1 min-w-[280px] flex flex-col gap-4">
      <div className="card-flat !p-4 overflow-hidden light bg-surface-primary">
        <p className="text-caption text-content-tertiary font-mono mb-3">
          light · nav-horizontal
        </p>
        <ScrollDotsWrapper
          tabs={navItems}
          activeTab={activeLight}
          onChange={setActiveLight}
        >
          <Tabs
            tabs={navItems}
            activeTab={activeLight}
            onChange={setActiveLight}
            variant="nav-horizontal"
          />
        </ScrollDotsWrapper>
      </div>
      <div className="card-flat !p-4 overflow-hidden dark bg-surface-primary">
        <p className="text-caption text-content-tertiary font-mono mb-3">
          dark · nav-horizontal
        </p>
        <ScrollDotsWrapper
          tabs={navItems}
          activeTab={activeDark}
          onChange={setActiveDark}
        >
          <Tabs
            tabs={navItems}
            activeTab={activeDark}
            onChange={setActiveDark}
            variant="nav-horizontal"
          />
        </ScrollDotsWrapper>
      </div>
    </div>
  );
}

function TabsShowcase() {
  const [segPrimary, setSegPrimary] = useState("a");
  const [segSecondary, setSegSecondary] = useState("a");
  const [segOutline, setSegOutline] = useState("a");
  const [segSm, setSegSm] = useState("a");
  const [segMd, setSegMd] = useState("a");
  const [segLg, setSegLg] = useState("a");
  return (
    <ShowcaseSection title="Tabs">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <TabsNavCard mode="light" />
          <TabsNavCard mode="dark" />
        </div>
        <NavHorizontalColumn />
      </div>

      {/* Segmented Control — binary selector variant */}
      <p className="text-body font-semibold text-content-primary mb-2">
        Segmented Control
      </p>
      <div className="flex flex-wrap gap-4">
        {(["light", "dark"] as const).map((mode) => (
          <div
            key={`seg-${mode}`}
            className={`card-flat !p-4 flex-1 min-w-[280px] ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
          >
            <p className="text-caption text-content-tertiary font-mono mb-3">
              {mode}
            </p>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-caption text-content-tertiary font-mono mb-2">
                  variants
                </p>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-caption text-content-tertiary">
                      primary
                    </span>
                    <SegmentedControl
                      value={segPrimary}
                      onChange={setSegPrimary}
                      options={[
                        { value: "a", label: "Option A" },
                        { value: "b", label: "Option B" },
                      ]}
                      variant="primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-caption text-content-tertiary">
                      secondary
                    </span>
                    <SegmentedControl
                      value={segSecondary}
                      onChange={setSegSecondary}
                      options={[
                        { value: "a", label: "Option A" },
                        { value: "b", label: "Option B" },
                      ]}
                      variant="secondary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-caption text-content-tertiary">
                      outline
                    </span>
                    <SegmentedControl
                      value={segOutline}
                      onChange={setSegOutline}
                      options={[
                        { value: "a", label: "Option A" },
                        { value: "b", label: "Option B" },
                      ]}
                      variant="outline"
                    />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-caption text-content-tertiary font-mono mb-2">
                  sizes
                </p>
                <div className="flex flex-col items-start gap-2">
                  <div className="flex items-center gap-3">
                    <SegmentedControl
                      value={segSm}
                      onChange={setSegSm}
                      options={[
                        { value: "a", label: "Option A" },
                        { value: "b", label: "Option B" },
                      ]}
                      size="sm"
                    />
                    <span className="text-caption text-content-tertiary">
                      sm · 32px
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <SegmentedControl
                      value={segMd}
                      onChange={setSegMd}
                      options={[
                        { value: "a", label: "Option A" },
                        { value: "b", label: "Option B" },
                      ]}
                      size="md"
                    />
                    <span className="text-caption text-content-tertiary">
                      md · 40px
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <SegmentedControl
                      value={segLg}
                      onChange={setSegLg}
                      options={[
                        { value: "a", label: "Option A" },
                        { value: "b", label: "Option B" },
                      ]}
                      size="lg"
                    />
                    <span className="text-caption text-content-tertiary">
                      lg · 48px
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <SpecsPanel
        specs={{
          Variants: tabsSpecs.variants,
          Container: tabsSpecs.container,
          Nav: tabsSpecs.nav,
          Sizes: tabsSpecs.sizes,
          Overflow: tabsSpecs.overflow,
          "Segmented Variants": segmentedControlSpecs.variants,
          "Segmented Sizes": segmentedControlSpecs.sizes,
        }}
      />
    </ShowcaseSection>
  );
}

function SelectCard({
  mode,
  bare,
}: {
  mode: "light" | "dark";
  bare?: boolean;
}) {
  const [val, setVal] = useState("");
  const options = [
    { label: "Edit", value: "edit", icon: <Edit size={16} /> },
    { label: "Duplicate", value: "dup", icon: <Copy size={16} /> },
    { label: "Archive", value: "arch", icon: <Archive size={16} /> },
    {
      label: "Delete",
      value: "del",
      icon: <Trash2 size={16} />,
      variant: "danger" as const,
    },
  ];
  const content = (
    <Select
      options={options}
      value={val}
      onChange={setVal}
      placeholder="Choose action..."
    />
  );
  if (bare) return content;
  return (
    <div
      className={`card-flat !p-4 ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
    >
      <p className="text-caption text-content-tertiary font-mono mb-3">
        {mode} · select
      </p>
      {content}
    </div>
  );
}

function EmailSelectorCard({
  mode,
  bare,
}: {
  mode: "light" | "dark";
  bare?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState({
    vertical: "down" as "up" | "down",
    horizontal: "left" as "left" | "right",
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const openDropdown = () => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const popoverH = 200;
    setPopoverPos({
      vertical:
        window.innerHeight - rect.bottom < popoverH && rect.top > popoverH
          ? "up"
          : "down",
      horizontal: rect.right + 280 > window.innerWidth ? "right" : "left",
    });
    setOpen(true);
  };

  const content = (
    <div ref={ref} className="relative w-fit">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        className={`flex h-10 items-center justify-center gap-2 rounded-md px-6 py-2.5 text-body font-normal whitespace-nowrap border border-border-components text-content-primary transition-colors w-fit ${open ? "bg-surface-subtle" : "bg-transparent hover:bg-surface-subtle"}`}
      >
        <span className="leading-none">user@example.com</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-content-tertiary transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          className={`absolute z-50 w-fit min-w-[200px] left-0 ${popoverPos.vertical === "up" ? "bottom-full mb-1 animate-dropdown-up" : "top-full mt-1 animate-dropdown-down"}`}
        >
          <div className="rounded-xl border border-border-components bg-surface-primary p-4 shadow-card whitespace-nowrap">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex h-10 w-full items-center gap-2 rounded-md bg-surface-subtle px-2 text-body font-normal text-content-primary transition-colors"
            >
              <Avatar size="sm" name="U" />
              <span className="truncate text-body">user@example.com</span>
            </button>
            <span
              onClick={() => setOpen(false)}
              className="mt-4 inline-block cursor-pointer text-body font-normal text-content-primary/75 transition-colors hover:text-content-primary hover:underline active:text-content-primary/75 active:underline active:decoration-dotted"
            >
              Try a different email address
            </span>
          </div>
        </div>
      )}
    </div>
  );
  if (bare) return content;
  return (
    <div
      className={`card-flat !p-4 ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
    >
      <p className="text-caption text-content-tertiary font-mono mb-3">
        {mode} · email
      </p>
      {content}
    </div>
  );
}

function SelectShowcase() {
  return (
    <ShowcaseSection title="Select / Dropdown">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card-flat !p-4 light bg-surface-primary space-y-6">
          <p className="text-caption text-content-tertiary font-mono">light</p>
          <div>
            <p className="text-caption text-content-tertiary font-mono mb-2">
              select
            </p>
            <SelectCard mode="light" bare />
          </div>
          <div>
            <p className="text-caption text-content-tertiary font-mono mb-2">
              language
            </p>
            <LanguageSelector />
          </div>
          <div>
            <p className="text-caption text-content-tertiary font-mono mb-2">
              email
            </p>
            <EmailSelectorCard mode="light" bare />
          </div>
        </div>
        <div className="card-flat !p-4 dark bg-surface-primary space-y-6">
          <p className="text-caption text-content-tertiary font-mono">dark</p>
          <div>
            <p className="text-caption text-content-tertiary font-mono mb-2">
              select
            </p>
            <SelectCard mode="dark" bare />
          </div>
          <div>
            <p className="text-caption text-content-tertiary font-mono mb-2">
              language
            </p>
            <LanguageSelector />
          </div>
          <div>
            <p className="text-caption text-content-tertiary font-mono mb-2">
              email
            </p>
            <EmailSelectorCard mode="dark" bare />
          </div>
        </div>
      </div>

      <SpecsPanel
        specs={{
          "Select Trigger": selectSpecs.trigger,
          "Select Dropdown": selectSpecs.dropdown,
          "Select Option": selectSpecs.option,
          "Select Position": selectSpecs.position,
          "Email Selector (auth)": {
            trigger:
              "h-10 rounded-md px-6 py-2.5 w-fit text-body font-normal whitespace-nowrap border border-border-components bg-transparent hover:bg-surface-subtle transition-colors",
            dropdown:
              "rounded-xl border border-border-strong bg-surface-primary p-4 shadow-card w-fit min-w-[200px] whitespace-nowrap",
            avatar:
              "h-8 w-8 rounded-full bg-surface-subtle text-caption font-semibold",
          },
          "LanguageSelector Trigger": languageSelectorSpecs.trigger,
          "LanguageSelector Popover": languageSelectorSpecs.popover,
          "LanguageSelector Option": languageSelectorSpecs.option,
        }}
      />
    </ShowcaseSection>
  );
}

function CalendarShowcase() {
  const [dateLight, setDateLight] = useState<Date | undefined>(new Date());
  const [dateDark, setDateDark] = useState<Date | undefined>(new Date());
  return (
    <ShowcaseSection title="Calendar">
      <div className="flex flex-wrap gap-4">
        <div className="card-flat !p-4 flex-1 light bg-surface-primary">
          <p className="text-caption text-content-tertiary font-mono mb-3">
            light
          </p>
          <div className="flex justify-center">
            <Calendar value={dateLight} onChange={setDateLight} />
          </div>
        </div>
        <div className="card-flat !p-4 flex-1 dark bg-surface-primary">
          <p className="text-caption text-content-tertiary font-mono mb-3">
            dark
          </p>
          <div className="flex justify-center">
            <Calendar value={dateDark} onChange={setDateDark} />
          </div>
        </div>
      </div>

      <SpecsPanel
        specs={{
          Container: calendarSpecs.container,
          Navigation: calendarSpecs.navigation,
          Views: calendarSpecs.views,
          Day: calendarSpecs.day,
          Weekday: { shared: calendarSpecs.weekday },
        }}
      />
    </ShowcaseSection>
  );
}

function NavigationShowcase() {
  const [pageLight, setPageLight] = useState(3);
  const [pageDark, setPageDark] = useState(3);
  return (
    <ShowcaseSection title="Navigation">
      <p className="text-body font-semibold text-content-primary mb-2">
        Breadcrumbs
      </p>
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[280px] card-flat !p-4 light bg-surface-primary">
          <p className="text-caption text-content-tertiary font-mono mb-3">
            light
          </p>
          <Breadcrumbs
            items={[
              { label: "Home", href: "#" },
              { label: "Projects", href: "#" },
              { label: "Settings" },
            ]}
          />
        </div>
        <div className="flex-1 min-w-[280px] card-flat !p-4 dark bg-surface-primary">
          <p className="text-caption text-content-tertiary font-mono mb-3">
            dark
          </p>
          <Breadcrumbs
            items={[
              { label: "Home", href: "#" },
              { label: "Projects", href: "#" },
              { label: "Settings" },
            ]}
          />
        </div>
      </div>

      <p className="text-body font-semibold text-content-primary mb-2 mt-4">
        Pagination
      </p>
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[280px] card-flat !p-4 light bg-surface-primary">
          <p className="text-caption text-content-tertiary font-mono mb-3">
            light
          </p>
          <Pagination
            currentPage={pageLight}
            totalPages={12}
            onPageChange={setPageLight}
          />
        </div>
        <div className="flex-1 min-w-[280px] card-flat !p-4 dark bg-surface-primary">
          <p className="text-caption text-content-tertiary font-mono mb-3">
            dark
          </p>
          <Pagination
            currentPage={pageDark}
            totalPages={12}
            onPageChange={setPageDark}
          />
        </div>
      </div>

      <SpecsPanel
        specs={{
          "Breadcrumbs Link": breadcrumbsSpecs.link,
          "Breadcrumbs Separator": { shared: breadcrumbsSpecs.separator },
          "Breadcrumbs Home": { shared: breadcrumbsSpecs.home },
          "Breadcrumbs Collapse": { shared: breadcrumbsSpecs.collapse },
          "Pagination Page": paginationSpecs.page,
          "Pagination Arrows": paginationSpecs.arrows,
          "Pagination Dimensions": paginationSpecs.dimensions,
        }}
      />
    </ShowcaseSection>
  );
}

const toastVariants = [
  {
    icon: AlertTriangle,
    color: "text-error",
    title: "Sign in failed",
    desc: "Invalid credentials. Please try again.",
    variant: "error",
  },
  {
    icon: CircleCheck,
    color: "text-success",
    title: "Account created",
    desc: "Please check your email to verify your account.",
    variant: "success",
  },
  {
    icon: CircleAlert,
    color: "text-warning",
    title: "Too many attempts",
    desc: "Please wait before trying again.",
    variant: "warning",
  },
  {
    icon: Info,
    color: "text-info",
    title: "Session refreshed",
    desc: "Your session has been renewed.",
    variant: "info",
  },
] as const;

function ToastDemo() {
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const [exiting, setExiting] = useState<Record<string, boolean>>({});

  const show = (variant: string) => {
    setVisible((v) => ({ ...v, [variant]: true }));
    setExiting((e) => ({ ...e, [variant]: false }));
    setTimeout(() => dismiss(variant), 5000);
  };

  const dismiss = (variant: string) => {
    setExiting((e) => ({ ...e, [variant]: true }));
    setTimeout(() => {
      setVisible((v) => ({ ...v, [variant]: false }));
      setExiting((e) => ({ ...e, [variant]: false }));
    }, 300);
  };

  const hasVisible = toastVariants.some(({ variant }) => visible[variant]);

  return (
    <div>
      <p className="text-caption text-content-tertiary font-mono mb-2">
        toast variants — click to preview
      </p>
      <div className="flex flex-wrap gap-2">
        {toastVariants.map(({ variant }) => (
          <Button
            key={variant}
            variant="outline"
            size="md"
            fullWidth={false}
            onClick={() => show(variant)}
          >
            Test {variant}
          </Button>
        ))}
      </div>

      {hasVisible && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 max-w-[calc(100vw-2rem)]">
          {toastVariants.map(
            ({ icon: Icon, color, title, desc, variant }) =>
              visible[variant] && (
                <div
                  key={variant}
                  className={`group flex items-start gap-2 rounded-full border border-border-components bg-surface-primary px-6 py-4 ${exiting[variant] ? "animate-toast-out" : "animate-toast-in"}`}
                >
                  <Icon size={16} className={`mt-px shrink-0 ${color}`} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="whitespace-nowrap text-caption font-semibold leading-tight text-content-primary">
                      {title}
                    </p>
                    <p className="whitespace-nowrap text-caption leading-tight text-content-tertiary">
                      {desc}
                    </p>
                  </div>
                  <button
                    onClick={() => dismiss(variant)}
                    className="mt-px shrink-0 text-content-tertiary opacity-0 transition-all group-hover:opacity-100 hover:text-content-primary"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              ),
          )}
        </div>
      )}
    </div>
  );
}

function FullPageCard({ type }: { type: "error" | "success" }) {
  const [animKey, setAnimKey] = useState(0);
  const isError = type === "error";

  return (
    <div
      className="w-[280px] rounded-3xl border border-border-strong bg-surface-secondary shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden cursor-pointer"
      onMouseEnter={() => setAnimKey((k) => k + 1)}
    >
      <div className="flex flex-col gap-2 border-b border-border-strong bg-surface-primary p-6 min-h-[200px] justify-center">
        <div className="flex flex-col items-center gap-2">
          {isError ? (
            <CircleX
              key={`error-${animKey}`}
              size={48}
              className="icon-error text-[#8a1111]"
              strokeWidth={1.5}
            />
          ) : (
            <CircleCheck
              key={`success-${animKey}`}
              size={48}
              className="icon-success text-[#166534]"
              strokeWidth={1.5}
            />
          )}
          <p className="text-center text-body text-content-tertiary">
            {isError ? (
              <>
                Something went wrong!
                <br />
                Please try again.
              </>
            ) : (
              "Email verified!"
            )}
          </p>
          <Button variant="outline" size="md" fullWidth>
            {isError ? "Go to Sign In" : "Go to Dashboard"}
          </Button>
        </div>
      </div>
      <div className="h-14 w-full p-2" />
    </div>
  );
}

function FullPageIconsDemo() {
  return (
    <div>
      <p className="text-caption text-content-tertiary font-mono mb-2">
        full page — hover to preview
      </p>
      <div className="flex flex-wrap gap-4 items-start justify-center">
        <FullPageCard type="error" />
        <FullPageCard type="success" />
      </div>
    </div>
  );
}

function RateLimitDemo() {
  const [seconds, setSeconds] = useState(59);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((s) => (s <= 1 ? 59 : s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      <p className="text-caption text-content-tertiary font-mono mb-2">
        rate limit
      </p>
      <div role="alert" className="flex items-start gap-2">
        <AlertTriangle size={16} className="mt-1 shrink-0 text-error" />
        <div className="flex flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-caption leading-6 text-error">
            Too many attempts.
          </span>
          <CountdownTimer seconds={seconds} />
        </div>
      </div>
    </div>
  );
}

function FeedbackShowcase() {
  return (
    <ShowcaseSection title="Feedback / Alerts">
      <div className="flex flex-wrap gap-4">
        {(["light", "dark"] as const).map((mode) => (
          <div
            key={mode}
            className={`flex-1 min-w-[300px] card-flat !p-4 ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
          >
            <p className="text-caption text-content-tertiary font-mono mb-4">
              {mode}
            </p>
            <div className="space-y-5">
              <div>
                <p className="text-caption text-content-tertiary font-mono mb-2">
                  inline validation
                </p>
                <InlineError message="Enter a valid email address" />
              </div>

              <div>
                <p className="text-caption text-content-tertiary font-mono mb-2">
                  AlertBox — 4 variants
                </p>
                <div className="space-y-2">
                  <AlertBox variant="warning">
                    This action will make your account less secure.
                  </AlertBox>
                  <AlertBox variant="error">
                    Invalid verification code. Please try again.
                  </AlertBox>
                  <AlertBox variant="info">
                    Your email is managed by an external provider.
                  </AlertBox>
                  <AlertBox variant="success">
                    Your changes have been saved successfully.
                  </AlertBox>
                </div>
              </div>

              <RateLimitDemo />

              <ToastDemo />

              <FullPageIconsDemo />
            </div>
          </div>
        ))}
      </div>

      <SpecsPanel
        specs={{
          "Inline Validation (InlineError)": inlineErrorSpecs,
          AlertBox: alertBoxSpecs.variants,
          "AlertBox Layout": alertBoxSpecs.layout,
          "Rate Limit": {
            container: "flex items-start gap-2",
            icon: "AlertTriangle 16px text-error (mt-1) or Lock 16px for lockout",
            countdown:
              "CountdownTimer — digit boxes text-error/60, auto-restart at 0",
          },
          Toast: {
            container:
              "rounded-full border border-border-components bg-surface-primary px-6 py-4",
            icons:
              "error: AlertTriangle, success: CircleCheck, warning: CircleAlert, info: Info — 16px",
            title:
              "text-caption font-semibold leading-tight text-content-primary",
            description: "text-caption leading-tight text-content-tertiary",
            close: "X 16px — opacity-0 group-hover:opacity-100",
            animation:
              "animate-toast-in / animate-toast-out (300ms), auto-dismiss 5s",
          },
          "Full Page Card": {
            card: "rounded-3xl border border-border-strong bg-surface-secondary shadow-[0_8px_32px_rgba(0,0,0,0.04)]",
            content: "bg-surface-primary p-6 border-b border-border-strong",
            footer: "h-14 p-2 (auth-card narrow footer)",
            "error icon":
              "CircleX 48px text-[#8a1111] strokeWidth-1.5 icon-error animation",
            "success icon":
              "CircleCheck 48px text-[#166534] strokeWidth-1.5 icon-success animation",
            text: "text-body text-content-tertiary text-center",
            button:
              "h-10 w-full rounded-md border border-border-components bg-transparent text-h3 font-normal — outline style",
          },
        }}
      />
    </ShowcaseSection>
  );
}

function AccordionCard({ mode }: { mode: "light" | "dark" }) {
  return (
    <div
      className={`flex-1 min-w-[280px] card-flat !p-4 ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
    >
      <p className="text-caption text-content-tertiary font-mono mb-3">
        {mode}
      </p>
      <div className="space-y-4">
        <div>
          <p className="text-caption text-content-tertiary font-mono mb-2">
            Single
          </p>
          <SingleAccordion title="Click to expand">
            <p className="text-body text-content-tertiary">
              Expandable content panel. Used for specs, FAQs, and collapsible
              sections.
            </p>
          </SingleAccordion>
        </div>
        <div>
          <p className="text-caption text-content-tertiary font-mono mb-2">
            Multi (exclusive)
          </p>
          <Accordion
            items={[
              {
                title: "Section 1",
                children: (
                  <p className="text-body text-content-tertiary">
                    Content for section 1. Only one open at a time.
                  </p>
                ),
              },
              {
                title: "Section 2",
                children: (
                  <p className="text-body text-content-tertiary">
                    Content for section 2. Opening this closes section 1.
                  </p>
                ),
              },
              {
                title: "Section 3",
                children: (
                  <p className="text-body text-content-tertiary">
                    Content for section 3. Exclusive accordion behavior.
                  </p>
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function CopyFieldShowcase() {
  return (
    <ShowcaseSection title="CopyField">
      <div className="flex flex-wrap gap-4">
        <div className="card-flat !p-4 flex-1 min-w-[280px] light bg-surface-primary">
          <p className="text-caption text-content-tertiary font-mono mb-3">
            light
          </p>
          <CopyField value="JBSWY3DPEHPK3PXP" />
        </div>
        <div className="card-flat !p-4 flex-1 min-w-[280px] dark bg-surface-primary">
          <p className="text-caption text-content-tertiary font-mono mb-3">
            dark
          </p>
          <CopyField value="JBSWY3DPEHPK3PXP" />
        </div>
      </div>

      {/* Sizes */}
      <div>
        <p className="text-body font-semibold text-content-primary mb-2">
          Sizes
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <CopyField value="JBSWY3DPEHPK3PXP" />
            <span className="text-caption text-content-tertiary">
              md · 48px (default)
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <CopyField value="JBSWY3DPEHPK3PXP" size="sm" />
            <span className="text-caption text-content-tertiary">
              sm · 40px
            </span>
          </div>
        </div>
      </div>

      <SpecsPanel
        specs={{
          Container: { shared: copyFieldSpecs.container },
          Code: { shared: copyFieldSpecs.code },
          Sizes: copyFieldSpecs.sizes,
          "Copy Button": { shared: copyFieldSpecs.copyButton },
          Icon: { shared: copyFieldSpecs.icon },
        }}
      />
    </ShowcaseSection>
  );
}

function DigitInputShowcase() {
  const [code, setCode] = useState(Array(6).fill(""));
  return (
    <ShowcaseSection title="Digit Input">
      <div className="flex flex-wrap gap-4">
        <div className="card-flat !p-4 flex-1 min-w-[300px] light bg-surface-primary">
          <p className="text-caption text-content-tertiary font-mono mb-3">
            light
          </p>
          <MfaDigitInput
            value={code}
            onChange={setCode}
            idPrefix="demo-digit"
          />
        </div>
        <div className="card-flat !p-4 flex-1 min-w-[300px] dark bg-surface-primary">
          <p className="text-caption text-content-tertiary font-mono mb-3">
            dark
          </p>
          <MfaDigitInput
            value={Array(6).fill("")}
            onChange={() => {}}
            idPrefix="demo-digit-dark"
          />
        </div>
      </div>
      {/* Error state */}
      <div className="flex flex-wrap gap-4">
        {(["light", "dark"] as const).map((mode) => (
          <div
            key={mode}
            className={`flex-1 min-w-[300px] card-flat !p-4 ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
          >
            <p className="text-caption text-content-tertiary font-mono mb-3">
              {mode} — error state
            </p>
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <MfaDigitInput
                  value={["1", "2", "3", "4", "5", ""]}
                  onChange={() => {}}
                  error
                  idPrefix={`demo-error-${mode}`}
                />
                <InlineError message="Enter all 6 digits" />
              </div>
              <div className="flex flex-col gap-1.5">
                <MfaDigitInput
                  value={["7", "3", "8", "2", "9", "1"]}
                  onChange={() => {}}
                  error
                  idPrefix={`demo-error-full-${mode}`}
                />
                <InlineError message="Invalid code" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sizes — auto-switches based on container width */}
      <div>
        <p className="text-body font-semibold text-content-primary mb-2">
          Sizes
        </p>
        <p className="mb-3 text-caption text-content-tertiary sm:hidden">
          Both sizes appear identical on small screens — the component
          auto-switches to sm when its container is narrower than 348px. Resize
          to desktop to see the difference.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col items-center gap-1.5 sm:items-start sm:max-w-[360px]">
            <MfaDigitInput
              value={Array(6).fill("")}
              onChange={() => {}}
              idPrefix="size-md"
            />
            <span className="text-caption text-content-tertiary">
              md · 48×48px gap-3 (default — container ≥ 348px)
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5 sm:items-start sm:max-w-[280px]">
            <MfaDigitInput
              value={Array(6).fill("")}
              onChange={() => {}}
              idPrefix="size-sm"
            />
            <span className="text-caption text-content-tertiary">
              sm · 40×40px gap-2 (auto — container &lt; 348px)
            </span>
          </div>
        </div>
      </div>

      <SpecsPanel
        specs={{
          Container: mfaDigitInputSpecs.container,
          Digit: mfaDigitInputSpecs.digit,
          Behavior: mfaDigitInputSpecs.behavior,
        }}
      />
    </ShowcaseSection>
  );
}

function QrCodeCardShowcase() {
  return (
    <ShowcaseSection title="QR Code Card">
      <div className="flex flex-wrap gap-4">
        <div className="card-flat !p-4 flex-1 min-w-[300px] light bg-surface-primary">
          <p className="text-caption text-content-tertiary font-mono mb-3">
            light
          </p>
          <QrCodeCard />
        </div>
        <div className="card-flat !p-4 flex-1 min-w-[300px] dark bg-surface-primary">
          <p className="text-caption text-content-tertiary font-mono mb-3">
            dark
          </p>
          <QrCodeCard />
        </div>
      </div>
      <SpecsPanel
        specs={{
          Container: qrCodeCardSpecs,
        }}
      />
    </ShowcaseSection>
  );
}

function AccordionShowcase() {
  return (
    <ShowcaseSection title="Accordion">
      <div className="flex flex-wrap gap-4">
        <AccordionCard mode="light" />
        <AccordionCard mode="dark" />
      </div>

      <SpecsPanel
        specs={{
          Trigger: accordionSpecs.trigger,
          Container: accordionSpecs.container,
          Icon: { shared: accordionSpecs.icon },
          Content: { shared: accordionSpecs.content },
        }}
      />
    </ShowcaseSection>
  );
}

const speedoSizes = {
  sm: {
    w: 180,
    h: 145,
    cx: 90,
    cy: 90,
    R: 55,
    progressW: 12,
    trackW: 10,
    dashR: 38,
    needleLen: 34,
    needleBase: 4,
    hub: 6,
    hubInner: 2,
    fontSize: 12,
    labelOffset: 16,
    textClass: "text-body",
  },
  md: {
    w: 230,
    h: 185,
    cx: 115,
    cy: 120,
    R: 72,
    progressW: 16,
    trackW: 14,
    dashR: 50,
    needleLen: 48,
    needleBase: 5,
    hub: 8,
    hubInner: 3,
    fontSize: 12,
    labelOffset: 20,
    textClass: "text-h3",
  },
  lg: {
    w: 260,
    h: 200,
    cx: 130,
    cy: 130,
    R: 85,
    progressW: 18,
    trackW: 16,
    dashR: 60,
    needleLen: 55,
    needleBase: 6,
    hub: 10,
    hubInner: 4,
    fontSize: 12,
    labelOffset: 22,
    textClass: "text-h1",
  },
};

function SpeedometerChart({
  value = 78,
  size = "lg",
}: {
  value?: number;
  size?: "sm" | "md" | "lg";
}) {
  const s = speedoSizes[size];
  /*
   * Figma Speedometer analysis from the screenshot:
   * - Arc goes COUNTERCLOCKWISE from bottom-right (5 o'clock)
   *   through left side, over top, ending at bottom-right area
   * - 0% starts at bottom-left (~7 o'clock = 210° in math/SVG-inverted)
   * - 100% ends at bottom-right (~330° = -30° in math)
   * - Progress (black thick) fills from 0% upward
   * - Track (gray thin) shows the unfilled remainder
   * - Needle is a tapered triangle pointing to the value
   *
   * In SVG (0°=right, Y-down, clockwise positive):
   * - bottom-left start = 150° (7 o'clock)
   * - bottom-right end = 30° (5 o'clock)
   * - Arc goes counterclockwise (sweep-flag=0) from 150° to 30°
   *   OR clockwise (sweep-flag=1) from 150° through 180°, 270°, 360°, to 30°
   *   = 240° sweep clockwise
   */
  const {
    w,
    h,
    cx,
    cy,
    R,
    progressW,
    trackW,
    dashR,
    needleLen,
    needleBase,
    hub,
    hubInner,
    fontSize,
    labelOffset,
    textClass,
  } = s;

  const toRad = (d: number) => (d * Math.PI) / 180;
  const ptAt = (r: number, deg: number) => ({
    x: cx + r * Math.cos(toRad(deg)),
    y: cy + r * Math.sin(toRad(deg)),
  });

  // Start at 150° (bottom-left, 7 o'clock in SVG coords)
  // End at 30° (bottom-right, 5 o'clock)
  // Total sweep going clockwise through top = 240°
  const arcStart = 135;
  const arcEnd = 45;
  const totalSweep = 270;

  const makeArc = (
    r: number,
    fromDeg: number,
    toDeg: number,
    sweepLarger180: boolean,
  ) => {
    const s = ptAt(r, fromDeg);
    const e = ptAt(r, toDeg);
    const large = sweepLarger180 ? 1 : 0;
    return `M${s.x},${s.y} A${r},${r} 0 ${large} 1 ${e.x},${e.y}`;
  };

  // Progress angle: from arcStart clockwise by value% of totalSweep
  const progressSweep = (value / 100) * totalSweep;
  const progressEndDeg = arcStart + progressSweep;
  // Normalize to 0-360
  const normalizedEnd = progressEndDeg % 360;

  // Needle direction = progressEndDeg
  const needleTip = ptAt(needleLen, normalizedEnd);
  const perpDeg = normalizedEnd + 90;
  const bL = ptAt(needleBase, perpDeg);
  const bR = ptAt(needleBase, perpDeg + 180);

  return (
    <div className="flex flex-col items-center">
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {/* Track — full arc gray */}
        <path
          d={makeArc(R, arcStart, arcEnd, true)}
          fill="none"
          strokeWidth={trackW}
          strokeLinecap="round"
          className="stroke-surface-tertiary"
        />
        {/* Progress — partial arc dark */}
        <path
          d={makeArc(R, arcStart, normalizedEnd, progressSweep > 180)}
          fill="none"
          strokeWidth={progressW}
          strokeLinecap="round"
          className="stroke-surface-inverse"
        />
        {/* Inner dashed arc */}
        <path
          d={makeArc(dashR, arcStart, arcEnd, true)}
          fill="none"
          strokeWidth="1"
          strokeDasharray="4 3"
          className="stroke-content-primary/50"
        />
        {/* Needle — tapered triangle */}
        <polygon
          points={`${needleTip.x},${needleTip.y} ${bL.x},${bL.y} ${bR.x},${bR.y}`}
          className="fill-surface-inverse"
        />
        {/* Center hub */}
        <circle cx={cx} cy={cy} r={hub} className="fill-surface-inverse" />
        <circle cx={cx} cy={cy} r={hubInner} className="fill-surface-primary" />
        {/* Labels */}
        <text
          x={ptAt(dashR - labelOffset, arcStart).x}
          y={ptAt(dashR - labelOffset, arcStart).y + 5}
          fontSize={fontSize}
          textAnchor="middle"
          className="fill-content-primary/50"
        >
          00
        </text>
        <text
          x={ptAt(dashR - labelOffset, arcEnd).x}
          y={ptAt(dashR - labelOffset, arcEnd).y + 5}
          fontSize={fontSize}
          textAnchor="middle"
          className="fill-content-primary/50"
        >
          100
        </text>
      </svg>
      <p
        className={`${textClass} font-semibold leading-none text-content-primary -mt-3`}
      >
        {value}%
      </p>
    </div>
  );
}

function getDoughnutMockData(isDark: boolean) {
  return [
    { name: "USER", value: 150, fill: "#a0bce8" },
    { name: "ADMIN", value: 75, fill: "#6be6d3" },
    { name: "SUPERADMIN", value: 25, fill: isDark ? "#f5f5f5" : "#1c1c1c" },
  ];
}

function DoughnutChartMock({ isDark = false }: { isDark?: boolean }) {
  const doughnutMockData = getDoughnutMockData(isDark);
  return (
    <div className="rounded-xl border border-border-strong bg-surface-primary p-6">
      <div className="mb-4">
        <h3 className="text-body font-semibold text-content-primary">
          Users by Role
        </h3>
      </div>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="h-[120px] w-[120px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={doughnutMockData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="100%"
                paddingAngle={2}
                strokeWidth={0}
              >
                {doughnutMockData.map((e) => (
                  <Cell key={e.name} fill={e.fill} />
                ))}
              </Pie>
              <RechartsTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0];
                  return (
                    <div className="rounded-lg border border-border-components bg-surface-primary px-4 py-3 shadow-card whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 shrink-0 rounded-sm"
                          style={{
                            background: item.payload?.fill || item.color,
                          }}
                        />
                        <span className="text-caption font-normal text-content-primary">
                          {item.name}: {item.value}
                        </span>
                      </div>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-3">
          {doughnutMockData.map(({ name, value, fill }) => (
            <div key={name} className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: fill }}
              />
              <span className="text-caption text-content-primary">{name}</span>
              <span className="text-caption text-content-tertiary">
                {value} ({((value / 250) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ChartsShowcase() {
  return (
    <ShowcaseSection title="Charts">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(["light", "dark"] as const).map((mode) => (
          <div
            key={mode}
            className={`card-flat !p-4 ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
          >
            <p className="text-caption text-content-tertiary font-mono mb-3">
              {mode}
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-caption text-content-tertiary font-mono mb-2">
                  Line Chart
                </p>
                <TotalUsersChart forceDark={mode === "dark"} />
              </div>
              <div>
                <p className="text-caption text-content-tertiary font-mono mb-2">
                  Speedometer
                </p>
                <div className="rounded-xl border border-border-strong bg-surface-primary p-6">
                  <div className="mb-2">
                    <h3 className="text-body font-semibold text-content-primary">
                      Performance
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-end justify-center gap-6">
                    <div className="flex flex-col items-center gap-1">
                      <SpeedometerChart value={78} size="lg" />
                      <span className="text-caption text-content-tertiary">
                        lg
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <SpeedometerChart value={65} size="md" />
                      <span className="text-caption text-content-tertiary">
                        md
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <SpeedometerChart value={42} size="sm" />
                      <span className="text-caption text-content-tertiary">
                        sm
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-caption text-content-tertiary font-mono mb-2">
                  Doughnut Chart
                </p>
                <DoughnutChartMock isDark={mode === "dark"} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <SpecsPanel
        specs={{
          "ChartCard Container": {
            shared:
              "rounded-3xl border border-border-strong bg-surface-secondary p-6",
            title: "text-body font-semibold text-content-primary",
          },
          Legend: {
            dot: "h-2 w-2 rounded-full",
            label: "text-caption text-content-tertiary",
            separator: "text-content-primary/20",
          },
          "Chart Colors": {
            primary: "#1c1c1c (surface-inverse) — main data, SUPERADMIN",
            secondary: "#a0bce8 — comparison line, USER role",
            tertiary: "#6be6d3 — ADMIN role",
          },
          "Recharts Config": {
            rendering: "SVG/HTML — same engine as all UI components, no canvas",
            tooltip:
              "Custom HTML content via <Tooltip content={...} /> — native DOM positioning",
            "tooltip style":
              "rounded-lg border-border-components bg-surface-primary px-4 py-3 shadow-card (no diamond — Recharts controls position)",
            "color dots": "h-2 w-2 rounded-sm with item.color",
            grid: "border-strong color, no x-grid, strokeDasharray 3 3",
            ticks: "text-caption (12px) via SVG, system font inherited",
            "dark mode":
              "auto via useTheme() — colors.line, colors.ticks, colors.grid adapt",
            "SUPERADMIN color":
              "isDark ? #f5f5f5 : #1c1c1c (surface-inverse adaptive)",
            activeDot: "r: 4, strokeWidth: 0, instant (no grow animation)",
          },
          Speedometer: {
            arc: "270° sweep (135° to 45°), strokeLinecap round",
            progress: "stroke-surface-inverse (thicker than track)",
            track: "stroke-surface-tertiary",
            needle: "polygon triangle fill-surface-inverse",
            hub: "fill-surface-inverse + fill-surface-primary center",
            labels: "text-caption (12px) — 00 / 100 inside dashed circle",
            percentage:
              "sm: text-body (14px), md: text-h3 (16px), lg: text-h1 (24px)",
            sizes: "sm (180px), md (230px), lg (260px)",
          },
        }}
      />
    </ShowcaseSection>
  );
}

/* ===== Exports ===== */

export function AtomShowcase() {
  return (
    <div className="space-y-6">
      <ButtonShowcase />
      <InputShowcase />
      <CopyFieldShowcase />
      <DigitInputShowcase />
      <QrCodeCardShowcase />
      <RecoveryCodesGridShowcase />
      <BadgeShowcase />
      <SpinnerShowcase />
      <AvatarShowcase />
      <ToggleShowcase />
      <CheckboxShowcase />
      <TooltipShowcase />
      <DividerShowcase />
      <SliderShowcase />
      <FormFieldShowcase />
      <EmptyStateShowcase />
      <AccordionShowcase />
      <CardShowcase />
    </div>
  );
}

function CardShowcase() {
  return (
    <ShowcaseSection title="Card">
      <div className="flex flex-wrap gap-4">
        {/* Light */}
        <div className="flex-1 min-w-[280px] card-flat !p-4 light bg-surface-primary">
          <p className="text-caption text-content-tertiary font-mono mb-3">
            light
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-caption text-content-tertiary font-mono mb-2">
                container
              </p>
              <div className="card-container">
                <h3 className="text-body font-semibold text-content-primary">
                  Card Container
                </h3>
              </div>
            </div>
            <div>
              <p className="text-caption text-content-tertiary font-mono mb-2">
                container-flat
              </p>
              <div className="card-container-flat">
                <h3 className="text-body font-semibold text-content-primary">
                  Card Container Flat
                </h3>
              </div>
            </div>
            <div>
              <p className="text-caption text-content-tertiary font-mono mb-2">
                inner
              </p>
              <div className="card">
                <h3 className="text-body font-semibold text-content-primary">
                  Card Inner
                </h3>
              </div>
            </div>
            <div>
              <p className="text-caption text-content-tertiary font-mono mb-2">
                inner-flat
              </p>
              <div className="card-flat">
                <h3 className="text-body font-semibold text-content-primary">
                  Card Flat
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Dark */}
        <div
          className="flex-1 min-w-[280px] card-flat !p-4 dark bg-surface-primary"
          style={{ color: "rgb(var(--content-primary))" }}
        >
          <p className="text-caption text-content-tertiary font-mono mb-3">
            dark
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-caption text-content-tertiary font-mono mb-2">
                container
              </p>
              <div className="card-container">
                <h3 className="text-body font-semibold text-content-primary">
                  Card Container
                </h3>
              </div>
            </div>
            <div>
              <p className="text-caption text-content-tertiary font-mono mb-2">
                container-flat
              </p>
              <div className="card-container-flat">
                <h3 className="text-body font-semibold text-content-primary">
                  Card Container Flat
                </h3>
              </div>
            </div>
            <div>
              <p className="text-caption text-content-tertiary font-mono mb-2">
                inner
              </p>
              <div className="card">
                <h3 className="text-body font-semibold text-content-primary">
                  Card Inner
                </h3>
              </div>
            </div>
            <div>
              <p className="text-caption text-content-tertiary font-mono mb-2">
                inner-flat
              </p>
              <div className="card-flat">
                <h3 className="text-body font-semibold text-content-primary">
                  Card Flat
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SpecsPanel
        specs={{
          "Container (card-container)": {
            background: "bg-surface-primary (#ffffff light / #1a1a1a dark)",
            border: "1px border-border-strong rgba(0,0,0,0.08)",
            shadow: "0 8px 32px rgba(0,0,0,0.04)",
            radius: "24px (rounded-3xl)",
            padding: "24px",
            usage: "Auth cards, modals, main panels, dropdowns",
          },
          "Inner (card)": {
            background: "bg-surface-primary (#ffffff light / #1a1a1a dark)",
            border: "1px border-border-strong rgba(0,0,0,0.08)",
            shadow: "0 8px 32px rgba(0,0,0,0.04)",
            radius: "12px (rounded-xl)",
            padding: "24px",
            usage:
              "Content sections, chart cards, showcase items, settings panels",
          },
          "Container Flat (card-container-flat)": {
            background: "bg-surface-primary",
            border: "1px border-border-strong",
            shadow: "none",
            radius: "24px (rounded-3xl)",
            padding: "24px",
            usage: "Lightweight main panels, page sections",
          },
          "Inner Flat (card-flat)": {
            background: "bg-surface-primary",
            border: "1px border-border-strong",
            shadow: "none",
            radius: "12px (rounded-xl)",
            padding: "24px",
            usage: "Nav tabs, filters, catalog, lightweight sections",
          },
        }}
      />
    </ShowcaseSection>
  );
}

function RecoveryCodesGridShowcase() {
  const demoCodes = [
    "a1b2-c3d4-e5f6",
    "g7h8-i9j0-k1l2",
    "m3n4-o5p6-q7r8",
    "s9t0-u1v2-w3x4",
    "y5z6-a7b8-c9d0",
    "e1f2-g3h4-i5j6",
    "k7l8-m9n0-o1p2",
    "q3r4-s5t6-u7v8",
    "w9x0-y1z2-a3b4",
    "c5d6-e7f8-g9h0",
  ];

  return (
    <ShowcaseSection title="Recovery Codes Grid">
      <div className="flex flex-wrap gap-4">
        <div className="card-flat !p-4 flex-1 min-w-[300px] light bg-surface-primary">
          <p className="text-caption text-content-tertiary font-mono mb-3">
            light
          </p>
          <RecoveryCodesGrid codes={demoCodes} />
        </div>
        <div className="card-flat !p-4 flex-1 min-w-[300px] dark bg-surface-primary">
          <p className="text-caption text-content-tertiary font-mono mb-3">
            dark
          </p>
          <RecoveryCodesGrid codes={demoCodes} />
        </div>
      </div>

      <SpecsPanel
        specs={{
          Container: { shared: recoveryCodesGridSpecs.container },
          Grid: { shared: recoveryCodesGridSpecs.grid },
          Code: { shared: recoveryCodesGridSpecs.code },
        }}
      />
    </ShowcaseSection>
  );
}

export function MoleculeShowcase() {
  return (
    <div className="space-y-6">
      <SelectShowcase />
      <TabsShowcase />
      <NavigationShowcase />
      <DataTableShowcase />
      <FeedbackShowcase />
      <ChartsShowcase />
      <CalendarShowcase />
      <ModalShowcase />
      <SidebarShowcase />
    </div>
  );
}

/* ===== New Showcase Sections ===== */

function FormFieldShowcase() {
  return (
    <ShowcaseSection title="FormField">
      <div className="flex flex-wrap gap-4">
        {(["light", "dark"] as const).map((mode) => (
          <div
            key={mode}
            className={`card-flat !p-4 flex-1 min-w-[280px] ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
          >
            <p className="text-caption text-content-tertiary font-mono mb-3">
              {mode}
            </p>
            <div className="flex flex-col gap-4">
              <FormField label="With Input" htmlFor="demo-input">
                <Input id="demo-input" placeholder="Type here..." />
              </FormField>
              <FormField label="With EmailSelector">
                <EmailSelector
                  email="user@example.com"
                  onChangeEmail={() => {}}
                />
              </FormField>
              <FormField
                label="Required field"
                htmlFor="demo-required"
                required
              >
                <Input id="demo-required" placeholder="Required..." />
              </FormField>
              <FormField
                label="With error"
                htmlFor="demo-error"
                error="This field is required"
              >
                <Input id="demo-error" placeholder="..." hasError />
              </FormField>
            </div>
          </div>
        ))}
      </div>
      <SpecsPanel specs={{ FormField: formFieldSpecs }} />
    </ShowcaseSection>
  );
}

function EmptyStateShowcase() {
  return (
    <ShowcaseSection title="EmptyState">
      <div className="flex flex-wrap gap-4">
        {(["light", "dark"] as const).map((mode) => (
          <div
            key={mode}
            className={`card-flat !p-4 flex-1 min-w-[280px] ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
          >
            <p className="text-caption text-content-tertiary font-mono mb-3">
              {mode}
            </p>
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-caption text-content-tertiary font-mono mb-2">
                  default
                </p>
                <div className="rounded-lg border border-border-strong">
                  <EmptyState
                    title="No users found"
                    description="Try adjusting your search or filters."
                  />
                </div>
              </div>
              <div>
                <p className="text-caption text-content-tertiary font-mono mb-2">
                  with action
                </p>
                <div className="rounded-lg border border-border-strong">
                  <EmptyState
                    title="No projects yet"
                    description="Create your first project to get started."
                    action={
                      <Button variant="primary" size="sm" fullWidth={false}>
                        Create project
                      </Button>
                    }
                  />
                </div>
              </div>
              <div>
                <p className="text-caption text-content-tertiary font-mono mb-2">
                  custom icon
                </p>
                <div className="rounded-lg border border-border-strong">
                  <EmptyState
                    icon={<Search size={48} />}
                    title="No results"
                    description="No items match your search query."
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <SpecsPanel specs={{ EmptyState: emptyStateSpecs }} />
    </ShowcaseSection>
  );
}

function ModalShowcase() {
  const [primaryOpen, setPrimaryOpen] = useState(false);
  const [dangerOpen, setDangerOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  return (
    <ShowcaseSection title="Modal">
      <div className="flex flex-wrap gap-4">
        {(["light", "dark"] as const).map((mode) => (
          <div
            key={mode}
            className={`flex-1 min-w-[300px] card-flat !p-4 ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
          >
            <p className="text-caption text-content-tertiary font-mono mb-4">
              {mode}
            </p>
            <p className="text-caption text-content-tertiary font-mono mb-2">
              variants + sizes — click to preview
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="md"
                variant="outline"
                onClick={() => setPrimaryOpen(true)}
              >
                Confirm (sm)
              </Button>
              <Button
                size="md"
                variant="outline"
                onClick={() => setDangerOpen(true)}
              >
                Danger (sm)
              </Button>
              <Button
                size="md"
                variant="outline"
                onClick={() => setFormOpen(true)}
              >
                Form (md)
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={primaryOpen}
        onClose={() => setPrimaryOpen(false)}
        onConfirm={() => setPrimaryOpen(false)}
        title="Confirm action"
        description="Are you sure you want to proceed? This action can be undone."
        variant="primary"
      />
      <ConfirmModal
        open={dangerOpen}
        onClose={() => setDangerOpen(false)}
        onConfirm={() => setDangerOpen(false)}
        title="Delete item"
        description="This action cannot be undone. All associated data will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
      />
      <ConfirmModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onConfirm={() => setFormOpen(false)}
        title="Edit Profile"
        description="Update your information."
        confirmLabel="Save"
        size="md"
      >
        <div className="mt-4 space-y-4">
          <Input label="First Name" name="demo-first" placeholder="John" />
          <Input label="Last Name" name="demo-last" placeholder="Doe" />
        </div>
      </ConfirmModal>

      <SpecsPanel specs={confirmModalSpecs} />
    </ShowcaseSection>
  );
}

function SidebarShowcase() {
  const [activeItem, setActiveItem] = useState("#dashboard");

  const demoSections: SidebarSection[] = [
    {
      label: "Dashboards",
      items: [
        {
          href: "#dashboard",
          label: "Dashboard",
          icon: BarChart3,
          active: activeItem === "#dashboard",
        },
        {
          href: "#profile",
          label: "Profile",
          icon: Info,
          active: activeItem === "#profile",
        },
        {
          href: "#admin",
          label: "Admin",
          icon: Settings,
          children: [
            {
              href: "#audit",
              label: "Audit Logs",
              icon: Archive,
              active: activeItem === "#audit",
            },
            {
              href: "#permissions",
              label: "Permissions",
              icon: Copy,
              active: activeItem === "#permissions",
            },
            {
              href: "#design",
              label: "Design System",
              icon: Edit,
              active: activeItem === "#design",
            },
          ],
        },
      ],
    },
    {
      label: "Account",
      items: [
        {
          href: "#settings",
          label: "Settings",
          icon: Settings,
          active: activeItem === "#settings",
        },
        {
          href: "#docs",
          label: "Documentation",
          icon: Archive,
          active: activeItem === "#docs",
        },
      ],
    },
  ];

  return (
    <ShowcaseSection title="Sidebar">
      <div className="flex flex-wrap gap-4">
        {(["light", "dark"] as const).map((mode) => (
          <div
            key={mode}
            className={`card-flat !p-4 flex-1 min-w-[280px] ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
          >
            <p className="text-caption text-content-tertiary font-mono mb-3">
              {mode}
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              {/* Collapsed */}
              <div className="flex flex-col items-center sm:items-start">
                <p className="text-caption text-content-tertiary font-mono mb-2">
                  collapsed (68px)
                </p>
                <div className="w-[68px] rounded-r-xl border border-border-strong bg-surface-primary shadow-card">
                  <SidebarNav
                    sections={demoSections}
                    collapsed
                    onNavigate={(href, e) => {
                      e.preventDefault();
                      setActiveItem(href);
                    }}
                  />
                </div>
              </div>
              {/* Expanded */}
              <div className="flex flex-col items-center sm:items-start">
                <p className="text-caption text-content-tertiary font-mono mb-2">
                  expanded (300px)
                </p>
                <div className="w-[300px] max-w-full rounded-r-xl border border-border-strong bg-surface-primary shadow-card">
                  <SidebarNav
                    sections={demoSections}
                    onNavigate={(href, e) => {
                      e.preventDefault();
                      setActiveItem(href);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <SpecsPanel
        specs={{
          Container: sidebarNavSpecs.container,
          NavItem: sidebarNavSpecs.item,
          NavSection: sidebarNavSpecs.section,
        }}
      />
    </ShowcaseSection>
  );
}

/* ===== Organism Showcases ===== */

type SampleRow = { id: string; name: string; role: string; status: string };

const sampleData: SampleRow[] = [
  { id: "1", name: "Alice Brown", role: "Admin", status: "Active" },
  { id: "2", name: "Bob Wilson", role: "User", status: "Active" },
  { id: "3", name: "Carol Davis", role: "Admin", status: "Locked" },
];

const sampleColumns: ColumnDef<SampleRow>[] = [
  { key: "name", label: "Name", render: (row) => row.name },
  {
    key: "role",
    label: "Role",
    render: (row) => (
      <Badge variant={row.role === "Admin" ? "info" : "default"}>
        {row.role}
      </Badge>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (row) => (
      <Badge variant={row.status === "Active" ? "success" : "error"}>
        {row.status}
      </Badge>
    ),
  },
];

function DataTableShowcase() {
  return (
    <ShowcaseSection title="DataTable">
      <div className="flex flex-wrap gap-4">
        {(["light", "dark"] as const).map((mode) => (
          <div
            key={mode}
            className={`flex-1 min-w-[300px] card-flat !p-4 ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
          >
            <p className="text-caption text-content-tertiary font-mono mb-3">
              {mode}
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-caption text-content-tertiary font-mono mb-2">
                  with data
                </p>
                <DataTable
                  data={sampleData}
                  columns={sampleColumns}
                  keyExtractor={(row) => row.id}
                />
              </div>
              <div>
                <p className="text-caption text-content-tertiary font-mono mb-2">
                  loading
                </p>
                <DataTable
                  data={[]}
                  columns={sampleColumns}
                  keyExtractor={(row) => row.id}
                  loading
                  loadingRows={3}
                />
              </div>
              <div>
                <p className="text-caption text-content-tertiary font-mono mb-2">
                  empty
                </p>
                <DataTable
                  data={[]}
                  columns={sampleColumns}
                  keyExtractor={(row) => row.id}
                  emptyMessage="No users match your filters."
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </ShowcaseSection>
  );
}
