"use client";

import { useState, useRef, useEffect } from "react";
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
  ChevronRight,
  ArrowLeft,
  Eye,
  AlertTriangle,
  CircleX,
  CircleCheck,
  CircleAlert,
  Info,
  X,
} from "lucide-react";
import CountdownTimer from "@/components/ui/CountdownTimer";
import TotalUsersChart from "@/components/dashboard/TotalUsersChart";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, ChartTooltip);
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
import Spinner from "@/components/ui/Spinner";
import InfinitySpinner from "@/components/ui/InfinitySpinner";
import RingSpinner from "@/components/ui/RingSpinner";
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

import Breadcrumbs, { breadcrumbsSpecs } from "@/components/ui/Breadcrumbs";
import LanguageSelector, {
  languageSelectorSpecs,
} from "@/components/ui/LanguageSelector";
import DataTable, { type ColumnDef } from "@/components/ui/DataTable";
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
      <h3 className="text-h3 text-content-primary">{title}</h3>
      {children}
    </div>
  );
}

const thClass =
  "px-4 py-3 text-center text-caption font-semibold uppercase tracking-wider";

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
      className="shrink-0 p-1 rounded text-content-primary/50 hover:text-content-primary transition-colors"
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
            <p className="text-caption font-semibold uppercase tracking-wider text-content-primary/50 mb-2">
              {section}
            </p>
            <div className="space-y-1.5">
              {Object.entries(entries).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-caption font-normal text-content-secondary w-20 shrink-0">
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
    "bg-surface-inverse text-content-inverse border border-border-strong opacity-90",
  secondary:
    "bg-surface-subtle text-content-secondary border border-border-strong",
  outline: "bg-surface-subtle text-content-primary border border-border-strong",
  danger: "bg-error-bg text-error border border-error-border",
};

const baseButtonClass =
  "inline-flex items-center justify-center gap-2 font-normal rounded-md px-6 py-2.5 text-body h-10";

