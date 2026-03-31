"use client";

import { designTokens } from "../../../tailwind.config";
import { Inbox, AlertTriangle, Settings } from "lucide-react";

/* ===== Token Data (from globals.css + tailwind.config.ts) ===== */

interface ColorToken {
  name: string;
  value: string;
  cssVar: string;
}

interface ColorGroup {
  label: string;
  tokens: ColorToken[];
}

const colorGroups: ColorGroup[] = [
  {
    label: "Surface",
    tokens: [
      { name: "primary", value: "#ffffff", cssVar: "--surface-primary" },
      { name: "secondary", value: "#fbfbfb", cssVar: "--surface-secondary" },
      { name: "tertiary", value: "#e8e8e8", cssVar: "--surface-tertiary" },
      {
        name: "subtle",
        value: "rgba(28,28,28,0.05)",
        cssVar: "--surface-subtle",
      },
      { name: "inverse", value: "#1c1c1c", cssVar: "--surface-inverse" },
      {
        name: "inverse/10",
        value: "rgba(28,28,28,0.10)",
        cssVar: "--surface-inverse",
      },
    ],
  },
  {
    label: "Content",
    tokens: [
      { name: "primary", value: "#1c1c1c", cssVar: "--content-primary" },
      {
        name: "primary/75",
        value: "rgba(28,28,28,0.75)",
        cssVar: "--content-primary",
      },
      {
        name: "primary/50",
        value: "rgba(28,28,28,0.50)",
        cssVar: "--content-primary",
      },
      {
        name: "secondary",
        value: "rgba(28,28,28,0.5)",
        cssVar: "--content-secondary",
      },
      {
        name: "placeholder",
        value: "rgba(28,28,28,0.3)",
        cssVar: "--content-placeholder",
      },
      { name: "inverse", value: "#ffffff", cssVar: "--content-inverse" },
    ],
  },
  {
    label: "Border & Outline",
    tokens: [
      {
        name: "default (5%) — dividers, separators",
        value: "rgba(0,0,0,0.05)",
        cssVar: "--border-default",
      },
      {
        name: "strong (8%) — cards, containers",
        value: "rgba(0,0,0,0.08)",
        cssVar: "--border-strong",
      },
      {
        name: "components (15%) — inputs, buttons, selects",
        value: "rgba(0,0,0,0.15)",
        cssVar: "--border-components",
      },
      {
        name: "outline primary/75",
        value: "rgba(28,28,28,0.75)",
        cssVar: "--content-primary",
      },
      {
        name: "outline error/75",
        value: "rgba(138,17,17,0.75)",
        cssVar: "--color-error",
      },
    ],
  },
  {
    label: "Error",
    tokens: [
      { name: "error", value: "rgb(138,17,17)", cssVar: "--color-error" },
      {
        name: "error/75 (label)",
        value: "rgba(138,17,17,0.75)",
        cssVar: "--color-error",
      },
      {
        name: "error/60 (countdown)",
        value: "rgba(138,17,17,0.60)",
        cssVar: "--color-error",
      },
      {
        name: "error/5 (boxed bg)",
        value: "rgba(138,17,17,0.05)",
        cssVar: "--color-error",
      },
      {
        name: "error/20 (boxed border)",
        value: "rgba(138,17,17,0.20)",
        cssVar: "--color-error",
      },
      { name: "error icon", value: "#8a1111", cssVar: "--color-error" },
    ],
  },
  {
    label: "Success",
    tokens: [
      { name: "success", value: "#166534", cssVar: "--color-success" },
      { name: "success icon", value: "#166534", cssVar: "--color-success" },
    ],
  },
  {
    label: "Semantic — Toast & Badge (cross-module)",
    tokens: [
      { name: "error", value: "rgb(138,17,17)", cssVar: "--color-error" },
      { name: "error-bg", value: "#fef2f2", cssVar: "--color-error-bg" },
      { name: "success", value: "#166534", cssVar: "--color-success" },
      { name: "success-bg", value: "#f0fdf4", cssVar: "--color-success-bg" },
      { name: "warning", value: "#92400e", cssVar: "--color-warning" },
      { name: "warning-bg", value: "#fffbeb", cssVar: "--color-warning-bg" },
      { name: "info", value: "#1e40af", cssVar: "--color-info" },
      { name: "info-bg", value: "#eff6ff", cssVar: "--color-info-bg" },
    ],
  },
];

