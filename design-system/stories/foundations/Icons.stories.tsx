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
import Icon, { ICON_SIZES, type IconSize } from "@/components/ui/Icon";
import IconButton from "@/components/ui/IconButton";
import IconBadge from "@/components/ui/IconBadge";

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
        title="Bare icon"
        description="Just the glyph via `<Icon>`. Colour inherits (currentColor → content-*). The atomic form — add a container only when you need a surface."
      >
        <div className="flex flex-wrap items-center gap-4 text-content-primary">
          {SAMPLE.map((glyph, i) => (
            <Icon key={i} icon={glyph} size="md" />
          ))}
        </div>
      </Group>

      <Group
        title="In a container — button vs label"
        description="Don't hand-roll an icon surface: pick by PURPOSE, not by look. These are the REAL registered primitives (Simple section), each wrapping an `<Icon>`."
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-40 text-caption font-mono text-content-secondary">
              IconButton — a BUTTON
            </span>
            <IconButton
              variant="default"
              icon={Settings}
              aria-label="Settings"
            />
            <IconButton
              variant="boxed"
              icon={Bell}
              aria-label="Notifications"
            />
            <IconButton
              variant="boxed"
              aria-pressed="true"
              icon={Check}
              aria-label="Active"
            />
            <Caption>interactive · clickable actions</Caption>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-40 text-caption font-mono text-content-secondary">
              BadgeIcon — a LABEL
            </span>
            <IconBadge variant="default" icon={User} />
            <IconBadge variant="success" icon={ShieldCheck} />
            <IconBadge variant="error" icon={Zap} />
            <Caption>non-interactive · status / feature marks</Caption>
          </div>
        </div>
      </Group>
    </div>
  ),
};