function ButtonStateTable({ mode }: { mode: "light" | "dark" }) {
  const variants = ["primary", "secondary", "outline", "danger"] as const;
  const tdClass = "px-4 py-3 text-center";

  return (
    <div
      className={`overflow-x-auto rounded-xl border border-border-strong ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
    >
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-strong bg-surface-secondary">
            <th className={`${thClass} text-left text-content-primary/50 w-24`}>
              <span className="font-mono font-normal lowercase">{mode}</span>
            </th>
            {variants.map((v) => (
              <th key={v} className={`${thClass} text-content-primary/50`}>
                {v}
              </th>
            ))}
            <th className={`${thClass} text-content-primary/50`}>CIRCLE</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border-strong">
            <td className="px-4 py-3 text-body font-normal text-content-primary">
              Normal
            </td>
            {variants.map((v) => (
              <td key={v} className={tdClass}>
                <Button variant={v} fullWidth={false}>
                  Button
                </Button>
              </td>
            ))}
            <td className={tdClass}>
              <div className="flex justify-center">
                <button className="w-9 h-9 rounded-full flex items-center justify-center text-body font-normal bg-surface-inverse text-content-inverse transition-colors hover:opacity-90">
                  15
                </button>
              </div>
            </td>
          </tr>
          <tr className="border-b border-border-strong">
            <td className="px-4 py-3 text-body font-normal text-content-primary">
              Hover
            </td>
            {variants.map((v) => (
              <td key={v} className={tdClass}>
                <button className={`${baseButtonClass} ${hoverClasses[v]}`}>
                  Button
                </button>
              </td>
            ))}
            <td className={tdClass}>
              <div className="flex justify-center">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-body font-normal bg-surface-inverse text-content-inverse opacity-90">
                  15
                </div>
              </div>
            </td>
          </tr>
          <tr className="border-b border-border-strong">
            <td className="px-4 py-3 text-body font-normal text-content-primary">
              Disabled
            </td>
            {variants.map((v) => (
              <td key={v} className={tdClass}>
                <Button variant={v} fullWidth={false} disabled>
                  Button
                </Button>
              </td>
            ))}
            <td className={tdClass}>
              <div className="flex justify-center">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-body font-normal bg-surface-inverse text-content-inverse opacity-50 pointer-events-none">
                  15
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td className="px-4 py-3 text-body font-normal text-content-primary">
              Loading
            </td>
            {variants.map((v) => (
              <td key={v} className={tdClass}>
                <Button variant={v} fullWidth={false} loading>
                  Button
                </Button>
              </td>
            ))}
            <td className={tdClass}></td>
          </tr>
        </tbody>
      </table>
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
        <p className="text-body font-normal text-content-primary mb-2">Sizes</p>
        <div className="flex flex-wrap items-end justify-center sm:justify-start gap-4">
          <div className="flex flex-col items-center gap-1.5">
            <Button variant="primary" size="lg" fullWidth={false}>
              Button
            </Button>
            <span className="text-caption text-content-primary/50">
              lg · 48px
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Button variant="primary" size="md" fullWidth={false}>
              Button
            </Button>
            <span className="text-caption text-content-primary/50">
              md · 40px (default)
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Button variant="primary" size="sm" fullWidth={false}>
              Button
            </Button>
            <span className="text-caption text-content-primary/50">
              sm · 32px
            </span>
          </div>
        </div>
      </div>

      {/* Link Buttons */}
      <p className="text-body font-normal text-content-primary mb-2">
        Link Buttons
      </p>
      {(["light", "dark"] as const).map((mode) => (
        <div
          key={`link-${mode}`}
          className={`overflow-x-auto rounded-xl border border-border-strong ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
        >
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-border-strong bg-surface-secondary">
                <th
                  className={`${thClass} text-left text-content-primary/50`}
                  style={{ width: "15%" }}
                >
                  <span className="font-mono font-normal lowercase">
                    {mode}
                  </span>
                </th>
                <th className={`${thClass} text-content-primary/50`}>SIMPLE</th>
                <th className={`${thClass} text-content-primary/50`}>
                  UNDERLINE
                </th>
                <th className={`${thClass} text-content-primary/50`}>
                  UNDERLINE + ICON
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border-strong">
                <td className="px-4 py-3 text-body font-normal text-content-primary">
                  Normal
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    className={`${linkSpecs.base} ${linkSpecs.variants.simple}`}
                  >
                    Link
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    className={`${linkSpecs.base} ${linkSpecs.variants.underline}`}
                  >
                    Link
                  </button>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    className={`inline-flex items-center justify-center gap-1 w-full ${linkSpecs.base} ${linkSpecs.variants.underline}`}
                  >
                    <ArrowLeft size={14} />
                    Link
                  </button>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-body font-normal text-content-primary">
                  Hover
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-body font-normal leading-[21px] text-content-primary">
                    Link
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-body font-normal leading-[21px] text-content-primary underline">
                    Link
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center justify-center gap-1 w-full text-body font-normal leading-[21px] text-content-primary underline">
                    <ArrowLeft size={14} />
                    Link
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}

      {/* Icon Buttons */}
      <p className="text-body font-normal text-content-primary mb-2">
        Icon Buttons
      </p>
      {(["light", "dark"] as const).map((mode) => (
        <div
          key={`icon-${mode}`}
          className={`overflow-x-auto rounded-xl border border-border-strong ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
        >
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-border-strong bg-surface-secondary">
                <th
                  className={`${thClass} text-left text-content-primary/50`}
                  style={{ width: "15%" }}
                >
                  <span className="font-mono font-normal lowercase">
                    {mode}
                  </span>
                </th>
                <th className={`${thClass} text-content-primary/50`}>
                  DEFAULT
                </th>
                <th className={`${thClass} text-content-primary/50`}>INPUT</th>
                <th className={`${thClass} text-content-primary/50`}>BOXED</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border-strong">
                <td className="px-4 py-3 text-body font-normal text-content-primary">
                  Normal
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <button
                      className={`${iconButtonSpecs.base} ${iconButtonSpecs.variants.default}`}
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <button
                      className={`${iconButtonSpecs.base} text-content-secondary hover:text-content-primary/75`}
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <button
                      className={`${iconButtonSpecs.base} ${iconButtonSpecs.variants.boxed}`}
                    >
                      <ChevronRight
                        size={16}
                        className="text-content-primary"
                      />
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-body font-normal text-content-primary">
                  Hover
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center text-content-primary">
                    <Copy size={16} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center text-content-primary/75">
                    <Eye size={16} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <div className={`${iconButtonSpecs.variants.boxed}`}>
                      <ChevronRight
                        size={16}
                        className="text-content-primary"
                      />
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}

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
          "Icon Button Variants": iconButtonSpecs.variants,
          "Icon Button Usage": iconButtonSpecs.usage,
        }}
      />
    </ShowcaseSection>
  );
}

const linkSpecs = {
  base: "text-body font-normal leading-[21px] transition-colors",
  variants: {
    simple: "text-content-primary/75 hover:text-content-primary",
    underline:
      "text-content-primary/75 hover:text-content-primary hover:underline active:text-content-primary/75 active:underline active:decoration-dotted",
    "underline + icon":
      "Same as underline with flex items-center gap-1 + lucide icon 16px",
  },
};

const iconButtonSpecs = {
  base: "transition-colors cursor-pointer",
  variants: {
    default: "text-content-primary/50 hover:text-content-primary",
    "inside input":
      "text-content-secondary hover:text-content-primary/75 (shrink-0)",
    boxed:
      "w-6 h-6 rounded-full bg-surface-subtle hover:bg-surface-subtle flex items-center justify-center",
  },
  icon: "16px lucide icons",
  usage: {
    "theme toggle": "AuthLayout — Moon/SunDim 16px (default)",
    "copy secret": "MfaSetupStep — Copy/Check 16px (default)",
    "password eye": "Input — Eye/EyeOff 16px (inside input)",
    "calendar nav": "Calendar — ChevronLeft/Right 16px (boxed)",
    "calendar day": "Calendar — day number text (circle)",
  },
};

function InputGrid({ mode }: { mode: "light" | "dark" }) {
  return (
    <div
      className={`card-flat !p-4 ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
    >
      <p className="text-caption text-content-primary/50 font-mono mb-3">
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

function InputShowcase() {
  return (
    <ShowcaseSection title="Input">
      <InputGrid mode="light" />

      <InputGrid mode="dark" />

      {/* Sizes */}
      <div>
        <p className="text-body font-normal text-content-primary mb-2">Sizes</p>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5 w-[240px]">
            <Input placeholder="md · 48px (default)" />
            <span className="text-caption text-content-primary/50">
              md · 48px (default)
            </span>
          </div>
          <div className="flex flex-col gap-1.5 w-[240px]">
            <Input size="sm" placeholder="sm · 40px" />
            <span className="text-caption text-content-primary/50">
              sm · 40px
            </span>
          </div>
        </div>
      </div>

      <SpecsPanel
        specs={{
          Container: { shared: inputSpecs.container },
          Sizes: inputSpecs.sizes,
          Label: { shared: inputSpecs.label },
          Input: { shared: inputSpecs.input },
          States: inputSpecs.states,
          Icons: inputSpecs.icons,
          Dimensions: {
            "border-radius": "8px (rounded-lg)",
            "label font": "15px / 22px line-height, semibold",
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
      <p className="text-caption text-content-primary/50 font-mono mb-3">
        {mode}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {sizes.map((size) => (
          <div key={size} className="card-flat !p-4">
            <p className="text-caption text-content-primary/50 font-mono mb-3">
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

function BadgeShowcase() {
  return (
    <ShowcaseSection title="Badge">
      <BadgeSizeGrid mode="light" />

      <BadgeSizeGrid mode="dark" />

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
      <p className="text-caption text-content-primary/50 font-mono mb-3">
        {mode}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {spinnerTypes.map(({ label, Component }) => (
          <div key={label} className="card-flat !p-4">
            <p className="text-caption text-content-primary/50 font-mono mb-3">
              {label}
            </p>
            <div className="flex flex-wrap items-end justify-center sm:justify-start gap-4">
              {(["lg", "md", "sm"] as const).map((s) => (
                <div key={s} className="flex flex-col items-center gap-1.5">
                  <div className="flex h-8 items-center justify-center">
                    <Component size={s} />
                  </div>
                  <span className="text-caption text-content-primary/50">
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
          Types: {
            Spinner: "Circular border animation — general purpose",
            InfinitySpinner: "Figure-8 lemniscate — used inside buttons",
            RingSpinner: "Ripple/sonar rings — used for page loading",
          },
          Sizes: {
            sm: "16px — buttons, inputs",
            md: "24px — standalone, cards",
            lg: "32px — page loading, OAuth callback",
          },
          Base: {
            color: "currentColor (inherits text color from parent)",
            animation:
              "Spinner: CSS spin, Infinity: SVG dashoffset, Ring: SMIL animate",
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
      <p className="text-caption text-content-primary/50 font-mono mb-3">
        {mode}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(["image", "initials", "icon fallback"] as const).map((type) => (
          <div key={type} className="card-flat !p-4">
            <p className="text-caption text-content-primary/50 font-mono mb-3">
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
                  <span className="text-caption text-content-primary/50">
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
      <p className="text-caption text-content-primary/50 font-mono mb-3">
        {mode}
      </p>
      <div className="flex flex-wrap items-end justify-center sm:justify-start gap-4">
        <div className="flex flex-col items-center gap-1.5">
          <Toggle
            checked={values.off}
            onChange={(v) => setValues((s) => ({ ...s, off: v }))}
          />
          <span className="text-caption text-content-primary/50">
            {values.off ? "On" : "Off"}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Toggle
            checked={values.on}
            onChange={(v) => setValues((s) => ({ ...s, on: v }))}
          />
          <span className="text-caption text-content-primary/50">
            {values.on ? "On" : "Off"}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Toggle checked={false} disabled />
          <span className="text-caption text-content-primary/50">
            Disabled off
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Toggle checked={true} disabled />
          <span className="text-caption text-content-primary/50">
            Disabled on
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Toggle
            size="lg"
            checked={values.lg}
            onChange={(v) => setValues((s) => ({ ...s, lg: v }))}
          />
          <span className="text-caption text-content-primary/50">
            lg · 48×26px
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Toggle
            size="md"
            checked={values.md}
            onChange={(v) => setValues((s) => ({ ...s, md: v }))}
          />
          <span className="text-caption text-content-primary/50">
            md · 40×22px (default)
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Toggle
            size="sm"
            checked={values.sm}
            onChange={(v) => setValues((s) => ({ ...s, sm: v }))}
          />
          <span className="text-caption text-content-primary/50">
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
      <p className="text-caption text-content-primary/50 font-mono mb-3">
        {mode}
      </p>
      <div className="flex flex-wrap items-end justify-center sm:justify-start gap-4">
        <div className="flex flex-col items-center gap-1.5">
          <Checkbox
            checked={values.a}
            onChange={(v) => setValues((s) => ({ ...s, a: v }))}
          />
          <span className="text-caption text-content-primary/50">
            {values.a ? "Checked" : "Unchecked"}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Checkbox
            checked={values.b}
            onChange={(v) => setValues((s) => ({ ...s, b: v }))}
          />
          <span className="text-caption text-content-primary/50">
            {values.b ? "Checked" : "Unchecked"}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Checkbox
            checked={values.c}
            onChange={(v) => setValues((s) => ({ ...s, c: v }))}
            indeterminate
          />
          <span className="text-caption text-content-primary/50">
            Indeterminate
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Checkbox checked={false} disabled />
          <span className="text-caption text-content-primary/50">
            Disabled off
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Checkbox checked={true} disabled />
          <span className="text-caption text-content-primary/50">
            Disabled on
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Checkbox
            size="lg"
            checked={values.lg}
            onChange={(v) => setValues((s) => ({ ...s, lg: v }))}
          />
          <span className="text-caption text-content-primary/50">
            lg · 24px
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Checkbox
            size="md"
            checked={values.md}
            onChange={(v) => setValues((s) => ({ ...s, md: v }))}
          />
          <span className="text-caption text-content-primary/50">
            md · 20px (default)
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Checkbox
            size="sm"
            checked={values.sm}
            onChange={(v) => setValues((s) => ({ ...s, sm: v }))}
          />
          <span className="text-caption text-content-primary/50">
            sm · 16px
          </span>
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
      <p className="text-caption text-content-primary/50 font-mono mb-3">
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
          <p className="text-caption text-content-primary/50 font-mono mb-3">
            light
          </p>
          <div className="space-y-3">
            <div className="space-y-4">
              <p className="text-body text-content-secondary">Content above</p>
              <Divider />
              <p className="text-body text-content-secondary">Content below</p>
            </div>
            <div className="space-y-4">
              <p className="text-body text-content-secondary">Content above</p>
              <Divider label="OR" />
              <p className="text-body text-content-secondary">Content below</p>
            </div>
            <div className="flex items-center gap-6 h-16">
              <div className="flex items-center gap-3 h-full">
                <p className="text-body text-content-secondary">Left</p>
                <Divider orientation="vertical" />
                <p className="text-body text-content-secondary">Right</p>
              </div>
              <div className="flex items-center gap-3 h-full">
                <p className="text-body text-content-secondary">Left</p>
                <Divider orientation="vertical" label="OR" />
                <p className="text-body text-content-secondary">Right</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-[280px] card-flat !p-4 dark bg-surface-primary">
          <p className="text-caption text-content-primary/50 font-mono mb-3">
            dark
          </p>
          <div className="space-y-3">
            <div className="space-y-4">
              <p className="text-body text-content-secondary">Content above</p>
              <Divider />
              <p className="text-body text-content-secondary">Content below</p>
            </div>
            <div className="space-y-4">
              <p className="text-body text-content-secondary">Content above</p>
              <Divider label="OR" />
              <p className="text-body text-content-secondary">Content below</p>
            </div>
            <div className="flex items-center gap-6 h-16">
              <div className="flex items-center gap-3 h-full">
                <p className="text-body text-content-secondary">Left</p>
                <Divider orientation="vertical" />
                <p className="text-body text-content-secondary">Right</p>
              </div>
              <div className="flex items-center gap-3 h-full">
                <p className="text-body text-content-secondary">Left</p>
                <Divider orientation="vertical" label="OR" />
                <p className="text-body text-content-secondary">Right</p>
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
      <p className="text-caption text-content-primary/50 font-mono mb-3">
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

function TabsCard({
  mode,
  variant,
}: {
  mode: "light" | "dark";
  variant: "solid" | "subtle";
}) {
  const [active, setActive] = useState("tab1");
  const tabItems = [
    { label: "Overview", value: "tab1" },
    { label: "Members", value: "tab2" },
    { label: "Settings", value: "tab3" },
  ];
  return (
    <div
      className={`flex-1 min-w-[280px] card-flat !p-4 overflow-hidden ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
    >
      <p className="text-caption text-content-primary/50 font-mono mb-3">
        {mode} · {variant}
      </p>
      <div className="space-y-4">
        {(["sm", "md", "lg"] as const).map((s) => (
          <div key={s}>
            <p className="text-caption text-content-primary/50 font-mono mb-2">
              {s} · {s === "sm" ? "32" : s === "md" ? "40" : "48"}px
              {s === "md" ? " (default)" : ""}
            </p>
            <div className="overflow-hidden">
              <div className="overflow-x-auto scrollbar-hide touch-pan-x">
                <Tabs
                  tabs={tabItems}
                  activeTab={active}
                  onChange={setActive}
                  size={s}
                  variant={variant}
                />
              </div>
              <div className="flex justify-center gap-1.5 mt-2 sm:hidden">
                {tabItems.map((tab) => (
                  <div
                    key={tab.value}
                    className={`h-1.5 w-1.5 rounded-full transition-colors ${active === tab.value ? "bg-surface-inverse" : "bg-border-strong"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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
      <p className="text-caption text-content-primary/50 font-mono mb-3">
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
        <p className="text-caption text-content-primary/50 font-mono mb-3">
          light · nav-horizontal
        </p>
        <div className="overflow-x-auto scrollbar-hide touch-pan-x">
          <Tabs
            tabs={navItems}
            activeTab={activeLight}
            onChange={setActiveLight}
            variant="nav-horizontal"
          />
        </div>
        <div className="flex justify-center gap-1.5 mt-2 sm:hidden">
          {navItems.map((tab) => (
            <div
              key={tab.value}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${activeLight === tab.value ? "bg-surface-inverse" : "bg-border-strong"}`}
            />
          ))}
        </div>
      </div>
      <div className="card-flat !p-4 overflow-hidden dark bg-surface-primary">
        <p className="text-caption text-content-primary/50 font-mono mb-3">
          dark · nav-horizontal
        </p>
        <div className="overflow-x-auto scrollbar-hide touch-pan-x">
          <Tabs
            tabs={navItems}
            activeTab={activeDark}
            onChange={setActiveDark}
            variant="nav-horizontal"
          />
        </div>
        <div className="flex justify-center gap-1.5 mt-2 sm:hidden">
          {navItems.map((tab) => (
            <div
              key={tab.value}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${activeDark === tab.value ? "bg-surface-inverse" : "bg-border-strong"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TabsShowcase() {
  return (
    <ShowcaseSection title="Tabs">
      <div className="flex flex-wrap gap-4">
        <TabsCard mode="light" variant="solid" />
        <TabsCard mode="dark" variant="solid" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <TabsNavCard mode="light" />
          <TabsNavCard mode="dark" />
        </div>
        <NavHorizontalColumn />
      </div>

      <SpecsPanel
        specs={{
          Variants: tabsSpecs.variants,
          Container: tabsSpecs.container,
          Nav: tabsSpecs.nav,
          Sizes: tabsSpecs.sizes,
          Mobile: tabsSpecs.mobile,
        }}
      />
    </ShowcaseSection>
  );
}

function SelectCard({ mode }: { mode: "light" | "dark" }) {
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
  return (
    <div
      className={`card-flat !p-4 ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
    >
      <p className="text-caption text-content-primary/50 font-mono mb-3">
        {mode} · select
      </p>
      <div>
        <Select
          options={options}
          value={val}
          onChange={setVal}
          placeholder="Choose action..."
        />
      </div>
    </div>
  );
}

function EmailSelectorCard({ mode }: { mode: "light" | "dark" }) {
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

  return (
    <div
      className={`card-flat !p-4 ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
    >
      <p className="text-caption text-content-primary/50 font-mono mb-3">
        {mode} · email
      </p>
      <div ref={ref} className="relative w-fit">
        <button
          type="button"
          onClick={() => (open ? setOpen(false) : openDropdown())}
          className={`flex h-10 items-center gap-2 rounded-md px-4 text-h3 font-normal border border-border-strong text-content-primary transition-all w-fit ${open ? "bg-surface-subtle" : "bg-transparent hover:bg-surface-subtle"}`}
        >
          <span className="leading-none">user@example.com</span>
          <ChevronDown
            size={16}
            className={`shrink-0 text-content-primary/50 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        {open && (
          <div
            className={`absolute z-50 w-fit min-w-[200px] left-0 ${popoverPos.vertical === "up" ? "bottom-full mb-1 animate-dropdown-up" : "top-full mt-1 animate-dropdown-down"}`}
          >
            <div className="rounded-xl border border-border-strong bg-surface-primary p-4 shadow-card whitespace-nowrap">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-full items-center gap-2 rounded-md bg-surface-tertiary px-2 font-normal text-content-primary transition-colors"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-subtle">
                  <span className="text-caption font-semibold">U</span>
                </div>
                <span className="truncate text-body">user@example.com</span>
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mt-4 w-full px-2 text-left text-body font-normal text-content-primary/75 transition-colors hover:text-content-primary hover:underline"
              >
                Try a different email address
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SelectShowcase() {
  return (
    <ShowcaseSection title="Select / Dropdown">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SelectCard mode="light" />
        <SelectCard mode="dark" />
        <EmailSelectorCard mode="light" />
        <EmailSelectorCard mode="dark" />
        <div className="card-flat !p-4 light bg-surface-primary">
          <p className="text-caption text-content-primary/50 font-mono mb-3">
            light · language
          </p>
          <LanguageSelector />
        </div>
        <div className="card-flat !p-4 dark bg-surface-primary">
          <p className="text-caption text-content-primary/50 font-mono mb-3">
            dark · language
          </p>
          <LanguageSelector />
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
              "h-10 rounded-md px-4 w-fit text-h3 font-normal border border-border-strong bg-transparent hover:bg-surface-subtle",
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
        <div className="card-flat !p-4 light bg-surface-primary">
          <p className="text-caption text-content-primary/50 font-mono mb-3">
            light
          </p>
          <Calendar value={dateLight} onChange={setDateLight} />
        </div>
        <div className="card-flat !p-4 dark bg-surface-primary">
          <p className="text-caption text-content-primary/50 font-mono mb-3">
            dark
          </p>
          <Calendar value={dateDark} onChange={setDateDark} />
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
      <p className="text-body font-normal text-content-primary mb-2">
        Breadcrumbs
      </p>
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[280px] card-flat !p-4 light bg-surface-primary">
          <p className="text-caption text-content-primary/50 font-mono mb-3">
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
          <p className="text-caption text-content-primary/50 font-mono mb-3">
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

      <p className="text-body font-normal text-content-primary mb-2 mt-4">
        Pagination
      </p>
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[280px] card-flat !p-4 light bg-surface-primary">
          <p className="text-caption text-content-primary/50 font-mono mb-3">
            light
          </p>
          <Pagination
            currentPage={pageLight}
            totalPages={12}
            onPageChange={setPageLight}
          />
        </div>
        <div className="flex-1 min-w-[280px] card-flat !p-4 dark bg-surface-primary">
          <p className="text-caption text-content-primary/50 font-mono mb-3">
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
    title: "Error title",
    desc: "Something went wrong",
    variant: "error",
  },
  {
    icon: CircleCheck,
    color: "text-success",
    title: "Success title",
    desc: "Action completed successfully",
    variant: "success",
  },
  {
    icon: CircleAlert,
    color: "text-warning",
    title: "Warning title",
    desc: "Please review before continuing",
    variant: "warning",
  },
  {
    icon: Info,
    color: "text-info",
    title: "Info title",
    desc: "Here is some useful information",
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
      <p className="text-caption text-content-primary/50 font-mono mb-2">
        toast variants — click to preview
      </p>
      <div className="flex flex-wrap gap-2">
        {toastVariants.map(({ variant }) => (
          <Button
            key={variant}
            variant="outline"
            size="sm"
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
                  className={`group flex items-start gap-2 rounded-full border border-border-strong bg-surface-primary px-6 py-4 ${exiting[variant] ? "animate-toast-out" : "animate-toast-in"}`}
                >
                  <Icon size={16} className={`mt-px shrink-0 ${color}`} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="whitespace-nowrap text-caption font-semibold leading-tight text-content-primary">
                      {title}
                    </p>
                    <p className="whitespace-nowrap text-caption leading-tight text-content-primary/50">
                      {desc}
                    </p>
                  </div>
                  <button
                    onClick={() => dismiss(variant)}
                    className="mt-px shrink-0 text-content-secondary opacity-0 transition-all group-hover:opacity-100 hover:text-content-primary"
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
          <p className="text-center text-body leading-[21px] text-content-primary/50">
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
          <button className="flex h-10 w-full items-center justify-center rounded-md border border-border-strong bg-transparent px-6 py-2.5 text-h3 font-normal text-content-primary transition-colors hover:bg-surface-subtle">
            {isError ? "Go to Sign In" : "Go to Dashboard"}
          </button>
        </div>
      </div>
      <div className="h-14 w-full p-2" />
    </div>
  );
}

function FullPageIconsDemo() {
  return (
    <div>
      <p className="text-caption text-content-primary/50 font-mono mb-2">
        full page — hover to preview
      </p>
      <div className="flex flex-wrap gap-4 items-start justify-center sm:justify-start">
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
      <p className="text-caption text-content-primary/50 font-mono mb-2">
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
            <p className="text-caption text-content-primary/50 font-mono mb-4">
              {mode}
            </p>
            <div className="space-y-5">
              <div>
                <p className="text-caption text-content-primary/50 font-mono mb-2">
                  inline validation
                </p>
                <div role="alert" className="flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0 text-error" />
                  <span className="flex-1 text-caption leading-6 text-error">
                    Enter a valid email address
                  </span>
                </div>
              </div>

              <div>
                <p className="text-caption text-content-primary/50 font-mono mb-2">
                  boxed error
                </p>
                <div className="flex items-center gap-2 rounded-lg border border-error/20 bg-error/5 px-3 py-2">
                  <AlertTriangle size={16} className="shrink-0 text-error" />
                  <span className="text-caption text-error">
                    Invalid verification code. Please try again.
                  </span>
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
          "Inline Validation": {
            container:
              "flex items-center gap-2 (also used below Input component)",
            icon: "AlertTriangle 16px text-error",
            text: "text-caption leading-6 text-error",
          },
          "Boxed Error": {
            container: "rounded-lg border border-error/20 bg-error/5 px-3 py-2",
            icon: "AlertTriangle 16px text-error",
            text: "text-caption text-error",
          },
          "Rate Limit": {
            container: "flex items-start gap-2",
            icon: "AlertTriangle 16px text-error (mt-1) or Lock 16px for lockout",
            countdown:
              "CountdownTimer — digit boxes text-error/60, auto-restart at 0",
          },
          Toast: {
            container:
              "rounded-full border border-border-strong bg-surface-primary px-6 py-4",
            icons:
              "error: AlertTriangle, success: CircleCheck, warning: CircleAlert, info: Info — 16px",
            title:
              "text-caption font-semibold leading-tight text-content-primary",
            description: "text-caption leading-tight text-content-primary/50",
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
            text: "text-body leading-[21px] text-content-primary/50 text-center",
            button:
              "h-10 w-full rounded-md border border-border-strong bg-transparent text-h3 font-normal — outline style",
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
      <p className="text-caption text-content-primary/50 font-mono mb-3">
        {mode}
      </p>
      <div className="space-y-4">
        <div>
          <p className="text-caption text-content-primary/50 font-mono mb-2">
            Single
          </p>
          <SingleAccordion title="Click to expand">
            <p className="text-body text-content-secondary">
              Expandable content panel. Used for specs, FAQs, and collapsible
              sections.
            </p>
          </SingleAccordion>
        </div>
        <div>
          <p className="text-caption text-content-primary/50 font-mono mb-2">
            Multi (exclusive)
          </p>
          <Accordion
            items={[
              {
                title: "Section 1",
                children: (
                  <p className="text-body text-content-secondary">
                    Content for section 1. Only one open at a time.
                  </p>
                ),
              },
              {
                title: "Section 2",
                children: (
                  <p className="text-body text-content-secondary">
                    Content for section 2. Opening this closes section 1.
                  </p>
                ),
              },
              {
                title: "Section 3",
                children: (
                  <p className="text-body text-content-secondary">
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
    w: 150,
    h: 120,
    cx: 75,
    cy: 75,
    R: 45,
    progressW: 10,
    trackW: 8,
    dashR: 30,
    needleLen: 28,
    needleBase: 3,
    hub: 5,
    hubInner: 2,
    fontSize: 8,
    labelOffset: 14,
    textClass: "text-body",
  },
  md: {
    w: 210,
    h: 170,
    cx: 105,
    cy: 110,
    R: 65,
    progressW: 14,
    trackW: 12,
    dashR: 45,
    needleLen: 42,
    needleBase: 5,
    hub: 8,
    hubInner: 3,
    fontSize: 10,
    labelOffset: 18,
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
    fontSize: 11,
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

function DoughnutChartMock() {
  const doughnutData = {
    labels: ["USER", "ADMIN", "SUPERADMIN"],
    datasets: [
      {
        data: [150, 75, 25],
        backgroundColor: ["#a0bce8", "#6be6d3", "#1c1c1c"],
        borderWidth: 0,
        spacing: 2,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%",
    plugins: {
      tooltip: {
        backgroundColor: "#ffffff",
        titleColor: "#1c1c1c",
        bodyColor: "#1c1c1c",
        borderColor: "rgba(28, 28, 28, 0.08)",
        borderWidth: 1,
        cornerRadius: 8,
        bodyFont: { size: 12 },
        titleFont: { size: 12 },
        padding: 10,
        callbacks: {
          label: (ctx: { parsed: number; label: string }) =>
            ` ${ctx.label}: ${ctx.parsed}`,
        },
      },
    },
  };

  return (
    <div className="rounded-3xl border border-border-strong bg-surface-primary p-6">
      <div className="mb-4">
        <h3 className="text-body font-semibold text-content-primary">
          Users by Role
        </h3>
      </div>
      <div className="flex items-center gap-6">
        <div className="h-[120px] w-[120px] shrink-0">
          <Doughnut data={doughnutData} options={doughnutOptions} />
        </div>
        <div className="space-y-3">
          {[
            { role: "USER", color: "bg-[#a0bce8]", count: 150, pct: "60.0" },
            { role: "ADMIN", color: "bg-[#6be6d3]", count: 75, pct: "30.0" },
            {
              role: "SUPERADMIN",
              color: "bg-surface-inverse",
              count: 25,
              pct: "10.0",
            },
          ].map(({ role, color, count, pct }) => (
            <div key={role} className="flex items-center gap-2">
              <span className={`h-2 w-2 shrink-0 rounded-full ${color}`} />
              <span className="text-caption text-content-primary">{role}</span>
              <span className="text-caption text-content-primary/50">
                {count} ({pct}%)
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
      <div className="flex flex-wrap gap-4">
        {(["light", "dark"] as const).map((mode) => (
          <div
            key={mode}
            className={`flex-1 min-w-[400px] card-flat !p-4 ${mode === "dark" ? "dark bg-surface-primary" : "light bg-surface-primary"}`}
          >
            <p className="text-caption text-content-primary/50 font-mono mb-3">
              {mode}
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-caption text-content-primary/50 font-mono mb-2">
                  Line Chart
                </p>
                <TotalUsersChart forceDark={mode === "dark"} />
              </div>
              <div>
                <p className="text-caption text-content-primary/50 font-mono mb-2">
                  Speedometer
                </p>
                <div className="rounded-3xl border border-border-strong bg-surface-primary p-6">
                  <div className="mb-2">
                    <h3 className="text-body font-semibold text-content-primary">
                      Performance
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-end justify-center gap-6">
                    <div className="flex flex-col items-center gap-1">
                      <SpeedometerChart value={78} size="lg" />
                      <span className="text-caption text-content-primary/50">
                        lg
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <SpeedometerChart value={65} size="md" />
                      <span className="text-caption text-content-primary/50">
                        md
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <SpeedometerChart value={42} size="sm" />
                      <span className="text-caption text-content-primary/50">
                        sm
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-caption text-content-primary/50 font-mono mb-2">
                  Doughnut Chart
                </p>
                <DoughnutChartMock />
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
            label: "text-caption text-content-primary/50",
            separator: "text-content-primary/20",
          },
          "Chart Colors": {
            primary: "#1c1c1c (surface-inverse) — main data, SUPERADMIN",
            secondary: "#a0bce8 — comparison line, USER role",
            tertiary: "#6be6d3 — ADMIN role",
          },
          "Chart.js Config": {
            tooltip:
              "bg surface-primary, text content-primary, border border-strong, radius 8px, font 12px",
            "tooltip labels":
              "solid color squares (no border) via labelColor callback",
            interaction:
              "mode: index, intersect: false — tooltip on any x position",
            grid: "border-strong color, no x-grid",
            ticks: "font 12px, content-primary/50",
            "dark mode": "auto via useTheme() + forceDark prop",
            animation:
              "default chartjs enter animation + hover tooltips + pointHoverRadius 4",
          },
          Speedometer: {
            arc: "270° sweep (135° to 45°), strokeLinecap round",
            progress: "stroke-surface-inverse (thicker than track)",
            track: "stroke-surface-tertiary",
            needle: "polygon triangle fill-surface-inverse",
            hub: "fill-surface-inverse + fill-surface-primary center",
            sizes: "sm (140px), md (210px), lg (260px)",
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
      <BadgeShowcase />
      <SpinnerShowcase />
      <AvatarShowcase />
      <ToggleShowcase />
      <CheckboxShowcase />
      <TooltipShowcase />
      <DividerShowcase />
      <SliderShowcase />
      <AccordionShowcase />
      <CardShowcase />
    </div>
  );
}

function CardShowcase() {
  return (
    <ShowcaseSection title="Card">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-4">
          <div>
            <p className="text-caption text-content-primary/50 font-mono mb-2">
              container
            </p>
            <div className="card-container">
              <h3 className="text-body font-semibold text-content-primary">
                Card Container
              </h3>
            </div>
          </div>
          <div
            className="dark"
            style={{ color: "rgb(var(--content-primary))" }}
          >
            <div className="card-container">
              <h3 className="text-body font-semibold text-content-primary">
                Card Container
              </h3>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-caption text-content-primary/50 font-mono mb-2">
              container-flat
            </p>
            <div className="card-container-flat">
              <h3 className="text-body font-semibold text-content-primary">
                Card Container Flat
              </h3>
            </div>
          </div>
          <div
            className="dark"
            style={{ color: "rgb(var(--content-primary))" }}
          >
            <div className="card-container-flat">
              <h3 className="text-body font-semibold text-content-primary">
                Card Container Flat
              </h3>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-caption text-content-primary/50 font-mono mb-2">
              inner
            </p>
            <div className="card">
              <h3 className="text-body font-semibold text-content-primary">
                Card Inner
              </h3>
            </div>
          </div>
          <div
            className="dark"
            style={{ color: "rgb(var(--content-primary))" }}
          >
            <div className="card">
              <h3 className="text-body font-semibold text-content-primary">
                Card Inner
              </h3>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-caption text-content-primary/50 font-mono mb-2">
              flat
            </p>
            <div className="card-flat">
              <h3 className="text-body font-semibold text-content-primary">
                Card Flat
              </h3>
            </div>
          </div>
          <div
            className="dark"
            style={{ color: "rgb(var(--content-primary))" }}
          >
            <div className="card-flat">
              <h3 className="text-body font-semibold text-content-primary">
                Card Flat
              </h3>
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
          "Flat (card-flat)": {
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
    </div>
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
            <p className="text-caption text-content-primary/50 font-mono mb-3">
              {mode}
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-caption text-content-primary/50 font-mono mb-2">
                  with data
                </p>
                <DataTable
                  data={sampleData}
                  columns={sampleColumns}
                  keyExtractor={(row) => row.id}
                />
              </div>
              <div>
                <p className="text-caption text-content-primary/50 font-mono mb-2">
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
                <p className="text-caption text-content-primary/50 font-mono mb-2">
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