const unusedColorGroups: ColorGroup[] = [
  {
    label: "Content",
    tokens: [
      {
        name: "tertiary",
        value: "rgba(28,28,28,0.4)",
        cssVar: "--content-tertiary",
      },
      { name: "disabled", value: "#73787d", cssVar: "--content-disabled" },
    ],
  },
  {
    label: "Border",
    tokens: [
      {
        name: "subtle (3%)",
        value: "rgba(0,0,0,0.03)",
        cssVar: "--border-subtle",
      },
      {
        name: "default (5%) — dividers, separators",
        value: "rgba(0,0,0,0.05)",
        cssVar: "--border-default",
      },
      {
        name: "strong (8%) — cards, containers",
        value: "rgba(0,0,0,0.08)",
        cssVar: "--border-strong",
      },
      {
        name: "components (15%) — inputs, selects, buttons, checkboxes",
        value: "rgba(0,0,0,0.15)",
        cssVar: "--border-components",
      },
    ],
  },
  {
    label: "Semantic borders",
    tokens: [
      {
        name: "error-border",
        value: "#f5c6c6",
        cssVar: "--color-error-border",
      },
      {
        name: "warning-border",
        value: "#fde68a",
        cssVar: "--color-warning-border",
      },
      { name: "info-border", value: "#bfdbfe", cssVar: "--color-info-border" },
      {
        name: "success-border",
        value: "#bbf7d0",
        cssVar: "--color-success-border",
      },
    ],
  },
  {
    label: "Interactive & Accent",
    tokens: [
      {
        name: "hover-bg",
        value: "rgba(251,251,251,0.75)",
        cssVar: "--hover-bg",
      },
      { name: "accent", value: "#1b5e20", cssVar: "--accent" },
      { name: "accent-light", value: "#2e7d32", cssVar: "--accent-light" },
      {
        name: "input-border-focus",
        value: "#1c1c1c",
        cssVar: "--input-border-focus",
      },
      {
        name: "input-bg-disabled",
        value: "#f5f5f5",
        cssVar: "--input-bg-disabled",
      },
    ],
  },
  {
    label: "Dashboard",
    tokens: [
      { name: "metric-purple", value: "#edeefc", cssVar: "--metric-purple" },
      { name: "metric-blue", value: "#e6f1fd", cssVar: "--metric-blue" },
      {
        name: "notification-purple",
        value: "#edeefc",
        cssVar: "--notification-purple",
      },
      {
        name: "notification-blue",
        value: "#e6f1fd",
        cssVar: "--notification-blue",
      },
    ],
  },
];

