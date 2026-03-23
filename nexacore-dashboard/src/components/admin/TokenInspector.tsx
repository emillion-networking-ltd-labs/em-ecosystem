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
    label: "Surface (auth verified)",
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
    label: "Content (auth verified)",
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
    label: "Border & Outline (auth verified)",
    tokens: [
      {
        name: "strong (8%)",
        value: "rgba(0,0,0,0.08)",
        cssVar: "--border-strong",
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
    label: "Error (auth verified)",
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
    label: "Success (auth verified)",
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
    label: "Content (not in auth)",
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
    label: "Border (not in auth)",
    tokens: [
      {
        name: "default (5%)",
        value: "rgba(0,0,0,0.05)",
        cssVar: "--border-default",
      },
      {
        name: "subtle (3%)",
        value: "rgba(0,0,0,0.03)",
        cssVar: "--border-subtle",
      },
    ],
  },
  {
    label: "Semantic borders (not in auth)",
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
    label: "Interactive & Accent (not in auth)",
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
    label: "Dashboard (not in auth)",
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
    desc: "text-2xl font-semibold",
    size: "24px",
    lineHeight: "36px",
    weight: 600,
    mono: false,
  },
  {
    name: "button",
    desc: "text-base font-normal",
    size: "16px",
    lineHeight: "normal",
    weight: 500,
    mono: false,
  },
  {
    name: "label",
    desc: "text-[15px] font-semibold",
    size: "15px",
    lineHeight: "22px",
    weight: 600,
    mono: false,
  },
  {
    name: "input",
    desc: "text-[15px] font-normal",
    size: "15px",
    lineHeight: "24px",
    weight: 400,
    mono: false,
  },
  {
    name: "link",
    desc: "text-sm font-normal",
    size: "14px",
    lineHeight: "21px",
    weight: 500,
    mono: false,
  },
  {
    name: "error / desc",
    desc: "text-xs",
    size: "12px",
    lineHeight: "24px",
    weight: 400,
    mono: false,
  },
  {
    name: "toast title",
    desc: "text-xs font-semibold",
    size: "12px",
    lineHeight: "1.25",
    weight: 600,
    mono: false,
  },
  {
    name: "technical",
    desc: "font-mono text-xs",
    size: "12px",
    lineHeight: "normal",
    weight: 400,
    mono: true,
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
  { name: "md (buttons, inputs)", value: "6px" },
  { name: "lg (input container)", value: "8px" },
  { name: "3xl (cards, dropdowns)", value: "24px" },
  { name: "full (pills, avatars)", value: "9999px" },
];

const shadowTokens = [
  { name: "card / dropdown", value: "0 8px 32px rgba(0, 0, 0, 0.04)" },
];

/* ===== Section Components ===== */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-heading-sm text-content-primary mb-4">{children}</h3>
  );
}

function ColorGrid({ groups }: { groups: ColorGroup[] }) {
  return (
    <>
      {groups.map((group) => (
        <div key={group.label}>
          <h4 className="text-body-sm font-normal text-content-secondary mb-3">
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
                  <p className="text-[10px] text-content-primary/50 font-mono truncate">
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
      <SectionTitle>Colors — Auth Verified</SectionTitle>
      <ColorGrid groups={colorGroups} />

      <div className="border-t border-border-strong pt-6">
        <SectionTitle>Colors — Available (not in auth)</SectionTitle>
        <div className="opacity-60">
          <ColorGrid groups={unusedColorGroups} />
        </div>
      </div>
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
            className="flex items-baseline gap-4 p-3 rounded-lg border border-border-strong"
          >
            <div className="w-32 shrink-0">
              <p className="text-caption font-normal text-content-primary">
                {token.name}
              </p>
              <p className="text-[10px] text-content-primary/50 font-mono">
                {token.desc}
              </p>
            </div>
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
          </div>
        ))}
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
      <SectionTitle>Border Radii</SectionTitle>
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
              <p className="text-[10px] text-content-primary/50 font-mono">
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
              <p className="text-[10px] text-content-primary/50 font-mono max-w-[200px]">
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
