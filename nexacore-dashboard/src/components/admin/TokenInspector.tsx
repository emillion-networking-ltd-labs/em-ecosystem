"use client";

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
      { name: "tertiary", value: "#f2f2f2", cssVar: "--surface-tertiary" },
      {
        name: "subtle",
        value: "rgba(28,28,28,0.05)",
        cssVar: "--surface-subtle",
      },
      { name: "inverse", value: "#1c1c1c", cssVar: "--surface-inverse" },
    ],
  },
  {
    label: "Content",
    tokens: [
      { name: "primary", value: "#1c1c1c", cssVar: "--content-primary" },
      {
        name: "secondary",
        value: "rgba(28,28,28,0.5)",
        cssVar: "--content-secondary",
      },
      {
        name: "tertiary",
        value: "rgba(28,28,28,0.4)",
        cssVar: "--content-tertiary",
      },
      { name: "disabled", value: "#73787d", cssVar: "--content-disabled" },
      {
        name: "placeholder",
        value: "rgba(28,28,28,0.3)",
        cssVar: "--content-placeholder",
      },
      { name: "inverse", value: "#ffffff", cssVar: "--content-inverse" },
    ],
  },
  {
    label: "Border",
    tokens: [
      {
        name: "default",
        value: "rgba(0,0,0,0.05)",
        cssVar: "--border-default",
      },
      {
        name: "strong",
        value: "rgba(0,0,0,0.08)",
        cssVar: "--border-strong",
      },
      {
        name: "subtle",
        value: "rgba(0,0,0,0.03)",
        cssVar: "--border-subtle",
      },
    ],
  },
  {
    label: "Semantic",
    tokens: [
      { name: "error", value: "rgb(138,17,17)", cssVar: "--color-error" },
      { name: "error-bg", value: "#fef2f2", cssVar: "--color-error-bg" },
      {
        name: "error-border",
        value: "#f5c6c6",
        cssVar: "--color-error-border",
      },
      { name: "warning", value: "#92400e", cssVar: "--color-warning" },
      { name: "warning-bg", value: "#fffbeb", cssVar: "--color-warning-bg" },
      {
        name: "warning-border",
        value: "#fde68a",
        cssVar: "--color-warning-border",
      },
      { name: "info", value: "#1e40af", cssVar: "--color-info" },
      { name: "info-bg", value: "#eff6ff", cssVar: "--color-info-bg" },
      { name: "info-border", value: "#bfdbfe", cssVar: "--color-info-border" },
      { name: "success", value: "#166534", cssVar: "--color-success" },
      { name: "success-bg", value: "#f0fdf4", cssVar: "--color-success-bg" },
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
        name: "hover",
        value: "rgba(251,251,251,0.75)",
        cssVar: "--hover-bg",
      },
      { name: "accent", value: "#1b5e20", cssVar: "--accent" },
      { name: "accent-light", value: "#2e7d32", cssVar: "--accent-light" },
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
  { name: "display", size: "36px", lineHeight: "36px", weight: "700" },
  { name: "heading-lg", size: "24px", lineHeight: "36px", weight: "600" },
  { name: "heading-md", size: "20px", lineHeight: "20px", weight: "600" },
  { name: "heading-sm", size: "16px", lineHeight: "19px", weight: "700" },
  { name: "body-lg", size: "16px", lineHeight: "19px", weight: "500" },
  { name: "body-md", size: "15px", lineHeight: "24px", weight: "400" },
  { name: "body-sm", size: "14px", lineHeight: "21px", weight: "400" },
  { name: "caption", size: "12px", lineHeight: "18px", weight: "400" },
];

const spacingTokens = [
  { name: "0.5", value: "2px" },
  { name: "1", value: "4px" },
  { name: "1.5", value: "6px" },
  { name: "2", value: "8px" },
  { name: "2.5", value: "10px" },
  { name: "3", value: "12px" },
  { name: "4", value: "16px" },
  { name: "5", value: "20px" },
  { name: "6", value: "24px" },
  { name: "8", value: "32px" },
  { name: "9", value: "36px" },
];