const typographyTokens = [
  {
    name: "heading",
    desc: "text-h1 font-semibold",
    size: designTokens.fontSize.h1.size,
    lineHeight: designTokens.fontSize.h1.lineHeight,
    spacing: designTokens.fontSize.h1.letterSpacing,
    weight: 600,
    mono: false,
    usage:
      "Main headings (Sign In, Create Account), metric cards, profile form title",
  },
  {
    name: "title",
    desc: "text-h2 font-semibold",
    size: designTokens.fontSize.h2.size,
    lineHeight: designTokens.fontSize.h2.lineHeight,
    spacing: designTokens.fontSize.h2.letterSpacing,
    weight: 600,
    mono: false,
    usage:
      "Design System page title, Avatar lg, ConfirmModal title, profile section headings, error pages",
  },
  {
    name: "button / subtitle",
    desc: "text-h3 font-normal",
    size: designTokens.fontSize.h3.size,
    lineHeight: designTokens.fontSize.h3.lineHeight,
    spacing: designTokens.fontSize.h3.letterSpacing,
    weight: 400,
    mono: false,
    usage:
      "ShowcaseSection titles, Button lg, Badge lg, Tabs subtle, chart card titles",
  },
  {
    name: "body / label / link",
    desc: "text-body font-normal (semibold for labels)",
    size: designTokens.fontSize.body.size,
    lineHeight: designTokens.fontSize.body.lineHeight,
    spacing: designTokens.fontSize.body.letterSpacing,
    weight: 400,
    mono: false,
    usage:
      "Buttons md, links, inputs, descriptions, nav tabs, select triggers, breadcrumbs, calendar days",
  },
  {
    name: "caption / error",
    desc: "text-caption font-normal (semibold for toast title)",
    size: designTokens.fontSize.caption.size,
    lineHeight: designTokens.fontSize.caption.lineHeight,
    spacing: designTokens.fontSize.caption.letterSpacing,
    weight: 400,
    mono: false,
    usage:
      "Error messages, toast items, legend dots, chart ticks, table headers, badge sm, button sm, breadcrumb separators, speedometer labels",
  },
  {
    name: "technical",
    desc: "font-mono text-caption",
    size: designTokens.fontSize.caption.size,
    lineHeight: "normal",
    spacing: designTokens.fontSize.caption.letterSpacing,
    weight: 400,
    mono: true,
    usage: "Showcase light/dark labels, spec code values, countdown digits",
  },
];

const spacingTokens = [
  { name: "1 (gap-1, py-1)", value: "4px" },
  { name: "2 (gap-2, p-2, px-2, py-2)", value: "8px" },
  { name: "2.5 (gap-2.5, p-2.5, py-2.5)", value: "10px" },
  { name: "3 (px-3)", value: "12px" },
  { name: "4 (gap-4, p-4, px-4)", value: "16px" },
  { name: "6 (gap-6, p-6, px-6, py-6)", value: "24px" },
  { name: "8 (py-8)", value: "32px" },
  { name: "16 (px-16)", value: "64px" },
];

const radiusTokens = [
  { name: "md (buttons, inputs)", value: designTokens.borderRadius.md },
  { name: "lg (input container)", value: designTokens.borderRadius.lg },
  { name: "xl (inner cards)", value: designTokens.borderRadius.xl },
  {
    name: "3xl (container cards, dropdowns)",
    value: designTokens.borderRadius["3xl"],
  },
  { name: "full (pills, avatars)", value: designTokens.borderRadius.full },
];

const shadowTokens = [
  { name: "card / dropdown", value: designTokens.boxShadow.card },
];

/* ===== Section Components ===== */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-h3 font-semibold text-content-primary mb-4">
      {children}
    </h3>
  );
}

