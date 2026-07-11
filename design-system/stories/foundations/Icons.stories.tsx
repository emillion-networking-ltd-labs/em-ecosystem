import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  Search,
  Bell,
  Settings,
  User,
  Check,
  ArrowRight,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Group } from "./_helpers";
import { ICON_SIZES, type IconSize } from "@/components/ui/Icon";

// Foundations/Icons — the icon convention: the set (lucide-react), how we size and colour them, and the three
// presentations (ghost / boxed / pressed) inspired by the ButtonIcon primitive. Documents the catalog; registers nothing.
const meta = {
  title: "Foundations/Icons",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Code({ children }: { children: string }) {
  return (
    <code className="rounded bg-surface-secondary px-1.5 py-0.5 text-caption font-mono text-content-primary">
      {children}
    </code>
  );
}

function Caption({ children }: { children: string }) {
  return (
    <span className="text-caption font-mono text-content-secondary">
      {children}
    </span>
  );
}

const SAMPLE: LucideIcon[] = [
  Search,
  Bell,
  Settings,
  User,
  Check,
  ArrowRight,
  ShieldCheck,
  Zap,
];

type IconStyle = "ghost" | "boxed" | "pressed";

// The three icon-button STYLES as STATIC icons (not interactive — no hover, no cursor). The resting look of the
// ButtonIcon `default` / `boxed` / `boxed`+aria-pressed variants:
//   ghost   → bare glyph at 50% (the `default` variant rest)
//   boxed   → glyph on a light surface (`bg-surface-tertiary`), with a transparent border so it matches the
//             pressed box size
//   pressed → boxed + the border in `border-strong` (the ButtonIcon pressed ring colour; focus ring is the
//             mandatory `border-components`). Rendered as a
//             real border (not a Tailwind ring) so it actually paints on the static icon.
const STYLE: Record<IconStyle, string> = {
  ghost: "text-content-primary/50",
  boxed: "bg-surface-tertiary text-content-primary border border-transparent",
  pressed:
    "bg-surface-tertiary text-content-primary border border-border-strong",
};

function Row({ style }: { style: IconStyle }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {SAMPLE.map((Icon, i) => (
        <span
          key={i}
          className={`inline-flex items-center justify-center rounded-md p-2 ${STYLE[style]}`}
        >
          <Icon size={16} />
        </span>
      ))}
    </div>
  );
}

export const Icons: Story = {
  render: () => (
    <div className="mx-auto max-w-3xl px-6 py-10 text-content-primary">
      <h1 className="text-display-3 font-display font-bold">Icons</h1>
      <p className="mt-3 max-w-2xl text-body text-content-secondary">
        The icon set is <Code>lucide-react</Code> — import each glyph directly:{" "}
        <Code>{`import { Search } from "lucide-react"`}</Code>. Icons inherit{" "}
        <Code>currentColor</Code>, so colour them with <Code>content-*</Code>{" "}
        tokens (never a hex). Size comes from the REGISTERED scale below via the{" "}
        <Code>Icon</Code> primitive (
        <Code>{`<Icon icon={Search} size="md" />`}</Code>) — never a hand-typed{" "}
        <Code>px</Code>. <Code>md</Code> (16px) is the default.
      </p>

      <Group
        title="Sizes"
        description="The REGISTERED scale — the single source (ICON_SIZES). Semantic names, not hand-typed px; `<Icon size='md'>` applies it. Changing a value here propagates to every Icon. md (16) is the default."
      >
        <div className="flex flex-wrap items-end gap-8">
          {(Object.entries(ICON_SIZES) as [IconSize, number][]).map(
            ([name, px]) => (
              <div key={name} className="flex flex-col items-center gap-2">
                <Search size={px} />
                <Caption>{`${name} · ${px}px${name === "md" ? " (default)" : ""}`}</Caption>
              </div>
            ),
          )}
        </div>
      </Group>

      <Group
        title="Ghost"
        description="Bare glyph on a content token — the default presentation (the ButtonIcon `default` style)."
      >
        <Row style="ghost" />
      </Group>

      <Group
        title="Boxed"
        description="The same glyphs on a surface — the boxed style."
      >
        <Row style="boxed" />
      </Group>

      <Group
        title="Pressed"
        description="The boxed style in its active/pressed state — marked by a border in the ButtonIcon pressed colour (border-strong)."
      >
        <Row style="pressed" />
      </Group>

      <Group
        title="Containers"
        description="Don't hand-roll an icon surface — these registered primitives (in the Primitives section) wrap an icon for you. The styles above are static previews of them."
      >
        <ul className="ml-5 list-disc space-y-2 text-body text-content-secondary">
          <li>
            <Code>ButtonIcon</Code> — an <strong>interactive</strong> icon
            button. Its variants are the ghost / boxed states above, plus the
            pressed state; sizes sm / md. Use it for clickable actions.
          </li>
          <li>
            <Code>BadgeIcon</Code> — a <strong>non-interactive</strong> icon in
            a tinted box, for status / feature marks; sizes sm / md / lg (32 /
            40 / 56px).
          </li>
        </ul>
      </Group>
    </div>
  ),
};