const radiusTokens = [
  { name: "xs", value: "4px" },
  { name: "sm", value: "5px" },
  { name: "md", value: "6px" },
  { name: "lg", value: "8px" },
  { name: "xl", value: "12px" },
  { name: "2xl", value: "16px" },
  { name: "3xl", value: "24px" },
  { name: "full", value: "100px" },
  { name: "circle", value: "50%" },
];

const shadowTokens = [
  { name: "card", value: "6px 6px 50px rgba(0, 0, 0, 0.05)" },
  {
    name: "avatar",
    value: "0 1px 2px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.1)",
  },
];

/* ===== Section Components ===== */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-heading-sm text-content-primary mb-4">{children}</h3>
  );
}

function ColorSection() {
  return (
    <div className="space-y-6">
      <SectionTitle>Colors</SectionTitle>
      {colorGroups.map((group) => (
        <div key={group.label}>
          <h4 className="text-body-sm font-medium text-content-secondary mb-3">
            {group.label}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {group.tokens.map((token) => (
              <div
                key={token.cssVar}
                className="flex items-center gap-3 p-2 rounded-lg border border-border-subtle"
              >
                <div
                  className="w-10 h-10 rounded-md border border-border-default shrink-0"
                  style={{ backgroundColor: token.value }}
                />
                <div className="min-w-0">
                  <p className="text-caption font-medium text-content-primary truncate">
                    {token.name}
                  </p>
                  <p className="text-[10px] text-content-tertiary font-mono truncate">
                    {token.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TypographySection() {
  return (
    <div>
      <SectionTitle>Typography</SectionTitle>
      <div className="space-y-4">
        {typographyTokens.map((token) => (
          <div
            key={token.name}
            className="flex items-baseline gap-4 p-3 rounded-lg border border-border-subtle"
          >
            <div className="w-28 shrink-0">
              <p className="text-caption font-medium text-content-primary">
                {token.name}
              </p>
              <p className="text-[10px] text-content-tertiary font-mono">
                {token.size}/{token.weight}
              </p>
            </div>
            <p
              style={{
                fontSize: token.size,
                lineHeight: token.lineHeight,
                fontWeight: Number(token.weight),
              }}
              className="text-content-primary"
            >
              The quick brown fox jumps
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpacingSection() {
  const maxPx = 36;

  return (
    <div>
      <SectionTitle>Spacing</SectionTitle>
      <div className="space-y-2">
        {spacingTokens.map((token) => {
          const px = parseInt(token.value);
          const widthPercent = (px / maxPx) * 100;
          return (
            <div key={token.name} className="flex items-center gap-3">
              <code className="w-10 text-right text-caption text-content-tertiary font-mono">
                {token.name}
              </code>
              <div className="flex-1 h-6 flex items-center">
                <div
                  className="h-full rounded-sm bg-info-bg border border-info-border"
                  style={{ width: `${widthPercent}%`, minWidth: "4px" }}
                />
              </div>
              <span className="w-12 text-caption text-content-secondary tabular-nums">
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
      <SectionTitle>Border Radii</SectionTitle>
      <div className="flex flex-wrap gap-4">
        {radiusTokens.map((token) => (
          <div key={token.name} className="flex flex-col items-center gap-2">
            <div
              className="w-16 h-16 bg-surface-subtle border-2 border-content-primary"
              style={{ borderRadius: token.value }}
            />
            <div className="text-center">
              <p className="text-caption font-medium text-content-primary">
                {token.name}
              </p>
              <p className="text-[10px] text-content-tertiary font-mono">
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
              className="w-32 h-20 rounded-2xl bg-surface-primary border border-border-default"
              style={{ boxShadow: token.value }}
            />
            <div className="text-center">
              <p className="text-caption font-medium text-content-primary">
                {token.name}
              </p>
              <p className="text-[10px] text-content-tertiary font-mono max-w-[160px] truncate">
                {token.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== Main Component ===== */

export default function TokenInspector() {
  return (
    <div className="space-y-10">
      <ColorSection />
      <TypographySection />
      <SpacingSection />
      <RadiusSection />
      <ShadowSection />
    </div>
  );
}