function ColorGrid({ groups }: { groups: ColorGroup[] }) {
  return (
    <>
      {groups.map((group) => (
        <div key={group.label}>
          <h4 className="text-body font-semibold text-content-primary mb-3">
            {group.label}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {group.tokens.map((token, i) => (
              <div
                key={`${token.cssVar}-${i}`}
                className="flex items-center gap-3 p-2 rounded-lg border border-border-strong"
              >
                <div
                  className="w-10 h-10 rounded-md border border-border-strong shrink-0"
                  style={{ backgroundColor: token.value }}
                />
                <div className="min-w-0">
                  <p className="text-caption font-normal text-content-primary truncate">
                    {token.name}
                  </p>
                  <p className="text-caption text-content-primary/50 font-mono truncate">
                    {token.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

function ColorSection() {
  return (
    <div className="space-y-6">
      <SectionTitle>Colors — Verified</SectionTitle>
      <ColorGrid groups={colorGroups} />

      <div className="border-t border-border-strong pt-6">
        <SectionTitle>Colors — Available</SectionTitle>
        <div className="opacity-60">
          <ColorGrid groups={unusedColorGroups} />
        </div>
      </div>
    </div>
  );
}

function TypographySection() {
  return (
    <div className="space-y-6">
      <SectionTitle>Typography</SectionTitle>

      {/* Font Family */}
      <div className="space-y-2">
        <p className="text-body font-semibold text-content-primary">
          Font Family
        </p>
        <div className="p-3 rounded-md border border-border-strong">
          <p className="text-caption font-mono text-content-primary/50">
            -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, &quot;Noto
            Sans&quot;, Helvetica, Arial, sans-serif
          </p>
          <p className="text-caption text-content-primary/50 mt-1">
            System font stack (GitHub pattern) — Windows: Segoe UI, Mac: SF Pro,
            Linux: Noto Sans
          </p>
        </div>
      </div>

      {/* Weights */}
      <div className="space-y-2">
        <p className="text-body font-semibold text-content-primary">Weights</p>
        <div className="flex gap-4">
          <div className="flex-1 p-3 rounded-md border border-border-strong">
            <p className="text-body font-normal text-content-primary">
              font-normal (400)
            </p>
            <p className="text-caption text-content-primary/50">
              Body, buttons, links, inputs, descriptions
            </p>
          </div>
          <div className="flex-1 p-3 rounded-md border border-border-strong">
            <p className="text-body font-semibold text-content-primary">
              font-semibold (600)
            </p>
            <p className="text-caption text-content-primary/50">
              Headings, labels, section titles, toast titles
            </p>
          </div>
        </div>
      </div>

      {/* Heading Hierarchy */}
      <div className="space-y-2">
        <p className="text-body font-semibold text-content-primary">
          Heading Hierarchy
        </p>
        <div className="space-y-2">
          {[
            {
              level: "Page",
              cls: "text-h2 font-semibold",
              size: "20px / 600",
              example: "Design System",
            },
            {
              level: "Section",
              cls: "text-h3 font-semibold",
              size: "16px / 600",
              example: "Button",
            },
            {
              level: "Subsection",
              cls: "text-body font-semibold",
              size: "14px / 600",
              example: "Sizes",
            },
            {
              level: "Spec label",
              cls: "text-caption font-semibold uppercase",
              size: "12px / 600",
              example: "VARIANTS",
            },
          ].map((h) => (
            <div
              key={h.level}
              className="flex items-center gap-4 p-3 rounded-md border border-border-strong"
            >
              <span className="text-caption text-content-primary/50 w-20 shrink-0">
                {h.level}
              </span>
              <span className="text-caption font-mono text-content-primary/50 w-48 shrink-0">
                {h.cls}
              </span>
              <span className="text-caption text-content-primary/50 w-20 shrink-0">
                {h.size}
              </span>
              <span className={h.cls + " text-content-primary"}>
                {h.example}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Scale */}
      <div className="space-y-2">
        <p className="text-body font-semibold text-content-primary">Scale</p>
        <div className="space-y-3">
          {typographyTokens.map((token) => (
            <div
              key={token.name}
              className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 p-3 rounded-md border border-border-strong"
            >
              <div className="sm:w-40 shrink-0">
                <p className="text-caption font-normal text-content-primary">
                  {token.name}
                </p>
                <p className="text-caption text-content-primary/50 font-mono">
                  {token.desc}
                </p>
                <p className="text-caption text-content-primary/50">
                  {token.size} / {token.lineHeight} / {token.weight} /{" "}
                  {token.spacing}
                </p>
              </div>
              <div className="flex-1">
                <p
                  style={{
                    fontSize: token.size,
                    lineHeight: token.lineHeight,
                    fontWeight: token.weight,
                  }}
                  className={`text-content-primary ${token.mono ? "font-mono" : ""}`}
                >
                  The quick brown fox jumps
                </p>
                <p className="text-caption text-content-primary/50 mt-1">
                  {token.usage}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SpacingSection() {
  const maxPx = 64;

  return (
    <div>
      <SectionTitle>Spacing</SectionTitle>
      <div className="space-y-2">
        {spacingTokens.map((token) => {
          const px = parseInt(token.value);
          const widthPercent = (px / maxPx) * 100;
          return (
            <div key={token.name} className="flex items-center gap-3">
              <code className="w-48 shrink-0 text-caption text-content-primary/50 font-mono truncate">
                {token.name}
              </code>
              <div className="flex-1 h-6 flex items-center">
                <div
                  className="h-full rounded-sm bg-surface-tertiary"
                  style={{ width: `${widthPercent}%`, minWidth: "4px" }}
                />
              </div>
              <span className="w-10 text-right text-caption text-content-primary/50 tabular-nums">
                {token.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RadiusSection() {
  return (
    <div>
      <SectionTitle>Border Radius</SectionTitle>
      <div className="flex flex-wrap gap-4">
        {radiusTokens.map((token) => (
          <div key={token.name} className="flex flex-col items-center gap-2">
            <div
              className="w-16 h-16 bg-surface-tertiary border border-border-strong"
              style={{ borderRadius: token.value }}
            />
            <div className="text-center">
              <p className="text-caption font-normal text-content-primary">
                {token.name}
              </p>
              <p className="text-caption text-content-primary/50 font-mono">
                {token.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShadowSection() {
  return (
    <div>
      <SectionTitle>Shadows</SectionTitle>
      <div className="flex flex-wrap gap-6">
        {shadowTokens.map((token) => (
          <div key={token.name} className="flex flex-col items-center gap-3">
            <div
              className="w-32 h-20 rounded-3xl bg-surface-primary border border-border-strong"
              style={{ boxShadow: token.value }}
            />
            <div className="text-center">
              <p className="text-caption font-normal text-content-primary">
                {token.name}
              </p>
              <p className="text-caption text-content-primary/50 font-mono max-w-[200px]">
                {token.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IconSizeSection() {
  return (
    <div>
      <SectionTitle>Icon Sizes</SectionTitle>
      <div className="flex flex-wrap items-end gap-8">
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center w-16 h-16 rounded-xl border border-border-strong bg-surface-primary">
            <AlertTriangle size={16} className="text-content-primary/50" />
          </div>
          <div className="text-center">
            <p className="text-caption font-normal text-content-primary">
              16px
            </p>
            <p className="text-caption text-content-primary/50">inline</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center w-16 h-16 rounded-xl border border-border-strong bg-surface-primary">
            <Settings size={24} className="text-content-primary/50" />
          </div>
          <div className="text-center">
            <p className="text-caption font-normal text-content-primary">
              24px
            </p>
            <p className="text-caption text-content-primary/50">medium</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center w-16 h-16 rounded-xl border border-border-strong bg-surface-primary">
            <Inbox size={32} className="text-content-primary/50" />
          </div>
          <div className="text-center">
            <p className="text-caption font-normal text-content-primary">
              32px
            </p>
            <p className="text-caption text-content-primary/50">page-level</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-1">
        <p className="text-caption text-content-primary/50">
          <span className="font-semibold text-content-primary">16px</span> —
          buttons, inputs, errors, navigation, toasts
        </p>
        <p className="text-caption text-content-primary/50">
          <span className="font-semibold text-content-primary">24px</span> —
          icon badges, cards, medium emphasis
        </p>
        <p className="text-caption text-content-primary/50">
          <span className="font-semibold text-content-primary">32px</span> —
          empty states, full page status (success/error), loading spinners
        </p>
      </div>
    </div>
  );
}

/* ===== Main Component ===== */

export default function TokenInspector() {
  return (
    <div className="space-y-4">
      <div className="card-flat">
        <ColorSection />
      </div>
      <div className="card-flat">
        <TypographySection />
      </div>
      <div className="card-flat">
        <SpacingSection />
      </div>
      <div className="card-flat">
        <RadiusSection />
      </div>
      <div className="card-flat">
        <ShadowSection />
      </div>
      <div className="card-flat">
        <IconSizeSection />
      </div>
    </div>
  );
}
